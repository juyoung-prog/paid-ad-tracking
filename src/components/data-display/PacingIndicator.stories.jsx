import Box from '@mui/material/Box';
import { PacingIndicator } from './PacingIndicator';
import { calcBudgetPacing } from '../../data/schema';

export default {
  title: 'Paid Ads Dashboard/Data Display/PacingIndicator',
  component: PacingIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## PacingIndicator

캠페인의 예산 소진 속도를 기간 경과 대비로 시각화하는 컴포넌트.

### 기능
- 예산 소진 비율 / 기간 경과 비율을 각각 막대로 표시
- 두 비율의 차이가 임계값(±15%p)을 넘으면 "소진 빠름/느림" 라벨로 강조
- budgetDaily(일일 예산)를 선언한 캠페인은 Daily Avg 막대가 추가로 뜨고, 상단 라벨도 "일평균 소진액 vs 일일 예산" 기준으로 바뀐다 — 경과일/전체기간 비율보다 더 직접적인 신호라 우선함(generateAlerts()의 판단 기준과 동일)
- 비율은 schema.js의 \`calcBudgetPacing()\`에서 계산되어 props로 전달됨 — 컴포넌트는 날짜 계산을 하지 않음
        `,
      },
    },
  },
  argTypes: {
    timeElapsedRatio: { control: { type: 'number', min: 0, max: 1, step: 0.01 }, description: '기간 경과 비율 (0~1)' },
    budgetUsedRatio: { control: { type: 'number', min: 0, max: 1.5, step: 0.01 }, description: '예산 소진 비율 (0~1)' },
    avgDailySpend: { control: { type: 'number' }, description: '오늘까지 일평균 소진액' },
    dailyBudgetRatio: { control: { type: 'number', min: 0, max: 1.5, step: 0.01 }, description: '일평균 소진액 / budgetDaily' },
    budgetPlanned: { control: { type: 'number' }, description: '계획 예산(총액, 라벨 표시용)' },
    budgetDaily: { control: { type: 'number' }, description: '일일 예산(라벨 표시용, 있으면 Daily Avg 줄 노출)' },
    spend: { control: { type: 'number' }, description: '실집행 예산 (라벨 표시용)' },
  },
};

/**
 * PacingIndicator 기본 사용 예시 — 소진 속도가 기간보다 빠른 경우
 */
export const Default = {
  render: (args) => (
    <Box sx={{ maxWidth: 320 }}>
      <PacingIndicator {...args} />
    </Box>
  ),
  args: {
    timeElapsedRatio: 0.63,
    budgetUsedRatio: 0.9,
    budgetPlanned: 2000,
    spend: 1800,
  },
};

/**
 * 세 가지 페이스 상태 비교 — 정상 / 빠름 / 느림
 * calcBudgetPacing()으로 실제 계산된 값을 사용한다.
 */
export const Variants = {
  render: () => {
    const onTrack = calcBudgetPacing(
      { startDate: '2026-07-01', endDate: '2026-07-31', budgetPlanned: 1000 },
      640,
      new Date('2026-07-20')
    );
    const ahead = calcBudgetPacing(
      { startDate: '2026-07-01', endDate: '2026-07-31', budgetPlanned: 1000 },
      950,
      new Date('2026-07-20')
    );
    const behind = calcBudgetPacing(
      { startDate: '2026-07-01', endDate: '2026-07-31', budgetPlanned: 1000 },
      300,
      new Date('2026-07-20')
    );

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 320 }}>
        <PacingIndicator {...onTrack} budgetPlanned={1000} spend={640} />
        <PacingIndicator {...ahead} budgetPlanned={1000} spend={950} />
        <PacingIndicator {...behind} budgetPlanned={1000} spend={300} />
      </Box>
    );
  },
};

/**
 * budgetDaily가 있는 캠페인 — Daily Avg 막대가 추가로 뜨고, 상단 라벨도
 * dailyBudgetRatio 기준으로 계산된다(경과일/전체기간 비율은 무시).
 */
export const WithDailyBudget = {
  render: () => {
    const overDaily = calcBudgetPacing(
      { startDate: '2026-07-01', endDate: '2026-07-31', budgetPlanned: 2000, budgetDaily: 65 },
      1800,
      new Date('2026-07-20')
    );
    return (
      <Box sx={{ maxWidth: 320 }}>
        <PacingIndicator {...overDaily} budgetPlanned={2000} budgetDaily={65} spend={1800} />
      </Box>
    );
  },
};
