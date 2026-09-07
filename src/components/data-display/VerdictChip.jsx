import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
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
 * 예산 효율 판정(good / mid / bad) 한 칸. 이전 보고서의 좋음/보통/아쉬움 칸이다.
 * 옅은 틴트 배경 + 같은 색 글자(500) + 아주 옅은 실선 테두리 — 점선은 쓰지 않는다
 * (2026-09: 점선 칩이 표 안에서 시끄러웠다). 벤치마크가 **제안한** 판정(isSuggested)은
 * 모양은 같고 툴팁("suggested")으로만 구분한다. 판정이 없으면 "—".
 *
 * 판정을 고르는 계산(백분위 → good/mid/bad)은 schema.js suggestVerdict가 한다.
 *
 * Props:
 * @param {'good'|'mid'|'bad'|null} verdict - 판정 [Required]
 * @param {boolean} isSuggested - 벤치마크가 제안한 값이면 true(툴팁 "suggested") [Optional, 기본값: false]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {'sm'|'md'} size - 높이 단계. 표 셀은 sm [Optional, 기본값: 'md']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <VerdictChip verdict={row.note?.verdict ?? row.suggestedVerdict} isSuggested={!row.note?.verdict} size="sm" />
 */
export function VerdictChip({ verdict, isSuggested = false, lang = 'en', size = 'md', sx }) {
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
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 500,
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
  return isSuggested ? <Tooltip title={t('verdict.suggested', lang)} placement="top">{chip}</Tooltip> : chip;
}
