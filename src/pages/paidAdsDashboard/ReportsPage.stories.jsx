import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PaidAdsShell } from './PaidAdsShell';
import { ReportsPage } from './ReportsPage';
import { PaidAdsStoreProvider } from './PaidAdsStoreProvider';
import { createMockPaidAdsStore } from './createMockPaidAdsStore';

export default {
  title: 'Paid Ads Dashboard/Page/ReportsPage',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## ReportsPage

성과 보고서 화면(\`/reports\`). 기간·Event·플랫폼으로 캠페인을 좁혀서 요약
통계와 캠페인별 지표를 확인하고 CSV로 내보낼 수 있다. 타이틀+네비는
PaidAdsShell(글로벌 셸)이 그리므로, 실제 화면과 동일하게 셸까지 포함해서
렌더링한다.

실제 앱에서는 usePaidAdsStore가 Supabase를 읽지만 스토리북에는 백엔드도
로그인 세션도 없다 — PaidAdsStoreProvider로 mock 스토어를 주입하지 않으면
RLS에 막혀 빈 배열이 돌아오고 표가 통째로 비어 보인다(에러가 아니라서
빌드는 통과한다).
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <PaidAdsStoreProvider value={ createMockPaidAdsStore() }>
      <MemoryRouter initialEntries={ ['/reports'] }>
        <Routes>
          <Route element={ <PaidAdsShell /> }>
            <Route path="/reports" element={ <ReportsPage /> } />
          </Route>
        </Routes>
      </MemoryRouter>
    </PaidAdsStoreProvider>
  ),
};

/** 필터 결과가 0건일 때 — 표 대신 안내 문구가 나오는 경로를 고정한다. */
export const Empty = {
  render: () => (
    <PaidAdsStoreProvider value={ createMockPaidAdsStore({ campaigns: [], performanceRecords: [] }) }>
      <MemoryRouter initialEntries={ ['/reports'] }>
        <Routes>
          <Route element={ <PaidAdsShell /> }>
            <Route path="/reports" element={ <ReportsPage /> } />
          </Route>
        </Routes>
      </MemoryRouter>
    </PaidAdsStoreProvider>
  ),
};
