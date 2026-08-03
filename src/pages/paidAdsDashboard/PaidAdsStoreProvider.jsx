import { PaidAdsStoreContext } from './usePaidAdsStore';

/**
 * PaidAdsStoreProvider
 *
 * usePaidAdsStore가 돌려줄 값을 위에서 주입한다. Storybook처럼 Supabase가 없는
 * 환경에서 DashboardPage/StoresPage/ReportsPage를 그대로 렌더하기 위한 통로다.
 * 실제 앱(App.jsx)에서는 감싸지 않는다 — 감싸지 않으면 Supabase 기반 스토어가 쓰인다.
 *
 * Props:
 * @param {object} value - usePaidAdsStore()의 반환값과 같은 모양 [Required]
 * @param {node} children - 이 스토어를 쓸 하위 트리 [Required]
 *
 * Example usage:
 * <PaidAdsStoreProvider value={ createMockPaidAdsStore() }>
 *   <DashboardPage />
 * </PaidAdsStoreProvider>
 */
export function PaidAdsStoreProvider({ value, children }) {
  return <PaidAdsStoreContext.Provider value={ value }>{ children }</PaidAdsStoreContext.Provider>;
}
