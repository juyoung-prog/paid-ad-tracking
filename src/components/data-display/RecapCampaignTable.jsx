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
import { t, metricLabel } from '../../data/recapStrings';
import { RECAP_PACING_FLAG, GOAL_HEADLINE_METRICS, METRIC_ASPECT, localizedText } from '../../data/schema';
import { VerdictChip } from './VerdictChip';
import { money, count, percent, seconds, dateRangeWithDays, EMPTY } from '../../utils/format';

/** 대표 KPI 값 표기 — 비용 지표는 돈, 나머지는 비율. 계산이 아니라 표기다 */
const kpiFormat = (metricKey) => (['cpm', 'cpc', 'cpa', 'cpe'].includes(metricKey) ? money : (v) => percent(v, { digits: 2 }));

const fmtPercent = (v) => percent(v, { digits: 2 });

/**
 * 열 폭 — 보고서는 한 화면에 다 보이는 게 목표라 글자 열을 좁게 잡는다(합 1640). 회장님 보고서의 정보 구조를 따른다:
 * 순위 · 매장 · 캠페인 · 일예산 · 지출 · 종합 성과 · 영상 반응 · 참여 반응 · 강점 · 개선점 · 이유
 */
const COLUMN_WIDTH = {
  rank: 26,
  store: 46,
  // 250: "Jul 6 – Aug 31 (57 days) · Awareness"는 한 줄, 가장 긴 조합은 "·" 뒤에서 목표만 다음 줄로
  campaign: 250,
  dailyBudget: 80,
  // 실제 총지출만
  spend: 100,
  // 등급 배지(STRONG/AVERAGE/WEAK 또는 Insufficient data) + 아래 목표 결과의 비용 KPI 한 줄("CPM $2.41") + (목표치가 있으면 vs target)
  overall: 150,
  // 대표 지표 자리 + "↗ lowest of 12"(≈79px)가 나란히 들어가는 폭: Video 75+24+79 · Engagement 두 개 73+8+79, 전환 셋 58+58+79+24
  video: 216,
  engagement: 232,
  // 자동 문장(12px, 두 줄까지) 또는 사람이 쓴 문장
  strengths: 150,
  improve: 150,
  reason: 240,
};

const HEAD_SX = { fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'bottom' };
const CELL_SX = { verticalAlign: 'top', py: 1 };
const META_SX = { fontSize: 11, color: 'text.secondary', lineHeight: 1.4, whiteSpace: 'nowrap' };
/* 대표 지표 자리(slot) — 값 길이("↗ lowest of 12")와 무관하게 두 번째 지표(Hold·CPC)가 모든 줄에서 같은 x에
   오도록 첫 자리에 고정 폭을 준다. 셀 안쪽 폭: Video 192 · Action 216. 세 개(CTR·CPC·CPA)가 드는
   conversion 줄은 자리를 좁힌다 */
const KPI_SLOT = { video: 75, engagement: 73, action: 82, triple: 58 };
const KPI_GAP = 3;
const ENGAGEMENT_GAP = 1;
const TRIPLE_GAP = 1.5;
/** 캠페인 목표 — 캠페인 데이터의 goal(드로어와 같은 원천). 없거나 모르는 값이면 표시하지 않는다 */
const GOAL_KEYS = ['awareness', 'traffic', 'engagement', 'conversion', 'store_visit'];

/**
 * 비율 지표 한 칸 — 라벨 위, BenchmarkDelta 아래. 비교군 이름은 stat의 scope를
 * 보고 고른다(phase면 단계 이름, goal이면 goal) — 계산이 아니라 라벨 선택이다.
 */
/** 진단 지표 — 왜 그런 성과가 나왔는지 보는 비율. 세미볼드 */
const DIAGNOSTIC_KEYS = new Set(['hookRate', 'holdRate', 'engagementRate', 'ctr']);
/** 값의 무게는 지표의 역할이 정한다: 목표의 대표 KPI(700) > 진단 지표(600) > 보조 비용 지표(400) */
const emphasisOf = (row, metricKey) => {
  if ((GOAL_HEADLINE_METRICS[row.goal] ?? [])[0] === metricKey) return 'primary';
  return DIAGNOSTIC_KEYS.has(metricKey) ? 'diagnostic' : 'supporting';
};

