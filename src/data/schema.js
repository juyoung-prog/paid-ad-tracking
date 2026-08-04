/**
 * Paid Ads Tracking Dashboard — Data Schema
 *
 * 타입 정의(JSDoc) + enum 상수 + 순수 계산 함수만 포함한다.
 * 실제 샘플/목 데이터는 이 파일에 두지 않고 별도 파일(paidAdsMockData.js)에 둔다.
 * React import 금지 — 이 파일은 데이터 레이어이며 컴포넌트 레이어와 분리된다.
 *
 * 근거 문서: docs/paid-ads-dashboard/ux-flow/02-ux-flow.md (데이터 모델)
 */

// ============================================================
// 1. Enum 상수
// ============================================================

export const PLATFORM = Object.freeze({
  META: 'meta',
  TIKTOK: 'tiktok',
});

export const REGION = Object.freeze({
  GA: 'GA',
  FL: 'FL',
  ALL: 'ALL',
});

export const STORE_STATUS = Object.freeze({
  ACTIVE: 'active',
  PLANNED: 'planned',
  CLOSED: 'closed',
});

export const TARGET_SCOPE = Object.freeze({
  SINGLE_STORE: 'single_store',
  MULTI_STORE: 'multi_store',
  ALL_STORES: 'all_stores',
});

export const GOAL = Object.freeze({
  AWARENESS: 'awareness',
  TRAFFIC: 'traffic',
  ENGAGEMENT: 'engagement',
  CONVERSION: 'conversion',
  STORE_VISIT: 'store_visit',
});

// 캠페인 상태 — 저장 필드 아님, getComputedStatus()로만 도출
export const CAMPAIGN_STATUS = Object.freeze({
  PLANNED: 'planned',
  ACTIVE: 'active',
  ENDED: 'ended',
});

// manualStatus — status SSOT 규칙의 유일한 수동 override
export const MANUAL_STATUS = Object.freeze({
  ENDED_EARLY: 'ended_early',
  ARCHIVED: 'archived',
});

export const ALERT_TYPE = Object.freeze({
  ENDING_SOON: 'ending_soon',
  BUDGET_PACING: 'budget_pacing',
  OVERLAP_TARGET: 'overlap_target',
  NEW_STORE_REMINDER: 'new_store_reminder',
});

// ============================================================
// 2. 타입 정의 (JSDoc @typedef)
// ============================================================

/**
 * @typedef {Object} Store
 * @property {string} id - 매장 코드 PK. 조지아 "G"+2자리, 플로리다 "BF"+1자리 (예: "G01", "BF1")
 * @property {string} name - 매장명
 * @property {string} [shortCode] - 매장 약어 코드(예: "BC", "BMC") — 사내 다른 시스템에서 쓰는 참조 코드. 조지아 매장에만 있고 플로리다·신규(예정) 매장엔 없을 수 있어 optional
 * @property {'GA'|'FL'} region
 * @property {'active'|'planned'|'closed'} status
 * @property {string} createdAt - ISO 8601 datetime
 */

/**
 * @typedef {Object} AdAccount
 * @property {string} id - 플랫폼+지역 슬러그 PK (예: "meta-ga", "tiktok-unified")
 * @property {'meta'|'tiktok'} platform
 * @property {'GA'|'FL'|'ALL'} region - 계정이 커버하는 지역 (틱톡은 ALL)
 * @property {string} label - UI 표시명
 */

