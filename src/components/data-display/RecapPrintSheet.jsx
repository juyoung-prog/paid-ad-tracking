import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { t, metricLabel, benchmarkPositionText } from '../../data/recapStrings';
import { localizedText } from '../../data/schema';
import { money, moneyWhole, dateRange, dateRangeWithDays, EMPTY } from '../../utils/format';
import { RecapPrintTimeline } from './RecapPrintTimeline';
import {
  INSIGHT_COLUMNS,
  engagementLayout,
  fmtPercent,
  goalText,
  hasRowData,
  insightCellsOf,
  kpiFormat,
  primaryKpiOf,
  secondaryText,
  storeTextOf,
  videoSecondaryText,
} from './recapRowView';

/**
 * 인쇄본은 화면을 줄인 것이 아니다 — Letter **세로** 한 장의 흐름에 맞춰 다시 짠 문서다.
 * 그래서 화면 폭에 기대는 것(가로로 아홉 열인 캠페인 표)은 세로로 쌓인 블록으로 바꾼다.
 * 다만 타임라인은 **그림 그대로 남긴다**(2026-09-10) — 겹침과 기간은 표가 답하지 못하는 질문이고,
 * 좁아진 폭은 치수를 다시 잡아 해결한다(RecapPrintTimeline). 화면 레이아웃은 건드리지 않는다.
 *
 * 글자 크기는 px가 아니라 pt다 — 이 컴포넌트는 종이에서만 그려지고, 본문 9pt/보조 8pt가
 * 종이에서 읽히는 최소선이다. 색은 흑백 출력에서 살아남게 text.primary·text.secondary·divider만
 * 쓴다(순위의 초록·주황은 인쇄에서 회색으로 뭉개져 뜻을 잃는다 — 글자로만 말한다).
 */
const PT = { title: '17pt', section: '11pt', block: '10.5pt', body: '9pt', meta: '8pt' };

/** 화면에서는 없는 것과 같다 — @media print에서만 그려진다 */
const ROOT_SX = {
  display: 'none',
  '@media print': {
    display: 'block',
    color: 'text.primary',
    fontSize: PT.body,
    lineHeight: 1.45,
  },
};

/** 캠페인 한 장 — 페이지 경계에서 쪼개지지 않는다(브리프 요구) */
const BLOCK_SX = {
  breakInside: 'avoid',
  pageBreakInside: 'avoid',
  border: '0.5pt solid',
  borderColor: 'divider',
  borderRadius: '2pt',
  px: '8pt',
  py: '7pt',
  mb: '7pt',
};
/** 라벨 열 + 내용 열 — 표가 아니라 정의 목록이라 세로로 길어져도 읽힌다 */
const FIELD_GRID_SX = { display: 'grid', gridTemplateColumns: '78pt 1fr', columnGap: '8pt', rowGap: '3pt', mt: '5pt' };
const LABEL_SX = { fontSize: PT.meta, fontWeight: 600, color: 'text.secondary', lineHeight: 1.45, pt: '0.5pt' };
const VALUE_SX = { fontSize: PT.body, lineHeight: 1.45, color: 'text.primary' };
const SUB_SX = { fontSize: PT.meta, lineHeight: 1.4, color: 'text.secondary' };

/** 정의 목록 한 줄 — 값이 없으면 줄을 만들지 않는다(빈 라벨만 남는 줄은 종이를 낭비한다) */
function Field({ label, children }) {
  if (!children) return null;
  return (
    <>
      <Typography component="dt" sx={LABEL_SX}>{label}</Typography>
      <Box component="dd" sx={{ m: 0, minWidth: 0 }}>{children}</Box>
    </>
  );
}

