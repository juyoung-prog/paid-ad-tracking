// pg_cron(진행중 캠페인 매일 + 종료 후 7일간) 또는 "Sync now"가 invoke. external_campaign_id가
// 있는 캠페인만 대상으로 플랫폼 insights/report를 가져와 performance_records에
// source='api'로 upsert한다. 05-api-integration.md "성과 지표 필드 매핑" 표 기준.
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

async function fetchMetaInsights(accessToken: string, campaignId: string) {
  const fields = 'impressions,reach,clicks,spend,video_p25_watched_actions,video_p100_watched_actions,post_engagement,actions';
  const res = await fetch(`https://graph.facebook.com/v19.0/${campaignId}/insights?fields=${fields}&access_token=${accessToken}`);
  const json = await res.json();
  return json.data?.[0] ?? null;
}

// 우리 필드 ↔ Meta Insights 필드 매핑 (05-api-integration.md 표와 동일)
function mapMetaInsight(raw: any) {
  return {
    impressions: raw.impressions ?? null,
    reach: raw.reach ?? null,
    clicks: raw.clicks ?? null,
    spend: raw.spend ?? 0,
    hook_views: raw.video_p25_watched_actions?.[0]?.value ?? null,
    held_views: raw.video_p100_watched_actions?.[0]?.value ?? null,
    engagements: raw.post_engagement ?? null,
    conversions: raw.actions?.find((a: any) => a.action_type === 'offsite_conversion')?.value ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = supabaseAdmin();
  const { data: campaigns, error } = await admin
    .from('campaigns')
    .select('id, platform, external_campaign_id, account_id, connections(access_token)')
    .not('external_campaign_id', 'is', null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  let synced = 0;
  for (const c of campaigns ?? []) {
    const accessToken = c.connections?.[0]?.access_token;
    if (!accessToken || c.platform !== 'meta') continue; // TikTok report 매핑은 동일 패턴으로 추가 예정

    const raw = await fetchMetaInsights(accessToken, c.external_campaign_id);
    if (!raw) continue;

    await admin.from('performance_records').upsert(
      {
        campaign_id: c.id,
        recorded_at: new Date().toISOString().slice(0, 10),
        source: 'api',
        ...mapMetaInsight(raw),
      },
      { onConflict: 'campaign_id,recorded_at' }
    );
    synced += 1;
  }

  return new Response(JSON.stringify({ synced }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
