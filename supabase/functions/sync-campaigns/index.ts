// pg_cron(1일 1회) 또는 프론트 "지금 동기화"가 invoke. 연결된 모든 계정의 캠페인 목록을
// 가져와 campaigns 테이블에 넣는다(external_campaign_id 기준). 05-api-integration.md
// "왜 웹훅이 아니라 폴링인가" 참고 — 두 플랫폼 다 캠페인 변경 웹훅을 제공하지 않는다.
//
// 이미 있는 캠페인은 이름만 갱신한다. 기간/타겟/목표/예산은 사용자가 화면에서 채우고
// 다듬는 값이라, 매일 도는 동기화가 덮어쓰면 손으로 넣은 정보가 조용히 날아간다.
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

/** 페이지네이션 상한. 응답이 잘못돼도 무한 루프에 빠지지 않게 하는 안전장치다. */
const MAX_PAGES = 50;

/**
 * 플랫폼 조회 결과. 실패를 errorMessage로 돌려주는 게 핵심이다 —
 * 예전에는 콘솔에만 찍고 빈 배열을 반환해서, 토큰이 만료돼도 응답은 200 성공이고
 * 데이터만 0건이 됐다. 그러면 아무도 고장 난 걸 모른다.
 */
type FetchResult = { items: any[]; errorMessage: string | null };

/** stores에서 읽어온 매장 목록. 캠페인 이름의 접두사·본문을 여기에 맞춰본다. */
type StoreIndex = {
  byId: Set<string>;
  byRegion: Map<string, string[]>;
  /** [매장명(소문자), 매장 id] — 이름에 매장 코드 없이 매장명만 쓴 캠페인용 */
  byName: [string, string][];
};

/**
 * 한 매장의 오프닝을 이루는 단계 이름들. 이 단어가 들어 있으면 그 캠페인은
 * 독립 이벤트가 아니라 오프닝 시리즈의 한 단계다(02-ux-flow.md 데이터 모델의
 * campaignGroup 설명: ComingSoon/NowOpen/GrandOpening/1MonthDeals 4단계를 하나로 묶는다).
 */
const OPENING_PHASE = /coming\s*soon|now\s*open|nowopen|grand'?s?\s*opening|grandopening|month\s*deals|monthdeals/i;

/** 이름 조각이 기간 표기인지. "0710~0831" / "0402_0410" / "0325" 형태. */
function isDateToken(token: string) {
  return /^\d{4}([~_-]\d{4})?$/.test(token);
}

/**
 * 캠페인 이름이 가리키는 매장을 찾는다.
 * 접두사 코드(G10_, BF4_)를 먼저 보고, 없으면 본문에서 매장명을 찾는다 —
 * "Beauty Master Florida Mall Now Open"처럼 코드 없이 매장명만 쓴 캠페인이 실제로 있다.
 * 매장명은 긴 것부터 맞춰 "Florida Mall"이 "Mall"에 밀리지 않게 한다.
 */
function resolveStoreId(name: string, stores: StoreIndex) {
  const prefix = name.split('_')[0]?.trim() ?? '';
  if (stores.byId.has(prefix)) return prefix;

  // 코드가 접두사가 아니라 이름 중간에 오기도 한다 — Meta 쪽에 "Reach_BF2_2MonthsDeals"
  // 같은 이름이 실제로 있다. 앞뒤가 영숫자가 아닐 때만 인정해 "BF2"가 다른 단어의
  // 일부로 우연히 걸리는 것을 막는다.
  for (const storeId of stores.byId) {
    if (new RegExp(`(^|[^A-Za-z0-9])${storeId}([^A-Za-z0-9]|$)`, 'i').test(name)) return storeId;
  }

  const lower = name.toLowerCase();
  for (const [storeName, storeId] of stores.byName) {
    if (storeName.length >= 4 && lower.includes(storeName)) return storeId;
  }
  return null;
}

/**
 * 전부 소문자이거나 전부 대문자인 문자열만 Title Case로 바꾼다.
 * "labor day"와 "Labor Day"가 서로 다른 이벤트로 갈라지는 걸 막으면서,
 * "WorldCup2026"처럼 의도적으로 섞어 쓴 표기는 그대로 둔다.
 */
function normalizeCase(value: string) {
  const isUniform = value === value.toLowerCase() || value === value.toUpperCase();
  if (!isUniform) return value;
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
}

/**
 * 캠페인을 묶을 이벤트 이름을 정한다. campaigns.campaign_group에 들어간다.
 *
 * 규칙 1) 매장이 특정되고 오프닝 단계 이름이면 "{매장코드} Opening" —
 *   한 매장의 ComingSoon~1MonthDeals가 하나의 이벤트가 된다.
 * 규칙 2) 그 외에는 이름에서 매장/지역 접두사·기간·회차 접미사를 떼고 남은 것을 쓴다.
 *   "Labor Day FL"과 "labor day GA"가 같은 "Labor Day"로 모이도록 대소문자를 정규화한다.
 *
 * 아무것도 못 뽑으면 null을 돌려준다 — 그러면 campaignGroupKey()가 이름을 그대로
 * 그룹 키로 쓴다(그 캠페인만 단독 이벤트). 억지로 만들어 붙이지 않는다.
 */
