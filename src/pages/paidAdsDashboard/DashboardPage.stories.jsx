import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PaidAdsShell } from './PaidAdsShell';
import { DashboardPage } from './DashboardPage';

export default {
  title: 'Paid Ads Dashboard/Page/DashboardPage',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## DashboardPage

메인 현황 대시보드(\`/dashboard\`). usePaidAdsStore(localStorage 영속화)로 실제
캠페인 등록·성과 입력이 새로고침 후에도 남는다. 알림은 저장된 값이 아니라
schema.js의 generateAlerts()로 매번 다시 계산된다. 타이틀+네비는
PaidAdsShell(글로벌 셸)이 그리므로, 실제 화면과 동일하게 셸까지 포함해서
렌더링한다.
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<PaidAdsShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};
