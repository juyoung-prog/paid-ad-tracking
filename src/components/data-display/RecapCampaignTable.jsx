import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ScrollArea } from '../container/ScrollArea';
import { CampaignThumbnail } from '../media/CampaignThumbnail';
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
/* 짝 지표(Hook | Hold, CTR | CPC) 사이 — 20px는 한 덩어리로 읽혀 30px로(2026-09-07). 세 개(CTR·CPC·CPA)가
   드는 conversion 줄은 248px 셀에 안 들어가 20px 유지 */
const PAIR_GAP = 3.75;
const TRIPLE_GAP = 2.5;

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

/**
 * 원본 지표 한 줄 — "Reach 151,000 · Plays 250,000". 셀 안 위계의 맨 아래(3차 정보)라 라벨(text.secondary)보다
 * 한 단 더 옅게(secondary의 78% alpha) — 값(13px/600)·순위(초록/주황)와 경쟁하지 않게. text.disabled는
 * AA 미달이라 글에 안 쓴다
 */
function RawLine({ parts }) {
  const shown = parts.filter(([, v]) => v != null);
  if (shown.length === 0) return null;
  return (
    <Typography component="span" sx={(theme) => ({ ...META_SX, color: alpha(theme.palette.text.secondary, 0.78), display: 'block', mb: 0.75, whiteSpace: 'normal' })}>
      {shown.map(([label, v], i) => (
        <Box component="span" key={label} sx={{ whiteSpace: 'nowrap' }}>
          {i > 0 && ' · '}
          {label} <Box component="span" sx={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{v}</Box>
        </Box>
      ))}
    </Typography>
  );
}

/**
 * RecapCampaignTable 컴포넌트
 *
 * 보고서(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표. 이전 보고서의 표 구성을
 * 따른다 — 순위 · 매장 · 캠페인(28px 소재 썸네일 + 단계 이름 + 기간) · 일예산 · 지출 ·
 * 판정 · 영상 반응 · 참여 반응 · 행동. 비율 지표(CPM·Hook·Hold·참여율·CTR·CPC·CPA)마다
 * BenchmarkDelta로 "비슷한 캠페인 대비 어디쯤"이 붙고, 판정 칸은 사람이 고른 값이
 * 없으면 제안값(툴팁 "suggested")을 보여준다.
 *
 * 상호작용은 하나다(2026-09-07): **숫자 줄 어디를 눌러도** onRowClick — 보고서는 이걸로
 * Performance와 같은 캠페인 상세 드로어(성과·페이싱·캠페인 해석·일별 지출)를 연다.
 * 줄 끝 셰브론과 줄 아래 펼침은 찾기 어려워서 뺐고, 해석은 드로어 안으로 옮겼다.
 * 벤치마크 글자(onBenchmarkClick)는 stopPropagation으로 줄 클릭에서 빠진다.
 * selectedId는 타임라인에서 찾아온 줄 표시(옅은 accent 면 + 왼쪽 2px 선)다.
 *
 * 계산은 하지 않는다 — rows는 schema.js buildRecapRows()가 순위·벤치마크·판정
 * 제안까지 끝낸 결과다. 이 컴포넌트는 그 값을 자리에 놓고 utils/format으로
 * 표기만 한다. 문구는 recapStrings에서 꺼낸다.
 *
 * Props:
 * @param {Array<Object>} rows - buildRecapRows().byPlatform[platform] — 한 플랫폼의 행 배열(순위순) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {function} onRowClick - 숫자 줄 클릭 (campaignId) => void. 있으면 줄 전체(#·매장·썸네일·이름·기간·예산·지표·빈 곳)가 버튼이고 Tab/Enter로도 눌린다. hover는 중립 면 140ms [Optional]
 * @param {function} onBenchmarkClick - 벤치마크 줄 클릭 (campaignId, metricKey) => void. 있으면 비교군이 있는 지표의 "top 25%" 글자가 버튼이 된다 — 비교군을 나란히 보는 대화상자를 여는 용도 [Optional]
 * @param {string|null} selectedId - 타임라인에서 찾아온 줄의 campaignId. 그 줄에 옅은 accent 배경 + 왼쪽 2px accent 선 — "내가 고른 캠페인이 이것"이라는 방향 표시 [Optional]
 * @param {string} label - 스크롤 영역의 접근성 이름 [Optional, 기본값: 'Recap campaign table']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignTable rows={byPlatform.meta} onRowClick={(id) => setDetailCampaignId(id)} selectedId={selectedCampaignId} />
 */
export function RecapCampaignTable({ rows, lang = 'en', onRowClick, onBenchmarkClick, selectedId = null, label = 'Recap campaign table', sx }) {
  if (!rows || rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5, ...sx }}>
        {t('recap.table.empty', lang)}
      </Typography>
    );
  }

  const columnWidths = Object.values(COLUMN_WIDTH);
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

  return (
    <ScrollArea label={label} startOffset={COLUMN_WIDTH.rank + COLUMN_WIDTH.store + COLUMN_WIDTH.campaign} edgeStrength="subtle" sx={sx}>
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
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const hasData = row.spend != null || row.impressions != null;
            const verdict = row.note?.verdict ?? row.suggestedVerdict ?? null;
            const isSuggested = !row.note?.verdict && Boolean(row.suggestedVerdict);
            const isConversion = row.goal === 'conversion' || row.goal === 'store_visit';
            const isSelected = selectedId === row.campaignId;
            const stores = String(row.storeCode ?? '').split(/,\s*/).filter(Boolean);
            return (
              <TableRow
                key={row.campaignId}
                id={`recap-row-${row.campaignId}`}
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
                aria-selected={isSelected || undefined}
                sx={(theme) => ({
                  cursor: onRowClick ? 'pointer' : 'default',
                  // 줄 hover는 MUI action.hover(중립) — 140ms로 부드럽게. 지표·순위 색은 그대로
                  transition: theme.transitions.create('background-color', { duration: 140 }),
                  /* 타임라인에서 찾아온 줄 — 옅은 accent 면 + 첫 칸 왼쪽 2px accent 선(inset shadow라 폭·경계선이 안 바뀐다).
                     글자·지표 색은 그대로. hover 위에서도 선택 면·선이 유지되도록 hover까지 함께 지정한다 */
                  ...(isSelected && {
                    '&&, &&:hover': { backgroundColor: alpha(theme.palette.accent.main, 0.06) },
                    '& > td:first-of-type': { boxShadow: `inset 2px 0 0 ${theme.palette.accent.main}` },
                  }),
                  ...(onRowClick && {
                    '&:focus-visible': {
                      outline: '1px solid',
                      outlineColor: 'accent.main',
                      outlineOffset: -1,
                      boxShadow: `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                    },
                  }),
                })}
              >
                <TableCell sx={{ ...CELL_SX, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{row.rank}</TableCell>
                {/* 매장이 여럿인 캠페인("G01, G02, …")은 56px 열을 넘쳐 옆 칸 글자와 겹쳤다 —
                    첫 매장 + "+N" 두 줄로, 전체 목록은 title로. 말줄임(ellipsis)은 안 쓴다:
                    열 안쪽 폭이 24px라 "BF4"도 "B…"가 된다 */}
                <TableCell sx={{ ...CELL_SX, fontWeight: 600, whiteSpace: 'nowrap' }} title={stores.length > 1 ? row.storeCode : undefined}>
                  {stores[0] ?? row.storeCode}
                  {stores.length > 1 && (
                    <Typography component="span" sx={{ ...META_SX, display: 'block', fontWeight: 500 }}>+{stores.length - 1}</Typography>
                  )}
                </TableCell>
                <TableCell sx={CELL_SX}>
                  {/* [썸네일] 이름 / 기간 — 이름이 비슷한 Meta·TikTok 캠페인을 소재로 가른다. 칸 안에 따로 버튼은 없다(줄 전체가 버튼) */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
                    <CampaignThumbnail thumbnailUrl={row.thumbnailUrl} name={row.name} platform={row.platform} size={28} sx={(theme) => ({ borderRadius: `${theme.shape.radius.inlay}px` })} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }} title={row.name}>
                        {row.phaseName}
                      </Typography>
                      <Typography component="span" sx={{ ...META_SX, display: 'block', whiteSpace: 'normal' }}>
                        {dateRangeWithDays(row.startDate, row.endDate)}
                      </Typography>
                    </Box>
                  </Box>
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
                      <Box sx={{ display: 'flex', gap: PAIR_GAP }}>
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
                      <Box sx={{ display: 'flex', gap: isConversion ? TRIPLE_GAP : PAIR_GAP }}>
                        <MetricCell row={row} metricKey="ctr" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                        <MetricCell row={row} metricKey="cpc" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                        {isConversion && <MetricCell row={row} metricKey="cpa" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} />}
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
