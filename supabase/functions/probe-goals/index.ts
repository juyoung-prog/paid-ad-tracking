/**
 * 일회성 검증 함수 — goal 백필이 적용됐는지만 확인한다.
 *
 * 집계 수치만 돌려준다. 캠페인 이름·금액·토큰 등 식별 가능한 데이터는 일절
 * 내보내지 않는다(인증 없이 열리는 함수라 노출 표면을 최소로 유지한다).
 * 확인 즉시 삭제한다.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async () => {
  const { data } = await admin.from('campaigns').select('platform, goal, updated_at');
  const counts: Record<string, number> = {};
  let latestUpdate = '';
  for (const c of data ?? []) {
    const key = `${c.platform}:${c.goal}`;
    counts[key] = (counts[key] ?? 0) + 1;
    if (String(c.updated_at) > latestUpdate) latestUpdate = String(c.updated_at);
  }
  const byGoal: Record<string, number> = {};
  for (const [key, n] of Object.entries(counts)) {
    const goal = key.split(':')[1];
    byGoal[goal] = (byGoal[goal] ?? 0) + n;
  }
  return new Response(
    JSON.stringify({ total: (data ?? []).length, byGoal, byPlatformAndGoal: counts, latestUpdate }, null, 2),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
