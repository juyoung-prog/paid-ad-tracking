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

import { isUnassignedEvent, campaignNameKey, effectiveBudgetPlanned, PLATFORM } from '../../data/schema';

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
 * 섹션 카드 — 타임라인·표·목록 하나가 한 장의 카드다(ref/re1.png).
 *
 * 1px 옅은 경계선 + container radius로 "이 블록이 하나의 단위"라고 묶는다.
 * 그림자는 없다 — 면의 위계는 선과 여백으로만 만든다(테마 customShadows 주석).
 * 안쪽 여백은 카드가 아니라 제목 행과 행/셀(px 2)이 각자 갖는다 — 그래야 제목
 * 글자와 첫 열 글자가 같은 x에 선다. Reports의 Awareness/Traffic 카드와
 * Dashboard의 캠페인 목록 카드가 같은 값을 쓴다(한쪽만 고치면 어긋난다).
 * Stores처럼 페이지 전체가 표 하나인 관리 화면에는 쓰지 않는다 — 감쌀 형제
 * 섹션이 없는 표에 카드는 테두리만 하나 더한다.
 */
export const SECTION_CARD_SX = (theme) => ({
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${theme.shape.radius.container}px`,
  backgroundColor: 'background.paper',
  overflow: 'hidden',
  mb: 3,
});

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
 * 플랫폼 광고 관리자를 여는 링크.
 *
 * Meta는 그 캠페인이 **선택된 상태**까지 딥링크된다. TikTok은 캠페인 단위
 * 딥링크가 안정적으로 구성되지 않아 **광고주의 캠페인 목록**까지만 연다 —
 * 한때 그 비대칭 때문에 TikTok을 아예 지원하지 않았는데("계정 화면만 열리는
 * 링크를 '이 캠페인 열기'로 내보내면 거짓말"), 버튼 라벨이 일반형
 * "Ads Manager"가 되면서 그 반대 논리가 성립한다: 관리자로 가는 문 자체는
 * 정직하게 제공할 수 있고, 없는 것보다 훨씬 낫다(실사용 지적 — TikTok
 * 캠페인에서 버튼이 통째로 사라져 "왜 없나"가 됐다).
 *
 * 동기화는 creative_url(실제 게시물 링크)을 채우지 않는 대신 ad_link를
 * 채운다 — "View ad"는 그쪽 소관이고, 이 링크는 관리 화면 전용이다.
 *
 * @param {object} campaign - externalCampaignId, platform을 가진 캠페인
 * @param {object} account - externalAccountId를 가진 광고 계정
 * @returns {string|null}
 */
export function adsManagerUrl(campaign, account) {
  if (!account?.externalAccountId) return null;

  if (campaign?.platform === 'meta') {
    if (!campaign?.externalCampaignId) return null;
    // Meta 계정 id는 "act_123..." 형태로 오는데 act 파라미터는 숫자만 받는다.
    const accountId = String(account.externalAccountId).replace(/^act_/, '');
    return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${encodeURIComponent(accountId)}&selected_campaign_ids=${encodeURIComponent(campaign.externalCampaignId)}`;
  }

  if (campaign?.platform === 'tiktok') {
    // 광고주의 캠페인 목록. aadvid = advertiser id(우리 external_account_id).
    return `https://ads.tiktok.com/i18n/perf/campaign?aadvid=${encodeURIComponent(String(account.externalAccountId))}`;
  }

  return null;
}

/**
 * 청구 내역(인보이스)을 여는 링크.
 *
 * 인보이스는 **광고 계정** 단위 문서다 — 캠페인 하나만 잘라 발행되지 않는다.
 * 그래서 캠페인이 아니라 계정을 받는다(adsManagerUrl과 다른 점).
 *
 * 왜 별도 문이 필요한가: 기존 세 개(View ad / Ads Manager / Edit on Dashboard)는
 * 전부 "광고가 어떻게 나갔나"로 가는 문이라, 정산 때 필요한 "얼마가 청구됐고
 * 영수증은 어디 있나"에는 아무 문도 열리지 않았다. Ads Manager를 열어도
 * 거기서 다시 Billing & payments → Payment activity까지 사람이 찾아 들어가야
 * 한다 — 그 두 단계를 링크가 대신한다.
 *
 * Meta는 Business의 청구 허브(Billing & payments)에서 Payment activity 탭이
 * 곧 결제·인보이스 목록이고, asset_id로 그 계정이 선택된 상태까지 간다.
 * TikTok은 광고주의 결제 화면까지 연다 — Ads Manager 링크와 같은 비대칭이다
 * (계정까지만, 문서 한 건까지는 아님). 라벨이 일반형 "Payment activity"라
 * 목록으로 여는 것이 거짓말이 되지 않는다.
 *
 * @param {object} account - platform, externalAccountId를 가진 광고 계정
 * @returns {string|null} 계정 식별자를 모르면 null — 추측해서 열지 않는다
 */