/**
 * @typedef {Object} Campaign
 * @property {string} id - UUID v4 PK
 * @property {string} name - 캠페인명 (1~100자). 각 캠페인을 구분하는 실제 이름(예: "BF4 Grand Opening — Coming Soon")
 * @property {string|null} campaignGroup - 여러 캠페인을 하나의 마케팅 이니셔티브로 묶는 태그(예: "BF4 Grand Opening"). campaignGroupKey()가 그룹핑의 단일 기준 — 없으면 name을 그대로 그룹 키로 쓴다(캠페인 1개=플랫폼 1개라 "메타+틱톡 동시 진행"처럼 이름만 똑같이 지어도 되는 단순한 2-way 케이스는 이 필드 없이도 계속 동작). 단, 같은 이름인데 서로 다른 phase/역할이라 리스트에서 구분돼야 하는 경우(예: 그랜드 오프닝의 Coming Soon/Now Open/Grand Opening/1 Month Deals 4단계)는 name을 phase별로 다르게 짓고 이 필드로 묶는다 — 한때 groupName을 뒀다가 "이름 통일"로 완전히 대체된다며 없앴는데, 그건 형제 캠페인이 플랫폼 칩만으로도 구분되는 케이스에서만 맞는 얘기였고, 구분해줄 다른 필드가 없는 경우(같은 플랫폼·같은 매장, phase만 다름)엔 다시 필요해서 되살림
 * @property {'meta'|'tiktok'} platform
 * @property {string} accountId - FK → AdAccount.id
 * @property {'single_store'|'multi_store'|'all_stores'} targetScope
 * @property {string[]} targetStoreIds - Store.id 배열, all_stores면 빈 배열
 * @property {string} startDate - ISO 8601 date (YYYY-MM-DD)
 * @property {string} endDate - ISO 8601 date, startDate 이후
 * @property {number} budgetPlanned - 계획 예산(총액), USD 소수점 2자리
 * @property {number|null} budgetDaily - 일일 예산, USD 소수점 2자리. 있으면 calcBudgetPacing()의 pacing 신호가 경과일/전체기간 비율 대신 "일평균 소진액 vs 이 값"으로 바뀐다(더 직접적인 신호이므로 우선)
 * @property {'awareness'|'traffic'|'engagement'|'conversion'|'store_visit'} goal
 * @property {'ended_early'|'archived'|null} manualStatus - 유일한 수동 override. status SSOT 규칙 참고
 * @property {string|null} creativeUrl - URL, Ads Manager 소재/캠페인 링크 또는 실제 영상/게시물 링크. "View Ad" 외부 링크로만 쓰임(사람이 타이핑)
 * @property {string|null} thumbnailUrl - 이미지(업로드 전용, data URI 또는 정적 파일 경로). CampaignThumbnail 미리보기로만 쓰임(없으면 플랫폼색 이니셜 대체) — creativeUrl과는 별개 값
 * @property {string|null} notes
 * @property {string} createdAt - ISO 8601 datetime
 * @property {string} updatedAt - ISO 8601 datetime
 */

/**
 * @typedef {Object} PerformanceRecord
 * @property {string} id - UUID v4 PK
 * @property {string} campaignId - FK → Campaign.id
 * @property {number|null} impressions - Tier 1 · 공통 필수
 * @property {number|null} reach - Tier 1 · 공통 필수
 * @property {number|null} clicks - Tier 1 · 공통 필수 (링크 클릭수)
 * @property {number} spend - Tier 1 · 공통 필수, USD 소수점 2자리
 * @property {number|null} videoPlays - Tier 2 · 영상 지표 (전체 재생수, 시청 조건 없음)
 * @property {number|null} hookViews - Tier 2 · 영상 지표 (3초/2초 조회수)
 * @property {number|null} heldViews - Tier 2 · 영상 지표 (완전시청수). Meta video_p100_watched_actions / TikTok video_views_p100
 * @property {number|null} avgWatchSeconds - Tier 2 · 영상 지표 (평균 재생 시간, 초)
 * @property {number|null} likes - Tier 3 · 상호작용 구성 요소
 * @property {number|null} comments - Tier 3 · 상호작용 구성 요소
 * @property {number|null} shares - Tier 3 · 상호작용 구성 요소
 * @property {number|null} engagements - Tier 3 · goal=engagement일 때만. likes+comments+shares 합(Meta는 post_engagement)
 * @property {number|null} follows - Tier 3 · 팔로우 획득. TikTok 전용(Meta 캠페인 레벨에 대응 지표 없음)
 * @property {number|null} profileVisits - Tier 3 · 프로필 방문. TikTok 전용
 * @property {number|null} conversions - Tier 4 · goal=conversion|store_visit일 때만
 */

/**
 * @typedef {Object} Alert
 * @property {string} id - UUID v4 PK
 * @property {string} campaignId - FK → Campaign.id
 * @property {'ending_soon'|'budget_pacing'|'overlap_target'|'new_store_reminder'} type
 * @property {string} triggeredAt - ISO 8601 datetime
 * @property {string|null} resolvedAt - ISO 8601 datetime, null이면 활성
 * @property {string} message - 표시 문구
 */

