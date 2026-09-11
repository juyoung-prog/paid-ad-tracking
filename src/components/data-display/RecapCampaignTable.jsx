import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ScrollArea } from '../container/ScrollArea';
import { CampaignThumbnail } from '../media/CampaignThumbnail';
import { BenchmarkDelta } from './BenchmarkDelta';
import { t, metricLabel } from '../../data/recapStrings';
import { RECAP_PACING_FLAG } from '../../data/schema';
import { money, dateRangeWithDays, EMPTY } from '../../utils/format';
/* 목표별 지표 구성·해석 문장·표기 규칙은 공용 모듈에 있다 — 이 표가 화면과 인쇄를 모두 그리므로 규칙도 한 벌이다 */
import {
  INSIGHT_COLUMNS,
  emphasisOf,
  engagementLayout,
  fmtPercent,
  goalText,
  hasRowData,
  insightCellsOf,
  kpiFormat,
  primaryKpiOf,
  engagementBreakdownText,
  storeTextOf,
  videoSecondaryText,
} from './recapRowView';

/**
 * 열 폭 — 임원용 평가 시트(2026-09-08): 한 캠페인을 왼쪽에서 오른쪽으로 읽으면 "무엇 → 얼마 → 결과 → 주변 반응 →
 * 해석"이 한 화면에 든다. 합 1470 = 1600px 창(내용 폭 ≈1478)에 가로 스크롤 없이 들어가는 폭.
 * 표는 width:100%라 더 넓은 창에서는 남는 폭이 열들에 비례 배분되고(글 열이 함께 넓어진다), 더 좁은 창(1440 이하)은
 * ScrollArea가 가로 스크롤을 준다 — 글자를 줄여 억지로 맞추지 않는다.
 * 통합: 일예산 + 지출 → Budget / Spend · vs past → Primary KPI 아래 · 참여 + 행동 → Engagement / Action · 매장 → 캠페인 둘째 줄.
 */
const COLUMN_WIDTH = {
  rank: 26,
  // 썸네일 28 + 이름 한 줄 말줄임 + "G10 · Jul 6 – Aug 31 (57 days)"
  campaign: 194,
  // 목표 한 단어("Store visit"이 가장 길다)
  goal: 88,
  // "$20.00/day"(옅게) 위, "$1,119.30 spent"(굵게) 아래
  budgetSpend: 116,
  // 라벨 · 값(700) · 아래 과거 비교 "↗ lowest of 12"(≈78px)
  primaryKpi: 108,
  // Hook / Hold 두 자리(각 라벨+값, 아래 순위) + 옅은 보조 줄 "Reach 163K · Plays 296K · Avg 2s"
  video: 226,
  // 목표별 대표 두 자리(순위 포함) + 옅은 보조 줄("248 clicks · CPC $4.51")
  engagementAction: 232,
  // 해석 두 열 — 12px 한 문장(1600px 창에서 약 38자/줄 → 두 줄), 네 줄에서 잘리고 전문은 hover.
  // Reason·Next action 열은 뺐다(2026-09-08) — 지표만으로는 원인이 서지 않아 자동 문장이 없었고, 사람 글은 Edit·시트에 남는다
  worked: 240,
  improve: 240,
};

/**
 * 인쇄 글자 크기 — 화면의 px 위계를 그대로 pt로 한 단계씩 내린 값(13 → 8pt · 12 → 7.5pt · 11 → 6.5pt).
 * 인쇄는 같은 표를 좁은 종이에 옮긴 것이라 **위계는 그대로 두고 치수만** 줄인다.
 */
const printFont = (size) => ({ '@media print': { fontSize: size } });
/** 인쇄에서만 사라지는 것 — 썸네일·편집 버튼처럼 종이에서 할 일이 없는 것 */
const PRINT_HIDE = { '@media print': { display: 'none' } };

