import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { ScrollArea } from '../container/ScrollArea';
import { BenchmarkDelta } from './BenchmarkDelta';
import { VerdictChip } from './VerdictChip';
import { t, metricLabel } from '../../data/recapStrings';
import { money, count, percent, seconds, dateRangeWithDays, EMPTY } from '../../utils/format';

const fmtPercent = (v) => percent(v, { digits: 2 });

/** 열 폭 — 보고서는 한 화면에 다 보이는 게 목표라 글자 열을 좁게 잡는다 */
const COLUMN_WIDTH = {
  rank: 36,
  store: 56,
  campaign: 220,
  dailyBudget: 88,
  spend: 132,
  verdict: 96,
  video: 224,
  engagement: 176,
  action: 248,
};

const HEAD_SX = { fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'bottom' };
const CELL_SX = { verticalAlign: 'top', py: 1.25 };
const META_SX = { fontSize: 11, color: 'text.secondary', lineHeight: 1.4, whiteSpace: 'nowrap' };

/**
 * 비율 지표 한 칸 — 라벨 위, BenchmarkDelta 아래. 비교군 이름은 stat의 scope를
 * 보고 고른다(phase면 단계 이름, goal이면 goal) — 계산이 아니라 라벨 선택이다.
 */
function MetricCell({ row, metricKey, format, lang }) {
  const stat = row.benchmarks?.[metricKey];
  if (!stat) return null;
  const peerLabel = stat.peerScope === 'phase' ? row.phaseName : row.goal;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="span" sx={{ ...META_SX, display: 'block' }}>{metricLabel(metricKey, lang)}</Typography>
      {/* 중앙값은 툴팁에만 — 셀 폭에서 "▲ top 25% · median 28.51%"는 옆 지표와 겹친다 */}
      <BenchmarkDelta stat={stat} format={format} label={metricLabel(metricKey, lang)} peerLabel={peerLabel} lang={lang} size="sm" hasMedian={false} />
    </Box>
  );
}

