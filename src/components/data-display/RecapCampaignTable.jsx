import { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
/** 펼침 화살표 열 — renderDetail이 있을 때만 붙는다. 28px 히트 영역 + 오른쪽 여백 */
const EXPAND_WIDTH = 44;
const EXPAND_HIT = 28;

/**
 * 얇은 선 셰브론 — @mui/icons-material의 ExpandMore는 면으로 채운 화살표라 표 안에서
 * 무겁다. MUI SvgIcon에 stroke 경로 하나(Lucide chevron-down 형태)로 그린다 —
 * 아이콘 라이브러리를 늘리지 않는다.
 */
function ThinChevronDownIcon(props) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

const HEAD_SX = { fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'bottom' };
const CELL_SX = { verticalAlign: 'top', py: 1.25 };
const META_SX = { fontSize: 11, color: 'text.secondary', lineHeight: 1.4, whiteSpace: 'nowrap' };

/**
 * 비율 지표 한 칸 — 라벨 위, BenchmarkDelta 아래. 비교군 이름은 stat의 scope를
 * 보고 고른다(phase면 단계 이름, goal이면 goal) — 계산이 아니라 라벨 선택이다.
 */
function MetricCell({ row, metricKey, format, lang, onBenchmarkClick }) {
  const stat = row.benchmarks?.[metricKey];
  if (!stat) return null;
  const peerLabel = stat.peerScope === 'phase' ? row.phaseName : row.goal;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="span" sx={{ ...META_SX, display: 'block' }}>{metricLabel(metricKey, lang)}</Typography>
      {/* 중앙값은 툴팁에만 — 셀 폭에서 "▲ top 25% · median 28.51%"는 옆 지표와 겹친다 */}
      <BenchmarkDelta
        stat={stat}
        format={format}
        label={metricLabel(metricKey, lang)}
        peerLabel={peerLabel}
        lang={lang}
        size="sm"
        hasMedian={false}
        onClick={onBenchmarkClick ? () => onBenchmarkClick(row.campaignId, metricKey) : undefined}
      />
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
          {label} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{v}</Box>
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
 * @param {function} onBenchmarkClick - 벤치마크 줄 클릭 (campaignId, metricKey) => void. 있으면 비교군이 있는 지표의 "top 25%" 글자가 버튼이 된다 — 비교군을 나란히 보는 대화상자를 여는 용도 [Optional]
 * @param {function} renderDetail - (row) => ReactNode. 있으면 줄 오른쪽 끝에 화살표가 붙고, 누르면 그 줄 바로 아래에 반환값이 펼쳐진다(한 번에 한 줄). 캠페인 해석(RecapCampaignInsightPanel)을 숫자 옆에 두는 용도 — 줄 클릭(onRowClick)과는 별개다 [Optional]
 * @param {string} label - 스크롤 영역의 접근성 이름 [Optional, 기본값: 'Recap campaign table']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignTable rows={byPlatform.meta} onRowClick={(id) => navigate(`/dashboard?campaign=${id}`)} />
 */
export function RecapCampaignTable({ rows, lang = 'en', onRowClick, onBenchmarkClick, renderDetail, label = 'Recap campaign table', sx }) {
  // 펼친 줄은 한 번에 하나 — 숫자 줄과 해석 줄이 번갈아 나오면 표가 아니라 목록이 된다
  const [expandedId, setExpandedId] = useState(null);
  const isExpandable = Boolean(renderDetail);
  const toggle = (campaignId) => setExpandedId((current) => (current === campaignId ? null : campaignId));

  if (!rows || rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5, ...sx }}>
        {t('recap.table.empty', lang)}
      </Typography>
    );
  }

  const columnWidths = [...Object.values(COLUMN_WIDTH), ...(isExpandable ? [EXPAND_WIDTH] : [])];
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

  return (
    <ScrollArea label={label} startOffset={COLUMN_WIDTH.rank + COLUMN_WIDTH.store + COLUMN_WIDTH.campaign} sx={sx}>
      <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: tableWidth }}>
        <colgroup>
          {columnWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell sx={HEAD_SX}>{t('recap.table.rank', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.store', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.campaign', lang)}</TableCell>
            <TableCell align="right" sx={HEAD_SX}>{t('recap.table.dailyBudget', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.spend', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>
              {t('recap.table.verdict', lang)}
              {/* 판정이 어디서 오는지는 툴팁 한 줄로 — 표 안에 설명문을 두지 않는다 */}
              <Tooltip title={t('recap.table.verdictHint', lang)} arrow enterTouchDelay={0}>
                <InfoOutlinedIcon sx={(theme) => ({ fontSize: theme.iconSize.inline, color: 'text.disabled', verticalAlign: 'middle', ml: 0.5, cursor: 'help' })} />
              </Tooltip>
            </TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.video', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.engagement', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.action', lang)}</TableCell>
            {isExpandable && <TableCell sx={{ ...HEAD_SX, p: 0 }} aria-label={t('recap.table.expand', lang)} />}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const hasData = row.spend != null || row.impressions != null;
            const verdict = row.note?.verdict ?? row.suggestedVerdict ?? null;
            const isSuggested = !row.note?.verdict && Boolean(row.suggestedVerdict);
            const isConversion = row.goal === 'conversion' || row.goal === 'store_visit';
            const isExpanded = isExpandable && expandedId === row.campaignId;
            const detailId = `recap-detail-${row.campaignId}`;
            return [
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
                  // 펼친 줄은 아래 경계선을 지워 해석 면과 한 덩어리로 읽히게
                  ...(isExpanded && { '& > td': { borderBottom: 0 } }),
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
                  {hasData && <MetricCell row={row} metricKey="cpm" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} />}
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
                        <MetricCell row={row} metricKey="hookRate" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                        <MetricCell row={row} metricKey="holdRate" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                      </Box>
                    </TableCell>
                    <TableCell sx={CELL_SX}>
                      <RawLine parts={[
                        [metricLabel('likes', lang), count(row.likes)],
                        [metricLabel('comments', lang), count(row.comments)],
                        [metricLabel('shares', lang), count(row.shares)],
                      ]} />
                      <MetricCell row={row} metricKey="engagementRate" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                    </TableCell>
                    <TableCell sx={CELL_SX}>
                      <RawLine parts={[
                        [metricLabel('clicks', lang), count(row.clicks)],
                        [metricLabel('conversions', lang), count(row.conversions)],
                        [metricLabel('profileVisits', lang), count(row.profileVisits)],
                      ]} />
                      <Box sx={{ display: 'flex', gap: 2.5 }}>
                        <MetricCell row={row} metricKey="ctr" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                        <MetricCell row={row} metricKey="cpc" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                        {isConversion && <MetricCell row={row} metricKey="cpa" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} />}
                      </Box>
                    </TableCell>
                  </>
                )}
                {/* 조용한 컨트롤 — 기본은 투명, hover에만 옅은 면. 줄 높이는 그대로(히트 영역 28px < 줄 높이) */}
                {isExpandable && (
                  <TableCell sx={{ ...CELL_SX, pl: 0, pr: 1.5, verticalAlign: 'middle' }}>
                    <IconButton
                      aria-label={t(isExpanded ? 'recap.table.collapse' : 'recap.table.expand', lang)}
                      aria-expanded={isExpanded}
                      aria-controls={isExpanded ? detailId : undefined}
                      onClick={(event) => { event.stopPropagation(); toggle(row.campaignId); }}
                      onKeyDown={(event) => event.stopPropagation()}
                      sx={(theme) => ({
                        width: EXPAND_HIT,
                        height: EXPAND_HIT,
                        p: 0,
                        ml: 'auto',
                        display: 'flex',
                        color: 'text.secondary',
                        borderRadius: `${theme.shape.radius.control}px`,
                        transition: theme.transitions.create(['background-color', 'color'], { duration: theme.transitions.duration.shortest }),
                        '@media (hover: hover)': { '&:hover': { backgroundColor: 'action.hover', color: 'text.primary' } },
                      })}
                    >
                      <ThinChevronDownIcon
                        sx={(theme) => ({
                          fontSize: 15,
                          transition: theme.transitions.create('transform', { duration: theme.transitions.duration.shorter }),
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                        })}
                      />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>,
              isExpanded && (
                /* 해석 줄 — 표의 일부다. 카드가 아니라 한 단 가라앉은 면(surface.sunken)과 경계선 하나 */
                <TableRow key={`${row.campaignId}-detail`} id={detailId}>
                  <TableCell colSpan={columnWidths.length} sx={{ p: 0, backgroundColor: 'surface.sunken', borderTop: '1px solid', borderColor: 'divider' }}>
                    {renderDetail(row)}
                  </TableCell>
                </TableRow>
              ),
            ];
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
