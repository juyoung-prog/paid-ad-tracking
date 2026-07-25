import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PaidAdsShell } from './PaidAdsShell';
import { StoresPage } from './StoresPage';

export default {
  title: 'Paid Ads Dashboard/Page/StoresPage',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## StoresPage

매장 마스터 관리 화면(\`/stores\`). usePaidAdsStore(localStorage 영속화)를 통해
실제 매장을 추가하면 새로고침해도 남고, CampaignForm의 매장 선택지에도
바로 반영된다 (같은 store를 공유하므로). 타이틀+네비는 PaidAdsShell(글로벌
셸)이 그리므로, 실제 화면과 동일하게 셸까지 포함해서 렌더링한다.
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <MemoryRouter initialEntries={['/stores']}>
      <Routes>
        <Route element={<PaidAdsShell />}>
          <Route path="/stores" element={<StoresPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};
