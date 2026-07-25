/**
 * DashboardPage와 ReportSummarySection이 공통으로 쓰는 페이지 레벨 유틸.
 * schema.js로 옮기지 않은 이유: 이건 "비즈니스 규칙"이 아니라 이 프로젝트
 * 페이지들의 필터 UI가 공유하는 얇은 헬퍼라서 데이터 레이어에 넣지 않았다.
 */

// mock 데이터가 이 날짜를 기준으로 짜여 있다(예: "Ending Soon Campaign"이
// 정확히 이 날짜 기준 D-3 이내로 끝나도록 설계됨) — 그래서 진짜 new Date()가
// 아니라 고정값을 쓴다. status/pacing(DashboardPage)과 알림(usePaidAdsStore의
// generateAlerts)이 이 상수를 반드시 같이 써야 한다 — 예전엔 usePaidAdsStore가
// new Date()(실제 시스템 시각)를 썼는데, 이 둘이 어긋나면서 화면엔 Active로
// 보이는 캠페인의 알림 문구가 다른 "오늘" 기준으로 계산돼(예: "D-3"인데 실제
// 표시 기준으로는 D-5) 날짜가 안 맞는 버그가 있었다(실사용 시나리오 점검 중
// 발견). 실제 서비스로 전환할 때는 이 상수를 new Date()로 교체하면 된다.
export const TODAY = new Date('2026-07-20');

/**
 * 캠페인 기간이 필터 dateRange와 겹치는지 확인한다.
 * @param {import('../../data/schema').Campaign} campaign
 * @param {{ start?: string, end?: string }} dateRange
 * @returns {boolean}
 */
export function campaignInDateRange(campaign, dateRange) {
  if (!dateRange?.start && !dateRange?.end) return true;
  const start = dateRange.start ? new Date(dateRange.start) : null;
  const end = dateRange.end ? new Date(dateRange.end) : null;
  const cStart = new Date(campaign.startDate);
  const cEnd = new Date(campaign.endDate);
  if (start && cEnd < start) return false;
  if (end && cStart > end) return false;
  return true;
}

/**
 * 접두사 + 랜덤값으로 로컬 ID를 생성한다 (mock/브라우저 전용, 실 서비스에서는
 * 서버가 UUID v4를 발급하는 것으로 교체될 자리).
 * @param {string} prefix
 * @returns {string}
 */
export function generateId(prefix) {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}
