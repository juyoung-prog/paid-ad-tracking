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
- sub로 값 아래 부가 설명 추가 가능(예: "across reported campaigns") — sub 줄은 없어도 항상 자리를 예약해, sub 있는 항목이 생기고 사라질 때(탭 전환 등) 바 높이가 흔들리지 않는다
- delta로 비교 기준 한 줄 추가 가능 — 아래 "왜 delta인가" 참고

### 스타일은 레퍼런스 실측값이다
라벨 12px/400 문장형, 값 \`display\`(24px/700), 모든 항목 사이 세로 구분선.
전부 influencer tracking dashboard의 실측값이다. 한때 라벨을 13/600 대문자로,
값을 28px로 올렸다가 되돌렸다 — 일반 위계 원칙으로는 나아 보여도 이 프로젝트의
1순위 규칙("같은 회사 툴군처럼 보이기")을 어긴다. 두 도구를 오가는 사람에게는
숫자 크기가 다른 것 자체가 "다른 제품"이라는 신호다.

### 왜 delta인가 (그리고 왜 "지난 30일 대비"가 아닌가)
\`$8.63\`만 크게 띄우면 화면이 **그게 좋은지 나쁜지에 답하지 못한다.** 그렇다고
"지난 30일 대비 +12%"를 붙일 수는 없다 — 이 앱의 성과 레코드는 캠페인당 누적
1건이라 **시계열 축이 아예 없어서 기간 비교를 계산할 수 없다**(schema.js의
PerformanceRecord). 없는 비교를 지어내지 않고, 실제로 도출되는 것만 넘긴다:
계획 대비 집행률, 전체 평균 대비 CPM. 근거가 없으면 \`delta\`를 생략한다.

방향은 \`direction\`(▲/▼ 기호)과 \`tone\`(색)으로 나눠 받는다. CPM처럼 **낮을수록
좋은** 지표는 둘이 반대로 붙기 때문이다 — 색 하나로는 표현할 수 없고, 색만으로
구분하면 색각 이상 사용자에게는 증감이 사라진다.
        `,
      },
    },
  },
  argTypes: {
    items: { control: 'object', description: '{ label, value, sub?, delta?, isAlert? } 배열' },
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
 * delta — "그래서 이 숫자가 좋은 건가"에 답하는 한 줄. /reports의 Performance
 * 탭이 쓰는 형태다.
 *
 * 확인 포인트:
 * - **Total Spend**: 계획이 있을 때만 delta가 붙는다. 초과하면 tone이 'bad'로
 *   바뀌어 warning 색이 된다
 * - **Avg. CPM**: 낮을수록 좋은 지표라 ▼(내려감)에 'good'이 붙는다 — 방향 기호와
 *   색이 반대로 가는 유일한 경우다. 문구에 cheaper/pricier를 적어 기호·색을
 *   못 읽어도 뜻이 통하게 한다
 * - **Campaigns**: 비교할 근거가 없으므로 delta가 아예 없다. 빈 자리를 만들지
 *   않는다(값이 없으면 줄을 안 그린다)
 */
export const WithDelta = {
  args: {
    items: [
      { label: 'Campaigns', value: 11 },
      {
        label: 'Total Spend',
        value: '$4,614.00',
        delta: { text: '147% of $3,130 planned', tone: 'bad' },
      },
      {
        label: 'Avg. CPM',
        value: '$8.63',
        sub: 'across reported campaigns',
        delta: { text: '12% cheaper than your average', direction: 'down', tone: 'good' },
      },
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