function resolveEventGroup(name: string, stores: StoreIndex) {
  const storeId = resolveStoreId(name, stores);
  if (storeId && OPENING_PHASE.test(name)) return `${storeId} Opening`;

  const parts = name.split('_').map((p) => p.trim()).filter(Boolean);
  const kept = parts.filter((part, index) => {
    if (index === 0 && (stores.byId.has(part) || stores.byRegion.has(part.toUpperCase()))) return false;
    if (index === 0 && part.toUpperCase() === 'ALLSTORES') return false;
    if (isDateToken(part)) return false;
    if (/^\d{1,2}$/.test(part)) return false; // "_2" 같은 회차 접미사
    return true;
  });

  // 지역 접미사를 뗀다 — "Labor Day FL"/"labor day GA"는 같은 이벤트다.
  const base = kept.join(' ').replace(/\s+(FL|GA|ALL)$/i, '').replace(/\s+/g, ' ').trim();
  return base ? normalizeCase(base) : null;
}

/**
 * 캠페인 이름 접두사로 대상 매장을 정한다. 이 계정은 "G10_...", "BF2_...",
 * "GA_...", "AllStores_..." 규칙을 쓴다.
 *
 * 정확히 일치할 때만 매장을 붙인다 — 접두사가 stores에 없는 값이면 추측하지 않고
 * all_stores로 둔다. 비슷한 이름에 억지로 맞추면 성과가 조용히 엉뚱한 매장에 귀속되고,
 * 그건 빈 값보다 나쁘다(사용자가 틀린 걸 알아채지 못한다).
 */
function resolveTarget(name: string, stores: StoreIndex) {
  // 접두사 코드와 본문 매장명을 모두 본다 — "Beauty Master Florida Mall Now Open"처럼
  // 코드 없이 매장명만 쓴 캠페인이 실제로 있고, 그동안 전부 all_stores로 떨어졌다.
  const storeId = resolveStoreId(name, stores);
  if (storeId) {
    return { target_scope: 'single_store', target_store_ids: [storeId] };
  }

  /* 지역 표기는 앞("GA_Labor Day")에도 뒤("Labor Day FL")에도 온다. 예전엔 접두사만
     봐서 뒤에 붙은 쪽을 통째로 놓쳤다 — 같은 파일의 resolveEventGroup은 이미
     접미사를 알고 이벤트 이름에서 떼어내고 있었는데(그래서 "Labor Day FL"과
     "labor day GA"가 나란히 Labor Day 그룹으로 묶였다), 정작 매장 배정에는 그
     지식을 안 썼다. 같은 규칙을 양쪽에서 쓴다. */
  const prefix = name.split('_')[0]?.trim() ?? '';
  const suffix = name.trim().match(/\s(FL|GA|ALL)$/i)?.[1] ?? '';
  for (const token of [prefix, suffix]) {
    if (!token) continue;
    const regionStores = stores.byRegion.get(token.toUpperCase());
    if (regionStores && regionStores.length > 0) {
      return { target_scope: 'multi_store', target_store_ids: regionStores };
    }
  }

  return { target_scope: 'all_stores', target_store_ids: [] };
}

/** campaigns에 넣을 행. NOT NULL 컬럼이 하나라도 빠지면 insert가 통째로 실패한다. */
type CampaignRow = {
  owner_id: string;
  platform: string;
  account_id: string;
  external_campaign_id: string;
  name: string;
  campaign_group: string | null;
  target_scope: string;
  target_store_ids: string[];
  start_date: string;
  end_date: string;
  budget_planned: number;
  budget_daily: number | null;
  goal: string;
  thumbnail_url: string | null;
};

function toISODate(value: Date) {
  return value.toISOString().slice(0, 10);
}

/**
 * 캠페인 이름에서 기간을 읽는다. 이 계정의 명명 규칙이 "..._MMDD~MMDD" 형태로
 * 일관돼 있어(예: "G10_1_Month Deals_0710~0831") 날짜를 지어내는 대신 여기서 얻는다.
 * 구분자로 ~ 대신 -를 쓴 것도 있고 뒤에 "_2" 같은 접미사가 붙기도 한다.
 *
 * 연도는 플랫폼이 준 생성 시각에서 가져온다. 끝이 시작보다 앞서면 해를 넘긴 것으로 본다.
 */
