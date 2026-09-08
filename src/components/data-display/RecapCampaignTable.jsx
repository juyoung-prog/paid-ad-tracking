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
import { money, count, percent, seconds, dateRangeWithDays, EMPTY } from '../../utils/format';

/** 대표 KPI 값 표기 — 비용 지표는 돈, 나머지는 비율. 계산이 아니라 표기다 */
const kpiFormat = (metricKey) => (['cpm', 'cpc', 'cpa', 'cpe'].includes(metricKey) ? money : (v) => percent(v, { digits: 2 }));

const fmtPercent = (v) => percent(v, { digits: 2 });

/**
 * 열 폭 — 보고서는 한 화면에 다 보이는 게 목표라 글자 열을 좁게 잡는다(vs target 포함 합 1616).
 * 순서: 캠페인 → 목표 → 일예산 → 지출 → Primary KPI → vs target → vs past → 영상 반응 → 참여 반응 → 행동 반응(2026-09-08)
 */
const COLUMN_WIDTH = {
  rank: 26,
  store: 46,
  // 264: "Jul 6 – Aug 31 (57 days)"는 한 줄, 이름은 한 줄 말줄임
  campaign: 264,
  // 캠페인 목표 한 단어("Store visit"이 가장 길다)
  goal: 90,
  dailyBudget: 80,
  // 실제 총지출만
  spend: 100,
  // 라벨("Cost/eng") + 값("$257.94") — 판단 없음
  primaryKpi: 96,
  // 설정된 목표치 대비 — 이 표의 캠페인 중 하나라도 목표치가 있을 때만 열이 생긴다
  vsTarget: 74,
  // 과거 비교군 순위("↗ best of 12") — 과거 데이터가 쓰이는 유일한 열
  vsPast: 88,
  // 대표 지표 자리 + "↗ lowest of 12"(≈79px)가 나란히 들어가는 폭: Video 75+24+79, Engagement 73+8+79, Action 82+24+79(전환은 셋)
  video: 224,
  engagement: 206,
  action: 232,
  // 해석 네 열(2026-09-08) — 한 문장씩, 12px 네 줄까지. 지표 열보다 조금 넓다. 넘치면 잘리고 전문은 hover
  worked: 200,
  improve: 200,
  why: 220,
  next: 240,
};
/**
 * vs target 열이 숨을 때 그 74px를 나눠 갖는 열 — 글자·지표가 많은 열에만. 짧은 숫자 열은 늘리지 않는다. 표 전체 폭은 그대로
 */
