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
import { PAGE_GUTTER_X } from './paidAdsPageUtils';

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
 * 만료까지 남은 일수와 만료 여부.
 *
 * 남은 일수는 올림한다 — 내림하면 "23시간 뒤 만료"가 0일이 되어 아직 하루 남았는데도
 * "오늘 만료"로 보인다. 대신 만료 여부는 계산된 일수가 아니라 시각을 직접 비교한다.
 * 올림만 쓰면 1시간 전에 만료된 토큰이 0일로 올라와 "오늘 만료"로 보이기 때문이다.
 *
 * 만료 시각이 없으면(TikTok처럼 영구 토큰) null을 돌려주고 아무 경고도 하지 않는다.
 */
function getExpiry(value) {
  if (!value) return { remainingDays: null, isExpired: false };
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = new Date(value).getTime() - Date.now();
  return { remainingDays: Math.ceil(diff / msPerDay), isExpired: diff <= 0 };
}

/**
 * 만료 며칠 전부터 경고할지.
 *
 * Meta 사용자 토큰은 60일짜리고 refresh_token이 없어(플랫폼 정책) 사람이 다시
 * 인증하는 것 외엔 갱신 수단이 없다. 만료된 뒤에 알면 그날 동기화는 이미 비어 있다.
 * 2주면 잊고 지나가도 한 번쯤 설정 화면을 볼 여유가 있다.
 */
const EXPIRY_WARNING_DAYS = 14;

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

  // 만료됐거나 곧 만료되는 연결. 상단 경고와 목록 칩이 같은 판정을 쓰도록 여기서 한 번 계산한다.
  const expiringConnections = CONNECT_TARGETS.map((target) => {
    const connection = connectionByAccountId.get(target.accountId);
    const { remainingDays, isExpired } = getExpiry(connection?.expiresAt);
    return {
      label: accountById.get(target.accountId)?.label ?? target.label,
      remainingDays,
      isExpired,
    };
  }).filter((c) => c.remainingDays !== null && c.remainingDays <= EXPIRY_WARNING_DAYS);

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
      setSyncState({ isRunning: false, message: `Sync failed: ${failure.message}`, severity: 'error' });
      return;
    }

    await Promise.all([refreshStore(), refreshConnections(), refreshRuns()]);
    setSyncState({
      isRunning: false,
      message: `Sync complete — ${performanceRes?.data?.synced ?? 0} performance record${(performanceRes?.data?.synced ?? 0) === 1 ? '' : 's'} updated`,
      severity: 'success',
    });
  };

  /* 좌우 여백은 다른 화면과 같은 기준선(PAGE_GUTTER_X)을 쓴다 — 예전엔 이 화면만
     여백이 0이라 레일에 딱 붙어 시작했다. box-sizing이 border-box라 maxWidth 720은
     여백을 포함한 값이다(안쪽 폭은 그만큼 좁아지지만 줄길이는 여전히 읽기 좋다). */
  return (
    <Box sx={ { maxWidth: 720, px: PAGE_GUTTER_X, py: 3 } }>
      <Stack spacing={ 1 } sx={ { mb: 3 } }>
        <Typography variant="h5" component="h1">Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Connect an ad platform account and campaigns and performance sync in daily.
        </Typography>
      </Stack>

      { error && <Alert severity="error" sx={ { mb: 2 } }>{ error }</Alert> }
      { syncState.message && (
        <Alert severity={ syncState.severity } sx={ { mb: 2 } }>{ syncState.message }</Alert>
      ) }

      {/* 목록 안의 칩만으로는 스크롤해야 보인다. 손댈 게 있으면 맨 위에서 한 번 말한다.
          Meta 토큰은 60일마다 만료되는데 자동 갱신 수단이 없어(플랫폼 정책) 사람이
          다시 인증해야 하고, 만료된 뒤에 알면 그날 동기화는 이미 비어 있다. */}
      { expiringConnections.length > 0 && (
        <Alert severity={ expiringConnections.some((c) => c.isExpired) ? 'error' : 'warning' } sx={ { mb: 2 } }>
          { expiringConnections.map((c) => c.label).join(', ') }
          { expiringConnections.some((c) => c.isExpired) ? ' has expired' : ' expires soon' }.
          Reconnect below — once expired, the daily sync pulls nothing.
        </Alert>
      ) }

      <Paper elevation={ 0 } sx={ { border: 1, borderColor: 'divider' } }>
        <Stack divider={ <Divider /> }>
          { CONNECT_TARGETS.map((target) => {
            const account = accountById.get(target.accountId);
            const connection = connectionByAccountId.get(target.accountId);
            const isConnected = Boolean(connection);
            const { remainingDays, isExpired } = getExpiry(connection?.expiresAt);
            const isExpiringSoon = !isExpired && remainingDays !== null && remainingDays <= EXPIRY_WARNING_DAYS;

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
                      label={ isConnected ? 'Connected' : 'Not connected' }
                      color={ isConnected ? 'success' : 'default' }
                      variant={ isConnected ? 'filled' : 'outlined' }
                    />
                    {/* 만료는 "연결됨" 옆에 붙여야 읽힌다 — 아래 캡션에만 날짜를 두면
                        연결됐다는 초록 칩만 보고 지나친다. */}
                    { isExpired && <Chip size="small" color="error" label="Expired — reconnect required" /> }
                    { isExpiringSoon && (
                      <Chip
                        size="small"
                        color="warning"
                        label={ remainingDays <= 1 ? 'Expires soon' : `Expires in ${remainingDays}d` }
                      />
                    ) }
                  </Stack>

                  <Typography variant="caption" color="text.secondary" component="div">
                    { account?.externalAccountId
                      ? `Advertiser ID ${account.externalAccountId}`
                      : 'Advertiser ID unknown — we fetch it from the platform once connected' }
                  </Typography>

                  { isConnected && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      { `Connected ${formatDateTime(connection.connectedAt)}` }
                      { connection.expiresAt && ` · Expires ${formatDateTime(connection.expiresAt)}` }
                    </Typography>
                  ) }
                </Box>

                {/* 손댈 필요가 있는 연결은 버튼도 채워진 형태로 올려 눈에 띄게 한다. */}
                <Button
                  variant={ !isConnected || isExpired || isExpiringSoon ? 'contained' : 'outlined' }
                  color={ isExpired ? 'error' : 'primary' }
                  href={ startUrl(target) }
                  disabled={ isLoading }
                  sx={ { flexShrink: 0 } }
                >
                  { isConnected ? 'Reconnect' : 'Connect' }
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
          The daily sync failed { recentFailures.length } time{ recentFailures.length === 1 ? '' : 's' } recently
          { recentFailures[0].statusCode ? ` (last response ${recentFailures[0].statusCode})` : '' }.
          Try running it manually with "Sync now" below.
        </Alert>
      ) }

      <Stack direction="row" spacing={ 2 } sx={ { mt: 3, alignItems: 'center' } }>
        <Button
          variant="outlined"
          onClick={ handleSyncNow }
          disabled={ syncState.isRunning || connections.length === 0 }
          startIcon={ syncState.isRunning ? <CircularProgress size={ 16 } /> : null }
        >
          { syncState.isRunning ? 'Syncing…' : 'Sync now' }
        </Button>
        <Box>
          <Typography variant="caption" color="text.secondary" component="div">
            The daily sync runs at 09:00 UTC (campaigns) / 09:30 UTC (performance).
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            { lastSuccessAt
              ? `Last success ${formatDateTime(lastSuccessAt)}`
              : 'The daily sync has not succeeded yet.' }
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
