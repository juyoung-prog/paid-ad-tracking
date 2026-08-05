import { PageContainer } from '../../components/layout/PageContainer';
import { usePaidAdsStore } from './usePaidAdsStore';
import { PAGE_GUTTER_X } from './paidAdsPageUtils';
import { StoreListSection } from './StoreListSection';

/**
 * StoresPage
 *
 * 매장 마스터 관리 화면(/stores). usePaidAdsStore(영속화)로 실제 매장을
 * 추가하면 CampaignForm의 StoreMultiSelect 선택지에도 즉시 반영된다
 * (같은 store를 공유하므로). 타이틀+네비는 PaidAdsShell(글로벌 셸)이 그린다.
 */
export function StoresPage() {
  const { stores, campaigns, addStore, updateStore } = usePaidAdsStore();

  return (
    <PageContainer maxWidth={false} sx={{ py: 3, px: PAGE_GUTTER_X }}>
      <StoreListSection stores={stores} campaigns={campaigns} onAddStore={addStore} onUpdateStore={updateStore} />
    </PageContainer>
  );
}
