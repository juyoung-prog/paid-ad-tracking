import { CampaignSummaryGrid } from './CampaignSummaryGrid';

export default {
  title: 'Paid Ads Dashboard/Data Display/CampaignSummaryGrid',
  component: CampaignSummaryGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## CampaignSummaryGrid

\`/reports\` 페이지 상단에 쓰이는 요약 스탯 카드 그리드.
Influencer Tracking Dashboard의 StatCard 패턴을 도메인 특정 필드 대신
범용 items 배열로 일반화했다.

### 기능
- 4열(md 기준) 반응형 그리드, 항목 수에 따라 자동으로 줄바꿈
- accent 항목은 primary 컬러로 강조
- 숫자는 tabular-nums
        `,
      },
    },
  },
  argTypes: {
    items: { control: 'object', description: '{ label, value, sub?, accent? } 배열' },
  },
};

/**
 * CampaignSummaryGrid 기본 사용 예시
 */
export const Default = {
  args: {
    items: [
      { label: '총 캠페인', value: 11 },
      { label: '총 계획 예산', value: '$14,600', accent: true },
      { label: '총 집행 예산', value: '$2,580.5' },
      { label: '평균 CPM', value: '$12.39', sub: '캠페인 평균' },
    ],
  },
};

/**
 * 항목이 4개보다 적을 때
 */
export const FewItems = {
  args: {
    items: [
      { label: '진행중 캠페인', value: 5 },
      { label: '미보고 캠페인', value: 1, accent: true },
    ],
  },
};