function parseRangeFromName(name: string, createdAt: Date) {
  // 구분자가 ~ / - / _ 셋 다 실제로 쓰인다(0710~0831, 0625-0709, 0414_0602).
  // 아래 월/일 검증이 있어서 "2024_2025" 같은 우연한 4자리 쌍은 걸러진다.
  const match = name.match(/(\d{2})(\d{2})\s*[~\-_]\s*(\d{2})(\d{2})/);
  if (!match) return null;

  const [, startMonth, startDay, endMonth, endDay] = match;
  const year = createdAt.getUTCFullYear();
  const start = new Date(Date.UTC(year, Number(startMonth) - 1, Number(startDay)));
  const end = new Date(Date.UTC(year, Number(endMonth) - 1, Number(endDay)));

  // 월/일이 실제로 존재하는지 확인한다 — "1231~1345" 같은 문자열이 조용히 통과하면 안 된다.
  if (start.getUTCMonth() !== Number(startMonth) - 1 || end.getUTCMonth() !== Number(endMonth) - 1) {
    return null;
  }
  if (end < start) end.setUTCFullYear(year + 1);

  return { startDate: toISODate(start), endDate: toISODate(end) };
}

/**
 * 이름에서 기간을 못 읽었을 때의 대체값.
 *
 * 아직 돌고 있는 캠페인이면 끝을 오늘로 둔다 — 미래로 지어내면 남은 기간이 거짓이 되고,
 * 하루짜리로 두면 종료된 것으로 보여 성과 동기화 대상에서 아예 빠진다.
 *
 * 이미 꺼진 캠페인이면 마지막 수정 시각을 끝으로 쓴다. 여기서 오늘을 넣으면 2024년에
 * 끝난 캠페인이 대시보드에 "진행중"으로 몇 년째 떠 있게 된다 — 실제로 Labor Day GA/FL이
 * 2024-08 시작에 종료일 오늘로 들어와 있었다. 정확한 종료일은 플랫폼이 캠페인 레벨에서
 * 주지 않으므로(광고그룹 스케줄에 있다) 마지막 수정 시각이 얻을 수 있는 가장 가까운 근사다.
 *
 * @param {Date} createdAt - 플랫폼이 준 생성 시각
 * @param {boolean} isRunning - 아직 켜져 있는지
 * @param {Date} [lastModifiedAt] - 마지막 수정 시각(꺼진 캠페인의 종료일 근사)
 */
function fallbackRange(createdAt: Date, isRunning: boolean, lastModifiedAt?: Date) {
  const today = toISODate(new Date());
  const created = toISODate(createdAt);
  const startDate = created <= today ? created : today;

  if (isRunning || !lastModifiedAt) return { startDate, endDate: today };

  const modified = toISODate(lastModifiedAt);
  return { startDate, endDate: modified < startDate ? startDate : modified };
}

// ============================================================
// Meta
// ============================================================

/**
 * 페이지를 끝까지 따라간다. Meta는 응답의 paging.next에 다음 페이지 URL을 통째로 준다.
 * 한 페이지만 읽으면 계정에 캠페인이 많을 때 뒤쪽이 조용히 사라진다.
 */
async function fetchMetaCampaigns(accessToken: string, externalAccountId: string): Promise<FetchResult> {
  // daily_budget을 함께 받는다. 예전엔 lifetime_budget만 요청해서, 일일 예산으로
  // 돌리는 캠페인(Meta에서 흔한 설정)은 lifetime이 비어 있어 예산이 0으로 저장됐다 —
  // 화면의 예산 칸이 통째로 '—'로 뜨는 원인이었다(실데이터 확인).
  const fields = 'id,name,status,objective,start_time,stop_time,created_time,updated_time,lifetime_budget,daily_budget';
  let url: string | null =
    `https://graph.facebook.com/v19.0/act_${externalAccountId}/campaigns?fields=${fields}&limit=200&access_token=${accessToken}`;
  const all: any[] = [];

  // 응답이 잘못돼 next가 계속 나오는 상황에서도 무한히 돌지 않도록 상한을 둔다.
  for (let page = 0; url && page < MAX_PAGES; page += 1) {
    const res: Response = await fetch(url);
    // 명시적으로 any를 준다 — url의 타입이 json에서, json이 url에서 유도돼
    // TS가 순환으로 판단하고 추론을 포기한다(TS7022).
    const json: any = await res.json();
    if (json?.error) {
      console.error('Meta campaigns 조회 실패', json.error);
      return { items: all, errorMessage: `Meta campaigns 조회 실패 — ${json.error.message}` };
    }
    all.push(...(json.data ?? []));
    url = json.paging?.next ?? null;
  }
  return { items: all, errorMessage: null };
}

