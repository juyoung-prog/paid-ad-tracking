import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';

import { supabase } from '../../lib/supabase';
import { usePaidAdsStore } from './usePaidAdsStore';
import { useConnections } from './useConnections';
import { useSyncRuns } from './useSyncRuns';

/**
 * 연결 가능한 광고 계정 목록. ad_accounts 테이블은 "연결이 끝난 뒤에" 채워지므로
 * (OAuth 콜백이 만든다) 이 화면은 테이블만 봐서는 아무것도 못 그린다.
 * 무엇을 연결할 수 있는지는 우리 쪽 고정 구성이라 여기에 둔다.
 */
const CONNECT_TARGETS = [
  { accountId: 'tiktok-unified', platform: 'tiktok', region: 'ALL', label: 'TikTok — Unified' },
  { accountId: 'meta-ga', platform: 'meta', region: 'GA', label: 'Meta — Georgia' },
  { accountId: 'meta-fl', platform: 'meta', region: 'FL', label: 'Meta — Florida' },
];

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/** OAuth 시작 URL. 브라우저를 통째로 보내야 한다 — fetch로 부르면 리다이렉트를 따라갈 수 없다. */
function startUrl(target) {
  if (target.platform === 'tiktok') return `${FUNCTIONS_BASE}/auth-tiktok-start`;
  return `${FUNCTIONS_BASE}/auth-meta-start?account_id=${target.accountId}&region=${target.region}`;
}

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

/**
 * SettingsPage
 *
 * 플랫폼 계정 연결 관리 화면(/settings). 02-ux-flow.md 시나리오 6에 해당한다.
 * 토큰은 화면에 절대 오지 않는다 — connections_public 뷰만 읽는다.
 *
 * Props: 없음
 *
 * Example usage:
 * <Route path="/settings" element={ <SettingsPage /> } />
 */
export function SettingsPage() {
  const { adAccounts, refresh: refreshStore } = usePaidAdsStore();
  const { connections, isLoading, error, refresh: refreshConnections } = useConnections();
  const { lastSuccessAt, recentFailures, refresh: refreshRuns } = useSyncRuns();
  const [syncState, setSyncState] = useState({ isRunning: false, message: null, severity: 'info' });

  const accountById = new Map(adAccounts.map((a) => [a.id, a]));
  const connectionByAccountId = new Map(connections.map((c) => [c.accountId, c]));

  const handleSyncNow = async () => {
    setSyncState({ isRunning: true, message: null, severity: 'info' });

    // 캠페인 목록을 먼저 맞춘 다음 성과를 가져온다 — 순서가 바뀌면 방금 새로 들어온
    // 캠페인의 성과를 이번 회차에 놓친다.
    const campaignsRes = await supabase.functions.invoke('sync-campaigns');
    const performanceRes = campaignsRes.error
      ? null
      : await supabase.functions.invoke('sync-performance');

    const failure = campaignsRes.error ?? performanceRes?.error;
    if (failure) {
      setSyncState({ isRunning: false, message: `동기화 실패: ${failure.message}`, severity: 'error' });
      return;
    }

    await Promise.all([refreshStore(), refreshConnections(), refreshRuns()]);
    setSyncState({
      isRunning: false,
      message: `동기화 완료 — 성과 ${performanceRes?.data?.synced ?? 0}건 갱신`,
      severity: 'success',
    });
  };

  return (
    <Box sx={ { maxWidth: 720 } }>
      <Stack spacing={ 1 } sx={ { mb: 3 } }>
        <Typography variant="h5" component="h1">Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          광고 플랫폼 계정을 연결하면 캠페인과 성과가 매일 자동으로 들어옵니다.
        </Typography>
      </Stack>

      { error && <Alert severity="error" sx={ { mb: 2 } }>{ error }</Alert> }
      { syncState.message && (
        <Alert severity={ syncState.severity } sx={ { mb: 2 } }>{ syncState.message }</Alert>
      ) }

      <Paper elevation={ 0 } sx={ { border: 1, borderColor: 'divider' } }>
        <Stack divider={ <Divider /> }>
          { CONNECT_TARGETS.map((target) => {
            const account = accountById.get(target.accountId);
            const connection = connectionByAccountId.get(target.accountId);
            const isConnected = Boolean(connection);

            return (
              <Stack
                key={ target.accountId }
                direction={ { xs: 'column', sm: 'row' } }
                spacing={ 2 }
                sx={ { p: 2, alignItems: { sm: 'center' } } }
              >
                <Box sx={ { flexGrow: 1, minWidth: 0 } }>
                  <Stack direction="row" spacing={ 1 } sx={ { alignItems: 'center', mb: 0.5 } }>
                    <Typography variant="subtitle1">{ account?.label ?? target.label }</Typography>
                    <Chip
                      size="small"
                      label={ isConnected ? '연결됨' : '연결 안 됨' }
                      color={ isConnected ? 'success' : 'default' }
                      variant={ isConnected ? 'filled' : 'outlined' }
                    />
                  </Stack>

                  <Typography variant="caption" color="text.secondary" component="div">
                    { account?.externalAccountId
                      ? `광고주 ID ${account.externalAccountId}`
                      : '광고주 ID 미확인 — 연결하면 플랫폼에서 자동으로 받아옵니다' }
                  </Typography>

                  { isConnected && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      { `연결 시각 ${formatDateTime(connection.connectedAt)}` }
                      { connection.expiresAt && ` · 만료 ${formatDateTime(connection.expiresAt)}` }
                    </Typography>
                  ) }
                </Box>

                <Button
                  variant={ isConnected ? 'outlined' : 'contained' }
                  href={ startUrl(target) }
                  disabled={ isLoading }
                  sx={ { flexShrink: 0 } }
                >
                  { isConnected ? '다시 연결' : '연결하기' }
                </Button>
              </Stack>
            );
          }) }
        </Stack>
      </Paper>

      {/* 자동 동기화가 실패해도 화면에 아무 흔적이 없으면 아무도 모른다 —
          cron은 하루 1회라 한 번 놓치면 그날 데이터가 통째로 빈다.
          재시도로 이미 복구된 실패는 띄우지 않는다(마지막 성공 이후 것만). */}
      { recentFailures.length > 0 && (
        <Alert severity="warning" sx={ { mt: 3 } }>
          최근 자동 동기화가 { recentFailures.length }회 실패했습니다
          { recentFailures[0].statusCode ? ` (마지막 응답 ${recentFailures[0].statusCode})` : '' }.
          아래 "지금 동기화"로 직접 실행해보세요.
        </Alert>
      ) }

      <Stack direction="row" spacing={ 2 } sx={ { mt: 3, alignItems: 'center' } }>
        <Button
          variant="outlined"
          onClick={ handleSyncNow }
          disabled={ syncState.isRunning || connections.length === 0 }
          startIcon={ syncState.isRunning ? <CircularProgress size={ 16 } /> : null }
        >
          { syncState.isRunning ? '동기화 중…' : '지금 동기화' }
        </Button>
        <Box>
          <Typography variant="caption" color="text.secondary" component="div">
            자동 동기화는 매일 UTC 09:00(캠페인) / 09:30(성과)에 실행됩니다.
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            { lastSuccessAt
              ? `마지막 성공 ${formatDateTime(lastSuccessAt)}`
              : '아직 자동 동기화가 성공한 기록이 없습니다.' }
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
