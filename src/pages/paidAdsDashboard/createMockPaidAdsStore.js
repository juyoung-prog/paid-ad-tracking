import { generateAlerts } from '../../data/schema';
import {
  mockStores,
  mockAdAccounts,
  mockCampaigns,
  mockPerformanceRecords,
} from '../../data/paidAdsMockData';
import { TODAY } from './paidAdsPageUtils';

/**
 * createMockPaidAdsStore
 *
 * usePaidAdsStore()와 같은 모양의 값을 mock 데이터로 만들어 준다.
 * PaidAdsStoreProvider에 넣어 Storybook에서 페이지를 백엔드 없이 렌더할 때 쓴다.
 *
 * 쓰기 함수는 상태를 실제로 바꾸지 않는다 — Storybook은 "이 데이터일 때 화면이
 * 어떻게 보이는가"를 고정해 보여주는 곳이고, 스토리마다 저장 결과가 누적되면
 * 스냅샷이 흔들려 시각 회귀 테스트의 의미가 사라진다. 상호작용을 확인해야 하는
 * 스토리는 각자 useState로 로컬 상태를 들고 이 값을 덮어쓰면 된다.
 *
 * @param {object} overrides - 특정 필드만 바꿔 끼울 때 사용 [Optional, 기본값: {}]
 *
 * Example usage:
 * <PaidAdsStoreProvider value={ createMockPaidAdsStore({ campaigns: [] }) }>
 *   <DashboardPage />
 * </PaidAdsStoreProvider>
 */
export function createMockPaidAdsStore(overrides = {}) {
  const campaigns = overrides.campaigns ?? mockCampaigns;
  const performanceRecords = overrides.performanceRecords ?? mockPerformanceRecords;
  const noop = async () => null;

  return {
    stores: mockStores,
    adAccounts: mockAdAccounts,
    campaigns,
    performanceRecords,
    alerts: generateAlerts(campaigns, performanceRecords, TODAY),
    isLoading: false,
    error: null,
    refresh: noop,
    addCampaign: noop,
    updateCampaign: noop,
    deleteCampaign: noop,
    addStore: noop,
    updateStore: noop,
    upsertPerformanceRecord: noop,
    ...overrides,
  };
}
