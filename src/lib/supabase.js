import { createClient } from '@supabase/supabase-js';

// anon key만 프론트에 노출한다 — service_role/client secret은 절대 여기 두지 않는다
// (05-api-integration.md, supabase-integration 스킬 원칙 #7, #11).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vite는 빌드 시점에 이 값들을 코드에 박아 넣는다. 배포 환경에 변수를 등록하지 않은 채
// 빌드하면 문자열 "undefined"가 박혀서, 앱은 정상적으로 뜨고 로그인 화면까지 나온 다음
// 요청 단계에서야 알 수 없는 네트워크 에러로 실패한다 — 원인이 환경변수라는 걸
// 알아내기 어렵다. 그래서 여기서 즉시, 무엇을 어디에 넣어야 하는지까지 말하고 끊는다.
if (!url || !anonKey || url === 'undefined' || anonKey === 'undefined') {
  throw new Error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 빌드에 포함되지 않았습니다.\n' +
    '로컬은 .env.local에, Vercel은 Settings → Environment Variables에 등록한 뒤\n' +
    '빌드 캐시를 끄고 다시 배포하세요(값은 빌드 시점에 번들에 박힙니다).'
  );
}

export const supabase = createClient(url, anonKey);
