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
import { RECAP_PACING_FLAG, GOAL_HEADLINE_METRICS, METRIC_ASPECT, GOAL_PERFORMANCE_RULES } from '../../data/schema';
import { VerdictChip } from './VerdictChip';
import { money, count, percent, seconds, dateRangeWithDays, EMPTY } from '../../utils/format';

/** 대표 KPI 값 표기 — 비용 지표는 돈, 나머지는 비율. 계산이 아니라 표기다 */
const kpiFormat = (metricKey) => (['cpm', 'cpc', 'cpa', 'cpe'].includes(metricKey) ? money : (v) => percent(v, { digits: 2 }));

const fmtPercent = (v) => percent(v, { digits: 2 });

/** 열 폭 — 보고서는 한 화면에 다 보이는 게 목표라 글자 열을 좁게 잡는다 */
const COLUMN_WIDTH = {
  rank: 26,
  store: 46,
  // 250: "Jul 6 – Aug 31 (57 days) · Awareness"는 한 줄, 가장 긴 조합은 "·" 뒤에서 목표만 다음 줄로(2026-09-07 Performance 열을 위해 32 양보)
  campaign: 250,
  // 종합 성과 배지 + 한 줄 설명(11px, 두 줄까지 감싼다)
  performance: 96,
  dailyBudget: 80,
  // 실제 총지출만
  spend: 100,
  // 비용 효율: KPI 라벨 + 값 + (vs target) + "vs past · ↗ lowest of 12"(≈79px)
  verdict: 118,
  // 대표 지표 자리 + "↗ lowest of 12"(≈79px)가 나란히 들어가는 폭: Video 75+24+79, Engagement 73+8+79, Action 82+24+79. 합 1354
  video: 216,
  engagement: 198,
  action: 224,
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
 * 보고서(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표. 이전 보고서의 표 구성을
 * 따른다 — 순위 · 매장 · 캠페인(28px 소재 썸네일 + 단계 이름 + 기간) · 일예산 · 지출 ·
 * 판정 · 영상 반응 · 참여 반응 · 행동. Spend는 실제 총지출만, Efficiency는 목표별 결과당 비용 + 과거 순위. 비율 지표(Hook·Hold·참여율·참여당 비용·CTR·CPC·CPA)마다
 * BenchmarkDelta로 "비슷한 캠페인 대비 어디쯤"이 붙고, 판정 칸은 사람이 고른 값이
 * 없으면 비워 둔다. 평가 층(2026-09-07): **Performance** = 이 캠페인의 **현재 값**을 우리 기준 범위(PERFORMANCE_STANDARDS)에 대고
 * 목표별 규칙(GOAL_PERFORMANCE_RULES)으로 합친 한 단어(Good/Fair/Weak) + 한 줄 설명("Efficient reach cost · weak hold").
 * 과거 비교군과 무관해 성과만 있으면 나온다. 사람이 고른 note.verdict가 우선, 기준 범위가 없는 목표(전환)만 "—".
 * **Cost efficiency**는 서로 다른 두 층: **위 = 비용 효율**(이 캠페인의 지출 ÷ 목표에 맞는 결과
 * — 인지 CPM · 트래픽 CPC · 참여 참여당 비용 · 전환 CPA. 과거·비교군·기준값 무관, 성과만 있으면 항상), **아래 "vs past"** =
 * 같은 KPI를 과거 비교군(같은 플랫폼·목표·단계 우선, 다른 이벤트, 3개 이상)과 견준 순위(없으면 "—" + 툴팁 "Not enough
 * comparison data" — 위 값이 못 미덥다는 뜻이 아니다). Good/Fair/Weak 자동 배지는 없다. 계획 대비 집행률은 세 번째 층으로
 * Daily budget 아래에만. Daily budget 아래에는 계획 대비 ±20/30%를 벗어날 때만 "Over 23%" 한 줄(RECAP_PACING_FLAG).
 *
 * 상호작용은 하나다(2026-09-07): **숫자 줄 어디를 눌러도** onRowClick — 보고서는 이걸로
 * Performance와 같은 캠페인 상세 드로어(성과·페이싱·캠페인 해석·일별 지출)를 연다.
 * 줄 끝 셰브론과 줄 아래 펼침은 찾기 어려워서 뺐고, 해석은 드로어 안으로 옮겼다.
 * 벤치마크 글자(onBenchmarkClick)는 stopPropagation으로 줄 클릭에서 빠진다.
 * selectedIds는 타임라인에서 고른 단계에 속한 줄들 표시(옅은 accent 면 + 왼쪽 2px 선) — 단계가 Meta+TikTok이면 두 표에 한 줄씩.
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
 * @param {string[]} selectedIds - 타임라인에서 고른 단계에 속한 캠페인 id들. 해당 줄에 옅은 accent 배경 + 왼쪽 2px accent 선 — "지금 고른 단계의 캠페인"이라는 방향 표시 [Optional, 기본값: []]
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
            <TableCell sx={HEAD_SX}>
              {t('recap.table.performance', lang)}
              {/* 종합 판정이 무엇을 보는지 — 목표별 규칙은 GOAL_PERFORMANCE_RULES, 여기선 짧은 설명만 */}
              <Tooltip
                arrow
                enterTouchDelay={0}
                slotProps={{ tooltip: { sx: { maxWidth: 340 } } }}
                title={(
                  <Box sx={{ display: 'grid', rowGap: 0.75, py: 0.25 }}>
                    <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{t('recap.table.perfTitle', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.perfBody', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.perfBody2', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.perfBody3', lang)}</Typography>
                  </Box>
                )}
              >
                <InfoOutlinedIcon sx={(theme) => ({ fontSize: theme.iconSize.inline, color: 'text.disabled', verticalAlign: 'middle', ml: 0.5, cursor: 'help' })} />
              </Tooltip>
            </TableCell>
            <TableCell align="right" sx={HEAD_SX}>{t('recap.table.dailyBudget', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.spend', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>
              {t('recap.table.verdict', lang)}
              {/* 판정이 어디서 오는지는 툴팁 한 줄로 — 표 안에 설명문을 두지 않는다 */}
              {/* 툴팁은 빠른 설명만 — 정의·비교군 규칙 같은 방법론은 비교 대화상자와 문서에 */}
              <Tooltip
                arrow
                enterTouchDelay={0}
                slotProps={{ tooltip: { sx: { maxWidth: 340 } } }}
                title={(
                  <Box sx={{ display: 'grid', rowGap: 0.75, py: 0.25 }}>
                    <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{t('recap.table.effTitle', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.effBody', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.effGoals', lang)}</Typography>
                    <Typography component="span" sx={{ fontSize: 12, lineHeight: 1.45, opacity: 0.9 }}>{t('recap.table.effRanking', lang)}</Typography>
                  </Box>
                )}
              >
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
            /* Efficiency 칸의 두 층 — 위: 이 캠페인의 결과당 비용(과거 무관, 성과만 있으면 항상), 아래 "vs past": 같은 KPI의
               과거 비교군 순위(3개 미만이면 "—" + 툴팁 "Not enough comparison data"). 둘은 다른 질문이라 섞지 않는다 */
            const eff = row.budgetEfficiency ?? null;
            const kpiKey = eff?.metricKey ?? (GOAL_HEADLINE_METRICS[row.goal] ?? [])[0] ?? null;
            const kpiStat = kpiKey ? row.benchmarks?.[kpiKey] ?? null : null;
            const hasComparison = Boolean(kpiStat && kpiStat.peerScope !== 'none' && kpiStat.percentile != null);
            const effHint = eff?.value != null ? t('recap.table.effValueHint', lang, { metric: metricLabel(eff.metricKey, lang), basis: t(`recap.table.effBasis.${eff.metricKey}`, lang) }) : '';
            /* 종합 성과(Performance) — 사람이 고른 판정이 우선, 없으면 목표별 규칙(GOAL_PERFORMANCE_RULES) 판정. 한 줄 설명은
               비용 구간 + 두드러진 진단 지표 하나: "Strong cost · weak hold". 규칙·근거는 툴팁 */
            const perf = row.performance ?? null;
            const humanVerdict = row.note?.verdict ?? null;
            const perfVerdict = humanVerdict ?? perf?.verdict ?? null;
            const short = (key) => t(`aspectShort.${METRIC_ASPECT[key] ?? 'reach'}`, lang);
            // 한 줄 설명: 대표 지표의 구간("Efficient reach cost") + 두드러진 진단 지표("· weak hold"). 현재 값 기준, 과거 순위 언급 없음
            const perfNote = !humanVerdict && perf?.primaryBand && perf.primaryKey
              ? [t(`perf.primary.${perf.primaryKey}.${perf.primaryBand}`, lang), perf.weakDiag ? t('perf.diag.weak', lang, { x: short(perf.weakDiag) }) : perf.strongDiag ? t('perf.diag.strong', lang, { x: short(perf.strongDiag) }) : null].filter(Boolean).join(' · ')
              : '';
            const perfRule = GOAL_PERFORMANCE_RULES[row.goal];
            const perfHint = humanVerdict
              ? t('recap.table.perfWritten', lang)
              : perfVerdict && perfRule
                ? t('recap.table.perfRule', lang, { primary: perfRule.primary.map((k) => metricLabel(k, lang)).join(' + '), important: perfRule.important.length ? t('recap.table.perfRuleImportant', lang, { important: perfRule.important.map((k) => short(k)).join('/') }) : '' })
                : hasData ? t('recap.table.perfNotEnoughHint', lang) : '';
            // vs target — 캠페인에 설정된 목표치가 있을 때만(없으면 줄 자체를 생략, 과거 평균으로 대체하지 않는다)
            const targetRatio = eff?.value != null && row.kpiTarget > 0 ? eff.value / row.kpiTarget : null;
            const targetTone = targetRatio == null ? null : targetRatio <= 0.95 ? 'success.main' : targetRatio >= 1.05 ? 'warning.main' : 'text.secondary';
            const targetText = targetRatio == null ? null
              : targetRatio <= 0.95 ? t('recap.table.targetBetter', lang, { pct: Math.round((1 - targetRatio) * 100), target: kpiFormat(eff.metricKey)(row.kpiTarget) })
                : targetRatio >= 1.05 ? t('recap.table.targetWorse', lang, { pct: Math.round((targetRatio - 1) * 100), target: kpiFormat(eff.metricKey)(row.kpiTarget) })
                  : t('recap.table.targetOn', lang, { target: kpiFormat(eff.metricKey)(row.kpiTarget) });
            const isConversion = row.goal === 'conversion' || row.goal === 'store_visit';
            const isSelected = selectedIds.includes(row.campaignId);
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
                      {/* 이름은 한 줄 + CSS 말줄임 — 긴 이름("Instagram post: … ✨")의 이모지·점이 혼자 다음 줄로 내려가면
                          깨져 보였다(i-26). 전체 이름은 hover 툴팁으로(단계 이름이 원본과 다르거나 길 때만) */}
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
                <TableCell sx={CELL_SX}>
                  {/* 종합 성과 — 배지(Good/Fair/Weak) + 한 줄 설명. 판정 없으면 "—" + "Not enough data". 툴팁에 규칙 */}
                  <Tooltip title={perfHint} placement="top" enterDelay={300}>
                    <Box sx={{ minWidth: 0, cursor: perfHint ? 'help' : 'default' }}>
                      <VerdictChip verdict={perfVerdict} isSuggested={false} lang={lang} size="sm" />
                      {perfVerdict ? (
                        perfNote && <Typography component="span" sx={{ ...META_SX, display: 'block', whiteSpace: 'normal', mt: 0.5 }}>{perfNote}</Typography>
                      ) : (
                        /* 성과 데이터가 있는데 판정이 없는 건 이 목표의 기준 범위가 없을 때뿐(전환·매장 방문) — "데이터 없음"이 아니다 */
                        hasData && <Typography component="span" sx={{ ...META_SX, display: 'block', whiteSpace: 'normal', mt: 0.5 }}>{t('recap.table.perfNoStandard', lang)}</Typography>
                      )}
                    </Box>
                  </Tooltip>
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
                  {/* Spend는 실제 총지출만 — CPM·순위는 Efficiency 칸의 몫(2026-09-07, 같은 정보가 두 칸에 있었다) */}
                </TableCell>
                <TableCell sx={CELL_SX}>
                  {/* 위: 이 캠페인의 결과당 비용 — 라벨(KPI 이름) → 값(700). 성과가 있으면 과거 비교와 무관하게 항상 */}
                  {eff?.value != null ? (
                    <Tooltip title={effHint} placement="top" enterDelay={400}>
                      <Box sx={{ minWidth: 0, cursor: 'help' }}>
                        <Typography component="span" sx={{ ...META_SX, lineHeight: 1.3, display: 'block' }}>{metricLabel(eff.metricKey, lang)}</Typography>
                        <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 700, lineHeight: 1.3, fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>{kpiFormat(eff.metricKey)(eff.value)}</Typography>
                        {/* vs target — 설정된 목표치가 있을 때만. 비용 지표라 낮으면 초록, 높으면 주황, ±5%는 중립 */}
                        {targetText && (
                          <Typography component="span" sx={{ display: 'block', fontSize: 10.5, fontWeight: 500, lineHeight: 1.3, mt: 0.25, color: targetTone, fontVariantNumeric: 'tabular-nums', whiteSpace: 'normal' }}>{targetText}</Typography>
                        )}
                      </Box>
                    </Tooltip>
                  ) : (
                    <Typography component="span" sx={{ display: 'block', fontSize: 13, color: 'text.disabled', lineHeight: 1.3 }}>{EMPTY}</Typography>
                  )}
                  {/* 아래 "vs past": 같은 KPI의 과거 비교군 순위 — 별개 층. 비교군 3개 미만이면 "—"(위 값이 못 미덥다는 뜻이 아니다) */}
                  {hasData && kpiKey && (
                    <Box sx={{ mt: 0.75 }}>
                      <Typography component="span" sx={{ ...META_SX, lineHeight: 1.3, display: 'block' }}>{t('recap.table.vsPast', lang)}</Typography>
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
                          <Typography component="span" sx={{ display: 'inline-block', fontSize: 10.5, color: 'text.disabled', lineHeight: 1.3, cursor: 'help' }}>{EMPTY}</Typography>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </TableCell>
                {!hasData ? (
                  <TableCell colSpan={3} sx={{ ...CELL_SX, color: 'text.secondary' }}>{t('recap.table.noData', lang)}</TableCell>
                ) : (
                  <>
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
                    <TableCell sx={CELL_SX}>
                      <SecondaryMetrics minWidth={36} parts={[
                        [metricLabel('likes', lang), count(row.likes)],
                        [metricLabel('comments', lang), count(row.comments)],
                        [metricLabel('shares', lang), count(row.shares)],
                      ]} />
                      <Box sx={{ display: 'flex', gap: ENGAGEMENT_GAP }}>
                        <MetricCell row={row} metricKey="engagementRate" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} minWidth={KPI_SLOT.engagement} />
                        <MetricCell row={row} metricKey="cpe" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} />
                      </Box>
                    </TableCell>
                    <TableCell sx={CELL_SX}>
                      <SecondaryMetrics minWidth={56} parts={[
                        [metricLabel('clicks', lang), count(row.clicks)],
                        [metricLabel('conversions', lang), count(row.conversions)],
                        [metricLabel('profileVisits', lang), count(row.profileVisits)],
                      ]} />
                      <Box sx={{ display: 'flex', gap: isConversion ? TRIPLE_GAP : KPI_GAP }}>
                        <MetricCell row={row} metricKey="ctr" format={fmtPercent} lang={lang} onBenchmarkClick={onBenchmarkClick} minWidth={isConversion ? KPI_SLOT.triple : KPI_SLOT.action} />
                        <MetricCell row={row} metricKey="cpc" format={money} lang={lang} onBenchmarkClick={onBenchmarkClick} minWidth={isConversion ? KPI_SLOT.triple : undefined} />
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