// ============================================================
// 3. 파생/계산 함수 (순수 함수, 부작용 없음)
// ============================================================

/**
 * 캠페인의 계산 상태를 날짜 기준으로 도출한다. 저장하지 않는 파생값이다.
 *
 * @param {Campaign} campaign
 * @param {Date} [today] - 기준 시각 [Optional, 기본값: new Date()]
 * @returns {'planned'|'active'|'ended'}
 */
export function getComputedStatus(campaign, today = new Date()) {
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  if (today < start) return CAMPAIGN_STATUS.PLANNED;
  if (today > end) return CAMPAIGN_STATUS.ENDED;
  return CAMPAIGN_STATUS.ACTIVE;
}

/**
 * status SSOT 규칙: effectiveStatus = manualStatus ?? computedStatus(...)
 * manualStatus가 있으면 무조건 우선한다 (날짜와 모순되는 수동 상태는 만들 수 없음).
 *
 * @param {Campaign} campaign
 * @param {Date} [today] - 기준 시각 [Optional, 기본값: new Date()]
 * @returns {'planned'|'active'|'ended'|'ended_early'|'archived'}
 */
export function getEffectiveStatus(campaign, today = new Date()) {
  return campaign.manualStatus ?? getComputedStatus(campaign, today);
}

/**
 * CPM(1000회 노출당 비용)을 계산한다.
 * @param {number} spend
 * @param {number|null} impressions
 * @returns {number|null} impressions가 없거나 0이면 null
 */
export function calcCPM(spend, impressions) {
  if (!impressions) return null;
  return (spend / impressions) * 1000;
}

/**
 * CTR(클릭률)을 계산한다.
 * @param {number|null} clicks
 * @param {number|null} impressions
 * @returns {number|null}
 */
export function calcCTR(clicks, impressions) {
  if (!impressions || clicks == null) return null;
  return clicks / impressions;
}

/**
 * CPC(클릭당 비용)를 계산한다.
 * @param {number} spend
 * @param {number|null} clicks
 * @returns {number|null}
 */
export function calcCPC(spend, clicks) {
  if (!clicks) return null;
  return spend / clicks;
}

/**
 * Hook Rate(3초/2초 조회 비율)를 계산한다.
 * @param {number|null} hookViews
 * @param {number|null} impressions
 * @returns {number|null}
 */
export function calcHookRate(hookViews, impressions) {
  if (!impressions || hookViews == null) return null;
  return hookViews / impressions;
}

/**
 * Hold Rate(훅 이후 완전시청 비율)를 계산한다.
 * @param {number|null} heldViews
 * @param {number|null} hookViews
 * @returns {number|null}
 */
export function calcHoldRate(heldViews, hookViews) {
  if (!hookViews || heldViews == null) return null;
  return heldViews / hookViews;
}

/**
 * Engagement Rate를 계산한다. (goal=engagement일 때만 의미 있음)
 * @param {number|null} engagements
 * @param {number|null} impressions
 * @returns {number|null}
 */
export function calcEngagementRate(engagements, impressions) {
  if (!impressions || engagements == null) return null;
  return engagements / impressions;
}

/**
 * CPA(결과당 비용)를 계산한다. (goal=conversion|store_visit일 때만 의미 있음)
 * @param {number} spend
 * @param {number|null} conversions
 * @returns {number|null}
 */