/** 해석 칸 — 12px, 네 줄에서 잘리고 전문은 hover 툴팁. 상자·배경 없음. 인쇄에서는 줄 자르기를 풀어 전문을 찍는다 */
const INSIGHT_TEXT_SX = {
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  fontSize: 12,
  lineHeight: 1.45,
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  '@media print': { display: 'block', WebkitLineClamp: 'unset', overflow: 'visible', fontSize: '6.5pt', lineHeight: 1.3 },
};
/**
 * 인라인 편집 칸 — 표가 폼처럼 보이지 않게 본문과 같은 12px, 얕은 패딩, 옅은 테두리. 두 줄부터 시작해 여섯 줄까지.
 * 칸의 **값은 사람이 쓴 글만**이고 자동 문장은 값도 placeholder도 아니다(2026-09-10) — 자동 문장을 placeholder로
 * 깔았더니 이미 저장된 글처럼 읽혔다. placeholder는 "Add custom note…" 안내뿐이고(구현 용어처럼 읽히던
 * "Override generated note…"에서 바꿨다, 2026-09-10), 자동 문장 자체는 hover·focus 툴팁에서 본다.
 * 상태: 기본 divider · hover 한 단 진하게 · focus는 accent 1px(굵은 파란 테두리를 쓰지 않는다).
 */
const insightInputSx = (theme) => ({
  '& .MuiOutlinedInput-root': {
    p: 0.75,
    fontSize: 12,
    lineHeight: 1.45,
    alignItems: 'flex-start',
    backgroundColor: theme.palette.background.paper,
    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(theme.palette.text.primary, 0.28) },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1, borderColor: theme.palette.accent.main },
  },
  '& .MuiOutlinedInput-input': { p: 0 },
  '& .MuiOutlinedInput-input::placeholder': { opacity: 0.65, fontStyle: 'italic' },
});
/** 수치 열과 해석 열 사이 — 옅은 세로 구분선 하나(머리글·본문 같은 자리) */
const INSIGHT_DIVIDER_SX = { borderLeft: '1px solid', borderLeftColor: 'divider' };

const HEAD_SX = { fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'bottom', '@media print': { fontSize: '6.5pt', px: '3pt', py: '2pt', whiteSpace: 'normal', lineHeight: 1.25 } };
const CELL_SX = { verticalAlign: 'top', py: 1, '@media print': { px: '3pt', py: '2pt', fontSize: '7.5pt' } };
const META_SX = { fontSize: 11, color: 'text.secondary', lineHeight: 1.4, whiteSpace: 'nowrap', '@media print': { fontSize: '6.5pt', lineHeight: 1.3 } };

/**
 * 인쇄 열 폭(합 726px = Letter 세로의 내용 폭). 같은 표를 좁은 종이에 옮기는 것이라 **열 순서와 뜻은 그대로**이고
 * 폭만 다시 잡는다 — 한 캠페인은 화면과 마찬가지로 **한 줄**이다(2026-09-10: 해석 두 열을 둘째 줄로 접었더니
 * 줄 높이가 두 배가 되어 다섯 캠페인이 한 쪽에 못 들어갔다. 화면에서 한 줄인 것은 종이에서도 한 줄이어야
 * 표로 읽힌다). 폭은 우선순위대로 — 캠페인 이름 > 영상·참여(지표 두 자리 + 순위) > 해석 두 열 > 숫자 칸 > 목표 > 순위.
 * 해석 문장은 6.5pt에서 92px이면 한 줄에 약 21자라 두세 줄로 접힌다(자르지 않는다).
 */
const PRINT_COLUMN_WIDTH = [14, 92, 54, 58, 60, 140, 140, 84, 84];
/**
 * 대표 지표 한 자리 — "Hook 23.11%" 한 줄(라벨 옅게 + 값 600) 아래 과거 비교 한 줄("↗ best of 12", 없으면 생략).
 * 순위는 맥락이지 등급이 아니다. 값이 없으면 "—".
 */
function KpiSlot({ row, metricKey, format, lang, onBenchmarkClick }) {
  const value = row[metricKey];
  const stat = row.benchmarks?.[metricKey];
  const hasComparison = Boolean(stat && stat.peerScope !== 'none' && stat.percentile != null);
  const peerLabel = stat?.peerScope === 'phase' ? row.phaseName : row.goal;
  return (
    <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
      <Typography component="span" sx={{ display: 'block', whiteSpace: 'normal', lineHeight: 1.35 }}>
        <Box component="span" sx={{ ...META_SX, whiteSpace: 'normal' }}>{metricLabel(metricKey, lang)}</Box>{' '}
        <Box component="span" sx={{ fontSize: 13, fontWeight: emphasisOf(row, metricKey) === 'primary' ? 700 : 600, fontVariantNumeric: 'tabular-nums', color: value == null ? 'text.disabled' : 'text.primary', ...printFont('7pt') }}>
          {value == null ? EMPTY : format(value)}
        </Box>
      </Typography>
      {hasComparison && (
        <BenchmarkDelta
          stat={stat}
          format={format}
          label={metricLabel(metricKey, lang)}
          peerLabel={peerLabel}
          lang={lang}
          size="sm"
          hasValue={false}
          hasMedian={false}
          onClick={onBenchmarkClick ? () => onBenchmarkClick(row.campaignId, metricKey) : undefined}
        />
      )}
    </Box>
  );
}

