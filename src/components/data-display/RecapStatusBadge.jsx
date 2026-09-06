import Box from '@mui/material/Box';
import { t } from '../../data/recapStrings';

/** 상태 → 글자색. 채움은 없다 — 목록에서 행마다 반복되는 요소라 배경색까지 주면 표보다 배지가 먼저 읽힌다 */
const STATUS_COLOR = {
  final: 'success.main',
  draft: 'text.primary',
};

/**
 * RecapStatusBadge 컴포넌트
 *
 * 보고서 상태(Not started / Draft / Ready) 한 칸. 목록의 Report 열과 상세 머리글이
 * 같은 배지를 쓴다. 1px 경계선 + 작은 글자만 — 상태 칩(Active 등)과 같은 문법이되
 * 색은 Ready에만(success), Draft는 본문색, 시작 전은 보조색이다.
 *
 * Props:
 * @param {'draft'|'final'|null} status - 보고서 상태. null이면 시작 전 [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapStatusBadge status={recap?.status ?? null} lang={lang} />
 */
export function RecapStatusBadge({ status, lang = 'en', sx }) {
  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        height: 20,
        px: 0.75,
        borderRadius: `${theme.shape.radius.control}px`,
        border: '1px solid',
        borderColor: status === 'final' ? 'success.main' : 'divider',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        color: STATUS_COLOR[status] ?? 'text.secondary',
        backgroundColor: 'background.paper',
        ...sx,
      })}
    >
      {t(status ? `recap.status.${status}` : 'recap.status.none', lang)}
    </Box>
  );
}
