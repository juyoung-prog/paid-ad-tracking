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
];