/**
 * RecapCampaignTable 컴포넌트
 *
 * 보고서(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표 — **임원용 평가 시트**(2026-09-08). 한 줄을 왼쪽에서 오른쪽으로
 * 읽으면 결정에 필요한 이야기가 가로 스크롤 없이 끝난다(1600px 이상 창):
 * 무엇인가(캠페인 + Goal) → 얼마 썼나(Budget / Spend) → 주 결과는(Primary KPI + 그 아래 과거 비교) → 주변 반응은
 * (Video response · Engagement / Action) → 그래서(What worked · Could improve). 표는 여기서 끝난다 —
 * Reason·Next action 열은 뺐다(2026-09-08, Could improve가 마지막).
 *
 * 통합 규칙: 일예산과 지출은 한 칸(지출이 굵게) · 과거 비교는 별도 열이 아니라 그 지표 바로 아래 · 참여와 행동은 한 칸에서
 * 목표가 강조를 정한다(ENGAGEMENT_ACTION_LAYOUT) · 매장은 캠페인 칸 둘째 줄. 종합 등급·vs target·드로어 해석은 없다(제품 결정).
 * 해석 두 열은 왼쪽 숫자를 되풀이하지 않고 해석만 한다("Early video attention stood out against comparable campaigns.").
 * 근거는 그 목표에서 이 표가 보여주는 지표뿐이고(GOAL_INSIGHT_METRICS), 대표 KPI가 약하면 그 약점이 Could improve에
 * 먼저 온다 — 강한 진단 지표가 약점을 가리지 못한다. 근거가 없으면 억지로 만들지 않고 "—".
 * 사람이 Edit에서 쓴 note(strength/weakness)가 있으면 우선(툴팁 "Written by a person in Edit."), 자리표시자는 무시.
 *
 * 상호작용: **숫자 줄 어디를 눌러도** onRowClick — 캠페인 상세 드로어(성과·페이싱·일별 지출). 순위 글자(onBenchmarkClick)는
 * stopPropagation. selectedIds는 타임라인에서 고른 단계의 줄 표시(옅은 accent 면 + 왼쪽 2px 선).
 *
 * 계산은 하지 않는다 — rows는 schema.js buildRecapRows()가 순위·벤치마크·Primary KPI·해석 재료까지 끝낸 결과다.
 * 이 컴포넌트는 그 값을 자리에 놓고 utils/format으로 표기만 한다. 문구는 recapStrings에서 꺼낸다.
 *
 * Props:
 * @param {Array<Object>} rows - buildRecapRows().byPlatform[platform] — 한 플랫폼의 행 배열(순위순) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {function} onRowClick - 숫자 줄 클릭 (campaignId) => void. 있으면 줄 전체가 버튼이고 Tab/Enter로도 눌린다 [Optional]
 * @param {function} onBenchmarkClick - 순위 글자 클릭 (campaignId, metricKey) => void — 비교군 대화상자 [Optional]
 * @param {string[]} selectedIds - 타임라인에서 고른 단계에 속한 캠페인 id들 [Optional, 기본값: []]
 * @param {boolean} isEditing - true면 What worked · Could improve 칸이 인라인 편집 칸이 된다(지표를 보면서 해석을 쓰도록) [Optional, 기본값: false]
 * @param {function} onNoteChange - (campaignId, field, value) => void. field는 'strength' | 'weakness', value는 사람이 쓴 원문 [Optional]
 * @param {boolean} isDisabled - 저장 중 등 입력 잠금 [Optional, 기본값: false]
 * @param {function} renderRowExtra - (row) => node. 캠페인 칸 오른쪽 끝에 놓을 작은 것(편집 모드의 수기 입력 버튼). 열을 늘리지 않는다 [Optional]
 * @param {string} label - 스크롤 영역의 접근성 이름 [Optional, 기본값: 'Recap campaign table']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignTable rows={byPlatform.meta} onRowClick={(id) => setDetailCampaignId(id)} selectedIds={phaseSelection?.ids ?? []} />
 */
