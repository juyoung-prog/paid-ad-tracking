import Box from '@mui/material/Box';
import { PerformanceReportTable } from './PerformanceReportTable';
import { getCampaignMetricsRow } from '../../data/schema';
import { mockCampaigns, mockPerformanceRecords } from '../../data/paidAdsMockData';

export default {
  title: 'Paid Ads Dashboard/Data Display/PerformanceReportTable',
  component: PerformanceReportTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## PerformanceReportTable

성과 보고서(/reports)의 캠페인별 지표 표. rows는 schema.js의
getCampaignMetricsRow()로 미리 계산해서 넘긴다 — 컴포넌트는 CPM/CTR/CPC를
직접 계산하지 않는다.
        `,
      },
    },
  },
  argTypes: {
    rows: { control: 'object', description: 'getCampaignMetricsRow() 결과 배열' },
    onRowClick: { action: 'rowClicked' },
  },
};

export const Default = {
  render: () => {
    const rows = mockCampaigns
      .slice(0, 5)
      .map((c) => getCampaignMetricsRow(c, mockPerformanceRecords.find((r) => r.campaignId === c.id)));
    return (
      <Box sx={{ maxWidth: 900 }}>
        <PerformanceReportTable rows={rows} />
      </Box>
    );
  },
};

/**
 * onRowClick이 있으면 행에 hover 커서가 붙는다. 실제 화면(/reports)에서는
 * campaignId로 /dashboard?campaign={id} 딥링크 이동에 쓰인다.
 */
export const WithRowClick = {
  render: (args) => {
    const rows = mockCampaigns
      .slice(0, 5)
      .map((c) => getCampaignMetricsRow(c, mockPerformanceRecords.find((r) => r.campaignId === c.id)));
    return (
      <Box sx={{ maxWidth: 900 }}>
        <PerformanceReportTable rows={rows} onRowClick={args.onRowClick} />
      </Box>
    );
  },
};

export const Empty = {
  args: { rows: [] },
};
