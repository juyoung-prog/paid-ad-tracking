import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { PaidAdsShell } from './PaidAdsShell';

export default {
  title: 'Paid Ads Dashboard/Layout/PaidAdsShell',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## PaidAdsShell

DashboardPage/StoresPage/ReportsPage가 공유하는 글로벌 앱 셸. 기존
AppShell(GNB 기반) 컴포넌트를 재사용해서 타이틀+네비를 한 곳에서만 그리고
\`<Outlet />\`으로 페이지 콘텐츠를 갈아끼운다. 반응형(모바일 햄버거+드로어)은
AppShell/GNB가 이미 처리한다 — 브라우저 폭을 좁혀서 확인할 수 있다.
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          element={<PaidAdsShell />}
        >
          <Route
            path="/dashboard"
            element={(
              <Box sx={{ p: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Page content renders here via &lt;Outlet /&gt;.
                </Typography>
              </Box>
            )}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};
