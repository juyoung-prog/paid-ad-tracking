import { useState } from 'react';
import Box from '@mui/material/Box';
import { PerformanceForm } from './PerformanceForm';
import { GOAL, PLATFORM } from '../../data/schema';

const baseValues = {
  impressions: null,
  reach: null,
  clicks: null,
  spend: null,
  hookViews: null,
  heldViews: null,
  likes: null,
  comments: null,
  shares: null,
  saves: null,
  reposts: null,
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

캠페인 성과 지표 입력 폼. Tier 1(공통 필수)·Tier 2(영상 지표)·**Social Metrics**(참여 내역)는 항상 노출하고,
Tier 3 합계(참여, goal=engagement)·Tier 4(전환, goal=conversion|store_visit)는
goal에 따라 조건부로 노출한다.

### Social Metrics (2026-09-11)
goal과 무관하게 항상 있고 **SocialMetricsFields**가 그린다 — 칸 구성은 플랫폼이 정한다: Meta는 Likes · Comments ·
Shares · Saves · Reposts, TikTok은 Likes · Comments · Shares · Follows · Profile Visits · Saves(리포스트는 인스타그램
개념이라 TikTok에 없다), 플랫폼을 모르면 일곱 칸 전부. 드로어·Performance·Reports가 같은 일곱 가지를 한 목록으로
보는데 수기 캠페인은 이 폼이 유일한 입력 경로다. 빈 칸은 null로 저장되고 화면에서 빠진다. Engagements 합계 라벨은
실제 정의(likes + comments + shares)에 맞췄다 — 예전 "+saves"는 어긋나 있었다.

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
    platform: {
      control: 'select',
      options: [PLATFORM.META, PLATFORM.TIKTOK],
      description: 'Social Metrics의 칸 구성(Meta: +Reposts, TikTok: +Follows·Visits, 없으면 전부)',
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
 * goal=awareness — Tier 1/2 + Social Metrics (Tier 3 합계/4 없음)
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

/** TikTok 캠페인 — Social Metrics가 Likes · Comments · Shares · Follows · Profile Visits · Saves(Reposts 없음) */
export const TikTokNoReposts = {
  args: { goal: GOAL.AWARENESS, platform: PLATFORM.TIKTOK },
  render: Interactive,
};
