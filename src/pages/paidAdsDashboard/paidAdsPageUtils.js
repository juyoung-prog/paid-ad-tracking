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

/**
 * 캠페인 이름에서 대상 매장 코드를 추론한다.
 *
 * 이 계정의 네이밍은 "G10_...", "BF2_...", "Reach_BF2_2MonthsDeals"처럼 매장
 * 코드를 이름에 담는다. 같은 규칙이 이미 서버(sync-campaigns의 resolveStoreId)에
 * 있어서 동기화된 캠페인은 매장이 자동으로 붙는데, 사람이 폼에서 직접 등록할
 * 때만 그 규칙이 없어 매번 손으로 골라야 했다 — 규칙을 옮겨온다.
 *
 * 정확히 일치할 때만 매장을 붙인다. 비슷한 이름에 억지로 맞추면 성과가 조용히
 * 엉뚱한 매장에 귀속되고, 그건 빈 값보다 나쁘다(사용자가 틀린 걸 못 알아챈다).
 * 코드가 이름 중간에 오는 경우는 앞뒤가 영숫자가 아닐 때만 인정해서, "BF2"가
 * 다른 단어의 일부로 우연히 걸리는 것을 막는다.
 *
 * @param {string} name - 캠페인 이름
 * @param {Array<{id: string, name: string}>} stores - 매장 목록
 * @returns {string|null} 매장 코드. 못 찾으면 null(추측하지 않는다)
 */
export function inferStoreIdFromName(name, stores) {
  if (!name || !stores?.length) return null;

  const prefix = name.split('_')[0]?.trim() ?? '';
  if (stores.some((s) => s.id === prefix)) return prefix;

  for (const store of stores) {
    // 매장 코드는 Stores 화면에서 자유 입력이라 정규식 특수문자가 들어올 수 있다.
    // 이스케이프하지 않으면 "G(1" 같은 코드 하나가 캠페인 이름을 타이핑하는 순간
    // SyntaxError("Unterminated group")로 등록 폼을 통째로 죽인다(재현 확인).
    const escapedId = store.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(^|[^A-Za-z0-9])${escapedId}([^A-Za-z0-9]|$)`, 'i').test(name)) return store.id;
  }

  // 코드 없이 매장명만 쓴 캠페인도 있다("Beauty Master Florida Mall Now Open").
  // 4글자 미만 이름은 우연 일치가 너무 쉬워 제외한다.
  const lower = name.toLowerCase();
  for (const store of stores) {
    const storeName = (store.name ?? '').toLowerCase();
    if (storeName.length >= 4 && lower.includes(storeName)) return store.id;
  }
  return null;
}

/**
 * 플랫폼 광고 관리자에서 이 캠페인을 여는 링크.
 *
 * 동기화는 creative_url(실제 게시물 링크)을 채우지 않는다 — 캠페인 하나에 광고
 * 소재가 여러 개라 "그 캠페인의 광고 링크" 하나가 존재하지 않기 때문이다(Meta의
 * preview_shareable_link는 광고 단위라 아무거나 고르면 틀린 링크가 된다). 대신
 * 캠페인 자체를 여는 링크는 저장된 외부 id로 결정론적으로 만들 수 있다.
 *
 * TikTok은 캠페인 단위 딥링크가 안정적으로 구성되지 않아 지원하지 않는다 —
 * 광고주 계정 화면까지만 열리는 링크를 "이 캠페인 열기"로 내보내면 거짓말이 된다.
 *
 * @param {object} campaign - externalCampaignId, platform을 가진 캠페인
 * @param {object} account - externalAccountId를 가진 광고 계정
 * @returns {string|null}
 */
export function adsManagerUrl(campaign, account) {
  if (campaign?.platform !== 'meta') return null;
  if (!campaign?.externalCampaignId || !account?.externalAccountId) return null;
  // Meta 계정 id는 "act_123..." 형태로 오는데 act 파라미터는 숫자만 받는다.
  const accountId = String(account.externalAccountId).replace(/^act_/, '');
  return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${encodeURIComponent(accountId)}&selected_campaign_ids=${encodeURIComponent(campaign.externalCampaignId)}`;
}
