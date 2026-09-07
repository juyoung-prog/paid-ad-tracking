import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { t, metricLabel, benchmarkPositionText } from '../../data/recapStrings';

const FIELDS = ['strength', 'weakness', 'reason', 'recommendation'];

/** 칸 라벨 색 — 장점은 success, 약점은 warning, 나머지는 중립. 근거 없는 칸은 text.disabled */
const FIELD_COLOR = { strength: 'success.main', weakness: 'warning.main', reason: 'text.secondary', recommendation: 'text.secondary' };

/** 긴 문장이 드는 Why·Recommendation 열을 조금 더 넓게 */
const FIELD_SPAN = { strength: '1fr', weakness: '1fr', reason: '1.4fr', recommendation: '1.4fr' };

/** 재료(schema.js buildCampaignInsight) 한 칸 → 문장. 문장 조립은 recapStrings에서만 */
function sentenceFor(field, item, row, platformLabel, lang) {
  if (!item) return null;
  const platform = platformLabel[row.platform] ?? row.platform;
  const aspect = (a) => t(`aspect.${a}`, lang);
  if (field === 'reason') {
    switch (item.kind) {
      case 'noData': return t('insight.noData', lang);
      case 'noPeers': return t('insight.noPeers', lang);
      case 'singleSignal': return t(item.isStrong ? 'insight.reason.singleSignalStrong' : 'insight.reason.singleSignalWeak', lang, { aspect: aspect(item.aspect) });
      default: return t(`insight.reason.${item.kind}`, lang);
    }
  }
  if (field === 'recommendation') {
    switch (item.kind) {
      case 'keepAndTest': return t('insight.rec.keepAndTest', lang, { keepAspect: aspect(item.keepAspect), testAspect: aspect(item.testAspect), testMetric: metricLabel(item.testMetricKey, lang) });
      case 'keepAndBudget': return t('insight.rec.keepAndBudget', lang, { keepAspect: aspect(item.keepAspect), pct: item.pct });
      case 'repeat': return t('insight.rec.repeat', lang, { aspect: aspect(item.aspect), metric: metricLabel(item.metricKey, lang) });
      case 'improve': return t('insight.rec.improve', lang, { aspect: aspect(item.aspect), metric: metricLabel(item.metricKey, lang) });
      case 'budget': return t('insight.rec.budget', lang, { pct: item.pct });
      default: return null;
    }
  }
  if (item.kind === 'overspend') return t('insight.weakness.overspend', lang, { pct: item.pct });
  const scope = item.scope === 'phase'
    ? t('insight.scope.phase', lang, { platform, phase: row.phaseName })
    : t('insight.scope.goal', lang, { platform, goal: t(`goal.${row.goal}`, lang) });
  return t(field === 'strength' ? 'insight.strength.ranked' : 'insight.weakness.ranked', lang, {
    aspect: aspect(item.aspect),
    metric: metricLabel(item.metricKey, lang),
    position: benchmarkPositionText(item.stat, lang),
    scope,
  });
}

/**
 * RecapCampaignInsightPanel 컴포넌트
 *
 * Recap 캠페인 표의 한 줄을 펼쳤을 때 나오는 해석 — What worked · What could improve ·
 * Why · Recommendation. 각 칸은 **사람이 쓴 글이 있으면 그것**("written"), 없으면
 * 데이터에서 만든 문장(schema.js buildCampaignInsight)을 근거 수준(observed /
 * compared / inferred / unknown)과 함께 보여준다. 원인을 지어내지 않는다 — 소재·타겟·
 * 메시지에 대한 정보가 데이터에 없기 때문이고, 해석은 "~일 수 있다"로만 말한다.
 *
 * 근거가 없는 칸은 그리지 않는다(빈 네 칸을 채우지 않는다). 성과 데이터가 아예 없으면
 * 한 줄 안내만. 표 안에 들어가는 부품이라 카드가 아니라 면(surface.sunken) 하나다.
 *
 * Props:
 * @param {{ campaignId: string, phaseName: string, platform: string, goal: string, note: object|null, insight: { hasData: boolean, strength: object|null, weakness: object|null, reason: object, recommendation: object|null } }} row - 캠페인 행 + 해석 재료 [Required]
 * @param {Object<string, string>} platformLabel - 플랫폼 값 → 표시명 [Optional, 기본값: {}]
 * @param {function} localize - LocalizedText → { value, isFallback } (schema.js localizedText를 lang에 묶어 넘긴다) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignInsightPanel row={rowWithInsight} platformLabel={PLATFORM_LABEL} localize={(text) => localizedText(text, lang)} lang={lang} />
 */
export function RecapCampaignInsightPanel({ row, platformLabel = {}, localize, lang = 'en', sx }) {
  const cells = FIELDS.map((field) => {
    const written = localize(row.note?.[field]);
    const item = row.insight?.[field] ?? null;
    const auto = written.value ? null : sentenceFor(field, item, row, platformLabel, lang);
    const level = written.value ? 'written' : (item?.level ?? 'unknown');
    return { field, written, auto, level };
  }).filter((c) => c.written.value || c.auto);

  const hasAnything = row.insight?.hasData || cells.some((c) => c.written.value);
  if (!hasAnything) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', px: 2, py: 1.25, ...sx }}>{t('insight.noData', lang)}</Typography>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: cells.map((c) => FIELD_SPAN[c.field]).join(' ') }, gap: { xs: 1.5, md: 3 }, px: 2, py: 1.5, ...sx }}>
      {cells.map(({ field, written, auto, level }) => {
        const isUnknown = !written.value && level === 'unknown';
        return (
          <Box key={field} sx={{ minWidth: 0, maxWidth: 520 }}>
            <Typography component="span" sx={{ display: 'block', fontSize: 11, fontWeight: 600, mb: 0.25, color: isUnknown ? 'text.disabled' : FIELD_COLOR[field] }}>
              {t(`insight.field.${field}`, lang)}
              <Tooltip title={written.value ? '' : t('insight.autoHint', lang)} placement="top">
                <Box component="span" sx={{ ml: 0.75, fontWeight: 400, color: isUnknown ? 'text.disabled' : 'text.secondary' }}>
                  · {t(written.value ? 'insight.written' : `insight.level.${level}`, lang)}
                </Box>
              </Tooltip>
            </Typography>
            <Typography variant="body2" sx={{ color: isUnknown ? 'text.secondary' : 'text.primary', lineHeight: 1.55 }}>
              {written.value || auto}
              {written.value && written.isFallback && <Box component="span" sx={{ ml: 0.75, fontSize: 11, color: 'text.secondary' }}>{t('lang.fallback', lang)}</Box>}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
