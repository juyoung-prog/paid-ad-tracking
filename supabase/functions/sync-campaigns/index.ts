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
 * 모든 외부 fetch의 상한. 이게 없으면 응답이 영영 안 오는 연결 하나가 함수
 * 전체를 플랫폼 강제 종료까지 붙잡아 둔다 — 특히 oEmbed는 비즈니스 API가
 * 아니라 소비자용 tiktok.com이라, 데이터센터 IP를 안티봇으로 오래 물고 있는
 * (tarpit) 동작이 실제로 알려져 있다. 크론 호출(net.http_post)의 제한이
 * 60초인데 정상 전체 실행이 이미 ~22초라(실측), 느린 연결 몇 개면 초과한다.
 * 초과하면 데이터는 멀쩡한데 실패로 기록되고, 재시도가 아직 도는 원본과
 * 동시에 또 떠서 호출량만 배가 된다.
 */
const FETCH_TIMEOUT_MS = 10_000;

/** AbortSignal.timeout을 강제한 fetch. 이 파일의 모든 외부 호출은 이걸 쓴다. */
function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

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

/**
 * 공백·마침표로 쓴 기간 표기. "6.27-7.5", "6.9~7.16", "5.22~6.7" 형태.
 * isDateToken이 담당하는 "_0617~0707"과 달리 이름 안에 그대로 섞여 들어온다.
 */
const DOTTED_DATE_RANGE = /\b\d{1,2}\.\d{1,2}(\s*[~\-–—]\s*\d{1,2}\.\d{1,2})?\b/g;

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

  /* 날짜를 뗀다. isDateToken은 "_0617~0707"처럼 밑줄로 끊긴 4자리만 알아서,
     "1$ Deals 6.27-7.5"처럼 공백·마침표로 쓴 날짜가 그대로 남았다 — 같은 행사가
     회차마다 다른 이벤트로 갈라졌다(1$ Deals가 3개, 2months Deals가 2개).
     지역 접미사보다 먼저 뗀다(날짜가 뒤에 붙는 경우가 있다). */
  const joined = kept.join(' ');
  const withoutDates = joined.replace(DOTTED_DATE_RANGE, ' ');

  // 지역 접미사를 뗀다 — "Labor Day FL"/"labor day GA"는 같은 이벤트다.
  const base = withoutDates.replace(/\s+(FL|GA|ALL)$/i, '').replace(/\s+/g, ' ').trim();
  if (!base) return null;

  /* 무언가를 **실제로 알아보고 떼어냈는지**로 판단한다. 문자열 비교(결과 === 원본
     이름)로 하다가 캡션 안에 `_`가 든 이름에서 빗나갔다 — "@beautymaster_official"
     이 밑줄 기준으로 쪼개졌다 붙으면서 원본과 달라져, 아무것도 못 알아봤는데도
     그룹이 만들어졌다. 세 가지 중 하나라도 있었어야 유도한 것이다. */
  const recognizedSomething =
    kept.length !== parts.length ||          // 매장/지역 접두사나 회차를 떼어냄
    withoutDates !== joined ||                // 기간 표기를 떼어냄
    base !== joined.replace(/\s+/g, ' ').trim(); // 지역 접미사를 떼어냄
  if (!recognizedSomething) return null;

  return normalizeCase(base);
}

/**
 * **예전** 규칙이 이 이름으로 만들었을 그룹 값. 백필 판정에만 쓴다.
 *
 * "저장된 그룹을 덮어써도 되는가"를 알려면 그게 서버가 만든 값인지 사람이 넣은
 * 값인지 구분해야 하는데, 그걸 기록해 둔 컬럼이 없다. 대신 예전 규칙을 그대로
 * 재현해서 "지금 저장된 값이 예전 규칙의 출력과 같은가"를 본다 — 같으면 서버가
 * 만든 것이고, 다르면 사람이 손댄 것이다.
 *
 * 처음엔 그냥 `group === name`으로 봤는데 대부분 걸리지 않았다. 예전 규칙도
 * `_`를 공백으로 바꾸고 매장 코드·줄바꿈을 정리한 뒤 저장했기 때문이다
 * (`BF3_1$ Deals_5.15~6.7` → `1$ Deals 5.15~6.7`). 원본 이름과 비교하면 당연히
 * 안 맞는다 — 비교 대상은 이름이 아니라 **예전 규칙의 출력**이어야 한다.
 */
