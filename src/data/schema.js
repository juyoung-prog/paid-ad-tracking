/**
 * Paid Ads Tracking Dashboard — Data Schema
 *
 * 타입 정의(JSDoc) + enum 상수 + 순수 계산 함수만 포함한다.
 * 실제 샘플/목 데이터는 이 파일에 두지 않고 별도 파일(paidAdsMockData.js)에 둔다.
 * React import 금지 — 이 파일은 데이터 레이어이며 컴포넌트 레이어와 분리된다.
 *
 * 근거 문서: docs/paid-ads-dashboard/ux-flow/02-ux-flow.md (데이터 모델)
 */

// 알림 메시지는 사람이 읽는 문장이라 금액 표기가 들어간다. utils/format.js는
// 순수 함수만 있는 표기 레이어(React 의존 없음)라 데이터 레이어에서 써도
// 레이어 분리가 깨지지 않는다 — 이걸 쓰지 않으면 알림 문구의 금액만 화면과
// 다른 자릿수로 찍힌다.
import { money, moneyWhole } from '../utils/format';

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
 * @property {string|null} adLink - 소비자가 보는 실제 광고 게시물 링크(서버 소유 — 동기화가 썸네일과 같은 광고에서 뽑아 채움). View ad는 creativeUrl(수동) 우선, 없으면 이 값
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
 * @property {number|null} hookViews - Tier 2 · 영상 지표. 플랫폼별 훅 정의: Meta 3초 재생(actions.video_view) / TikTok 2초 시청(video_watched_2s)
 * @property {number|null} heldViews - Tier 2 · 영상 지표 (완전시청수). Meta video_p100_watched_actions / TikTok video_views_p100
 * @property {number|null} avgWatchSeconds - Tier 2 · 영상 지표 (평균 재생 시간, 초)
 * @property {number|null} likes - Tier 3 · 상호작용 구성 요소
 * @property {number|null} comments - Tier 3 · 상호작용 구성 요소
 * @property {number|null} shares - Tier 3 · 상호작용 구성 요소
 * @property {number|null} engagements - Tier 3 · goal=engagement일 때만. likes+comments+shares 합 — 양 플랫폼 동일 정의(Meta의 post_engagement는 영상 조회·클릭까지 포함하는 다른 양이라 쓰지 않는다)
 * @property {number|null} follows - Tier 3 · 팔로우 획득. TikTok 전용(Meta 캠페인 레벨에 대응 지표 없음)
 * @property {number|null} profileVisits - Tier 3 · 프로필 방문. TikTok 전용
 * @property {number|null} conversions - Tier 4 · goal=conversion|store_visit일 때만
 */

/**
 * 캠페인×날짜 단위 일별 성과(performance_daily, API 전용). PerformanceRecord가
 * "그 시점까지의 누적 스냅샷"이라 만들 수 없는 시계열 축을 담당한다 — Reports의
 * 날짜 필터가 지표를 실제로 자를 수 있는 유일한 근거.
 *
 * 가산 가능한 지표만 있다. reach가 없는 건 실수가 아니다 — 일별 reach의 합은
 * 기간 reach가 아니라서(같은 사람이 여러 날 보이면 중복) 저장하지 않는다.
 *
 * @typedef {Object} PerformanceDaily
 * @property {string} id - UUID v4 PK
 * @property {string} campaignId - FK → Campaign.id
 * @property {string} date - YYYY-MM-DD (그 지표가 발생한 날)
 * @property {number} spend - USD 소수점 2자리
 * @property {number|null} impressions
 * @property {number|null} clicks
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
 * Hook Rate(훅 시청 ÷ 재생 수)를 계산한다.
 *
 * 분모는 노출(impressions)이 아니라 **video plays**다 — Meta/TikTok 광고
 * 관리자의 Hook rate가 재생 수 기준이라, 노출로 나누면 대시보드와 플랫폼
 * 화면이 같은 이름으로 다른 숫자를 보여준다(실사용에서 69.54% vs 80%로 발견).
 * 분자는 플랫폼이 정의한다: Meta 3초 재생, TikTok 2초 재생.
 * @param {number|null} hookViews
 * @param {number|null} videoPlays
 * @returns {number|null}
 */
export function calcHookRate(hookViews, videoPlays) {
  if (!videoPlays || hookViews == null) return null;
  return hookViews / videoPlays;
}

/**
 * Hold Rate(완전 시청 ÷ 훅 시청)를 계산한다.
 *
 * Meta 광고 관리자의 Hold rate와 같은 식이다 — 실측 대조(2026-09, G10
 * 1 Month Deals)로 확정: 화면의 5.49% = 완주 4,003 ÷ 3초 재생 72,946.
 * ThruPlay÷재생수(57%)·p95÷재생수(4.69%) 등 다른 후보는 반증됨.
 * "훅에 걸린 사람 중 끝까지 남은 비율"이라는 원래 의미 그대로다.
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

/**
 * CPE(참여당 비용)를 계산한다. (goal=engagement일 때만 의미 있음)
 *
 * 왜 필요한가: goal별 표에서 Awareness는 CPM, Traffic은 CPC, Conversion은
 * CPA를 갖는데 Engagement만 비용 효율 지표 없이 Spend 원액뿐이었다. 그래서
 * 같은 이벤트의 Meta($1.60/참여)와 TikTok($5.85/참여)이 3.7배 차이 나는데도
 * 화면에서 비교가 안 됐다(실화면 13-9 리뷰).
 *
 * @param {number} spend
 * @param {number|null} engagements
 * @returns {number|null}
 */
