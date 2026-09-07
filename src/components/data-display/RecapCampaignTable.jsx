import { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
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
/** 펼침 화살표 열 — renderDetail이 있을 때만 붙는다. 28px 히트 영역 + 오른쪽 여백 12px */
const EXPAND_WIDTH = 40;
const EXPAND_HIT = 28;

/**
 * 얇은 선 셰브론 — Lucide chevron-down과 같은 기하(polyline 6 9 → 12 15 → 18 9, stroke 1.5,
 * 둥근 끝). @mui/icons-material의 ExpandMore는 면으로 채운 화살표라 표 안에서 무겁고,
 * MUI SvgIcon은 svg에 fill:currentColor를 걸어 선 아이콘이 삼각형처럼 보일 수 있어
 * 날것 svg로 그린다. 아이콘 라이브러리를 늘리지 않는다.
 */
function ThinChevronDownIcon({ sx }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      sx={{ display: 'block', flexShrink: 0, fill: 'none', ...sx }}
    >
      <polyline points="6 9 12 15 18 9" fill="none" />
    </Box>
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
 * 같은 모양의 칩(툴팁 "suggested")으로 보여준다.
 *
 * 계산은 하지 않는다 — rows는 schema.js buildRecapRows()가 순위·벤치마크·판정
 * 제안까지 끝낸 결과다. 이 컴포넌트는 그 값을 자리에 놓고 utils/format으로
 * 표기만 한다. 문구는 recapStrings에서 꺼낸다.
 *
 * Props:
 * @param {Array<Object>} rows - buildRecapRows().byPlatform[platform] — 한 플랫폼의 행 배열(순위순) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {function} onRowClick - 숫자 줄 클릭 핸들러 (campaignId) => void. 있으면 줄 전체(#·매장·썸네일·이름·기간·예산·지표·빈 곳)가 버튼이고 Tab/Enter로도 눌린다 — 보고서는 이걸로 Performance와 같은 캠페인 상세 드로어를 연다(2026-09-07: 썸네일·이름만 누르던 것은 찾기 어려웠다). 화살표·벤치마크 버튼·펼친 해석 줄은 예외(stopPropagation / 별도 줄) [Optional]
 * @param {function} onCampaignClick - 썸네일·캠페인 이름만 버튼으로 만들 때 (campaignId) => void. onRowClick이 있으면 필요 없다 [Optional]
 * @param {function} onBenchmarkClick - 벤치마크 줄 클릭 (campaignId, metricKey) => void. 있으면 비교군이 있는 지표의 "top 25%" 글자가 버튼이 된다 — 비교군을 나란히 보는 대화상자를 여는 용도 [Optional]
 * @param {string|null} selectedId - 타임라인에서 찾아온 줄의 campaignId. 그 줄(숫자 줄만, 해석 줄 제외)에 옅은 accent 배경 + 왼쪽 2px accent 선 — "내가 고른 캠페인이 이것"이라는 방향 표시. 펼침(expandedId)과는 별개 상태라 선택이 풀려도 해석은 접히지 않는다 [Optional]
 * @param {string|null} expandedId - 펼친 줄의 campaignId. 주면 제어형(타임라인 행 클릭으로 페이지가 펼치는 용도) — onExpandedChange로 바뀐 값을 돌려받는다. 안 주면 표가 스스로 기억한다 [Optional]
 * @param {function} onExpandedChange - (campaignId|null) => void. expandedId와 짝 [Optional]
 * @param {function} renderDetail - (row) => ReactNode. 있으면 줄 오른쪽 끝에 화살표가 붙고, 누르면 그 줄 바로 아래에 반환값이 펼쳐진다(한 번에 한 줄). 캠페인 해석(RecapCampaignInsightPanel)을 숫자 옆에 두는 용도 — 줄 클릭(onRowClick)과는 별개다 [Optional]
 * @param {string} label - 스크롤 영역의 접근성 이름 [Optional, 기본값: 'Recap campaign table']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignTable rows={byPlatform.meta} onRowClick={(id) => navigate(`/dashboard?campaign=${id}`)} />
 */
export function RecapCampaignTable({ rows, lang = 'en', onRowClick, onCampaignClick, onBenchmarkClick, renderDetail, selectedId = null, expandedId: controlledExpandedId, onExpandedChange, label = 'Recap campaign table', sx }) {
  // 펼친 줄은 한 번에 하나 — 숫자 줄과 해석 줄이 번갈아 나오면 표가 아니라 목록이 된다.
  // expandedId prop이 오면 그 값을 따르고(제어형), 없으면 내부 상태.
  const [ownExpandedId, setOwnExpandedId] = useState(null);
  const isControlled = controlledExpandedId !== undefined;
  const expandedId = isControlled ? controlledExpandedId : ownExpandedId;
  const isExpandable = Boolean(renderDetail);
  const toggle = (campaignId) => {
    const next = expandedId === campaignId ? null : campaignId;
    if (!isControlled) setOwnExpandedId(next);
    onExpandedChange?.(next);
  };
  // 숫자 줄 전체 = 드로어(onRowClick), 화살표 = 펼침 — 화살표·벤치마크 버튼은 stopPropagation으로 줄 클릭에서 빠지고,
  // 펼친 해석 줄은 별도 <tr>이라 애초에 줄 클릭 대상이 아니다
  const handleRow = onRowClick;

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
            const isSelected = selectedId === row.campaignId;
            const stores = String(row.storeCode ?? '').split(/,\s*/).filter(Boolean);
            const detailId = `recap-detail-${row.campaignId}`;
            return [
              <TableRow
                key={row.campaignId}
                id={`recap-row-${row.campaignId}`}
                hover={Boolean(handleRow)}
                tabIndex={handleRow ? 0 : undefined}
                onClick={handleRow ? () => handleRow(row.campaignId) : undefined}
                onKeyDown={
                  handleRow
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleRow(row.campaignId);
                        }
                      }
                    : undefined
                }
                aria-selected={isSelected || undefined}
                sx={(theme) => ({
                  cursor: handleRow ? 'pointer' : 'default',
                  // 줄 hover는 MUI action.hover(중립) — 140ms로 부드럽게. 지표·순위 색은 그대로
                  transition: theme.transitions.create('background-color', { duration: 140 }),
                  // 펼친 줄은 아래 경계선을 지워 해석 면과 한 덩어리로 읽히게
                  ...(isExpanded && { '& > td': { borderBottom: 0 } }),
                  /* 타임라인에서 찾아온 줄 — 옅은 accent 면 + 첫 칸 왼쪽 2px accent 선(inset shadow라 폭·경계선이 안 바뀐다).
                     글자·지표 색은 그대로. hover 위에서도 선택 면·선이 유지되도록 hover까지 함께 지정한다 */
                  ...(isSelected && {
                    '&&, &&:hover': { backgroundColor: alpha(theme.palette.accent.main, 0.06) },
                    '& > td:first-of-type': { boxShadow: `inset 2px 0 0 ${theme.palette.accent.main}` },
                  }),
                  ...(handleRow && {
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
                  {/* [썸네일] 이름 / 기간 — 썸네일과 이름만 버튼(드로어), 기간은 평문. 이름이 비슷한 Meta·TikTok 캠페인을 소재로 가른다 */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
                    <Box
                      component={onCampaignClick ? 'button' : 'span'}
                      type={onCampaignClick ? 'button' : undefined}
                      aria-label={onCampaignClick ? `${row.phaseName} — ${t('recap.table.openCampaign', lang)}` : undefined}
                      onClick={onCampaignClick ? (event) => { event.stopPropagation(); onCampaignClick(row.campaignId); } : undefined}
                      sx={(theme) => ({
                        display: 'block', p: 0, m: 0, border: 0, background: 'none', flexShrink: 0,
                        borderRadius: `${theme.shape.radius.inlay}px`,
                        cursor: onCampaignClick ? 'pointer' : 'default',
                        ...(onCampaignClick && { '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${theme.palette.accent.ring}` } }),
                      })}
                    >
                      <CampaignThumbnail thumbnailUrl={row.thumbnailUrl} name={row.name} platform={row.platform} size={28} sx={(theme) => ({ borderRadius: `${theme.shape.radius.inlay}px` })} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        component={onCampaignClick ? 'button' : 'span'}
                        type={onCampaignClick ? 'button' : undefined}
                        onClick={onCampaignClick ? (event) => { event.stopPropagation(); onCampaignClick(row.campaignId); } : undefined}
                        title={row.name}
                        sx={(theme) => ({
                          display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: 'text.primary', textAlign: 'left',
                          p: 0, m: 0, border: 0, background: 'none', fontFamily: 'inherit',
                          cursor: onCampaignClick ? 'pointer' : 'default',
                          /* 파란 링크가 아니라 조용한 hover 밑줄만 — 표 밀도를 지킨다 */
                          ...(onCampaignClick && {
                            '&:hover': { textDecoration: 'underline', textUnderlineOffset: 3 },
                            '&:focus-visible': { outline: 'none', boxShadow: `0 0 0 3px ${theme.palette.accent.ring}`, borderRadius: `${theme.shape.radius.inlay}px` },
                          }),
                        })}
                      >
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
                    <Tooltip title={t(isExpanded ? 'recap.table.collapse' : 'recap.table.expand', lang)} placement="top" enterDelay={400}>
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
                        transition: theme.transitions.create(['background-color', 'color'], { duration: 160, easing: theme.transitions.easing.easeOut }),
                        '@media (hover: hover)': { '&:hover': { backgroundColor: 'action.hover', color: 'text.primary' } },
                      })}
                    >
                      <ThinChevronDownIcon
                        sx={(theme) => ({
                          transition: theme.transitions.create('transform', { duration: 160, easing: theme.transitions.easing.easeOut }),
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                        })}
                      />
                    </IconButton>
                    </Tooltip>
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
