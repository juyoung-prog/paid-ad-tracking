/**
 * Paid Ads Tracking Dashboard — Mock Data
 *
 * 실제 값(캠페인명, 매장명, 성과 수치 등)은 이 파일에만 둔다.
 * 타입/enum/계산 로직은 schema.js에서만 관리하며 이 파일은 그 구조를 따르는
 * 샘플 인스턴스만 제공한다. 컴포넌트 스토리(.stories.jsx)에서만 import한다 —
 * 컴포넌트 파일 자체에서는 이 파일을 직접 import하지 않는다.
 *
 * 실제 서비스에서 Campaign/PerformanceRecord/Alert의 id는 UUID v4를 쓰지만,
 * 여기서는 Storybook 표에서 사람이 읽기 쉽도록 짧은 슬러그를 사용한다.
 */

import {
  PLATFORM,
  REGION,
  STORE_STATUS,
  TARGET_SCOPE,
  GOAL,
  MANUAL_STATUS,
  ALERT_TYPE,
} from './schema';

// ============================================================
// Store — 조지아 10개(운영중) + 플로리다 5개(운영중), 실제 매장 목록 그대로
// ============================================================

/** @type {import('./schema').Store[]} */
export const mockStores = [
  { id: 'G01', name: 'Camp Creek', shortCode: 'BC', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-01-15T09:00:00Z' },
  { id: 'G02', name: 'Duluth', shortCode: 'BD', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-01-15T09:00:00Z' },
  { id: 'G03', name: 'Greenbriar', shortCode: 'BG', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-01-15T09:00:00Z' },
  { id: 'G04', name: 'Morrow', shortCode: 'BJ', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-02-01T09:00:00Z' },
  { id: 'G05', name: 'Headland', shortCode: 'BM', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-02-01T09:00:00Z' },
  { id: 'G06', name: 'Old National', shortCode: 'BO', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-03-10T09:00:00Z' },
  { id: 'G07', name: 'Riverdale', shortCode: 'BR', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-03-10T09:00:00Z' },
  { id: 'G08', name: 'Douglasville', shortCode: 'BV', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-05-20T09:00:00Z' },
  { id: 'G09', name: 'Columbus', shortCode: 'BMC', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-05-20T09:00:00Z' },
  { id: 'G10', name: 'Union City', shortCode: 'BU', region: REGION.GA, status: STORE_STATUS.ACTIVE, createdAt: '2024-08-01T09:00:00Z' },
  { id: 'BF1', name: 'Orlando', region: REGION.FL, status: STORE_STATUS.ACTIVE, createdAt: '2025-01-10T09:00:00Z' },
  { id: 'BF2', name: 'Miami Garden', region: REGION.FL, status: STORE_STATUS.ACTIVE, createdAt: '2025-01-10T09:00:00Z' },
  { id: 'BF3', name: 'Florida Mall', region: REGION.FL, status: STORE_STATUS.ACTIVE, createdAt: '2025-03-05T09:00:00Z' },
  { id: 'BF4', name: 'Tamarac', region: REGION.FL, status: STORE_STATUS.ACTIVE, createdAt: '2025-03-05T09:00:00Z' },
  { id: 'BF5', name: 'West Palm Beach', region: REGION.FL, status: STORE_STATUS.ACTIVE, createdAt: '2025-06-01T09:00:00Z' },
];

// ============================================================
// AdAccount — 메타(조지아/플로리다 분리) + 틱톡(통합)
// ============================================================

/** @type {import('./schema').AdAccount[]} */
export const mockAdAccounts = [
  { id: 'meta-ga', platform: PLATFORM.META, region: REGION.GA, label: 'Meta - Georgia' },
  { id: 'meta-fl', platform: PLATFORM.META, region: REGION.FL, label: 'Meta - Florida' },
  { id: 'tiktok-unified', platform: PLATFORM.TIKTOK, region: REGION.ALL, label: 'TikTok - Unified' },
];

// ============================================================
// Campaign — 상태/알림/귀속 규칙을 전부 한 번씩 실제로 보여주는 10개 샘플
// 기준일(today) = 2026-07-20 (오늘 날짜 컨텍스트와 동일하게 맞춤)
// ============================================================

/** @type {import('./schema').Campaign[]} */
export const mockCampaigns = [
  {
    // 진행중 — 복수 매장 타겟, 예산 소진 속도가 빠른 pacing 위험 사례
    id: 'camp-02',
    name: 'Summer Sale Traffic',
    platform: PLATFORM.META,
    accountId: 'meta-fl',
    targetScope: TARGET_SCOPE.MULTI_STORE,
    targetStoreIds: ['BF1', 'BF2', 'BF3'],
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budgetPlanned: 2000.0,
    budgetDaily: 65.0,
    goal: GOAL.TRAFFIC,
    manualStatus: null,
    creativeUrl: 'https://business.facebook.com/adsmanager/manage/campaigns?campaign_id=002',
    createdAt: '2026-06-25T09:00:00Z',
    updatedAt: '2026-07-20T09:00:00Z',
  },
  {
    // 진행중 — 전체 매장 타겟 (매장 귀속 규칙: 예산 분배하지 않는 케이스)
    id: 'camp-03',
    name: 'TikTok Brand Awareness',
    platform: PLATFORM.TIKTOK,
    accountId: 'tiktok-unified',
    targetScope: TARGET_SCOPE.ALL_STORES,
    targetStoreIds: [],
    startDate: '2026-07-10',
    endDate: '2026-08-10',
    budgetPlanned: 3000.0,
    goal: GOAL.AWARENESS,
    manualStatus: null,
    creativeUrl: 'https://ads.tiktok.com/i18n/campaign/003',
    createdAt: '2026-07-05T09:00:00Z',
    updatedAt: '2026-07-20T09:00:00Z',
  },
  {
    // 종료 + 성과 보고 완료
    id: 'camp-04',
    name: 'Engagement Push Georgia',
    platform: PLATFORM.META,
    accountId: 'meta-ga',
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: ['G05'],
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    budgetPlanned: 800.0,
    goal: GOAL.ENGAGEMENT,
    manualStatus: null,
    creativeUrl: 'https://business.facebook.com/adsmanager/manage/campaigns?campaign_id=004',
    createdAt: '2026-05-25T09:00:00Z',
    updatedAt: '2026-07-03T09:00:00Z',
  },
  {
    // 종료됐지만 PerformanceRecord가 아직 없는 캠페인
    id: 'camp-05',
    name: 'Holiday Conversion FL',
    platform: PLATFORM.META,
    accountId: 'meta-fl',
    targetScope: TARGET_SCOPE.MULTI_STORE,
    targetStoreIds: ['BF4', 'BF5'],
    startDate: '2026-06-15',
    endDate: '2026-07-05',
    budgetPlanned: 1200.0,
    goal: GOAL.CONVERSION,
    manualStatus: null,
    creativeUrl: 'https://business.facebook.com/adsmanager/manage/campaigns?campaign_id=005',
    createdAt: '2026-06-10T09:00:00Z',
    updatedAt: '2026-06-10T09:00:00Z',
  },
  {
    // manualStatus 예시 — 날짜상 아직 안 끝났지만 조기 종료 처리.
    // thumbnailUrl을 의도적으로 비워둠(키 자체를 안 둠) — CampaignThumbnail의
    // 이니셜 대체 표시(소재 미등록 상태)가 실제 목록에서도 보이도록 하는 대조 사례.
    id: 'camp-06',
    name: 'Early Stopped Test',
    platform: PLATFORM.META,
    accountId: 'meta-ga',
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: ['G03'],
    startDate: '2026-07-05',
    endDate: '2026-07-25',
    budgetPlanned: 500.0,
    goal: GOAL.TRAFFIC,
    manualStatus: MANUAL_STATUS.ENDED_EARLY,
    creativeUrl: null,
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-18T09:00:00Z',
  },
  {
    // manualStatus 예시 — 보관 처리
    id: 'camp-07',
    name: 'Archived Old Campaign',
    platform: PLATFORM.TIKTOK,
    accountId: 'tiktok-unified',
    targetScope: TARGET_SCOPE.ALL_STORES,
    targetStoreIds: [],
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    budgetPlanned: 1200.0,
    goal: GOAL.AWARENESS,
    manualStatus: MANUAL_STATUS.ARCHIVED,
    creativeUrl: null,
    createdAt: '2026-04-25T09:00:00Z',
    updatedAt: '2026-06-01T09:00:00Z',
  },
  {
    // 진행중 — 종료 D-3 (ending_soon 알림 대상), store_visit 목표
    id: 'camp-08',
    name: 'Ending Soon Campaign',
    platform: PLATFORM.META,
    accountId: 'meta-ga',
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: ['G02'],
    startDate: '2026-07-05',
    endDate: '2026-07-23',
    budgetPlanned: 900.0,
    goal: GOAL.STORE_VISIT,
    manualStatus: null,
    creativeUrl: 'https://business.facebook.com/adsmanager/manage/campaigns?campaign_id=008',
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-20T09:00:00Z',
  },
  {
    // overlap_target 알림 쌍 — camp-09 vs camp-10: 같은 platform·store·goal, 기간 겹침
    id: 'camp-09',
    name: 'Georgia Traffic Push A',
    platform: PLATFORM.META,
    accountId: 'meta-ga',
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: ['G01'],
    startDate: '2026-07-15',
    endDate: '2026-08-05',
    budgetPlanned: 600.0,
    goal: GOAL.TRAFFIC,
    manualStatus: null,
    creativeUrl: null,
    createdAt: '2026-07-12T09:00:00Z',
    updatedAt: '2026-07-12T09:00:00Z',
  },
  {
    // camp-09와 겹치는 캠페인 (같은 store/platform/goal + 기간 겹침 → overlap 알림 트리거)
    id: 'camp-10',
    name: 'Georgia Traffic Push B',
    platform: PLATFORM.META,
    accountId: 'meta-ga',
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: ['G01'],
    startDate: '2026-07-20',
    endDate: '2026-08-10',
    budgetPlanned: 700.0,
    goal: GOAL.TRAFFIC,
    manualStatus: null,
    creativeUrl: null,
    createdAt: '2026-07-19T09:00:00Z',
    updatedAt: '2026-07-19T09:00:00Z',
  },
  {
    // camp-09/10과 매장·기간은 같지만 goal이 달라 overlap 알림이 트리거되지 않는 대조 사례
    id: 'camp-11',
    name: 'Georgia Awareness (No Overlap Alert)',
    platform: PLATFORM.META,
    accountId: 'meta-ga',
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: ['G01'],
    startDate: '2026-07-20',
    endDate: '2026-08-10',
    budgetPlanned: 400.0,
    goal: GOAL.AWARENESS,
    manualStatus: null,
    creativeUrl: null,
    thumbnailUrl: '/campaign-thumbnails/camp-11.png',
    createdAt: '2026-07-19T09:00:00Z',
    updatedAt: '2026-07-19T09:00:00Z',
  },
];

// ============================================================
// PerformanceRecord — 종료/보고 완료된 캠페인, pacing 위험 캠페인만 값 존재
// ============================================================

/** @type {import('./schema').PerformanceRecord[]} */
export const mockPerformanceRecords = [
  {
    // camp-02 (Summer Sale Traffic) — budget_pacing 알림 대상
    // 예산 2000 중 이미 1800 소진(90%), 기간은 31일 중 20일 경과(65%) → 소진 속도가 기간보다 빠름
    id: 'perf-01',
    campaignId: 'camp-02',
    impressions: 210000,
    reach: 150000,
    clicks: 2600,
    spend: 1800.0,
    videoPlays: 207900,
    avgWatchSeconds: 3.3,
    follows: 10,
    profileVisits: 588,
    hookViews: 68000,
    heldViews: 15000,
    engagements: null,
    conversions: null,
  },
  {
    // camp-04 (Engagement Push Georgia) — 종료 + 보고 완료
    id: 'perf-02',
    campaignId: 'camp-04',
    impressions: 95000,
    reach: 71000,
    clicks: 1100,
    spend: 780.5,
    videoPlays: 94050,
    avgWatchSeconds: 3.26,
    likes: 1575,
    comments: 42,
    shares: 483,
    follows: 4,
    profileVisits: 266,
    hookViews: 30000,
    heldViews: 8000,
    engagements: 2100,
    conversions: null,
  },
  // camp-05 (Holiday Conversion FL)는 의도적으로 레코드 없음
];

// ============================================================
// PerformanceDaily — 성과 레코드가 있는 캠페인의 일별 분해(합성)
// ============================================================

/**
 * 누적 spend를 캠페인 기간(시나리오 기준일 2026-07-20 이전까지)에 균등 분배해
 * 일별 행을 합성한다. 마지막 날이 반올림 오차를 흡수해 일별 합 = 누적이 정확히
 * 맞는다 — Reports의 기간 필터 스토리가 "잘린 합"과 "누적"을 대조해 보여주는
 * 데이터라, 둘이 어긋나면 스토리 자체가 버그처럼 보인다.
 * impressions/clicks도 같은 방식으로 나눈다(내림 후 마지막 날 보정).
 *
 * 스토리가 자기 로컬 캠페인으로 일별 데이터를 합성할 때도 이 함수를 쓴다 —
 * 같은 로직을 스토리마다 복제하면 "합=누적" 보정이 한쪽만 고쳐진다.
 */
export function spreadDailyOverCampaign(campaign, record, todayISO = '2026-07-20') {
  // 기본값은 paidAdsPageUtils의 MOCK_TODAY와 같은 날(pages를 역참조하지 않으려
  // 상수로). 다른 기준일로 시나리오를 짜는 스토리는 세 번째 인자로 넘긴다.
  const start = new Date(`${campaign.startDate}T00:00:00Z`);
  const endISO = campaign.endDate < todayISO ? campaign.endDate : todayISO;
  const end = new Date(`${endISO}T00:00:00Z`);
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  if (days <= 0) return [];

  const perDaySpend = Math.floor((record.spend / days) * 100) / 100;
  const perDayImpressions = record.impressions != null ? Math.floor(record.impressions / days) : null;
  const perDayClicks = record.clicks != null ? Math.floor(record.clicks / days) : null;

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const isLast = i === days - 1;
    return {
      id: `daily-${campaign.id}-${i}`,
      campaignId: campaign.id,
      date: d.toISOString().slice(0, 10),
      spend: isLast ? Math.round((record.spend - perDaySpend * (days - 1)) * 100) / 100 : perDaySpend,
      impressions: perDayImpressions != null
        ? (isLast ? record.impressions - perDayImpressions * (days - 1) : perDayImpressions)
        : null,
      clicks: perDayClicks != null
        ? (isLast ? record.clicks - perDayClicks * (days - 1) : perDayClicks)
        : null,
    };
  });
}

/** @type {import('./schema').PerformanceDaily[]} */
export const mockPerformanceDaily = mockPerformanceRecords.flatMap((record) => {
  const campaign = mockCampaigns.find((c) => c.id === record.campaignId);
  return campaign ? spreadDailyOverCampaign(campaign, record) : [];
});

// ============================================================
// Alert — 실제 트리거 조건에 맞게 3가지 유형만 생성
// new_store_reminder는 Alert 엔티티에 넣지 않는다 (visual-direction 결정:
// 캠페인에 종속된 알림이 아니라 /stores 페이지 내 안내 문구로만 처리)
// ============================================================

/** @type {import('./schema').Alert[]} */
export const mockAlerts = [
  {
    id: 'alert-01',
    campaignId: 'camp-08',
    type: ALERT_TYPE.ENDING_SOON,
    triggeredAt: '2026-07-20T00:00:00Z',
    resolvedAt: null,
    message: 'D-3 — Ending Soon Campaign 종료 임박',
  },
  {
    id: 'alert-03',
    campaignId: 'camp-02',
    type: ALERT_TYPE.BUDGET_PACING,
    triggeredAt: '2026-07-20T00:00:00Z',
    resolvedAt: null,
    message: 'Summer Sale Traffic — 예산 소진 속도가 기간 대비 빠릅니다 (90% 소진 / 65% 경과)',
  },
  {
    id: 'alert-04',
    campaignId: 'camp-10',
    type: ALERT_TYPE.OVERLAP_TARGET,
    triggeredAt: '2026-07-20T00:00:00Z',
    resolvedAt: null,
    message: 'Georgia Traffic Push B — Georgia Traffic Push A와 같은 매장·목표로 기간이 겹칩니다',
  },
  // missing_performance 재도입에 맞춘 샘플 — AlertBanner 스토리가 고긴급 3종을
  // 전부 커버하도록. 실런타임에서는 generateAlerts()가 "종료 + 성과 레코드
  // 부재 + 종료 후 30일 이내" 조건으로 생성한다.
  {
    id: 'alert-05',
    campaignId: 'camp-04',
    type: ALERT_TYPE.MISSING_PERFORMANCE,
    triggeredAt: '2026-07-20T00:00:00Z',
    resolvedAt: null,
    message: 'Spring Grand Opening — ended 5d ago with no performance data — enter results to complete reporting',
  },
];

// ============================================================
// Recap — 캠페인 종료 후 결과 보고 (Build Plan Phase 1)
//
// 위 mockCampaigns와 섞지 않고 따로 둔다 — Dashboard/Reports 스토리의 개수·KPI
// 확인 포인트가 위 목록을 세고 있어서, 여기에 이벤트 다섯 개를 더하면 그 스토리
// 문서가 전부 틀린 숫자를 말하게 된다. Recap 스토리는 이 목록만 쓴다.
//
// 구성: 보고 대상 'G10 Opening'(2026-06~08) + 비교군 이벤트 넷. Meta의 Coming
// Soon / Grand Opening은 비교군이 3개 이상이라 숫자가 나오고, TikTok은 2개뿐이라
// "not enough data"가 나온다. Now Open(store_visit)은 어디에도 짝이 없어 none.
// ============================================================

/** Recap 목 캠페인 한 건 — 반복되는 필드는 여기서 채운다 */
function recapCampaign(id, group, name, platform, store, startDate, endDate, budgetDaily, goal) {
  return {
    id,
    name,
    campaignGroup: group,
    platform,
    accountId: platform === PLATFORM.TIKTOK ? 'tiktok-unified' : (store.startsWith('BF') ? 'meta-fl' : 'meta-ga'),
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: [store],
    startDate,
    endDate,
    budgetPlanned: 0,
    budgetDaily,
    goal,
    manualStatus: null,
    creativeUrl: null,
    externalCampaignId: `ext-${id}`,
    createdAt: `${startDate}T09:00:00Z`,
    updatedAt: `${endDate}T09:00:00Z`,
  };
}

/** Recap 목 성과 레코드 — 없는 값은 null */
function recapRecord(campaignId, m) {
  return {
    id: `perf-${campaignId}`,
    campaignId,
    recordedAt: '2026-09-01',
    source: 'api',
    impressions: m.impressions ?? null,
    reach: m.reach ?? null,
    clicks: m.clicks ?? null,
    spend: m.spend,
    videoPlays: m.videoPlays ?? null,
    hookViews: m.hookViews ?? null,
    heldViews: m.heldViews ?? null,
    avgWatchSeconds: m.avgWatchSeconds ?? null,
    likes: m.likes ?? null,
    comments: m.comments ?? null,
    shares: m.shares ?? null,
    follows: m.follows ?? null,
    profileVisits: m.profileVisits ?? null,
    engagements: m.engagements ?? null,
    conversions: m.conversions ?? null,
  };
}

const M = PLATFORM.META;
const T = PLATFORM.TIKTOK;

/** @type {import('./schema').Campaign[]} */
export const mockRecapCampaigns = [
  // 보고 대상 — G10 Opening
  recapCampaign('rc-g10-cs-m', 'G10 Opening', 'G10_Coming Soon_0617~0707', M, 'G10', '2026-06-17', '2026-07-07', 10, GOAL.AWARENESS),
  recapCampaign('rc-g10-cs-t', 'G10 Opening', 'G10_Coming Soon_0617~0707', T, 'G10', '2026-06-17', '2026-07-07', 10, GOAL.AWARENESS),
  recapCampaign('rc-g10-go-m', 'G10 Opening', 'G10_Grand Opening_0706~0801', M, 'G10', '2026-07-06', '2026-08-01', 30, GOAL.AWARENESS),
  recapCampaign('rc-g10-go-t', 'G10 Opening', 'G10_Grand Opening_0706~0801', T, 'G10', '2026-07-06', '2026-08-01', 30, GOAL.AWARENESS),
  recapCampaign('rc-g10-no-m', 'G10 Opening', 'G10_Now Open_0706~0831', M, 'G10', '2026-07-06', '2026-08-31', 20, GOAL.STORE_VISIT),
  recapCampaign('rc-g10-deals-m', 'G10 Opening', 'G10_1 Month Deals_0710~0831', M, 'G10', '2026-07-10', '2026-08-31', 20, GOAL.TRAFFIC),
  // 비교군 — BF4 Opening (2026-04)
  recapCampaign('rc-bf4-cs-m', 'BF4 Opening', 'BF4_Coming Soon_0327~0412', M, 'BF4', '2026-03-27', '2026-04-12', 5, GOAL.AWARENESS),
  recapCampaign('rc-bf4-go-m', 'BF4 Opening', 'BF4_Grand Opening_0413~0502', M, 'BF4', '2026-04-13', '2026-05-02', 40, GOAL.AWARENESS),
  recapCampaign('rc-bf4-go-t', 'BF4 Opening', 'BF4_Grand Opening_0413~0502', T, 'BF4', '2026-04-13', '2026-05-02', 40, GOAL.AWARENESS),
  recapCampaign('rc-bf4-deals-m', 'BF4 Opening', 'BF4_1MonthDeals_0417~0531', M, 'BF4', '2026-04-17', '2026-05-31', 20, GOAL.TRAFFIC),
  // 비교군 — BF3 Opening (2025-10)
  recapCampaign('rc-bf3-cs-m', 'BF3 Opening', 'BF3_Coming Soon_1001~1015', M, 'BF3', '2025-10-01', '2025-10-15', 8, GOAL.AWARENESS),
  recapCampaign('rc-bf3-go-m', 'BF3 Opening', 'BF3_Grand Opening_1016~1110', M, 'BF3', '2025-10-16', '2025-11-10', 35, GOAL.AWARENESS),
  recapCampaign('rc-bf3-go-t', 'BF3 Opening', 'BF3_Grand Opening_1016~1110', T, 'BF3', '2025-10-16', '2025-11-10', 30, GOAL.AWARENESS),
  recapCampaign('rc-bf3-deals-m', 'BF3 Opening', 'BF3_1 Month Deals_1020~1130', M, 'BF3', '2025-10-20', '2025-11-30', 15, GOAL.TRAFFIC),
  // 비교군 — G09 Opening (2025-06)
  recapCampaign('rc-g09-cs-m', 'G09 Opening', 'G09_Coming Soon_0601~0614', M, 'G09', '2025-06-01', '2025-06-14', 8, GOAL.AWARENESS),
  recapCampaign('rc-g09-go-m', 'G09 Opening', 'G09_Grand Opening_0615~0710', M, 'G09', '2025-06-15', '2025-07-10', 30, GOAL.AWARENESS),
  recapCampaign('rc-g09-deals-m', 'G09 Opening', 'G09_1 Month Deals_0620~0731', M, 'G09', '2025-06-20', '2025-07-31', 15, GOAL.TRAFFIC),
  // 비교군 — G08 Opening (2025-03)
  recapCampaign('rc-g08-go-m', 'G08 Opening', 'G08_Grand Opening_0301~0325', M, 'G08', '2025-03-01', '2025-03-25', 25, GOAL.AWARENESS),
  recapCampaign('rc-g08-deals-m', 'G08 Opening', 'G08_1 Month Deals_0305~0410', M, 'G08', '2025-03-05', '2025-04-10', 15, GOAL.TRAFFIC),
];

/** @type {import('./schema').PerformanceRecord[]} */
export const mockRecapPerformanceRecords = [
  // G10 — Coming Soon(Meta)은 CPM이 비교군 중 가장 싸고 Hook은 중간, Grand Opening(Meta)은 Hook 최고
  recapRecord('rc-g10-cs-m', { spend: 210.4, impressions: 98000, reach: 61000, clicks: 240, videoPlays: 90000, hookViews: 21600, heldViews: 5400, avgWatchSeconds: 3.1, likes: 180, comments: 6, shares: 40, engagements: 226 }),
  recapRecord('rc-g10-cs-t', { spend: 205.7, impressions: 120000, reach: 54000, clicks: 130, videoPlays: 118000, hookViews: 11800, heldViews: 3500, avgWatchSeconds: 1.9, likes: 210, comments: 4, shares: 25, engagements: 239 }),
  recapRecord('rc-g10-go-m', { spend: 812.5, impressions: 265000, reach: 151000, clicks: 3900, videoPlays: 250000, hookViews: 92500, heldViews: 30000, avgWatchSeconds: 4.2, likes: 620, comments: 18, shares: 540, engagements: 1178 }),
  recapRecord('rc-g10-go-t', { spend: 776.9, impressions: 340000, reach: 128000, clicks: 1200, videoPlays: 335000, hookViews: 46900, heldViews: 15400, avgWatchSeconds: 2.1, likes: 410, comments: 9, shares: 120, engagements: 539 }),
  recapRecord('rc-g10-no-m', { spend: 1119.3, impressions: 464000, reach: 163000, clicks: 2900, videoPlays: 296000, hookViews: 68400, heldViews: 10400, avgWatchSeconds: 3.5, likes: 300, comments: 11, shares: 210, engagements: 521, conversions: 64 }),
  recapRecord('rc-g10-deals-m', { spend: 771.2, impressions: 301000, reach: 120000, clicks: 4100, videoPlays: 280000, hookViews: 58800, heldViews: 12300, avgWatchSeconds: 3.0, likes: 250, comments: 8, shares: 160, engagements: 418 }),
  // BF4
  recapRecord('rc-bf4-cs-m', { spend: 64.3, impressions: 31000, reach: 22700, clicks: 40, videoPlays: 22500, hookViews: 3900, heldViews: 390, avgWatchSeconds: 2.4, likes: 44, comments: 2, shares: 33, engagements: 79 }),
  recapRecord('rc-bf4-go-m', { spend: 755.9, impressions: 165000, reach: 44300, clicks: 4400, videoPlays: 100000, hookViews: 37400, heldViews: 11900, avgWatchSeconds: 4.8, likes: 508, comments: 10, shares: 601, engagements: 1119 }),
  recapRecord('rc-bf4-go-t', { spend: 776.7, impressions: 210000, reach: 17000, clicks: 700, videoPlays: 205000, hookViews: 29300, heldViews: 10100, avgWatchSeconds: 1.9, likes: 152, comments: 0, shares: 141, engagements: 293 }),
  recapRecord('rc-bf4-deals-m', { spend: 1025.4, impressions: 420000, reach: 143000, clicks: 5100, videoPlays: 256000, hookViews: 54300, heldViews: 16100, avgWatchSeconds: 3.4, likes: 95, comments: 4, shares: 168, engagements: 267 }),
  // BF3
  recapRecord('rc-bf3-cs-m', { spend: 118.0, impressions: 52000, reach: 38000, clicks: 90, videoPlays: 47000, hookViews: 8900, heldViews: 1700, avgWatchSeconds: 2.6, likes: 60, comments: 3, shares: 21, engagements: 84 }),
  recapRecord('rc-bf3-go-m', { spend: 890.2, impressions: 240000, reach: 132000, clicks: 3100, videoPlays: 215000, hookViews: 64500, heldViews: 19400, avgWatchSeconds: 3.9, likes: 430, comments: 12, shares: 380, engagements: 822 }),
  recapRecord('rc-bf3-go-t', { spend: 640.0, impressions: 260000, reach: 99000, clicks: 800, videoPlays: 255000, hookViews: 30600, heldViews: 9200, avgWatchSeconds: 1.8, likes: 190, comments: 3, shares: 70, engagements: 263 }),
  recapRecord('rc-bf3-deals-m', { spend: 612.8, impressions: 250000, reach: 101000, clicks: 3300, videoPlays: 230000, hookViews: 46000, heldViews: 11500, avgWatchSeconds: 3.1, likes: 140, comments: 5, shares: 90, engagements: 235 }),
  // G09
  recapRecord('rc-g09-cs-m', { spend: 104.5, impressions: 44000, reach: 33000, clicks: 70, videoPlays: 40000, hookViews: 7200, heldViews: 1300, avgWatchSeconds: 2.5, likes: 52, comments: 2, shares: 18, engagements: 72 }),
  recapRecord('rc-g09-go-m', { spend: 760.0, impressions: 230000, reach: 125000, clicks: 2600, videoPlays: 205000, hookViews: 55400, heldViews: 15900, avgWatchSeconds: 3.7, likes: 380, comments: 9, shares: 300, engagements: 689 }),
  recapRecord('rc-g09-deals-m', { spend: 588.4, impressions: 236000, reach: 96000, clicks: 2700, videoPlays: 210000, hookViews: 42000, heldViews: 9900, avgWatchSeconds: 2.9, likes: 120, comments: 4, shares: 75, engagements: 199 }),
  // G08
  recapRecord('rc-g08-go-m', { spend: 610.0, impressions: 176000, reach: 98000, clicks: 1900, videoPlays: 160000, hookViews: 40000, heldViews: 11200, avgWatchSeconds: 3.5, likes: 290, comments: 7, shares: 210, engagements: 507 }),
  recapRecord('rc-g08-deals-m', { spend: 540.0, impressions: 205000, reach: 84000, clicks: 2100, videoPlays: 180000, hookViews: 34200, heldViews: 7900, avgWatchSeconds: 2.8, likes: 90, comments: 3, shares: 60, engagements: 153 }),
];

/** @type {import('./schema').EventRecap[]} */
export const mockEventRecaps = [
  {
    id: 'recap-g10',
    eventName: 'G10 Opening',
    status: 'draft',
    summary: {
      en: 'Grand Opening carried the event: the strongest hook rate and share volume of any opening so far. Coming Soon built reach cheaply but did not move clicks, and the store-visit push after opening has no comparable campaign yet.',
      ko: null,
      'zh-Hant': null,
    },
    learnings: [
      {
        title: { en: 'Urgency beats announcement', ko: null, 'zh-Hant': null },
        body: { en: 'The Grand Opening creative that said "open now, come this week" outperformed the softer Coming Soon message on every action metric.', ko: null, 'zh-Hant': null },
      },
      {
        title: { en: 'TikTok reaches, Instagram converts', ko: null, 'zh-Hant': null },
        body: { en: 'TikTok delivered cheaper impressions but far fewer clicks per dollar. Keep TikTok as the awareness layer and let Meta carry the call to action.', ko: null, 'zh-Hant': null },
      },
    ],
    nextSteps: { en: 'Keep the opening structure. Put the K-Beauty category message in the Coming Soon phase so the teaser gives people a reason to visit, not just a date.', ko: null, 'zh-Hant': null },
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-05T15:20:00Z',
  },
];

/** @type {import('./schema').RecapCampaignNote[]} */
export const mockRecapCampaignNotes = [
  {
    id: 'note-g10-go-m',
    recapId: 'recap-g10',
    campaignId: 'rc-g10-go-m',
    verdict: 'good',
    strength: { en: 'Clicks, landing-page visits and shares were all the strongest in the event.', ko: null, 'zh-Hant': null },
    weakness: { en: 'Largest budget of the event — audience fatigue will need managing if the creative is reused.', ko: null, 'zh-Hant': null },
    reason: { en: 'Opening-week urgency, a clear call to action and a concrete reason to visit lined up.', ko: null, 'zh-Hant': null },
    organicViews: 100250,
    organicEngagements: null,
  },
  {
    id: 'note-g10-cs-m',
    recapId: 'recap-g10',
    campaignId: 'rc-g10-cs-m',
    verdict: null,
    strength: { en: 'Cheapest reach of the event.', ko: null, 'zh-Hant': null },
    weakness: { en: 'Almost no clicks — the teaser announced but did not persuade.', ko: null, 'zh-Hant': null },
    reason: null,
    organicViews: null,
    organicEngagements: null,
  },
  {
    id: 'note-g10-cs-t',
    recapId: 'recap-g10',
    campaignId: 'rc-g10-cs-t',
    verdict: 'bad',
    strength: null,
    weakness: { en: 'Low hook rate for the spend; the vertical cut of the teaser did not hold attention.', ko: null, 'zh-Hant': null },
    reason: { en: 'The creative was a resized Instagram asset rather than a TikTok-native cut.', ko: null, 'zh-Hant': null },
    organicViews: null,
    organicEngagements: null,
  },
];
