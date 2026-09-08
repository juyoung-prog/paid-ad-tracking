import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import { t } from '../../data/recapStrings';

/**
 * 판정 → 색. 상태색 success/warning만 쓴다(error는 "고장"이라 판정에 안 쓴다).
 * 배경은 그 상태색의 옅은 틴트, 테두리는 그보다 조금 진한 같은 색 — hex를 적지 않고
 * 테마 값에서 alpha로 만든다(두 테마 어느 쪽에서도 같은 관계가 유지되게).
 */
const VERDICT_STYLE = {
  good: { color: 'success.main', bg: (theme) => alpha(theme.palette.success.main, 0.08), border: (theme) => alpha(theme.palette.success.main, 0.18) },
  mid: { color: 'text.secondary', bg: (theme) => theme.palette.surface.muted, border: (theme) => theme.palette.divider },
  bad: { color: 'warning.main', bg: (theme) => alpha(theme.palette.warning.main, 0.1), border: (theme) => alpha(theme.palette.warning.main, 0.2) },
};

/**
 * VerdictChip 컴포넌트
 *
 * 종합 성과(STRONG / AVERAGE / WEAK) 한 칸 — 이전 보고서의 좋음/보통/아쉬움 칸이다.
 * 옅은 틴트 배경 + 같은 색 글자(600, 대문자·자간) + 아주 옅은 실선 테두리 — 점선·큰 색면은 쓰지 않는다.
 * 값은 VERDICT(good/mid/bad)이고 라벨은 recapStrings verdict.* (Strong/Average/Weak). 없으면 "—".
 * 등급 계산은 schema.js buildOverallPerformance(목표 가중 합산)이고, 사람이 Edit에서 고른 값이 우선한다.
 *
 * Props:
 * @param {'good'|'mid'|'bad'|null} verdict - 등급(사람이 고른 것 또는 자동) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {'sm'|'md'} size - 높이 단계. 표 셀은 sm [Optional, 기본값: 'md']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <VerdictChip verdict={row.note?.verdict} size="sm" />
 */
export function VerdictChip({ verdict, lang = 'en', size = 'md', sx }) {
  if (!verdict) {
    return (
      <Box component="span" sx={{ color: 'text.disabled', fontSize: size === 'sm' ? 12 : 13, ...sx }}>
        {t('verdict.none', lang)}
      </Box>
    );
  }
  const style = VERDICT_STYLE[verdict] ?? VERDICT_STYLE.mid;
  const chip = (
    <Box
      component="span"
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        // 세로 4px · 가로 7px(sm) / 5px · 8px(md) — 테두리 포함 높이가 sm 20 · md 24로 전과 같다
        py: size === 'sm' ? '4px' : '5px',
        px: size === 'sm' ? '7px' : '8px',
        borderRadius: `${theme.shape.radius.control}px`,
        fontSize: size === 'sm' ? 10.5 : 12,
        fontWeight: 600,
        // 임원이 세로로 훑는 한 단어(STRONG/AVERAGE/WEAK) — 대문자 + 자간, 색은 옅은 틴트 그대로
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        lineHeight: size === 'sm' ? '10px' : '12px',
        whiteSpace: 'nowrap',
        color: style.color,
        backgroundColor: style.bg(theme),
        border: '1px solid',
        borderColor: style.border(theme),
        ...sx,
      })}
    >
      {t(`verdict.${verdict}`, lang)}
    </Box>
  );
  return chip;
}
