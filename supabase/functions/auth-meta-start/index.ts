// GET /auth-meta-start?account_id=meta-ga
// 프론트("Connect Meta Account" 버튼)가 invoke하면 Meta 로그인/동의 화면 URL로 redirect한다.
// 필요한 시크릿(실제 앱 등록 후 설정): supabase secrets set META_CLIENT_ID=... META_REDIRECT_URI=...
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const clientId = Deno.env.get('META_CLIENT_ID');
  const redirectUri = Deno.env.get('META_REDIRECT_URI'); // 예: https://{project}.supabase.co/functions/v1/auth-meta-callback
  if (!clientId || !redirectUri) {
    return new Response(
      JSON.stringify({ error: 'META_CLIENT_ID/META_REDIRECT_URI가 설정되지 않았습니다 — Meta for Developers 앱 등록 후 supabase secrets set으로 등록하세요.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(req.url);
  const accountId = url.searchParams.get('account_id') ?? '';

  // state에 accountId를 실어서 콜백에서 어떤 AdAccount(meta-ga/meta-fl)에 연결하는지 복원한다.
  // CSRF 방지를 위해 실제 구현에서는 서명된 랜덤 nonce를 함께 넣고 콜백에서 검증해야 한다
  // (appendix-auth-design.md에서 구체화 — 지금은 구조만 잡아둔 상태).
  const state = encodeURIComponent(JSON.stringify({ accountId }));

  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'ads_read');
  authUrl.searchParams.set('state', state);

  return Response.redirect(authUrl.toString(), 302);
});
