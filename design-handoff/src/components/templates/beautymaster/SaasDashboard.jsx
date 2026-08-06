import { useMemo, useState } from 'react';
import SaasShell from './SaasShell';
import SaasOperationsView from './SaasOperationsView';
import SaasAnalyticsView from './SaasAnalyticsView';
import SaasWorkflowView from './SaasWorkflowView';
import { ALL_STORES, deriveStores } from '../../../data/beautymaster/schema.js';

/**
 * SaasDashboard component
 *
 * BeautyMaster 대시보드의 본체 조립부. Operations / Analytics / Workflow 3개 뷰를 사이드바(SaasShell)로 전환한다.
 * 표면 문법은 modern_saas_design_core_features.md 기반 — White 배경, thin 1px border,
 * 8px radius, 섀도 없음, Inter, accent는 theme primary 1색. 카드를 쓰지 않고
 * border + spacing + typography로 구획하고, 본문은 중앙 정렬 없이 프레임을 가득 채운다.
 *
 * 데이터는 소유하지 않는다 — BeautymasterDashboard 페이지가 useSheetData로 받아 내려준다.
 * 여기서 소유하는 건 화면 상태(활성 뷰, 선택 스토어)뿐이다.
 *
 * Props:
 * @param {Influencer[]} influencers - 전체 인플루언서 목록 (data/beautymaster/schema.js typedef) [Required]
 * @param {object} inviteCounts - "Number" 탭 초대 인원 데이터 (store→tier→count) [Optional, 기본값: {}]
 * @param {Date|null} lastSyncedAt - 마지막 시트 동기화 시각 [Optional, 기본값: null]
 * @param {string} defaultView - 최초 활성 뷰 (operations|analytics|workflow) [Optional, 기본값: 'operations']
 * @param {function} onSelect - 인플루언서 행 클릭 핸들러 (influencer) => void [Optional]
 * @param {function} onRefresh - 헤더 새로고침 핸들러 [Optional]
 * @param {function} onOpenSettings - 헤더 설정 아이콘 클릭 핸들러 [Optional]
 * @param {string} sheetUrl - Google Sheet 원본 링크 (헤더 아이콘 + Operations의 Record performance 큐 안내) [Optional, 기본값: '']
 * @param {string|null} selectedId - 현재 선택된 인플루언서 ID [Optional, 기본값: null]
 * @param {boolean} isLoading - 최초 로딩 여부 [Optional, 기본값: false]
 * @param {boolean} isSyncing - 시트 조회 진행 중 여부 (헤더 Refresh 표시) [Optional, 기본값: false]
 * @param {Error|null} error - 조회 실패 에러 [Optional, 기본값: null]
 * @param {function} onRetry - 에러 배너 Retry 핸들러 [Optional]
 * @param {string} defaultStore - 최초 선택 스토어 ('all'이면 전체). uncontrolled일 때만 쓰임 [Optional, 기본값: 'all']
 * @param {string|null} selectedStore - 선택된 스토어. 주면 controlled, 안 주면 내부 상태 [Optional, 기본값: null]
 * @param {function} onStoreChange - 스토어 변경 핸들러 (store) => void [Optional]
 * @param {object} storeDocs - Workflow 뷰의 store별 문서 링크 맵 [Optional, 기본값: {}]
 * @param {string} influencerTrackingListUrl - Workflow 뷰의 스토어 무관 고정 링크 [Optional, 기본값: '']
 * @param {object} sx - 루트 Box에 적용할 MUI sx 오버라이드 [Optional]
 *
 * Example usage:
 * <SaasDashboard influencers={influencers} lastSyncedAt={lastSyncedAt} onSelect={handleSelect} />
 */
function SaasDashboard({
  influencers,
  inviteCounts = {},
  lastSyncedAt = null,
  defaultView = 'operations',
  onSelect,
  onRefresh,
  onOpenSettings,
  sheetUrl = '',
  selectedId = null,
  isLoading = false,
  isSyncing = false,
  error = null,
  onRetry,
  defaultStore = ALL_STORES,
  selectedStore = null,
  onStoreChange,
  storeDocs = {},
  influencerTrackingListUrl = '',
  sx,
}) {
  const [activeView, setActiveView] = useState(defaultView);
  /** 스토어는 세 뷰가 공유한다 — 뷰를 옮겨도 보던 스토어가 유지되도록 셸이 소유.
   *  페이지가 config.defaultStore로 시딩해야 하는 경우를 위해 controlled도 지원한다 */
  const [internalStore, setInternalStore] = useState(defaultStore);
  const isStoreControlled = selectedStore !== null;
  const activeStore = isStoreControlled ? selectedStore : internalStore;

  const handleStoreChange = store => {
    if (!isStoreControlled) setInternalStore(store);
    onStoreChange?.(store);
  };

  const stores = useMemo(() => deriveStores(influencers), [influencers]);

  return (
    <SaasShell
      activeNav={activeView}
      lastSyncedAt={lastSyncedAt}
      isSyncing={isSyncing}
      onNavigate={setActiveView}
      onRefresh={onRefresh}
      sheetUrl={sheetUrl}
      onOpenSettings={onOpenSettings}
      sx={sx}
    >
      {activeView === 'operations' && (
        <SaasOperationsView
          influencers={influencers}
          onSelect={onSelect}
          selectedId={selectedId}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          stores={stores}
          selectedStore={activeStore}
          onStoreChange={handleStoreChange}
          sheetUrl={sheetUrl}
        />
      )}
      {activeView === 'analytics' && (
        <SaasAnalyticsView
          influencers={influencers}
          inviteCounts={inviteCounts}
          stores={stores}
          selectedStore={activeStore}
          onStoreChange={handleStoreChange}
          sheetUrl={sheetUrl}
          onSelect={onSelect}
        />
      )}
      {activeView === 'workflow' && (
        <SaasWorkflowView
          stores={stores}
          selectedStore={activeStore}
          onStoreChange={handleStoreChange}
          storeDocs={storeDocs}
          influencerTrackingListUrl={influencerTrackingListUrl}
        />
      )}
    </SaasShell>
  );
}

export default SaasDashboard;
