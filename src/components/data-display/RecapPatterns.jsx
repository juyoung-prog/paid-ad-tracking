import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { t, metricLabel } from '../../data/recapStrings';

/** 상태 → 색. 강함 success, 약함 warning, 엇갈림·패턴 중립 — 표와 같은 세 가지뿐 */
const STATUS_COLOR = { strong: 'success.main', weak: 'warning.main', mixed: 'text.secondary' };

/** 재료(schema.js buildRecapPatterns) → { title, status, statusText, evidence }. 문장 조립은 recapStrings에서만 */
function itemFor(item, platformLabel, lang) {
  const platform = (p) => platformLabel[p] ?? p;
  switch (item.kind) {
    case 'consistentStrong':
      return { title: t(`learn.aspect.${item.aspect}`, lang), status: 'strong', evidence: t('learn.evidence.top', lang, { count: item.count, total: item.total, metric: metricLabel(item.metricKey, lang) }) };
    case 'consistentWeak':
      return { title: t(`learn.aspect.${item.aspect}`, lang), status: 'weak', evidence: t('learn.evidence.bottom', lang, { count: item.count, total: item.total, metric: metricLabel(item.metricKey, lang) }) };
    case 'mixed':
      return { title: t(`learn.aspect.${item.aspect}`, lang), status: 'mixed', evidence: t('learn.evidence.mixed', lang, { count: item.count, countBottom: item.countBottom, total: item.total, metric: metricLabel(item.metricKey, lang) }) };
    case 'phaseClicks':
      return { title: t('learn.phase.title', lang), status: 'mixed', statusText: item.bestPhase, evidence: t('learn.phase.evidence', lang, { bestPhase: item.bestPhase, worstPhase: item.worstPhase, platforms: item.platforms.map(platform).join(' + ') }) };
    case 'platformSplit':
      return { title: t('learn.platform.title', lang), status: 'mixed', evidence: t('learn.platform.splitEvidence', lang, { reachPlatform: platform(item.reachPlatform), clickPlatform: platform(item.clickPlatform) }) };
    case 'platformBoth':
      return { title: t('learn.platform.title', lang), status: 'mixed', statusText: t('learn.platform.leads', lang, { platform: platform(item.platform) }), evidence: t('learn.platform.bothEvidence', lang, { platform: platform(item.platform), other: platform(item.other) }) };
    default:
      return null;
  }
}

/** 다음 제언 → { action, why } — 첫 줄은 결정, 둘째 줄은 이유 */
function actionFor(item, platformLabel, lang) {
  const platform = (p) => platformLabel[p] ?? p;
  const params = { reachPlatform: platform(item.reachPlatform), clickPlatform: platform(item.clickPlatform), platform: platform(item.platform), phase: item.phase, worstPhase: item.worstPhase };
  if (!['splitByPlatform', 'leanOnPlatform', 'shiftToPhase'].includes(item.kind)) return null;
  return { action: t(`learn.action.${item.kind}`, lang, params), why: t(`learn.action.${item.kind}.why`, lang, params) };
}

/**
 * RecapPatterns 컴포넌트
 *
 * Learnings 카드 안의 **임원용 패턴 + 행동 요약**. 2×2 항목마다 "지표 이름 — 상태
 * (Strong / Mixed / Weak) — 한 줄 근거('4 of 6 · top CPM band')"라 상태만 훑어도 이벤트가
 * 읽힌다. 아래에 Recommended action — 첫 줄은 결정, 둘째 줄은 이유.
 *
 * 항목은 schema.js buildRecapPatterns()가 캠페인 2개 이상이 같은 방향일 때만 만든다
 * (상위/하위 구간, 양쪽이 같이 있으면 Mixed). 방법론 설명은 본문에 두지 않는다 — 카드
 * 제목의 ⓘ 툴팁(learn.hint)으로 옮겼다. 사람이 쓴 배운 점·제언이 있으면 그것을 위에
 * 먼저 보여주고 이 목록은 그 아래에 따로 선다.
 *
 * Props:
 * @param {{ learnings: Array<Object>, nextSteps: Array<Object> }} patterns - buildRecapPatterns() 결과 [Required]
 * @param {Object<string, string>} platformLabel - 플랫폼 값 → 표시명 [Optional, 기본값: {}]
 * @param {boolean} hasWrittenLearnings - 사람이 쓴 배운 점이 위에 이미 있으면 true(작은 구분 라벨이 붙는다) [Optional, 기본값: false]
 * @param {boolean} hasWrittenNextSteps - 사람이 쓴 제언이 있으면 true(자동 제언을 숨긴다) [Optional, 기본값: false]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapPatterns patterns={buildRecapPatterns(byPlatform)} platformLabel={PLATFORM_LABEL} hasWrittenLearnings={recap?.learnings?.length > 0} lang={lang} />
 */
export function RecapPatterns({ patterns, platformLabel = {}, hasWrittenLearnings = false, hasWrittenNextSteps = false, lang = 'en', sx }) {
  const items = (patterns?.learnings ?? []).map((item) => itemFor(item, platformLabel, lang)).filter(Boolean);
  const actions = hasWrittenNextSteps ? [] : (patterns?.nextSteps ?? []).map((item) => actionFor(item, platformLabel, lang)).filter(Boolean);

  return (
    <Box sx={{ px: 2, py: 2, ...sx }}>
      {hasWrittenLearnings && (
        <Typography component="h3" sx={{ fontSize: 11, fontWeight: 500, color: 'text.secondary', m: 0, mb: 1 }}>{t('pattern.auto', lang)}</Typography>
      )}
      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          <Box component="span" sx={{ fontWeight: 600, mr: 1 }}>{t('learn.status.insufficient', lang)}</Box>
          {t('learn.empty', lang)}
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
          {/* 카드 안의 카드가 되지 않게 — 경계는 divider의 절반 농도, 배경·그림자 없음 */}
          {items.map((item, i) => (
            <Box key={i} sx={(theme) => ({ px: 1.5, py: 1.25, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.6), borderRadius: `${theme.shape.radius.control}px`, minWidth: 0 })}>
              {/* 상태는 제목 바로 옆(카드 오른쪽 끝이 아니라) — 제목과 한 덩어리로 읽힌다. 작은 점 + 글자, 배지·배경 없음 */}
              <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1.5 }}>
                <Typography component="h4" sx={{ fontSize: 13, fontWeight: 600, m: 0, lineHeight: 1.4, minWidth: 0 }}>{item.title}</Typography>
                <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 12, fontWeight: 600, color: STATUS_COLOR[item.status], whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Box aria-hidden component="span" sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
                  {item.statusText ?? t(`learn.status.${item.status}`, lang)}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, mt: 0.375, fontVariantNumeric: 'tabular-nums' }}>{item.evidence}</Typography>
            </Box>
          ))}
        </Box>
      )}
      {/* 결정은 격자보다 한 단 크게(15px/600), 이유는 보조. 위에 얇은 선으로 격자와 나눈다 */}
      {!hasWrittenNextSteps && (
        <Box sx={{ mt: 2, pt: 1.75, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography component="h4" sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', m: 0, mb: 0.75 }}>{t('learn.action.title', lang)}</Typography>
          {actions.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('learn.action.empty', lang)}</Typography>
          ) : actions.map((a, i) => (
            <Box key={i} sx={{ mb: i < actions.length - 1 ? 1.25 : 0 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}>{a.action}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, mt: 0.375 }}>{a.why}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
