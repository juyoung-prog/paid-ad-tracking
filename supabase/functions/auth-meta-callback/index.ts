// GET /auth-meta-callback?code=...&state=...
// Meta가 로그인/동의 완료 후 redirect하는 대상. code를 장기 access_token으로 교환하고
// ad_accounts / connections에 저장한 뒤, 프론트("/settings")로 다시 redirect한다.
// 필요한 시크릿: META_CLIENT_ID, META_CLIENT_SECRET, META_REDIRECT_URI, APP_URL, OWNER_USER_ID
//
// verify_jwt = false로 열려 있다(Meta의 브라우저 redirect에는 Authorization 헤더가 없다).
// 따라서 사용자 신원을 요청에서 얻을 수 없어 owner_id는 OWNER_USER_ID 시크릿에서 읽는다 —
// 02-ux-flow.md의 "1인 운영 기준" 전제를 따른 것으로, auth-tiktok-callback과 동일하다.
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

const GRAPH = 'https://graph.facebook.com/v19.0';

/** 이 토큰으로 접근 가능한 광고 계정 목록. account_id는 act_ 접두사가 없는 순수 id다. */
async function fetchAdAccounts(accessToken: string) {
  const url = new URL(`${GRAPH}/me/adaccounts`);
  url.searchParams.set('fields', 'account_id,name');
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString());
  const json = await res.json();

  if (json?.error) {
    console.error('Meta /me/adaccounts 실패', json.error);
    return [];
  }
  return json?.data ?? [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');
  const appUrl = Deno.env.get('APP_URL') ?? '/';

  if (!code || !stateRaw) {
    return new Response('Missing code/state', { status: 400, headers: corsHeaders });
  }

  const clientId = Deno.env.get('META_CLIENT_ID');
  const clientSecret = Deno.env.get('META_CLIENT_SECRET');
  const redirectUri = Deno.env.get('META_REDIRECT_URI');
  const ownerId = Deno.env.get('OWNER_USER_ID');

  // connections.owner_id는 not null이고 service_role 호출에서는 auth.uid()가 null이라
  // 이 값이 없으면 토큰 교환이 성공해도 저장 단계에서 반드시 실패한다. 미리 끊는다.
  if (!clientId || !clientSecret || !redirectUri || !ownerId) {
    return new Response(
      JSON.stringify({
        error: 'META_CLIENT_ID / META_CLIENT_SECRET / META_REDIRECT_URI / OWNER_USER_ID 시크릿이 설정되지 않았습니다.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let accountId: string;
  let region: string;
  try {
    const parsed = JSON.parse(decodeURIComponent(stateRaw).trim());
    accountId = parsed.accountId;
    region = parsed.region ?? 'ALL';
  } catch {
    return new Response('Invalid state', { status: 400, headers: corsHeaders });
  }
  if (!accountId) return new Response('Invalid state', { status: 400, headers: corsHeaders });

  // 1) 단기 code → 단기 access_token 교환
  const tokenRes = await fetch(
    `${GRAPH}/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
  );
  const shortLived = await tokenRes.json();
  if (!shortLived.access_token) {
    return new Response(JSON.stringify({ error: 'token exchange failed', detail: shortLived }), { status: 502, headers: corsHeaders });
  }

  // 2) 단기 토큰 → 장기 토큰(60일) 교환 — Meta는 단기 토큰을 그대로 오래 쓰지 않는다
  const longLivedRes = await fetch(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLived.access_token}`
  );
  const longLived = await longLivedRes.json();
  const accessToken = longLived.access_token ?? shortLived.access_token;
  const expiresAt = new Date(Date.now() + (longLived.expires_in ?? 5184000) * 1000).toISOString();

  const admin = supabaseAdmin();

  // 3) ad_accounts 확보 — connections.account_id가 이 테이블을 FK로 참조하므로 먼저 넣어야 한다.
  //
  // TikTok과 달리 external_account_id를 항상 자동 확정할 수는 없다. Meta 계정 하나에
  // 광고 계정이 여러 개 붙어 있으면 그중 어느 것이 "조지아"인지는 플랫폼이 모르는 우리 쪽
  // 사업 정보다. 그래서 딱 하나일 때만 자동으로 채우고, 여러 개면 비워둔 채 후보를 로그로
  // 남긴다(사용자가 /settings에서 지정). 이미 지정된 값이 있으면 절대 덮어쓰지 않는다.
  const { data: existing } = await admin
    .from('ad_accounts')
    .select('label, external_account_id')
    .eq('id', accountId)
    .maybeSingle();

  let externalAccountId: string | null = existing?.external_account_id ?? null;
  let label = existing?.label ?? accountId;

  if (!externalAccountId) {
    const metaAccounts = await fetchAdAccounts(accessToken);
    if (metaAccounts.length === 1) {
      externalAccountId = metaAccounts[0].account_id;
      label = metaAccounts[0].name ?? label;
    } else if (metaAccounts.length > 1) {
      console.warn('Meta 광고 계정이 여러 개라 자동 지정하지 않는다 — /settings에서 선택 필요', {
        accountId,
        candidates: metaAccounts.map((a: any) => ({ id: a.account_id, name: a.name })),
      });
    }
  }

  const { error: accountError } = await admin.from('ad_accounts').upsert(
    {
      id: accountId,
      owner_id: ownerId,
      platform: 'meta',
      region,
      label,
      external_account_id: externalAccountId,
    },
    { onConflict: 'id' }
  );

  if (accountError) {
    return new Response(JSON.stringify({ error: `ad_accounts 저장 실패: ${accountError.message}` }), { status: 500, headers: corsHeaders });
  }

  const { error } = await admin.from('connections').upsert(
    {
      owner_id: ownerId,
      platform: 'meta',
      account_id: accountId,
      access_token: accessToken, // 실제 구현 시 pgsodium/vault로 암호화 저장
      expires_at: expiresAt,
      // 재인가 때도 명시적으로 갱신한다. default now()는 최초 insert에만 적용된다.
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'owner_id,account_id' }
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  return Response.redirect(`${appUrl}/settings?connected=meta-${accountId}`, 302);
});
