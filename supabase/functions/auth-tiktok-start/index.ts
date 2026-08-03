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

  // state에는 accountId 슬러그만 평문으로 싣는다. JSON을 넣으면 {, ", : 가 들어가는데
  // TikTok 인가 화면이 이 문자들에서 502(System Error)로 죽는 사례가 있었다.
  // 콘솔이 제시하는 예시(state=your_custom_params)도 단순 문자열이다.
  // encodeURIComponent를 직접 걸지 않는다 — 아래 searchParams.set이 이미 인코딩한다.
  const state = 'tiktok-unified';

  const authUrl = new URL('https://business-api.tiktok.com/portal/auth');
  authUrl.searchParams.set('app_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  return Response.redirect(authUrl.toString(), 302);
});