export function calcCPE(spend, engagements) {
  if (!engagements) return null;
  return spend / engagements;
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
 * 플랫폼 API로 동기화되는 캠페인인지. 외부 캠페인 ID가 있으면 sync-campaigns /
 * sync-performance가 상태·지출·지표를 매일 덮어쓴다 — 그런 캠페인의 성과를
 * 사람이 손으로 적을 일은 없고, 적어도 다음 동기화 때 API 값이 따로 쌓인다.
 * 성과 입력 폼과 "성과 미보고" 알림은 이 값이 false인 캠페인(대시보드에서 직접
 * 등록한 것)에만 뜬다.
 *
 * @param {{ externalCampaignId?: string|null }} campaign
 * @returns {boolean}
 */
export function isSyncedCampaign(campaign) {
  return Boolean(campaign?.externalCampaignId);
}

/**
 * 이벤트 이름이 "배정 없음"을 뜻하는 자리표시자인지. 실데이터에 부스팅 게시물
 * 수십 건이 "noname"이라는 그룹으로 묶여 있는데, 이건 이벤트가 아니라 "이벤트를
 * 못 정한 캠페인들"이다. 화면(Event 필터·목록 메타 줄)은 이 값을 "Unassigned"로
 * 부르고 정상 이벤트와 분리한다 — 데이터는 그대로 둔다(동기화가 매번 덮어쓴다).
 *
 * @param {string|null|undefined} name
 * @returns {boolean}
 */
const UNASSIGNED_EVENT_PATTERN = /^(noname|no[\s_-]?name|unassigned|none|n\/a|-)$/i;
export function isUnassignedEvent(name) {
  return UNASSIGNED_EVENT_PATTERN.test((name ?? '').trim());
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
 * 이름에 들어 있는 매장 코드 토큰(G10, BF3 …).
 *
 * 이 계정의 네이밍은 매장 코드를 이름에 담는다(`G10_Grand Opening`,
 * `BF3_1$ Deals`). 편집 거리만으로 오타를 찾으면 **"G11 Opening"에 "G10
 * Opening"을 제안**하게 되는데, 그건 오타가 아니라 새로 여는 11호점이다.
 * 6호점 계획을 세우는 사람에게 "3호점 말씀이신가요?"를 묻는 건 최악의 제안이다.
 *
 * 매장 코드가 다르면 나머지가 아무리 닮아도 다른 이벤트다.
 */
function storeCodesIn(name) {
  return new Set((String(name ?? '').match(/\b[A-Za-z]{1,2}\d{1,2}\b/g) ?? []).map((c) => c.toUpperCase()));
}

/** 두 이름이 같은 매장을 가리키는가. 한쪽에만 코드가 있어도 다른 것으로 본다. */
function sameStoreCodes(a, b) {
  const ca = storeCodesIn(a);
  const cb = storeCodesIn(b);
  if (ca.size !== cb.size) return false;
  return [...ca].every((code) => cb.has(code));
}

/** Levenshtein 편집 거리. 이름이 짧아(수십 자) 단순 DP로 충분하다. */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const curr = [i];
    for (let j = 1; j <= b.length; j += 1) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * 계획 이름이 기존 Event 중 어느 것을 **의도한 것 같은지** 찾는다.
 *
 * ## 왜 필요한가
 *
 * 계획과 실제 집행은 `plans.name = campaigns.campaignGroup` 문자열 하나로만
 * 연결된다. 이름 칸이 자유 입력(freeSolo)인 건 의도한 설계다 — 아직 존재하지
 * 않는 이벤트를 미리 계획하는 게 이 기능의 핵심이라, 기존 목록에서만 고르게
 * 하면 기능 자체가 성립하지 않는다.
 *
 * 문제는 **틀렸을 때 아무 일도 일어나지 않는다**는 것이다. "G10 Openin"으로
 * 저장하면 오류도 경고도 없이 그냥 저장되고, 나중에 화면이 "실제 집행 없음"을
 * 보여준다. 사용자는 계획이 끊어진 걸 모른 채 잘못된 예산 판단을 한다.
 * 실제 계정에 `50%Off` / `50%Offdeals Reach` / `50%Offdeals Trafp`처럼 서로
 * 닮은 이름이 이미 존재해서 가정이 아니라 실재하는 위험이다.
 *
 * 막지는 않는다. **묻는다.** 이건 오류가 아니라 "이걸 말한 건가요?"다.
 *
 * @param {string} name - 사용자가 입력한 계획 이름
 * @param {string[]} eventNames - 실제 집행 중인 Event 이름 목록
 * @returns {{kind: 'exact'|'normalized'|'typo'|'new', suggestion: string|null}}
 *   - `exact`: 그대로 일치한다. 대조가 붙는다
 *   - `normalized`: 대소문자·구분자만 다르다. 거의 확실히 같은 이벤트다
 *   - `typo`: 편집 거리가 가까운 이름이 있다. 물어볼 가치가 있다
 *   - `new`: 닮은 게 없다. 새 이벤트를 미리 계획하는 정상 경로다
 */
export function matchEventName(name, eventNames = []) {
  const trimmed = (name ?? '').trim();
  if (!trimmed || eventNames.length === 0) return { kind: 'new', suggestion: null };

  if (eventNames.includes(trimmed)) return { kind: 'exact', suggestion: null };

  const key = campaignNameKey(trimmed);
  const normalized = eventNames.find((n) => campaignNameKey(n) === key);
  if (normalized) return { kind: 'normalized', suggestion: normalized };

  /* 임계는 길이에 비례시킨다. 고정값(예: 2)으로 두면 짧은 이름에서는 전혀
     다른 이벤트를 제안하고("G09" vs "G10"은 거리 1이지만 **다른 매장**이다),
     긴 이름에서는 진짜 오타를 놓친다. 20% 이하 + 최대 3자로 묶고, 아주 짧은
     이름(8자 미만)은 아예 제안하지 않는다 — 그 길이에서는 거리 1이 오타보다
     의미 있는 차이일 확률이 높다. */
  if (trimmed.length < 8) return { kind: 'new', suggestion: null };
  const limit = Math.min(3, Math.floor(trimmed.length * 0.2));
  if (limit < 1) return { kind: 'new', suggestion: null };

  let best = null;
  let bestDistance = Infinity;
  eventNames.forEach((candidate) => {
    // 매장이 다르면 후보에서 아예 뺀다 — 편집 거리로는 "G11 Opening"과
    // "G10 Opening"이 1이지만, 그건 오타가 아니라 새로 여는 매장이다.
    if (!sameStoreCodes(trimmed, candidate)) return;
    const distance = editDistance(key, campaignNameKey(candidate));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  });

  return bestDistance <= limit ? { kind: 'typo', suggestion: best } : { kind: 'new', suggestion: null };
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
        message: `${account.label} — ${money(account.balanceAvailable)} left, about ${Math.floor(runway)} day${Math.floor(runway) === 1 ? '' : 's'} at the current daily budget — top up before ads stop`,
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
      message: `${account.label} — ${money(account.balanceDue)} of the ${moneyWhole(account.invoiceThreshold)} billing threshold — an invoice is due soon`,
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
            message: `${campaign.name} — ${money(record.spend)} spent with 0 ${result.label} on a ${campaign.goal} campaign — check targeting or creative`,
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
              message: `${campaign.name} — averaging ${moneyWhole(avgDailySpend)}/day, over the ${moneyWhole(campaign.budgetDaily)}/day budget`,
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

    /* 성과 미보고는 **직접 등록한 캠페인**에만 묻는다. 동기화 캠페인의 지표는
       API가 채우는 것이라 비어 있으면 사람이 아니라 동기화의 문제다 — 그걸
       "입력하라"는 error 알림으로 띄우면 할 수 없는 일을 시키는 셈이고, 실데이터
       171건 전부가 동기화라 이 알림이 사실상 항상 헛소리였다. */
    if (!isSyncedCampaign(campaign) && (status === MANUAL_STATUS.ENDED_EARLY || status === CAMPAIGN_STATUS.ENDED)) {
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

/** 날짜가 필터 범위 안인지. ISO(YYYY-MM-DD) 문자열은 사전순 비교가 곧 날짜 비교다. */
function isDateInRange(date, range) {
  if (!range) return true;
  if (range.start && date < range.start) return false;
  if (range.end && date > range.end) return false;
  return true;
}

/**
 * 일별 행들을 (범위로 잘라) 합산한다.
 *
 * spend는 항상 숫자(테이블 not null), impressions/clicks는 전부 null이면 null로
 * 남긴다 — "그 기간 노출 0"과 "지표를 못 받았다"는 다르고, 후자를 0으로 찍으면
 * 화면이 거짓말을 한다(sync-performance의 sumInteractions와 같은 원칙).
 *
 * @param {PerformanceDaily[]} dailyRows
 * @param {{ start?: string, end?: string }} [range]
 * @returns {{ spend: number, impressions: number|null, clicks: number|null }}
 */
export function sumDailyMetrics(dailyRows, range) {
  const inRange = dailyRows.filter((r) => isDateInRange(r.date, range));
  const sumOrNull = (values) => (values.some((v) => v != null)
    ? values.reduce((sum, v) => sum + (v ?? 0), 0)
    : null);
  return {
    spend: inRange.reduce((sum, r) => sum + r.spend, 0),
    impressions: sumOrNull(inRange.map((r) => r.impressions)),
    clicks: sumOrNull(inRange.map((r) => r.clicks)),
  };
}

/**
 * 필터된 캠페인 집합의 "기간 안 실지출". Reports의 Spend KPI가 날짜 필터를
 * 걸었을 때 사용한다.
 *
 * 캠페인별로 두 갈래다:
 *  - 일별 데이터가 있으면 → 범위로 잘라 합산. 범위 안에 행이 없으면 0 —
 *    그 기간엔 정말 지출이 없었다는 뜻이라 fallback하지 않는다.
 *  - 일별 데이터가 아예 없으면(수동 등록, 아직 backfill 전) → 누적 spend를
 *    그대로 더하고 fallbackCount를 센다. 그 캠페인을 0으로 빼면 "기간 합계"가
 *    조용히 모자라고, 누적을 섞으면 합계가 기간보다 크다 — 어느 쪽이든 숫자만
 *    으로는 거짓이라, 섞되 **몇 건이 섞였는지 화면에 표기할 근거**를 돌려준다.
 *
 * @param {Campaign[]} campaigns - 이미 필터된 캠페인 집합
 * @param {PerformanceRecord[]} performanceRecords - 캠페인당 누적 1건
 * @param {PerformanceDaily[]} performanceDaily
 * @param {{ start?: string, end?: string }} [range]
 * @returns {{ spend: number, fallbackCount: number }}
 */
export function getRangedSpend(campaigns, performanceRecords, performanceDaily, range) {
  const dailyByCampaign = new Map();
  for (const row of performanceDaily) {
    const list = dailyByCampaign.get(row.campaignId) ?? [];
    list.push(row);
    dailyByCampaign.set(row.campaignId, list);
  }

  let spend = 0;
  let fallbackCount = 0;
  for (const campaign of campaigns) {
    const dailyRows = dailyByCampaign.get(campaign.id);
    if (dailyRows?.length) {
      spend += sumDailyMetrics(dailyRows, range).spend;
      continue;
    }
    const record = performanceRecords.find((r) => r.campaignId === campaign.id);
    if (record?.spend != null && record.spend > 0) {
      spend += record.spend;
      fallbackCount += 1;
    }
  }
  return { spend, fallbackCount };
}

/**
 * 날짜 × 캠페인 피벗 — Reports의 Daily spend 표가 그대로 렌더한다.
 *
 * 처음엔 날짜당 합계 한 줄이었는데, "각 캠페인별 데일리는 어디 있나"가 바로
 * 나왔다(실사용 지적). 캠페인별은 상세 드로어에 있었지만 클릭해야 보였고,
 * 원하는 건 클릭 전에 한 표에서 나란히 비교하는 것이었다 — 그래서 캠페인이
 * 컬럼이 된다.
 *
 * columns에는 **범위 안에 일별 행이 있는 캠페인만** 올린다. 없는 캠페인
 * (수동 등록, backfill 전)을 '—'로 가득한 컬럼으로 세우면 표만 넓어진다 —
 * 그 사실은 KPI 옆 fallback 표기가 이미 말한다. 순서는 시작일 오름차순 —
 * 타임라인의 막대 순서와 같은 시간 축이라 두 화면이 같은 순서로 읽힌다.
 *
 * 셀 값이 undefined인 날(그 캠페인이 그날 집행 없음)은 화면에서 '—'로 그린다.
 * $0.00은 "0을 측정했다"는 주장이라 쓰지 않는다.
 *
 * @param {Campaign[]} campaigns - 이미 필터를 거친 캠페인들
 * @param {PerformanceDaily[]} dailyRows - 이미 캠페인 필터를 거친 행들
 * @param {{ start?: string, end?: string }} [range]
 * @returns {{
 *   columns: Array<{ campaignId: string, name: string, platform: string }>,
 *   rows: Array<{ date: string, byCampaign: Object<string, number>, total: number, impressions: number|null, clicks: number|null }>,
 *   totalByCampaign: Object<string, number>,
 *   grandTotal: number,
 * }}
 */
export function buildDailySpendMatrix(campaigns, dailyRows, range) {
  const rowsInRange = dailyRows.filter((r) => isDateInRange(r.date, range));
  const withData = new Set(rowsInRange.map((r) => r.campaignId));
  const columns = campaigns
    .filter((c) => withData.has(c.id))
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : a.platform.localeCompare(b.platform)))
    .map((c) => ({ campaignId: c.id, name: c.name, platform: c.platform }));

  const byDate = new Map();
  for (const row of rowsInRange) {
    const acc = byDate.get(row.date) ?? { date: row.date, byCampaign: {}, total: 0, impressions: null, clicks: null };
    acc.byCampaign[row.campaignId] = (acc.byCampaign[row.campaignId] ?? 0) + row.spend;
    acc.total += row.spend;
    // null 규칙은 sumDailyMetrics와 동일 — 하나라도 값이 있으면 합, 전부 null이면 null.
    if (row.impressions != null) acc.impressions = (acc.impressions ?? 0) + row.impressions;
    if (row.clicks != null) acc.clicks = (acc.clicks ?? 0) + row.clicks;
    byDate.set(row.date, acc);
  }
  const rows = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const totalByCampaign = {};
  for (const col of columns) {
    totalByCampaign[col.campaignId] = rows.reduce((sum, r) => sum + (r.byCampaign[col.campaignId] ?? 0), 0);
  }
  return { columns, rows, totalByCampaign, grandTotal: rows.reduce((sum, r) => sum + r.total, 0) };
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
    hookRate: calcHookRate(record?.hookViews ?? null, record?.videoPlays ?? null),
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
 * @returns {{ campaignId: string, name: string, platform: string, goal: string, spend: number|null, impressions: number|null, reach: number|null, clicks: number|null, engagements: number|null, conversions: number|null, cpm: number|null, ctr: number|null, cpc: number|null, engagementRate: number|null, cpe: number|null, cpa: number|null, videoPlays: number|null, heldViews: number|null, avgWatchSeconds: number|null, likes: number|null, comments: number|null, shares: number|null, follows: number|null, profileVisits: number|null }}
 */
export function getGoalMetricsRow(campaign, record) {
  const spend = record?.spend ?? null;
  const impressions = record?.impressions ?? null;
  const reach = record?.reach ?? null;
  const clicks = record?.clicks ?? null;
  const engagements = record?.engagements ?? null;
  const conversions = record?.conversions ?? null;
  // 참여 수 = 좋아요 + 댓글 + 공유 — cpe의 분모. 플랫폼 engagements 합계와 섞지 않는다(BENCHMARK_METRICS 주석)
  const interactionParts = [record?.likes, record?.comments, record?.shares].map((v) => v ?? null);
  const interactions = interactionParts.some((v) => v != null) ? interactionParts.reduce((a, b) => a + (b ?? 0), 0) : null;

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
    cpe: spend != null ? calcCPE(spend, interactions) : null,
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
    hookRate: calcHookRate(record?.hookViews ?? null, record?.videoPlays ?? null),
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

/**
 * 계획과 실제를 나란히 놓는다. 계획 단계와 실제 캠페인을 **한 줄씩 짝지으려
 * 하지 않는다** — 같은 단계를 플랫폼마다 사람이 따로 이름 짓는 게 이 계정의
 * 기본값이라 억지 매칭은 조용히 틀린 귀속을 만든다. 대신 이벤트 총액을 비교하고
 * 계획 단계 목록과 실제 목록을 각각 그대로 보여준다 — 어긋남은 숨기지 않는다.
 *
 * @param {Plan} plan
 * @param {Campaign[]} campaigns
 * @param {PerformanceRecord[]} performanceRecords
 * @returns {{planned: number|null, actual: number|null, diff: number|null, diffRatio: number|null, campaignCount: number}}
 */
export function planVsActual(plan, campaigns, performanceRecords) {
  const planned = planTotal(plan);
  const matched = campaignsForPlan(plan, campaigns);
  const spends = matched
    .map((c) => performanceRecords.find((r) => r.campaignId === c.id)?.spend)
    .filter((v) => v != null);
  /* 집행 기록이 하나도 없으면 0이 아니라 null — "아직 한 푼도 안 썼다"와
     "성과 기록이 아직 안 들어왔다"는 다른 상태다(이 앱의 공통 규칙). */
  const actual = spends.length > 0 ? spends.reduce((sum, v) => sum + v, 0) : null;
  const diff = planned != null && actual != null ? actual - planned : null;
  return {
    planned,
    actual,
    diff,
    diffRatio: diff != null && planned ? diff / planned : null,
    campaignCount: matched.length,
  };
}


// ============================================================
// Recap — 캠페인 종료 후 결과 보고 (02-ux-flow 시나리오 7, Build Plan Phase 1)
//
// 저장되는 것(EventRecap · RecapCampaignNote · LocalizedText)과 계산 전용
// (BenchmarkStat · RecapCampaignRow · RecapHeadline)을 나눈다. 중앙값·백분위·
// 판정·순위는 전부 여기서만 계산한다 — 컴포넌트는 결과를 props로 받을 뿐
// 안에서 다시 나누지 않는다(Build Plan 분리 원칙).
// ============================================================

/** 보고서 상태 — draft는 편집 중, final은 편집 전 확인이 뜬다 */
export const RECAP_STATUS = Object.freeze({
  DRAFT: 'draft',
  FINAL: 'final',
});

/** 예산 효율 판정 — 이전 보고서의 좋음/보통/아쉬움 */
export const VERDICT = Object.freeze({
  GOOD: 'good',
  MID: 'mid',
  BAD: 'bad',
});

/** Recap 화면 언어. 영어가 기본이고 나머지는 3단계에서 채운다 */
export const RECAP_LANG = Object.freeze({
  EN: 'en',
  KO: 'ko',
  ZH_HANT: 'zh-Hant',
});
export const RECAP_DEFAULT_LANG = RECAP_LANG.EN;

/**
 * 벤치마크 대상 지표 — **비율 지표만**. Reach·조회수 같은 절대값은 예산과 기간에
 * 묶여 있어 캠페인끼리 비교가 안 된다. lowerIsBetter인 지표(비용)는 백분위를
 * 뒤집어 "높을수록 좋음"으로 정규화한다.
 */
export const BENCHMARK_METRICS = Object.freeze([
  { key: 'cpm', lowerIsBetter: true },
  { key: 'cpc', lowerIsBetter: true },
  { key: 'cpa', lowerIsBetter: true },
  // cpe = 지출 ÷ (좋아요 + 댓글 + 공유). 플랫폼이 주는 engagements 합계 필드(Meta는 저장·클릭까지 섞임)는
  // 이 계산에 쓰지 않는다 — 표의 Like·Cmt·Share와 같은 숫자에서 나와야 배지 근거와 표가 일치한다(2026-09-07)
  { key: 'cpe', lowerIsBetter: true },
  { key: 'ctr', lowerIsBetter: false },
  { key: 'hookRate', lowerIsBetter: false },
  { key: 'holdRate', lowerIsBetter: false },
  { key: 'engagementRate', lowerIsBetter: false },
]);

/**
 * goal별 대표 KPI — **하나씩**(2026-09-07). "이 목표를 돈 대비 얼마나 효율적으로 달성했나"를 말하는
 * 결과당 비용이다: 인지 CPM · 트래픽 CPC · 참여 CPE · 전환/매장 방문 CPA. Efficiency 배지, 순위,
 * Key takeaways의 최고/최저, 머리글 순위가 전부 이 하나를 공유해 위아래가 다른 말을 하지 않는다.
 * Hook·Hold·CTR·참여율은 진단 지표 — 셀의 ↗↘와 캠페인 해석(What worked · Could improve)에서만 쓴다.
 */
export const GOAL_HEADLINE_METRICS = Object.freeze({
  [GOAL.AWARENESS]: ['cpm'],
  [GOAL.TRAFFIC]: ['cpc'],
  [GOAL.ENGAGEMENT]: ['cpe'],
  [GOAL.CONVERSION]: ['cpa'],
  [GOAL.STORE_VISIT]: ['cpa'],
});

/**
 * 비교군 최소 수 — 이보다 적으면 벤치마크도, 판정(Good/Fair/Weak)도, 순위("best of N")도 만들지 않는다.
 * 표본이 모자라면 "—"와 "Not enough comparison data"다. 억지로 판정을 만들지 않는다(2026-09-07 원칙).
 */
export const BENCHMARK_MIN_PEERS = 3;
/** 비교 대상 시작일 — 2023년 이전 캠페인은 지표가 거의 없다(실계정 확인) */
export const BENCHMARK_SINCE = '2024-01-01';
/** 판정 제안 경계 — 대표 지표 백분위 평균이 good 이상이면 good, bad 이하면 bad */
export const VERDICT_PERCENTILE = Object.freeze({ good: 70, bad: 30 });

/**
 * @typedef {Object} LocalizedText
 * @property {string} en - 영어. 필수
 * @property {string|null} [ko] - 한국어. 비어 있으면 화면은 en으로 대체하고 isFallback 표시
 * @property {string|null} ['zh-Hant'] - 번체중문. 위와 같음
 */

/**
 * @typedef {Object} EventRecap
 * @property {string} id - UUID v4 PK
 * @property {string} eventName - campaigns.campaign_group과 같은 값. owner 안에서 unique
 * @property {'draft'|'final'} status
 * @property {LocalizedText|null} summary - 머리글 아래 한 단락
 * @property {Array<{ title: LocalizedText, body: LocalizedText }>} learnings - "배운 점" 카드 목록
 * @property {LocalizedText|null} nextSteps - 다음 캠페인 제언
 * @property {string} createdAt - ISO 8601 datetime
 * @property {string} updatedAt - ISO 8601 datetime
 */

/**
 * @typedef {Object} RecapCampaignNote
 * @property {string} id - UUID v4 PK
 * @property {string} recapId - FK → EventRecap.id
 * @property {string} campaignId - FK → Campaign.id. (recapId, campaignId) unique
 * @property {'good'|'mid'|'bad'|null} verdict - 예산 효율 판정. null이면 화면은 suggestedVerdict를 점선 칩으로 보여준다
 * @property {LocalizedText|null} strength - 장점
 * @property {LocalizedText|null} weakness - 아쉬운 점
 * @property {LocalizedText|null} reason - 이유
 * @property {number|null} organicViews - 계정 전체(오가닉) 조회 — 광고 API에 없어 선택 입력(3단계)
 * @property {number|null} organicEngagements - 계정 전체(오가닉) 참여 — 위와 같음
 */

/**
 * 계산 전용 — 지표 하나의 벤치마크 결과.
 * @typedef {Object} BenchmarkStat
 * @property {string} metricKey - BENCHMARK_METRICS의 key
 * @property {number|null} value - 이 캠페인의 값
 * @property {number|null} median - 비교군 중앙값. sampleSize < BENCHMARK_MIN_PEERS면 null
 * @property {number|null} percentile - 0~100, "높을수록 좋음"으로 정규화. 위와 같은 조건에서 null
 * @property {number} sampleSize - 값이 있는 비교 캠페인 수
 * @property {boolean} lowerIsBetter
 * @property {'phase'|'goal'|'none'} peerScope - 비교군을 어떤 기준으로 잡았나
 * @property {'top'|'mid'|'bottom'|null} band - 백분위 구간(VERDICT_PERCENTILE 기준). 컴포넌트가 톤·화살표를 고르는 근거 — 경계값을 컴포넌트가 알지 않게 여기서 정한다
 */

/**
 * 계산 전용 — Recap 표 한 행. getGoalMetricsRow의 모든 필드 + 아래.
 * @typedef {Object} RecapCampaignRowExtra
 * @property {string} storeCode - 타겟 매장 코드(여러 개면 ", "로 이어 붙임, 전체면 "All")
 * @property {string} phaseName - phaseNameOf(name)
 * @property {string} startDate
 * @property {string} endDate
 * @property {number|null} dailyBudget
 * @property {number} rank - 같은 플랫폼 안에서 1부터
 * @property {Object<string, BenchmarkStat>} benchmarks - BENCHMARK_METRICS key → BenchmarkStat
 * @property {null} suggestedVerdict - 자동 판정 없음(2026-09-07). 사람이 고른 판정은 note.verdict
 * @property {{ metricKey: string|null, value: number|null }} budgetEfficiency - 이 캠페인의 목표별 결과당 비용(과거·비교군 무관)
 * @property {RecapCampaignNote|null} note
 */

/**
 * 계산 전용 — 머리글 한 줄의 재료. 문장은 recapStrings가 만든다.
 * @typedef {Object} RecapHeadline
 * @property {string} metricKey - 순위를 매긴 대표 지표
 * @property {number} rank - 1부터
 * @property {number} total - 이 이벤트를 포함한 비교 이벤트 수
 * @property {string[]} peerEvents - 순위순 이벤트 이름(이 이벤트 포함)
 */

/** 이름 끝의 기간 접미사 — `_0617~0707`, ` _0706 ~ 0801`, `-0710-0831` */
const PHASE_DATE_SUFFIX_PATTERN = /[\s_\-–—]*\d{4}\s*[~\-–—]\s*\d{4}\s*$/;
/** 이름 앞의 매장·이벤트 코드 — `G10_`, `BF2 `, `G01-` (매장 코드 규칙과 같은 꼴) */
const PHASE_CODE_PREFIX_PATTERN = /^[A-Za-z]{1,3}\d{1,3}[\s_\-–—]+/;

/**
 * 캠페인 이름에서 사람이 부르는 단계 이름만 남긴다 — `G10_Coming Soon_0617~0707`
 * → `Coming Soon`. 매장 코드와 기간은 다른 자리(Event 필터·타임라인 막대)가
 * 말하므로 이름에서 뺀다. 벗겨낸 뒤 아무것도 안 남으면 원본을 그대로 쓴다.
 *
 * PhaseTimelineChart의 첫 줄 표시와 Recap 벤치마크의 "같은 단계끼리" 판정이
 * 같은 규칙을 써야 한다 — 한쪽만 고치면 화면에 같은 이름으로 보이는 두 캠페인이
 * 벤치마크에서는 다른 단계로 갈린다.
 *
 * @param {string|{name: string}} nameOrCampaign - 캠페인 이름 또는 캠페인
 * @returns {string}
 */
export function phaseNameOf(nameOrCampaign) {
  const name = typeof nameOrCampaign === 'string' ? nameOrCampaign : (nameOrCampaign?.name ?? '');
  const cleaned = (name ?? '')
    .replace(PHASE_DATE_SUFFIX_PATTERN, '')
    .replace(PHASE_CODE_PREFIX_PATTERN, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || name || '';
}

/**
 * 단계 비교 키 — phaseNameOf를 소문자·구분자 정리한 값. 화면 표시에는 쓰지 않는다.
 * @param {string|{name: string}} nameOrCampaign
 * @returns {string}
 */
export function phaseKey(nameOrCampaign) {
  return campaignNameKey(phaseNameOf(nameOrCampaign));
}

/**
 * 중앙값. 빈 배열이면 null.
 * @param {number[]} values
 * @returns {number|null}
 */
export function median(values) {
  const sorted = (values ?? []).filter((v) => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * 비교군 안에서 이 값의 백분위(0~100). "높을수록 좋음"으로 정규화한다 — 비용
 * 지표(lowerIsBetter)는 값이 낮을수록 백분위가 높다. 동점은 절반으로 센다.
 * 비교군이 비거나 값이 없으면 null.
 *
 * @param {number[]} values - 비교군 값
 * @param {number|null} value - 이 캠페인의 값
 * @param {boolean} [lowerIsBetter=false]
 * @returns {number|null}
 */
export function percentileRank(values, value, lowerIsBetter = false) {
  const peers = (values ?? []).filter((v) => v != null && Number.isFinite(v));
  if (value == null || !Number.isFinite(value) || peers.length === 0) return null;
  let worse = 0;
  let equal = 0;
  peers.forEach((v) => {
    if (v === value) equal += 1;
    else if (lowerIsBetter ? v > value : v < value) worse += 1;
  });
  return Math.round(((worse + equal / 2) / peers.length) * 100);
}

/**
 * 비교군을 고른다 — 같은 platform, **다른 이벤트**, BENCHMARK_SINCE 이후 시작.
 * 1순위는 같은 단계 이름(phaseKey), 3개 미만이면 같은 goal, 그래도 미만이면 none.
 * Meta와 TikTok은 Hook 정의가 달라 절대 섞지 않는다.
 *
 * @param {Campaign} campaign
 * @param {Campaign[]} allCampaigns - 탭·필터와 무관한 전체 목록
 * @param {{ since?: string, region?: string|null, accountRegionById?: Object<string, string> }} [options] - region을 주면 같은 지역 계정(accountRegionById로 판정)만
 * @returns {{ peers: Campaign[], scope: 'phase'|'goal'|'none' }}
 */
export function buildBenchmarkPeers(campaign, allCampaigns, options = {}) {
  const { since = BENCHMARK_SINCE, region = null, accountRegionById = {} } = options;
  const selfEvent = campaignNameKey(campaignGroupKey(campaign));
  const base = (allCampaigns ?? []).filter((c) =>
    c.id !== campaign.id
    && c.platform === campaign.platform
    && campaignNameKey(campaignGroupKey(c)) !== selfEvent
    && (c.startDate ?? '') >= since
    && (!region || accountRegionById[c.accountId] === region)
  );
  /* 비교군 사슬(2026-09-07): 목표가 먼저다 — 결과당 비용(CPM·CPC·CPE·CPA)은 목표가 같아야 비교가 성립한다.
     ① 같은 플랫폼 + 같은 목표 + 같은 단계(다른 이벤트) ② 같은 플랫폼 + 같은 목표(다른 이벤트) ③ 3개 미만이면 없음.
     같은 이벤트의 형제 캠페인은 어느 단계에도 안 들어간다(base가 이미 뺀다). 배지·셀의 ↗↘·Key takeaways가
     전부 이 한 비교군을 공유한다 — 배지는 Weak인데 셀은 best of 5인 모순을 막는다 */
  const sameGoal = base.filter((c) => c.goal === campaign.goal);
  const sameGoalPhase = sameGoal.filter((c) => phaseKey(c) === phaseKey(campaign));
  if (sameGoalPhase.length >= BENCHMARK_MIN_PEERS) return { peers: sameGoalPhase, scope: 'phase' };
  if (sameGoal.length >= BENCHMARK_MIN_PEERS) return { peers: sameGoal, scope: 'goal' };
  return { peers: [], scope: 'none' };
}

/**
 * 지표 하나의 벤치마크. 비교군에서 값이 없는 행은 표본에서 뺀다.
 *
 * @param {string} metricKey - BENCHMARK_METRICS의 key
 * @param {number|null} value - 이 캠페인의 값
 * @param {Array<Object>} peerRows - getGoalMetricsRow 결과 배열
 * @param {'phase'|'goal'|'none'} [peerScope='none']
 * @returns {BenchmarkStat}
 */
export function benchmarkStat(metricKey, value, peerRows, peerScope = 'none') {
  const meta = BENCHMARK_METRICS.find((m) => m.key === metricKey);
  const lowerIsBetter = meta?.lowerIsBetter ?? false;
  const peerValues = (peerRows ?? []).map((r) => r?.[metricKey]).filter((v) => v != null && Number.isFinite(v));
  const enough = peerScope !== 'none' && peerValues.length >= BENCHMARK_MIN_PEERS;
  const percentile = enough ? percentileRank(peerValues, value, lowerIsBetter) : null;
  return {
    metricKey,
    value: value ?? null,
    median: enough ? median(peerValues) : null,
    percentile,
    sampleSize: peerValues.length,
    lowerIsBetter,
    peerScope: enough ? peerScope : 'none',
    band: percentileBand(percentile),
  };
}

/**
 * 백분위 → 구간. 판정(suggestVerdict)과 같은 경계를 쓴다 — 표의 셀 색과 판정 칩이
 * 서로 다른 말을 하지 않게.
 * @param {number|null} percentile
 * @returns {'top'|'mid'|'bottom'|null}
 */
export function percentileBand(percentile) {
  if (percentile == null) return null;
  if (percentile >= VERDICT_PERCENTILE.good) return 'top';
  if (percentile <= VERDICT_PERCENTILE.bad) return 'bottom';
  return 'mid';
}

/**
 * goal별 대표 지표의 백분위 평균으로 판정을 제안한다. 대표 지표가 전부
 * not enough data면 null — 근거 없는 판정은 만들지 않는다.
 *
 * @param {Object<string, BenchmarkStat>} benchmarks
 * @param {string} goal
 * @returns {'good'|'mid'|'bad'|null}
 */
export function suggestVerdict(benchmarks, goal) {
  const keys = GOAL_HEADLINE_METRICS[goal] ?? [];
  const pcts = keys.map((k) => benchmarks?.[k]?.percentile).filter((p) => p != null);
  if (pcts.length === 0) return null;
  const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  if (avg >= VERDICT_PERCENTILE.good) return VERDICT.GOOD;
  if (avg <= VERDICT_PERCENTILE.bad) return VERDICT.BAD;
  return VERDICT.MID;
}

/** 캠페인 하나의 성과 레코드 — 여러 개면 recordedAt이 늦은 것(없으면 마지막) */
function latestRecordFor(campaignId, records) {
  const mine = (records ?? []).filter((r) => r.campaignId === campaignId);
  if (mine.length === 0) return undefined;
  return mine.reduce((best, r) => ((r.recordedAt ?? '') >= (best.recordedAt ?? '') ? r : best), mine[0]);
}

/** 대표 지표 백분위 평균 — 정렬 점수. 하나도 없으면 -1(맨 뒤) */
function headlineScore(benchmarks, goal) {
  const keys = GOAL_HEADLINE_METRICS[goal] ?? [];
  const pcts = keys.map((k) => benchmarks?.[k]?.percentile).filter((p) => p != null);
  return pcts.length === 0 ? -1 : pcts.reduce((a, b) => a + b, 0) / pcts.length;
}

/** 타겟 매장 표기 — 표의 Store 열 */
function storeCodeOf(campaign) {
  if (campaign.targetScope === TARGET_SCOPE.ALL_STORES || !(campaign.targetStoreIds?.length)) return 'All';
  return campaign.targetStoreIds.join(', ');
}

/**
 * 이벤트 하나의 Recap 표 데이터 — 캠페인마다 지표 행 + 벤치마크 + 판정 제안,
 * 플랫폼별로 대표 지표 백분위 순으로 정렬해 순위를 매긴다. 컴포넌트는 이
 * 결과를 그대로 그린다.
 *
 * @param {string} eventName - campaigns.campaignGroup 값
 * @param {Campaign[]} allCampaigns - 전체 캠페인(이 이벤트 + 비교군 후보)
 * @param {PerformanceRecord[]} allRecords - 전체 성과 레코드
 * @param {{ notesById?: Object<string, RecapCampaignNote>, since?: string, region?: string|null, accountRegionById?: Object<string, string> }} [options]
 * @returns {{ byPlatform: Object<string, Array<Object>>, campaigns: Campaign[], peerEvents: string[] }}
 */
export function buildRecapRows(eventName, allCampaigns, allRecords, options = {}) {
  const { notesById = {}, ...peerOptions } = options;
  const eventKey = campaignNameKey(eventName);
  const eventCampaigns = (allCampaigns ?? []).filter((c) => campaignNameKey(campaignGroupKey(c)) === eventKey);
  const peerEventNames = new Set();

  const rows = eventCampaigns.map((c) => {
    const row = getGoalMetricsRow(c, latestRecordFor(c.id, allRecords));
    const { peers, scope } = buildBenchmarkPeers(c, allCampaigns, peerOptions);
    peers.forEach((p) => peerEventNames.add(campaignGroupKey(p)));
    const peerRows = peers.map((p) => getGoalMetricsRow(p, latestRecordFor(p.id, allRecords)));
    const benchmarks = Object.fromEntries(
      BENCHMARK_METRICS.map((m) => [m.key, benchmarkStat(m.key, row[m.key], peerRows, scope)])
    );
    return {
      ...row,
      storeCode: storeCodeOf(c),
      phaseName: phaseNameOf(c),
      startDate: c.startDate,
      endDate: c.endDate,
      dailyBudget: c.budgetDaily ?? null,
      // 집행률(pacing)은 성과와 별개의 운영 상태 — 표는 계획 대비 크게 벗어날 때만 작게 보인다(RECAP_PACING_FLAG)
      plannedBudget: effectiveBudgetPlanned(c),
      pacingRatio: row.spend != null && effectiveBudgetPlanned(c) > 0 ? row.spend / effectiveBudgetPlanned(c) : null,
      thumbnailUrl: c.thumbnailUrl ?? null,
      rank: 0,
      benchmarks,
      // 세 층을 섞지 않는다: budgetEfficiency = 이 캠페인의 결과당 비용(과거 무관) · benchmarks = 과거 비교 · pacingRatio = 계획 대비 집행
      budgetEfficiency: budgetEfficiency(row, c.goal),
      // 자동 판정(Good/Fair/Weak)은 없다 — 사람이 고른 note.verdict만 남는다
      suggestedVerdict: null,
      note: notesById[c.id] ?? null,
    };
  });

  const byPlatform = {};
  rows.forEach((r) => { (byPlatform[r.platform] ??= []).push(r); });
  Object.values(byPlatform).forEach((list) => {
    list
      .sort((a, b) => {
        const diff = headlineScore(b.benchmarks, b.goal) - headlineScore(a.benchmarks, a.goal);
        return diff !== 0 ? diff : (b.spend ?? 0) - (a.spend ?? 0);
      })
      .forEach((r, i) => { r.rank = i + 1; });
  });

  return { byPlatform, campaigns: eventCampaigns, peerEvents: [...peerEventNames].sort() };
}

/**
 * 이벤트 단위 대표 지표 — 비율끼리 평균 내지 않고 분자·분모를 합쳐 다시 나눈다.
 * @param {Array<Object>} rows - getGoalMetricsRow 결과 배열
 * @param {string} metricKey
 * @returns {number|null}
 */
function aggregateMetric(rows, metricKey) {
  const sum = (key) => rows.reduce((acc, r) => (r[key] != null ? (acc ?? 0) + r[key] : acc), null);
  switch (metricKey) {
    case 'cpm': return calcCPM(sum('spend'), sum('impressions'));
    case 'cpc': return calcCPC(sum('spend'), sum('clicks'));
    case 'cpa': return calcCPA(sum('spend'), sum('conversions'));
    case 'ctr': return calcCTR(sum('clicks'), sum('impressions'));
    case 'hookRate': return calcHookRate(sum('hookViews'), sum('videoPlays'));
    case 'holdRate': return calcHoldRate(sum('heldViews'), sum('hookViews'));
    case 'engagementRate': return calcEngagementRate(sum('engagements'), sum('impressions'));
    case 'cpe': {
      const interactions = ['likes', 'comments', 'shares'].map(sum);
      return interactions.every((v) => v == null) ? null : calcCPE(sum('spend'), interactions.reduce((a, b) => a + (b ?? 0), 0));
    }
    default: return null;
  }
}

/**
 * 머리글 순위 — "역대 오프닝 5개 중 CPM 2위". 이 이벤트의 가장 흔한 goal의
 * 첫 대표 지표로, 단계 구성이 하나라도 겹치는 다른 이벤트들과 이벤트 단위로
 * 비교한다. 이 이벤트를 포함해 3개 미만이면 null.
 *
 * @param {string} eventName
 * @param {Campaign[]} allCampaigns
 * @param {PerformanceRecord[]} allRecords
 * @param {{ since?: string }} [options]
 * @returns {RecapHeadline|null}
 */
export function buildRecapHeadline(eventName, allCampaigns, allRecords, options = {}) {
  const { since = BENCHMARK_SINCE } = options;
  const eventKey = campaignNameKey(eventName);
  const byEvent = new Map();
  (allCampaigns ?? []).forEach((c) => {
    const key = campaignNameKey(campaignGroupKey(c));
    if (key !== eventKey && (c.startDate ?? '') < since) return;
    if (!byEvent.has(key)) byEvent.set(key, { name: campaignGroupKey(c), campaigns: [] });
    byEvent.get(key).campaigns.push(c);
  });
  const self = byEvent.get(eventKey);
  if (!self || self.campaigns.length === 0) return null;

  const goalCounts = {};
  self.campaigns.forEach((c) => { goalCounts[c.goal] = (goalCounts[c.goal] ?? 0) + 1; });
  const goal = Object.entries(goalCounts).sort((a, b) => b[1] - a[1])[0][0];
  const metricKey = (GOAL_HEADLINE_METRICS[goal] ?? [])[0];
  if (!metricKey) return null;
  const lowerIsBetter = BENCHMARK_METRICS.find((m) => m.key === metricKey)?.lowerIsBetter ?? false;

  const selfPhases = new Set(self.campaigns.map((c) => phaseKey(c)));
  const scored = [...byEvent.values()]
    .filter((e) => e === self || e.campaigns.some((c) => selfPhases.has(phaseKey(c))))
    .map((e) => ({
      name: e.name,
      value: aggregateMetric(e.campaigns.map((c) => getGoalMetricsRow(c, latestRecordFor(c.id, allRecords))), metricKey),
    }))
    .filter((e) => e.value != null);
  if (scored.length < BENCHMARK_MIN_PEERS || !scored.some((e) => e.name === self.name)) return null;

  scored.sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value));
  return {
    metricKey,
    rank: scored.findIndex((e) => e.name === self.name) + 1,
    total: scored.length,
    peerEvents: scored.map((e) => e.name),
  };
}

/**
 * 언어별 문장에서 요청 언어를 꺼낸다. 비어 있으면 en으로 대체하고 isFallback을
 * 켠다 — 컴포넌트는 이 결과만 받고 언어 판단을 직접 하지 않는다.
 *
 * @param {LocalizedText|null|undefined} text
 * @param {string} [lang=RECAP_DEFAULT_LANG]
 * @returns {{ value: string, isFallback: boolean }}
 */
export function localizedText(text, lang = RECAP_DEFAULT_LANG) {
  if (!text) return { value: '', isFallback: false };
  const requested = text[lang];
  if (requested) return { value: requested, isFallback: false };
  return { value: text[RECAP_DEFAULT_LANG] ?? '', isFallback: lang !== RECAP_DEFAULT_LANG };
}

/**
 * Recap 목록 한 줄 — 이벤트(campaignGroup)별 기간·캠페인 수·지출·보고서 상태.
 * 태그 없는 캠페인(campaignGroup 없음/Unassigned)은 이벤트가 아니라 뺀다.
 * 최근 끝난 이벤트가 위로 온다.
 *
 * @param {Campaign[]} campaigns
 * @param {PerformanceRecord[]} records
 * @param {EventRecap[]} [eventRecaps=[]]
 * @returns {Array<{ eventName: string, startDate: string, endDate: string, campaignCount: number, spend: number|null, platforms: string[], stores: string[], status: 'draft'|'final'|null }>}
 */
export function buildRecapEvents(campaigns, records, eventRecaps = []) {
  const byEvent = new Map();
  (campaigns ?? []).forEach((c) => {
    if (!c.campaignGroup || isUnassignedEvent(c.campaignGroup)) return;
    const key = campaignNameKey(c.campaignGroup);
    if (!byEvent.has(key)) byEvent.set(key, { eventName: c.campaignGroup, campaigns: [] });
    byEvent.get(key).campaigns.push(c);
  });
  const recapByKey = new Map((eventRecaps ?? []).map((r) => [campaignNameKey(r.eventName), r]));

  return [...byEvent.entries()]
    .map(([key, { eventName, campaigns: list }]) => {
      const spends = list.map((c) => latestRecordFor(c.id, records)?.spend).filter((v) => v != null);
      return {
        eventName,
        startDate: list.reduce((min, c) => (c.startDate < min ? c.startDate : min), list[0].startDate),
        endDate: list.reduce((max, c) => (c.endDate > max ? c.endDate : max), list[0].endDate),
        campaignCount: list.length,
        spend: spends.length > 0 ? spends.reduce((a, b) => a + b, 0) : null,
        // 플랫폼 순서는 데이터 순서가 아니라 PLATFORM 선언 순서 — 동기화 순서에 따라 "TikTok + Meta"로 흔들리지 않게
        platforms: Object.values(PLATFORM).filter((p) => list.some((c) => c.platform === p)),
        stores: [...new Set(list.flatMap((c) => c.targetStoreIds ?? []))].sort(),
        status: recapByKey.get(key)?.status ?? null,
      };
    })
    .sort((a, b) => (a.endDate < b.endDate ? 1 : a.endDate > b.endDate ? -1 : 0));
}

/**
 * 캠페인 하나와 그 비교군을 나란히 놓는 표 데이터(Recap의 "비교군 보기").
 * 벤치마크는 중앙값 하나만 말하는데, "BF4 Grand Opening보다 나았나"처럼 개별
 * 캠페인과 맞대고 싶을 때 쓴다. 주인공 행이 맨 앞이고, 나머지는 initialMetricKey
 * 기준 좋은 순서다(비용 지표는 낮은 게 앞).
 *
 * @param {Campaign} campaign - 주인공
 * @param {Campaign[]} allCampaigns
 * @param {PerformanceRecord[]} allRecords
 * @param {{ metricKey?: string, since?: string, region?: string|null, accountRegionById?: Object<string, string> }} [options]
 * @returns {{ scope: 'phase'|'goal'|'none', rows: Array<Object> }} rows[i] = getGoalMetricsRow + { eventName, phaseName, startDate, endDate, isSubject }
 */
export function buildPeerComparison(campaign, allCampaigns, allRecords, options = {}) {
  const { metricKey = null, ...peerOptions } = options;
  const { peers, scope } = buildBenchmarkPeers(campaign, allCampaigns, peerOptions);
  /* 지표 하나에서 주인공이 몇 등인지 — "#1 of 12". 값이 있는 행만 세고, 비용 지표는 낮은 값이 앞.
     표의 "best of 12"와 같은 비교군·같은 값에서 나오므로 대화상자와 표가 다른 말을 하지 않는다 */
  const rankOf = (rows, key) => {
    if (!key) return null;
    const lower = BENCHMARK_METRICS.find((m) => m.key === key)?.lowerIsBetter ?? false;
    const subjectValue = rows.find((r) => r.isSubject)?.[key];
    const valued = rows.filter((r) => r[key] != null && Number.isFinite(r[key]));
    if (subjectValue == null || valued.length < 2) return null;
    const better = valued.filter((r) => !r.isSubject && (lower ? r[key] < subjectValue : r[key] > subjectValue)).length;
    return { rank: better + 1, total: valued.length, value: subjectValue, lowerIsBetter: lower };
  };
  const toRow = (c, isSubject) => ({
    ...getGoalMetricsRow(c, latestRecordFor(c.id, allRecords)),
    eventName: campaignGroupKey(c),
    phaseName: phaseNameOf(c),
    startDate: c.startDate,
    endDate: c.endDate,
    isSubject,
  });
  const lowerIsBetter = BENCHMARK_METRICS.find((m) => m.key === metricKey)?.lowerIsBetter ?? false;
  const peerRows = peers.map((c) => toRow(c, false)).sort((a, b) => {
    const av = metricKey ? a[metricKey] : null;
    const bv = metricKey ? b[metricKey] : null;
    if (av == null && bv == null) return (b.spend ?? 0) - (a.spend ?? 0);
    if (av == null) return 1;
    if (bv == null) return -1;
    return lowerIsBetter ? av - bv : bv - av;
  });
  const rows = [toRow(campaign, true), ...peerRows];
  const primaryMetricKey = (GOAL_HEADLINE_METRICS[campaign.goal] ?? [])[0] ?? null;
  return {
    scope,
    rows,
    platform: campaign.platform,
    goal: campaign.goal,
    phaseName: phaseNameOf(campaign),
    peerCount: peerRows.length,
    primaryMetricKey,
    primary: scope === 'none' ? null : rankOf(rows, primaryMetricKey),
    selectedMetricKey: metricKey,
    selected: scope === 'none' || !metricKey || metricKey === primaryMetricKey ? null : rankOf(rows, metricKey),
  };
}

/**
 * 핵심 요약(Key takeaways)의 **재료** — 문장은 recapStrings가 만든다. 표에 이미
 * 있는 숫자를 반복하지 않고 해석만 남긴다: 가장 좋았던 캠페인, 뒤처진 캠페인,
 * 플랫폼 차이(비교 가능한 CPM만), 다음 제언. 최대 4개.
 *
 * 근거가 없으면 만들지 않는다 — 벤치마크가 하나도 없는 이벤트는 빈 배열이다.
 *
 * @param {Object<string, Array<Object>>} byPlatform - buildRecapRows().byPlatform
 * @returns {Array<{ kind: 'best'|'weakest'|'platform'|'recommendation', campaignId?: string, platform?: string, phaseName?: string, goal?: string, metricKey?: string, metricKeys?: string[], stat?: BenchmarkStat, cheaper?: string, pricier?: string, pct?: number, weakPlatform?: string, weakPhaseName?: string }>}
 */
export function buildRecapTakeaways(byPlatform) {
  const rows = Object.values(byPlatform ?? {}).flat();
  const scored = rows
    .map((row) => ({ row, score: headlineScore(row.benchmarks, row.goal), keys: GOAL_HEADLINE_METRICS[row.goal] ?? [] }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);
  const items = [];

  // 대표 지표 중 백분위가 가장 높은/낮은 것 — 문장에 붙일 근거 하나
  const pickStat = (entry, isBest) => entry.keys
    .map((k) => entry.row.benchmarks?.[k])
    .filter((b) => b && b.percentile != null)
    .sort((a, b) => (isBest ? b.percentile - a.percentile : a.percentile - b.percentile))[0] ?? null;

  const best = scored[0] ?? null;
  const bestStat = best ? pickStat(best, true) : null;
  if (best && bestStat) {
    items.push({ kind: 'best', campaignId: best.row.campaignId, platform: best.row.platform, phaseName: best.row.phaseName, goal: best.row.goal, metricKey: bestStat.metricKey, stat: bestStat });
  }

  // 뒤처진 캠페인 — 대표 지표 중 하나라도 하위 구간이어야 한다(그냥 2등을 지목하지 않는다)
  const weakest = scored.length >= 2 ? scored[scored.length - 1] : null;
  const weakKeys = weakest ? weakest.keys.filter((k) => weakest.row.benchmarks?.[k]?.band === 'bottom') : [];
  const weakStat = weakest ? pickStat(weakest, false) : null;
  if (weakest && weakKeys.length > 0 && weakStat) {
    items.push({ kind: 'weakest', campaignId: weakest.row.campaignId, platform: weakest.row.platform, phaseName: weakest.row.phaseName, goal: weakest.row.goal, metricKeys: weakKeys, stat: weakStat });
  }

  // 플랫폼 차이 — 정의가 같은 CPM으로만, 이벤트 단위 합산(분자·분모)으로, 15% 이상 벌어질 때만
  const platforms = Object.keys(byPlatform ?? {}).filter((p) => (byPlatform[p] ?? []).length > 0);
  if (platforms.length >= 2) {
    const cpmByPlatform = platforms
      .map((p) => ({ platform: p, cpm: aggregateMetric(byPlatform[p], 'cpm') }))
      .filter((x) => x.cpm != null && x.cpm > 0)
      .sort((a, b) => a.cpm - b.cpm);
    if (cpmByPlatform.length >= 2) {
      const [cheaper, pricier] = [cpmByPlatform[0], cpmByPlatform[cpmByPlatform.length - 1]];
      const pct = Math.round((1 - cheaper.cpm / pricier.cpm) * 100);
      if (pct >= 15) items.push({ kind: 'platform', cheaper: cheaper.platform, pricier: pricier.platform, pct });
    }
  }

  if (best && bestStat) {
    const hasWeak = items.some((i) => i.kind === 'weakest');
    items.push({
      kind: 'recommendation',
      platform: best.row.platform,
      phaseName: best.row.phaseName,
      weakPlatform: hasWeak ? weakest.row.platform : null,
      weakPhaseName: hasWeak ? weakest.row.phaseName : null,
    });
  }
  return items.slice(0, 4);
}

// ============================================================
// Recap — 데이터 기반 캠페인 해석(Strength · Weakness · Why)과 이벤트 단위 패턴
//
// 원칙: 숫자는 "무엇이 일어났나"만 말한다. 이유(소재·타겟·메시지·피로도)는
// 데이터에 없으므로 **절대 지어내지 않는다**. 각 문장은 근거 수준을 달고 나간다 —
//   observed : 지표 값 자체
//   compared : 비교군 순위·백분위
//   inferred : 관측된 패턴의 해석("~일 수 있다") — 불확실성을 문장에 남긴다
//   unknown  : 근거 부족
// 문장은 recapStrings가 만들고 여기는 재료(종류·지표·근거)만 돌려준다.
// ============================================================

/** 지표 → 그 지표가 말하는 것(문장의 "무엇"). 문구 키는 recapStrings의 aspect.* */
/** 계획 대비 집행률을 표에 표시하는 문턱 — +20% 이상 초과 또는 −30% 이하 미달일 때만. 그 안은 조용히 */
export const RECAP_PACING_FLAG = Object.freeze({ over: 1.2, under: 0.7 });

/**
 * 예산 효율 — "이 캠페인이 쓴 돈으로 목표에 맞는 결과 하나에 얼마가 들었나"(2026-09-07). **이 캠페인의 지출과 결과만**으로
 * 계산한다: 인지 CPM · 트래픽 CPC · 참여 참여당 비용(지출 ÷ 좋아요+댓글+공유) · 전환/매장 방문 CPA. 과거 캠페인·중앙값·
 * 업계 기준·비교군은 여기 들어오지 않는다 — 그것은 별개 층인 과거 비교(benchmarks, "best of 12")의 일이고, 계획 예산 대비
 * 집행률(pacingRatio)은 또 다른 층이다. 그래서 비교군이 없어도 값은 항상 있다(성과 데이터가 없을 때만 null).
 * Good/Fair/Weak 자동 판정은 없다 — 값 자체가 답이다(사람이 Edit에서 고른 판정은 note.verdict에 따로 남는다).
 * @param {Object} row - getGoalMetricsRow() 결과(cpm/cpc/cpe/cpa 포함)
 * @param {string} goal
 * @returns {{ metricKey: string|null, value: number|null }}
 */
export function budgetEfficiency(row, goal) {
  const metricKey = (GOAL_HEADLINE_METRICS[goal] ?? [])[0] ?? null;
  const value = metricKey ? row?.[metricKey] : null;
  return { metricKey, value: value != null && Number.isFinite(value) ? value : null };
}

export const METRIC_ASPECT = Object.freeze({
  cpm: 'reach',
  cpc: 'click',
  ctr: 'click',
  cpa: 'result',
  hookRate: 'hook',
  holdRate: 'hold',
  engagementRate: 'engagement', cpe: 'engagement' });

/** 근거 수준 */
export const INSIGHT_LEVEL = Object.freeze({
  OBSERVED: 'observed',
  COMPARED: 'compared',
  INFERRED: 'inferred',
  UNKNOWN: 'unknown',
});

/** 지출이 계획을 이만큼 넘으면 관측 사실로 적는다 */
const OVERSPEND_RATIO = 0.2;

/** 비교군이 있는 벤치마크만 */
const knownStats = (row) => Object.values(row.benchmarks ?? {}).filter((b) => b && b.peerScope !== 'none' && b.percentile != null);

/**
 * 임원용 핵심 요약 세 칸 — buildRecapTakeaways()의 재료를 BEST RESULT / ATTENTION / NEXT MOVE로
 * 합성한다. "플랫폼 차이"는 칸을 따로 갖지 않고 NEXT MOVE의 근거로 들어간다. 계산은
 * 새로 하지 않는다 — 벤치마크·순위는 이미 takeaways 재료에 있다.
 *
 * @param {Object<string, Array<RecapCampaignRowExtra>>} byPlatform
 * @returns {{ best: Object|null, attention: Object|null, next: Object|null }}
 *   best      { platform, phaseName, metricKey, aspect, stat }
 *   attention { platform, phaseName, metricKey, aspect, stat } | null (하위 구간 캠페인 없음)
 *   next      { kind: 'platform'|'best', cheaper?, pricier?, pct?, platform?, phaseName?, weakPlatform?, weakPhaseName? } | null
 */
export function buildRecapExecutiveSummary(byPlatform) {
  const items = buildRecapTakeaways(byPlatform);
  const by = (kind) => items.find((i) => i.kind === kind) ?? null;
  const bestItem = by('best');
  const weakItem = by('weakest');
  const platformItem = by('platform');
  const rec = by('recommendation');

  const best = bestItem
    ? { platform: bestItem.platform, phaseName: bestItem.phaseName, metricKey: bestItem.metricKey, aspect: METRIC_ASPECT[bestItem.metricKey], stat: bestItem.stat }
    : null;
  const attention = weakItem
    ? { platform: weakItem.platform, phaseName: weakItem.phaseName, metricKey: weakItem.stat.metricKey, aspect: METRIC_ASPECT[weakItem.stat.metricKey], stat: weakItem.stat }
    : null;
  let next = null;
  if (platformItem) {
    next = { kind: 'platform', cheaper: platformItem.cheaper, pricier: platformItem.pricier, pct: platformItem.pct, weakPlatform: rec?.weakPlatform ?? null, weakPhaseName: rec?.weakPhaseName ?? null };
  } else if (rec) {
    next = { kind: 'best', platform: rec.platform, phaseName: rec.phaseName, weakPlatform: rec.weakPlatform, weakPhaseName: rec.weakPhaseName };
  }
  return { best, attention, next };
}

/**
 * Learnings의 **다음 이벤트 플레이북** — buildRecapPatterns()의 재료를 KEEP / USE SELECTIVELY /
 * IMPROVE / VALIDATE 네 칸과 NEXT EVENT 한 줄로 합성한다. 회고 요약(Key takeaways)을 반복하지
 * 않고 "다음에 무엇을 반복하고 무엇을 바꿀지"만 말한다. 계산은 새로 하지 않는다 —
 * 근거는 전부 패턴 재료(같은 방향 캠페인 2개 이상, 이벤트 단위 플랫폼 CPM·CTR 차이)다.
 *
 * 칸을 채울 근거가 없으면 null — 지어내지 않는다(칸이 빈다).
 *   keep          { kind: 'platformReach'|'platformBoth'|'phase'|'strong', … }
 *   useSelectively{ kind: 'platformClicks'|'platformOther', … }
 *   improve       { kind: 'weak', aspect, metricKey, count, total }
 *   validate      { kind: 'mixed'|'uncovered', aspect, … }
 *   nextEvent     { kind: 'split'|'lean'|'phase', …, validateAspects: string[] } | null
 *
 * @param {Object<string, Array<RecapCampaignRowExtra>>} byPlatform
 */
export function buildRecapPlaybook(byPlatform) {
  const { learnings, nextSteps } = buildRecapPatterns(byPlatform);
  const find = (kind) => learnings.find((l) => l.kind === kind) ?? null;
  // learnings는 화면용으로 잘릴 수 있어 플랫폼 재료는 nextSteps에서도 찾는다(같은 계산의 결과)
  const stepSplit = nextSteps.find((n) => n.kind === 'splitByPlatform') ?? null;
  const stepLean = nextSteps.find((n) => n.kind === 'leanOnPlatform') ?? null;
  const split = find('platformSplit') ?? (stepSplit && { reachPlatform: stepSplit.reachPlatform, clickPlatform: stepSplit.clickPlatform });
  const both = find('platformBoth') ?? (stepLean && { platform: stepLean.platform, other: null });
  const phase = find('phaseClicks');
  const strongs = learnings.filter((l) => l.kind === 'consistentStrong');
  const weaks = learnings.filter((l) => l.kind === 'consistentWeak');
  const mixeds = learnings.filter((l) => l.kind === 'mixed');

  let keep = null;
  if (split) keep = { kind: 'platformReach', platform: split.reachPlatform };
  else if (both) keep = { kind: 'platformBoth', platform: both.platform, other: both.other };
  else if (phase) keep = { kind: 'phase', phase: phase.bestPhase, worstPhase: phase.worstPhase };
  else if (strongs[0]) keep = { kind: 'strong', aspect: strongs[0].aspect, metricKey: strongs[0].metricKey, count: strongs[0].count, total: strongs[0].total };

  let useSelectively = null;
  if (split) useSelectively = { kind: 'platformClicks', platform: split.clickPlatform };
  else if (both) useSelectively = { kind: 'platformOther', platform: both.other, leader: both.platform };
  else if (phase && keep?.kind !== 'phase') useSelectively = { kind: 'phase', phase: phase.bestPhase, worstPhase: phase.worstPhase };

  const improve = weaks[0] ? { kind: 'weak', aspect: weaks[0].aspect, metricKey: weaks[0].metricKey, count: weaks[0].count, total: weaks[0].total } : null;

  // VALIDATE — 엇갈린 지표가 있으면 그것, 없으면 벤치마크는 있는데 패턴이 안 잡힌 지표 하나
  let validate = null;
  if (mixeds[0]) validate = { kind: 'mixed', aspect: mixeds[0].aspect, metricKey: mixeds[0].metricKey, count: mixeds[0].count, countBottom: mixeds[0].countBottom, total: mixeds[0].total };
  else {
    const covered = new Set(learnings.map((l) => l.aspect).filter(Boolean));
    const rows = Object.values(byPlatform ?? {}).flat();
    const candidate = ['engagement', 'click', 'reach', 'hook', 'hold', 'result'].find((aspect) => {
      if (covered.has(aspect)) return false;
      const keys = Object.keys(METRIC_ASPECT).filter((k) => METRIC_ASPECT[k] === aspect);
      return rows.some((r) => keys.some((k) => r.benchmarks?.[k]?.peerScope !== 'none' && r.benchmarks?.[k]?.percentile != null));
    });
    if (candidate) validate = { kind: 'uncovered', aspect: candidate };
  }

  const validateAspects = [...new Set([improve?.aspect, validate?.aspect].filter(Boolean))];
  let nextEvent = null;
  const step = nextSteps.find((n) => n.kind === 'splitByPlatform') ?? nextSteps.find((n) => n.kind === 'leanOnPlatform') ?? nextSteps.find((n) => n.kind === 'shiftToPhase') ?? null;
  if (step?.kind === 'splitByPlatform') nextEvent = { kind: 'split', reachPlatform: step.reachPlatform, clickPlatform: step.clickPlatform, validateAspects };
  else if (step?.kind === 'leanOnPlatform') nextEvent = { kind: 'lean', platform: step.platform, validateAspects };
  else if (step?.kind === 'shiftToPhase') nextEvent = { kind: 'phase', phase: step.phase, worstPhase: step.worstPhase, validateAspects };

  return { keep, useSelectively, improve, validate, nextEvent };
}

/**
 * 캠페인 한 줄의 해석 — { strength, weakness, reason }. 각 항목은
 * { level, kind, ... } 또는 null(근거 없음). 표에 있는 숫자를 반복하지 않고
 * "비교군 중 어디"만 근거로 붙인다.
 *
 * - strength: 대표 지표 우선, 상위 구간(top/best)인 벤치마크 중 백분위 최고
 * - weakness: 하위 구간(bottom/lowest)인 벤치마크 중 백분위 최저. 없으면 계획 대비
 *   20% 이상 초과 지출(observed)
 * - reason: 관측된 지표 패턴(강한 CPM·약한 클릭 등)만 — 원인은 데이터로 세울 수 없어 level은 항상 unknown
 * - recommendation: 위 세 재료에서만 나오는 다음 실험(inferred). 관측 결과 → 다음에
 *   확인할 것이지, 마케팅 일반론이 아니다. 근거가 없으면 null(칸을 비운다)
 *   · keepAndTest: 장점·약점이 둘 다 있을 때 — 장점을 낸 설정은 유지, 약점 지표를 개선 대상으로
 *   · repeat: 장점만 — 이 캠페인을 기준점으로 삼고 같은 지표가 유지되는지 확인
 *   · improve: 약점만 — 약점 지표를 넘어야 할 기준선으로
 *   · budget: 초과 지출만 — 예산 페이스 확인
 *
 * @param {Object} row - buildRecapRows()의 행(benchmarks 포함)
 * @param {{ plannedBudget?: number|null }} [options]
 * @returns {{ hasData: boolean, strength: Object|null, weakness: Object|null, reason: Object, recommendation: Object|null }}
 */
export function buildCampaignInsight(row, options = {}) {
  const hasData = row && (row.spend != null || row.impressions != null);
  const stats = hasData ? knownStats(row) : [];
  const headline = new Set(GOAL_HEADLINE_METRICS[row?.goal] ?? []);
  const byPct = (a, b) => b.percentile - a.percentile;
  // 대표 지표를 먼저, 그다음 나머지 — 같은 구간이면 백분위 순
  const rank = (list, dir) => list.slice().sort((a, b) => {
    const h = Number(headline.has(b.metricKey)) - Number(headline.has(a.metricKey));
    return h !== 0 ? h : (dir === 'top' ? byPct(a, b) : -byPct(a, b));
  });

  if (!hasData) return { hasData: false, strength: null, weakness: null, reason: { level: INSIGHT_LEVEL.UNKNOWN, kind: 'noData' }, recommendation: null };

  const top = rank(stats.filter((b) => b.band === 'top'), 'top');
  const bottom = rank(stats.filter((b) => b.band === 'bottom'), 'bottom');

  const strength = top[0]
    ? { level: INSIGHT_LEVEL.COMPARED, kind: 'ranked', metricKey: top[0].metricKey, aspect: METRIC_ASPECT[top[0].metricKey], stat: top[0], scope: top[0].peerScope, n: top[0].sampleSize }
    : null;

  let weakness = bottom[0]
    ? { level: INSIGHT_LEVEL.COMPARED, kind: 'ranked', metricKey: bottom[0].metricKey, aspect: METRIC_ASPECT[bottom[0].metricKey], stat: bottom[0], scope: bottom[0].peerScope, n: bottom[0].sampleSize }
    : null;
  const planned = options.plannedBudget ?? null;
  if (!weakness && planned && row.spend != null && row.spend > planned * (1 + OVERSPEND_RATIO)) {
    weakness = { level: INSIGHT_LEVEL.OBSERVED, kind: 'overspend', pct: Math.round((row.spend / planned - 1) * 100) };
  }

  // Why — 두 지표의 조합만 해석한다. 하나뿐이면 방향을 말할 근거가 없다.
  const band = (key) => row.benchmarks?.[key]?.band ?? null;
  const known = (key) => row.benchmarks?.[key]?.peerScope !== 'none' && row.benchmarks?.[key]?.percentile != null;
  const reachTop = band('cpm') === 'top';
  const reachBottom = band('cpm') === 'bottom';
  const clickTop = band('ctr') === 'top' || band('cpc') === 'top';
  const clickBottom = band('ctr') === 'bottom' || band('cpc') === 'bottom';
  const hookTop = band('hookRate') === 'top';
  const hookBottom = band('hookRate') === 'bottom';
  const holdTop = band('holdRate') === 'top';
  const holdBottom = band('holdRate') === 'bottom';

  // Why — 비율 지표만으로는 원인을 세울 수 없다(2026-09-07 규칙). 그래서 level은 전부 UNKNOWN이고,
  // kind는 "무슨 패턴이 관측됐는지"(강한 CPM·약한 클릭 등) 근거 줄에 적기 위한 것이다.
  // 창의·타겟·메시지·피로·사용자 행동 같은 원인은 데이터에 없으므로 절대 단정하지 않는다.
  let reason;
  if (stats.length === 0) reason = { level: INSIGHT_LEVEL.UNKNOWN, kind: 'noPeers' };
  else if (reachTop && clickBottom) reason = { level: INSIGHT_LEVEL.UNKNOWN, kind: 'reachNotAction' };
  else if (reachBottom && clickTop) reason = { level: INSIGHT_LEVEL.UNKNOWN, kind: 'actionNotReach' };
  else if (hookTop && holdBottom) reason = { level: INSIGHT_LEVEL.UNKNOWN, kind: 'hookNotHold' };
  else if (hookBottom && holdTop) reason = { level: INSIGHT_LEVEL.UNKNOWN, kind: 'holdNotHook' };
  else if (top.length >= 2 && bottom.length === 0) reason = { level: INSIGHT_LEVEL.UNKNOWN, kind: 'allStrong' };
  else if (bottom.length >= 2 && top.length === 0) reason = { level: INSIGHT_LEVEL.UNKNOWN, kind: 'allWeak' };
  else if ((known('cpm') || known('ctr') || known('cpc')) && top.length + bottom.length === 1) reason = { level: INSIGHT_LEVEL.UNKNOWN, kind: 'singleSignal', metricKey: (top[0] ?? bottom[0]).metricKey, aspect: METRIC_ASPECT[(top[0] ?? bottom[0]).metricKey], isStrong: top.length === 1 };
  else reason = { level: INSIGHT_LEVEL.UNKNOWN, kind: 'noPattern' };

  // Recommendation — 장점·약점 재료가 있을 때만. 없으면 null이라 칸이 비고, 지어내지 않는다
  let recommendation = null;
  if (strength && weakness?.kind === 'ranked') recommendation = { level: INSIGHT_LEVEL.INFERRED, kind: 'keepAndTest', keepAspect: strength.aspect, testAspect: weakness.aspect, testMetricKey: weakness.metricKey };
  else if (strength && weakness?.kind === 'overspend') recommendation = { level: INSIGHT_LEVEL.INFERRED, kind: 'keepAndBudget', keepAspect: strength.aspect, pct: weakness.pct };
  else if (strength) recommendation = { level: INSIGHT_LEVEL.INFERRED, kind: 'repeat', aspect: strength.aspect, metricKey: strength.metricKey };
  else if (weakness?.kind === 'ranked') recommendation = { level: INSIGHT_LEVEL.INFERRED, kind: 'improve', aspect: weakness.aspect, metricKey: weakness.metricKey };
  else if (weakness?.kind === 'overspend') recommendation = { level: INSIGHT_LEVEL.INFERRED, kind: 'budget', pct: weakness.pct };

  return { hasData: true, strength, weakness, reason, recommendation };
}

/**
 * 이벤트 단위 패턴(Learnings)과 제언(Next time)의 재료. 개별 캠페인 하나로는 만들지
 * 않는다 — 여러 캠페인이 같은 방향을 가리키거나(consistent), 단계끼리 갈리거나
 * (phase), 플랫폼끼리 갈릴 때(platform, 이 이벤트 안에서만)만 항목이 생긴다.
 *
 * @param {Object<string, Array<Object>>} byPlatform - buildRecapRows().byPlatform
 * @returns {{ learnings: Array<Object>, nextSteps: Array<Object> }}
 */
export function buildRecapPatterns(byPlatform) {
  const rows = Object.values(byPlatform ?? {}).flat();
  const learnings = [];
  const nextSteps = [];

  // 1) 같은 지표가 여러 캠페인에서 같은 방향 — 상위 2개 이상 / 하위 2개 이상
  const withData = rows.filter((r) => r.spend != null || r.impressions != null);
  // CTR과 CPC는 둘 다 "클릭 효율"이라 같은 aspect가 두 번 나오지 않게 한 번만 — 먼저 잡힌 지표가 대표
  const seenAspect = new Set();
  ['cpm', 'ctr', 'cpc', 'hookRate', 'holdRate', 'engagementRate'].forEach((key) => {
    if (seenAspect.has(METRIC_ASPECT[key])) return;
    const known = withData.filter((r) => r.benchmarks?.[key]?.peerScope !== 'none' && r.benchmarks?.[key]?.percentile != null);
    if (known.length < 2) return;
    const tops = known.filter((r) => r.benchmarks[key].band === 'top');
    const bottoms = known.filter((r) => r.benchmarks[key].band === 'bottom');
    if (tops.length >= 2 && tops.length > bottoms.length) { learnings.push({ kind: 'consistentStrong', metricKey: key, aspect: METRIC_ASPECT[key], count: tops.length, total: known.length }); seenAspect.add(METRIC_ASPECT[key]); }
    else if (bottoms.length >= 2 && bottoms.length > tops.length) { learnings.push({ kind: 'consistentWeak', metricKey: key, aspect: METRIC_ASPECT[key], count: bottoms.length, total: known.length }); seenAspect.add(METRIC_ASPECT[key]); }
    // 양쪽이 같이 2개 이상이면 "엇갈림" — 방향을 지어내지 않고 Mixed로 보고한다
    else if (tops.length >= 2 && bottoms.length >= 2) { learnings.push({ kind: 'mixed', metricKey: key, aspect: METRIC_ASPECT[key], count: tops.length, countBottom: bottoms.length, total: known.length }); seenAspect.add(METRIC_ASPECT[key]); }
  });

  // 2) 단계 차이 — 같은 플랫폼 안에서 클릭 효율(CTR)이 가장 높은 단계가 플랫폼마다 같을 때
  const platforms = Object.keys(byPlatform ?? {}).filter((p) => (byPlatform[p] ?? []).length > 0);
  const bestPhaseByPlatform = platforms.map((p) => {
    const list = (byPlatform[p] ?? []).filter((r) => r.ctr != null);
    if (list.length < 2) return null;
    const sorted = list.slice().sort((a, b) => b.ctr - a.ctr);
    const best = sorted[0]; const worst = sorted[sorted.length - 1];
    if (!best || !worst || best.ctr <= 0 || worst.ctr <= 0 || best.ctr / worst.ctr < 1.5) return null;
    return { platform: p, best: best.phaseName, worst: worst.phaseName };
  }).filter(Boolean);
  if (bestPhaseByPlatform.length > 0) {
    const [first] = bestPhaseByPlatform;
    const agree = bestPhaseByPlatform.every((x) => phaseKey(x.best) === phaseKey(first.best));
    if (agree && (bestPhaseByPlatform.length >= 2 || platforms.length === 1)) {
      learnings.push({ kind: 'phaseClicks', bestPhase: first.best, worstPhase: first.worst, platforms: bestPhaseByPlatform.map((x) => x.platform) });
      nextSteps.push({ kind: 'shiftToPhase', phase: first.best, worstPhase: first.worst });
    }
  }

  // 3) 플랫폼 차이(이 이벤트 안에서만) — 정의가 같은 CPM과 CTR을 이벤트 단위로 합산
  if (platforms.length >= 2) {
    const agg = platforms.map((p) => ({ platform: p, cpm: aggregateMetric(byPlatform[p], 'cpm'), ctr: aggregateMetric(byPlatform[p], 'ctr') }));
    const cpmOk = agg.filter((x) => x.cpm != null && x.cpm > 0).sort((a, b) => a.cpm - b.cpm);
    const ctrOk = agg.filter((x) => x.ctr != null && x.ctr > 0).sort((a, b) => b.ctr - a.ctr);
    if (cpmOk.length >= 2 && ctrOk.length >= 2) {
      const cheaper = cpmOk[0]; const pricier = cpmOk[cpmOk.length - 1];
      const clickier = ctrOk[0]; const lessClicky = ctrOk[ctrOk.length - 1];
      const cpmGap = 1 - cheaper.cpm / pricier.cpm;
      const ctrGap = 1 - lessClicky.ctr / clickier.ctr;
      if (cpmGap >= 0.15 && ctrGap >= 0.15) {
        if (cheaper.platform !== clickier.platform) {
          learnings.push({ kind: 'platformSplit', reachPlatform: cheaper.platform, clickPlatform: clickier.platform });
          nextSteps.push({ kind: 'splitByPlatform', reachPlatform: cheaper.platform, clickPlatform: clickier.platform });
        } else {
          learnings.push({ kind: 'platformBoth', platform: cheaper.platform, other: pricier.platform });
          nextSteps.push({ kind: 'leanOnPlatform', platform: cheaper.platform });
        }
      }
    }
  }

  return { learnings: learnings.slice(0, 4), nextSteps: nextSteps.slice(0, 3) };
}
