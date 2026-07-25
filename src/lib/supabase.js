import { createClient } from '@supabase/supabase-js';

// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY는 실제 Supabase 프로젝트가 생기면
// .env.local에 채운다. anon key만 프론트에 노출한다 — service_role/client secret은
// 절대 여기 두지 않는다(05-api-integration.md, supabase-integration 스킬 원칙 #7, #11).
// 프로젝트가 아직 없으면 두 값 다 undefined라 클라이언트 생성은 되지만 호출 시 에러난다 —
// 그게 맞는 동작이다(실제 연동 전까지는 이 클라이언트를 쓰는 코드가 없어야 함).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