export function calcCPA(spend, conversions) {
  if (!conversions) return null;
  return spend / conversions;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * budgetDaily × 캠페인 기간(시작·종료일 포함 일수)으로 Planned Budget을 자동
 * 계산한다. CampaignForm(입력 중 실시간 계산·표시)과 DashboardPage(Drawer를 열
 * 때 저장된 스냅샷을 미리 이 값으로 정규화)가 반드시 같은 공식을 공유해야 한다
 * — 두 곳이 각자 계산하면, budgetDaily는 있지만 budgetPlanned가 이 공식과
 * 어긋나는 캠페인(예: 기능 도입 전에 수동으로 입력해둔 값)을 열었을 때
 * CampaignForm이 mount 시점에 자기 계산값으로 조용히 덮어써서, 사용자가
 * 아무것도 안 건드렸는데도 "미저장 변경" 취급되는 버그가 생긴다. DashboardPage가
 * Drawer를 열 때 이 함수로 스냅샷 자체를 먼저 정규화해두면 CampaignForm의
 * 계산값과 항상 일치해서 그런 오탐이 없어진다.
 *
 * @param {number|null} budgetDaily
 * @param {string} startDate - ISO 8601 date
 * @param {string} endDate - ISO 8601 date
 * @returns {{ amount: number, days: number }|null} 계산 불가하면(budgetDaily 없음/날짜 없음/역순) null
 */
export function calcAutoBudgetPlanned(budgetDaily, startDate, endDate) {
  if (!(budgetDaily > 0) || !startDate || !endDate) return null;
  const days = Math.round((new Date(endDate) - new Date(startDate)) / DAY_MS) + 1;
  if (days <= 0) return null;
  return { amount: Math.round(budgetDaily * days * 100) / 100, days };
}

/**
 * 예산 소진 속도(pacing)를 계산한다. budget_pacing 알림/PacingIndicator가 사용한다.
 * 컴포넌트가 날짜를 직접 비교하지 않도록 비율만 반환하고, 시각화 판단(임계값 비교 등)은
 * 컴포넌트 쪽 표시 로직에 맡긴다.
 *
 * budgetDaily가 있으면(사람이 직접 선언한 일일 예산) avgDailySpend/dailyBudgetRatio도
 * 함께 계산한다 — "경과일/전체기간 비율" 방식보다 "오늘까지 일평균 소진액이 선언한
 * 일일 예산을 넘는지"가 더 직접적이고 실제 광고 플랫폼들이 쓰는 방식과 같은 신호라,
 * budgetDaily가 있는 캠페인은 generateAlerts()에서 이 신호를 우선 사용한다.
 *
 * @param {Campaign} campaign
 * @param {number} spend - 현재까지 실집행 예산
 * @param {Date} [today] - 기준 시각 [Optional, 기본값: new Date()]
 * @returns {{ timeElapsedRatio: number|null, budgetUsedRatio: number|null, avgDailySpend: number|null, dailyBudgetRatio: number|null }}
 */
export function calcBudgetPacing(campaign, spend, today = new Date()) {
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);
  const totalMs = end - start;

  if (!(totalMs > 0)) {
    return { timeElapsedRatio: null, budgetUsedRatio: null, avgDailySpend: null, dailyBudgetRatio: null };
  }

  const elapsedMs = Math.min(Math.max(today - start, 0), totalMs);
  // 캠페인 시작 당일에는 elapsedMs가 0에 가까워 avgDailySpend가 무한대로
  // 튀는 걸 막기 위해 최소 1일로 바닥을 둔다.
  const elapsedDays = Math.max(elapsedMs / DAY_MS, 1);
  const avgDailySpend = spend != null ? spend / elapsedDays : null;

  return {
    timeElapsedRatio: elapsedMs / totalMs,
    budgetUsedRatio: campaign.budgetPlanned ? spend / campaign.budgetPlanned : null,
    avgDailySpend,
    dailyBudgetRatio: campaign.budgetDaily && avgDailySpend != null ? avgDailySpend / campaign.budgetDaily : null,
  };
}

/**
 * 두 날짜 범위가 겹치는지 확인한다.
 * @param {string} startA - ISO 8601 date
 * @param {string} endA
 * @param {string} startB
 * @param {string} endB
 * @returns {boolean}
 */
function dateRangesOverlap(startA, endA, startB, endB) {
  return new Date(startA) <= new Date(endB) && new Date(startB) <= new Date(endA);
}

/**
 * 매장별로 어떤 캠페인이 걸려 있는지 묶어준다 (StoreBreakdown이 사용).
 * 매장 귀속 규칙을 그대로 반영한다: all_stores 캠페인은 예산을 분배하지 않고
 * 모든 매장에 "걸려 있는 캠페인"으로만 나열한다.
 *
 * @param {Store[]} stores
 * @param {Campaign[]} campaigns
 * @returns {Array<{ storeId: string, storeName: string, campaigns: Campaign[] }>}
 */
export function getStoreBreakdown(stores, campaigns) {
  return stores.map((store) => ({
    storeId: store.id,
    storeName: store.name,
    campaigns: campaigns.filter(
      (c) => c.targetScope === TARGET_SCOPE.ALL_STORES || c.targetStoreIds.includes(store.id)
    ),
  }));
}

