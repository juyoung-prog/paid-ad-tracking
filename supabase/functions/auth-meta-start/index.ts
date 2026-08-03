// GET /auth-meta-start?account_id=meta-ga&region=GA
// 프론트("Connect Meta Account" 버튼)가 invoke하면 Meta 로그인/동의 화면 URL로 redirect한다.
// 필요한 시크릿(실제 앱 등록 후 설정): supabase secrets set META_CLIENT_ID=... META_REDIRECT_URI=...
import { corsHeaders } from '../_shared/cors.ts';

/** ad_accounts.region enum과 동일. 잘못된 값이면 콜백의 저장 단계에서 터지므로 여기서 막는다. */
const REGIONS = ['GA', 'FL', 'ALL'];

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
  const accountId = url.searchParams.get('account_id');
  const region = url.searchParams.get('region') ?? 'ALL';

  // Meta는 TikTok과 달리 우리 쪽 광고 계정이 여럿(meta-ga / meta-fl)이라 어디에 연결하는지
  // 호출자가 지정해야 한다. 없으면 콜백이 ad_accounts 행을 만들 수 없다.
  if (!accountId) {
    return new Response(
      JSON.stringify({ error: 'account_id 쿼리 파라미터가 필요합니다 (예: ?account_id=meta-ga&region=GA).' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (!REGIONS.includes(region)) {
    return new Response(
      JSON.stringify({ error: `region은 ${REGIONS.join(' / ')} 중 하나여야 합니다.` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // state에 accountId/region을 실어 콜백에서 복원한다.
  // encodeURIComponent를 직접 걸지 않는다 — 아래 searchParams.set이 이미 인코딩하므로
  // 중복으로 걸면 state에 %25가 섞여 전달된다.
  //
  // CSRF 방지를 위해 실제 운영에서는 서명된 랜덤 nonce를 함께 넣고 콜백에서 검증해야 한다
  // (appendix-auth-design.md에서 구체화 — 지금은 구조만 잡아둔 상태).
  const state = JSON.stringify({ accountId, region });

  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'ads_read');
  authUrl.searchParams.set('state', state);

  return Response.redirect(authUrl.toString(), 302);
});
