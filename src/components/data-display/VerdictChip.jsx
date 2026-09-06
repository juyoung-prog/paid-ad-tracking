import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import { t } from '../../data/recapStrings';

/**
 * 판정 → 색. 상태색 success/warning만 쓴다(error는 "고장"이라 판정에 안 쓴다).
 * 배경은 그 상태색의 옅은 틴트 — hex를 적지 않고 테마 값에서 alpha로 만든다
 * (두 테마 어느 쪽에서도 같은 관계가 유지되게).
 */
const VERDICT_STYLE = {
  good: { color: 'success.main', bg: (theme) => alpha(theme.palette.success.main, 0.1) },
  mid: { color: 'text.secondary', bg: (theme) => theme.palette.surface.muted },
  bad: { color: 'warning.main', bg: (theme) => alpha(theme.palette.warning.main, 0.12) },
};

/**
 * VerdictChip 컴포넌트
 *
 * 예산 효율 판정(good / mid / bad) 한 칸. 이전 보고서의 좋음/보통/아쉬움 칸이다.
 * 사람이 고른 판정은 채운 칩, 벤치마크가 **제안한** 판정(isSuggested)은 점선
 * 테두리 — 아직 사람이 확인하지 않은 값이라는 뜻이다. 판정이 없으면 "—".
 *
 * 판정을 고르는 계산(백분위 → good/mid/bad)은 schema.js suggestVerdict가 한다.
 *
 * Props:
 * @param {'good'|'mid'|'bad'|null} verdict - 판정 [Required]
 * @param {boolean} isSuggested - 벤치마크가 제안한 값이면 true(점선 테두리 + 툴팁) [Optional, 기본값: false]
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
        height: size === 'sm' ? 20 : 24,
        px: size === 'sm' ? 0.75 : 1,
        borderRadius: `${theme.shape.radius.control}px`,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        color: style.color,
        backgroundColor: isSuggested ? 'transparent' : style.bg(theme),
        border: '1px solid',
        borderStyle: isSuggested ? 'dashed' : 'solid',
        borderColor: isSuggested ? style.color : 'transparent',
        ...sx,
      })}
    >
      {t(`verdict.${verdict}`, lang)}
    </Box>
  );
  return isSuggested ? <Tooltip title={t('verdict.suggested', lang)} placement="top">{chip}</Tooltip> : chip;
}