/**
 * 캠페인을 하나의 마케팅 이니셔티브로 묶는 그룹 키. campaignGroup이 있으면 그걸,
 * 없으면 name을 그대로 쓴다 — CampaignTable의 형제 판단, FilterBar의 Campaign
 * Group 드롭다운, DashboardPage의 그룹 합계, overlap_target 억제까지 전부 이
 * 함수 하나로 통일한다(각자 다르게 계산하면 어느 한 곳만 고쳤을 때 어긋난다).
 *
 * @param {Campaign} campaign
 * @returns {string}
 */
export function campaignGroupKey(campaign) {
  return campaign.campaignGroup || campaign.name;
}

/**
 * 두 캠페인의 타겟 매장이 교집합을 가지는지 확인한다.
 * all_stores는 다른 모든 타겟과 교집합이 있는 것으로 간주한다.
 * @param {Campaign} campaignA
 * @param {Campaign} campaignB
 * @returns {boolean}
 */
function targetStoresIntersect(campaignA, campaignB) {
  if (campaignA.targetScope === TARGET_SCOPE.ALL_STORES) return true;
  if (campaignB.targetScope === TARGET_SCOPE.ALL_STORES) return true;
  return campaignA.targetStoreIds.some((id) => campaignB.targetStoreIds.includes(id));
}

/**
 * overlap_target 알림 트리거 조건 (알림 피로 방지).
 * 같은 platform + 타겟 매장 교집합 존재 + 같은 goal + 기간 겹침, 4개 조건이
 * 전부 참일 때만 true. 플랫폼/goal이 다르면 의도된 멀티채널·퍼널 전략으로 간주해 제외한다.
 * 같은 campaignGroupKey(같은 그룹/이름)인 캠페인끼리도 제외한다 — 그룹으로
 * 묶었다는 것 자체가 "이 캠페인들은 의도적으로 같은 매장·기간을 공유하는
 * 하나의 이니셔티브"라는 선언이라(예: 그랜드 오프닝의 Now Open과 Grand
 * Opening 단계는 겹치는 게 정상), 이걸 실수로 겹친 것처럼 경고하면 진짜
 * 실수(다른 이니셔티브끼리 우연히 겹침)를 잡아야 할 때도 무시하게 되는
 * 알림 피로가 생긴다(실사용 시나리오 검토로 발견).
 *
 * @param {Campaign} campaignA
 * @param {Campaign} campaignB
 * @returns {boolean}
 */
export function shouldTriggerOverlapAlert(campaignA, campaignB) {
  if (campaignA.id === campaignB.id) return false;
  if (campaignA.platform !== campaignB.platform) return false;
  if (campaignA.goal !== campaignB.goal) return false;
  if (campaignGroupKey(campaignA) === campaignGroupKey(campaignB)) return false;
  if (!targetStoresIntersect(campaignA, campaignB)) return false;
  return dateRangesOverlap(
    campaignA.startDate,
    campaignA.endDate,
    campaignB.startDate,
    campaignB.endDate
  );
}

// 알림 트리거 임계값 — PacingIndicator 등 컴포넌트의 표시 로직과 값을 공유한다
// (같은 규칙을 두 곳에서 다른 숫자로 중복 정의하지 않기 위함).
export const ENDING_SOON_THRESHOLD_DAYS = 3;
export const BUDGET_PACING_THRESHOLD = 0.15;

// 알림 유형별 색상(error/warning) — AlertBanner·CampaignTable의 alertBadges가
// 전부 이 하나만 참조한다(예전엔 파일마다 따로 하드코딩해서 하나만 고치면
// 다른 화면과 어긋나는 문제가 있었다). budget_pacing을 error로 올린 이유:
// 지금 활성 캠페인이 실시간으로 예산을 초과 집행 중이라 다른 warning급
// 알림보다 실무 관점에서 더 급하다 — 지금 이 순간에도 돈이 계속 나가고 있다.
export const ALERT_SEVERITY = {
  [ALERT_TYPE.BUDGET_PACING]: 'error',
  [ALERT_TYPE.ENDING_SOON]: 'warning',
  [ALERT_TYPE.OVERLAP_TARGET]: 'warning',
};