export function billingUrl(account) {
  if (!account?.externalAccountId) return null;

  if (account.platform === 'meta') {
    // adsManagerUrl과 같은 정규화 — 저장값은 "act_123..." 형태로 올 수 있는데
    // 청구 허브의 asset_id는 숫자 id를 받는다.
    const accountId = String(account.externalAccountId).replace(/^act_/, '');
    return `https://business.facebook.com/billing_hub/payment_activity?asset_id=${encodeURIComponent(accountId)}`;
  }

  if (account.platform === 'tiktok') {
    return `https://ads.tiktok.com/i18n/account/payment?aadvid=${encodeURIComponent(String(account.externalAccountId))}`;
  }

  return null;
}

/**
 * 이 화면군의 서체 규칙 — influencer tracking dashboard(레퍼런스)의 SAAS_FONT와
 * 같은 스택이다.
 *
 * 전역 테마는 본문 Pretendard / 제목 Outfit을 선언하지만, 레퍼런스의 SaaS 화면은
 * 셸에서 이 스택으로 덮어써 화면 전체를 Inter로 통일한다. "같은 회사 툴군처럼
 * 보이기"가 이 프로젝트의 1순위 목표라 그 override까지 그대로 가져온다. 전역
 * 테마를 바꾸지 않는 것도 레퍼런스와 같다 — 다른 컴포넌트 스토리들은 프로젝트
 * 기본 서체를 계속 쓴다.
 *
 * Pretendard는 레퍼런스와 마찬가지로 셀프 호스팅하지 않는다. Inter에는 한글
 * 글리프가 없어 한글은 스택 뒤로 넘어가는데, 여기서 Pretendard를 우리만 번들하면
 * 오히려 레퍼런스와 다르게 보인다(레퍼런스는 OS 폰트로 떨어진다).
 *
 * 셸(PaidAdsShell)과 로그인(LoginPage)이 함께 쓴다 — 로그인은 인증 전이라 셸
 * 밖에 렌더되는데, 사용자가 처음 보는 화면이라 여기만 다른 서체면 첫인상부터
 * 어긋난다.
 *
 * 서체 값 자체는 테마(typography.shellFontFamily)가 정한다 — Default는 Inter,
 * Carbon은 IBM Plex Sans. 그래서 상수가 아니라 theme을 받는 sx 함수다:
 *   sx={(theme) => ({ ...paidAdsFontSx(theme) })}
 */
export const paidAdsFontSx = (theme) => ({
  fontFamily: theme.typography.shellFontFamily,
  /* 테마의 h1~h6·subtitle은 fontFamily(Outfit)를 직접 들고 있어서 루트에 폰트를
     걸어도 상속을 받지 않는다. 레퍼런스(SaasShell)와 동일하게 안쪽 모든 텍스트
     요소에 상속을 강제해 화면 전체를 한 서체로 통일한다 — 이걸 빼면 제목만
     Outfit, 나머지는 Inter로 갈려서 레퍼런스와 달라진다. */
  '& .MuiTypography-root, & .MuiButton-root, & .MuiChip-root, & .MuiTableCell-root, & .MuiInputBase-root, & .MuiAvatar-root': {
    fontFamily: 'inherit',
  },
  // 폼 요소는 font-family를 상속하지 않고 UA 기본값(Arial 등)을 쓴다. 이걸 빼면
  // 위의 inherit 규칙이 역효과를 낸다 — 버튼 안의 Typography가 셸 폰트가 아니라
  // 버튼의 Arial을 물려받는다(레퍼런스가 겪은 문제).
  '& button, & input, & select, & textarea, & optgroup': { fontFamily: 'inherit' },
});