/**
 * 캠페인별 소재 썸네일을 계정 단위로 한 번에 읽는다.
 *
 * 왜 필요한가: 화면의 캠페인 목록은 소재 썸네일로 캠페인을 구분하는데, 실계정
 * 170건 중 썸네일이 있는 건 2건(사람이 직접 올린 것)뿐이었다. 이름이
 * "G10_Now Open_0706~0831"과 "G10_Grand Opening _0706 ~ 0801"처럼 서로 거의
 * 같아서 글자로 구분하는 비용이 큰데, 정작 가장 빠른 단서인 소재 이미지가
 * 비어 있었다.
 *
 * 왜 캠페인 단위가 아니라 계정 단위로 읽는가: 캠페인마다 광고를 따로 조회하면
 * 139건 × 2회 = 278회가 된다. 계정의 /ads를 한 번 페이지네이션하면 응답에
 * campaign_id가 같이 오므로 호출 한 세트로 끝난다.
 *
 * 크기 지정이 까다롭다: 최상위 쿼리 파라미터로 thumbnail_width를 줘도 중첩
 * 확장(creative{...})에는 안 먹어서 64x64가 온다. 필드 자체에 파라미터를 붙인
 * `creative.thumbnail_width(320).thumbnail_height(320){thumbnail_url}` 형태여야
 * 320x320이 온다(실측으로 확인 — 64px짜리를 48px 타일에 쓰면 2배 화면에서
 * 뭉갠다).
 *
 * 캠페인 하나에 광고가 여러 개면 먼저 만난 것을 쓴다. "그 캠페인의 대표 소재"가
 * 하나로 정해지지 않는 건 creative_url을 채우지 않기로 한 것과 같은 사정인데,
 * 링크와 썸네일은 성격이 다르다 — 틀린 링크는 사람을 엉뚱한 곳으로 보내지만,
 * 같은 캠페인의 아무 소재나 보여주는 건 "이게 뭐였지"를 떠올리는 데 그대로
 * 쓸모가 있다.
 *
 * 실패해도 errorMessage를 남기지 않는다 — 썸네일은 부가 정보라, 이것 때문에
 * 동기화 전체가 "실패"로 표시되면 예산·성과가 멀쩡히 들어왔는데도 사용자가
 * 잘못된 신호를 받는다.
 */
async function fetchMetaThumbnails(accessToken: string, externalAccountId: string): Promise<Map<string, string>> {
  const byCampaign = new Map<string, string>();
  const fields = 'campaign_id,creative.thumbnail_width(320).thumbnail_height(320){thumbnail_url}';
  let url: string | null =
    `https://graph.facebook.com/v19.0/act_${externalAccountId}/ads?fields=${fields}&limit=200&access_token=${accessToken}`;

  for (let page = 0; url && page < MAX_PAGES; page += 1) {
    const res: Response = await fetch(url);
    const json: any = await res.json();
    if (json?.error) {
      console.error('Meta 썸네일 조회 실패(무시하고 계속)', json.error);
      return byCampaign;
    }
    for (const ad of json.data ?? []) {
      const thumb = ad?.creative?.thumbnail_url;
      const campaignId = ad?.campaign_id != null ? String(ad.campaign_id) : null;
      // 먼저 만난 광고의 소재를 쓴다 — 이후 광고로 덮지 않는다.
      if (thumb && campaignId && !byCampaign.has(campaignId)) byCampaign.set(campaignId, thumb);
    }
    url = json.paging?.next ?? null;
  }
  return byCampaign;
}

/** Meta objective → 우리 goal enum. 모르는 값은 traffic으로 둔다(가장 중립적). */
function mapMetaGoal(objective: string | undefined) {
  switch (objective) {
    case 'OUTCOME_AWARENESS':
    case 'BRAND_AWARENESS':
    case 'REACH':
      return 'awareness';
    case 'OUTCOME_ENGAGEMENT':
    case 'POST_ENGAGEMENT':
    case 'VIDEO_VIEWS':
      return 'engagement';
    case 'OUTCOME_SALES':
    case 'CONVERSIONS':
      return 'conversion';
    case 'STORE_VISITS':
    case 'OUTCOME_STORE_VISITS':
      return 'store_visit';
    default:
      return 'traffic';
  }
}

function mapMetaCampaign(
  item: any,
  base: Pick<CampaignRow, 'owner_id' | 'platform' | 'account_id'>,
  stores: StoreIndex,
  thumbnails?: Map<string, string>,
): CampaignRow {
  const createdAt = new Date(item.created_time ?? Date.now());
  // Meta의 status는 ACTIVE/PAUSED/ARCHIVED/DELETED.
  const fallback = fallbackRange(createdAt, item.status === 'ACTIVE', new Date(item.updated_time ?? item.created_time ?? Date.now()));
  // Meta는 캠페인에 기간이 있으므로 이름을 파싱할 필요가 없다.
  const startDate = item.start_time ? item.start_time.slice(0, 10) : fallback.startDate;
  const endDate = item.stop_time ? item.stop_time.slice(0, 10) : fallback.endDate;

  return {
    ...base,
    external_campaign_id: String(item.id),
    name: item.name,
    campaign_group: resolveEventGroup(item.name ?? '', stores),
    ...resolveTarget(item.name ?? '', stores),
    start_date: startDate,
    end_date: endDate < startDate ? startDate : endDate,
    // Meta는 금액을 최소 화폐 단위(센트)로 준다. 두 예산은 서로 대체재가 아니라
    // 설정 방식이 다른 값이라 각자 자리에 넣는다 — 캠페인은 둘 중 하나만 갖는다.
    budget_planned: Number(item.lifetime_budget ?? 0) / 100,
    budget_daily: item.daily_budget != null ? Number(item.daily_budget) / 100 : null,
    goal: mapMetaGoal(item.objective),
    thumbnail_url: thumbnails?.get(String(item.id)) ?? null,
  };
}