// generateAlerts()가 반환 직전에 이 순위로 정렬해서, 알림을 쓰는 모든 화면
// (배너/벨 팝오버/카드)이 캠페인 배열 순서가 아니라 심각도 순으로 일관되게
// 본다 — ALERT_SEVERITY와 같은 이유로 budget_pacing이 먼저 온다(실시간
// 손실이 다른 warning급 알림보다 급함).
const ALERT_SEVERITY_RANK = {
  [ALERT_TYPE.BUDGET_PACING]: 0,
  [ALERT_TYPE.ENDING_SOON]: 1,
  [ALERT_TYPE.OVERLAP_TARGET]: 2,
};

/**
 * 캠페인·성과 데이터를 기준으로 알림을 매번 다시 계산한다. Alert를 저장된
 * 상태로 취급하지 않는다 — 캠페인이 바뀌면 알림도 함께 바뀌어야 하므로
 * 항상 파생값으로 다룬다 (persist하지 않음).
 *
 * 반환 직전에 ALERT_SEVERITY_RANK로 정렬한다 — 캠페인 배열 순서가 아니라
 * 심각도 순(budget_pacing > ending_soon > overlap_target)으로 반환하므로,
 * 이 값을 쓰는 모든 화면(배너/벨 팝오버/카드)이 별도 정렬 없이도 일관된
 * 우선순위로 보인다.
 *
 * @param {Campaign[]} campaigns
 * @param {PerformanceRecord[]} performanceRecords
 * @param {Date} [today] - 기준 시각 [Optional, 기본값: new Date()]
 * @returns {Alert[]}
 */
export function generateAlerts(campaigns, performanceRecords, today = new Date()) {
  const alerts = [];

  campaigns.forEach((campaign) => {
    const status = getEffectiveStatus(campaign, today);
    const record = performanceRecords.find((p) => p.campaignId === campaign.id);

    if (status === CAMPAIGN_STATUS.ACTIVE) {
      const daysUntilEnd = Math.ceil((new Date(campaign.endDate) - today) / (1000 * 60 * 60 * 24));
      if (daysUntilEnd >= 0 && daysUntilEnd <= ENDING_SOON_THRESHOLD_DAYS) {
        alerts.push({
          id: `alert-ending-${campaign.id}`,
          campaignId: campaign.id,
          type: ALERT_TYPE.ENDING_SOON,
          triggeredAt: today.toISOString(),
          resolvedAt: null,
          // 사실만 알려주고 끝나면 "그래서 뭘 해야 하지"가 안 남는다 — 지금
          // 해야 할 구체적 액션(성과 입력 확인)을 메시지에 직접 붙인다.
          message: `D-${daysUntilEnd} — ${campaign.name} ends soon — confirm performance data is entered before it closes`,
        });
      }

      if (record) {
        const { timeElapsedRatio, budgetUsedRatio, avgDailySpend, dailyBudgetRatio } = calcBudgetPacing(campaign, record.spend, today);
        // budgetDaily를 선언한 캠페인은 그 신호가 더 직접적이므로 우선 쓰고,
        // 없는 캠페인만 기존 경과일/전체기간 비율 방식으로 대체한다 — 같은
        // 캠페인에 두 알림이 동시에 뜨는 걸 피하기 위해 둘 중 하나만 검사한다.
        if (dailyBudgetRatio != null) {
          if (dailyBudgetRatio - 1 > BUDGET_PACING_THRESHOLD) {
            alerts.push({
              id: `alert-pacing-${campaign.id}`,
              campaignId: campaign.id,
              type: ALERT_TYPE.BUDGET_PACING,
              triggeredAt: today.toISOString(),
              resolvedAt: null,
              message: `${campaign.name} — averaging $${Math.round(avgDailySpend)}/day, over the $${campaign.budgetDaily.toLocaleString('en-US')}/day budget`,
            });
          }
        } else if (
          timeElapsedRatio != null &&
          budgetUsedRatio != null &&
          budgetUsedRatio - timeElapsedRatio > BUDGET_PACING_THRESHOLD
        ) {
          alerts.push({
            id: `alert-pacing-${campaign.id}`,
            campaignId: campaign.id,
            type: ALERT_TYPE.BUDGET_PACING,
            triggeredAt: today.toISOString(),
            resolvedAt: null,
            message: `${campaign.name} — budget is pacing ahead of schedule (${Math.round(budgetUsedRatio * 100)}% spent / ${Math.round(timeElapsedRatio * 100)}% elapsed)`,
          });
        }
      }
    }
  });

  for (let i = 0; i < campaigns.length; i++) {
    for (let j = i + 1; j < campaigns.length; j++) {
      if (shouldTriggerOverlapAlert(campaigns[i], campaigns[j])) {
        alerts.push({
          // id가 campaigns[j].id에만 의존하면, 한 캠페인이 2개 이상의 다른
          // 캠페인과 동시에 겹칠 때 alert.id가 중복된다 — key={alert.id}로
          // 렌더링하는 화면(AlertBanner 등)에서 그중 하나가 조용히 사라진다.
          // 쌍(i, j) 전체를 id에 반영해서 항상 고유하게 만든다.
          id: `alert-overlap-${campaigns[i].id}-${campaigns[j].id}`,
          campaignId: campaigns[j].id,
          type: ALERT_TYPE.OVERLAP_TARGET,
          triggeredAt: today.toISOString(),
          resolvedAt: null,
          message: `${campaigns[j].name} — overlaps with ${campaigns[i].name} (same store and goal, overlapping dates)`,
        });
      }
    }
  }

  alerts.sort((a, b) => (ALERT_SEVERITY_RANK[a.type] ?? 99) - (ALERT_SEVERITY_RANK[b.type] ?? 99));

  return alerts;
}

