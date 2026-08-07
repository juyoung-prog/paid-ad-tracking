import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PaidAdsShell } from './PaidAdsShell';
import { DashboardPage } from './DashboardPage';
import { PaidAdsStoreProvider } from './PaidAdsStoreProvider';
import { createMockPaidAdsStore } from './createMockPaidAdsStore';

export default {
  title: 'Paid Ads Dashboard/Page/DashboardPage',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## DashboardPage

메인 현황 대시보드(\`/dashboard\`). 실제 앱에서는 usePaidAdsStore가 Supabase를
읽지만, 스토리북에는 백엔드도 로그인 세션도 없으므로 PaidAdsStoreProvider로
mock 스토어를 주입해 렌더한다. 알림은 저장된 값이 아니라 schema.js의
generateAlerts()로 매번 다시 계산된다. 타이틀+네비는 PaidAdsShell(글로벌 셸)이
그리므로, 실제 화면과 동일하게 셸까지 포함해서 렌더링한다.

### 상단의 "no Event" 안내는 정상이다
mockCampaigns에는 \`campaignGroup\` 필드가 아예 없어서, 모든 mock 캠페인이 태그 없는
상태로 렌더된다 — 그래서 \`N campaigns have no Event\` 안내가 항상 뜬다. 이건 버그가
아니라 **실제 계정의 기본 상태를 그대로 재현한 것**이다: 동기화로 들어온 캠페인은
Event 태그 없이 도착하고, 태그를 안 붙이면 이벤트 요약·계획 대비에서 통째로 빠진다.

\`Tag them\`을 누르면 BulkEventTagDialog가 열린다. mock 스토어의
\`bulkSetCampaignGroup\`은 noop이라 실제로 저장되지는 않으므로, 대화상자 자체의
동작은 그 컴포넌트의 스토리에서 확인한다.
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <PaidAdsStoreProvider value={ createMockPaidAdsStore() }>
      <MemoryRouter initialEntries={ ['/dashboard'] }>
        <Routes>
          <Route element={ <PaidAdsShell /> }>
            <Route path="/dashboard" element={ <DashboardPage /> } />
          </Route>
        </Routes>
      </MemoryRouter>
    </PaidAdsStoreProvider>
  ),
};

/** 데이터가 하나도 없을 때의 빈 상태 — 실제 신규 계정이 처음 보는 화면이다. */
export const Empty = {
  render: () => (
    <PaidAdsStoreProvider value={ createMockPaidAdsStore({ campaigns: [], performanceRecords: [] }) }>
      <MemoryRouter initialEntries={ ['/dashboard'] }>
        <Routes>
          <Route element={ <PaidAdsShell /> }>
            <Route path="/dashboard" element={ <DashboardPage /> } />
          </Route>
        </Routes>
      </MemoryRouter>
    </PaidAdsStoreProvider>
  ),
};
