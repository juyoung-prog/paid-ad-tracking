import Box from '@mui/material/Box';
import { KpiBar } from './KpiBar';
import { getEffectiveStatus } from '../../data/schema';
import { mockCampaigns, mockPerformanceRecords } from '../../data/paidAdsMockData';

export default {
  title: 'Paid Ads Dashboard/Data Display/KpiBar',
  component: KpiBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## KpiBar

KPI 숫자 요약 바. label/value 배열을 받는 범용 컴포넌트로, Dashboard 헤더
툴바와 /reports 요약 통계가 둘 다 이 컴포넌트를 쓴다 — 예전엔 서로 다른
컴포넌트(CampaignSummaryGrid의 테두리 박스 그리드)를 써서 같은 개념의
숫자 요약이 화면마다 다르게 보이는 문제가 있었다.

### 기능
- 항목 간 구분선으로 시각적으로 분리
- 숫자는 tabular-nums로 자릿수 변화에도 레이아웃 고정
- isAlert 항목은 error 컬러로 강조
- sub로 값 아래 부가 설명 추가 가능(예: "across reported campaigns")
        `,
      },
    },
  },
  argTypes: {
    items: { control: 'object', description: '{ label, value, sub?, isAlert? } 배열' },
  },
};

/**
 * KpiBar 기본 사용 예시
 */
export const Default = {
  args: {
    items: [
      { label: '진행중', value: 5 },
      { label: '예정', value: 2 },
      { label: '종료', value: 8 },
      { label: '미보고', value: 1, isAlert: true },
    ],
  },
};

/**
 * value에 포맷된 통화 문자열도 넣을 수 있다 — Dashboard 헤더의
 * Active Budget/Active Spend가 이 패턴을 쓴다.
 */
export const WithCurrencyValues = {
  args: {
    items: [
      { label: '미보고', value: 2, isAlert: true },
      { label: '진행중', value: 6 },
      { label: '집행 예산', value: '$8,200' },
      { label: '계획 예산', value: '$12,000' },
    ],
  },
};

/**
 * sub로 값 아래에 부가 설명을 붙일 수 있다 — /reports의 "Avg. CPM" 항목이
 * 이 패턴을 쓴다("성과가 보고된 캠페인만 기준으로 계산됨"을 항상 보이게).
 */
export const WithSubLabel = {
  args: {
    items: [
      { label: 'Campaigns', value: 11 },
      { label: 'Planned Budget', value: '$12,800' },
      { label: 'Total Spend', value: '$2,580.50' },
      { label: 'Avg. CPM', value: '$8.39', sub: 'across reported campaigns' },
    ],
  },
};

/**
 * mockCampaigns를 실제로 집계한 값으로 렌더링
 */
export const WithMockData = {
  render: () => {
    const today = new Date('2026-07-20');
    const statuses = mockCampaigns.map((c) => getEffectiveStatus(c, today));
    const missingReportCount = mockCampaigns.filter((c) => {
      const status = getEffectiveStatus(c, today);
      if (status !== 'ended') return false;
      const hasReport = mockPerformanceRecords.some((p) => p.campaignId === c.id && p.reportedAt);
      return !hasReport;
    }).length;

    return (
      <Box sx={{ p: 2 }}>
        <KpiBar
          items={[
            { label: '진행중', value: statuses.filter((s) => s === 'active').length },
            { label: '예정', value: statuses.filter((s) => s === 'planned').length },
            { label: '종료', value: statuses.filter((s) => s === 'ended').length },
            { label: '미보고', value: missingReportCount, isAlert: missingReportCount > 0 },
          ]}
        />
      </Box>
    );
  },
};
