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

/** performance_records에 넣는 지표 필드. 플랫폼별 매퍼가 반드시 이 형태로 반환한다. */
type Metrics = {
  impressions: number | null;
  reach: number | null;
  clicks: number | null;
  spend: number;
  hook_views: number | null;
  held_views: number | null;
  engagements: number | null;
  conversions: number | null;
};

/** 플랫폼 API는 지표를 문자열로 주는 경우가 많다(TikTok은 전부 문자열). 숫자로 정규화한다. */
function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ============================================================
// Meta
// ============================================================

async function fetchMetaInsights(accessToken: string, campaignId: string) {
  const fields = 'impressions,reach,clicks,spend,video_p25_watched_actions,video_p100_watched_actions,post_engagement,actions';
  const res = await fetch(`https://graph.facebook.com/v19.0/${campaignId}/insights?fields=${fields}&access_token=${accessToken}`);
  const json = await res.json();
  return json.data?.[0] ?? null;
}

// 우리 필드 ↔ Meta Insights 필드 매핑 (05-api-integration.md 표와 동일)
function mapMetaInsight(raw: any): Metrics {
  return {
    impressions: num(raw.impressions),
    reach: num(raw.reach),
    clicks: num(raw.clicks),
    spend: num(raw.spend) ?? 0,
    hook_views: num(raw.video_p25_watched_actions?.[0]?.value),
    held_views: num(raw.video_p100_watched_actions?.[0]?.value),
    engagements: num(raw.post_engagement),
    conversions: num(raw.actions?.find((a: any) => a.action_type === 'offsite_conversion')?.value),
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
const TIKTOK_METRICS = [
  'impressions',
  'reach',
  'clicks',
  'spend',
  'video_watched_2s',
  'video_watched_6s',
  'likes',
  'comments',
  'shares',
  'conversion',
];

async function fetchTikTokReport(accessToken: string, advertiserId: string, campaignId: string) {
  const url = new URL('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/');
  url.searchParams.set('advertiser_id', advertiserId);
  url.searchParams.set('report_type', 'BASIC');
  url.searchParams.set('data_level', 'AUCTION_CAMPAIGN');
  url.searchParams.set('dimensions', JSON.stringify(['campaign_id']));
  url.searchParams.set('metrics', JSON.stringify(TIKTOK_METRICS));
  // 캠페인 시작 이후 누적값을 받는다 — Meta insights도 기간 지정 없이 누적을 주므로
  // 두 플랫폼이 같은 "그 시점까지의 누적 스냅샷" 의미를 갖는다.
  url.searchParams.set('query_lifetime', 'true');
  url.searchParams.set('filtering', JSON.stringify([
    { field_name: 'campaign_ids', filter_type: 'IN', filter_value: JSON.stringify([campaignId]) },
  ]));

  const res = await fetch(url.toString(), { headers: { 'Access-Token': accessToken } });
  const json = await res.json();

  // TikTok은 HTTP 200에 body의 code로 실패를 알린다 — res.ok만 보면 에러를 놓친다.
  if (json?.code !== 0) {
    console.error('TikTok report 실패', { campaignId, code: json?.code, message: json?.message });
    return null;
  }
  return json?.data?.list?.[0]?.metrics ?? null;
}

// 우리 필드 ↔ TikTok Report 필드 매핑 (05-api-integration.md 표 기준).
// engagements: TikTok은 Meta의 post_engagement 같은 단일 합계 지표를 캠페인 레벨에서
// 주지 않으므로 좋아요/댓글/공유를 더해 근사한다. 셋 다 없으면 null(0으로 만들지 않는다 —
// "상호작용이 0"과 "지표를 못 받았다"는 다르고, 후자를 0으로 쓰면 대시보드가 거짓말을 한다).
function mapTikTokReport(raw: any): Metrics {
  const interactions = [num(raw.likes), num(raw.comments), num(raw.shares)];
  const hasInteractions = interactions.some((v) => v !== null);

  return {
    impressions: num(raw.impressions),
    reach: num(raw.reach),
    clicks: num(raw.clicks),
    spend: num(raw.spend) ?? 0,
    hook_views: num(raw.video_watched_2s),
    held_views: num(raw.video_watched_6s),
    engagements: hasInteractions ? interactions.reduce<number>((sum, v) => sum + (v ?? 0), 0) : null,
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

  const { data: campaigns, error: campaignsError } = await admin
    .from('campaigns')
    .select('id, owner_id, platform, account_id, external_campaign_id, start_date, end_date')
    .not('external_campaign_id', 'is', null)
    .lte('start_date', today)
    .gte('end_date', cutoffDate);

  if (campaignsError) {
    return new Response(JSON.stringify({ error: campaignsError.message }), { status: 500, headers: corsHeaders });
  }

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

  let synced = 0;
  const skipped: Record<string, number> = {};
  const skip = (reason: string) => { skipped[reason] = (skipped[reason] ?? 0) + 1; };

  for (const c of campaigns ?? []) {
    const accessToken = tokenByAccount.get(`${c.owner_id}:${c.account_id}`);
    if (!accessToken) { skip('no_connection'); continue; }

    let metrics: Metrics | null = null;

    if (c.platform === 'meta') {
      const raw = await fetchMetaInsights(accessToken, c.external_campaign_id);
      metrics = raw ? mapMetaInsight(raw) : null;
    } else if (c.platform === 'tiktok') {
      const advertiserId = externalIdByAccount.get(c.account_id);
      if (!advertiserId) { skip('no_advertiser_id'); continue; }
      const raw = await fetchTikTokReport(accessToken, advertiserId, c.external_campaign_id);
      metrics = raw ? mapTikTokReport(raw) : null;
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

  return new Response(JSON.stringify({ synced, skipped }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
