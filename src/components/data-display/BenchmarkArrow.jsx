import Box from '@mui/material/Box';

/**
 * BenchmarkArrow 컴포넌트
 *
 * 비교군 대비 위치 기호 — Lucide arrow-up-right / arrow-down-right 기하를 svg로 그린다
 * (stroke 1.5, 둥근 끝, fill 없음). 글자 ▲▼는 면으로 채운 삼각형이라 주식 시세판처럼
 * 무거웠다. 시간 추세(trending)가 아니라 **상대 위치**라 대각 화살표다. 색은
 * currentColor — 옆 글자와 같은 톤(success/warning)을 따른다. BenchmarkDelta(표 셀)와
 * RecapCampaignInsightPanel(펼친 해석 줄)이 같은 기호를 쓴다.
 *
 * Props:
 * @param {'up'|'down'} direction - up = 비교군보다 낫다, down = 못하다(값의 높낮이가 아니다) [Required]
 * @param {number} size - 한 변 px [Optional, 기본값: 12]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <BenchmarkArrow direction="up" size={12} />
 */
export function BenchmarkArrow({ direction, size = 12, sx }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      sx={{ flexShrink: 0, mr: '3px', fill: 'none', ...sx }}
    >
      {direction === 'up' ? (
        <>
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </>
      ) : (
        <>
          {/* Lucide arrow-down-right 원본 경로 — 화살촉은 세로+가로 두 변(v10H7). 한 변이 빠지면 L자가 된다 */}
          <path d="m7 7 10 10" />
          <path d="M17 7v10H7" />
        </>
      )}
    </Box>
  );
}
