import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/** 화면에 보여줄 최근 실행 개수. 전부 가져올 이유가 없다. */
const RECENT_LIMIT = 20;

/**
 * useSyncRuns
 *
 * 자동 동기화 실행 기록을 읽는다. cron이 하루 1회만 도는 구조라 한 번 실패하면
 * 그날 데이터가 통째로 비는데, 기록을 화면에 보여주지 않으면 실패했다는 사실
 * 자체를 알 방법이 없다(실제로 엣지 게이트웨이의 산발적 500을 세 번 관측했다).
 *
 * @param {boolean} isEnabled - false면 조회하지 않는다(Storybook처럼 백엔드 없이 렌더할 때) [Optional, 기본값: true]
 * @returns {{ runs: object[], lastSuccessAt: string|null, recentFailures: object[], isLoading: boolean, error: string|null, refresh: function }}
 *
 * Example usage:
 * const { lastSuccessAt, recentFailures } = useSyncRuns();
 */
export function useSyncRuns(isEnabled = true) {
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [error, setError] = useState(null);

  // 조회만 하고 상태는 건드리지 않는다 — effect 본문의 동기 setState를 피하기 위함
  // (react-hooks/set-state-in-effect).
  const fetchRuns = useCallback(async () => {
    const { data, error: selectError } = await supabase
      .from('sync_runs')
      .select('id, fn_name, attempt, status, status_code, response, started_at, checked_at')
      .order('id', { ascending: false })
      .limit(RECENT_LIMIT);

    if (selectError) return { errorMessage: selectError.message, rows: null };

    return {
      errorMessage: null,
      rows: (data ?? []).map((row) => ({
        id: row.id,
        fnName: row.fn_name,
        attempt: row.attempt,
        status: row.status,
        statusCode: row.status_code,
        response: row.response,
        startedAt: row.started_at,
        checkedAt: row.checked_at,
      })),
    };
  }, []);

  const applyResult = useCallback((result) => {
    if (result.errorMessage) setError(result.errorMessage);
    else {
      setError(null);
      setRuns(result.rows);
    }
    setIsLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!isEnabled) return;
    setIsLoading(true);
    applyResult(await fetchRuns());
  }, [isEnabled, fetchRuns, applyResult]);

  useEffect(() => {
    if (!isEnabled) return undefined;
    let isCancelled = false;
    (async () => {
      const result = await fetchRuns();
      if (!isCancelled) applyResult(result);
    })();
    return () => { isCancelled = true; };
  }, [isEnabled, fetchRuns, applyResult]);

  const lastSuccessAt = runs.find((r) => r.status === 'success')?.checkedAt ?? null;

  // 마지막 성공 이후의 실패만 보여준다. 이미 뒤이어 성공한 실패까지 계속 띄우면
  // 지금 손댈 게 없는데도 문제가 있는 것처럼 보인다(재시도가 이미 복구한 경우).
  const lastSuccessId = runs.find((r) => r.status === 'success')?.id ?? -1;
  const recentFailures = runs.filter((r) => r.status === 'failed' && r.id > lastSuccessId);

  return { runs, lastSuccessAt, recentFailures, isLoading, error, refresh };
}