/** 원본 지표 한 줄 — "Reach 151,000 · Plays 250,000" */
function RawLine({ parts }) {
  const shown = parts.filter(([, v]) => v != null);
  if (shown.length === 0) return null;
  return (
    <Typography component="span" sx={{ ...META_SX, display: 'block', mb: 0.75, whiteSpace: 'normal' }}>
      {shown.map(([label, v], i) => (
        <Box component="span" key={label} sx={{ whiteSpace: 'nowrap' }}>
          {i > 0 && ' · '}
          {label} <Box component="span" sx={{ color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>{v}</Box>
        </Box>
      ))}
    </Typography>
  );
}

/**
 * RecapCampaignTable 컴포넌트
 *
 * Recap(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표. 이전 보고서의 표 구성을
 * 따른다 — 순위 · 매장 · 캠페인 · 일예산 · 지출 · 판정 · 영상 반응 · 참여 반응 ·
 * 행동. 비율 지표(CPM·Hook·Hold·참여율·CTR·CPC·CPA)마다 BenchmarkDelta로
 * "비슷한 캠페인 대비 어디쯤"이 붙고, 판정 칸은 사람이 고른 값이 없으면 제안값을
 * 점선 칩으로 보여준다.
 *
 * 계산은 하지 않는다 — rows는 schema.js buildRecapRows()가 순위·벤치마크·판정
 * 제안까지 끝낸 결과다. 이 컴포넌트는 그 값을 자리에 놓고 utils/format으로
 * 표기만 한다. 문구는 recapStrings에서 꺼낸다.
 *
 * Props:
 * @param {Array<Object>} rows - buildRecapRows().byPlatform[platform] — 한 플랫폼의 행 배열(순위순) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {function} onRowClick - 행 클릭 핸들러 (campaignId) => void. 있으면 행이 Tab/Enter로 활성화된다 [Optional]
 * @param {string} label - 스크롤 영역의 접근성 이름 [Optional, 기본값: 'Recap campaign table']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignTable rows={byPlatform.meta} onRowClick={(id) => navigate(`/dashboard?campaign=${id}`)} />
 */
export function RecapCampaignTable({ rows, lang = 'en', onRowClick, label = 'Recap campaign table', sx }) {
  if (!rows || rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5, ...sx }}>
        {t('recap.table.empty', lang)}
      </Typography>
    );
  }

  const tableWidth = Object.values(COLUMN_WIDTH).reduce((a, b) => a + b, 0);

  return (
    <ScrollArea label={label} startOffset={COLUMN_WIDTH.rank + COLUMN_WIDTH.store + COLUMN_WIDTH.campaign} sx={sx}>
      <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: tableWidth }}>
        <colgroup>
          {Object.values(COLUMN_WIDTH).map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell sx={HEAD_SX}>{t('recap.table.rank', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.store', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.campaign', lang)}</TableCell>
            <TableCell align="right" sx={HEAD_SX}>{t('recap.table.dailyBudget', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.spend', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.verdict', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.video', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.engagement', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.action', lang)}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const hasData = row.spend != null || row.impressions != null;
            const verdict = row.note?.verdict ?? row.suggestedVerdict ?? null;
            const isSuggested = !row.note?.verdict && Boolean(row.suggestedVerdict);
            const isConversion = row.goal === 'conversion' || row.goal === 'store_visit';
            return (
              <TableRow
                key={row.campaignId}
                hover={Boolean(onRowClick)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row.campaignId) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick(row.campaignId);
                        }
                      }
                    : undefined
                }
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  ...(onRowClick && {
                    '&:focus-visible': {
                      outline: '1px solid',
                      outlineColor: 'accent.main',
                      outlineOffset: -1,
                      boxShadow: (theme) => `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                    },
                  }),
                }}
              >
                <TableCell sx={{ ...CELL_SX, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{row.rank}</TableCell>
                <TableCell sx={{ ...CELL_SX, fontWeight: 600, whiteSpace: 'nowrap' }}>{row.storeCode}</TableCell>
                <TableCell sx={CELL_SX}>
                  <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }} title={row.name}>
                    {row.phaseName}
                  </Typography>
                  <Typography component="span" sx={{ ...META_SX, display: 'block', whiteSpace: 'normal' }}>
                    {dateRangeWithDays(row.startDate, row.endDate)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ ...CELL_SX, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {row.dailyBudget != null ? `${money(row.dailyBudget)}/day` : EMPTY}
                </TableCell>
                <TableCell sx={CELL_SX}>
                  <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', lineHeight: 1.4 }}>
                    {money(row.spend)}
                  </Typography>
                  {hasData && <MetricCell row={row} metricKey="cpm" format={money} lang={lang} />}
                </TableCell>
                <TableCell sx={CELL_SX}>
                  <VerdictChip verdict={verdict} isSuggested={isSuggested} lang={lang} size="sm" />
                </TableCell>
                {!hasData ? (
                  <TableCell colSpan={3} sx={{ ...CELL_SX, color: 'text.secondary' }}>{t('recap.table.noData', lang)}</TableCell>
                ) : (
                  <>
                    <TableCell sx={CELL_SX}>
                      <RawLine parts={[
                        [metricLabel('reach', lang), count(row.reach)],
                        [metricLabel('videoPlays', lang), count(row.videoPlays)],
                        [metricLabel('avgWatch', lang), row.avgWatchSeconds != null ? seconds(row.avgWatchSeconds) : null],
                      ]} />
                      <Box sx={{ display: 'flex', gap: 2.5 }}>
                        <MetricCell row={row} metricKey="hookRate" format={fmtPercent} lang={lang} />
                        <MetricCell row={row} metricKey="holdRate" format={fmtPercent} lang={lang} />
                      </Box>
                    </TableCell>
                    <TableCell sx={CELL_SX}>
                      <RawLine parts={[
                        [metricLabel('likes', lang), count(row.likes)],
                        [metricLabel('comments', lang), count(row.comments)],
                        [metricLabel('shares', lang), count(row.shares)],
                      ]} />
                      <MetricCell row={row} metricKey="engagementRate" format={fmtPercent} lang={lang} />
                    </TableCell>
                    <TableCell sx={CELL_SX}>
                      <RawLine parts={[
                        [metricLabel('clicks', lang), count(row.clicks)],
                        [metricLabel('conversions', lang), count(row.conversions)],
                        [metricLabel('profileVisits', lang), count(row.profileVisits)],
                      ]} />
                      <Box sx={{ display: 'flex', gap: 2.5 }}>
                        <MetricCell row={row} metricKey="ctr" format={fmtPercent} lang={lang} />
                        <MetricCell row={row} metricKey="cpc" format={money} lang={lang} />
                        {isConversion && <MetricCell row={row} metricKey="cpa" format={money} lang={lang} />}
                      </Box>
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
