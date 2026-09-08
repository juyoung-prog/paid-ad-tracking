// GET /auth-tiktok-callback?auth_code=...&state=...
// TikTok이 동의 완료 후 redirect하는 대상. auth_code를 access_token으로 교환하고
// ad_accounts / connections에 저장한 뒤, 프론트("/settings")로 다시 redirect한다.
// 필요한 시크릿: TIKTOK_APP_ID, TIKTOK_APP_SECRET, APP_URL, OWNER_USER_ID
//
// verify_jwt = false로 열려 있다(TikTok의 브라우저 redirect에는 Authorization 헤더가 없다).
// 따라서 사용자 신원을 요청에서 얻을 수 없어 owner_id는 OWNER_USER_ID 시크릿에서 읽는다 —
// 02-ux-flow.md의 "1인 운영 기준" 전제를 그대로 따른 것이다. 다중 사용자로 확장할 때는
// state에 서명된 사용자 id를 실어 보내는 방식으로 바꿔야 한다(appendix-auth-design.md).
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

const TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3';

/** 이 auth_code로 권한을 받은 광고주 목록. advertiser_id가 성과 리포트 호출에 반드시 필요하다. */
async function fetchAuthorizedAdvertisers(appId: string, appSecret: string, accessToken: string) {
  const url = new URL(`${TIKTOK_API}/oauth2/advertiser/get/`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('secret', appSecret);

  const res = await fetch(url.toString(), { headers: { 'Access-Token': accessToken } });
  const json = await res.json();

  // TikTok은 HTTP 200에 body의 code로 실패를 알린다.
  if (json?.code !== 0) {
    console.error('TikTok advertiser/get 실패', { code: json?.code, message: json?.message });
    return [];
  }
  return json?.data?.list ?? [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const authCode = url.searchParams.get('auth_code');
  const stateRaw = url.searchParams.get('state');
  const appUrl = Deno.env.get('APP_URL') ?? '/';

  if (!authCode || !stateRaw) {
    return new Response('Missing auth_code/state', { status: 400, headers: corsHeaders });
  }

  const appId = Deno.env.get('TIKTOK_APP_ID');
  const appSecret = Deno.env.get('TIKTOK_APP_SECRET');
  const ownerId = Deno.env.get('OWNER_USER_ID');

  // connections.owner_id는 not null이고 service_role 호출에서는 auth.uid()가 null이라
  // 이 값이 없으면 토큰 교환이 성공해도 저장 단계에서 반드시 실패한다. 미리 끊는다.
  if (!appId || !appSecret || !ownerId) {
    return new Response(
      JSON.stringify({
        error: 'TIKTOK_APP_ID / TIKTOK_APP_SECRET / OWNER_USER_ID 시크릿이 설정되지 않았습니다.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // state는 accountId 슬러그 평문이다(auth-tiktok-start 주석 참조).
  // 예전 버전이 JSON을 실어 보냈으므로, 이미 나간 인가 링크를 위해 JSON도 계속 받아준다.
  let accountId: string;
  const stateValue = decodeURIComponent(stateRaw).trim();
  if (stateValue.startsWith('{')) {
    try {
      accountId = JSON.parse(stateValue).accountId;
    } catch {
      return new Response('Invalid state', { status: 400, headers: corsHeaders });
    }
  } else {
    accountId = stateValue;
  }
  if (!accountId) return new Response('Invalid state', { status: 400, headers: corsHeaders });

  const tokenRes = await fetch(`${TIKTOK_API}/oauth2/access_token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, secret: appSecret, auth_code: authCode }),
  });
  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson?.data?.access_token;

  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'token exchange failed', detail: tokenJson }), { status: 502, headers: corsHeaders });
  }

  const admin = supabaseAdmin();

  // advertiser_id를 여기서 확보해 ad_accounts에 심는다. 이게 없으면 sync-performance가
  // 모든 TikTok 캠페인을 no_advertiser_id로 건너뛴다 — 수기 입력 UI를 따로 만들 필요가 없도록
  // 인가 직후 플랫폼이 알려주는 값을 그대로 저장한다.
  const advertisers = await fetchAuthorizedAdvertisers(appId, appSecret, accessToken);

  /* 이미 저장된 광고주가 인가 목록에 있으면 **그것을 유지한다**(2026-09-08). 재연결한 TikTok 로그인이 광고주를
     여러 개 가지고 있으면 예전엔 목록의 첫 번째를 골랐는데, 그 바람에 멀쩡히 돌던 광고주(7202…937)가 다른
     광고주(7613…569)로 바뀌어 — 잔액 166 → 0, 기존 캠페인 31개는 새 광고주 것이 아니라 성과가 다시 안 들어온다.
     저장된 광고주가 목록에 없을 때만(권한이 정말 사라진 경우) 첫 번째로 넘어간다. */
  const { data: existingBefore } = await admin
    .from('ad_accounts')
    .select('external_account_id')
    .eq('id', accountId)
    .maybeSingle();
  const keptAdvertiser = existingBefore?.external_account_id
    ? advertisers.find((a: any) => String(a.advertiser_id) === String(existingBefore.external_account_id)) ?? null
    : null;
  const advertiser = keptAdvertiser ?? advertisers[0] ?? null;

  if (advertisers.length > 1) {
    console.warn(keptAdvertiser ? 'TikTok 광고주가 여러 개 인가됨 — 저장된 광고주를 유지한다' : 'TikTok 광고주가 여러 개 인가됨 — 저장된 것이 없어 첫 번째를 쓴다', {
      used: advertiser?.advertiser_id,
      all: advertisers.map((a: any) => a.advertiser_id),
    });
  }

  /* 재연결에서 광고주 조회가 비면 **이미 저장된 값을 지키고** 새 값이 있을 때만
     덮어쓴다. 2026-09-06 재연결 때 advertiser/get이 빈 목록을 돌려줬는데
     그대로 null을 upsert해서 멀쩡히 돌던 advertiser_id가 지워졌다 — 그 뒤
     sync-campaigns는 "external_account_id가 없습니다"로 207, sync-performance는
     TikTok 캠페인 전부를 no_advertiser_id로 건너뛰었다. 토큰 갱신이 목적인
     재연결이 데이터 연결을 끊으면 안 된다. */
  const { data: existing } = await admin
    .from('ad_accounts')
    .select('label, external_account_id')
    .eq('id', accountId)
    .maybeSingle();
  if (!advertiser && existing?.external_account_id) {
    console.warn('TikTok 광고주 조회가 비어 기존 advertiser_id를 유지한다', { accountId, kept: existing.external_account_id });
  }

  // connections.account_id가 ad_accounts(id)를 FK로 참조하므로 순서상 먼저 넣어야 한다.
  const { error: accountError } = await admin.from('ad_accounts').upsert(
    {
      id: accountId,
      owner_id: ownerId,
      platform: 'tiktok',
      region: 'ALL', // TikTok은 지역 분리 없이 통합 운영 (02-ux-flow.md 데이터 모델)
      label: advertiser?.advertiser_name ?? existing?.label ?? 'TikTok - Unified',
      external_account_id: advertiser?.advertiser_id ?? existing?.external_account_id ?? null,
    },
    { onConflict: 'id' }
  );

  if (accountError) {
    return new Response(JSON.stringify({ error: `ad_accounts 저장 실패: ${accountError.message}` }), { status: 500, headers: corsHeaders });
  }

  const { error } = await admin.from('connections').upsert(
    {
      owner_id: ownerId,
      platform: 'tiktok',
      account_id: accountId,
      access_token: accessToken, // 실제 구현 시 pgsodium/vault로 암호화 저장
      refresh_token: tokenJson?.data?.refresh_token ?? null,
      // 재인가 때도 명시적으로 갱신한다. default now()는 최초 insert에만 적용되므로,
      // 이 줄이 없으면 스코프를 늘려 재인가해도 값이 그대로라 반영 여부를 확인할 수 없다.
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'owner_id,account_id' }
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  return Response.redirect(`${appUrl}/settings?connected=tiktok-${accountId}`, 302);
});
