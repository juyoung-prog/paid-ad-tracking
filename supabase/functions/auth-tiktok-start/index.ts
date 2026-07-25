// GET /auth-tiktok-start
// "Connect TikTok Account" 버튼이 invoke하면 TikTok for Business 로그인/동의 화면으로 redirect.
// 필요한 시크릿: TIKTOK_APP_ID, TIKTOK_REDIRECT_URI
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const appId = Deno.env.get('TIKTOK_APP_ID');
  const redirectUri = Deno.env.get('TIKTOK_REDIRECT_URI'); // 예: https://{project}.supabase.co/functions/v1/auth-tiktok-callback
  if (!appId || !redirectUri) {
    return new Response(
      JSON.stringify({ error: 'TIKTOK_APP_ID/TIKTOK_REDIRECT_URI가 설정되지 않았습니다 — TikTok for Business 앱 등록 후 supabase secrets set으로 등록하세요.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 우리 계정 구조상 TikTok은 tiktok-unified 하나뿐이라 accountId를 state에 실을 필요는
  // 없지만, 추후 계정이 늘어날 가능성을 감안해 동일한 state 패턴을 유지한다.
  const state = encodeURIComponent(JSON.stringify({ accountId: 'tiktok-unified' }));

  const authUrl = new URL('https://business-api.tiktok.com/portal/auth');
  authUrl.searchParams.set('app_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  return Response.redirect(authUrl.toString(), 302);
});