export function RecapCampaignTable({ rows, lang = 'en', onRowClick, onBenchmarkClick, selectedIds = [], label = 'Recap campaign table', isEditing = false, onNoteChange, isDisabled = false, renderRowExtra, sx }) {
  if (!rows || rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5, ...sx }}>
        {t('recap.table.empty', lang)}
      </Typography>
    );
  }

  const columnWidths = Object.values(COLUMN_WIDTH);
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  /* 인쇄용 열 폭은 colgroup을 CSS로 덮어써서 준다 — 같은 표(같은 DOM)가 매체만 바꿔 입는 것이라
     인쇄용 표를 따로 만들지 않는다. 폭이 종이에 맞으므로 최소 폭(가로 스크롤) 규칙도 함께 푼다. */
  /* col의 폭은 인라인 style이라 CSS가 이기려면 !important가 필요하다 — 화면 폭은 인라인이 그대로 쓰고,
     인쇄에서만 종이 폭으로 덮는다(같은 colgroup, 같은 표) */
  const printColSx = Object.fromEntries(PRINT_COLUMN_WIDTH.map((w, i) => [`& col:nth-of-type(${i + 1})`, { width: `${w}px !important` }]));

  return (
    <ScrollArea label={label} startOffset={COLUMN_WIDTH.rank + COLUMN_WIDTH.campaign} edgeStrength="subtle" sx={sx}>
      <Table
        size="small"
        sx={{
          tableLayout: 'fixed',
          width: '100%',
          minWidth: tableWidth,
          '@media print': { minWidth: 0, ...printColSx },
        }}
      >
        <colgroup>
          {columnWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell sx={HEAD_SX}>{t('recap.table.rank', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.campaign', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.goal', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.budgetSpend', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>
              {t('recap.table.primaryKpi', lang)}
              {/* 어떤 KPI가 왜 보이는지, 아래 순위는 맥락일 뿐이라는 것 — 판단·기준·등급 이야기는 없다 */}
              <Tooltip
                arrow
                enterTouchDelay={0}
                slotProps={{ tooltip: { sx: { maxWidth: 340 } } }}
                title={(
                  <Box sx={{ display: 'grid', rowGap: 0.75, py: 0.25 }}>
                    <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{t('recap.table.primaryKpiTitle', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.primaryKpiBody', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.primaryKpiGoals', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.primaryKpiSeparate', lang)}</Typography>
                  </Box>
                )}
              >
                <InfoOutlinedIcon sx={(theme) => ({ fontSize: theme.iconSize.inline, color: 'text.disabled', verticalAlign: 'middle', ml: 0.5, cursor: 'help', ...PRINT_HIDE })} />
              </Tooltip>
            </TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.videoResponse', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.engagementAction', lang)}</TableCell>
            {/* 해석 두 열 — 첫 열 왼쪽에 옅은 구분선. 근거 수준은 머리글 툴팁 한 줄로만 */}
            {INSIGHT_COLUMNS.map((col, i) => (
              <Tooltip key={col.key} title={isEditing ? `${t('insight.autoHint', lang)} ${t('recap.edit.insightHint', lang)}` : t('insight.autoHint', lang)} placement="top" enterDelay={500} slotProps={{ tooltip: { sx: { maxWidth: 320 } } }}>
                <TableCell sx={{ ...HEAD_SX, ...(i === 0 ? INSIGHT_DIVIDER_SX : {}), cursor: 'help' }}>{t(`insight.field.${col.field}`, lang)}</TableCell>
              </Tooltip>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const hasData = hasRowData(row);
            /* Primary KPI — 목표별 결과당 현재 비용(schema budgetEfficiency). 판단하지 않는다. 아래에 같은 KPI의 과거 비교 */
            const { kpi, metricKey: kpiKey, stat: kpiStat, hasComparison } = primaryKpiOf(row);
            const kpiHint = kpi?.value != null ? t('recap.table.primaryKpiValueHint', lang, { metric: metricLabel(kpi.metricKey, lang), basis: t(`recap.table.primaryKpiBasis.${kpi.metricKey}`, lang) }) : '';
            const layout = engagementLayout(row.goal);
            const engagementSecondary = engagementBreakdownText(row, lang);
            const videoSecondary = videoSecondaryText(row, lang);
            /* 해석 두 칸 — 사람이 쓴 note(자리표시자 제외)가 우선, 없으면 재료(insight)에서 한 문장. 데이터·근거가 없으면 "—".
               편집 중에는 사람이 쓴 **원문 그대로**(자리표시자도)를 입력 칸에 넣어 고치거나 지울 수 있게 하고,
               자동 문장은 placeholder로 깔아 "비우면 이게 남는다"를 보인다 — 자동 문장을 값으로 채워 넣지 않는다 */
            const insightCells = insightCellsOf(row, lang);
            const isSelected = selectedIds.includes(row.campaignId);
            // 편집 중에는 줄 클릭(드로어)을 끈다 — 편집 칸을 누를 때마다 드로어가 열리면 글을 쓸 수 없다
            const handleRowClick = isEditing ? undefined : onRowClick;
            const { stores, storeText } = storeTextOf(row);
            /* 해석 칸 하나 — 화면은 열, 인쇄는 접힌 둘째 줄. 값(cell.text)은 한 번만 계산해 둘이 같은 것을 쓴다 */
            const insightBody = (cell) => (cell.text ? (
              <Typography component="span" sx={{ ...INSIGHT_TEXT_SX, color: 'text.primary' }}>{cell.text}</Typography>
            ) : (
              <Typography component="span" sx={{ fontSize: 12, color: 'text.disabled', lineHeight: 1.45, ...printFont('6.5pt') }}>{EMPTY}</Typography>
            ));
            return (
              <TableRow
                key={row.campaignId}
                id={`recap-row-${row.campaignId}`}
                hover={Boolean(handleRowClick)}
                tabIndex={handleRowClick ? 0 : undefined}
                onClick={handleRowClick ? () => handleRowClick(row.campaignId) : undefined}
                onKeyDown={
                  handleRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleRowClick(row.campaignId);
                        }
                      }
                    : undefined
                }
                aria-selected={isSelected || undefined}
                sx={(theme) => ({
                  cursor: handleRowClick ? 'pointer' : 'default',
                  // 한 줄이 한 캠페인이다 — 페이지 경계에서 쪼개지지 않게만 하면 된다
                  '@media print': { breakInside: 'avoid', pageBreakInside: 'avoid' },
                  // 줄 hover는 MUI action.hover(중립) — 140ms로 부드럽게. 지표·순위 색은 그대로
                  transition: theme.transitions.create('background-color', { duration: 140 }),
                  /* 타임라인에서 찾아온 줄 — 옅은 accent 면 + 첫 칸 왼쪽 2px accent 선(inset shadow라 폭·경계선이 안 바뀐다).
                     글자·지표 색은 그대로. hover 위에서도 선택 면·선이 유지되도록 hover까지 함께 지정한다 */
                  ...(isSelected && {
                    '&&, &&:hover': { backgroundColor: alpha(theme.palette.accent.main, 0.06) },
                    '& > td:first-of-type': { boxShadow: `inset 2px 0 0 ${theme.palette.accent.main}` },
                  }),
                  ...(handleRowClick && {
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
                <TableCell sx={CELL_SX}>
                  {/* [썸네일] 이름 / 매장 · 기간 — 이름이 비슷한 Meta·TikTok 캠페인을 소재로 가른다. 매장 열을 따로 두지 않고 둘째 줄에 */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
                    {/* 소재 그림은 인쇄에서 뺀다 — 108px 열에서 28px을 그림에 주면 이름이 두 글자만 남는다 */}
                    <Box sx={PRINT_HIDE}>
                      <CampaignThumbnail thumbnailUrl={row.thumbnailUrl} name={row.name} platform={row.platform} size={28} sx={(theme) => ({ borderRadius: `${theme.shape.radius.inlay}px` })} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      {/* 이름은 한 줄 + CSS 말줄임 — 긴 이름의 이모지·점이 혼자 다음 줄로 내려가면 깨져 보였다(i-26). 전체 이름은 hover 툴팁 */}
                      <Tooltip title={row.name !== row.phaseName || row.phaseName.length > 20 ? row.name : ''} placement="top" enterDelay={500}>
                        <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', '@media print': { fontSize: '8pt', lineHeight: 1.25, whiteSpace: 'normal', overflow: 'visible', overflowWrap: 'anywhere' } }}>
                          {row.phaseName}
                        </Typography>
                      </Tooltip>
                      <Typography component="span" sx={{ ...META_SX, display: 'block', whiteSpace: 'normal' }} title={stores.length > 1 ? row.storeCode : undefined}>
                        {[storeText, dateRangeWithDays(row.startDate, row.endDate)].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                    {/* 행별 부가 입력(이유·오가닉) 버튼 — 편집 모드에서만, 이름 줄 오른쪽 끝에. 열도 줄 높이도 늘리지 않는다 */}
                    {renderRowExtra && (
                      <Box sx={{ ml: 'auto', flexShrink: 0, ...PRINT_HIDE }} onClick={(e) => e.stopPropagation()}>{renderRowExtra(row)}</Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={CELL_SX}>
                  {/* Goal — 캠페인 데이터의 목표 그대로. 등급도 해석도 없다 */}
                  <Typography component="span" sx={{ display: 'block', fontSize: 12, lineHeight: 1.4, color: goalText(row.goal, lang) ? 'text.primary' : 'text.disabled', ...printFont('6.5pt') }}>
                    {goalText(row.goal, lang) ?? EMPTY}
                  </Typography>
                </TableCell>
                <TableCell sx={CELL_SX}>
                  {/* Budget / Spend — 일예산은 옅게 위, 실제 지출은 굵게 아래. 집행률은 계획 대비 ±20/30%를 벗어날 때만 셋째 줄 */}
                  <Typography component="span" sx={{ ...META_SX, display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                    {row.dailyBudget != null ? t('recap.table.perDay', lang, { amount: money(row.dailyBudget) }) : EMPTY}
                  </Typography>
                  <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.4, fontVariantNumeric: 'tabular-nums', whiteSpace: 'normal', color: row.spend == null ? 'text.disabled' : 'text.primary', ...printFont('7.5pt') }}>
                    {row.spend != null ? t('recap.table.spent', lang, { amount: money(row.spend) }) : EMPTY}
                  </Typography>
                  {row.pacingRatio != null && (row.pacingRatio >= RECAP_PACING_FLAG.over || row.pacingRatio <= RECAP_PACING_FLAG.under) && (
                    <Typography component="span" sx={{ ...META_SX, display: 'block', mt: 0.25 }}>
                      {row.pacingRatio >= 1
                        ? t('recap.table.over', lang, { pct: Math.round((row.pacingRatio - 1) * 100) })
                        : t('recap.table.under', lang, { pct: Math.round((1 - row.pacingRatio) * 100) })}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={CELL_SX}>
                  {/* Primary KPI — 라벨(옅게) → 값(700) → 그 아래 같은 KPI의 과거 비교(맥락, 등급 아님). 비교군 3개 미만이면 순위 줄 생략 */}
                  {kpi?.value != null ? (
                    <Box sx={{ minWidth: 0 }}>
                      <Tooltip title={kpiHint} placement="top" enterDelay={400}>
                        <Box sx={{ cursor: 'help' }}>
                          <Typography component="span" sx={{ ...META_SX, lineHeight: 1.3, display: 'block' }}>{metricLabel(kpi.metricKey, lang)}</Typography>
                          <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 700, lineHeight: 1.3, fontVariantNumeric: 'tabular-nums', color: 'text.primary', ...printFont('8pt') }}>{kpiFormat(kpi.metricKey)(kpi.value)}</Typography>
                        </Box>
                      </Tooltip>
                      {hasComparison ? (
                        <BenchmarkDelta
                          stat={kpiStat}
                          format={kpiFormat(kpiKey)}
                          label={metricLabel(kpiKey, lang)}
                          peerLabel={kpiStat.peerScope === 'phase' ? row.phaseName : row.goal}
                          lang={lang}
                          size="sm"
                          hasValue={false}
                          hasMedian={false}
                          onClick={onBenchmarkClick ? () => onBenchmarkClick(row.campaignId, kpiKey) : undefined}
                        />
                      ) : (
                        <Tooltip title={t('recap.table.noComparison', lang)} placement="top" enterDelay={300}>
                          <Typography component="span" sx={{ display: 'inline-block', fontSize: 10.5, color: 'text.disabled', lineHeight: 1.35, cursor: 'help', ...printFont('6.5pt') }}>{EMPTY}</Typography>
                        </Tooltip>
                      )}
                    </Box>
                  ) : (
                    <Typography component="span" sx={{ display: 'block', fontSize: 13, color: 'text.disabled', lineHeight: 1.3, ...printFont('7.5pt') }}>{EMPTY}</Typography>
                  )}
                </TableCell>
                {!hasData ? (
                  <TableCell colSpan={2} sx={{ ...CELL_SX, color: 'text.secondary' }}>{t('recap.table.noData', lang)}</TableCell>
                ) : (
                  <>
                    {/* Video response — Hook / Hold가 앞(순위 포함), Reach · Plays · Avg는 옅은 보조 줄 */}
                    <TableCell sx={CELL_SX}>
                      <Box sx={{ display: 'flex', gap: 0.75, '@media print': { gap: '4pt' } }}>
                        <KpiSlot row={row} metricKey="hookRate" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                        <KpiSlot row={row} metricKey="holdRate" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                      </Box>
                      {videoSecondary && (
                        <Typography component="span" sx={(theme) => ({ ...META_SX, display: 'block', whiteSpace: 'normal', mt: 0.5, color: alpha(theme.palette.text.secondary, 0.85), fontVariantNumeric: 'tabular-nums' })}>{videoSecondary}</Typography>
                      )}
                    </TableCell>
                    {/* Engagement / Action — 대표 두 자리는 목표가 정하고(ENGAGEMENT_ACTION_LAYOUT), 보조 줄은 참여 내역 Like · Cmt · Share(· Follow · Profile) */}
                    <TableCell sx={CELL_SX}>
                      <Box sx={{ display: 'flex', gap: 0.75, '@media print': { gap: '4pt' } }}>
                        {layout.primary.map((key) => (
                          <KpiSlot key={key} row={row} metricKey={key} format={kpiFormat(key)} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                        ))}
                      </Box>
                      {engagementSecondary && (
                        <Typography component="span" sx={(theme) => ({ ...META_SX, display: 'block', whiteSpace: 'normal', mt: 0.5, color: alpha(theme.palette.text.secondary, 0.85), fontVariantNumeric: 'tabular-nums' })}>{engagementSecondary}</Typography>
                      )}
                    </TableCell>
                  </>
                )}
                {/* 해석 두 칸 — 상자 없이 문장만. 네 줄 넘으면 잘리고 전문은 hover. 비어 있으면 "—" */}
                {insightCells.map((cell, i) => (
                  <TableCell key={cell.key} sx={{ ...CELL_SX, ...(i === 0 ? INSIGHT_DIVIDER_SX : {}) }}>
                    {isEditing ? (
                      /* 자동 문장은 칸이 비어 있을 때만, 그것도 툴팁으로 — 값으로도 placeholder로도 넣지 않는다.
                         사람이 쓴 글이 있으면 툴팁도 끈다(그 순간 자동 문장은 쓰이지 않으므로) */
                      <Tooltip
                        title={!cell.raw.trim() && cell.auto ? (
                          <Box sx={{ display: 'grid', rowGap: 0.25, py: 0.25 }}>
                            <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{t('recap.edit.generatedNote', lang)}</Typography>
                            <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45 }}>{cell.auto}</Typography>
                          </Box>
                        ) : ''}
                        placement="top"
                        enterDelay={300}
                        slotProps={{ tooltip: { sx: { maxWidth: 300 } } }}
                      >
                        <TextField
                          value={cell.raw}
                          onChange={(e) => onNoteChange?.(row.campaignId, cell.noteField, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={t('recap.edit.addNotePlaceholder', lang)}
                          aria-label={`${t(`insight.field.${cell.field}`, lang)} — ${row.phaseName}`}
                          multiline
                          minRows={2}
                          maxRows={6}
                          size="small"
                          fullWidth
                          disabled={isDisabled}
                          sx={insightInputSx}
                        />
                      </Tooltip>
                    ) : cell.text ? (
                      <Tooltip title={`${cell.text}${cell.isWritten ? ` — ${t('insight.writtenHint', lang)}` : ''}`} placement="top" enterDelay={500} slotProps={{ tooltip: { sx: { maxWidth: 360 } } }}>
                        <Box component="span" sx={{ cursor: 'help' }}>{insightBody(cell)}</Box>
                      </Tooltip>
                    ) : insightBody(cell)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
