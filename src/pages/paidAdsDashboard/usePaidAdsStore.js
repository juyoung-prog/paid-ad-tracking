import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { generateAlerts } from '../../data/schema';
import {
  rowToStore,
  storeToRow,
  rowToAdAccount,
  rowToCampaign,
  campaignToRow,
  rowToPerformanceRecord,
  performanceRecordToRow,
  rowToPlan,
} from './paidAdsMappers';
import { startOfToday, toLocalISODate } from './paidAdsPageUtils';

const EMPTY_STATE = {
  stores: [],
  adAccounts: [],
  campaigns: [],
  performanceRecords: [],
  plans: [],
};

/** performance_records는 캠페인당 여러 행(날짜×source)이지만 화면 모델은 캠페인당 1건이다. */
const LATEST_PERFORMANCE_VIEW = 'performance_records_latest';

/** upsert가 쓰는 recorded_at — 저장 시점의 실제 로컬 날짜. 예전엔 고정
    TODAY(2026-07-20)를 써서 8월에 넣은 성과도 7/20로 기록되는 실버그가 있었다. */
function todayISODate() {
  return toLocalISODate(new Date());
}

/**
 * 스토어 주입용 컨텍스트. 값이 들어 있으면 usePaidAdsStore가 Supabase 대신 그 값을 쓴다.
 * Storybook처럼 백엔드가 없는 환경에서 페이지를 그대로 렌더하기 위한 통로다
 * (05-api-integration.md 5단계: "mock 데이터는 Storybook 전용으로 남긴다").
 */
export const PaidAdsStoreContext = createContext(null);

/**
 * usePaidAdsStore
 *
 * 주입된 스토어가 있으면 그것을, 없으면 Supabase 기반 실제 스토어를 돌려준다.
 * Hook 규칙상 useSupabasePaidAdsStore는 항상 호출해야 하므로, 주입된 경우에는
 * enabled=false로 넘겨 네트워크 요청만 막는다.
 */
export function usePaidAdsStore() {
  const injected = useContext(PaidAdsStoreContext);
  const live = useSupabasePaidAdsStore(!injected);
  return injected ?? live;
}

/**
 * useSupabasePaidAdsStore
 *
 * 페이드 광고 대시보드의 데이터 계층. Supabase(Postgres)를 읽고 쓴다.
 * Alert는 저장하지 않고 매 렌더마다 schema.js의 generateAlerts()로 다시 계산한다 —
 * 알림을 저장된 값으로 취급하면 캠페인이 바뀌었을 때 알림이 낡은 채로 남기 때문이다.
 *
 * 모든 테이블의 RLS가 `owner_id = auth.uid()`라 로그인된 세션이 있어야 데이터가 보인다.
 * 세션이 없으면 조용히 빈 배열이 나오므로 App에서 로그인 게이트를 먼저 통과시킨다.
 *
 * 쓰기 함수는 전부 async다. DB가 돌려준 행을 다시 매핑해 상태에 넣기 때문에
 * 서버가 채운 값(id, created_at, 트리거 결과)이 화면에 그대로 반영된다.
 *
 * @param {boolean} isEnabled - false면 조회하지 않는다(스토어가 주입된 경우) [Optional, 기본값: true]
 *
 * Example usage:
 * const { campaigns, stores, alerts, isLoading, error, addCampaign } = usePaidAdsStore();
 */
