// GET /auth-tiktok-callback?auth_code=...&state=...
// TikTok이 동의 완료 후 redirect하는 대상. auth_code를 access_token으로 교환하고
// connections 테이블에 저장한 뒤, 프론트("/settings")로 다시 redirect한다.
// 필요한 시크릿: TIKTOK_APP_ID, TIKTOK_APP_SECRET, APP_URL
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const authCode = url.searchParams.get('auth_code');
  const stateRaw = url.searchParams.get('state');
  const appUrl = Deno.env.get('APP_URL') ?? '/';

  if (!authCode || !stateRaw) {
    return new Response('Missing auth_code/state', { status: 400, headers: corsHeaders });
  }

  const { accountId } = JSON.parse(decodeURIComponent(stateRaw));

  const appId = Deno.env.get('TIKTOK_APP_ID')!;
  const appSecret = Deno.env.get('TIKTOK_APP_SECRET')!;

  const tokenRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, secret: appSecret, auth_code: authCode }),
  });
  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson?.data?.access_token;

  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'token exchange failed', detail: tokenJson }), { status: 502, headers: corsHeaders });
  }

  // TODO: owner_id는 auth-meta-callback과 동일하게 실제 사용자 세션에서 가져와야 한다
  // (appendix-auth-design.md에서 구체화).
  const admin = supabaseAdmin();
  const { error } = await admin.from('connections').upsert({
    platform: 'tiktok',
    account_id: accountId,
    access_token: accessToken, // 실제 구현 시 pgsodium/vault로 암호화 저장
    refresh_token: tokenJson?.data?.refresh_token ?? null,
  }, { onConflict: 'owner_id,account_id' });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  return Response.redirect(`${appUrl}/settings?connected=tiktok-${accountId}`, 302);
});
