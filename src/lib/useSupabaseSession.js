import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * useSupabaseSession
 *
 * Supabase Auth 세션을 구독한다. 모든 테이블의 RLS가 `owner_id = auth.uid()`라
 * 로그인하지 않으면 쿼리가 에러 없이 빈 배열을 돌려준다 — "데이터가 없다"와
 * "로그인이 안 됐다"가 화면에서 구분되지 않으므로, 데이터를 읽기 전에
 * 세션 유무를 먼저 판정해야 한다.
 *
 * @returns {{ session: object|null, isLoading: boolean }}
 *   isLoading은 최초 세션 복원이 끝나기 전까지 true. 이때 로그인 화면을 그리면
 *   이미 로그인된 사용자에게 로그인 폼이 한 번 깜빡인다.
 *
 * Example usage:
 * const { session, isLoading } = useSupabaseSession();
 */
export function useSupabaseSession() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, isLoading };
}
