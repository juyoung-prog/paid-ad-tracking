import { MemoryRouter } from 'react-router-dom';
import Box from '@mui/material/Box';
import { ReportSummarySection } from './ReportSummarySection';
import { mockCampaigns, mockPerformanceRecords } from '../../data/paidAdsMockData';

export default {
  title: 'Paid Ads Dashboard/Section/ReportSummarySection',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## ReportSummarySection

/reports 페이지를 구성하는 섹션. 기간·플랫폼·Event 필터(FilterBar) + 요약
통계(KpiBar) + Plan/Performance 두 탭. Store 필터는 없다 — 이 페이지의 핵심
질문은 "어떤 Event에 어떤 캠페인이 있나"라서 Event가 1급 필터고, Event를
이미 골랐으면 Store로 또 좁힐 일이 실질적으로 없다(실사용 피드백으로 제거).
Plan 탭은 Event를 선택하면 Gantt 타임라인 + Budget Breakdown 표로, Performance
탭은 goal별로 다른 컬럼의 표(PerformanceReportTable이 아니라 schema.js
getGoalMetricsRow() 기반 자체 렌더링)로 보여준다. 행 클릭 시 /dashboard?
campaign={id}로 이동 — useNavigate를 쓰므로 스토리에서도 MemoryRouter로 감싼다.
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <MemoryRouter>
      <Box>
        <ReportSummarySection campaigns={mockCampaigns} performanceRecords={mockPerformanceRecords} />
      </Box>
    </MemoryRouter>
  ),
};
