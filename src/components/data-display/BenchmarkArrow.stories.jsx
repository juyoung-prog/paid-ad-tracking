import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BenchmarkArrow } from './BenchmarkArrow';

export default {
  title: 'Paid Ads Dashboard/Data Display/BenchmarkArrow',
  component: BenchmarkArrow,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## BenchmarkArrow

비교군 대비 위치 기호 — Lucide **arrow-up-right / arrow-down-right** 기하를 svg로 그린다
(viewBox 24, stroke 1.5, 둥근 끝, fill 없음). 예전의 글자 ▲▼는 면으로 채운 삼각형이라
표 안에서 주식 시세판처럼 무거웠다(2026-09-07 교체).

시간 추세(trending)가 아니라 **상대 위치**라 대각 화살표다: ↗ = 비교군보다 낫다,
↘ = 못하다. 값의 높낮이가 아니다 — CPM처럼 낮을수록 좋은 지표는 값이 낮아도 ↗.
색은 currentColor라 옆 글자의 톤(success / warning)을 그대로 따른다.

BenchmarkDelta(표 셀)와 RecapCampaignTable 해석 열(펼친 해석 줄)이 같은 컴포넌트를 쓴다 —
표와 해석이 같은 기호 언어를 갖게.
        `,
      },
    },
  },
  argTypes: {
    direction: { control: 'select', options: ['up', 'down'], description: 'up = 낫다, down = 못하다' },
    size: { control: 'number', description: '한 변 px' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

const Line = ({ direction, color, text }) => (
  <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>
    <BenchmarkArrow direction={direction} />
    {text}
  </Typography>
);

/** 위 · 아래 */
export const Default = {
  args: { direction: 'up', size: 12 },
  render: (args) => <Box sx={{ color: 'success.main', display: 'inline-flex' }}><BenchmarkArrow {...args} /></Box>,
};

/** 표 셀에서 쓰이는 모양 그대로 — 글자와 3px 간격, 같은 톤 */
export const InContext = {
  render: () => (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <Line direction="up" color="success.main" text="best of 12" />
      <Line direction="up" color="success.main" text="top 9%" />
      <Line direction="down" color="warning.main" text="lowest of 4" />
      <Line direction="down" color="warning.main" text="bottom 26%" />
      <Typography component="span" sx={{ fontSize: 10.5, color: 'text.secondary' }}>mid (기호 없음)</Typography>
    </Box>
  ),
};

/** 크기 비교 — 표 셀 12px, 해석 줄 12px, 확대 24px(형태 확인용) */
export const Sizes = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', color: 'text.secondary' }}>
      {[12, 16, 24].map((s) => (
        <Box key={s} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <BenchmarkArrow direction="up" size={s} /><BenchmarkArrow direction="down" size={s} />
          <Typography sx={{ fontSize: 11 }}>{s}px</Typography>
        </Box>
      ))}
    </Box>
  ),
};