/**
 * 보고서 요약 통계를 계산한다 (ReportSummarySection/CampaignSummaryGrid가 사용).
 * 성과 레코드가 없는 캠페인은 spend/CPM/CTR 평균 계산에서 제외한다.
 *
 * @param {Campaign[]} campaigns
 * @param {PerformanceRecord[]} performanceRecords
 * @returns {{ totalCampaigns: number, totalBudgetPlanned: number, totalSpend: number, avgCPM: number|null, avgCTR: number|null }}
 */
export function getReportSummary(campaigns, performanceRecords) {
  const totalBudgetPlanned = campaigns.reduce((sum, c) => sum + c.budgetPlanned, 0);

  const recordsWithSpend = performanceRecords.filter((r) => r.spend != null);
  const totalSpend = recordsWithSpend.reduce((sum, r) => sum + r.spend, 0);

  const cpms = recordsWithSpend
    .map((r) => calcCPM(r.spend, r.impressions))
    .filter((v) => v != null);
  const avgCPM = cpms.length ? cpms.reduce((sum, v) => sum + v, 0) / cpms.length : null;

  const ctrs = performanceRecords
    .map((r) => calcCTR(r.clicks, r.impressions))
    .filter((v) => v != null);
  const avgCTR = ctrs.length ? ctrs.reduce((sum, v) => sum + v, 0) / ctrs.length : null;

  return {
    totalCampaigns: campaigns.length,
    totalBudgetPlanned,
    totalSpend,
    avgCPM,
    avgCTR,
  };
}

/**
 * 캠페인 1개 + 성과 레코드를 테이블 한 행에 표시할 형태로 합친다
 * (raw 필드 + 계산 필드를 한 번에 제공). PerformanceReportTable이 사용한다.
 *
 * @param {Campaign} campaign
 * @param {PerformanceRecord} [record]
 * @returns {{ campaignId: string, name: string, platform: string, spend: number|null, impressions: number|null, clicks: number|null, cpm: number|null, ctr: number|null, cpc: number|null, videoPlays: number|null, heldViews: number|null, avgWatchSeconds: number|null, likes: number|null, comments: number|null, shares: number|null, follows: number|null, profileVisits: number|null }}
 */
