// pg_cron(진행중 캠페인 매일 + 종료 후 7일간) 또는 "Sync now"가 invoke. external_campaign_id가
// 있는 캠페인만 대상으로 플랫폼 insights/report를 가져와 performance_records에
// source='api'로 upsert한다. 05-api-integration.md "성과 지표 필드 매핑" 표 기준.
//
// upsert의 conflict 대상은 (campaign_id, recorded_at, source) —
// 00000000000002_sync_constraints_and_cron.sql에서 만든 unique 제약이다. source가 키에
// 포함돼 있어 같은 날 사용자가 직접 입력한 manual 행을 덮어쓰지 않는다.
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

/** 종료된 캠페인을 며칠까지 계속 동기화할지. 플랫폼 지표가 사후 정정되기 때문에 바로 끊지 않는다. */
const POST_END_SYNC_DAYS = 7;

/** 페이지네이션 상한. 응답이 잘못돼도 무한 루프에 빠지지 않게 하는 안전장치다. */
const MAX_PAGES = 50;

/** performance_records에 넣는 지표 필드. 플랫폼별 매퍼가 반드시 이 형태로 반환한다. */
type Metrics = {
  impressions: number | null;
  reach: number | null;
  clicks: number | null;
  spend: number;
  video_plays: number | null;
  hook_views: number | null;
  held_views: number | null;
  avg_watch_seconds: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  engagements: number | null;
  follows: number | null;
  profile_visits: number | null;
  conversions: number | null;
};

/** performance_daily에 넣는 일별 행. 가산 가능한 Tier 1만 — 마이그레이션 18 주석 참고. */
type DailyRow = {
  date: string; // YYYY-MM-DD
  spend: number;
  impressions: number | null;
  clicks: number | null;
};

/**
 * 좋아요/댓글/공유를 더해 engagements를 만든다.
 * 셋 다 없으면 null을 돌려준다 — 0으로 만들지 않는다. "상호작용이 0"과 "지표를 못 받았다"는
 * 다르고, 후자를 0으로 쓰면 대시보드가 거짓말을 한다.
 */
