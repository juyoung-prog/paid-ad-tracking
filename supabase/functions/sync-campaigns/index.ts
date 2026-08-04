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

  const prefix = name.split('_')[0]?.trim() ?? '';
  const regionStores = stores.byRegion.get(prefix.toUpperCase());
  if (regionStores && regionStores.length > 0) {
    return { target_scope: 'multi_store', target_store_ids: regionStores };
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
  goal: string;
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
async function fetchMetaCampaigns(accessToken: string, externalAccountId: string) {
  const fields = 'id,name,status,objective,start_time,stop_time,created_time,updated_time,lifetime_budget';
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
      return all;
    }
    all.push(...(json.data ?? []));
    url = json.paging?.next ?? null;
  }
  return all;
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

function mapMetaCampaign(item: any, base: Pick<CampaignRow, 'owner_id' | 'platform' | 'account_id'>, stores: StoreIndex): CampaignRow {
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
    budget_planned: Number(item.lifetime_budget ?? 0) / 100, // Meta는 최소 화폐 단위(센트)로 준다
    goal: mapMetaGoal(item.objective),
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
async function fetchTikTokCampaigns(accessToken: string, advertiserId: string) {
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
      return all;
    }

    all.push(...(json?.data?.list ?? []));

    const totalPage = json?.data?.page_info?.total_page ?? 1;
    if (page >= totalPage) break;
  }
  return all;
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

function mapTikTokCampaign(item: any, base: Pick<CampaignRow, 'owner_id' | 'platform' | 'account_id'>, stores: StoreIndex): CampaignRow {
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
    // BUDGET_MODE_INFINITE면 budget이 0으로 온다. 계획 예산은 사용자가 넣는 값이다.
    budget_planned: Number(item.budget ?? 0),
    goal: mapTikTokGoal(item.objective),
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
    const raw =
      conn.platform === 'meta'
        ? await fetchMetaCampaigns(conn.access_token, externalAccountId)
        : await fetchTikTokCampaigns(conn.access_token, externalAccountId);

    const rows: CampaignRow[] = raw.map((item: any) =>
      conn.platform === 'meta' ? mapMetaCampaign(item, base, stores) : mapTikTokCampaign(item, base, stores)
    );
    if (rows.length === 0) continue;

    // 이미 있는 캠페인은 이름만 갱신한다. 전체 upsert로 덮으면 사용자가 화면에서
    // 채운 기간·타겟·예산·목표가 매일 동기화 때마다 기본값으로 되돌아간다.
    const { data: existing, error: existingError } = await admin
      .from('campaigns')
      .select('external_campaign_id')
      .in('external_campaign_id', rows.map((r) => r.external_campaign_id));

    if (existingError) {
      errors.push(`${key}: 기존 캠페인 조회 실패 — ${existingError.message}`);
      continue;
    }
    const existingIds = new Set((existing ?? []).map((c) => c.external_campaign_id));

    for (const row of rows) {
      // 한 건이 실패해도 나머지는 계속한다 — 부분 성공이 전체 실패보다 낫다.
      if (existingIds.has(row.external_campaign_id)) {
        const { error: updateError } = await admin
          .from('campaigns')
          .update({ name: row.name, updated_at: new Date().toISOString() })
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
