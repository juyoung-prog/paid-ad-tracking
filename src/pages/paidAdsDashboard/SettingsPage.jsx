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
import { INVOICE_WARNING_RATIO, BALANCE_RUNWAY_WARNING_DAYS, balanceRunwayDays } from '../../data/schema';
import { money, moneyWhole, dateTime } from '../../utils/format';

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

/** 플랫폼 표기는 한 곳에서만 정한다 — 원본 값('tiktok')을 그대로 쓰면 브랜드 표기와 어긋난다. */
const PLATFORM_LABEL = { meta: 'Meta', tiktok: 'TikTok' };

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/** OAuth 시작 URL. 브라우저를 통째로 보내야 한다 — fetch로 부르면 리다이렉트를 따라갈 수 없다. */
function startUrl(target) {
  /* TikTok도 account_id를 넘긴다. 예전엔 안 넘겼고 auth-tiktok-start가
     'tiktok-unified'를 하드코딩했는데, DB 계정을 목록에 병합하면서부터는
     두 번째 TikTok 계정 줄의 Connect를 눌러도 엉뚱하게 tiktok-unified의
     토큰이 갱신되는 경로가 생겼다 — 누른 줄은 계속 Not connected로 남는다. */
  if (target.platform === 'tiktok') return `${FUNCTIONS_BASE}/auth-tiktok-start?account_id=${encodeURIComponent(target.accountId)}`;
  return `${FUNCTIONS_BASE}/auth-meta-start?account_id=${target.accountId}&region=${target.region}`;
}

/**
 * 동기화 시각 표기. 구현은 utils/format.js의 dateTime이 갖는다 — 로케일을
 * en-US로 고정하는 이유(인자 없는 toLocaleString()이 브라우저 로케일을 타서
 * 영어 UI 문장 안에 "2026. 8. 4. 오전 9:58"이 섞였다)도 그쪽에 함께 있다.
 *
 * 값이 없으면 이 화면은 줄 자체를 안 그리므로 '—'가 아니라 null이 필요하다.
 */
