import { MemoryRouter } from 'react-router-dom';
import Box from '@mui/material/Box';
import { ReportSummarySection } from './ReportSummarySection';
import { mockCampaigns, mockPerformanceRecords } from '../../data/paidAdsMockData';
import { PLATFORM, GOAL, TARGET_SCOPE } from '../../data/schema';

/**
 * Gantt 타임라인은 Event(campaignGroup)를 골라야 나타나는데, mockCampaigns에는
 * campaignGroup이 하나도 없어서 그 경로가 스토리에서 한 번도 실행되지 않았다.
 * 실제로 마일스톤 라벨이 차트 밖으로 잘리는 버그가 이 사각지대에서 살아남았다.
 *
 * 아래 데이터는 그 경로를 재현하기 위한 것이고, 특히 **양 끝의 긴 라벨**을 노린다:
 * 라벨은 같은 날 시작하는 캠페인 이름을 모두 이어붙이므로 타임라인 시작/끝에서
 * 쉽게 차트 밖으로 넘친다.
 */
const groupedCampaigns = [
  ['g-1', 'G10_Coming Soon_0617~0707 — Instagram post: COMING SOON TO UNION CITY, GA', '2026-06-17', '2026-07-07', 1200],
  ['g-2', 'G10_Now Open_0706~0831', '2026-07-06', '2026-08-31', 2400],
  ['g-3', 'G10_Grand Opening_0706~0801', '2026-07-06', '2026-08-01', 1800],
  ['g-4', 'G10_1_Month Deals_0710~0831', '2026-07-10', '2026-08-31', 900],
  ['g-5', 'G10_Final Week Push — last-week concentrated spend across all stores', '2026-08-31', '2026-08-31', 600],
].map(([id, name, startDate, endDate, budgetPlanned]) => ({
  id,
  name,
  campaignGroup: 'G10 Opening',
  platform: PLATFORM.TIKTOK,
  accountId: 'tiktok-unified',
  targetScope: TARGET_SCOPE.ALL_STORES,
  targetStoreIds: [],
  startDate,
  endDate,
  budgetPlanned,
  goal: GOAL.TRAFFIC,
  manualStatus: null,
  creativeUrl: '',
  createdAt: '2026-06-01T09:00:00Z',
  updatedAt: '2026-07-20T09:00:00Z',
}));

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

/**
 * Event(G10 Opening)를 고른 상태 — Plan 탭의 Gantt 타임라인과 마일스톤 라벨이 나온다.
 * 확인 포인트: 타임라인 **양 끝**의 긴 라벨이 차트 밖으로 잘리지 않는지.
 * 시작 근처 라벨은 점선에서 오른쪽으로, 끝 근처 라벨은 왼쪽으로 눕고,
 * 그래도 길면 240px에서 말줄임된다(전체 문자열은 title로 남는다).
 */
export const EventTimeline = {
  name: 'Event Timeline (Gantt)',
  render: () => (
    <MemoryRouter>
      <Box>
        <ReportSummarySection campaigns={groupedCampaigns} performanceRecords={[]} />
      </Box>
    </MemoryRouter>
  ),
};