// ============================================================
// TikTok
// ============================================================

/**
 * 페이지를 끝까지 따라간다. TikTok은 page_size를 안 주면 기본 10건만 준다 —
 * 이 계정은 캠페인이 31개인데 10개만 들어와 21개가 조용히 누락됐던 적이 있다.
 * page_size 최대는 1000이고, 그래도 남으면 page를 올려 계속 읽는다.
 */
async function fetchTikTokCampaigns(accessToken: string, advertiserId: string): Promise<FetchResult> {
  const all: any[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL('https://business-api.tiktok.com/open_api/v1.3/campaign/get/');
    url.searchParams.set('advertiser_id', advertiserId);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', '1000');

    const res = await fetch(url.toString(), { headers: { 'Access-Token': accessToken } });
    const json = await res.json();

    // TikTok은 HTTP 200에 body의 code로 실패를 알린다 — res.ok만 보면 에러를 놓친다.
    if (json?.code !== 0) {
      console.error('TikTok campaign/get 실패', { page, code: json?.code, message: json?.message });
      return { items: all, errorMessage: `TikTok campaign/get 실패 (code ${json?.code}) — ${json?.message}` };
    }

    all.push(...(json?.data?.list ?? []));

    const totalPage = json?.data?.page_info?.total_page ?? 1;
    if (page >= totalPage) break;
  }
  return { items: all, errorMessage: null };
}


/**
 * 광고그룹 예산을 캠페인별로 합산한다.
 *
 * TikTok은 캠페인 레벨을 BUDGET_MODE_INFINITE로 두고 **실제 예산을 광고그룹에
 * 거는 게 일반적**이다. 이 계정이 정확히 그렇다 — 동기화 후 확인해 보니 TikTok
 * 캠페인 31건 중 캠페인 레벨 일일 예산을 가진 건 0건이었다. 캠페인만 읽으면
 * 예산 칸이 영원히 비므로 한 단계 아래를 한 번 더 읽는다.
 *
 * 모드별로 따로 더한다 — 일일과 총액은 단위가 달라서 섞으면 뜻이 사라진다.
 * 삭제된 광고그룹은 뺀다: 지난 예산이 현재 계획에 합산되면 실제보다 크게 보인다.
 *
 * @returns campaign_id → { daily, total }. 값이 없는 쪽은 null.
 */
async function fetchTikTokAdGroupBudgets(
  accessToken: string,
  advertiserId: string
): Promise<{ byCampaign: Map<string, { daily: number | null; total: number | null }>; errorMessage: string | null }> {
  const byCampaign = new Map<string, { daily: number | null; total: number | null }>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL('https://business-api.tiktok.com/open_api/v1.3/adgroup/get/');
    url.searchParams.set('advertiser_id', advertiserId);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', '1000');

    const res = await fetch(url.toString(), { headers: { 'Access-Token': accessToken } });
    const json = await res.json();

    if (json?.code !== 0) {
      // 캠페인은 이미 받아온 상태다 — 여기서 실패해도 동기화를 통째로 접지 않고
      // "예산만 못 채운" 상태로 진행한다(부분 성공이 전체 실패보다 낫다).
      console.error('TikTok adgroup/get 실패', { page, code: json?.code, message: json?.message });

      /* 40001(권한 부족)은 "고장"이 아니라 "아직 허용되지 않은 기능"이다.
         이걸 errors에 넣으면 함수가 207을 돌려주고, check_sync_runs()가 207을
         실패로 기록해(00000000000009 마이그레이션) 설정 화면 경고와 대시보드
         "Sync failed" 배지가 매일 뜬다 — TikTok 스코프 심사가 끝날 때까지
         며칠간 계속. 실제로 실패한 건 없고 캠페인은 정상 저장된다.
         승인되면 같은 코드가 그대로 값을 채우기 시작하므로 켜고 끄는 설정도
         필요 없다. 다른 코드(네트워크·레이트리밋 등)는 진짜 실패라 그대로 올린다. */
      if (json?.code === 40001) {
        return { byCampaign, errorMessage: null };
      }
      return { byCampaign, errorMessage: `TikTok adgroup/get 실패 (code ${json?.code}) — ${json?.message}` };
    }

    for (const ag of json?.data?.list ?? []) {
      const status = String(ag?.secondary_status ?? ag?.operation_status ?? '');
      if (status.includes('DELETE')) continue;

      const campaignId = String(ag?.campaign_id ?? '');
      const amount = Number(ag?.budget ?? 0);
      if (!campaignId || !amount) continue;

      const acc = byCampaign.get(campaignId) ?? { daily: null, total: null };
      if (isDailyBudgetMode(ag?.budget_mode)) acc.daily = (acc.daily ?? 0) + amount;
      else if (ag?.budget_mode === 'BUDGET_MODE_TOTAL') acc.total = (acc.total ?? 0) + amount;
      byCampaign.set(campaignId, acc);
    }

    const totalPage = json?.data?.page_info?.total_page ?? 1;
    if (page >= totalPage) break;
  }
  return { byCampaign, errorMessage: null };
}

