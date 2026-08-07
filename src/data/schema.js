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
  // 한 번 삭제됐던 유형의 재도입 — 예전엔 PerformanceForm의 reportedAt 필드를
  // 트리거 근거로 썼는데 그 필드가 사라지면서 알림도 같이 지웠다. 하지만
  // 트리거에 reportedAt이 필요 없다: "종료됐는데 성과 레코드 자체가 없다"가
  // 곧 미보고다. 이 앱의 존재 이유(종료 후 성과 기록 → 보고)를 리마인드하는
  // 유일한 장치라 성과 레코드 부재 기준으로 되살린다.
  MISSING_PERFORMANCE: 'missing_performance',
  NO_RESULTS: 'no_results',
  INVOICE_DUE: 'invoice_due',
  BALANCE_LOW: 'balance_low',
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
/**
 * 날짜 문자열을 **로컬 자정**으로 정규화한다.
 *
 * 'YYYY-MM-DD'를 new Date()에 그대로 넣으면 UTC 자정으로 파싱되는데, 이 앱의
 * today는 로컬 자정(startOfToday)이다. 둘을 그대로 빼면 UTC+ 지역(예: KST)에서
 * 하루가 밀린다 — 어제 끝난 캠페인에 "ended today"가 붙고, 30일 창이 31일이
 * 되며, 종료 당일에는 알림이 아예 안 뜬다. 이 저장소는 toLocalISODate에서
 * 이미 같은 종류의 버그를 한 번 고친 적이 있다.
 *
 * ISO datetime(updatedAt 등)도 같은 규칙으로 그 날의 0시로 내린다 — "며칠 전"을
 * 셀 때 시:분은 의미가 없고, 남겨두면 오늘 벌어진 일이 -1일로 계산된다.
 *
 * @param {string} value - 'YYYY-MM-DD' 또는 ISO datetime
 * @returns {Date}
 */
