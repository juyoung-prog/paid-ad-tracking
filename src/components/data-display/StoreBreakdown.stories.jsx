import Box from '@mui/material/Box';
import { StoreBreakdown } from './StoreBreakdown';
import { getStoreBreakdown } from '../../data/schema';
import { mockStores, mockCampaigns } from '../../data/paidAdsMockData';

export default {
  title: 'Paid Ads Dashboard/Data Display/StoreBreakdown',
  component: StoreBreakdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## StoreBreakdown

매장별로 걸려 있는 캠페인 수를 나열하는 목록. 예산은 분배하지 않는다 —
\`all_stores\` 캠페인은 모든 매장에 "걸려 있는 캠페인"으로만 표시되고
금액은 캠페인 단위로만 집계된다 (매장 귀속 규칙).

### 기능
- \`schema.js\`의 \`getStoreBreakdown()\`으로 미리 조인된 rows를 그대로 렌더링
- 행 클릭 시 매장 기준 필터 콜백 (선택) — 보통 호출부에서 같은 매장을 다시 클릭하면 해제(toggle)하도록 구현
- \`selectedStoreId\`를 넘기면 일치하는 행을 강조 표시(action.selected 배경) — 이게 없으면 지금 뭘 필터링 중인지, 다시 눌러서 해제할 수 있다는 것 자체를 알 방법이 없었다(실제로 매장 클릭 후 원상태로 못 돌아간다는 피드백으로 추가)
        `,
      },
    },
  },
  argTypes: {
    rows: { control: 'object', description: 'getStoreBreakdown() 결과' },
    onRowClick: { action: 'rowClicked' },
    selectedStoreId: { control: 'text', description: '강조 표시할 매장 id' },
  },
};

/**
 * StoreBreakdown 기본 사용 예시
 */
export const Default = {
  args: {
    rows: [
      { storeId: 'G01', storeName: 'Georgia - Atlanta', campaigns: [{ id: 'c1' }, { id: 'c2' }] },
      { storeId: 'G02', storeName: 'Georgia - Duluth', campaigns: [{ id: 'c3' }] },
      { storeId: 'BF1', storeName: 'Florida - Orlando', campaigns: [] },
    ],
  },
  render: (args) => (
    <Box sx={{ maxWidth: 320 }}>
      <StoreBreakdown {...args} />
    </Box>
  ),
};

/**
 * selectedStoreId와 일치하는 행(G02)이 강조 표시된다 — 이 행을 다시 클릭하면
 * 해제(호출부의 toggle 로직)되는 것을 시각적으로 알 수 있다.
 */
export const WithSelection = {
  args: {
    selectedStoreId: 'G02',
    rows: [
      { storeId: 'G01', storeName: 'Georgia - Atlanta', campaigns: [{ id: 'c1' }, { id: 'c2' }] },
      { storeId: 'G02', storeName: 'Georgia - Duluth', campaigns: [{ id: 'c3' }] },
      { storeId: 'BF1', storeName: 'Florida - Orlando', campaigns: [] },
    ],
  },
  render: (args) => (
    <Box sx={{ maxWidth: 320 }}>
      <StoreBreakdown {...args} />
    </Box>
  ),
};

/**
 * 캠페인이 하나도 없는 매장 목록
 */
export const Empty = {
  args: { rows: [] },
};

/**
 * mockStores × mockCampaigns를 실제로 조인 — all_stores 캠페인(camp-03, camp-07)이
 * 모든 매장 행에 카운트되는지 확인할 수 있다.
 */
export const WithMockData = {
  render: () => (
    <Box sx={{ maxWidth: 320 }}>
      <StoreBreakdown rows={getStoreBreakdown(mockStores, mockCampaigns)} />
    </Box>
  ),
};
