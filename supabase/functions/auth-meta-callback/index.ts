// GET /auth-meta-callback?code=...&state=...
// Meta가 로그인/동의 완료 후 redirect하는 대상. code를 access_token으로 교환하고
// connections 테이블에 저장한 뒤, 프론트("/settings")로 다시 redirect한다.
// 필요한 시크릿: META_CLIENT_ID, META_CLIENT_SECRET, META_REDIRECT_URI, APP_URL
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');
  const appUrl = Deno.env.get('APP_URL') ?? '/';

  if (!code || !stateRaw) {
    return new Response('Missing code/state', { status: 400, headers: corsHeaders });
  }

  const { accountId } = JSON.parse(decodeURIComponent(stateRaw));

  const clientId = Deno.env.get('META_CLIENT_ID')!;
  const clientSecret = Deno.env.get('META_CLIENT_SECRET')!;
  const redirectUri = Deno.env.get('META_REDIRECT_URI')!;

  // 1) 단기 code → 단기 access_token 교환
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
  );
  const shortLived = await tokenRes.json();
  if (!shortLived.access_token) {
    return new Response(JSON.stringify({ error: 'token exchange failed', detail: shortLived }), { status: 502, headers: corsHeaders });
  }

  // 2) 단기 토큰 → 장기 토큰(60일) 교환 — Meta는 단기 토큰을 그대로 오래 쓰지 않는다
  const longLivedRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLived.access_token}`
  );
  const longLived = await longLivedRes.json();

  const expiresAt = new Date(Date.now() + (longLived.expires_in ?? 5184000) * 1000).toISOString();

  // TODO: 이 owner_id는 원래 프론트가 auth-meta-start를 호출할 때 Authorization 헤더로
  // 넘긴 사용자 세션에서 가져와야 한다 — 지금은 구조만 잡아둔 상태(appendix-auth-design.md에서 구체화).
  const admin = supabaseAdmin();
  const { error } = await admin.from('connections').upsert({
    platform: 'meta',
    account_id: accountId,
    access_token: longLived.access_token, // 실제 구현 시 pgsodium/vault로 암호화 저장
    expires_at: expiresAt,
  }, { onConflict: 'owner_id,account_id' });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  return Response.redirect(`${appUrl}/settings?connected=meta-${accountId}`, 302);
});