function MetricCell({ row, metricKey, format, lang, onBenchmarkClick, minWidth }) {
  const stat = row.benchmarks?.[metricKey];
  if (!stat) return null;
  const peerLabel = stat.peerScope === 'phase' ? row.phaseName : row.goal;
  return (
    <Box sx={{ minWidth: minWidth ?? 0, flexShrink: 0 }}>
      <Typography component="span" sx={{ ...META_SX, lineHeight: 1.3, display: 'block' }}>{metricLabel(metricKey, lang)}</Typography>
      {/* 중앙값은 툴팁에만 — 셀 폭에서 "▲ top 25% · median 28.51%"는 옆 지표와 겹친다 */}
      <BenchmarkDelta
        stat={stat}
        format={format}
        label={metricLabel(metricKey, lang)}
        peerLabel={peerLabel}
        lang={lang}
        size="sm"
        emphasis={emphasisOf(row, metricKey)}
        hasMedian={false}
        onClick={onBenchmarkClick ? () => onBenchmarkClick(row.campaignId, metricKey) : undefined}
      />
    </Box>
  );
}

/**
 * 보조 지표 묶음 — Reach · Plays · Avg처럼 라벨 → 값 두 줄. 대표 지표(MetricCell)와 같은 문법이되
 * 한 단 조용하다: 라벨은 secondary 78%, 값은 12px/400 text.primary 72%(수량 지표는 보통 굵기 — 무게는 역할이 정한다).
 * 예전엔 "Reach 163,290 · Plays 295,857" 한 줄 문장이라 메타데이터처럼 읽혔다(2026-09-07).
 * 값 길이가 달라도 열이 흔들리지 않게 항목마다 minWidth를 준다(셀 폭에 맞춰 호출부가 정한다).
 */
