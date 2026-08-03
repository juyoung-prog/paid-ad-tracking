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