export function useSupabasePaidAdsStore(isEnabled = true) {
  const [state, setState] = useState(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [error, setError] = useState(null);

  // 조회만 하고 상태는 건드리지 않는다. setState를 이 밖으로 뺀 이유는
  // effect 본문에서 동기적으로 setState하면 렌더가 연쇄로 도는 것을 막기 위함이다
  // (react-hooks/set-state-in-effect).
  const fetchAll = useCallback(async () => {
    const [storesRes, accountsRes, campaignsRes, performanceRes, plansRes, planItemsRes] = await Promise.all([
      supabase.from('stores').select('*').order('id'),
      supabase.from('ad_accounts').select('*').order('id'),
      supabase.from('campaigns').select('*').order('start_date', { ascending: false }),
      supabase.from(LATEST_PERFORMANCE_VIEW).select('*'),
      supabase.from('plans').select('*').order('name'),
      supabase.from('plan_items').select('*').order('sort_order'),
    ]);

    const failed = [storesRes, accountsRes, campaignsRes, performanceRes, plansRes, planItemsRes]
      .find((r) => r.error);
    if (failed) return { errorMessage: failed.error.message, data: null };

    return {
      errorMessage: null,
      data: {
        stores: (storesRes.data ?? []).map(rowToStore),
        adAccounts: (accountsRes.data ?? []).map(rowToAdAccount),
        campaigns: (campaignsRes.data ?? []).map(rowToCampaign),
        performanceRecords: (performanceRes.data ?? []).map(rowToPerformanceRecord),
        // 계획은 항목과 함께 한 덩어리로 만든다 — 화면이 두 배열을 조인하지
        // 않도록(조인 로직이 화면마다 갈리면 같은 계획이 다르게 보인다).
        plans: (plansRes.data ?? []).map((row) => rowToPlan(row, planItemsRes.data ?? [])),
      },
    };
  }, []);

  const applyResult = useCallback((result) => {
    if (result.errorMessage) setError(result.errorMessage);
    else {
      setError(null);
      setState(result.data);
    }
    setIsLoading(false);
  }, []);

  /** 화면에서 명시적으로 다시 읽을 때 쓴다(예: 설정 화면의 "지금 동기화" 후). */
  const refresh = useCallback(async () => {
    if (!isEnabled) return;
    setIsLoading(true);
    applyResult(await fetchAll());
  }, [isEnabled, fetchAll, applyResult]);

  useEffect(() => {
    if (!isEnabled) return undefined;

    // 언마운트된 뒤 도착한 응답으로 상태를 건드리지 않는다.
    let isCancelled = false;
    (async () => {
      const result = await fetchAll();
      if (!isCancelled) applyResult(result);
    })();

    return () => { isCancelled = true; };
  }, [isEnabled, fetchAll, applyResult]);

  /**
   * 계획을 통째로 저장한다(이름·메모 + 항목 전부). 항목은 지우고 다시 넣는다 —
   * 개별 행을 추적해 diff하는 것보다 단순하고, 계획은 한 번에 몇 줄 규모라
   * 그 단순함이 정확성보다 비싸지 않다. 항목이 통째로 바뀌는 편집(순서 변경,
   * 단계 추가/삭제)이 흔한 것도 이유다.
   *
   * plan_items에는 owner_id가 없다 — 부모 plan을 통해 RLS가 걸린다(성과 기록이
   * 캠페인을 통해 걸리는 것과 같은 패턴).
   */
  const savePlan = useCallback(async ({ id, name, notes, items }) => {
    const payload = { name: name.trim(), notes: notes?.trim() || null, updated_at: new Date().toISOString() };
    const planRes = id
      ? await supabase.from('plans').update(payload).eq('id', id).select().single()
      : await supabase.from('plans').insert(payload).select().single();

    if (planRes.error) {
      setError(planRes.error.message);
      return null;
    }
    const planId = planRes.data.id;

    // 기존 항목을 비우고 새로 넣는다. 실패하면 항목이 빈 계획이 남는데, 그건
    // 화면에 "항목 없음"으로 드러나므로 조용한 손실이 아니다.
    const { error: clearError } = await supabase.from('plan_items').delete().eq('plan_id', planId);
    if (clearError) {
      setError(clearError.message);
      return null;
    }

    let itemRows = [];
    if (items.length > 0) {
      const { data, error: insertError } = await supabase
        .from('plan_items')
        .insert(items.map((item, index) => ({
          plan_id: planId,
          label: item.label.trim(),
          platform: item.platform,
          start_date: item.startDate,
          end_date: item.endDate,
          budget_daily: Number(item.budgetDaily),
          sort_order: index,
        })))
        .select();
      if (insertError) {
        setError(insertError.message);
        return null;
      }
      itemRows = data ?? [];
    }

    const saved = rowToPlan(planRes.data, itemRows);
    setState((prev) => ({
      ...prev,
      plans: prev.plans.some((p) => p.id === saved.id)
        ? prev.plans.map((p) => (p.id === saved.id ? saved : p))
        : [...prev.plans, saved].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return saved;
  }, []);

  const deletePlan = useCallback(async (planId) => {
    // plan_items는 on delete cascade라 따로 지우지 않는다.
    const { error: deleteError } = await supabase.from('plans').delete().eq('id', planId);
    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    setState((prev) => ({ ...prev, plans: prev.plans.filter((p) => p.id !== planId) }));
    return true;
  }, []);

  const addCampaign = useCallback(async (campaign) => {
    // 호출자가 만든 id는 버린다 — generateId()는 "camp-<uuid>" 형태라 uuid 컬럼에
    // 안 들어간다. DB의 gen_random_uuid() 기본값이 채우고, 그 행을 그대로 받아 쓴다.
    const { data, error: insertError } = await supabase
      .from('campaigns')
      .insert(campaignToRow(campaign))
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }
    const saved = rowToCampaign(data);
    setState((prev) => ({ ...prev, campaigns: [saved, ...prev.campaigns] }));
    return saved;
  }, []);

  const updateCampaign = useCallback(async (campaignId, patch) => {
    const { data, error: updateError } = await supabase
      .from('campaigns')
      .update(campaignToRow(patch, true))
      .eq('id', campaignId)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }
    const saved = rowToCampaign(data);
    setState((prev) => ({
      ...prev,
      campaigns: prev.campaigns.map((c) => (c.id === campaignId ? saved : c)),
    }));
    return saved;
  }, []);

  const deleteCampaign = useCallback(async (campaignId) => {
    const { error: deleteError } = await supabase.from('campaigns').delete().eq('id', campaignId);
    if (deleteError) {
      setError(deleteError.message);
      // 다른 쓰기 함수의 null과 같은 계약 — falsy면 실패. 호출부가 이 값으로
      // 성공 스낵바/실패 스낵바를 가른다(결과 확인 없이 무조건 "deleted"를
      // 띄우면 거짓 성공이 된다).
      return false;
    }
    // performance_records는 FK가 on delete cascade라 DB가 알아서 지운다.
    // 로컬 상태에서도 같이 털어야 화면에 고아 레코드가 남지 않는다.
    setState((prev) => ({
      ...prev,
      campaigns: prev.campaigns.filter((c) => c.id !== campaignId),
      performanceRecords: prev.performanceRecords.filter((p) => p.campaignId !== campaignId),
    }));
    return true;
  }, []);

  const addStore = useCallback(async (store) => {
    const { data, error: insertError } = await supabase
      .from('stores')
      .insert(storeToRow(store))
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }
    const saved = rowToStore(data);
    setState((prev) => ({ ...prev, stores: [...prev.stores, saved] }));
    return saved;
  }, []);

  const updateStore = useCallback(async (storeId, patch) => {
    const row = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.shortCode !== undefined) row.short_code = patch.shortCode ?? null;
    if (patch.region !== undefined) row.region = patch.region;
    if (patch.status !== undefined) row.status = patch.status;

    const { data, error: updateError } = await supabase
      .from('stores')
      .update(row)
      .eq('id', storeId)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }
    const saved = rowToStore(data);
    setState((prev) => ({
      ...prev,
      stores: prev.stores.map((s) => (s.id === storeId ? saved : s)),
    }));
    return saved;
  }, []);

  const upsertPerformanceRecord = useCallback(async (record) => {
    // onConflict는 00000000000002 마이그레이션의 unique(campaign_id, recorded_at, source).
    // source='manual'로 고정돼 있어 같은 날 API가 넣은 행과 충돌하지 않는다.
    const { data, error: upsertError } = await supabase
      .from('performance_records')
      .upsert(performanceRecordToRow(record, todayISODate()), {
        onConflict: 'campaign_id,recorded_at,source',
      })
      .select()
      .single();

    if (upsertError) {
      setError(upsertError.message);
      return null;
    }
    const saved = rowToPerformanceRecord(data);
    setState((prev) => {
      const exists = prev.performanceRecords.some((p) => p.campaignId === saved.campaignId);
      return {
        ...prev,
        performanceRecords: exists
          ? prev.performanceRecords.map((p) => (p.campaignId === saved.campaignId ? saved : p))
          : [...prev.performanceRecords, saved],
      };
    });
    return saved;
  }, []);

  /**
   * 이 스토어의 "오늘" — 화면(status/알림/pacing/Now 뷰)이 전부 이 값을 쓴다.
   * 알림과 status가 서로 다른 "오늘"을 쓰면 D-3/D-5 어긋남 버그가 재발하므로
   * 기준일의 단일 출처는 스토어다. 마운트 시점에 고정(useMemo []) — 렌더마다
   * 새 Date 객체를 만들면 이 값을 deps로 갖는 useMemo가 전부 무효화된다.
   * 자정을 넘긴 장수 세션은 새로고침 전까지 어제 기준으로 남는데, 일일 동기화
   * 도구 특성상 하루 한 번은 새로 열게 되므로 감수한다.
   */
  const today = useMemo(() => startOfToday(), []);

  // adAccounts까지 넘긴다 — 계정 단위 알림(청구 문턱)이 여기서 나온다.
  const alerts = generateAlerts(state.campaigns, state.performanceRecords, today, state.adAccounts);

  return {
    stores: state.stores,
    campaigns: state.campaigns,
    plans: state.plans,
    performanceRecords: state.performanceRecords,
    adAccounts: state.adAccounts,
    alerts,
    today,
    isLoading,
    error,
    refresh,
    savePlan,
    deletePlan,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    addStore,
    updateStore,
    upsertPerformanceRecord,
  };
}