const TARGET_REDISTRIBUTION = { campaign: 14, video: 20, engagement: 20, action: 20 };
/** 해석 열은 표기 문제라 상수로 — 순서·문구 키·사람이 쓴 note 필드가 한 줄에 */
const INSIGHT_COLUMNS = [
  { key: 'worked', field: 'strength', noteField: 'strength' },
  { key: 'improve', field: 'weakness', noteField: 'weakness' },
  { key: 'why', field: 'reason', noteField: 'reason' },
  { key: 'next', field: 'recommendation', noteField: null },
];
/** 해석 칸 — 12px, 네 줄에서 잘리고 전문은 hover 툴팁. 상자·배경 없음 */
const INSIGHT_TEXT_SX = { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 12, lineHeight: 1.45, whiteSpace: 'normal', overflowWrap: 'anywhere' };
/** 수치 열과 해석 열 사이 — 옅은 세로 구분선 하나(머리글·본문 같은 자리) */
const INSIGHT_DIVIDER_SX = { borderLeft: '1px solid', borderLeftColor: 'divider' };
const columnWidthsFor = (hasTargets) => {
  if (hasTargets) return COLUMN_WIDTH;
  const { vsTarget: _hidden, ...rest } = COLUMN_WIDTH;
  Object.entries(TARGET_REDISTRIBUTION).forEach(([key, extra]) => { rest[key] += extra; });
  return rest;
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
 * 해석 문장 — schema buildCampaignInsight()의 재료(어느 지표가 비교군 몇 개 중 어디였나)를 한 문장으로.
 * 근거가 있는 말만 한다: 순위·백분위·초과 지출. 원인은 관측된 관계만 적고 "the data does not show why"로 닫는다.
 * 사람이 Edit에서 쓴 note가 있으면 호출부가 그것을 먼저 쓴다.
 */
function insightSentence(field, item, row, platformLabel, lang) {
  if (!item) return null;
  const scope = (it) => (it.scope === 'phase'
    ? t('cell.scope.phase', lang, { platform: platformLabel, phase: row.phaseName })
    : t('cell.scope.goal', lang, { platform: platformLabel, goal: GOAL_KEYS.includes(row.goal) ? t(`goalLabel.${row.goal}`, lang).toLowerCase() : row.goal }));
  if (field === 'strength' || field === 'weakness') {
    if (item.kind === 'overspend') return t('cell.improve.overspend', lang, { pct: item.pct });
    const stat = item.stat; if (!stat) return null;
    const params = { metric: metricLabel(item.metricKey, lang), n: stat.sampleSize + 1, scope: scope(item) };
    if (field === 'strength') return stat.percentile >= 100 ? t('cell.worked.best', lang, params) : t('cell.worked.top', lang, { ...params, pct: 100 - stat.percentile });
    return stat.percentile <= 0 ? t('cell.improve.lowest', lang, params) : t('cell.improve.bottom', lang, { ...params, pct: stat.percentile });
  }
  if (field === 'reason') {
    const known = ['reachNotAction', 'actionNotReach', 'hookNotHold', 'holdNotHook', 'allStrong', 'allWeak'];
    return t(`cell.why.${known.includes(item.kind) ? item.kind : 'unknown'}`, lang);
  }
  const aspect = (a) => (a ? t(`aspect.${a}`, lang) : '');
  const short = (a) => (a ? t(`aspectShort.${a}`, lang) : '');
  return t(`cell.next.${item.kind}`, lang, { keep: short(item.keepAspect), test: short(item.testAspect), aspect: aspect(item.aspect), metric: item.metricKey ? metricLabel(item.metricKey, lang) : '', pct: item.pct ?? '' });
}

/**
 * RecapCampaignTable 컴포넌트
 *
 * 보고서(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표. 열은 서로 다른 질문 하나씩이고 **종합 등급은 없다**
 * (2026-09-08 제품 결정 — 회사 KPI 기준값이 없고, 과거 비교로 등급을 만들지 않는다):
 * 순위 · 매장 · 캠페인(28px 소재 썸네일 + 단계 이름 + 기간) · **Goal**(캠페인 목표 한 단어, 해석 없음) · 일예산 · 지출 ·
 * **Primary KPI**(목표별 실제 대표 결과 — 인지 CPM · 트래픽 CPC · 참여 Cost/eng · 전환/매장 방문 CPA. 라벨 + 현재 값, 판단어 없음) ·
 * **vs target**(캠페인에 설정된 목표치와의 비교만, 없으면 "—". 이 표에 목표치가 하나도 없으면 열을 숨기고 폭을 나눠 준다) ·
 * **vs past**(같은 플랫폼·목표의 과거 비교군 사이 Primary KPI 순위, 3개 미만이면 "—". 맥락일 뿐 등급이 아니다) ·
 * **Video / Engagement / Action response**(진단 근거 — 지표마다 과거 비교 화살표는 명시된 과거 맥락으로만) ·
 * **What worked · Could improve · Why · Next action**(해석 네 열, 2026-09-08 — 드로어의 Campaign insights를 표로 옮겼다.
 * 현재 지표 → 과거 맥락 → 해석 → 다음 행동을 가로로 한 번에 읽는다). 재료는 schema buildCampaignInsight(비교군 순위·초과
 * 지출뿐)이고 문장은 insightSentence가 한 줄로 만든다. 순위 없이 "strong/weak"라 하지 않고, 원인은 데이터가 말하는 관계만
 * 적는다. 사람이 Edit에서 쓴 note(strength/weakness/reason)가 있으면 그것이 우선(툴팁 "Written by a person in Edit."). 등급은 없다.
 *
 * 상호작용: **숫자 줄 어디를 눌러도** onRowClick — 캠페인 상세 드로어. 벤치마크 글자(onBenchmarkClick)는 stopPropagation.
 * selectedIds는 타임라인에서 고른 단계의 줄 표시(옅은 accent 면 + 왼쪽 2px 선).
 *
 * 계산은 하지 않는다 — rows는 schema.js buildRecapRows()가 순위·벤치마크·Primary KPI까지 끝낸 결과다.
 * 이 컴포넌트는 그 값을 자리에 놓고 utils/format으로 표기만 한다. 문구는 recapStrings에서 꺼낸다.
 *
 * Props:
 * @param {Array<Object>} rows - buildRecapRows().byPlatform[platform] — 한 플랫폼의 행 배열(순위순) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {function} onRowClick - 숫자 줄 클릭 (campaignId) => void. 있으면 줄 전체가 버튼이고 Tab/Enter로도 눌린다 [Optional]
 * @param {function} onBenchmarkClick - 벤치마크 글자 클릭 (campaignId, metricKey) => void — 비교군 대화상자 [Optional]
 * @param {string[]} selectedIds - 타임라인에서 고른 단계에 속한 캠페인 id들 [Optional, 기본값: []]
 * @param {string} label - 스크롤 영역의 접근성 이름 [Optional, 기본값: 'Recap campaign table']
 * @param {string} platformLabel - 해석 문장에 쓰는 플랫폼 표시명("Meta") [Optional, 기본값: rows[0].platform]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignTable rows={byPlatform.meta} platformLabel="Meta" onRowClick={(id) => setDetailCampaignId(id)} selectedIds={phaseSelection?.ids ?? []} />
 */
export function RecapCampaignTable({ rows, lang = 'en', onRowClick, onBenchmarkClick, selectedIds = [], label = 'Recap campaign table', platformLabel, sx }) {
  if (!rows || rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5, ...sx }}>
        {t('recap.table.empty', lang)}
      </Typography>
    );
  }

  // vs target 열은 이 표의 캠페인 중 하나라도 유효한 목표치가 있을 때만 — "—"로만 찬 열은 소음이라 숨긴다(표시 층만, 계산·데이터는 그대로)
  const hasTargets = rows.some((r) => r.kpiTarget > 0);
  const widths = columnWidthsFor(hasTargets);
  const platformName = platformLabel ?? rows[0]?.platform ?? '';
  const columnWidths = Object.values(widths);
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

  return (
    <ScrollArea label={label} startOffset={widths.rank + widths.store + widths.campaign} edgeStrength="subtle" sx={sx}>
      <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: tableWidth }}>
        <colgroup>
          {columnWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell sx={HEAD_SX}>{t('recap.table.rank', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.store', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.campaign', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.goal', lang)}</TableCell>
            <TableCell align="right" sx={HEAD_SX}>{t('recap.table.dailyBudget', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.spend', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>
              {t('recap.table.primaryKpi', lang)}
              {/* 어떤 KPI가 왜 보이는지만 — 판단·기준·등급 이야기는 없다 */}
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
                <InfoOutlinedIcon sx={(theme) => ({ fontSize: theme.iconSize.inline, color: 'text.disabled', verticalAlign: 'middle', ml: 0.5, cursor: 'help' })} />
              </Tooltip>
            </TableCell>
            {hasTargets && (
              <Tooltip title={t('recap.table.vsTargetHint', lang)} placement="top" enterDelay={400} slotProps={{ tooltip: { sx: { maxWidth: 300 } } }}>
                <TableCell sx={{ ...HEAD_SX, cursor: 'help' }}>{t('recap.table.vsTarget', lang)}</TableCell>
              </Tooltip>
            )}
            <Tooltip title={t('recap.table.vsPastHint', lang)} placement="top" enterDelay={400} slotProps={{ tooltip: { sx: { maxWidth: 320 } } }}>
              <TableCell sx={{ ...HEAD_SX, cursor: 'help' }}>{t('recap.table.vsPast', lang)}</TableCell>
            </Tooltip>
            <TableCell sx={HEAD_SX}>{t('recap.table.videoResponse', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.engagementResponse', lang)}</TableCell>
            <TableCell sx={HEAD_SX}>{t('recap.table.actionResponse', lang)}</TableCell>
            {/* 해석 네 열 — 첫 열 왼쪽에 옅은 구분선. 근거 수준은 머리글 툴팁 한 줄로만 */}
            {INSIGHT_COLUMNS.map((col, i) => (
              <Tooltip key={col.key} title={t('insight.autoHint', lang)} placement="top" enterDelay={500} slotProps={{ tooltip: { sx: { maxWidth: 320 } } }}>
                <TableCell sx={{ ...HEAD_SX, ...(i === 0 ? INSIGHT_DIVIDER_SX : {}), cursor: 'help' }}>{t(`insight.field.${col.field}`, lang)}</TableCell>
              </Tooltip>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const hasData = row.spend != null || row.impressions != null;
            /* Primary KPI — 목표별 결과당 현재 비용(schema budgetEfficiency). 판단하지 않는다 */
            const kpi = row.budgetEfficiency ?? null;
            const kpiKey = kpi?.metricKey ?? (GOAL_HEADLINE_METRICS[row.goal] ?? [])[0] ?? null;
            const kpiHint = kpi?.value != null ? t('recap.table.primaryKpiValueHint', lang, { metric: metricLabel(kpi.metricKey, lang), basis: t(`recap.table.primaryKpiBasis.${kpi.metricKey}`, lang) }) : '';
            /* vs past — 같은 KPI의 과거 비교군 순위. 비교군 3개 미만이면 "—"(Primary KPI 값이 못 미덥다는 뜻이 아니다) */
            const kpiStat = kpiKey ? row.benchmarks?.[kpiKey] ?? null : null;
            const hasComparison = Boolean(kpiStat && kpiStat.peerScope !== 'none' && kpiStat.percentile != null);
            /* vs target — 캠페인에 설정된 목표치만. 없으면 "—"(Not set). 대체값 없음 */
            const targetRatio = kpi?.value != null && row.kpiTarget > 0 ? kpi.value / row.kpiTarget : null;
            const targetTone = targetRatio == null ? null : targetRatio <= 0.95 ? 'success.main' : targetRatio >= 1.05 ? 'warning.main' : 'text.secondary';
            const targetText = targetRatio == null ? null
              : targetRatio <= 0.95 ? t('recap.table.targetBetter', lang, { pct: Math.round((1 - targetRatio) * 100), target: kpiFormat(kpi.metricKey)(row.kpiTarget) })
                : targetRatio >= 1.05 ? t('recap.table.targetWorse', lang, { pct: Math.round((targetRatio - 1) * 100), target: kpiFormat(kpi.metricKey)(row.kpiTarget) })
                  : t('recap.table.targetOn', lang, { target: kpiFormat(kpi.metricKey)(row.kpiTarget) });
            const isConversion = row.goal === 'conversion' || row.goal === 'store_visit';
            const isSelected = selectedIds.includes(row.campaignId);
            /* 해석 네 칸 — 사람이 쓴 note가 우선, 없으면 재료(insight)에서 한 문장. 데이터 없으면 다음 행동만 "데이터 더 모으기" */
            const insightCells = INSIGHT_COLUMNS.map((col) => {
              const written = col.noteField ? (localizedText(row.note?.[col.noteField], lang).value ?? '').trim() : '';
              if (written) return { ...col, text: written, isWritten: true };
              if (!hasData) return { ...col, text: col.field === 'recommendation' ? t('cell.next.collect', lang) : null, isWritten: false };
              const auto = insightSentence(col.field, row.insight?.[col.field] ?? null, row, platformName, lang);
              return { ...col, text: auto ?? (col.field === 'reason' ? t('cell.why.unknown', lang) : null), isWritten: false };
            });
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
                {/* 매장이 여럿인 캠페인("G01, G02, …")은 좁은 열을 넘쳐 옆 칸 글자와 겹쳤다 — 첫 매장 + "+N" 두 줄로, 전체 목록은 title로 */}
                <TableCell sx={{ ...CELL_SX, fontWeight: 600, whiteSpace: 'nowrap' }} title={stores.length > 1 ? row.storeCode : undefined}>
                  {stores[0] ?? row.storeCode}
                  {stores.length > 1 && (
                    <Typography component="span" sx={{ ...META_SX, display: 'block', fontWeight: 500 }}>+{stores.length - 1}</Typography>
                  )}
                </TableCell>
                <TableCell sx={CELL_SX}>
                  {/* [썸네일] 이름 / 기간 — 이름이 비슷한 Meta·TikTok 캠페인을 소재로 가른다. 목표는 옆의 Goal 열로 갔다 */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
                    <CampaignThumbnail thumbnailUrl={row.thumbnailUrl} name={row.name} platform={row.platform} size={28} sx={(theme) => ({ borderRadius: `${theme.shape.radius.inlay}px` })} />
                    <Box sx={{ minWidth: 0 }}>
                      {/* 이름은 한 줄 + CSS 말줄임 — 긴 이름의 이모지·점이 혼자 다음 줄로 내려가면 깨져 보였다(i-26). 전체 이름은 hover 툴팁 */}
                      <Tooltip title={row.name !== row.phaseName || row.phaseName.length > 24 ? row.name : ''} placement="top" enterDelay={500}>
                        <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.phaseName}
                        </Typography>
                      </Tooltip>
                      <Typography component="span" sx={{ ...META_SX, display: 'block', whiteSpace: 'normal' }}>
                        {dateRangeWithDays(row.startDate, row.endDate)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={CELL_SX}>
                  {/* Goal — 캠페인 데이터의 목표 그대로. 등급도 해석도 없다. 데이터에 없으면 "—" */}
                  <Typography component="span" sx={{ display: 'block', fontSize: 12, lineHeight: 1.4, color: GOAL_KEYS.includes(row.goal) ? 'text.primary' : 'text.disabled' }}>
                    {GOAL_KEYS.includes(row.goal) ? t(`goalLabel.${row.goal}`, lang) : EMPTY}
                  </Typography>
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
                  {/* Primary KPI — 라벨(옅게) → 값(700). 판단어 없음. 툴팁에 계산식만 */}
                  {kpi?.value != null ? (
                    <Tooltip title={kpiHint} placement="top" enterDelay={400}>
                      <Box sx={{ minWidth: 0, cursor: 'help' }}>
                        <Typography component="span" sx={{ ...META_SX, lineHeight: 1.3, display: 'block' }}>{metricLabel(kpi.metricKey, lang)}</Typography>
                        <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 700, lineHeight: 1.3, fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>{kpiFormat(kpi.metricKey)(kpi.value)}</Typography>
                      </Box>
                    </Tooltip>
                  ) : (
                    <Typography component="span" sx={{ display: 'block', fontSize: 13, color: 'text.disabled', lineHeight: 1.3 }}>{EMPTY}</Typography>
                  )}
                </TableCell>
                {/* vs target 열 — 이 표에 목표치가 하나라도 있을 때만. 있는 줄은 비교(낮으면 초록, 높으면 주황, ±5% 중립), 없는 줄은 "—" */}
                {hasTargets && (
                  <TableCell sx={CELL_SX}>
                    {targetText ? (
                      <Typography component="span" sx={{ display: 'block', fontSize: 11.5, fontWeight: 500, lineHeight: 1.35, color: targetTone, fontVariantNumeric: 'tabular-nums', whiteSpace: 'normal' }}>{targetText}</Typography>
                    ) : (
                      <Tooltip title={t('recap.table.targetNotSet', lang)} placement="top" enterDelay={300}>
                        <Typography component="span" sx={{ display: 'inline-block', fontSize: 12, color: 'text.disabled', lineHeight: 1.35, cursor: 'help' }}>{EMPTY}</Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                )}
                <TableCell sx={CELL_SX}>
                  {/* vs past — Primary KPI를 과거 비교군과 견준 순위. 맥락일 뿐 등급이 아니다. 비교군 3개 미만이면 "—" */}
                  {hasData && kpiKey && hasComparison ? (
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
                      <Typography component="span" sx={{ display: 'inline-block', fontSize: 12, color: 'text.disabled', lineHeight: 1.35, cursor: 'help' }}>{EMPTY}</Typography>
                    </Tooltip>
                  )}
                </TableCell>
                {!hasData ? (
                  <TableCell colSpan={3} sx={{ ...CELL_SX, color: 'text.secondary' }}>{t('recap.table.noData', lang)}</TableCell>
                ) : (
                  <>
                    {/* 진단 근거 — 보조 수량 위, 대표 비율 아래. 지표 옆 화살표는 명시된 과거 맥락("best of 4")이지 등급이 아니다 */}
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
                {/* 해석 네 칸 — 상자 없이 문장만. 네 줄 넘으면 잘리고 전문은 hover. 비어 있으면 "—" */}
                {insightCells.map((cell, i) => (
                  <TableCell key={cell.key} sx={{ ...CELL_SX, ...(i === 0 ? INSIGHT_DIVIDER_SX : {}) }}>
                    {cell.text ? (
                      <Tooltip title={`${cell.text}${cell.isWritten ? ` — ${t('insight.writtenHint', lang)}` : ''}`} placement="top" enterDelay={500} slotProps={{ tooltip: { sx: { maxWidth: 360 } } }}>
                        <Typography component="span" sx={{ ...INSIGHT_TEXT_SX, color: 'text.primary', cursor: 'help' }}>{cell.text}</Typography>
                      </Tooltip>
                    ) : (
                      <Typography component="span" sx={{ fontSize: 12, color: 'text.disabled', lineHeight: 1.45 }}>{EMPTY}</Typography>
                    )}
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