/** "Hook 23.11% (best of 12)" — 값 다음에 순위를 괄호로. 색이 아니라 글자가 순위를 말한다 */
function metricText(row, metricKey, format, lang) {
  const value = row[metricKey];
  if (value == null) return null;
  const stat = row.benchmarks?.[metricKey];
  const hasComparison = Boolean(stat && stat.peerScope !== 'none' && stat.percentile != null);
  return (
    <Box component="span">
      <Box component="span" sx={{ color: 'text.secondary' }}>{metricLabel(metricKey, lang)} </Box>
      <Box component="span" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{format(value)}</Box>
      {hasComparison && <Box component="span" sx={{ color: 'text.secondary' }}> ({benchmarkPositionText(stat, lang)})</Box>}
    </Box>
  );
}

/** 지표 여러 개를 한 줄로 — 값이 없는 것은 빠진다 */
function MetricLine({ row, metricKeys, format, lang }) {
  const parts = metricKeys.map((key) => ({ key, node: metricText(row, key, format ?? kpiFormat(key), lang) })).filter((p) => p.node);
  if (parts.length === 0) return null;
  return (
    <Typography component="span" sx={{ ...VALUE_SX, display: 'block' }}>
      {parts.map((p, i) => (
        <Box component="span" key={p.key}>{i > 0 && ' · '}{p.node}</Box>
      ))}
    </Typography>
  );
}

/**
 * RecapPrintSheet 컴포넌트
 *
 * Event Recap의 **인쇄 전용 문서**(Letter 세로). 화면의 아홉 열짜리 표와 가로 타임라인은
 * 세로 한 장에 들어가지 않으므로, 인쇄에서는 같은 값을 (1) 촘촘한 머리글 (2) 단계별 요약 표
 * (3) 플랫폼 제목 아래 세로로 쌓인 캠페인 블록으로 다시 배치한다. 화면 컴포넌트는 그대로 두고
 * 이 컴포넌트만 @media print에서 나타난다 — 웹 레이아웃은 한 픽셀도 바뀌지 않는다.
 *
 * 계산은 하지 않는다 — rows는 schema.js buildRecapRows()의 결과 그대로이고, 목표별 지표 구성과
 * 해석 문장은 화면 표와 같은 모듈(recapRowView)에서 온다. 그래서 웹에서 읽은 문장이 PDF에서
 * 달라지지 않는다.
 *
 * Props:
 * @param {string} eventName - 이벤트 이름 [Required]
 * @param {string} startDate - 이벤트 시작일(ISO date) [Required]
 * @param {string} endDate - 이벤트 종료일(ISO date) [Required]
 * @param {number} campaignCount - 캠페인 수 [Required]
 * @param {number|null} spend - 총 지출 [Optional]
 * @param {number|null} plannedBudget - 계획 예산 합 [Optional]
 * @param {string[]} stores - 타겟 매장 코드 목록 [Optional, 기본값: []]
 * @param {string[]} platforms - 플랫폼 표시명 목록 [Optional, 기본값: []]
 * @param {{ metricKey: string, rank: number, total: number, peerEvents: string[] }|null} headline - buildRecapHeadline() 결과 [Optional]
 * @param {'draft'|'final'|null} status - 보고서 상태 [Optional]
 * @param {object|null} summary - 요약 단락(LocalizedText) [Optional]
 * @param {Array<Object>} phases - buildPhaseTimeline() 결과 [Optional, 기본값: []]
 * @param {Object} phaseSpend - phase.key → 지출 합 [Optional, 기본값: {}]
 * @param {Array<{ platform: string, label: string, rows: Array<Object> }>} sections - 플랫폼별 캠페인 행 [Optional, 기본값: []]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 *
 * Example usage:
 * <RecapPrintSheet eventName="G10 Opening" startDate="2026-06-17" endDate="2026-08-31" campaignCount={6} spend={3896.5} phases={phases} sections={sections} />
 */