/** TikTok objective → 우리 goal enum. 모르는 값은 traffic으로 둔다. */
function mapTikTokGoal(objective: string | undefined) {
  switch (objective) {
    case 'REACH':
      return 'awareness';
    case 'VIDEO_VIEWS':
    case 'ENGAGEMENT':
      return 'engagement';
    case 'CONVERSIONS':
    case 'PRODUCT_SALES':
      return 'conversion';
    default:
      return 'traffic';
  }
}

/**
 * TikTok 예산을 모드에 맞는 칸으로 보낸다.
 *
 * budget 하나에 budget_mode가 따로 오는 구조라, 모드를 보지 않으면 일일 예산이
 * 총 예산으로 저장된다("하루 5만원"이 "총 5만원"이 되어 pacing 계산까지 틀어진다).
 * INFINITE(또는 0)는 캠페인 레벨에 예산이 없다는 뜻이고, 그 계정은 대개 광고그룹에
 * 예산을 걸어둔다 — 여기서는 값이 없다고만 기록하고 추측하지 않는다.
 */
/**
 * 이 budget_mode가 "하루치 금액"을 뜻하는가.
 *
 * 예전엔 BUDGET_MODE_DAY만 일일로 봤고 나머지는 전부 총액으로 떨어뜨렸다. 그런데
 * 이 계정이 실제로 쓰는 값은 **BUDGET_MODE_DYNAMIC_DAILY_BUDGET**이다(캠페인 31건
 * 중 14건, 광고그룹 34건 중 17건). 이름 그대로 일일 예산인데(날마다 소진량이
 * 유동적일 뿐 금액 자체는 하루 기준) catch-all로 떨어져서 총예산 칸에 저장됐다 —
 * 화면의 "$50"이 사실 "$50/day"였다. 값이 없는 것보다 나쁜, 조용히 틀린 값이다.
 *
 * 이 매핑은 TikTok 권한(scope)이 막혀 있던 동안 작성돼서 실제 응답으로 검증된 적이
 * 없었다. 권한이 열리자마자 드러난 것이라, 모드 이름을 하드코딩으로 나열하는 대신
 * "DAILY가 들어간 모드는 일일"로 폭을 넓혀 앞으로 늘어날 변종도 받아낸다.
 */
function isDailyBudgetMode(mode: unknown): boolean {
  const value = String(mode ?? '');
  return value === 'BUDGET_MODE_DAY' || value.includes('DAILY');
}

function mapTikTokBudget(
  item: any,
  adGroupBudget?: { daily: number | null; total: number | null }
): Pick<CampaignRow, 'budget_planned' | 'budget_daily'> {
  const amount = Number(item.budget ?? 0);
  if (amount) {
    if (isDailyBudgetMode(item.budget_mode)) return { budget_planned: 0, budget_daily: amount };
    return { budget_planned: amount, budget_daily: null };
  }
  // 캠페인 레벨에 예산이 없으면(INFINITE) 광고그룹 합계로 대체한다.
  return {
    budget_planned: adGroupBudget?.total ?? 0,
    budget_daily: adGroupBudget?.daily ?? null,
  };
}

function mapTikTokCampaign(
  item: any,
  base: Pick<CampaignRow, 'owner_id' | 'platform' | 'account_id'>,
  stores: StoreIndex,
  adGroupBudgets?: Map<string, { daily: number | null; total: number | null }>
): CampaignRow {
  const createdAt = new Date(item.create_time ?? Date.now());
  const range =
    parseRangeFromName(item.campaign_name ?? '', createdAt) ??
    fallbackRange(
      createdAt,
      item.operation_status === 'ENABLE',
      new Date(item.modify_time ?? item.create_time ?? Date.now())
    );

  return {
    ...base,
    external_campaign_id: String(item.campaign_id),
    name: item.campaign_name,
    // 대상 매장과 이벤트 묶음은 플랫폼이 모르는 우리 쪽 정보라 이름에서 얻는다.
    campaign_group: resolveEventGroup(item.campaign_name ?? '', stores),
    ...resolveTarget(item.campaign_name ?? '', stores),
    start_date: range.startDate,
    end_date: range.endDate,
    // TikTok은 금액 하나(budget)에 모드(budget_mode)를 따로 준다 — 모드를 안 보면
    // 일일 예산을 총액 칸에 넣게 된다(예전 버그). BUDGET_MODE_INFINITE면 budget이
    // 0으로 오는데, 그건 보통 캠페인이 아니라 광고그룹에 예산을 건 계정이다.
    ...mapTikTokBudget(item, adGroupBudgets?.get(String(item.campaign_id))),
    goal: mapTikTokGoal(item.objective),
    // TikTok 소재 썸네일은 아직 안 가져온다 — Meta와 달리 캠페인에서 소재까지
    // 내려가는 경로가 별도 권한을 요구해서, Ad Group 권한 심사와 함께 정리한다.
    thumbnail_url: null,
  };
}

