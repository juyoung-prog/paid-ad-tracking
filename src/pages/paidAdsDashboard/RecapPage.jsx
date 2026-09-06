import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { PageContainer } from '../../components/layout/PageContainer';
import { BackendErrorBanner } from '../../components/data-display/BackendErrorBanner';
import { LanguageSwitch } from '../../components/input/LanguageSwitch';
import { usePaidAdsStore } from './usePaidAdsStore';
import { PAGE_GUTTER_X, SECTION_CARD_SX, PLATFORM_LABEL } from './paidAdsPageUtils';
import { buildRecapEvents, RECAP_DEFAULT_LANG, RECAP_LANG } from '../../data/schema';
import { t } from '../../data/recapStrings';
import { money, dateRange } from '../../utils/format';

/**
 * RecapPage
 *
 * 캠페인 종료 후 결과 보고(Recap)의 이벤트 목록(/recap). 이벤트(campaignGroup)
 * 하나가 보고서 하나다 — 최근에 끝난 이벤트가 위로 오고, 행을 누르면
 * /recap/{event}로 간다. 보고서 상태(Draft/Final/Not started)는 2단계에서
 * 저장이 붙기 전까지 전부 Not started다.
 *
 * Reports(진행 확인)와 목적이 달라 별도 메뉴다 — 02-ux-flow 시나리오 7.
 * 목록 계산(buildRecapEvents)은 schema.js가 하고 여기는 자리에 놓는다.
 */
export function RecapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { campaigns, performanceRecords, eventRecaps, isLoading, error, refresh } = usePaidAdsStore();
  const langParam = searchParams.get('lang');
  const lang = Object.values(RECAP_LANG).includes(langParam) ? langParam : RECAP_DEFAULT_LANG;
  const langQuery = lang === RECAP_DEFAULT_LANG ? '' : `?lang=${lang}`;
  const events = isLoading ? [] : buildRecapEvents(campaigns, performanceRecords, eventRecaps);

  return (
    <PageContainer maxWidth={false} sx={{ py: 3, px: PAGE_GUTTER_X }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="display" component="h1">{t('recap.title', lang)}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 720 }}>
            {t('recap.list.subtitle', lang)}
          </Typography>
        </Box>
        <LanguageSwitch
          value={lang}
          onChange={(next) => setSearchParams(next === RECAP_DEFAULT_LANG ? {} : { lang: next }, { replace: true })}
          sx={{ flexShrink: 0 }}
        />
      </Box>

      {error && <BackendErrorBanner error={error} onRetry={refresh} sx={{ mb: 2 }} />}

      {isLoading && (
        <Box aria-label="Loading recaps" role="status">
          {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1 }} />)}
        </Box>
      )}

      {!isLoading && events.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          {t('recap.list.empty', lang)}
        </Typography>
      )}

      {!isLoading && events.length > 0 && (
        <Box sx={SECTION_CARD_SX}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('recap.list.column.event', lang)}</TableCell>
                <TableCell>{t('recap.list.column.period', lang)}</TableCell>
                <TableCell align="right">{t('recap.list.column.campaigns', lang)}</TableCell>
                <TableCell align="right">{t('recap.list.column.spend', lang)}</TableCell>
                <TableCell>{t('recap.list.column.status', lang)}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => {
                const go = () => navigate(`/recap/${encodeURIComponent(event.eventName)}${langQuery}`);
                return (
                  <TableRow
                    key={event.eventName}
                    hover
                    tabIndex={0}
                    onClick={go}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }}
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td': { borderBottom: 0 },
                      '&:focus-visible': {
                        outline: '1px solid',
                        outlineColor: 'accent.main',
                        outlineOffset: -1,
                        boxShadow: (theme) => `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography component="span" sx={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{event.eventName}</Typography>
                      <Typography component="span" sx={{ display: 'block', fontSize: 11, color: 'text.secondary' }}>
                        {[event.stores.join(', ') || null, event.platforms.map((p) => PLATFORM_LABEL[p] ?? p).join(' + ')].filter(Boolean).join(' · ')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateRange(event.startDate, event.endDate)}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{event.campaignCount}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{money(event.spend)}</TableCell>
                    <TableCell sx={{ color: event.status === 'final' ? 'success.main' : 'text.secondary', fontWeight: event.status ? 600 : 400 }}>
                      {t(event.status ? `recap.status.${event.status}` : 'recap.status.none', lang)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </PageContainer>
  );
}