function sumInteractions(values: (number | null)[]) {
  if (!values.some((v) => v !== null)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

/** 플랫폼 API는 지표를 문자열로 주는 경우가 많다(TikTok은 전부 문자열). 숫자로 정규화한다. */
function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ============================================================
// Meta
// ============================================================

/**
 * 광고 계정 하나의 캠페인별 성과를 한 번에 가져와 external_campaign_id로 색인한다.
 *
 * 캠페인마다 /{campaign_id}/insights를 부르지 않는 이유가 둘이다:
 *  1) 호출 수. 캠페인이 100개면 100번인데, 계정 레벨 level=campaign이면 1번(+페이지)이다.
 *  2) 기간. Meta insights는 기간을 안 주면 최근 30일만 준다 — 한때 코드 주석이
 *     "기간 지정 없이 누적을 준다"고 잘못 적혀 있었고, 그래서 30일보다 오래전에 끝난
 *     캠페인 104건이 전부 no_data로 빠졌다. date_preset=maximum이 누적이고,
 *     이래야 TikTok의 query_lifetime=true와 같은 의미가 된다.
 */
async function fetchMetaInsightsByCampaign(accessToken: string, externalAccountId: string): Promise<{ byCampaign: Map<string, any>; errorMessage: string | null }> {
  const fields = [
    'campaign_id',
    'impressions', 'reach', 'clicks', 'spend',
    'video_play_actions', 'video_p25_watched_actions', 'video_p100_watched_actions',
    'video_avg_time_watched_actions', 'post_engagement', 'actions',
  ].join(',');

  const byCampaign = new Map<string, any>();
  let url: string | null =
    `https://graph.facebook.com/v19.0/act_${externalAccountId}/insights` +
    `?level=campaign&fields=${fields}&date_preset=maximum&limit=200&access_token=${accessToken}`;

  for (let page = 0; url && page < MAX_PAGES; page += 1) {
    const res: Response = await fetch(url);
    // 명시적 any — url이 json에서, json이 url에서 유도돼 TS가 순환으로 본다(TS7022).
    const json: any = await res.json();
    if (json?.error) {
      console.error('Meta insights 조회 실패', { externalAccountId, message: json.error.message });
      // 실패를 반환값에 담는다 — 콘솔에만 찍으면 토큰이 만료돼도 응답은 200 성공이고
      // 데이터만 0건이라 아무도 고장 난 걸 모른다.
      return { byCampaign, errorMessage: `Meta insights 조회 실패 — ${json.error.message}` };
    }
    for (const row of json.data ?? []) {
      if (row.campaign_id) byCampaign.set(String(row.campaign_id), row);
    }
    url = json.paging?.next ?? null;
  }
  return { byCampaign, errorMessage: null };
}

/** Meta는 여러 지표를 [{ action_type, value }] 배열로 준다. */
function metaAction(raw: any, field: string, actionType?: string) {
  const list = raw?.[field];
  if (!Array.isArray(list)) return null;
  const hit = actionType ? list.find((a: any) => a.action_type === actionType) : list[0];
  return num(hit?.value);
}

// 우리 필드 ↔ Meta Insights 필드 매핑 (05-api-integration.md 표와 동일)
function mapMetaInsight(raw: any): Metrics {
  const likes = metaAction(raw, 'actions', 'post_reaction');
  const comments = metaAction(raw, 'actions', 'comment');
  const shares = metaAction(raw, 'actions', 'post');

  return {
    impressions: num(raw.impressions),
    reach: num(raw.reach),
    clicks: num(raw.clicks),
    spend: num(raw.spend) ?? 0,
    video_plays: metaAction(raw, 'video_play_actions'),
    hook_views: metaAction(raw, 'video_p25_watched_actions'),
    held_views: metaAction(raw, 'video_p100_watched_actions'),
    avg_watch_seconds: metaAction(raw, 'video_avg_time_watched_actions'),
    likes,
    comments,
    shares,
    // Meta는 캠페인 레벨 합계(post_engagement)를 직접 주므로 그걸 쓴다.
    // 없으면 구성 요소를 더해 근사한다.
    engagements: num(raw.post_engagement) ?? sumInteractions([likes, comments, shares]),
    // Meta 캠페인 레벨에는 팔로우/프로필 방문에 대응하는 지표가 없다.
    follows: null,
    profile_visits: null,
    conversions: metaAction(raw, 'actions', 'offsite_conversion'),
  };
}

/**
 * 광고 계정 하나의 **일별** 성과를 한 번에 가져와 external_campaign_id로 색인한다.
 *
 * fetchMetaInsightsByCampaign(누적 스냅샷)과 같은 계정 레벨 insights인데
 * time_increment=1 + time_range를 붙여 하루 단위 행을 받는다. 행 수가
 * 캠페인×일수라 스냅샷 호출과 합치지 않고 따로 부른다 — 합치면 누적 쪽까지
 * 매번 무거운 페이지네이션을 돈다.
 *
 * fields는 가산 가능한 것만 요청한다(spend/impressions/clicks). reach를 일별로
 * 받아 더하면 기간 reach처럼 보이는 거짓 숫자가 되므로 아예 받지 않는다.
 */
async function fetchMetaDailyByCampaign(
  accessToken: string,
  externalAccountId: string,
  since: string,
  until: string,
): Promise<{ byCampaign: Map<string, DailyRow[]>; errorMessage: string | null }> {
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const byCampaign = new Map<string, DailyRow[]>();
  let url: string | null =
    `https://graph.facebook.com/v19.0/act_${externalAccountId}/insights` +
    `?level=campaign&fields=campaign_id,spend,impressions,clicks` +
    `&time_increment=1&time_range=${timeRange}&limit=500&access_token=${accessToken}`;

  let page = 0;
  for (; url && page < MAX_PAGES; page += 1) {
    const res: Response = await fetch(url);
    // 명시적 any — 스냅샷 fetch와 같은 TS7022 회피.
    const json: any = await res.json();
    if (json?.error) {
      console.error('Meta daily insights 조회 실패', { externalAccountId, message: json.error.message });
      return { byCampaign, errorMessage: `Meta daily insights 조회 실패 — ${json.error.message}` };
    }
    for (const row of json.data ?? []) {
      if (!row.campaign_id || !row.date_start) continue;
      const list = byCampaign.get(String(row.campaign_id)) ?? [];
      list.push({
        date: String(row.date_start),
        spend: num(row.spend) ?? 0,
        impressions: num(row.impressions),
        clicks: num(row.clicks),
      });
      byCampaign.set(String(row.campaign_id), list);
    }
    url = json.paging?.next ?? null;
  }

  // 페이지 상한에 걸려 뒷부분을 못 받았으면 실패로 보고한다 — 조용히 자르면
  // "그 캠페인은 그날 지출이 없었다"라는 거짓 데이터가 된다.
  if (url) {
    return { byCampaign, errorMessage: `Meta daily insights가 ${MAX_PAGES}페이지를 초과 — 기간을 좁혀 다시 받아야 함` };
  }
  return { byCampaign, errorMessage: null };
}

// ============================================================
// TikTok
// ============================================================

// TikTok은 캠페인 목록(campaign/get)과 성과 리포트(report/integrated/get)의 엔드포인트가
// 다르고, 캠페인 단위 성과는 data_level=AUCTION_CAMPAIGN + dimensions=['campaign_id']로
// 요청한다. 파라미터 목록은 공식 SDK 문서(tiktok-business-api-sdk, ReportingApi) 기준.
//
// 주의: metrics 배열에 이 계정에서 지원하지 않는 지표명이 하나라도 들어가면 리포트 전체가
// 에러(code != 0)로 떨어진다. 실제 광고 계정에 처음 붙일 때 아래 목록을 응답 code로
// 검증하고, 거부되는 항목이 있으면 그 항목만 빼야 한다.
// 아래 목록은 실제 광고 계정에 하나씩 따로 물어 지원을 확인한 것이다.
// 거부된 것: video_views(=video_play_actions로 대체), saves/bookmark/total_save(캠페인
// 레벨 미제공), video_watched_25~100(video_views_pNN이 정식 이름).
//
// ctr/cpc/cpm/frequency/cost_per_* 는 지원되지만 일부러 넣지 않는다 — spend/impressions/
// clicks에서 계산되는 파생값이라, 저장하면 원본과 어긋났을 때 어느 쪽이 맞는지 알 수 없다.
const TIKTOK_METRICS = [
  'impressions',
  'reach',
  'clicks',
  'spend',
  'video_play_actions',
  'video_watched_2s',
  'video_views_p100',
  'average_video_play',
  'likes',
  'comments',
  'shares',
  'follows',
  'profile_visits',
  'conversion',
];

async function fetchTikTokReport(accessToken: string, advertiserId: string, campaignId: string) {
  const url = new URL('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/');
  url.searchParams.set('advertiser_id', advertiserId);
  url.searchParams.set('report_type', 'BASIC');
  url.searchParams.set('data_level', 'AUCTION_CAMPAIGN');
  url.searchParams.set('dimensions', JSON.stringify(['campaign_id']));
  url.searchParams.set('metrics', JSON.stringify(TIKTOK_METRICS));
  // 캠페인 시작 이후 누적값을 받는다. Meta 쪽은 date_preset=maximum이 같은 역할이라
  // 두 플랫폼이 같은 "그 시점까지의 누적 스냅샷" 의미를 갖는다.
  // (Meta는 기간을 안 주면 최근 30일이다 — 그렇게 두면 오래전 끝난 캠페인이 전부 빈다.)
  url.searchParams.set('query_lifetime', 'true');
  url.searchParams.set('filtering', JSON.stringify([
    { field_name: 'campaign_ids', filter_type: 'IN', filter_value: JSON.stringify([campaignId]) },
  ]));

  const res = await fetch(url.toString(), { headers: { 'Access-Token': accessToken } });
  const json = await res.json();

  // TikTok은 HTTP 200에 body의 code로 실패를 알린다 — res.ok만 보면 에러를 놓친다.
  // API 실패와 "이 캠페인은 집행 실적이 없다"를 구분해서 돌려준다. 둘을 뭉뚱그리면
  // 토큰이 죽었을 때도 그냥 no_data로 보여 원인을 못 찾는다.
  if (json?.code !== 0) {
    console.error('TikTok report 실패', { campaignId, code: json?.code, message: json?.message });
    return { metrics: null, errorMessage: `TikTok report 실패 (code ${json?.code}) — ${json?.message}` };
  }
  return { metrics: json?.data?.list?.[0]?.metrics ?? null, errorMessage: null };
}

// 우리 필드 ↔ TikTok Report 필드 매핑 (05-api-integration.md 표 기준).
//
// held_views는 video_watched_6s가 아니라 video_views_p100을 쓴다. 이 컬럼은 스키마상
// "완전 시청"이고 Meta는 video_p100_watched_actions를 넣는데, TikTok만 6초 시청을 넣고
// 있어 같은 컬럼에 서로 다른 의미가 섞였다(실측 6초 2,119 vs 완전 시청 484 — 4배 차이).
// 그대로 두면 플랫폼 간 비교가 조용히 틀린다.
//
// engagements: TikTok은 Meta의 post_engagement 같은 단일 합계 지표를 캠페인 레벨에서
// 주지 않으므로 좋아요/댓글/공유를 더해 근사한다.
function mapTikTokReport(raw: any): Metrics {
  const likes = num(raw.likes);
  const comments = num(raw.comments);
  const shares = num(raw.shares);

  return {
    impressions: num(raw.impressions),
    reach: num(raw.reach),
    clicks: num(raw.clicks),
    spend: num(raw.spend) ?? 0,
    video_plays: num(raw.video_play_actions),
    hook_views: num(raw.video_watched_2s),
    held_views: num(raw.video_views_p100),
    avg_watch_seconds: num(raw.average_video_play),
    likes,
    comments,
    shares,
    engagements: sumInteractions([likes, comments, shares]),
    follows: num(raw.follows),
    profile_visits: num(raw.profile_visits),
    conversions: num(raw.conversion),
  };
}

/** 'YYYY-MM-DD' + n일. 플랫폼 API가 문자열 날짜만 받으므로 여기서만 Date를 만든다. */
function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** TikTok stat_time_day 조회의 창 크기. 문서상 조회 창 제한이 있어 안전한 하한으로 자른다. */
const TIKTOK_DAILY_WINDOW_DAYS = 30;

/**
 * 캠페인 하나의 일별 성과. 누적 리포트(fetchTikTokReport)와 같은 엔드포인트에
 * dimensions에 stat_time_day를 더하고, query_lifetime 대신 start_date/end_date를
 * 준다(둘은 함께 못 쓴다). 조회 창 제한 때문에 30일 단위로 잘라 순회한다.
 */
async function fetchTikTokDaily(
  accessToken: string,
  advertiserId: string,
  campaignId: string,
  since: string,
  until: string,
): Promise<{ rows: DailyRow[]; errorMessage: string | null }> {
  const rows: DailyRow[] = [];

  for (let windowStart = since; windowStart <= until; windowStart = addDays(windowStart, TIKTOK_DAILY_WINDOW_DAYS)) {
    const windowEnd = addDays(windowStart, TIKTOK_DAILY_WINDOW_DAYS - 1) < until
      ? addDays(windowStart, TIKTOK_DAILY_WINDOW_DAYS - 1)
      : until;

    const url = new URL('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/');
    url.searchParams.set('advertiser_id', advertiserId);
    url.searchParams.set('report_type', 'BASIC');
    url.searchParams.set('data_level', 'AUCTION_CAMPAIGN');
    url.searchParams.set('dimensions', JSON.stringify(['campaign_id', 'stat_time_day']));
    url.searchParams.set('metrics', JSON.stringify(['spend', 'impressions', 'clicks']));
    url.searchParams.set('start_date', windowStart);
    url.searchParams.set('end_date', windowEnd);
    // 창 하나가 최대 30일 = 30행이라 페이지네이션이 필요 없다.
    url.searchParams.set('page_size', '100');
    url.searchParams.set('filtering', JSON.stringify([
      { field_name: 'campaign_ids', filter_type: 'IN', filter_value: JSON.stringify([campaignId]) },
    ]));

    const res = await fetch(url.toString(), { headers: { 'Access-Token': accessToken } });
    const json = await res.json();

    if (json?.code !== 0) {
      console.error('TikTok daily report 실패', { campaignId, code: json?.code, message: json?.message });
      // 창 하나가 실패하면 캠페인 전체를 실패로 본다 — 일부 창만 저장하면
      // "그 기간은 지출 0"으로 보이는 구멍이 생기고, 재시도가 구멍을 못 메운다
      // (행이 있어서 backfill 대상에서 빠진다).
      return { rows: [], errorMessage: `TikTok daily report 실패 (code ${json?.code}) — ${json?.message}` };
    }

    for (const item of json?.data?.list ?? []) {
      // stat_time_day는 "YYYY-MM-DD 00:00:00" 형태로 온다.
      const date = String(item?.dimensions?.stat_time_day ?? '').slice(0, 10);
      if (!date) continue;
      rows.push({
        date,
        spend: num(item?.metrics?.spend) ?? 0,
        impressions: num(item?.metrics?.impressions),
        clicks: num(item?.metrics?.clicks),
      });
    }
  }

  return { rows, errorMessage: null };
}

// ============================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  // 종료 후 POST_END_SYNC_DAYS일이 지난 캠페인은 더 안 부른다 — 값이 더 안 변하는데
  // 매일 호출하면 플랫폼 rate limit만 갉아먹는다.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - POST_END_SYNC_DAYS);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  // 시작한 캠페인 전부를 일단 읽고, 아래에서 대상만 고른다. 종료일로 DB에서 바로
  // 걸러내면 "이미 끝난 채로 처음 들어온 캠페인"이 영영 한 번도 조회되지 않는다.
  const { data: allCampaigns, error: campaignsError } = await admin
    .from('campaigns')
    .select('id, owner_id, platform, account_id, external_campaign_id, start_date, end_date')
    .not('external_campaign_id', 'is', null)
    .lte('start_date', today);

  if (campaignsError) {
    return new Response(JSON.stringify({ error: campaignsError.message }), { status: 500, headers: corsHeaders });
  }

  // 이미 성과를 한 번이라도 받아둔 캠페인 집합.
  const { data: recorded, error: recordedError } = await admin
    .from('performance_records')
    .select('campaign_id');

  if (recordedError) {
    return new Response(JSON.stringify({ error: recordedError.message }), { status: 500, headers: corsHeaders });
  }
  const hasRecord = new Set((recorded ?? []).map((r) => r.campaign_id));

  // 일별 데이터가 이미 있는 캠페인 집합. 행 전체가 아니라 distinct 캠페인 id를
  // 돌려주는 SQL 함수를 쓴다 — 일별 테이블은 캠페인×날짜라 행으로 세면
  // PostgREST max-rows(기본 1000)에 걸려 조용히 잘린다(마이그레이션 18 주석).
  const { data: dailyIds, error: dailyIdsError } = await admin.rpc('performance_daily_campaign_ids');
  if (dailyIdsError) {
    return new Response(JSON.stringify({ error: dailyIdsError.message }), { status: 500, headers: corsHeaders });
  }
  const hasDaily = new Set((dailyIds ?? []) as string[]);

  // 대상 선정:
  //  (1) 아직 창 안에 있는 캠페인 — 값이 계속 변하므로 매일 갱신한다.
  //  (2) 성과 기록이 하나도 없는 캠페인 — 종료된 지 오래됐어도 최초 1회는 받아야 한다.
  //      TikTok은 query_lifetime=true로 끝난 캠페인의 누적값도 준다. 한 번 받고 나면
  //      (1)에 걸리지 않는 한 다시 조회되지 않으므로 rate limit을 계속 쓰지 않는다.
  //
  // 이 두 번째 조건이 없으면, 연동을 시작한 시점에 이미 끝나 있던 캠페인은 영원히
  // 빈칸으로 남는다(실제로 31건 중 26건이 그 상태였다).
  const campaigns = (allCampaigns ?? []).filter(
    (c) => c.end_date >= cutoffDate || !hasRecord.has(c.id)
  );

  // campaigns와 connections 사이에는 직접 FK가 없다(둘 다 ad_accounts를 가리킨다).
  // PostgREST 임베드로는 못 따라가므로 두 테이블을 따로 읽어 (owner_id, account_id)로 잇는다.
  const [{ data: connections, error: connError }, { data: adAccounts, error: accError }] = await Promise.all([
    admin.from('connections').select('owner_id, account_id, access_token'),
    admin.from('ad_accounts').select('id, external_account_id'),
  ]);

  if (connError || accError) {
    return new Response(JSON.stringify({ error: connError?.message ?? accError?.message }), { status: 500, headers: corsHeaders });
  }

  const tokenByAccount = new Map(
    (connections ?? []).map((c) => [`${c.owner_id}:${c.account_id}`, c.access_token])
  );
  const externalIdByAccount = new Map(
    (adAccounts ?? []).map((a) => [a.id, a.external_account_id])
  );

  // Meta는 계정 단위로 한 번만 부른다(캠페인마다 부르지 않는다 —
  // fetchMetaInsightsByCampaign 주석 참고). 대상에 있는 계정만 받는다.
  const errors: string[] = [];
  const metaInsights = new Map<string, Map<string, any>>();
  const metaAccountIds = new Set(
    campaigns.filter((c) => c.platform === 'meta').map((c) => c.account_id)
  );
  for (const accountId of metaAccountIds) {
    const externalAccountId = externalIdByAccount.get(accountId);
    const accessToken = [...tokenByAccount.entries()].find(([k]) => k.endsWith(`:${accountId}`))?.[1];
    if (!externalAccountId || !accessToken) continue;
    const result = await fetchMetaInsightsByCampaign(accessToken, externalAccountId);
    if (result.errorMessage) errors.push(`meta:${accountId}: ${result.errorMessage}`);
    metaInsights.set(accountId, result.byCampaign);
  }

  let synced = 0;
  const skipped: Record<string, number> = {};
  const skip = (reason: string) => { skipped[reason] = (skipped[reason] ?? 0) + 1; };

  for (const c of campaigns) {
    const accessToken = tokenByAccount.get(`${c.owner_id}:${c.account_id}`);
    if (!accessToken) { skip('no_connection'); continue; }

    let metrics: Metrics | null = null;

    if (c.platform === 'meta') {
      const raw = metaInsights.get(c.account_id)?.get(String(c.external_campaign_id));
      metrics = raw ? mapMetaInsight(raw) : null;
    } else if (c.platform === 'tiktok') {
      const advertiserId = externalIdByAccount.get(c.account_id);
      if (!advertiserId) { skip('no_advertiser_id'); continue; }
      const report = await fetchTikTokReport(accessToken, advertiserId, c.external_campaign_id);
      if (report.errorMessage) errors.push(`${c.external_campaign_id}: ${report.errorMessage}`);
      metrics = report.metrics ? mapTikTokReport(report.metrics) : null;
    }

    if (!metrics) { skip('no_data'); continue; }

    const { error: upsertError } = await admin.from('performance_records').upsert(
      {
        campaign_id: c.id,
        recorded_at: today,
        source: 'api',
        ...metrics,
      },
      { onConflict: 'campaign_id,recorded_at,source' }
    );

    // 한 캠페인이 실패해도 나머지는 계속 돌린다 — 부분 성공이 전체 실패보다 낫다.
    if (upsertError) {
      console.error('performance_records upsert 실패', { campaignId: c.id, message: upsertError.message });
      skip('upsert_failed');
      continue;
    }
    synced += 1;
  }

  // ============================================================
  // 일별 수집 (performance_daily)
  // ============================================================
  // 대상 선정이 스냅샷과 다르다:
  //  (a) 일별 행이 하나도 없는 캠페인 → **전 기간 backfill**. 연동 전에 끝난
  //      캠페인의 과거(예: 6월)도 이걸로 복원된다 — 누적 스냅샷 차분으로는
  //      만들 수 없는 축이다(연동 전 구간에 스냅샷이 없다).
  //  (b) 이미 있으면 진행 중/종료 POST_END_SYNC_DAYS일 이내만 → **최근 7일
  //      재수집**. 플랫폼이 지표를 사후 정정하므로 같은 날을 덮어쓴다.
  const dailyTargets = (allCampaigns ?? []).filter(
    (c) => !hasDaily.has(c.id) || c.end_date >= cutoffDate
  );

  const pendingDaily: { campaign_id: string; date: string; spend: number; impressions: number | null; clicks: number | null }[] = [];

  // Meta 일별 insights는 시작일이 오늘로부터 37개월 이전이면 요청 전체를
  // 거부한다(#3018 — 실계정 backfill에서 확인: 아주 오래된 캠페인 하나가 계정
  // 창 전체를 실패시켰다). 여유를 두고 36개월로 클램프한다 — 그보다 오래된
  // 구간의 일별은 플랫폼이 주지 않으므로 어차피 받을 수 없는 데이터다.
  const metaLookbackLimit = new Date();
  metaLookbackLimit.setMonth(metaLookbackLimit.getMonth() - 36);
  const metaMinSince = metaLookbackLimit.toISOString().slice(0, 10);

  // Meta: 스냅샷과 마찬가지로 계정마다 한 번. 창은 그 계정 대상 캠페인들이
  // 필요로 하는 범위의 합집합 — backfill 캠페인은 자기 start_date부터,
  // 재수집 캠페인은 cutoffDate부터.
  const metaDailyTargets = dailyTargets.filter((c) => c.platform === 'meta');
  const metaDailyAccounts = new Set(metaDailyTargets.map((c) => c.account_id));
  for (const accountId of metaDailyAccounts) {
    const externalAccountId = externalIdByAccount.get(accountId);
    const accessToken = [...tokenByAccount.entries()].find(([k]) => k.endsWith(`:${accountId}`))?.[1];
    if (!externalAccountId || !accessToken) continue;

    const targets = metaDailyTargets.filter((c) => c.account_id === accountId);
    const since = targets
      .map((c) => (hasDaily.has(c.id) ? (c.start_date > cutoffDate ? c.start_date : cutoffDate) : c.start_date))
      .reduce((min, d) => (d < min ? d : min));
    const clampedSince = since < metaMinSince ? metaMinSince : since;

    const result = await fetchMetaDailyByCampaign(accessToken, externalAccountId, clampedSince, today);
    if (result.errorMessage) {
      // 이 계정의 캠페인들은 행이 없는 채로 남아 다음 실행에서 재시도된다.
      errors.push(`meta-daily:${accountId}: ${result.errorMessage}`);
      continue;
    }

    for (const c of targets) {
      const rows = result.byCampaign.get(String(c.external_campaign_id)) ?? [];
      // 재수집 모드는 최근 창만 남긴다 — 계정 창이 backfill 캠페인 때문에
      // 길어졌을 때 이미 있는 전 기간을 매일 다시 쓰지 않기 위함이다.
      const lowerBound = hasDaily.has(c.id) ? cutoffDate : null;
      for (const r of rows) {
        if (lowerBound && r.date < lowerBound) continue;
        pendingDaily.push({ campaign_id: c.id, ...r });
      }
    }
  }

  // TikTok: 스냅샷과 마찬가지로 캠페인마다 부른다(계정 레벨 일별 분해가 없다).
  for (const c of dailyTargets.filter((t) => t.platform === 'tiktok')) {
    const accessToken = tokenByAccount.get(`${c.owner_id}:${c.account_id}`);
    const advertiserId = externalIdByAccount.get(c.account_id);
    if (!accessToken || !advertiserId) { skip('daily_no_connection'); continue; }

    const isBackfill = !hasDaily.has(c.id);
    const since = isBackfill ? c.start_date : (c.start_date > cutoffDate ? c.start_date : cutoffDate);
    // 종료된 캠페인의 뒷날짜까지 물어보지 않는다 — 창이 늘어나면 chunk 수만 는다.
    const until = c.end_date < today ? c.end_date : today;
    if (since > until) continue;

    const report = await fetchTikTokDaily(accessToken, advertiserId, c.external_campaign_id, since, until);
    if (report.errorMessage) { errors.push(`${c.external_campaign_id}: ${report.errorMessage}`); continue; }
    for (const r of report.rows) pendingDaily.push({ campaign_id: c.id, ...r });
  }

  // 500행 단위로 나눠 upsert한다 — 최초 backfill은 캠페인×일수라 수만 행이
  // 될 수 있고, 한 번에 보내면 요청 한도에 걸릴 수 있다.
  let dailySynced = 0;
  for (let i = 0; i < pendingDaily.length; i += 500) {
    const chunk = pendingDaily.slice(i, i + 500);
    const { error: dailyUpsertError } = await admin
      .from('performance_daily')
      .upsert(chunk, { onConflict: 'campaign_id,date' });
    if (dailyUpsertError) {
      console.error('performance_daily upsert 실패', dailyUpsertError.message);
      errors.push(`performance_daily upsert 실패 — ${dailyUpsertError.message}`);
      continue;
    }
    dailySynced += chunk.length;
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
      fn_name: 'sync-performance',
      status: 'success',
      status_code: 200,
      response: 'self-reported on completion',
      checked_at: new Date().toISOString(),
    });
    if (logError) console.error('sync_runs 자가 기록 실패(동기화는 성공)', logError.message);
  }

  // 실패가 하나라도 있으면 200으로 성공이라 말하지 않는다. cron이 이 상태 코드를 보고
  // sync_runs에 실패로 남기고 재시도한다.
  return new Response(JSON.stringify({ synced, dailySynced, skipped, errors }), {
    status: errors.length > 0 ? 207 : 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
