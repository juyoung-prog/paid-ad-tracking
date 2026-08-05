/**
 * DashboardPage와 ReportSummarySection이 공통으로 쓰는 페이지 레벨 유틸.
 * schema.js로 옮기지 않은 이유: 이건 "비즈니스 규칙"이 아니라 이 프로젝트
 * 페이지들의 필터 UI가 공유하는 얇은 헬퍼라서 데이터 레이어에 넣지 않았다.
 */

/**
 * "오늘"은 스토어가 소유한다 — 화면은 usePaidAdsStore()가 주는 `today`를 쓴다.
 *
 * 예전엔 앱 전체가 고정 상수 TODAY(2026-07-20) 하나를 썼다. 목데이터 시절엔
 * 맞는 선택이었는데("Ending Soon"이 정확히 D-3에 오도록 시나리오가 이 날짜
 * 기준으로 설계됨), 실계정 연결 + 일일 동기화가 시작된 뒤에도 이 상수가
 * 남아서 8월 실데이터를 7/20 기준으로 판정했다 — 2주 전에 끝난 캠페인이
 * Active + "D-1 ends soon"으로 뜨고, 성과 수기 입력의 recorded_at까지 영원히
 * 7/20으로 저장되는 실버그(스크린샷 리뷰로 발견).
 *
 * 그렇다고 전역 new Date()로 바꾸면 반대쪽이 깨진다 — 스토리북 목데이터의
 * 알림·상태 시나리오가 전부 고정 날짜 기준이라, 시간이 지나면 스토리가
 * "전부 끝난 캠페인"이 된다. 그래서 시계를 스토어 계층에 넣는다:
 * 실 스토어(useSupabasePaidAdsStore)는 startOfToday(), 목 스토어
 * (createMockPaidAdsStore)는 MOCK_TODAY.
 *
 * 상수 하나가 두 "오늘"로 갈라질 때 생기던 어긋남(예전 D-3/D-5 버그)은
 * 스토어가 단일 출처가 되면서 구조적으로 막힌다 — status/알림/pacing/Now 뷰가
 * 전부 같은 store.today를 쓴다.
 */

/** 목데이터 시나리오의 기준일 — 목 스토어와 스토리 전용 */
export const MOCK_TODAY = new Date('2026-07-20');

/** 실제 오늘, 로컬 자정으로 정규화 — 날짜 비교가 시각에 흔들리지 않게 */
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 로컬 기준 YYYY-MM-DD. toISOString()은 UTC라 KST 자정~오전 9시 사이에는
 * 전날 날짜가 나온다 — recorded_at 같은 "날짜" 필드에 쓰면 하루가 밀린다.
 */
export function toLocalISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 페이지 콘텐츠의 좌우 여백.
 *
 * 예전엔 화면마다 값이 달랐다 — Dashboard는 md에서 32px, Reports/Stores는
 * MUI Container 기본값 24px, Settings는 아예 0이었다. 각 화면에 자기 헤더가
 * 있을 땐 티가 안 났는데, 글로벌 셸이 좌측 레일로 바뀌면서 레일 경계가 모든
 * 화면의 공통 기준선이 됐고 탭을 옮길 때마다 본문이 좌우로 움직였다.
 *
 * 한 곳에서만 정한다. 페이지가 늘어도 이 값을 쓰면 기준선이 어긋나지 않는다.
 * (DashboardPage의 sticky 툴바처럼 배경·구분선이 화면 끝까지 가야 하는
 *  요소는 padding으로 주고, 바깥 margin으로 주지 않는다.)
 */
export const PAGE_GUTTER_X = { xs: 2, sm: 3, md: 4 };

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
