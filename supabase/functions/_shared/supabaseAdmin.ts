import { createClient } from 'npm:@supabase/supabase-js@2';

// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY는 Supabase가 모든 Edge Function 환경에
// 자동으로 주입한다 — `supabase secrets set`으로 직접 등록할 필요 없음.
// service_role 클라이언트는 RLS를 우회하므로 Edge Function(서버) 안에서만 쓴다.
// 절대 프론트로 이 클라이언트나 키를 넘기지 않는다.
export function supabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}
