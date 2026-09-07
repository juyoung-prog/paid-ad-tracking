import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { t, metricLabel } from '../../data/recapStrings';

/** 칸 → 상태 라벨 키 · 점 색. 색은 뜻을 말하되 글자보다 뒤에 선다 — 점 6px 하나뿐 */
const SLOTS = [
  { key: 'keep', status: 'play.status.keep', dot: 'success.main' },
  { key: 'useSelectively', status: 'play.status.useSelectively', dot: 'accent.main' },
  { key: 'improve', status: 'play.status.improve', dot: 'warning.main' },
  { key: 'validate', status: 'play.status.validate', dot: 'text.disabled' },
];

/** 재료(schema.js buildRecapPlaybook) 한 칸 → { title, why }. 문장 조립은 recapStrings에서만 */
function cardFor(slot, item, platformLabel, lang) {
  if (!item) return null;
  const platform = (p) => platformLabel[p] ?? p;
  const aspect = item.aspect ? t(`learn.aspect.${item.aspect}`, lang) : '';
  const params = {
    platform: platform(item.platform), other: platform(item.other), leader: platform(item.leader),
    phase: item.phase, worstPhase: item.worstPhase, aspect, aspectLower: aspect.toLowerCase(),
    metric: item.metricKey ? metricLabel(item.metricKey, lang) : '', count: item.count, countBottom: item.countBottom, total: item.total,
  };
  const prefix = { keep: 'play.keep', useSelectively: 'play.use', improve: 'play.improve', validate: 'play.validate' }[slot];
  return { title: t(`${prefix}.${item.kind}`, lang, params), why: t(`${prefix}.${item.kind}.why`, lang, params) };
}

function nextEventFor(item, platformLabel, lang) {
  if (!item) return null;
  const platform = (p) => platformLabel[p] ?? p;
  // "CPM, CTR, watch-through, and engagement" — 검증할 지표는 개선·검증 칸의 것만 덧붙인다
  const aspects = (item.validateAspects ?? []).map((a) => t(`learn.aspect.${a}`, lang).toLowerCase());
  const and = t('play.next.and', lang);
  const list = aspects.length === 0 ? '' : aspects.length === 1 ? `${and}${aspects[0]}` : `, ${aspects.slice(0, -1).join(', ')}${and}${aspects[aspects.length - 1]}`;
  const primary = t(`play.next.${item.kind}`, lang, { reachPlatform: platform(item.reachPlatform), clickPlatform: platform(item.clickPlatform), platform: platform(item.platform), phase: item.phase, worstPhase: item.worstPhase, aspects: t('play.next.validateJoin', lang, { aspects: list }) });
  return { primary, secondary: null };
}

/**
 * RecapPatterns 컴포넌트
 *
 * Learnings 카드 안의 **다음 이벤트 플레이북** — "다음 비슷한 이벤트에서 무엇을 반복하고
 * 무엇을 바꿀까"에만 답한다. 2×2 칸: KEEP(초록 점) · USE SELECTIVELY(파랑 점) · IMPROVE
 * (주황 점) · VALIDATE(회색 점), 칸마다 상태 → 제목 → 근거 한 줄. 아래 NEXT EVENT 줄은
 * 한 문장 — "이번 결과를 출발 가설로, 집행 중 CPM·CTR·(개선·검증 지표) 검증".
 *
 * 회고 요약("Reach efficiency was consistently strong")은 Key takeaways·표가 이미 말하므로
 * 여기서 반복하지 않는다. 재료는 schema.js buildRecapPlaybook() — 같은 방향 캠페인 2개
 * 이상, 이벤트 단위 플랫폼 CPM·CTR 차이 같은 기존 패턴 재료를 행동으로 옮긴 것이고,
 * 근거 없는 칸은 비운다. 방법론 설명은 카드 제목의 ⓘ 툴팁(learn.hint)에만.
 *
 * Props:
 * @param {{ keep: Object|null, useSelectively: Object|null, improve: Object|null, validate: Object|null, nextEvent: Object|null }} playbook - buildRecapPlaybook() 결과 [Required]
 * @param {Object<string, string>} platformLabel - 플랫폼 값 → 표시명 [Optional, 기본값: {}]
 * @param {boolean} hasWrittenLearnings - 사람이 쓴 배운 점이 위에 이미 있으면 true(작은 구분 라벨이 붙는다) [Optional, 기본값: false]
 * @param {boolean} hasWrittenNextSteps - 사람이 쓴 제언이 있으면 true(NEXT EVENT 줄을 숨긴다) [Optional, 기본값: false]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapPatterns playbook={buildRecapPlaybook(byPlatform)} platformLabel={PLATFORM_LABEL} lang={lang} />
 */
export function RecapPatterns({ playbook, platformLabel = {}, hasWrittenLearnings = false, hasWrittenNextSteps = false, lang = 'en', sx }) {
  const cards = SLOTS.map((slot) => ({ ...slot, card: cardFor(slot.key, playbook?.[slot.key] ?? null, platformLabel, lang) })).filter((s) => s.card);
  const next = hasWrittenNextSteps ? null : nextEventFor(playbook?.nextEvent ?? null, platformLabel, lang);

  return (
    <Box sx={{ px: 2, py: 2, ...sx }}>
      {hasWrittenLearnings && (
        <Typography component="h3" sx={{ fontSize: 11, fontWeight: 500, color: 'text.secondary', m: 0, mb: 1 }}>{t('pattern.auto', lang)}</Typography>
      )}
      {cards.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('play.empty', lang)}</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
          {/* 카드 안의 카드가 되지 않게 — 경계는 divider의 절반 농도, 배경·그림자 없음. 위계: 상태 → 제목 → 근거 */}
          {cards.map(({ key, status, dot, card }) => (
            <Box key={key} sx={(theme) => ({ px: 1.5, py: 1.25, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.6), borderRadius: `${theme.shape.radius.control}px`, minWidth: 0 })}>
              <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1 }}>
                <Box aria-hidden component="span" sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
                {t(status, lang)}
              </Typography>
              <Typography component="h4" sx={{ fontSize: 13, fontWeight: 600, m: 0, mt: 0.625, lineHeight: 1.4, color: 'text.primary' }}>{card.title}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>{card.why}</Typography>
            </Box>
          ))}
        </Box>
      )}
      {/* NEXT EVENT — 격자와 얇은 선으로 나눈 마지막 줄. 결정 15px/600, 검증 12px 보조 */}
      {!hasWrittenNextSteps && (
        <Box sx={{ mt: 2, pt: 1.75, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography component="h4" sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', m: 0, mb: 0.75 }}>{t('play.next.title', lang)}</Typography>
          {next ? (
            <>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}>{next.primary}</Typography>
              {next.secondary && <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, mt: 0.375 }}>{next.secondary}</Typography>}
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('learn.action.empty', lang)}</Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
