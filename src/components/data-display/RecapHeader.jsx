import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { KpiBar } from './KpiBar';
import { RecapStatusBadge } from './RecapStatusBadge';
import { t, metricLabel } from '../../data/recapStrings';
import { money, moneyWhole, dateRange, EMPTY } from '../../utils/format';

/**
 * RecapHeader 컴포넌트
 *
 * Recap 문서의 머리글 — 이벤트 이름과 보고서 상태, 기간·매장·플랫폼 한 줄,
 * KpiBar(캠페인 수 · 지출 · 매장), 그리고 **순위 한 줄**("Best of 5 comparable
 * events by CPM"). 순위 문장은 읽는 사람이 가장 먼저 보는 판단이라 KPI 아래에
 * 따로 굵게 둔다. 순위 재료(headline)가 없으면 그 줄을 생략한다 — 지어내지 않는다.
 *
 * 계산은 하지 않는다 — 합계·순위는 페이지가 schema.js로 만들어 넘긴다.
 *
 * Props:
 * @param {string} eventName - 이벤트 이름 [Required]
 * @param {string} startDate - 이벤트 시작일(ISO date) [Required]
 * @param {string} endDate - 이벤트 종료일(ISO date) [Required]
 * @param {number} campaignCount - 캠페인 수 [Required]
 * @param {number|null} spend - 총 지출 [Required]
 * @param {number|null} plannedBudget - 계획 예산 합. 있으면 지출 옆에 "of $X planned" [Optional]
 * @param {string[]} stores - 타겟 매장 코드 목록 [Optional, 기본값: []]
 * @param {string[]} platforms - 플랫폼 표시명 목록(예: ['Meta', 'TikTok']) [Optional, 기본값: []]
 * @param {{ metricKey: string, rank: number, total: number, peerEvents: string[] }|null} headline - schema.js buildRecapHeadline() 결과 [Optional]
 * @param {'draft'|'final'|null} status - 보고서 상태. null이면 아직 시작 전 [Optional]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {ReactNode} actions - 오른쪽 위 액션(인쇄 버튼 등) [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapHeader eventName="G10 Opening" startDate="2026-06-17" endDate="2026-08-31" campaignCount={6} spend={3896.5} plannedBudget={4320} stores={['G10']} platforms={['Meta', 'TikTok']} headline={headline} status="draft" />
 */
export function RecapHeader({
  eventName,
  startDate,
  endDate,
  campaignCount,
  spend,
  plannedBudget = null,
  stores = [],
  platforms = [],
  headline = null,
  status = null,
  lang = 'en',
  actions,
  sx,
}) {
  const metaLine = [dateRange(startDate, endDate), stores.join(', ') || null, platforms.join(' + ') || null].filter(Boolean).join(' · ');

  const kpis = [
    { label: t('recap.kpi.campaigns', lang), value: campaignCount },
    {
      label: t('recap.kpi.spend', lang),
      value: spend != null ? money(spend) : EMPTY,
      sub: plannedBudget ? t('recap.kpi.ofPlanned', lang, { planned: moneyWhole(plannedBudget) }) : undefined,
    },
    { label: t('recap.kpi.stores', lang), value: stores.length > 0 ? stores.length : EMPTY },
  ];

  const headlineText = headline
    ? t(headline.rank === 1 ? 'recap.headline.best' : 'recap.headline.rank', lang, {
      rank: headline.rank,
      total: headline.total,
      metric: metricLabel(headline.metricKey, lang),
    })
    : null;

  return (
    <Box sx={sx}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="display" component="h1" sx={{ minWidth: 0, '@media print': { fontSize: '15pt' } }}>
              {eventName}
            </Typography>
            <RecapStatusBadge status={status} lang={lang} />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, '@media print': { fontSize: '7.5pt' } }}>
            {metaLine}
          </Typography>
        </Box>
        {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
      </Box>

      {/* 인쇄에서도 같은 KpiBar다 — 종이라고 다른 요약을 만들지 않는다. 간격만 조인다 */}
      <KpiBar items={kpis} sx={{ mt: 2.5, '@media print': { mt: '6pt' } }} />

      {headlineText && (
        <Typography component="p" sx={{ mt: 2, fontSize: 14, fontWeight: 600, color: 'text.primary', '@media print': { mt: '5pt', fontSize: '8.5pt' } }}>
          {headlineText}
          {headline.peerEvents?.length > 0 && (
            <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary', ml: 1, '@media print': { fontSize: '7.5pt' } }}>
              {headline.peerEvents.join(' · ')}
            </Box>
          )}
        </Typography>
      )}
    </Box>
  );
}