// ============================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = supabaseAdmin();

  // ad_accounts를 임베드로 끌어오지 않고 따로 읽는다 — PostgREST의 to-one 임베드는
  // supabase-js 타입 추론에서 배열로 잡혀 deno check(배포 시 실행됨)를 통과하지 못한다.
  const [
    { data: connections, error },
    { data: adAccounts, error: accError },
    { data: storeRows, error: storeError },
  ] = await Promise.all([
    admin.from('connections').select('owner_id, platform, account_id, access_token'),
    admin.from('ad_accounts').select('id, external_account_id'),
    admin.from('stores').select('id, region, name'),
  ]);

  if (error || accError || storeError) {
    return new Response(
      JSON.stringify({ error: error?.message ?? accError?.message ?? storeError?.message }),
      { status: 500, headers: corsHeaders }
    );
  }

  const externalIdByAccount = new Map(
    (adAccounts ?? []).map((a) => [a.id, a.external_account_id])
  );

  // 매장이 한 건도 없으면 resolveTarget이 전부 all_stores로 떨어진다. 그게 맞는 동작이다 —
  // 없는 매장에 캠페인을 붙일 수는 없다.
  const stores: StoreIndex = {
    byId: new Set((storeRows ?? []).map((s) => s.id)),
    byRegion: (storeRows ?? []).reduce((acc, s) => {
      const list = acc.get(s.region) ?? [];
      list.push(s.id);
      acc.set(s.region, list);
      return acc;
    }, new Map<string, string[]>()),
    // 긴 이름부터 맞춰 "Florida Mall"이 짧은 이름에 밀리지 않게 한다.
    byName: (storeRows ?? [])
      .map((s) => [String(s.name).toLowerCase(), s.id] as [string, string])
      .sort((a, b) => b[0].length - a[0].length),
  };

  const results: Record<string, { inserted: number; updated: number; failed: number }> = {};
  const errors: string[] = [];

  for (const conn of connections ?? []) {
    const externalAccountId = externalIdByAccount.get(conn.account_id);
    const key = `${conn.platform}:${conn.account_id}`;
    results[key] = { inserted: 0, updated: 0, failed: 0 };

    if (!externalAccountId) {
      errors.push(`${key}: ad_accounts.external_account_id가 없습니다`);
      continue;
    }

    const base = { owner_id: conn.owner_id, platform: conn.platform, account_id: conn.account_id };
    const fetched =
      conn.platform === 'meta'
        ? await fetchMetaCampaigns(conn.access_token, externalAccountId)
        : await fetchTikTokCampaigns(conn.access_token, externalAccountId);

    // 일부라도 받았으면 그건 저장한다(부분 성공). 다만 실패 사실은 반드시 남긴다.
    if (fetched.errorMessage) errors.push(`${key}: ${fetched.errorMessage}`);
    const raw = fetched.items;

    /* TikTok은 예산이 캠페인이 아니라 광고그룹에 걸려 있는 경우가 일반적이라
       한 단계 아래를 한 번 더 읽는다(fetchTikTokAdGroupBudgets 주석 참고).
       캠페인이 0건이면 합산할 대상도 없으므로 호출을 아낀다 — 계정당 호출이
       한 세트 늘어나는 변경이라 불필요한 경우를 먼저 걷어낸다. */
    let adGroupBudgets: Map<string, { daily: number | null; total: number | null }> | undefined;
    if (conn.platform === 'tiktok' && raw.length > 0) {
      const adGroups = await fetchTikTokAdGroupBudgets(conn.access_token, externalAccountId);
      if (adGroups.errorMessage) errors.push(`${key}: ${adGroups.errorMessage}`);
      adGroupBudgets = adGroups.byCampaign;
    }

    /* 소재 썸네일도 한 단계 아래(광고)에 있어서 한 번 더 읽는다. 예산과 같은
       이유로 캠페인이 0건이면 호출을 아낀다. */
    let thumbnails: Map<string, string> | undefined;
    if (conn.platform === 'meta' && raw.length > 0) {
      thumbnails = await fetchMetaThumbnails(conn.access_token, externalAccountId);
    }

    const rows: CampaignRow[] = raw.map((item: any) =>
      conn.platform === 'meta'
        ? mapMetaCampaign(item, base, stores, thumbnails)
        : mapTikTokCampaign(item, base, stores, adGroupBudgets)
    );
    if (rows.length === 0) continue;

    /* 이미 있는 캠페인은 이름만 갱신한다. 전체 upsert로 덮으면 사용자가 화면에서
       채운 기간·타겟·예산·목표가 매일 동기화 때마다 기본값으로 되돌아간다.
       예외는 예산 한 가지다 — **저장된 값이 비어 있을 때만** 채운다. 예산 매핑이
       불완전하던 시절(Meta는 lifetime_budget만 요청, TikTok은 budget_mode를 안 봄)
       동기화된 캠페인은 전부 0/null로 들어와 있어서, 매퍼만 고치면 신규 캠페인만
       값을 갖고 기존 것은 영원히 '—'로 남는다. 비어 있는 칸만 채우므로 사용자가
       넣은 값을 덮어쓸 위험은 없다. */
    const { data: existing, error: existingError } = await admin
      .from('campaigns')
      .select('external_campaign_id, budget_planned, budget_daily, target_store_ids, thumbnail_url')
      .in('external_campaign_id', rows.map((r) => r.external_campaign_id));

    if (existingError) {
      errors.push(`${key}: 기존 캠페인 조회 실패 — ${existingError.message}`);
      continue;
    }
    const existingById = new Map((existing ?? []).map((c) => [c.external_campaign_id, c]));

    for (const row of rows) {
      // 한 건이 실패해도 나머지는 계속한다 — 부분 성공이 전체 실패보다 낫다.
      const current = existingById.get(row.external_campaign_id);
      if (current) {
        const patch: Record<string, unknown> = { name: row.name, updated_at: new Date().toISOString() };
        /* 예전 오매핑으로 **일일 예산이 총예산 칸에 들어간** 행을 되돌린다.
           "비어 있을 때만 채운다"로는 손이 닿지 않는다 — 칸이 비어 있지 않고,
           틀린 값으로 차 있기 때문이다.

           조건을 좁게 잡는다: 플랫폼이 지금 일일 예산이라고 말하고, 저장된
           일일 칸은 비어 있으며, 저장된 총예산이 그 일일 금액과 **정확히** 같을
           때만. 이 셋이 동시에 성립하는 건 우리가 일일 금액을 총액 칸에 넣었을
           때뿐이라, 사용자가 직접 넣은 총예산을 건드릴 위험이 없다(실데이터
           14건 전부 이 지문과 일치, 그 외 0건인 것을 확인하고 넣은 규칙). */
        const isMisfiledDailyBudget =
          row.budget_daily != null &&
          current.budget_daily == null &&
          Number(current.budget_planned) === Number(row.budget_daily);
        if (isMisfiledDailyBudget) patch.budget_planned = 0;

        // 비어 있는 예산만 채운다(0/null이 "값 없음" — 화면도 0을 예산 없음으로 읽는다).
        if (!current.budget_planned && row.budget_planned) patch.budget_planned = row.budget_planned;
        if (current.budget_daily == null && row.budget_daily != null) patch.budget_daily = row.budget_daily;
        /* 매장도 같은 원칙 — 비어 있을 때만 채운다. 이름 규칙이 좋아지면(예: 지역
           접미사 인식) 이미 들어와 있는 캠페인이 그 혜택을 못 받는 문제가 예산과
           똑같이 생긴다. 사용자가 지정한 매장 목록은 비어 있지 않으므로 덮이지 않고,
           새 규칙이 매칭에 실패하면 row도 빈 배열이라 아무 일도 일어나지 않는다. */
        if ((current.target_store_ids ?? []).length === 0 && row.target_store_ids.length > 0) {
          patch.target_store_ids = row.target_store_ids;
          patch.target_scope = row.target_scope;
        }
        /* 썸네일은 "비어 있을 때만"이 아니라 "우리가 채운 것이면 매번" 갱신한다.
           Meta CDN 링크에는 만료 파라미터(oe=)가 붙어 있어서, 한 번 채우고 다시
           안 건드리면 언젠가 전부 깨진 이미지가 된다.

           사용자가 직접 올린 썸네일은 base64 data URI로 저장되므로(실데이터
           확인 — 1MB 안팎) 그것만 보호하면 된다. 별도 컬럼(thumbnail_source)을
           두는 것보다 가볍고, 저장 형식이 실제로 갈려 있어 판정이 흔들리지 않는다. */
        const isUserUploaded = String(current.thumbnail_url ?? '').startsWith('data:');
        if (!isUserUploaded && row.thumbnail_url) patch.thumbnail_url = row.thumbnail_url;

        const { error: updateError } = await admin
          .from('campaigns')
          .update(patch)
          .eq('external_campaign_id', row.external_campaign_id);

        if (updateError) {
          console.error('campaigns 갱신 실패', { id: row.external_campaign_id, message: updateError.message });
          errors.push(`${row.name}: ${updateError.message}`);
          results[key].failed += 1;
        } else {
          results[key].updated += 1;
        }
        continue;
      }

      const { error: insertError } = await admin.from('campaigns').insert(row);
      if (insertError) {
        console.error('campaigns 삽입 실패', { id: row.external_campaign_id, message: insertError.message });
        errors.push(`${row.name}: ${insertError.message}`);
        results[key].failed += 1;
      } else {
        results[key].inserted += 1;
      }
    }
  }

  // 실패가 있으면 200으로 "성공"이라 말하지 않는다 — 예전 버전이 저장 결과를 보지 않고
  // 가져온 건수만 세는 바람에, 0건 저장하고도 10건 동기화했다고 보고했다.
  return new Response(JSON.stringify({ synced: results, errors }), {
    status: errors.length > 0 ? 207 : 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
