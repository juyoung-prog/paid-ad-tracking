import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PaidAdsShell } from './PaidAdsShell';
import { StoresPage } from './StoresPage';
import { PaidAdsStoreProvider } from './PaidAdsStoreProvider';
import { createMockPaidAdsStore } from './createMockPaidAdsStore';

export default {
  title: 'Paid Ads Dashboard/Page/StoresPage',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## StoresPage

매장 마스터 관리 화면(\`/stores\`). 실제 앱에서는 usePaidAdsStore가 Supabase를
읽고 쓰지만, 스토리북에는 백엔드도 로그인 세션도 없으므로 PaidAdsStoreProvider로
mock 스토어를 주입해 렌더한다(쓰기 함수는 no-op이라 스토리 간 상태가 누적되지
않는다). 타이틀+네비는 PaidAdsShell(글로벌 셸)이 그리므로, 실제 화면과 동일하게
셸까지 포함해서 렌더링한다.
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <PaidAdsStoreProvider value={ createMockPaidAdsStore() }>
      <MemoryRouter initialEntries={ ['/stores'] }>
        <Routes>
          <Route element={ <PaidAdsShell /> }>
            <Route path="/stores" element={ <StoresPage /> } />
          </Route>
        </Routes>
      </MemoryRouter>
    </PaidAdsStoreProvider>
  ),
};