/**
 * Event 드롭다운의 옵션과 섹션(FilterBar의 sections 계약). Dashboard와 Reports가
 * 같은 드롭다운을 쓰므로 여기(페이지 공통 유틸)에 둔다 — 한쪽만 섹션이 있으면
 * 같은 필터가 화면마다 다른 물건이 된다.
 *
 * 이벤트가 열 개일 때도, 몇 년 뒤 수백 개일 때도 같은 구조여야 한다:
 *   All Events → (날짜 없는 계획) → 연도별(최신 연도만 펼침, 나머지 접힘) → Unassigned.
 * 예전엔 최근순 평평한 목록 하나였는데, 한 해에 이벤트가 수십 개 쌓이면 검색 없이는
 * 스크롤이 끝나지 않는다. 검색은 섹션과 무관하게 전체를 뒤진다(FilterBar).
 *
 * 연도 섹션은 **그 해의 전체 목록**이다. 한때 "Recent(최근 5)" 섹션을 위에 두고
 * 연도에는 나머지만 넣었는데, 같은 해 이벤트가 두 섹션으로 갈라져 "2026에 왜
 * 이것뿐이지"가 됐다(실사용 지적). 최신 연도가 펼쳐져 있으면 그 안의 최근순
 * 정렬이 Recent 역할을 이미 한다.
 *
 * 각 연도 안의 순서는 **가장 늦은 시작일** 기준 최근순이다 — 캠페인이 여럿이면
 * 가장 최근에 시작한 것. 계획만 있고 집행이 없는 이벤트는 계획 항목의 시작일을
 * 쓰고, 항목조차 없으면 날짜 없는 "지금 만드는 중"이라 맨 위 Planned 섹션에 둔다.
 *
 * @param {Campaign[]} campaigns
 * @param {Array<{name: string, items?: Array<{startDate: string}>}>} plans
 * @returns {{ options: Array<{value: string, label: string, section: string}>, sections: Array<{key: string, label: string, isCollapsible?: boolean, isCollapsedByDefault?: boolean}> }}
 */
export function buildEventFilterGroup(campaigns, plans) {
  const latestStartByGroup = new Map();
  campaigns.forEach((c) => {
    if (!c.campaignGroup) return;
    const prev = latestStartByGroup.get(c.campaignGroup);
    if (!prev || (c.startDate ?? '') > prev) latestStartByGroup.set(c.campaignGroup, c.startDate ?? '');
  });
  plans.forEach((plan) => {
    if (latestStartByGroup.has(plan.name)) return;
    const starts = (plan.items ?? []).map((i) => i.startDate).filter(Boolean);
    latestStartByGroup.set(plan.name, starts.length > 0 ? starts.reduce((max, d) => (d > max ? d : max)) : '');
  });

  /* 날짜 없는 것(계획만, 항목 없음)이 맨 앞, 그다음 최근순 */
  const ordered = [...latestStartByGroup.entries()]
    .sort((a, b) => (a[1] === '' ? -1 : b[1] === '' ? 1 : b[1].localeCompare(a[1])));

  const named = ordered.filter(([name]) => !isUnassignedEvent(name));
  const unassigned = ordered.filter(([name]) => isUnassignedEvent(name));
  const undated = named.filter(([, date]) => date === '');
  const dated = named.filter(([, date]) => date !== '');

  const yearOf = (date) => date.slice(0, 4);
  const years = [...new Set(dated.map(([, date]) => yearOf(date)))];

  const options = [
    ...undated.map(([name]) => ({ value: name, label: name, section: 'planned' })),
    ...dated.map(([name, date]) => ({ value: name, label: name, section: `year-${yearOf(date)}` })),
    ...unassigned.map(([name]) => ({ value: name, label: 'Unassigned', section: 'unassigned' })),
  ];
  const sections = [
    { key: 'planned', label: 'Planned' },
    /* 가장 최근 연도만 펼쳐 둔다 — 지금 돌고 있는 이벤트는 거기 있다. 그 전 해부터는
       접혀서 헤더(연도·개수)만 남는다. */
    ...years.map((year, index) => ({ key: `year-${year}`, label: year, isCollapsible: true, isCollapsedByDefault: index > 0 })),
    { key: 'unassigned', label: 'Unassigned' },
  ];
  return { options, sections };
}

/**
 * 'YYYY-MM-DD' -> 'M/D'. 차트 축·막대 라벨처럼 폭이 좁은 자리에서 쓴다.
 *
 * 구현은 utils/format.js의 dateShort가 갖는다 — 날짜 표기 규칙은 앱 전체에서
 * 한 곳에서만 정한다(예전엔 화면마다 제각각이라 같은 기간이 `07.10–08.31` /
 * `7/6–8/1` / `07/10/2026 – 08/31/2026`로 갈렸다). 이 이름은 기존 호출부
 * (ReportSummarySection·PhaseTimelineChart)를 위해 남긴 별칭이다.
 */
