import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * useConnections
 *
 * 플랫폼 계정 연결 상태를 읽는다. connections 테이블이 아니라 connections_public
 * 뷰를 읽는다 — 뷰에는 access_token/refresh_token이 없어서 토큰이 브라우저로
 * 절대 내려오지 않는다(05-api-integration.md 아키텍처 다이어그램의 마지막 줄).
 *
 * @returns {{ connections: object[], isLoading: boolean, error: string|null, refresh: function }}
 *   connections 원소: { id, platform, accountId, expiresAt, connectedAt }
 *
 * Example usage:
 * const { connections, isLoading } = useConnections();
 */
export function useConnections() {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 조회만 하고 상태는 건드리지 않는다 — effect 본문의 동기 setState를 피하기 위함
  // (react-hooks/set-state-in-effect).
  const fetchConnections = useCallback(async () => {
    const { data, error: selectError } = await supabase
      .from('connections_public')
      .select('id, platform, account_id, expires_at, connected_at');

    if (selectError) return { errorMessage: selectError.message, rows: null };

    return {
      errorMessage: null,
      rows: (data ?? []).map((row) => ({
        id: row.id,
        platform: row.platform,
        accountId: row.account_id,
        expiresAt: row.expires_at,
        connectedAt: row.connected_at,
      })),
    };
  }, []);

  const applyResult = useCallback((result) => {
    if (result.errorMessage) setError(result.errorMessage);
    else {
      setError(null);
      setConnections(result.rows);
    }
    setIsLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    applyResult(await fetchConnections());
  }, [fetchConnections, applyResult]);

  useEffect(() => {
    // 언마운트된 뒤 도착한 응답으로 상태를 건드리지 않는다.
    let isCancelled = false;
    (async () => {
      const result = await fetchConnections();
      if (!isCancelled) applyResult(result);
    })();

    return () => { isCancelled = true; };
  }, [fetchConnections, applyResult]);

  return { connections, isLoading, error, refresh };
}