function formatDateTime(value) {
  return value ? dateTime(value) : null;
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
  // campaigns·today는 선불 잔액이 며칠치인지 계산하는 데 쓴다(진행중 캠페인의
  // 일일 예산 합이 분모).
  const { adAccounts, campaigns, today, refresh: refreshStore } = usePaidAdsStore();
  const { connections, isLoading, error, refresh: refreshConnections } = useConnections();
  const { lastSuccessAt, recentFailures, refresh: refreshRuns } = useSyncRuns();
  const [syncState, setSyncState] = useState({ isRunning: false, message: null, severity: 'info' });

  const accountById = new Map(adAccounts.map((a) => [a.id, a]));
  const connectionByAccountId = new Map(connections.map((c) => [c.accountId, c]));

  /* 화면에 그릴 계정 목록 = 고정 연결 대상 + DB에 있는 그 밖의 계정.
     CONNECT_TARGETS만 그리면, 나중에 추가된 광고 계정이 실제로 동기화되고 있는데도
     이 화면에는 아예 안 나온다 — 연결 상태도 만료일도 볼 수 없고 재연결도 못 한다
     (실제로 meta-bm 계정을 붙였더니 캠페인 33건이 들어오는데 화면에는 없었다).
     "무엇을 연결할 수 있는가"는 고정 구성이 맞지만, "무엇이 연결돼 있는가"는
     DB가 진실이다. */
  const extraTargets = adAccounts
    .filter((a) => !CONNECT_TARGETS.some((t) => t.accountId === a.id))
    .map((a) => ({ accountId: a.id, platform: a.platform, region: a.region, label: a.label }));
  const connectTargets = [...CONNECT_TARGETS, ...extraTargets];

  // 만료됐거나 곧 만료되는 연결. 상단 경고와 목록 칩이 같은 판정을 쓰도록 여기서 한 번 계산한다.
  const expiringConnections = connectTargets.map((target) => {
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
    <Box sx={ (theme) => ({ maxWidth: theme.layout.content.default, px: PAGE_GUTTER_X, py: 3 }) }>
      <Stack spacing={ 1 } sx={ { mb: 3 } }>
        <Typography variant="h5" component="h1">Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your ad platform accounts. Campaigns and performance then sync automatically once a day.
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
          { connectTargets.map((target) => {
            const account = accountById.get(target.accountId);
            const connection = connectionByAccountId.get(target.accountId);
            const isConnected = Boolean(connection);
            const { remainingDays, isExpired } = getExpiry(connection?.expiresAt);
            /* 문턱을 모르면 판단하지 않는다 — 플랫폼이 문턱을 API로 주지 않아
               사람이 넣는 값이고, 없는 걸 지어내면 근거 없는 경고가 된다. */
            const runway = account ? balanceRunwayDays(account, campaigns, today) : null;
            const isBalanceLow = runway != null && runway <= BALANCE_RUNWAY_WARNING_DAYS;
            const isInvoiceDue =
              account?.balanceDue != null &&
              account?.invoiceThreshold > 0 &&
              account.balanceDue >= account.invoiceThreshold * INVOICE_WARNING_RATIO;
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
                    <Typography variant="title">{ account?.label ?? target.label }</Typography>
                    {/* 플랫폼은 칩으로 못 박는다 — 라벨은 플랫폼이 연결 후 내려주는
                        계정명으로 덮이는데(예: TikTok이 'BeautyMaster03140808'을 준다)
                        거기엔 플랫폼 표시가 없어서 어느 플랫폼 계정인지 알 수 없었다. */}
                    <Chip size="small" variant="outlined" label={ PLATFORM_LABEL[target.platform] ?? target.platform } />
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

                  {/* 청구 상태 — 캠페인 지출을 더해서는 나오지 않는 계정 단위 값이라
                      플랫폼에서 직접 읽어온다. 값이 없으면 줄 자체를 안 그린다
                      ("$0 청구 예정"으로 읽히면 안 된다). */}
                  {/* 선불 잔액(TikTok) — Meta의 미납액과 부호가 반대라 문구도 다르다.
                      남은 일수를 같이 말한다: 금액만으로는 며칠치인지 알 수 없고,
                      "$0이 되면"을 기다리면 광고가 멈춘 뒤다. */}
                  { account?.balanceAvailable != null && (
                    <Typography
                      variant="caption"
                      component="div"
                      sx={ { color: isBalanceLow ? 'error.main' : 'text.secondary', fontWeight: isBalanceLow ? 600 : 400 } }
                    >
                      { `Balance ${money(account.balanceAvailable)}` }
                      { runway != null ? ` · about ${Math.floor(runway)} day${Math.floor(runway) === 1 ? '' : 's'} left` : '' }
                      { isBalanceLow ? ' — top up soon' : '' }
                    </Typography>
                  ) }

                  { account?.balanceDue != null && (
                    <Typography
                      variant="caption"
                      component="div"
                      sx={ { color: isInvoiceDue ? 'warning.main' : 'text.secondary', fontWeight: isInvoiceDue ? 600 : 400 } }
                    >
                      { `Amount due ${money(account.balanceDue)}` }
                      { account.invoiceThreshold ? ` of ${moneyWhole(account.invoiceThreshold)} threshold` : '' }
                      { isInvoiceDue ? ' — invoice due soon' : '' }
                    </Typography>
                  ) }
                </Box>

                {/* 손댈 필요가 있는 연결은 버튼도 채워진 형태로 올려 눈에 띄게 한다. */}
                <Button
                  variant={ !isConnected || isExpired || isExpiringSoon ? 'contained' : 'outlined' }
                  color={ isExpired ? 'error' : 'primary' }
                  href={ startUrl(target) }
                  disabled={ isLoading }
                  sx={ { flexShrink: 0, boxShadow: 'none' } }
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