export function getCampaignMetricsRow(campaign, record) {
  const spend = record?.spend ?? null;
  const impressions = record?.impressions ?? null;
  const clicks = record?.clicks ?? null;

  return {
    campaignId: campaign.id,
    name: campaign.name,
    platform: campaign.platform,
    spend,
    impressions,
    clicks,
    cpm: spend != null ? calcCPM(spend, impressions) : null,
    ctr: calcCTR(clicks, impressions),
    cpc: spend != null ? calcCPC(spend, clicks) : null,
    // 아래는 계산하지 않고 그대로 전달한다 — 플랫폼이 준 원본 값이다.
    // 수기 입력 레코드에는 없을 수 있어 전부 null 허용이고, 표는 "—"로 그린다.
    videoPlays: record?.videoPlays ?? null,
    // hookViews는 표에 직접 안 쓰지만 여러 캠페인을 하나로 합칠 때 필요하다 —
    // 비율끼리 평균 내면 틀린다. 분자와 분모를 각각 합쳐서 다시 나눠야 한다.
    hookViews: record?.hookViews ?? null,
    heldViews: record?.heldViews ?? null,
    avgWatchSeconds: record?.avgWatchSeconds ?? null,
    likes: record?.likes ?? null,
    comments: record?.comments ?? null,
    shares: record?.shares ?? null,
    follows: record?.follows ?? null,
    profileVisits: record?.profileVisits ?? null,
    hookRate: calcHookRate(record?.hookViews ?? null, impressions),
    holdRate: calcHoldRate(record?.heldViews ?? null, record?.hookViews ?? null),
  };
}

/**
 * 캠페인 1개 + 성과 레코드를 goal 기준으로 의미 있는 지표만 골라 테이블 한
 * 행으로 합친다. getCampaignMetricsRow와 달리 goal과 무관한 고정 컬럼(CPM/
 * CTR/CPC 전부)이 아니라, 이 캠페인의 goal에서 실제로 의미 있는 계산값만
 * 채운다(나머지는 null) — "Performance Report" 탭이 goal별로 캠페인을 묶어
 * 서로 다른 컬럼 구성의 표로 보여줄 때 이 값을 그대로 쓴다.
 * @param {Campaign} campaign
 * @param {PerformanceRecord} [record]
 * @returns {{ campaignId: string, name: string, platform: string, goal: string, spend: number|null, impressions: number|null, reach: number|null, clicks: number|null, engagements: number|null, conversions: number|null, cpm: number|null, ctr: number|null, cpc: number|null, engagementRate: number|null, cpa: number|null, videoPlays: number|null, heldViews: number|null, avgWatchSeconds: number|null, likes: number|null, comments: number|null, shares: number|null, follows: number|null, profileVisits: number|null }}
 */
export function getGoalMetricsRow(campaign, record) {
  const spend = record?.spend ?? null;
  const impressions = record?.impressions ?? null;
  const reach = record?.reach ?? null;
  const clicks = record?.clicks ?? null;
  const engagements = record?.engagements ?? null;
  const conversions = record?.conversions ?? null;

  return {
    campaignId: campaign.id,
    name: campaign.name,
    platform: campaign.platform,
    goal: campaign.goal,
    spend,
    impressions,
    reach,
    clicks,
    engagements,
    conversions,
    cpm: spend != null ? calcCPM(spend, impressions) : null,
    ctr: calcCTR(clicks, impressions),
    cpc: spend != null ? calcCPC(spend, clicks) : null,
    engagementRate: calcEngagementRate(engagements, impressions),
    cpa: spend != null ? calcCPA(spend, conversions) : null,
    // 아래는 goal과 무관하게 "소재가 어땠는가"를 말하는 값이라 goal별로 고르지 않고
    // 전부 그대로 전달한다. 어떤 목적의 캠페인이든 영상이 붙으면 의미가 있다.
    videoPlays: record?.videoPlays ?? null,
    // hookViews는 표에 직접 안 쓰지만 여러 캠페인을 하나로 합칠 때 필요하다 —
    // 비율끼리 평균 내면 틀린다. 분자와 분모를 각각 합쳐서 다시 나눠야 한다.
    hookViews: record?.hookViews ?? null,
    heldViews: record?.heldViews ?? null,
    avgWatchSeconds: record?.avgWatchSeconds ?? null,
    likes: record?.likes ?? null,
    comments: record?.comments ?? null,
    shares: record?.shares ?? null,
    follows: record?.follows ?? null,
    profileVisits: record?.profileVisits ?? null,
    hookRate: calcHookRate(record?.hookViews ?? null, impressions),
    holdRate: calcHoldRate(record?.heldViews ?? null, record?.hookViews ?? null),
  };
}
