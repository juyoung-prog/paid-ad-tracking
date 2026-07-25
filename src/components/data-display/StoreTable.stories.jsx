import Box from '@mui/material/Box';
import { StoreTable } from './StoreTable';
import { mockStores, mockCampaigns } from '../../data/paidAdsMockData';
import { getStoreBreakdown } from '../../data/schema';

const campaignCounts = Object.fromEntries(
  getStoreBreakdown(mockStores, mockCampaigns).map((row) => [row.storeId, row.campaigns.length])
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
campaignCounts를 넘기면 Campaigns 컬럼이 추가로 노출된다(getStoreBreakdown()으로 계산).
onRowClick이 있으면 행이 클릭/키보드(Enter·Space)로 활성화되고 우측에 chevron이
붙는다 — CampaignTable과 동일 패턴, StoreListSection에서 매장 수정 진입점으로 쓴다.
        `,
      },
    },
  },
  argTypes: {
    stores: { control: 'object', description: '매장 목록' },
    campaignCounts: { control: 'object', description: 'storeId별 캠페인 수' },
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
