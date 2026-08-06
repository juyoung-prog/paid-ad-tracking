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

네 페이지가 공유하는 글로벌 앱 셸. 타이틀+네비를 한 곳에서만 그리고
\`<Outlet />\`으로 페이지 콘텐츠를 갈아끼운다.

내비는 좌측 아이콘 레일(\`PaidAdsRail\`)이다 — 예전의 AppShell(상단 GNB +
가로 네비)에서 옮겨왔다. 세로 내비는 항목이 늘어도 가로폭을 먹지 않고,
본문 상단 전체를 페이지 툴바가 쓸 수 있다(예전엔 GNB 아래에 툴바가 또 붙어
헤더가 두 겹이었다).

스크롤은 셸의 \`main\`이 소유한다 — 문서 전체를 스크롤시키면 레일이 같이
밀려 올라간다. 각 페이지의 sticky 툴바는 이 컨테이너 기준(\`top: 0\`)으로 붙는다.
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
