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

  // 실패가 하나라도 있으면 200으로 성공이라 말하지 않는다. cron이 이 상태 코드를 보고
  // sync_runs에 실패로 남기고 재시도한다.
  return new Response(JSON.stringify({ synced, skipped, errors }), {
    status: errors.length > 0 ? 207 : 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