export { dateShort as shortDate } from '../../utils/format';

/** 플랫폼 표시명 — 선언 순서가 화면의 플랫폼 순서다(Reports·Recap 공통) */
export const PLATFORM_LABEL = {
  [PLATFORM.META]: 'Meta',
  [PLATFORM.TIKTOK]: 'TikTok',
};

// 같은 이름(phase)의 캠페인을 플랫폼별로 묶어 하나의 타임라인 막대 + Budget
// Breakdown 한 행으로 합친다 — "G10 Grand Opening"이 Meta/TikTok 두 캠페인으로
// 나뉘어 있어도 하나의 phase로 취급한다(실사용 피드백: 플랫폼별로 행이
// 중복돼 보이는 게 불편했음). 기간은 두 플랫폼의 시작일 중 이른 날짜~
// 종료일 중 늦은 날짜로 합친다(보통 동일하지만, 혹시 다르더라도 안전).
//
// 묶음 키는 이름 그대로가 아니라 campaignNameKey()다 — 플랫폼마다 사람이 따로
// 이름을 지어서 구분자 공백이 흔들린다(schema.js의 함수 주석에 실제 사례).
// 표시는 그 그룹에서 처음 만난 원본 이름을 쓴다.
export function buildPhaseTimeline(campaigns) {
  const byName = new Map();
  campaigns.forEach((c) => {
    const key = campaignNameKey(c.name);
    if (!byName.has(key)) byName.set(key, { name: c.name, group: [] });
    byName.get(key).group.push(c);
  });
  return [...byName.entries()]
    .map(([key, { name, group }]) => {
      const startDate = group.reduce((min, c) => (c.startDate < min ? c.startDate : min), group[0].startDate);
      const endDate = group.reduce((max, c) => (c.endDate > max ? c.endDate : max), group[0].endDate);
      /* 같은 플랫폼 캠페인이 한 phase에 여러 개면(같은 게시물 재부스팅 등) 덮어쓰지
         않고 누적한다 — 덮어쓰면 totalBudget(전체 합)과 플랫폼 칸의 합이 어긋나서
         Budget Breakdown 행이 자기 Total과 안 맞게 된다. */
      const byPlatform = {};
      group.forEach((c) => {
        const acc = byPlatform[c.platform] ?? { daily: null, total: 0 };
        if (c.budgetDaily != null) acc.daily = (acc.daily ?? 0) + c.budgetDaily;
        acc.total += effectiveBudgetPlanned(c) ?? 0;
        byPlatform[c.platform] = acc;
      });
      const totalBudget = group.reduce((sum, c) => sum + (effectiveBudgetPlanned(c) ?? 0), 0);
      // 플랫폼별 일일 예산의 합 = 이 phase가 하루에 쓰는 돈. 막대 라벨이
      // 총액과 함께 이 값을 말한다 — "하루 얼마씩"과 "총 얼마"는 예산을
      // 판단할 때 서로 대체되지 않는 두 질문이다. 아무 플랫폼도 일일 예산을
      // 안 쓰면 null(있는 것만 말한다).
      const dailyValues = group.map((c) => c.budgetDaily).filter((v) => v != null);
      const totalDaily = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) : null;
      const days = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      /* 이 막대가 어느 플랫폼을 덮는지. 합쳐진 막대의 숫자가 두 플랫폼 합계라는
         사실이 화면에 없으면 한 캠페인 지출로 오독된다. 동시에, phase에 캠페인이
         하나뿐일 때는 "이게 Meta냐 TikTok이냐"에 답한다 — 원래 신고("ALL일 때
         구분이 안 간다")의 나머지 절반이다. 순서는 PLATFORM_LABEL 선언 순서로
         고정한다(데이터 순서를 따르면 동기화 순서에 따라 표기가 흔들린다). */
      const platformLabel = Object.keys(PLATFORM_LABEL)
        .filter((p) => byPlatform[p])
        .map((p) => PLATFORM_LABEL[p])
        .join(' + ');
      return {
        key,
        name,
        startDate,
        endDate,
        days,
        byPlatform,
        platformLabel,
        totalBudget,
        totalDaily,
      };
    })
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
}