function SecondaryMetrics({ parts, minWidth }) {
  const shown = parts.filter(([, v]) => v != null);
  if (shown.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
      {shown.map(([label, v]) => (
        <Box key={label} sx={{ minWidth, flexShrink: 0 }}>
          <Typography component="span" sx={(theme) => ({ ...META_SX, lineHeight: 1.3, color: alpha(theme.palette.text.secondary, 0.78), display: 'block' })}>{label}</Typography>
          <Typography component="span" sx={(theme) => ({ display: 'block', fontSize: 12, fontWeight: 400, lineHeight: 1.3, color: alpha(theme.palette.text.primary, 0.72), fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' })}>{v}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/**
 * RecapCampaignTable 컴포넌트
 *
 * 보고서(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표. 회장님이 보던 보고서의 정보 구조를 따른다(2026-09-08):
 * 순위 · 매장 · 캠페인(28px 소재 썸네일 + 단계 이름 + 기간 · 목표) · 일예산 · 지출 · **종합 성과** · 영상 반응 · 참여 반응 ·
 * 강점 · 개선점 · 이유. 세 층으로 읽힌다 — 1층 종합 성과(STRONG/AVERAGE/WEAK 한 단어, 5초) → 2층 무슨 일이 있었나
 * (영상·참여 반응 숫자) → 3층 해석(강점·개선점·이유). 유료 광고 보고서라 Paid/Total 구분 라벨은 두지 않는다.
 *
 * **종합 성과**는 schema.js buildOverallPerformance() — 캠페인 목표(OVERALL_RULES)가 어떤 지표를 얼마나 중요하게 볼지 정하고,
 * 비용 + 영상 반응 + 참여 반응을 합친다. 대표 지표가 등급을 정하고 보조 지표는 한 단만 움직인다. 회사 KPI 기준값이 없으므로
 * 고정 문턱은 없고, 각 지표는 앱의 기존 잣대(같은 플랫폼·목표의 과거 비교군 구간)로 읽되 순위 하나가 등급을 정하지 않는다.
 * 대표 지표를 읽을 수 없으면 "Insufficient data" — 억지로 등급을 만들지 않는다. 배지 아래에는 목표 결과의 비용 KPI("CPM $2.41",
 * 옅게)와, 캠페인에 설정된 목표치가 있을 때만 "↓ 20% vs target" 한 줄(목표치 계산·데이터는 그대로다).
 * 사람이 Edit에서 고른 등급(note.verdict)과 쓴 문장(note.strength/weakness/reason)이 자동 값보다 우선한다.
 *
 * **영상 반응** = Reach · Plays · Avg + Hook/Hold(비교군 화살표는 보조). **참여 반응**은 목표가 강조를 정한다 — 트래픽은
 * Clicks + CTR/CPC, 전환은 Results + CPA/CTR/CPC, 나머지는 Like·Cmt·Share + Eng. rate/Cost/eng.
 * **강점·개선점·이유**는 등급과 같은 근거(지표 구간)에서 자동 생성 — 중요도 순으로 상위/하위인 지표 하나둘을 문장으로.
 * 인지 캠페인의 낮은 CTR은 개선점이 되지 않는다(supporting은 등급에 안 들어가고 문구에서도 뒤로 밀린다). 원인은 단정하지 않는다.
 *
 * 상호작용: **숫자 줄 어디를 눌러도** onRowClick — 캠페인 상세 드로어. 벤치마크 글자(onBenchmarkClick)는 stopPropagation.
 * selectedIds는 타임라인에서 고른 단계의 줄 표시(옅은 accent 면 + 왼쪽 2px 선).
 *
 * 계산은 하지 않는다 — rows는 schema.js buildRecapRows()가 순위·벤치마크·종합 성과까지 끝낸 결과다.
 * 이 컴포넌트는 그 값을 자리에 놓고 utils/format으로 표기만 한다. 문구는 recapStrings에서 꺼낸다.
 *
 * Props:
 * @param {Array<Object>} rows - buildRecapRows().byPlatform[platform] — 한 플랫폼의 행 배열(순위순) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {function} onRowClick - 숫자 줄 클릭 (campaignId) => void. 있으면 줄 전체가 버튼이고 Tab/Enter로도 눌린다 [Optional]
 * @param {function} onBenchmarkClick - 벤치마크 글자 클릭 (campaignId, metricKey) => void — 비교군 대화상자 [Optional]
 * @param {string[]} selectedIds - 타임라인에서 고른 단계에 속한 캠페인 id들 [Optional, 기본값: []]
 * @param {string} label - 스크롤 영역의 접근성 이름 [Optional, 기본값: 'Recap campaign table']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignTable rows={byPlatform.meta} onRowClick={(id) => setDetailCampaignId(id)} selectedIds={phaseSelection?.ids ?? []} />
 */
export function RecapCampaignTable({ rows, lang = 'en', onRowClick, onBenchmarkClick, selectedIds = [], label = 'Recap campaign table', sx }) {
  if (!rows || rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5, ...sx }}>
        {t('recap.table.empty', lang)}
      </Typography>
    );
  }

  const columnWidths = Object.values(COLUMN_WIDTH);
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  const written = (text) => (localizedText(text, lang).value ?? '').trim();
  const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str);

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
              {t('recap.table.overall', lang)}
              {/* 등급이 어디서 오는지 — 목표 가중, 고정 문턱 없음, 순위 하나가 정하지 않음, 못 읽으면 Insufficient data */}
              <Tooltip
                arrow
                enterTouchDelay={0}
                slotProps={{ tooltip: { sx: { maxWidth: 360 } } }}
                title={(
                  <Box sx={{ display: 'grid', rowGap: 0.75, py: 0.25 }}>
                    <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{t('recap.table.overallTitle', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.overallBody', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.overallBody2', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.overallBody3', lang)}</Typography>
                  </Box>
                )}
              >
                <InfoOutlinedIcon sx={(theme) => ({ fontSize: theme.iconSize.inline, color: 'text.disabled', verticalAlign: 'middle', ml: 0.5, cursor: 'help' })} />
              </Tooltip>
            </TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.videoResponse', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.engagementResponse', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.strengths', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.improve', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.reason', lang)}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const hasData = row.spend != null || row.impressions != null;
            const overall = row.overall ?? null;
            const humanRating = row.note?.verdict ?? null;
            const rating = humanRating ?? overall?.rating ?? null;
            const isInsufficient = !rating && hasData && overall?.reason === 'insufficient';
            const primaryLabel = (overall?.primaryKeys ?? []).map((k) => metricLabel(k, lang)).join(' + ');
            const secondaryLabel = (overall?.secondaryKeys ?? []).map((k) => metricLabel(k, lang)).join(' · ');
            const overallHint = humanRating ? t('recap.table.overallWritten', lang)
              : rating ? t('recap.table.overallRule', lang, { primary: primaryLabel, secondary: secondaryLabel })
                : isInsufficient ? t('recap.table.overallInsufficientHint', lang, { primary: primaryLabel }) : '';
            // 배지 아래: 목표 결과의 비용 KPI 값(옅게) + 캠페인에 설정된 목표치가 있을 때만 vs target 한 줄(없으면 아무것도 — 대체값 없음)
            const kpiKey = overall?.metricKey ?? (GOAL_HEADLINE_METRICS[row.goal] ?? [])[0] ?? null;
            const kpiValue = overall?.value ?? null;
            const targetRatio = kpiValue != null && row.kpiTarget > 0 ? kpiValue / row.kpiTarget : null;
            const targetTone = targetRatio == null ? null : targetRatio <= 0.95 ? 'success.main' : targetRatio >= 1.05 ? 'warning.main' : 'text.secondary';
            const targetText = targetRatio == null ? null
              : targetRatio <= 0.95 ? t('recap.table.targetBetter', lang, { pct: Math.round((1 - targetRatio) * 100), target: kpiFormat(kpiKey)(row.kpiTarget) })
                : targetRatio >= 1.05 ? t('recap.table.targetWorse', lang, { pct: Math.round((targetRatio - 1) * 100), target: kpiFormat(kpiKey)(row.kpiTarget) })
                  : t('recap.table.targetOn', lang, { target: kpiFormat(kpiKey)(row.kpiTarget) });
            /* 강점·개선점·이유 — 사람이 쓴 문장이 있으면 그것, 없으면 등급과 같은 근거(지표 구간)에서 만든 문장. 원인은 단정하지 않는다 */
            const writtenStrength = written(row.note?.strength);
            const writtenWeakness = written(row.note?.weakness);
            const writtenReason = written(row.note?.reason);
            const autoStrengths = (overall?.strengths ?? []).map((k) => t(`overall.strength.${k}`, lang));
            const autoWeaknesses = (overall?.weaknesses ?? []).map((k) => t(`overall.weak.${k}`, lang));
            const goalWord = GOAL_KEYS.includes(row.goal) ? t(`goalLabel.${row.goal}`, lang).toLowerCase() : row.goal;
            const strongClause = overall?.strengths?.[0] ? t(`overall.clause.strong.${overall.strengths[0]}`, lang) : null;
            const weakClause = overall?.weaknesses?.[0] ? t(`overall.clause.weak.${overall.weaknesses[0]}`, lang) : null;
            const autoReason = !hasData ? '' : isInsufficient && !strongClause && !weakClause ? t('overall.reason.insufficient', lang)
              : strongClause && weakClause ? capitalize(t('overall.reason.both', lang, { strong: strongClause, weak: weakClause }))
                : strongClause ? capitalize(t('overall.reason.strongOnly', lang, { strong: strongClause, goal: goalWord }))
                  : weakClause ? capitalize(t('overall.reason.weakOnly', lang, { weak: weakClause, goal: goalWord }))
                    : rating ? t('overall.reason.flat', lang, { goal: goalWord }) : t('overall.reason.insufficient', lang);
            const isTraffic = row.goal === 'traffic';
            const isConversion = row.goal === 'conversion' || row.goal === 'store_visit';
            const isSelected = selectedIds.includes(row.campaignId);
            const stores = String(row.storeCode ?? '').split(/,\s*/).filter(Boolean);
            const textCell = (text, isWritten, emptyKey) => (
              <Tooltip title={hasData ? t(isWritten ? 'recap.table.writtenHint' : 'recap.table.autoHint', lang) : ''} placement="top" enterDelay={500}>
                <Typography component="span" sx={{ display: 'block', fontSize: 12, lineHeight: 1.45, whiteSpace: 'normal', color: text ? 'text.primary' : 'text.disabled', cursor: hasData ? 'help' : 'default' }}>
                  {text || (hasData ? t(emptyKey, lang) : EMPTY)}
                </Typography>
              </Tooltip>
            );
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
                  {/* [썸네일] 이름 / 기간 · 목표 — 이름이 비슷한 Meta·TikTok 캠페인을 소재로 가른다. 칸 안에 따로 버튼은 없다(줄 전체가 버튼) */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
                    <CampaignThumbnail thumbnailUrl={row.thumbnailUrl} name={row.name} platform={row.platform} size={28} sx={(theme) => ({ borderRadius: `${theme.shape.radius.inlay}px` })} />
                    <Box sx={{ minWidth: 0 }}>
                      {/* 이름은 한 줄 + CSS 말줄임 — 긴 이름의 이모지·점이 혼자 다음 줄로 내려가면 깨져 보였다(i-26). 전체 이름은 hover 툴팁 */}
                      <Tooltip title={row.name !== row.phaseName || row.phaseName.length > 24 ? row.name : ''} placement="top" enterDelay={500}>
                        <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.phaseName}
                        </Typography>
                      </Tooltip>
                      {/* 기간 · 목표 — 목표는 KPI가 아니라 맥락이라 기간과 같은 줄, 같은 크기·색. 데이터에 없으면 기간만 */}
                      <Typography component="span" sx={{ ...META_SX, display: 'block', whiteSpace: 'normal' }}>
                        {dateRangeWithDays(row.startDate, row.endDate)}
                        {GOAL_KEYS.includes(row.goal) && ` · ${t(`goalLabel.${row.goal}`, lang)}`}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ ...CELL_SX, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {row.dailyBudget != null ? `${money(row.dailyBudget)}/day` : EMPTY}
                  {/* 집행률은 성과가 아니라 운영 상태 — 계획 대비 +20% 이상·−30% 이하일 때만 작게. 그 안은 조용히 */}
                  {row.pacingRatio != null && (row.pacingRatio >= RECAP_PACING_FLAG.over || row.pacingRatio <= RECAP_PACING_FLAG.under) && (
                    <Typography component="span" sx={{ ...META_SX, display: 'block', mt: 0.25 }}>
                      {row.pacingRatio >= 1
                        ? t('recap.table.over', lang, { pct: Math.round((row.pacingRatio - 1) * 100) })
                        : t('recap.table.under', lang, { pct: Math.round((1 - row.pacingRatio) * 100) })}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={CELL_SX}>
                  <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', lineHeight: 1.4 }}>
                    {money(row.spend)}
                  </Typography>
                </TableCell>
                <TableCell sx={CELL_SX}>
                  {/* 1층: 종합 성과 — 배지 한 단어가 지배하고, 아래 비용 KPI 값은 옅게. 규칙·근거는 툴팁 */}
                  <Tooltip title={overallHint} placement="top" enterDelay={300} slotProps={{ tooltip: { sx: { maxWidth: 320 } } }}>
                    <Box sx={{ minWidth: 0, cursor: overallHint ? 'help' : 'default' }}>
                      {rating ? (
                        <VerdictChip verdict={rating} lang={lang} size="sm" />
                      ) : isInsufficient ? (
                        <Typography component="span" sx={{ display: 'inline-block', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1.4 }}>{t('recap.table.overallInsufficient', lang)}</Typography>
                      ) : (
                        <VerdictChip verdict={null} lang={lang} size="sm" />
                      )}
                      {kpiKey && kpiValue != null && (
                        <Typography component="span" sx={{ ...META_SX, display: 'block', mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                          {metricLabel(kpiKey, lang)} {kpiFormat(kpiKey)(kpiValue)}
                        </Typography>
                      )}
                      {targetText && (
                        <Typography component="span" sx={{ display: 'block', fontSize: 10.5, fontWeight: 500, lineHeight: 1.35, mt: 0.25, color: targetTone, fontVariantNumeric: 'tabular-nums', whiteSpace: 'normal' }}>{targetText}</Typography>
                      )}
                    </Box>
                  </Tooltip>
                </TableCell>
                {!hasData ? (
                  <TableCell colSpan={5} sx={{ ...CELL_SX, color: 'text.secondary' }}>{t('recap.table.noData', lang)}</TableCell>
                ) : (
                  <>
                    {/* 2층: 영상 반응 — 보조 수량 위, 대표 Hook/Hold 아래(비교군 화살표는 보조) */}
                    <TableCell sx={CELL_SX}>
                      <SecondaryMetrics minWidth={52} parts={[
                        [metricLabel('reach', lang), count(row.reach)],
                        [metricLabel('videoPlays', lang), count(row.videoPlays)],
                        [metricLabel('avgWatch', lang), row.avgWatchSeconds != null ? seconds(row.avgWatchSeconds) : null],
                      ]} />
                      <Box sx={{ display: 'flex', gap: KPI_GAP }}>
                        <MetricCell row={row} metricKey="hookRate" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} minWidth={KPI_SLOT.video} />
                        <MetricCell row={row} metricKey="holdRate" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                      </Box>
                    </TableCell>
                    {/* 2층: 참여 반응 — 목표가 강조를 정한다. 트래픽은 Clicks + CTR/CPC, 전환은 Results + CPA/CTR/CPC, 나머지는 Like·Cmt·Share + Eng. rate/Cost/eng */}
                    <TableCell sx={CELL_SX}>
                      {isTraffic ? (
                        <>
                          <SecondaryMetrics minWidth={40} parts={[
                            [metricLabel('clicks', lang), count(row.clicks)],
                            [metricLabel('likes', lang), count(row.likes)],
                            [metricLabel('comments', lang), count(row.comments)],
                            [metricLabel('shares', lang), count(row.shares)],
                          ]} />
                          <Box sx={{ display: 'flex', gap: KPI_GAP }}>
                            <MetricCell row={row} metricKey="ctr" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} minWidth={KPI_SLOT.action} />
                            <MetricCell row={row} metricKey="cpc" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                          </Box>
                        </>
                      ) : isConversion ? (
                        <>
                          <SecondaryMetrics minWidth={40} parts={[
                            [metricLabel('conversions', lang), count(row.conversions)],
                            [metricLabel('clicks', lang), count(row.clicks)],
                            [metricLabel('likes', lang), count(row.likes)],
                            [metricLabel('comments', lang), count(row.comments)],
                          ]} />
                          <Box sx={{ display: 'flex', gap: TRIPLE_GAP }}>
                            <MetricCell row={row} metricKey="cpa" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} minWidth={KPI_SLOT.triple} />
                            <MetricCell row={row} metricKey="ctr" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} minWidth={KPI_SLOT.triple} />
                            <MetricCell row={row} metricKey="cpc" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                          </Box>
                        </>
                      ) : (
                        <>
                          <SecondaryMetrics minWidth={36} parts={[
                            [metricLabel('likes', lang), count(row.likes)],
                            [metricLabel('comments', lang), count(row.comments)],
                            [metricLabel('shares', lang), count(row.shares)],
                          ]} />
                          <Box sx={{ display: 'flex', gap: ENGAGEMENT_GAP }}>
                            <MetricCell row={row} metricKey="engagementRate" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} minWidth={KPI_SLOT.engagement} />
                            <MetricCell row={row} metricKey="cpe" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                          </Box>
                        </>
                      )}
                    </TableCell>
                    {/* 3층: 해석 — 사람이 쓴 문장이 우선, 없으면 등급과 같은 근거에서 만든 문장(최대 두 줄) */}
                    <TableCell sx={CELL_SX}>{textCell(writtenStrength || autoStrengths.join('\n'), Boolean(writtenStrength), 'overall.none')}</TableCell>
                    <TableCell sx={CELL_SX}>{textCell(writtenWeakness || autoWeaknesses.join('\n'), Boolean(writtenWeakness), 'overall.noneWeak')}</TableCell>
                    <TableCell sx={CELL_SX}>{textCell(writtenReason || autoReason, Boolean(writtenReason), 'overall.reason.flat')}</TableCell>
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