export function toLocalDayStart(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/** 두 날짜의 일수 차이(오늘 기준 과거면 양수). 둘 다 로컬 자정으로 맞춘 뒤 센다. */
export function daysSince(value, today) {
  return Math.round((toLocalDayStart(today) - toLocalDayStart(value)) / 86400000);
}

/**
 * 캠페인이 실제로 끝난 날. 조기 종료는 그 시점을 따로 저장하지 않아서 updatedAt을
 * 근사치로 쓰는데, updatedAt은 **모든 수정에서 갱신**된다(campaignToRow). 그대로
 * 쓰면 1년 전 조기 종료한 캠페인의 Event 태그만 채워 저장해도 "오늘 끝난 것"이
 * 되어 미보고 알림이 부활하고 Recently Ended 목록에 다시 뜬다. 계획 종료일로
 * 상한을 걸어, 계획 종료일이 이미 지난 캠페인은 편집해도 시계가 리셋되지 않게 한다.
 *
 * @param {Campaign} campaign
 * @returns {string} 종료 기준일
 */
export function effectiveEndDate(campaign) {
  if (campaign.manualStatus !== MANUAL_STATUS.ENDED_EARLY || !campaign.updatedAt) return campaign.endDate;
  return toLocalDayStart(campaign.updatedAt) < toLocalDayStart(campaign.endDate)
    ? campaign.updatedAt
    : campaign.endDate;
}

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
/**
 * 이 캠페인의 계획 예산. 저장된 값이 없으면 일일 예산 × 기간으로 계산한다.
 *
 * **"모르는 값"과 "0"을 구분하는 규칙의 핵심**이다. 동기화로 들어온 캠페인은
 * 플랫폼에 "계획 예산"이라는 개념이 없어 budget_planned가 0으로 저장되는데,
 * 그 0을 그대로 화면에 쓰면 "0으로 계획했다"는 강한 주장이 된다 — 사실이 아니고,
 * 그런 화면이 하나 있으면 옆의 멀쩡한 숫자까지 같이 의심받는다.
 *
 * 실제로 같은 캠페인이 화면마다 다른 값을 보이고 있었다(실사용 리뷰로 발견):
 * 드로어는 calcAutoBudgetPlanned로 $1,060을 보여주는데, Reports는 저장된 0을
 * 그대로 써서 "PLANNED BUDGET $0"에 Budget Breakdown 합계도 $0이었다. 계산할
 * 줄 아는 값을 한쪽에서만 계산한 것이 원인이라, 그 계산을 여기 한 곳에 둔다.
 *
 * 근거가 아무것도 없으면 **0이 아니라 null**을 돌려준다. 호출부는 null을 '—'로
 * 표시해서 "모른다"와 "0으로 계획했다"를 구분한다.
 *
 * @param {Campaign} campaign
 * @returns {number|null} 계획 예산. 저장값도 계산 근거도 없으면 null
 */
export function effectiveBudgetPlanned(campaign) {
  if (campaign?.budgetPlanned > 0) return campaign.budgetPlanned;
  return calcAutoBudgetPlanned(campaign?.budgetDaily, campaign?.startDate, campaign?.endDate)?.amount ?? null;
}

/**
 * 소진 속도를 "계획 대비 몇 배인가" 하나의 비율로 돌려준다(1이면 계획대로).
 *
 * calcBudgetPacing이 내놓는 두 가지 근거를 generateAlerts와 **같은 우선순위로**
 * 하나로 합친다: 일일 예산이 있으면 그게 더 직접적인 신호라 우선 쓰고, 없으면
 * "예산 소진률 ÷ 기간 경과율"로 대체한다. 둘 다 없으면 null — 동기화로 들어온
 * 캠페인은 계획 예산 개념이 없어 0으로 저장되므로 실제로 자주 발생하고, 그때는
 * 비교할 기준 자체가 없으므로 화면도 아무 말을 하지 않아야 한다(모르면서 아는
 * 척하는 것이 침묵보다 나쁘다).
 *
 * 알림(generateAlerts)은 이 값이 임계를 넘을 때만 말하고, 목록은 정상일 때도
 * 말한다 — 같은 근거를 쓰되 역할이 다르다.
 *
 * @param {Campaign} campaign
 * @param {number|null} spend
 * @param {Date} today
 * @returns {number|null} 평균 소진 / 계획 소진. 판단 근거가 없으면 null
 */
export function budgetPaceRatio(campaign, spend, today = new Date()) {
  const { dailyBudgetRatio, budgetUsedRatio, timeElapsedRatio } = calcBudgetPacing(campaign, spend, today);
  if (dailyBudgetRatio != null) return dailyBudgetRatio;
  // 기간이 하루도 안 지났으면 나눗셈이 발산한다 — 아직 판단할 근거가 없는 게 맞다.
  if (budgetUsedRatio == null || !timeElapsedRatio) return null;
  return budgetUsedRatio / timeElapsedRatio;
}

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
    /* 저장된 budgetPlanned가 아니라 effectiveBudgetPlanned를 쓴다 — 동기화
       캠페인은 0으로 저장돼서 이 값이 항상 null이었고, 드로어의 Budget Spent
       줄이 "— ($514.49 / $0)"로 깨져 있었다. 일일 예산이 있으면 기간을 곱해
       복원되므로 그 줄이 실제 비율을 말하게 된다.
       알림 동작은 바뀌지 않는다: 여기서 새로 값이 생기는 경우는 budgetDaily가
       있는 캠페인뿐인데, 그때는 dailyBudgetRatio가 이미 우선권을 갖는다. */
    budgetUsedRatio: effectiveBudgetPlanned(campaign) ? spend / effectiveBudgetPlanned(campaign) : null,
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
 * 캠페인 이름을 "같은 단계인가"를 판정하기 위한 키로 정규화한다.
 *
 * 이 계정의 이름은 사람이 플랫폼별 광고 관리자에서 각각 손으로 짓는다. 그래서
 * 같은 단계인데도 구분자 주변 공백이 미묘하게 달라진다 — 실제 G10 Opening에서:
 *
 *   TikTok: G10_Grand Opening_0706~0801      Meta: G10_Grand Opening _0706 ~ 0801
 *   TikTok: G10_Now Open_0706~0831           Meta: G10_Now Open_0706 ~0831
 *   TikTok: G10_1_Month Deals_0710~0831      Meta: G10_ 1 Month Deals_0710~0831
 *
 * 이름을 그대로 비교하면 이 세 쌍이 각각 다른 phase로 갈라져서, "같은 단계는
 * 플랫폼이 달라도 한 막대로 합친다"는 설계가 무력화된다(타임라인에 같은 단계가
 * 두 줄씩, 어느 쪽이 Meta인지 표시도 없이 나왔다 — 실사용 신고).
 *
 * `_`는 공백과 같은 구분자로 취급한다. 위 세 번째 쌍처럼 사람이 `_`와 공백을
 * 서로 바꿔 쓰기 때문에, 공백만 정리해서는 합쳐지지 않는다.
 *
 * 단어 자체는 건드리지 않는다 — "Sale"과 "Game"처럼 진짜로 다른 단계는 그대로
 * 갈라져 있어야 한다. 흡수하는 것은 구분자·대소문자 흔들림뿐이다.
 *
 * @param {string} name - 캠페인 이름
 * @returns {string} 비교 전용 키(화면 표시에는 쓰지 않는다 — 원본 이름을 쓴다)
 */
