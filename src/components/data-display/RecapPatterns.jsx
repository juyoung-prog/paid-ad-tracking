import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { t, metricLabel } from '../../data/recapStrings';

/** 재료(schema.js buildRecapPatterns) → 제목·본문. 문장 조립은 recapStrings에서만 */
function learningText(item, platformLabel, lang) {
  const platform = (p) => platformLabel[p] ?? p;
  switch (item.kind) {
    case 'consistentStrong':
    case 'consistentWeak':
      return {
        title: t(`pattern.${item.kind}.title`, lang, { aspect: t(`aspect.${item.aspect}`, lang) }),
        body: t(`pattern.${item.kind}.body`, lang, { count: item.count, total: item.total, metric: metricLabel(item.metricKey, lang) }),
      };
    case 'phaseClicks':
      return {
        title: t('pattern.phaseClicks.title', lang, { bestPhase: item.bestPhase, worstPhase: item.worstPhase }),
        body: t('pattern.phaseClicks.body', lang, { bestPhase: item.bestPhase, worstPhase: item.worstPhase, platforms: item.platforms.map(platform).join(' + ') }),
      };
    case 'platformSplit':
      return {
        title: t('pattern.platformSplit.title', lang, { reachPlatform: platform(item.reachPlatform), clickPlatform: platform(item.clickPlatform) }),
        body: t('pattern.platformSplit.body', lang),
      };
    case 'platformBoth':
      return {
        title: t('pattern.platformBoth.title', lang, { platform: platform(item.platform) }),
        body: t('pattern.platformBoth.body', lang, { other: platform(item.other) }),
      };
    default:
      return null;
  }
}

function nextStepText(item, platformLabel, lang) {
  const platform = (p) => platformLabel[p] ?? p;
  switch (item.kind) {
    case 'shiftToPhase': return t('pattern.next.shiftToPhase', lang, { phase: item.phase });
    case 'splitByPlatform': return t('pattern.next.splitByPlatform', lang, { reachPlatform: platform(item.reachPlatform), clickPlatform: platform(item.clickPlatform) });
    case 'leanOnPlatform': return t('pattern.next.leanOnPlatform', lang, { platform: platform(item.platform) });
    default: return null;
  }
}

/**
 * RecapPatterns 컴포넌트
 *
 * Learnings 카드 안의 **데이터에서 본 패턴** — 여러 캠페인이 같은 방향을 가리킬 때만
 * 항목이 생긴다(schema.js buildRecapPatterns): 같은 지표가 캠페인 2개 이상에서 상위
 * 또는 하위, 단계 간 클릭 효율 차이(플랫폼마다 같은 방향일 때), 이 이벤트 안에서의
 * 플랫폼 차이(정의가 같은 CPM·CTR). 캠페인 이름에서 메시지 전략을 추정하지 않는다.
 *
 * 사람이 쓴 배운 점(learnings)이 있으면 그것을 먼저 보여주고, 이 목록은 그 아래에
 * "데이터에서 본 패턴"이라는 이름으로 따로 선다 — 둘을 섞지 않는다.
 *
 * Props:
 * @param {{ learnings: Array<Object>, nextSteps: Array<Object> }} patterns - buildRecapPatterns() 결과 [Required]
 * @param {Object<string, string>} platformLabel - 플랫폼 값 → 표시명 [Optional, 기본값: {}]
 * @param {boolean} hasWrittenLearnings - 사람이 쓴 배운 점이 위에 이미 있으면 true(소제목·빈 문구가 달라진다) [Optional, 기본값: false]
 * @param {boolean} hasWrittenNextSteps - 사람이 쓴 다음 제언이 있으면 true(자동 제언을 숨긴다) [Optional, 기본값: false]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapPatterns patterns={buildRecapPatterns(byPlatform)} platformLabel={PLATFORM_LABEL} hasWrittenLearnings={recap?.learnings?.length > 0} lang={lang} />
 */
/** 제목은 문장 첫 글자를 대문자로 — aspect 문구("click efficiency")가 앞에 올 때. 한글·중문은 그대로 */
const sentenceCase = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

export function RecapPatterns({ patterns, platformLabel = {}, hasWrittenLearnings = false, hasWrittenNextSteps = false, lang = 'en', sx }) {
  const learnings = (patterns?.learnings ?? []).map((item) => learningText(item, platformLabel, lang)).filter(Boolean).map((l) => ({ ...l, title: sentenceCase(l.title) }));
  const nextSteps = hasWrittenNextSteps ? [] : (patterns?.nextSteps ?? []).map((item) => nextStepText(item, platformLabel, lang)).filter(Boolean);

  return (
    <Box sx={{ px: 2, py: 1.5, ...sx }}>
      <Typography component="h3" sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', m: 0, mb: 0.25 }}>
        {t('pattern.auto', lang)}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1.25 }}>{t('pattern.autoHint', lang)}</Typography>
      {learnings.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{hasWrittenLearnings ? t('pattern.empty', lang) : t('pattern.empty', lang)}</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
          {learnings.map((item, i) => (
            <Box key={i} sx={(theme) => ({ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.control}px` })}>
              <Typography component="h4" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 0.5, lineHeight: 1.4 }}>{item.title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.55 }}>{item.body}</Typography>
            </Box>
          ))}
        </Box>
      )}
      {!hasWrittenNextSteps && (
        <Box sx={{ mt: 2 }}>
          <Typography component="h4" sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', m: 0, mb: 0.5 }}>{t('recap.section.nextSteps', lang)}</Typography>
          {nextSteps.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('pattern.next.empty', lang)}</Typography>
          ) : nextSteps.map((text, i) => (
            <Typography key={i} variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, mb: i < nextSteps.length - 1 ? 0.75 : 0 }}>{text}</Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}
