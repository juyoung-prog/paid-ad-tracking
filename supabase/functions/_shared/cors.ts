// 모든 Edge Function이 공유하는 CORS 헤더. 이 앱의 프론트엔드(Vite dev/prod origin)에서만
// invoke 가능하도록 허용 — 필요 시 실제 배포 도메인으로 좁힌다.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