export function campaignNameKey(name) {
  return (name ?? '')
    .toLowerCase()
    .replace(/_/g, ' ')          // `_`와 공백을 같은 구분자로
    // 대시·물결의 변형 문자를 ASCII로 통일한다 — Meta 쪽 이름에 em dash(—)가
    // 실제로 있고, 한글 IME는 전각 물결(～)을 내놓는다. 이걸 안 접으면 "A — B"와
    // "A - B"가 다른 phase로 갈라져서 이 함수가 잡으려던 문제가 그대로 재발한다.
    .replace(/[—–]/g, '-')
    .replace(/～/g, '~')
    .replace(/\s*([~-])\s*/g, '$1') // 기간 구분자 주변 공백 제거: "0706 ~ 0801" → "0706~0801"
    .replace(/\s+/g, ' ')
    .trim();
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
/**
 * missing_performance 알림의 시간 창(일). 종료 후 이 기간 안에만 알림을 만든다 —
 * 창 없이 전 기간을 검사하면 도구 도입 이전의 오래된 종료 캠페인 수십 건이
 * 한꺼번에 error로 떠서 알림 전체가 노이즈가 된다. 대시보드의 Recently Ended
 * 뷰(14일)보다 넓게 잡아, 뷰에서 사라진 뒤에도 알림으로는 한동안 남게 한다.
 */
export const MISSING_PERFORMANCE_WINDOW_DAYS = 30;

/**
 * 성과 레코드에 실제 값이 하나라도 있는지. spend는 rowToPerformanceRecord가
 * `?? 0`으로 정규화하므로 "0이 아닌 값"으로 봐야 빈 레코드와 구분된다.
 * @param {PerformanceRecord} record
 * @returns {boolean}
 */
export function hasAnyMetricValue(record) {
  if (!record) return false;
  const METRIC_KEYS = [
    'impressions', 'reach', 'clicks', 'spend', 'videoPlays', 'hookViews', 'heldViews',
    'avgWatchSeconds', 'likes', 'comments', 'shares', 'follows', 'profileVisits',
    'engagements', 'conversions',
  ];
  return METRIC_KEYS.some((key) => record[key] != null && record[key] !== 0 && record[key] !== '');
}

// 알림 유형별 색상(error/warning) — AlertBanner·CampaignTable의 alertBadges가
// 전부 이 하나만 참조한다(예전엔 파일마다 따로 하드코딩해서 하나만 고치면
// 다른 화면과 어긋나는 문제가 있었다). budget_pacing을 error로 올린 이유:
// 지금 활성 캠페인이 실시간으로 예산을 초과 집행 중이라 다른 warning급
// 알림보다 실무 관점에서 더 급하다 — 지금 이 순간에도 돈이 계속 나가고 있다.
export const ALERT_SEVERITY = {
  [ALERT_TYPE.BUDGET_PACING]: 'error',
  // 03-visual-direction의 긴급도 체계 그대로 — 보고 자체가 막히는 상태라 error로 격상
  [ALERT_TYPE.MISSING_PERFORMANCE]: 'error',
  [ALERT_TYPE.NO_RESULTS]: 'error',
  // 돈이 실제로 청구되는 건이라 놓치면 회계가 밀린다.
  [ALERT_TYPE.INVOICE_DUE]: 'warning',
  // 잔액이 바닥나면 광고가 그냥 멈춘다 — 돈이 나가는 것보다 급하다.
  [ALERT_TYPE.BALANCE_LOW]: 'error',
  [ALERT_TYPE.ENDING_SOON]: 'warning',
  [ALERT_TYPE.OVERLAP_TARGET]: 'warning',
};

// generateAlerts()가 반환 직전에 이 순위로 정렬해서, 알림을 쓰는 모든 화면
// (배너/벨 팝오버/카드)이 캠페인 배열 순서가 아니라 심각도 순으로 일관되게
// 본다 — ALERT_SEVERITY와 같은 이유로 budget_pacing이 먼저 온다(실시간
// 손실이 다른 warning급 알림보다 급함).
const ALERT_SEVERITY_RANK = {
  [ALERT_TYPE.BUDGET_PACING]: 0,
  // 같은 error라도 budget_pacing 다음 — 저긴 지금도 돈이 나가는 중이고, 이건
  // 이미 끝난 캠페인의 기록 문제라 실시간성이 없다.
  // 예산 초과 다음 — 저긴 쓰는 속도가 문제고 이건 쓴 돈이 성과 0이라
  // 실시간성은 같지만 초과 집행이 더 즉각적인 손실이다.
  [ALERT_TYPE.NO_RESULTS]: 1,
  [ALERT_TYPE.MISSING_PERFORMANCE]: 2,
  [ALERT_TYPE.BALANCE_LOW]: 2,
  [ALERT_TYPE.INVOICE_DUE]: 3,
  [ALERT_TYPE.ENDING_SOON]: 4,
  [ALERT_TYPE.OVERLAP_TARGET]: 5,
};

/**
 * "이 광고에 사람이 반응했는가"를 말해주는 필드들. 어느 하나라도 0보다 크면
 * 그 캠페인은 성과를 내고 있는 것이다(무엇을 목표로 했든).
 * 노출·도달은 여기 없다 — 그건 전달됐다는 뜻이지 반응이 아니다.
 */
const RESPONSE_FIELDS = ['clicks', 'engagements', 'conversions', 'follows', 'profileVisits', 'likes', 'comments', 'shares'];

/**
 * 이 목표가 "성공"으로 세는 대표 지표. 목표마다 무엇이 결과인지가 달라서,
 * 하나의 지표로 모든 캠페인을 판정할 수 없다.
 *
 * @param {Campaign} campaign
 * @param {PerformanceRecord} record
 * @returns {{label: string, value: number|null}|null} 대응 지표가 없으면 null
 */
export function goalResultMetric(campaign, record) {
  switch (campaign.goal) {
    case GOAL.TRAFFIC: return { label: 'clicks', value: record.clicks };
    case GOAL.AWARENESS: return { label: 'reach', value: record.reach };
    case GOAL.ENGAGEMENT: return { label: 'engagements', value: record.engagements };
    case GOAL.CONVERSION:
    case GOAL.STORE_VISIT: return { label: 'conversions', value: record.conversions };
    default: return null;
  }
}

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
/**
 * 청구 문턱까지 남은 비율이 이 값 이하면 "곧 인보이스" 로 본다.
 * 문턱에 닿은 뒤 알리면 이미 청구가 끝나 인보이스를 놓친 상태다.
 */
export const INVOICE_WARNING_RATIO = 0.85;

/**
 * 선불 잔액이 이 일수 아래로 떨어지면 알린다.
 *
 * "$0이 되면 알려달라"가 원래 요청이었는데, 0이 되는 순간은 **광고가 이미 멈춘
 * 뒤**다. 충전은 사람이 결제해야 하는 일이라 미리 알아야 손쓸 수 있다.
 * 이 계정은 $500을 채워 하루 $40 안팎을 쓰므로 한 번 충전이 약 12일치다 —
 * 7일이면 남은 절반쯤에서 알리는 셈이라, 잊고 지나가도 한 번은 눈에 띄고
 * 매일 켜져 있지도 않다.
 */
export const BALANCE_RUNWAY_WARNING_DAYS = 7;

/**
 * 이 계정의 선불 잔액이 며칠치인가. 하루에 쓰는 돈으로 나눈다.
 *
 * 분모는 **진행중 캠페인의 일일 예산 합**이다. 과거 평균 지출이 아니라 앞으로
 * 나갈 돈이라, "며칠 뒤 멈추나"라는 미래형 질문에 맞는 값이다. 도는 캠페인이
 * 없으면 나갈 돈도 없어 null을 돌려준다 — 잔액이 적어도 멈출 일이 없으므로
 * 경고할 이유가 없다(0으로 나눠 Infinity를 만들지도 않는다).
 *
 * @param {AdAccount} account
 * @param {Campaign[]} campaigns - 전체 캠페인(이 계정 것만 골라 쓴다)
 * @param {Date} today
 * @returns {number|null} 남은 일수. 판단 근거가 없으면 null
 */
export function balanceRunwayDays(account, campaigns, today = new Date()) {
  if (account?.balanceAvailable == null) return null;
  const dailyBurn = campaigns
    .filter((c) => c.accountId === account.id && getEffectiveStatus(c, today) === CAMPAIGN_STATUS.ACTIVE)
    .reduce((sum, c) => sum + (c.budgetDaily ?? 0), 0);
  if (!(dailyBurn > 0)) return null;
  return account.balanceAvailable / dailyBurn;
}

export function generateAlerts(campaigns, performanceRecords, today = new Date(), adAccounts = []) {
  const alerts = [];

  /* 계정 단위 알림. 이 앱의 다른 알림은 전부 캠페인에 붙는데 이건 광고 계정에
     붙는다 — 미납액은 그 계정의 모든 캠페인이 함께 만든 값이라 캠페인 지출을
     아무리 더해도 나오지 않는다(Meta는 문턱에 닿을 때마다 청구하고 누적을
     0으로 되돌리는데 우리는 그 리셋을 볼 수 없다). 그래서 플랫폼이 주는
     balance를 그대로 읽어 쓴다.

     문턱을 모르면(invoice_threshold null) 아무 말도 하지 않는다 — 플랫폼이
     문턱을 API로 알려주지 않아 사람이 넣어야 하는 값이고, 없는 걸 기본값으로
     지어내면 "곧 청구됩니다"가 근거 없는 경고가 된다. */
  adAccounts.forEach((account) => {
    /* 선불 잔액이 며칠 안 남았다. "$0이 되면"이 아니라 남은 날짜로 알리는 이유는
       0이 되는 순간이 곧 광고가 멈춘 뒤이기 때문이다 — 충전은 사람이 결제해야
       하는 일이라 미리 알아야 손쓸 수 있다. */
    const runway = balanceRunwayDays(account, campaigns, today);
    if (runway != null && runway <= BALANCE_RUNWAY_WARNING_DAYS) {
      alerts.push({
        id: `alert-balance-${account.id}`,
        campaignId: null,
        accountId: account.id,
        type: ALERT_TYPE.BALANCE_LOW,
        triggeredAt: today.toISOString(),
        resolvedAt: null,
        message: `${account.label} — $${account.balanceAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })} left, about ${Math.floor(runway)} day${Math.floor(runway) === 1 ? '' : 's'} at the current daily budget — top up before ads stop`,
      });
    }

    if (account.balanceDue == null || !account.invoiceThreshold) return;
    if (account.balanceDue < account.invoiceThreshold * INVOICE_WARNING_RATIO) return;
    alerts.push({
      id: `alert-invoice-${account.id}`,
      campaignId: null,
      accountId: account.id,
      type: ALERT_TYPE.INVOICE_DUE,
      triggeredAt: today.toISOString(),
      resolvedAt: null,
      message: `${account.label} — $${account.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })} of the $${account.invoiceThreshold.toLocaleString('en-US')} billing threshold — an invoice is due soon`,
    });
  });

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
        /* 돈은 나가는데 목표 지표가 0인 캠페인. 예산 페이싱만 보면 "계획대로
           쓰는 중"이라 초록으로 보이는데, 실제로는 계획대로 태워서 아무것도
           못 얻고 있는 상태다 — 실사용 리뷰에서 Traffic 목표에 클릭 0인
           캠페인이 "on pace"로 표시된 것이 발단.

           **확인된 0에만 반응한다**: 값이 null이면(플랫폼이 그 지표를 안 준
           경우) 아무 말도 하지 않는다. 모르는 것을 실패로 단정하면 잘못된
           경보가 되고, 그게 반복되면 진짜 경보까지 무시된다. 동기화는 없는
           값을 0으로 만들지 않으므로(num()이 null을 유지) 이 구분이 성립한다. */
        const result = goalResultMetric(campaign, record);
        /* 목표 지표 하나만 보면 안 된다. goal은 플랫폼 objective를 우리 5개
           분류로 옮긴 값인데, mapTikTokGoal이 **모르는 objective를 전부
           traffic으로 떨어뜨린다** — TikTok의 RF_REACH·LEAD_GENERATION 등이
           여기 걸린다. 그러면 애초에 링크 클릭을 만들 목적이 아닌 광고를
           "클릭 0"으로 판정하게 된다.
           실제로 그렇게 터졌다: 클릭 0이라 알림이 떴는데 같은 캠페인이
           좋아요 391·공유 64·팔로우 148·프로필 방문 178을 만들고 있었다.
           죽은 게 아니라 우리가 목표를 잘못 붙인 것이었다.
           그래서 "어느 축으로도 반응이 없다"까지 확인한 뒤에만 말한다.
           목표 분류가 틀려도 이 조건은 틀리지 않는다 — 반응이 하나라도 있으면
           그 캠페인은 뭔가를 하고 있는 것이고, 무엇을 하는지 판단하는 건
           사람 몫이지 잘못된 라벨을 근거로 한 경보의 몫이 아니다. */
        const hasAnyResponse = RESPONSE_FIELDS.some((field) => (record[field] ?? 0) > 0);
        if (record.spend > 0 && result && result.value === 0 && !hasAnyResponse) {
          alerts.push({
            id: `alert-noresults-${campaign.id}`,
            campaignId: campaign.id,
            type: ALERT_TYPE.NO_RESULTS,
            triggeredAt: today.toISOString(),
            resolvedAt: null,
            message: `${campaign.name} — $${record.spend.toLocaleString('en-US')} spent with 0 ${result.label} on a ${campaign.goal} campaign — check targeting or creative`,
          });
        }

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

    if (status === MANUAL_STATUS.ENDED_EARLY || status === CAMPAIGN_STATUS.ENDED) {
      // 성과 미보고 판정 — 값이 하나도 없으면 미보고다. "레코드 존재"만으로
      // 판정하면, 빈 Performance 폼을 저장하는 것만으로 error 등급 알림이
      // 사라진다(전 필드 null + spend 0인 행이 생긴다). 기록이 없다는 사실이
      // 어디에도 안 남으므로 존재가 아니라 내용을 본다.
      const hasPerformance = record != null && hasAnyMetricValue(record);
      // 조기 종료는 계획 종료일이 아직 미래일 수 있어 effectiveEndDate가 실제
      // 종료 시점(상한 적용)을 돌려준다. 날짜 차이는 양쪽을 로컬 자정으로 맞춰 센다.
      const daysSinceEnd = daysSince(effectiveEndDate(campaign), today);
      if (!hasPerformance && daysSinceEnd >= 0 && daysSinceEnd <= MISSING_PERFORMANCE_WINDOW_DAYS) {
        alerts.push({
          id: `alert-missing-perf-${campaign.id}`,
          campaignId: campaign.id,
          type: ALERT_TYPE.MISSING_PERFORMANCE,
          triggeredAt: today.toISOString(),
          resolvedAt: null,
          message: `${campaign.name} — ended ${daysSinceEnd === 0 ? 'today' : `${daysSinceEnd}d ago`} with no performance data — enter results to complete reporting`,
        });
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
 * @returns {{ totalCampaigns: number, totalBudgetPlanned: number|null, totalSpend: number, avgCPM: number|null, avgCTR: number|null }}
 */
export function getReportSummary(campaigns, performanceRecords) {
  /* 저장된 0을 그대로 더하지 않는다 — effectiveBudgetPlanned가 일일 예산×기간으로
     복원한다(같은 캠페인이 드로어에선 $1,060, Reports에선 $0으로 보이던 불일치).
     근거가 하나도 없으면 합계도 null로 남겨 호출부가 '—'를 찍게 한다: 0을 찍으면
     "0으로 계획했다"는 거짓 주장이 되고, 그 화면의 다른 숫자까지 의심받는다. */
  const plannedAmounts = campaigns.map(effectiveBudgetPlanned).filter((v) => v != null);
  const totalBudgetPlanned = plannedAmounts.length > 0 ? plannedAmounts.reduce((sum, v) => sum + v, 0) : null;

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
// ============================================================
// 계획(Plan) — 집행 전에 세우는 예산·일정. 캠페인과 별개 객체다.
// ============================================================

/**
 * @typedef {Object} PlanItem
 * @property {string} id
 * @property {string} planId
 * @property {string} label - 단계 이름(예: "Coming Soon"). 사람이 읽기 위한 라벨이고 실제 캠페인 이름과 같을 필요는 없다
 * @property {'meta'|'tiktok'} platform
 * @property {string} startDate - ISO 8601 date
 * @property {string} endDate - ISO 8601 date
 * @property {number} budgetDaily - 일일 예산(USD). 총액은 저장하지 않고 기간을 곱해 구한다
 * @property {number} sortOrder
 */

/**
 * @typedef {Object} Plan
 * @property {string} id
 * @property {string} name - 이벤트 이름. campaigns.campaignGroup과 같은 값을 쓴다(대조 키)
 * @property {string|null} notes
 * @property {PlanItem[]} items
 */

/**
 * 계획 한 줄의 총액. 일일 예산 × 기간(양 끝 포함)이다.
 *
 * 총액을 저장하지 않는 이유는 캠페인 쪽과 같다 — 두 값을 다 저장하면 서로
 * 어긋났을 때 어느 쪽이 맞는지 알 수 없다. calcAutoBudgetPlanned와 같은 계산을
 * 쓰므로 계획과 실제가 같은 방식으로 총액을 낸다.
 *
 * @param {PlanItem} item
 * @returns {number|null} 근거가 없으면 null
 */
export function planItemTotal(item) {
  return calcAutoBudgetPlanned(item?.budgetDaily, item?.startDate, item?.endDate)?.amount ?? null;
}

/**
 * 계획 전체의 총액. 근거가 하나도 없으면 0이 아니라 null이다
 * ("계획이 $0"과 "계획을 아직 안 세움"은 다른 상태다 — 이 앱의 공통 규칙).
 *
 * @param {Plan} plan
 * @returns {number|null}
 */
export function planTotal(plan) {
  const amounts = (plan?.items ?? []).map(planItemTotal).filter((v) => v != null);
  return amounts.length > 0 ? amounts.reduce((sum, v) => sum + v, 0) : null;
}

/**
 * 계획의 기간 — 가장 이른 시작일부터 가장 늦은 종료일까지.
 * 항목이 없으면 null(기간을 지어내지 않는다).
 *
 * @param {Plan} plan
 * @returns {{startDate: string, endDate: string}|null}
 */
export function planDateRange(plan) {
  const items = plan?.items ?? [];
  if (items.length === 0) return null;
  return {
    startDate: items.reduce((min, i) => (i.startDate < min ? i.startDate : min), items[0].startDate),
    endDate: items.reduce((max, i) => (i.endDate > max ? i.endDate : max), items[0].endDate),
  };
}

/**
 * 계획 이름으로 실제 집행 캠페인을 찾는다.
 *
 * 대조 키는 campaignGroupKey — 앱 전체가 이미 쓰는 묶음 기준이라 계획을 위한
 * 별도 매칭 규칙을 만들지 않는다. 이름이 안 맞으면 "집행 없음"으로 보이는데,
 * 그건 틀린 게 아니라 **이름을 맞추라는 신호**다(억지로 비슷한 것을 붙이면
 * 예산이 조용히 엉뚱한 계획에 귀속된다 — 매장 배정에서 이미 세운 원칙).
 *
 * @param {Plan} plan
 * @param {Campaign[]} campaigns
 * @returns {Campaign[]}
 */
export function campaignsForPlan(plan, campaigns) {
  if (!plan?.name) return [];
  return campaigns.filter((c) => campaignGroupKey(c) === plan.name);
}

