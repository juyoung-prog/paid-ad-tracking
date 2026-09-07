import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { BenchmarkArrow } from './BenchmarkArrow';
import { t, metricLabel, benchmarkPositionText } from '../../data/recapStrings';

const FIELDS = ['strength', 'weakness', 'reason', 'recommendation'];
/** 근거 줄의 방향·톤 — 장점은 ↗ success, 약점은 ↘ warning, 나머지는 중립 */
const FIELD_TONE = { strength: { direction: 'up', color: 'success.main' }, weakness: { direction: 'down', color: 'warning.main' } };
/** 긴 문장이 드는 Why·Next action 열을 조금 더 넓게 */
const FIELD_SPAN = { strength: '1fr', weakness: '1fr', reason: '1.2fr', recommendation: '1.2fr' };
const RANKED_METRIC_KEYS = ['cpm', 'cpc', 'cpa', 'ctr', 'hookRate', 'holdRate', 'engagementRate'];

/**
 * 재료(schema.js buildCampaignInsight) 한 칸 → { conclusion, evidence, level }.
 * 결론은 2~6단어, 근거는 한 줄. 문장 조립은 recapStrings에서만 한다.
 */
function cellFor(field, item, row, lang) {
  if (!item) return null;
  const aspect = (a) => t(`aspect.${a}`, lang);
  const short = (a) => t(`aspectShort.${a}`, lang);
  if (field === 'strength' || field === 'weakness') {
    if (item.kind === 'overspend') return { conclusion: t('insight.weak.overspend', lang), evidence: t('insight.evidence.overspend', lang, { pct: item.pct }), level: item.level };
    if (!RANKED_METRIC_KEYS.includes(item.metricKey)) return null;
    return {
      conclusion: t(`insight.${field === 'strength' ? 'strong' : 'weak'}.${item.aspect}`, lang),
      evidence: t('insight.evidence.ranked', lang, { metric: metricLabel(item.metricKey, lang), position: benchmarkPositionText(item.stat, lang) }),
      level: item.level,
    };
  }
  if (field === 'reason') {
    const kind = ['singleSignal', 'noPattern'].includes(item.kind) ? 'unknown' : item.kind;
    return { conclusion: t(`insight.why.${kind}`, lang), evidence: t(`insight.why.${kind}.evidence`, lang), level: item.level };
  }
  // recommendation
  const params = {
    keep: item.keepAspect ? short(item.keepAspect) : '', test: item.testAspect ? short(item.testAspect) : '',
    aspect: item.aspect ? aspect(item.aspect) : '', metric: item.metricKey ? metricLabel(item.metricKey, lang) : '', pct: item.pct ?? '',
  };
  return { conclusion: t(`insight.next.${item.kind}`, lang, params), evidence: t(`insight.next.${item.kind}.evidence`, lang, params), level: item.level };
}

/**
 * RecapCampaignInsightPanel 컴포넌트
 *
 * 보고서 캠페인 표의 한 줄을 펼쳤을 때 나오는 **간결한 진단 요약** — What worked ·
 * Could improve · Why · Next action 네 칸. 칸마다 작은 라벨 → 짧은 결론(가장 강하게)
 * → 한 줄 근거(↗↘ 기호 + 지표 위치). 임원이 5~10초에 "무엇이 좋았고, 무엇이 아니고,
 * 이유를 아는지, 다음에 뭘 할지"를 읽는 게 목표라 문단을 쓰지 않는다.
 *
 * 근거 수준(observed / compared / inferred / unknown)은 화면에 늘어놓지 않고 라벨의
 * 툴팁에만 둔다 — 논리는 그대로(schema.js buildCampaignInsight). 사람이 쓴 글이 있으면
 * 그것이 결론 자리에 오고 툴팁은 "written". 원인을 모르면 "Insufficient evidence",
 * 성과 데이터가 없으면 장점·약점 "—" / Why "Insufficient data" / Next "Collect more data".
 *
 * Props:
 * @param {{ campaignId: string, phaseName: string, platform: string, goal: string, note: object|null, insight: { hasData: boolean, strength: object|null, weakness: object|null, reason: object, recommendation: object|null } }} row - 캠페인 행 + 해석 재료 [Required]
 * @param {Object<string, string>} platformLabel - 플랫폼 값 → 표시명 [Optional, 기본값: {}]
 * @param {function} localize - LocalizedText → { value, isFallback } (schema.js localizedText를 lang에 묶어 넘긴다) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignInsightPanel row={rowWithInsight} localize={(text) => localizedText(text, lang)} lang={lang} />
 */
export function RecapCampaignInsightPanel({ row, localize, lang = 'en', sx }) {
  const hasData = Boolean(row.insight?.hasData);
  const cells = FIELDS.map((field) => {
    const written = localize(row.note?.[field]);
    if (written.value) return { field, conclusion: written.value, evidence: null, level: 'written', isFallback: written.isFallback };
    const auto = cellFor(field, row.insight?.[field] ?? null, row, lang);
    if (auto) return { field, ...auto };
    if (field === 'recommendation' && !hasData) return { field, conclusion: t('insight.next.collect', lang), evidence: null, level: 'unknown' };
    return { field, conclusion: null, evidence: null, level: 'unknown' };
  });

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: FIELDS.map((f) => FIELD_SPAN[f]).join(' ') }, gap: { xs: 1.5, md: 3 }, px: 2, py: 1.5, ...sx }}>
      {cells.map(({ field, conclusion, evidence, level, isFallback }) => {
        const isEmpty = !conclusion;
        const tone = FIELD_TONE[field];
        const hint = level === 'written' ? t('insight.writtenHint', lang) : t('insight.levelHint', lang, { level: t(`insight.level.${level}`, lang) });
        return (
          <Box key={field} sx={{ minWidth: 0, maxWidth: 480 }}>
            {/* 근거 수준은 라벨 툴팁에만 — 칸마다 "· compared"를 붙이면 임원 눈에는 소음이다 */}
            <Tooltip title={isEmpty ? '' : hint} placement="top" enterDelay={400}>
              <Typography component="span" sx={{ display: 'inline-block', fontSize: 11, fontWeight: 500, color: 'text.secondary', mb: 0.5, cursor: isEmpty ? 'default' : 'help' }}>
                {t(`insight.field.${field}`, lang)}
              </Typography>
            </Tooltip>
            {isEmpty ? (
              <Typography sx={{ fontSize: 13, color: 'text.disabled', lineHeight: 1.4 }}>{t('verdict.none', lang)}</Typography>
            ) : (
              <>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: level === 'unknown' ? 'text.secondary' : 'text.primary', lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                  {conclusion}
                  {isFallback && <Box component="span" sx={{ ml: 0.75, fontSize: 11, fontWeight: 400, color: 'text.secondary' }}>{t('lang.fallback', lang)}</Box>}
                </Typography>
                {evidence && (
                  <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center', mt: 0.375, fontSize: 12, lineHeight: 1.4, color: tone && level !== 'unknown' ? tone.color : 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                    {tone && level !== 'unknown' && <BenchmarkArrow direction={tone.direction} size={12} />}
                    {evidence}
                  </Typography>
                )}
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
