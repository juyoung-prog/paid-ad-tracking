import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PaidAdsShell } from './PaidAdsShell';
import { ReportsPage } from './ReportsPage';

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
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <MemoryRouter initialEntries={['/reports']}>
      <Routes>
        <Route element={<PaidAdsShell />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};
