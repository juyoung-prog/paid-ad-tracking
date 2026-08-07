import Box from '@mui/material/Box';
import { StoreTable } from './StoreTable';
import { mockStores, mockCampaigns } from '../../data/paidAdsMockData';
import { TARGET_SCOPE, getEffectiveStatus } from '../../data/schema';
import { MOCK_TODAY } from '../../pages/paidAdsDashboard/paidAdsPageUtils';

/* 실제 호출부(StoreListSection)와 같은 규칙으로 만든다 — 전 매장 대상 캠페인은
   빼고(매장마다 같은 수를 더하면 비교가 불가능해진다) 매장 전용만 센다. */
const campaignCounts = Object.fromEntries(
  mockStores.map((store) => {
    const forStore = mockCampaigns.filter(
      (c) => c.targetScope !== TARGET_SCOPE.ALL_STORES && c.targetStoreIds.includes(store.id)
    );
    return [
      store.id,
      {
        active: forStore.filter((c) => getEffectiveStatus(c, MOCK_TODAY) === 'active').length,
        total: forStore.length,
      },
    ];
  })
);

export default {
  title: 'Paid Ads Dashboard/Data Display/StoreTable',
  component: StoreTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## StoreTable

매장 관리(/stores) 페이지의 매장 목록 테이블. 코드/이름/지역/상태를 보여준다.
StoreBreakdown(대시보드의 캠페인 수 요약)과는 관심사가 달라 별도로 분리했다.
campaignCounts를 넘기면 **Active / Total** 컬럼이 추가로 노출된다. 한때 역대 캠페인 수
하나만 보여줬는데, 바로 왼쪽 Status의 초록 Active 칩과 눈으로 묶여 "지금 도는 광고 수"로
읽혔다 — 실데이터에선 전체 170건 중 166건이 이미 끝난 캠페인이라 98%가 과거 기록인
숫자를 현재 상태처럼 보여준 셈이었다(실사용 신고). 지금 도는 수를 앞·진하게, 역대 수를
뒤·흐리게 둔다. 조인·상태 판정은 호출부 책임이고 이 컴포넌트는 받은 숫자만 그린다.
onRowClick이 있으면 행이 클릭/키보드(Enter·Space)로 활성화되고 우측에 chevron이
붙는다 — CampaignTable과 동일 패턴, StoreListSection에서 매장 수정 진입점으로 쓴다.
        `,
      },
    },
  },
  argTypes: {
    stores: { control: 'object', description: '매장 목록' },
    campaignCounts: { control: 'object', description: 'storeId별 { active, total }' },
    onRowClick: { action: 'rowClicked' },
  },
};

export const Default = {
  args: { stores: mockStores, campaignCounts },
  render: (args) => (
    <Box sx={{ maxWidth: 640 }}>
      <StoreTable {...args} />
    </Box>
  ),
};

export const WithoutCampaignCounts = {
  args: { stores: mockStores },
  render: (args) => (
    <Box sx={{ maxWidth: 640 }}>
      <StoreTable {...args} />
    </Box>
  ),
};

/** 행 클릭으로 수정 진입 — chevron 노출, 키보드로도 활성화 가능 */
export const Clickable = {
  args: { stores: mockStores, campaignCounts },
  render: (args) => (
    <Box sx={{ maxWidth: 640 }}>
      <StoreTable {...args} onRowClick={args.onRowClick} />
    </Box>
  ),
};

export const Empty = {
  args: { stores: [], campaignCounts: {} },
};
