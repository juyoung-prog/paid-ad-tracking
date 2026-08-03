// pg_cron(1일 1회) 또는 프론트 "Sync now" 버튼이 invoke. 연결된 모든 계정의 캠페인 목록을
// 가져와 campaigns 테이블에 upsert한다(external_campaign_id 기준). 05-api-integration.md
// "왜 웹훅이 아니라 폴링인가" 참고 — 두 플랫폼 다 캠페인 변경 웹훅을 제공하지 않는다.
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

async function fetchMetaCampaigns(accessToken: string, externalAccountId: string) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/act_${externalAccountId}/campaigns?fields=id,name,status,start_time,stop_time&access_token=${accessToken}`
  );
  const json = await res.json();
  return json.data ?? [];
}

async function fetchTikTokCampaigns(accessToken: string, advertiserId: string) {
  const res = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${advertiserId}`,
    { headers: { 'Access-Token': accessToken } }
  );
  const json = await res.json();
  return json?.data?.list ?? [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = supabaseAdmin();

  // ad_accounts를 임베드로 끌어오지 않고 따로 읽는다 — PostgREST의 to-one 임베드는
  // supabase-js 타입 추론에서 배열로 잡혀 deno check(배포 시 실행됨)를 통과하지 못한다.
  const [{ data: connections, error }, { data: adAccounts, error: accError }] = await Promise.all([
    admin.from('connections').select('owner_id, platform, account_id, access_token'),
    admin.from('ad_accounts').select('id, external_account_id'),
  ]);

  if (error || accError) {
    return new Response(JSON.stringify({ error: error?.message ?? accError?.message }), { status: 500, headers: corsHeaders });
  }

  const externalIdByAccount = new Map(
    (adAccounts ?? []).map((a) => [a.id, a.external_account_id])
  );

  const results: Record<string, number> = {};

  for (const conn of connections ?? []) {
    const externalAccountId = externalIdByAccount.get(conn.account_id);
    if (!externalAccountId) continue;

    const raw =
      conn.platform === 'meta'
        ? await fetchMetaCampaigns(conn.access_token, externalAccountId)
        : await fetchTikTokCampaigns(conn.access_token, externalAccountId);

    // 플랫폼 캠페인을 우리 스키마로 매핑 — 신규 필드(targetScope/targetStoreIds/goal 등)는
    // 플랫폼 API에 없으므로 처음 동기화될 때는 기본값으로 채우고 사용자가 채워 넣어야 한다.
    for (const item of raw) {
      await admin.from('campaigns').upsert(
        {
          owner_id: conn.owner_id,
          platform: conn.platform,
          account_id: conn.account_id,
          external_campaign_id: item.id,
          name: item.name,
        },
        { onConflict: 'external_campaign_id' }
      );
    }
    results[`${conn.platform}:${conn.account_id}`] = raw.length;
  }

  return new Response(JSON.stringify({ synced: results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