export function RecapPrintSheet({
  eventName,
  startDate,
  endDate,
  campaignCount,
  spend = null,
  plannedBudget = null,
  stores = [],
  platforms = [],
  headline = null,
  status = null,
  summary = null,
  phases = [],
  phaseSpend = {},
  sections = [],
  lang = 'en',
}) {
  const metaLine = [dateRange(startDate, endDate), stores.join(', ') || null, platforms.join(' + ') || null].filter(Boolean).join(' · ');
  /* "$6,068.77 spent of $6,728 planned" — 지출과 계획은 한 문장이다(가운뎃점으로 끊으면 "of ..."가 홀로 남아 읽히지 않는다) */
  const spendText = spend != null
    ? [t('recap.table.spent', lang, { amount: money(spend) }), plannedBudget ? t('recap.kpi.ofPlanned', lang, { planned: moneyWhole(plannedBudget) }) : null].filter(Boolean).join(' ')
    : (plannedBudget ? t('recap.table.planned', lang, { amount: moneyWhole(plannedBudget) }) : null);
  const totalsLine = [t('recap.print.campaignCount', lang, { n: campaignCount }), spendText].filter(Boolean).join(' · ');
  const headlineText = headline
    ? t(headline.rank === 1 ? 'recap.headline.best' : 'recap.headline.rank', lang, {
      rank: headline.rank,
      total: headline.total,
      metric: metricLabel(headline.metricKey, lang),
    })
    : null;
  const summaryText = localizedText(summary, lang).value;

  return (
    <Box data-print="sheet" sx={ROOT_SX}>
      {/* 머리글 — 이름·기간·매장·플랫폼·합계 네 줄. 화면의 KPI 카드는 종이에서 자리만 먹는다 */}
      <Box component="header" sx={{ breakInside: 'avoid', borderBottom: '1pt solid', borderColor: 'text.primary', pb: '6pt', mb: '10pt' }}>
        <Typography component="h1" sx={{ fontSize: PT.title, fontWeight: 700, lineHeight: 1.2 }}>
          {eventName}
          {status && <Box component="span" sx={{ fontSize: PT.meta, fontWeight: 600, color: 'text.secondary', ml: '6pt' }}>{t(`recap.status.${status}`, lang)}</Box>}
        </Typography>
        <Typography component="p" sx={{ ...SUB_SX, mt: '2pt' }}>{metaLine}</Typography>
        <Typography component="p" sx={{ ...VALUE_SX, mt: '2pt', fontVariantNumeric: 'tabular-nums' }}>{totalsLine}</Typography>
        {headlineText && (
          <Typography component="p" sx={{ ...VALUE_SX, mt: '2pt', fontWeight: 600 }}>
            {headlineText}
            {headline.peerEvents?.length > 0 && <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}> — {headline.peerEvents.join(' · ')}</Box>}
          </Typography>
        )}
      </Box>

      {summaryText && (
        <Typography component="p" sx={{ ...VALUE_SX, mb: '10pt', breakInside: 'avoid' }}>{summaryText}</Typography>
      )}

      {/* 타임라인 — 표가 아니라 화면과 같은 **그림**이다(2026-09-10). 겹침·기간은 막대의 위치와 길이만 답한다.
          치수만 세로 종이용으로 다시 잡는다(왼쪽 40% / 축 60%, 눈금은 1·15일과 양 끝) */}
      {phases.length > 0 && (
        <Box component="section" sx={{ mb: '12pt', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <Typography component="h2" sx={{ fontSize: PT.section, fontWeight: 700, mb: '4pt', breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>{t('recap.section.timeline', lang)}</Typography>
          <RecapPrintTimeline phases={phases} phaseSpend={phaseSpend} lang={lang} />
        </Box>
      )}

      {/* 플랫폼별 캠페인 — 화면의 가로 표 대신 세로로 쌓인 블록 */}
      {sections.map((section) => (
        <Box component="section" key={section.platform} sx={{ mb: '10pt' }}>
          <Typography component="h2" sx={{ fontSize: PT.section, fontWeight: 700, mb: '5pt', breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
            {t('recap.section.campaigns', lang, { platform: section.label })}
          </Typography>
          {section.rows.map((row) => {
            const hasData = hasRowData(row);
            const { kpi, stat: kpiStat, hasComparison } = primaryKpiOf(row);
            const layout = engagementLayout(row.goal);
            const engagementSecondary = secondaryText(row, layout.secondary, lang);
            const videoSecondary = videoSecondaryText(row, lang);
            const insightCells = insightCellsOf(row, lang);
            const { storeText } = storeTextOf(row);
            const budgetText = [
              row.dailyBudget != null ? t('recap.table.perDay', lang, { amount: money(row.dailyBudget) }) : null,
              row.spend != null ? t('recap.table.spent', lang, { amount: money(row.spend) }) : null,
            ].filter(Boolean).join(' · ');
            return (
              <Box key={row.campaignId} sx={BLOCK_SX}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8pt' }}>
                  <Typography component="h3" sx={{ fontSize: PT.block, fontWeight: 700, lineHeight: 1.3, minWidth: 0 }}>
                    <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>{row.rank}. </Box>
                    {row.phaseName}
                  </Typography>
                  <Typography component="span" sx={{ ...SUB_SX, flexShrink: 0 }}>{goalText(row.goal, lang) ?? EMPTY}</Typography>
                </Box>
                <Typography component="p" sx={{ ...SUB_SX, mt: '1pt' }}>
                  {[storeText, dateRangeWithDays(row.startDate, row.endDate)].filter(Boolean).join(' · ')}
                </Typography>

                <Box component="dl" sx={FIELD_GRID_SX}>
                  <Field label={t('recap.table.budgetSpend', lang)}>
                    {budgetText ? <Typography component="span" sx={{ ...VALUE_SX, display: 'block', fontVariantNumeric: 'tabular-nums' }}>{budgetText}</Typography> : null}
                  </Field>
                  <Field label={t('recap.table.primaryKpi', lang)}>
                    {kpi?.value != null ? (
                      <Typography component="span" sx={{ ...VALUE_SX, display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                        <Box component="span" sx={{ color: 'text.secondary' }}>{metricLabel(kpi.metricKey, lang)} </Box>
                        <Box component="span" sx={{ fontWeight: 700 }}>{kpiFormat(kpi.metricKey)(kpi.value)}</Box>
                        {hasComparison && <Box component="span" sx={{ color: 'text.secondary' }}> ({benchmarkPositionText(kpiStat, lang)})</Box>}
                      </Typography>
                    ) : null}
                  </Field>
                  {hasData ? (
                    <>
                      <Field label={t('recap.table.videoResponse', lang)}>
                        {(row.hookRate != null || row.holdRate != null || videoSecondary) ? (
                          <>
                            <MetricLine row={row} metricKeys={['hookRate', 'holdRate']} format={fmtPercent} lang={lang} />
                            {videoSecondary && <Typography component="span" sx={{ ...SUB_SX, display: 'block', fontVariantNumeric: 'tabular-nums' }}>{videoSecondary}</Typography>}
                          </>
                        ) : null}
                      </Field>
                      <Field label={t('recap.table.engagementAction', lang)}>
                        {(layout.primary.some((key) => row[key] != null) || engagementSecondary) ? (
                          <>
                            <MetricLine row={row} metricKeys={layout.primary} lang={lang} />
                            {engagementSecondary && <Typography component="span" sx={{ ...SUB_SX, display: 'block', fontVariantNumeric: 'tabular-nums' }}>{engagementSecondary}</Typography>}
                          </>
                        ) : null}
                      </Field>
                    </>
                  ) : (
                    <Field label={t('recap.table.videoResponse', lang)}>
                      <Typography component="span" sx={{ ...SUB_SX, display: 'block' }}>{t('recap.table.noData', lang)}</Typography>
                    </Field>
                  )}
                  {/* 해석 두 줄 — 화면과 같은 문장(사람이 쓴 글 우선, 없으면 자동 문장). 근거가 없으면 줄이 없다 */}
                  {insightCells.map((cell) => (
                    <Field key={cell.key} label={t(`insight.field.${cell.field}`, lang)}>
                      {cell.text ? <Typography component="span" sx={{ ...VALUE_SX, display: 'block' }}>{cell.text}</Typography> : null}
                    </Field>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
