import { useState } from 'react';
import Box from '@mui/material/Box';
import { PerformanceForm } from './PerformanceForm';
import { GOAL } from '../../data/schema';

const baseValues = {
  impressions: null,
  reach: null,
  clicks: null,
  spend: null,
  hookViews: null,
  heldViews: null,
  engagements: null,
  conversions: null,
};

export default {
  title: 'Paid Ads Dashboard/Templates/PerformanceForm',
  component: PerformanceForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## PerformanceForm

캠페인 성과 지표 입력 폼. Tier 1(공통 필수)·Tier 2(영상 지표)는 항상 노출하고,
Tier 3(참여, goal=engagement)·Tier 4(전환, goal=conversion|store_visit)는
goal에 따라 조건부로 노출한다.

### CLS(레이아웃 시프트) 메모
goal은 폼 내부에서 바뀌지 않는 고정 prop이라, 조건부 필드는 마운트 시점에
한 번 결정되고 입력 중에 나타났다 사라지지 않는다 — 실제 시프트 위험 없음.
아래 3개 스토리(Awareness/Engagement/Conversion)로 goal별 필드 구성 차이를 비교할 수 있다.
        `,
      },
    },
  },
  argTypes: {
    goal: {
      control: 'select',
      options: [GOAL.AWARENESS, GOAL.TRAFFIC, GOAL.ENGAGEMENT, GOAL.CONVERSION, GOAL.STORE_VISIT],
      description: '조건부 필드 노출 기준',
    },
    values: { control: 'object', description: '폼 값 객체' },
    errors: { control: 'object', description: '필드별 에러 메시지' },
    onChange: { action: 'fieldChanged' },
  },
};

function Interactive(args) {
  const [values, setValues] = useState(baseValues);
  return (
    <Box sx={{ maxWidth: 720 }}>
      <PerformanceForm
        {...args}
        values={values}
        onChange={(field, value) => {
          setValues((v) => ({ ...v, [field]: value }));
          args.onChange?.(field, value);
        }}
      />
    </Box>
  );
}

/**
 * goal=awareness — Tier 1/2만 노출 (Tier 3/4 없음)
 */
export const Default = {
  args: { goal: GOAL.AWARENESS },
  render: Interactive,
};

/**
 * goal=engagement — 참여 지표(Tier 3) 조건부 노출
 */
export const EngagementGoal = {
  args: { goal: GOAL.ENGAGEMENT },
  render: Interactive,
};

/**
 * goal=conversion — 전환 지표(Tier 4) 조건부 노출
 */
export const ConversionGoal = {
  args: { goal: GOAL.CONVERSION },
  render: Interactive,
};