function resolveEventGroupLegacy(name: string, stores: StoreIndex) {
  const storeId = resolveStoreId(name, stores);
  if (storeId && OPENING_PHASE.test(name)) return `${storeId} Opening`;

  const parts = name.split('_').map((p) => p.trim()).filter(Boolean);
  const kept = parts.filter((part, index) => {
    if (index === 0 && (stores.byId.has(part) || stores.byRegion.has(part.toUpperCase()))) return false;
    if (index === 0 && part.toUpperCase() === 'ALLSTORES') return false;
    if (isDateToken(part)) return false;
    if (/^\d{1,2}$/.test(part)) return false;
    return true;
  });
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
  ad_link: string | null;
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
    const res: Response = await fetchWithTimeout(url);
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
/** 캠페인당 대표 광고 하나에서 뽑은 소재 정보 — 썸네일과 공개 링크가 같은 광고에서 나온다. */
type CreativeInfo = { thumb: string | null; link: string | null };

async function fetchMetaThumbnails(accessToken: string, externalAccountId: string): Promise<Map<string, CreativeInfo>> {
  const byCampaign = new Map<string, CreativeInfo>();
  /* 링크 우선순위 — 소비자가 실제로 그 광고를 본 곳으로 보낸다:
       1. instagram_permalink_url — 인스타그램 게시물 주소. 이 계정의 부스팅
          원본은 대부분 인스타 게시물이라("Instagram post: …" 캠페인들) 이게
          1순위다. 페이스북 게시물 링크로 보내면 같은 소재라도 소비자가 본
          지면이 아니다(실사용 지적).
       2. effective_object_story_id — 페이스북 게시물("페이지id_게시물id").
          인스타 permalink가 없는 페이스북 지면 부스팅용.
       3. preview_shareable_link — 게시물 없이 만든 다크 광고의 미리보기. */
  const fields = 'campaign_id,preview_shareable_link,creative.thumbnail_width(320).thumbnail_height(320){thumbnail_url,effective_object_story_id,instagram_permalink_url}';
  let url: string | null =
    `https://graph.facebook.com/v19.0/act_${externalAccountId}/ads?fields=${fields}&limit=200&access_token=${accessToken}`;

  for (let page = 0; url && page < MAX_PAGES; page += 1) {
    const res: Response = await fetchWithTimeout(url);
    const json: any = await res.json();
    if (json?.error) {
      console.error('Meta 썸네일 조회 실패(무시하고 계속)', json.error);
      return byCampaign;
    }
    for (const ad of json.data ?? []) {
      const campaignId = ad?.campaign_id != null ? String(ad.campaign_id) : null;
      // 먼저 만난 광고의 소재를 쓴다 — 이후 광고로 덮지 않는다. 링크도 같은
      // 광고에서 뽑아야 화면의 썸네일과 링크가 같은 소재를 가리킨다.
      if (!campaignId || byCampaign.has(campaignId)) continue;
      const thumb = ad?.creative?.thumbnail_url ?? null;
      const igPermalink = ad?.creative?.instagram_permalink_url;
      const storyId = ad?.creative?.effective_object_story_id;
      const link = igPermalink
        ?? (storyId ? `https://www.facebook.com/${String(storyId).replace('_', '/posts/')}` : null)
        ?? ad?.preview_shareable_link
        ?? null;
      if (thumb || link) byCampaign.set(campaignId, { thumb, link });
    }
    url = json.paging?.next ?? null;
  }
  return byCampaign;
}

/**
 * 광고 계정의 청구 상태를 읽어 ad_accounts에 저장한다.
 *
 * 캠페인 지출을 아무리 더해도 이 값은 안 나온다. Meta는 문턱에 도달할 때마다
 * 청구하고 누적을 0으로 되돌리는데 우리는 그 리셋을 볼 수 없어서 "이번 청구
 * 이후 얼마"를 계산할 수 없다 — 플랫폼이 act_{id}.balance로 직접 알려주므로
 * 읽어오기만 한다(실측: $0.00 / $85.81 / $387.52).
 *
 * balance는 화폐 최소 단위(센트)로 오므로 여기서 한 번만 USD로 바꾼다.
 * 실패해도 errorMessage를 만들지 않는다 — 캠페인 동기화가 본체이고 이건 부가
 * 정보라, 이것 때문에 전체가 "실패"로 표시되면 잘못된 신호가 된다.
 *
 * TikTok(/advertiser/info/)은 별도 권한(Ad Account Information)이 필요해 아직
 * 열려 있지 않다. 권한이 승인되면 여기에 같은 방식으로 추가한다.
 */
async function syncMetaBilling(admin: any, accessToken: string, accountId: string, externalAccountId: string) {
  try {
    const res = await fetchWithTimeout(
      `https://graph.facebook.com/v19.0/act_${externalAccountId}?fields=balance,currency&access_token=${accessToken}`,
    );
    const json: any = await res.json();
    if (json?.error || json?.balance == null) {
      console.error('Meta 잔액 조회 실패(무시하고 계속)', { accountId, error: json?.error?.message });
      return;
    }
    await admin
      .from('ad_accounts')
      .update({ balance_due: Number(json.balance) / 100, balance_synced_at: new Date().toISOString() })
      .eq('id', accountId);
  } catch (err) {
    console.error('Meta 잔액 조회 예외(무시하고 계속)', { accountId, err: String(err) });
  }
}

/**
 * TikTok 선불 잔액을 읽어 ad_accounts에 저장한다.
 *
 * Meta의 balance와 **의미가 정반대**라 컬럼도 다르다: Meta는 "낼 돈"(미납액),
 * TikTok은 "쓸 수 있는 돈"(남은 선불 잔액)이다. 같은 이름의 필드를 한 칸에
 * 담으면 부호가 반대인 두 값이 섞여 조용히 틀린 판단을 만든다.
 *
 * 실측: advertiser/info/ → { currency: 'USD', balance: 220.48 }.
 * Meta처럼 최소 단위(센트)가 아니라 그대로 USD로 온다.
 */
async function syncTikTokBilling(admin: any, accessToken: string, accountId: string, advertiserId: string) {
  try {
    const url = new URL('https://business-api.tiktok.com/open_api/v1.3/advertiser/info/');
    url.searchParams.set('advertiser_ids', JSON.stringify([String(advertiserId)]));
    const res = await fetchWithTimeout(url.toString(), { headers: { 'Access-Token': accessToken } });
    const json: any = await res.json();
    const balance = json?.data?.list?.[0]?.balance;
    if (json?.code !== 0 || balance == null) {
      console.error('TikTok 잔액 조회 실패(무시하고 계속)', { accountId, code: json?.code, message: json?.message });
      return;
    }
    await admin
      .from('ad_accounts')
      .update({ balance_available: Number(balance), balance_synced_at: new Date().toISOString() })
      .eq('id', accountId);
  } catch (err) {
    console.error('TikTok 잔액 조회 예외(무시하고 계속)', { accountId, err: String(err) });
  }
}

/** Meta objective → 우리 goal enum. 모르는 값은 traffic으로 둔다(가장 중립적). */
/**
 * 목표를 유도하지 못했을 때 저장되던 **역사적** 기본값.
 *
 * Meta·TikTok 매퍼 둘 다 한때 이 값을 기본값으로 썼다(TikTok은 이후 awareness로
 * 바뀌었다). 목표가 깨진 채 저장된 행들은 예외 없이 이 값을 들고 있으므로,
 * "서버가 잘못 넣은 값인가"를 가리는 지문이 된다.
 *
 * 매퍼의 현재 기본값을 참조하면 안 된다 — 기본값이 바뀌면 지문이 과거를 못
 * 가리키게 되고, 정작 고쳐야 할 행을 지나친다. 이 값은 과거를 가리키는
 * 상수이므로 매퍼가 바뀌어도 따라 움직이면 안 된다.
 */
const BROKEN_INPUT_GOAL = 'traffic';

function mapMetaGoal(objective: string | undefined) {
  switch (objective) {
    case 'OUTCOME_AWARENESS':
    case 'BRAND_AWARENESS':
    case 'REACH':
      return 'awareness';
    case 'OUTCOME_ENGAGEMENT':
    case 'POST_ENGAGEMENT':
    case 'VIDEO_VIEWS':
    /* 이벤트 응답은 참여 목표다. 여기 없으면 기본값(traffic)으로 떨어져
       "클릭이 0인 트래픽 캠페인"으로 보인다(실계정 4건). */
    case 'EVENT_RESPONSES':
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
  creatives?: Map<string, CreativeInfo>,
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
    thumbnail_url: creatives?.get(String(item.id))?.thumb ?? null,
    ad_link: creatives?.get(String(item.id))?.link ?? null,
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

    const res = await fetchWithTimeout(url.toString(), { headers: { 'Access-Token': accessToken } });
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
/**
 * TikTok 페이지네이션 GET 한 벌 — campaign/adgroup/ad/file 조회가 전부 같은
 * 모양(page/page_size, body의 code, page_info.total_page)이라 여기로 모은다.
 * 실패하면 지금까지 모은 것만 돌려주고 조용히 멈춘다(호출부가 부가 정보 용도일 때
 * 동기화 전체를 실패로 만들지 않기 위해 — Meta 썸네일과 같은 원칙).
 */
async function fetchTikTokPages(path: string, accessToken: string, advertiserId: string): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(`https://business-api.tiktok.com/open_api/v1.3/${path}/`);
    url.searchParams.set('advertiser_id', advertiserId);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', '100');
    const res = await fetchWithTimeout(url.toString(), { headers: { 'Access-Token': accessToken } });
    const json = await res.json();
    if (json?.code !== 0) {
      console.error(`TikTok ${path} 조회 실패(무시하고 계속)`, { page, code: json?.code, message: json?.message });
      return all;
    }
    all.push(...(json?.data?.list ?? []));
    const totalPage = json?.data?.page_info?.total_page ?? 1;
    if (page >= totalPage) break;
  }
  return all;
}

/**
 * 캠페인별 소재 썸네일. Meta(fetchMetaThumbnails)와 목적은 같은데 경로가 다르다 —
 * TikTok은 썸네일 주소를 광고에 직접 실어주지 않아서, 광고가 어떤 **종류**의
 * 소재를 쓰는지에 따라 다른 곳에서 해석해야 한다(전부 실계정 응답으로 확인):
 *
 * - Spark Ads(이 계정 31캠페인 중 30): 업로드 소재가 아니라 TikTok **게시물**을
 *   광고로 쓴다. 광고에는 tiktok_item_id만 있고 소재 라이브러리에는 아무것도
 *   없다. Business API 쪽 조회(/identity/video/info/)는 또 다른 권한(TikTok
 *   Accounts)이 필요해서, 게시물 썸네일은 **공개 oEmbed**로 얻는다 — 인증이
 *   필요 없고 게시물이 공개인 한 항상 동작한다(Spark Ads는 공개 게시물만 광고로
 *   쓸 수 있으므로 전제가 성립한다). URL의 사용자명 자리는 아무 값이나 받아줘서
 *   `@_`로 둔다.
 * - 업로드 영상(1캠페인): video_id → /file/video/ad/search/의 poster_url.
 * - 업로드 이미지(현재 0건이지만 방어): image_ids → /file/image/ad/search/.
 *
 * 캠페인 하나에 광고가 여럿이면 먼저 만난 것을 쓴다(Meta와 같은 이유 — 링크와
 * 달리 썸네일은 "그 캠페인의 아무 소재"라도 알아보는 데 그대로 쓸모가 있다).
 * 여기서 얻는 CDN 주소도 서명 만료가 있어서 Meta와 같은 갱신 규칙을 탄다
 * (data: URI가 아닌 저장값은 매 동기화마다 덮는다).
 */
async function fetchTikTokThumbnails(accessToken: string, advertiserId: string): Promise<Map<string, CreativeInfo>> {
  const byCampaign = new Map<string, CreativeInfo>();
  const ads = await fetchTikTokPages('ad/get', accessToken, advertiserId);
  if (ads.length === 0) return byCampaign;

  // 캠페인별 첫 광고의 소재 단서만 남긴다 — 뒤 광고로 덮지 않는다.
  const clueByCampaign = new Map<string, { videoId?: string; imageId?: string; itemId?: string }>();
  for (const ad of ads) {
    const campaignId = String(ad?.campaign_id ?? '');
    if (!campaignId || clueByCampaign.has(campaignId)) continue;
    /* itemId는 썸네일 단서(3순위)이자 **공개 링크의 유일한 재료**다 — Spark
       광고(게시물 부스팅)만 갖는다. 업로드 소재 다크 광고는 공개 게시물이
       존재하지 않아 링크가 없다. 썸네일 단서와 별개로 항상 담아둔다. */
    const itemId = ad?.tiktok_item_id ? String(ad.tiktok_item_id) : undefined;
    if (ad?.video_id) clueByCampaign.set(campaignId, { videoId: String(ad.video_id), itemId });
    else if ((ad?.image_ids ?? []).length) clueByCampaign.set(campaignId, { imageId: String(ad.image_ids[0]), itemId });
    else if (itemId) clueByCampaign.set(campaignId, { itemId });
  }

  // 업로드 소재는 라이브러리를 통째로 읽어 id → 주소 맵을 만든다. 개별 info
  // 조회보다 호출이 적고(이 계정은 영상 4건), 단서에 없는 소재는 그냥 남는다.
  const needVideos = [...clueByCampaign.values()].some((c) => c.videoId);
  const needImages = [...clueByCampaign.values()].some((c) => c.imageId);
  const videoPoster = new Map<string, string>();
  const imageUrl = new Map<string, string>();
  if (needVideos) {
    for (const v of await fetchTikTokPages('file/video/ad/search', accessToken, advertiserId)) {
      if (v?.video_id && (v?.poster_url || v?.video_cover_url)) videoPoster.set(String(v.video_id), v.poster_url ?? v.video_cover_url);
    }
  }
  if (needImages) {
    for (const img of await fetchTikTokPages('file/image/ad/search', accessToken, advertiserId)) {
      if (img?.image_id && img?.image_url) imageUrl.set(String(img.image_id), img.image_url);
    }
  }

  for (const [campaignId, clue] of clueByCampaign) {
    // Spark 광고면 공개 영상 주소가 있다. @_ 자리는 TikTok이 실제 작성자로
    // 리다이렉트한다(oEmbed 조회도 같은 주소를 쓴다).
    const link = clue.itemId ? `https://www.tiktok.com/@_/video/${clue.itemId}` : null;
    let thumb: string | null = null;
    if (clue.videoId && videoPoster.has(clue.videoId)) {
      thumb = videoPoster.get(clue.videoId)!;
    } else if (clue.imageId && imageUrl.has(clue.imageId)) {
      thumb = imageUrl.get(clue.imageId)!;
    } else if (clue.itemId) {
      try {
        const res = await fetchWithTimeout(`https://www.tiktok.com/oembed?url=${encodeURIComponent(`https://www.tiktok.com/@_/video/${clue.itemId}`)}`);
        const json = await res.json();
        if (json?.thumbnail_url) thumb = json.thumbnail_url;
      } catch (err) {
        // 게시물이 비공개/삭제됐거나 oEmbed가 막힌 경우 — 그 캠페인만 이니셜로 남는다.
        console.error('TikTok oEmbed 실패(무시하고 계속)', { itemId: clue.itemId, err: String(err) });
      }
    }
    if (thumb || link) byCampaign.set(campaignId, { thumb, link });
  }
  return byCampaign;
}

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

    const res = await fetchWithTimeout(url.toString(), { headers: { 'Access-Token': accessToken } });
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
/**
 * TikTok objective_type → 우리 goal enum.
 *
 * 예전엔 아는 값 5개만 처리하고 나머지를 전부 traffic으로 떨어뜨렸다. 그게
 * 실제 오탐을 만들었다: 클릭을 만들 목적이 아닌 캠페인이 traffic으로 저장되고,
 * "목표 지표(=클릭) 0"이라며 알림이 떴는데 정작 그 캠페인은 좋아요 391·팔로우
 * 148을 만들고 있었다. 도달·인지형 objective(RF_* 계열 포함)를 빠뜨린 게 원인.
 *
 * 목록을 넓히고, 그래도 모르는 값은 traffic이 아니라 **awareness**로 둔다 —
 * awareness의 판정 지표는 도달(reach)이라, 전달만 됐으면 0이 아니다. 모르는
 * 것을 가장 조용한 분류에 두는 쪽이 잘못된 경보보다 낫다.
 */
function mapTikTokGoal(objective: string | undefined) {
  switch (objective) {
    case 'REACH':
    case 'RF_REACH':
      return 'awareness';
    case 'TRAFFIC':
    case 'LEAD_GENERATION':
      return 'traffic';
    case 'VIDEO_VIEWS':
    case 'RF_VIDEO_VIEWS':
    case 'ENGAGEMENT':
      return 'engagement';
    case 'CONVERSIONS':
    case 'WEB_CONVERSIONS':
    case 'PRODUCT_SALES':
    case 'APP_PROMOTION':
      return 'conversion';
    default:
      return 'awareness';
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
  adGroupBudgets?: Map<string, { daily: number | null; total: number | null }>,
  creatives?: Map<string, CreativeInfo>,
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
    /* TikTok campaign/get이 주는 필드명은 `objective_type`이다 — `objective`가
       아니다. 이걸 잘못 읽어서 **31건 전부** undefined → 기본값(traffic)으로
       떨어졌다(플랫폼 실제 값은 REACH 26 / VIDEO_VIEWS 3 / ENGAGEMENT 1 /
       TRAFFIC 1). mapTikTokGoal의 case를 아무리 넓혀도 입력이 항상 undefined라
       아무 효과가 없었다 — 매퍼를 고치고도 화면이 안 바뀌던 이유가 이것이다.
       objective도 함께 읽어 두는 건 TikTok이 필드명을 바꿔도 조용히 기본값으로
       무너지지 않게 하려는 안전장치다. */
    goal: mapTikTokGoal(item.objective_type ?? item.objective),
    thumbnail_url: creatives?.get(String(item.campaign_id))?.thumb ?? null,
    ad_link: creatives?.get(String(item.campaign_id))?.link ?? null,
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
    // 청구 상태는 캠페인 수와 무관하게 계정마다 한 번씩 읽는다.
    if (conn.platform === 'meta') {
      await syncMetaBilling(admin, conn.access_token, conn.account_id, externalAccountId);
    } else {
      await syncTikTokBilling(admin, conn.access_token, conn.account_id, externalAccountId);
    }

    let creatives: Map<string, CreativeInfo> | undefined;
    if (raw.length > 0) {
      creatives =
        conn.platform === 'meta'
          ? await fetchMetaThumbnails(conn.access_token, externalAccountId)
          : await fetchTikTokThumbnails(conn.access_token, externalAccountId);
    }

    const rows: CampaignRow[] = raw.map((item: any) =>
      conn.platform === 'meta'
        ? mapMetaCampaign(item, base, stores, creatives)
        : mapTikTokCampaign(item, base, stores, adGroupBudgets, creatives)
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
      /* 아래 patch 판정이 읽는 컬럼은 **빠짐없이** 여기 있어야 한다. goal을 빼먹은
         채 `current.goal === BROKEN_INPUT_GOAL`을 검사했더니 undefined와 비교하는
         꼴이라 조건이 영원히 거짓이었고, 백필이 조용히 아무 일도 안 했다 —
         오류도 로그도 없이 "동기화 성공"으로 보고됐다(실배포에서 발견). */
      .select('external_campaign_id, name, campaign_group, goal, budget_planned, budget_daily, target_store_ids, thumbnail_url')
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
        /* 참고: 예전 오매핑(일일 예산이 총예산 칸에 저장됨)을 되돌리는 자가교정이
           여기 있었다. "총예산 == 플랫폼 일일예산이면 오매핑"이라는 지문을 썼는데,
           이 지문은 하루짜리 캠페인의 정상 데이터와 구분이 안 된다(1일짜리는
           총액=일일이 정의상 같다) — 조건이 맞으면 사용자가 넣은 총예산을 지우고
           복구 경로가 없다. 대상 14건이 전부 교정된 것을 확인하고 제거했다.
           일회성 백필은 소임을 다하면 지우는 게 안전하다. */

        // 비어 있는 예산만 채운다(0/null이 "값 없음" — 화면도 0을 예산 없음으로 읽는다).
        if (!current.budget_planned && row.budget_planned) patch.budget_planned = row.budget_planned;
        if (current.budget_daily == null && row.budget_daily != null) patch.budget_daily = row.budget_daily;
        /* 이벤트 그룹은 **서버가 예전에 이름을 그대로 복사해 넣은 행만** 다시
           계산한다. 판정은 "저장된 그룹이 캠페인 이름과 똑같은가" — 사람이
           그룹란에 캠페인 전체 이름을 그대로 타이핑할 일은 없으므로, 이 지문은
           서버가 만든 값에만 걸린다. 사람이 넣은 그룹("G10 Opening" 같은 짧은
           이름)은 이름과 다르므로 그대로 보존된다.

           이게 필요한 이유: 그룹 규칙을 고쳐도 기존 행은 안 바뀐다(아래 update가
           원래 그룹을 안 건드린다). 부스팅 게시물 93건이 각자 이벤트로 남아
           드롭다운을 뒤덮은 채 그대로였을 것이다. 새 규칙이 null을 주면 null로,
           "1$ Deals"처럼 날짜를 떼어낸 값을 주면 그 값으로 바꾼다. */
        if (current.campaign_group === resolveEventGroupLegacy(current.name, stores)) {
          patch.campaign_group = row.campaign_group;
        }

        /* 목표(goal)도 같은 원칙 — **서버가 잘못 넣은 값만** 다시 계산한다.
           goal은 드로어에서 사람이 고칠 수 있는 값이라 무조건 덮으면 안 된다.

           왜 필요한가: TikTok 목표를 `item.objective`로 읽고 있었는데 실제 필드는
           `objective_type`이라, 31건 전부 undefined → 기본값 traffic으로 저장됐다
           (플랫폼 실제 값은 REACH 26 / VIDEO_VIEWS 3 / ENGAGEMENT 1 / TRAFFIC 1).
           Meta도 EVENT_RESPONSES 4건이 기본값으로 떨어졌다. 합쳐서 34건이 "클릭이
           0인 트래픽 캠페인"으로 보였고, 그 목표에 맞지도 않는 CTR·CPC 컬럼으로
           평가되고 있었다.

           지문은 "저장된 값이 **그 행이 쓰이던 시점의 기본값**과 같은가"다.
           `mapTikTokGoal(undefined)`을 쓰면 안 된다 — 그 기본값은 그 사이
           traffic에서 awareness로 바뀌었고, 깨진 행들이 들고 있는 건 **옛**
           기본값이라 지문이 빗나가 30건이 그대로 남는다(시뮬레이션으로 확인).
           역사적 값을 상수로 고정한다.

           사람이 일부러 이 값과 같은 목표로 바꿔 둔 경우는 덮이지만, 그때 들어갈
           새 값도 플랫폼의 실제 목표라 손실이 아니다. 다른 목표로 바꿔 둔 값은
           그대로 남는다. */
        if (current.goal === BROKEN_INPUT_GOAL && row.goal !== current.goal) {
          patch.goal = row.goal;
        }

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
        /* 광고 링크도 썸네일과 같은 규칙 — 서버 소유 값이라 계산됐으면 매번
           덮는다(사용자 편집이 없는 컬럼이다. 수동 링크는 별도 필드 creative_url
           이고 화면이 그쪽을 우선한다). null로는 안 덮는다 — 부분 조회 실패가
           멀쩡한 링크를 지우면 안 된다. */
        if (row.ad_link) patch.ad_link = row.ad_link;

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


  /* 완전 성공을 sync_runs에 **함수가 직접** 기록한다.

     이 테이블은 원래 cron 래퍼(invoke_sync_function)만 썼다 — pg_net이 비동기라
     응답을 못 보는 호출 지점 대신, 요청 id를 남겨두고 checker가 나중에 결과를
     기록하는 구조다. 그래서 브라우저에서 수동으로 부른 실행(레일 Refresh,
     Settings Sync now)은 아무 기록도 안 남았고, 레일의 "Last synced"가 Refresh
     버튼 바로 위에 있는데도 누른 뒤 시각이 그대로였다 — 고장으로 읽힌다
     (실사용 점검으로 발견).

     성공만 기록한다. 실패 기록은 이미 주인이 있다 — cron 실패는 checker가
     남기고(조용한 실패라 기록이 꼭 필요), 수동 실패는 지켜보는 사용자에게
     스낵바로 즉시 알린다. 여기서 207까지 기록하면 cron 경로에서 checker와
     이중 기록이 되어 "Sync failed (N)" 칩이 한 사고를 두 번 센다.

     기록 실패는 삼킨다 — 동기화 자체는 이미 성공했는데 로그 한 줄 때문에
     실패로 보고하면 재시도가 멀쩡한 동기화를 또 돌린다. */
  if (errors.length === 0) {
    const { error: logError } = await admin.from('sync_runs').insert({
      fn_name: 'sync-campaigns',
      status: 'success',
      status_code: 200,
      response: 'self-reported on completion',
      checked_at: new Date().toISOString(),
    });
    if (logError) console.error('sync_runs 자가 기록 실패(동기화는 성공)', logError.message);
  }

  // 실패가 있으면 200으로 "성공"이라 말하지 않는다 — 예전 버전이 저장 결과를 보지 않고
  // 가져온 건수만 세는 바람에, 0건 저장하고도 10건 동기화했다고 보고했다.
  return new Response(JSON.stringify({ synced: results, errors }), {
    status: errors.length > 0 ? 207 : 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
