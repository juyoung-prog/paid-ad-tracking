import { MemoryRouter } from 'react-router-dom';
import { PaidAdsNav } from './PaidAdsNav';

export default {
  title: 'Paid Ads Dashboard/Layout/PaidAdsNav',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## PaidAdsNav

DashboardPage/StoresPage/ReportsPage 세 페이지가 공유하는 최소 내비게이션.
이 프로젝트 전용이라 컴포넌트 라이브러리가 아니라 페이지 폴더에 둔다.
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard']}>
      <PaidAdsNav />
    </MemoryRouter>
  ),
};

export const OnStoresPage = {
  render: () => (
    <MemoryRouter initialEntries={['/stores']}>
      <PaidAdsNav />
    </MemoryRouter>
  ),
};
