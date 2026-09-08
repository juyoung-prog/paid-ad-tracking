import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PaidAdsShell } from './PaidAdsShell';
import { RecapPage } from './RecapPage';
import { RecapDetailPage } from './RecapDetailPage';
import { PaidAdsStoreProvider } from './PaidAdsStoreProvider';
import { createMockPaidAdsStore } from './createMockPaidAdsStore';
import {
  mockRecapCampaigns,
  mockRecapPerformanceRecords,
  mockEventRecaps,
  mockRecapCampaignNotes,
} from '../../data/paidAdsMockData';

/** Recap 스토리의 기준일 — 모든 목 이벤트가 끝난 뒤 */
const RECAP_TODAY = new Date('2026-09-06T00:00:00');

const recapStore = (overrides = {}) => createMockPaidAdsStore({
  campaigns: mockRecapCampaigns,
  performanceRecords: mockRecapPerformanceRecords,
  performanceDaily: [],
  eventRecaps: mockEventRecaps,
  recapCampaignNotes: mockRecapCampaignNotes,
  today: RECAP_TODAY,
  ...overrides,
});

const render = (store, path) => (
  <PaidAdsStoreProvider value={ store }>
    <MemoryRouter initialEntries={ [path] }>
      <Routes>
        <Route element={ <PaidAdsShell /> }>
          <Route path="/recap" element={ <RecapPage /> } />
          <Route path="/recap/:event" element={ <RecapDetailPage /> } />
        </Route>
      </Routes>
    </MemoryRouter>
  </PaidAdsStoreProvider>
);

export default {
  title: 'Paid Ads Dashboard/Page/RecapPage',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## RecapPage

캠페인 종료 후 결과 보고의 이벤트 목록(\`/recap\`, 레일 이름은 **Reports** — 2026-09 개명, 내부 경로는 그대로) — 02-ux-flow 시나리오 7,
Build Plan Phase 4. 이벤트(campaignGroup) 하나가 보고서 하나다. 최근 끝난 이벤트가
위로 오고 행을 누르면 \`/recap/{event}\`로 간다.

Performance(진행 확인, 내부 /reports)와 목적이 달라 레일의 별도 메뉴다. 보고서 상태(Draft / Final /
Not started)는 2단계 저장이 붙기 전까지 목 데이터에서만 Draft가 보인다.

머리글 오른쪽에 **연도 필터**(\`YearSelect\`)가 언어 선택 앞에 있다(2026-09-08) — 이벤트가 실제로 있는 연도만
최신순, 기본은 올해(없으면 가장 최근 연도), \`?year=\`로 유지. 이벤트의 연도는 시작일의 연도 하나다.

목록 계산(\`buildRecapEvents\`)은 schema.js가 하고 페이지는 자리에 놓는다. 스토어는
PaidAdsStoreProvider로 mock을 주입한다 — Recap 목 데이터(\`mockRecapCampaigns\`)는
Dashboard 스토리의 목록과 섞지 않는다.
        `,
      },
    },
  },
};

/** 이벤트 5개 — G10 Opening만 Draft, 나머지는 Not started */
export const Default = {
  render: () => render(recapStore(), '/recap'),
};

/** 태그된 이벤트가 하나도 없을 때 */
export const Empty = {
  render: () => render(recapStore({ campaigns: [], performanceRecords: [], eventRecaps: [], recapCampaignNotes: [] }), '/recap'),
};

/** 로딩 중 — 스켈레톤 */
export const Loading = {
  render: () => render(recapStore({ isLoading: true }), '/recap'),
};
