import { useCallback, useState } from 'react';
import { generateAlerts } from '../../data/schema';
import {
  mockStores,
  mockAdAccounts,
  mockCampaigns,
  mockPerformanceRecords,
} from '../../data/paidAdsMockData';
import { TODAY } from './paidAdsPageUtils';

const STORAGE_KEY = 'paidAdsDashboard:v1';

function seedState() {
  return {
    stores: mockStores,
    campaigns: mockCampaigns,
    performanceRecords: mockPerformanceRecords,
  };
}

function loadInitialState() {
  if (typeof window === 'undefined') return seedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // 손상된 저장값 — seed로 폴백
  }
  return seedState();
}

function persist(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage 사용 불가(프라이빗 모드, 용량 초과 등) — 조용히 무시, 세션 내 상태는 계속 동작
  }
}

/**
 * usePaidAdsStore
 *
 * 페이드 광고 대시보드의 영속화 계층. Campaign/PerformanceRecord/Store를
 * localStorage에 저장하고, Alert는 저장하지 않고 매 렌더마다
 * schema.js의 generateAlerts()로 다시 계산한다 — 알림을 저장된 값으로
 * 취급하면 캠페인이 바뀌었을 때 알림이 낡은 채로 남기 때문이다.
 *
 * AdAccount(meta-ga/meta-fl/tiktok-unified)는 사용자가 관리하는 대상이
 * 아니라 고정 구성이라 mock 데이터를 그대로 쓰고 영속화하지 않는다.
 *
 * Example usage:
 * const { campaigns, stores, alerts, addCampaign } = usePaidAdsStore();
 */
export function usePaidAdsStore() {
  const [state, setState] = useState(loadInitialState);

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persist(next);
      return next;
    });
  }, []);

  const addCampaign = useCallback(
    (campaign) => {
      update((prev) => ({ ...prev, campaigns: [...prev.campaigns, campaign] }));
    },
    [update]
  );

  const updateCampaign = useCallback(
    (campaignId, patch) => {
      update((prev) => ({
        ...prev,
        campaigns: prev.campaigns.map((c) => (c.id === campaignId ? { ...c, ...patch } : c)),
      }));
    },
    [update]
  );

  // 캠페인을 지우면 그 캠페인에 매달린 성과 레코드도 같이 지운다 — 안 그러면
  // campaignId가 존재하지 않는 고아 레코드가 localStorage에 남는다(참조 무결성).
  const deleteCampaign = useCallback(
    (campaignId) => {
      update((prev) => ({
        ...prev,
        campaigns: prev.campaigns.filter((c) => c.id !== campaignId),
        performanceRecords: prev.performanceRecords.filter((p) => p.campaignId !== campaignId),
      }));
    },
    [update]
  );

  const addStore = useCallback(
    (store) => {
      update((prev) => ({ ...prev, stores: [...prev.stores, store] }));
    },
    [update]
  );

  const updateStore = useCallback(
    (storeId, patch) => {
      update((prev) => ({
        ...prev,
        stores: prev.stores.map((s) => (s.id === storeId ? { ...s, ...patch } : s)),
      }));
    },
    [update]
  );

  const upsertPerformanceRecord = useCallback(
    (record) => {
      update((prev) => {
        const exists = prev.performanceRecords.some((p) => p.campaignId === record.campaignId);
        return {
          ...prev,
          performanceRecords: exists
            ? prev.performanceRecords.map((p) =>
                p.campaignId === record.campaignId ? { ...p, ...record } : p
              )
            : [...prev.performanceRecords, record],
        };
      });
    },
    [update]
  );

  const resetToSeedData = useCallback(() => {
    update(seedState());
  }, [update]);

  // new Date()(실제 시스템 시각)가 아니라 TODAY를 쓴다 — DashboardPage의
  // status/pacing 계산과 같은 기준일을 써야 한다. 어긋나면 화면엔 Active로
  // 보이는 캠페인의 알림 문구가 다른 "오늘" 기준으로 계산돼(예: 실제로는
  // D-5인데 알림엔 D-3로 표시) 날짜가 안 맞는 버그가 생긴다.
  const alerts = generateAlerts(state.campaigns, state.performanceRecords, TODAY);

  return {
    stores: state.stores,
    campaigns: state.campaigns,
    performanceRecords: state.performanceRecords,
    adAccounts: mockAdAccounts,
    alerts,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    addStore,
    updateStore,
    upsertPerformanceRecord,
    resetToSeedData,
  };
}
