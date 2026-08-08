/**
 * Supabase 행(snake_case) ↔ 프론트 모델(camelCase) 변환.
 *
 * 이 파일이 두 스키마의 유일한 접점이다. 컬럼명이 바뀌면 여기만 고치면 되고,
 * 화면 코드(src/data/schema.js의 타입)는 그대로 둔다.
 *
 * DB에만 있고 프론트가 안 쓰는 컬럼(campaigns.event_tag/tags,
 * performance_records.result_url/reported_at)은 의도적으로 옮기지 않는다.
 */

/** numeric/bigint는 드라이버에 따라 문자열로 올 수 있어 숫자로 정규화한다. */
function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ============================================================
// Store
// ============================================================

export function rowToStore(row) {
  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code ?? undefined,
    region: row.region,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function storeToRow(store) {
  return {
    id: store.id,
    name: store.name,
    short_code: store.shortCode ?? null,
    region: store.region,
    status: store.status,
  };
}

// ============================================================
// AdAccount
// ============================================================

export function rowToAdAccount(row) {
  return {
    id: row.id,
    platform: row.platform,
    region: row.region,
    label: row.label,
    externalAccountId: row.external_account_id ?? null,
    /* 청구 상태. 캠페인 지출을 더해서는 나오지 않는 값이라 플랫폼에서 직접
       읽어 저장한다(sync-campaigns의 syncMetaBilling). 없으면 null —
       0으로 바꾸지 않는다: "미납액 0"과 "아직 못 읽었다"는 전혀 다른 상태다. */
    balanceDue: row.balance_due != null ? Number(row.balance_due) : null,
    balanceAvailable: row.balance_available != null ? Number(row.balance_available) : null,
    balanceSyncedAt: row.balance_synced_at ?? null,
    invoiceThreshold: row.invoice_threshold != null ? Number(row.invoice_threshold) : null,
  };
}

// ============================================================
// Campaign
// ============================================================

export function rowToCampaign(row) {
  return {
    id: row.id,
    name: row.name,
    campaignGroup: row.campaign_group ?? null,
    platform: row.platform,
    accountId: row.account_id,
    targetScope: row.target_scope,
    targetStoreIds: row.target_store_ids ?? [],
    startDate: row.start_date,
    endDate: row.end_date,
    budgetPlanned: num(row.budget_planned) ?? 0,
    budgetDaily: num(row.budget_daily),
    goal: row.goal,
    manualStatus: row.manual_status ?? null,
    creativeUrl: row.creative_url ?? null,
    thumbnailUrl: row.thumbnail_url ?? null,
    // 서버 소유(동기화가 채움) — campaignToRow에 넣지 않는다(사용자 저장이 덮으면 안 됨)
    adLink: row.ad_link ?? null,
    externalCampaignId: row.external_campaign_id ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 프론트 모델 → DB 행. id/createdAt은 넘기지 않는다 —
 * id는 uuid 컬럼인데 프론트의 generateId()는 "camp-<uuid>" 형태라 타입이 안 맞고,
 * 신규 삽입 시에는 DB의 gen_random_uuid() 기본값이 채우는 게 맞다.
 *
 * @param {object} campaign
 * @param {boolean} [isPartial] - true면 undefined인 필드를 결과에서 뺀다(부분 수정용)
 */
export function campaignToRow(campaign, isPartial = false) {
  const row = {
    name: campaign.name,
    campaign_group: campaign.campaignGroup ?? null,
    platform: campaign.platform,
    account_id: campaign.accountId,
    target_scope: campaign.targetScope,
    target_store_ids: campaign.targetStoreIds,
    start_date: campaign.startDate,
    end_date: campaign.endDate,
    budget_planned: campaign.budgetPlanned,
    budget_daily: campaign.budgetDaily ?? null,
    goal: campaign.goal,
    manual_status: campaign.manualStatus ?? null,
    creative_url: campaign.creativeUrl ?? null,
    thumbnail_url: campaign.thumbnailUrl ?? null,
    notes: campaign.notes ?? null,
    updated_at: new Date().toISOString(),
  };

  // 부분 수정에서는 호출자가 안 준 필드를 null로 덮어쓰면 안 된다.
  // (예: 이름만 바꾸는 patch가 예산을 null로 지워버리는 사고를 막는다)
  // 위에서 `?? null`을 거치며 undefined가 이미 null이 됐으므로, 판별은
  // row가 아니라 원본 campaign 객체를 봐야 한다.
  if (isPartial) {
    for (const [modelKey, rowKey] of Object.entries(PARTIAL_KEY_MAP)) {
      if (campaign[modelKey] === undefined) delete row[rowKey];
    }
  }
  return row;
}

/** campaignToRow가 부분 수정에서 "안 준 필드"를 판별하기 위한 모델키 → 행키 대응표. */
const PARTIAL_KEY_MAP = {
  name: 'name',
  campaignGroup: 'campaign_group',
  platform: 'platform',
  accountId: 'account_id',
  targetScope: 'target_scope',
  targetStoreIds: 'target_store_ids',
  startDate: 'start_date',
  endDate: 'end_date',
  budgetPlanned: 'budget_planned',
  budgetDaily: 'budget_daily',
  goal: 'goal',
  manualStatus: 'manual_status',
  creativeUrl: 'creative_url',
  thumbnailUrl: 'thumbnail_url',
  notes: 'notes',
};

// ============================================================
// PerformanceRecord
// ============================================================

export function rowToPerformanceRecord(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    impressions: num(row.impressions),
    reach: num(row.reach),
    clicks: num(row.clicks),
    spend: num(row.spend) ?? 0,
    videoPlays: num(row.video_plays),
    hookViews: num(row.hook_views),
    heldViews: num(row.held_views),
    avgWatchSeconds: num(row.avg_watch_seconds),
    likes: num(row.likes),
    comments: num(row.comments),
    shares: num(row.shares),
    engagements: num(row.engagements),
    follows: num(row.follows),
    profileVisits: num(row.profile_visits),
    conversions: num(row.conversions),
  };
}

/**
 * 프론트 모델 → DB 행. 화면에서 저장하는 값은 항상 source='manual'이다 —
 * API 동기화(source='api')와 같은 날짜라도 별개 행으로 공존해야
 * 자동 동기화가 사용자가 손으로 넣은 값을 덮어쓰지 않는다.
 *
 * @param {object} record
 * @param {string} recordedAt - YYYY-MM-DD
 */
export function performanceRecordToRow(record, recordedAt) {
  return {
    campaign_id: record.campaignId,
    recorded_at: recordedAt,
    source: 'manual',
    impressions: record.impressions ?? null,
    reach: record.reach ?? null,
    clicks: record.clicks ?? null,
    spend: record.spend ?? 0,
    video_plays: record.videoPlays ?? null,
    hook_views: record.hookViews ?? null,
    held_views: record.heldViews ?? null,
    avg_watch_seconds: record.avgWatchSeconds ?? null,
    likes: record.likes ?? null,
    comments: record.comments ?? null,
    shares: record.shares ?? null,
    engagements: record.engagements ?? null,
    follows: record.follows ?? null,
    profile_visits: record.profileVisits ?? null,
    conversions: record.conversions ?? null,
  };
}

// ============================================================
// Plan — 집행 전 계획. 캠페인과 별개 객체다(plans 테이블 주석 참고).
// ============================================================

export function rowToPlanItem(row) {
  return {
    id: row.id,
    planId: row.plan_id,
    label: row.label,
    platform: row.platform,
    startDate: row.start_date,
    endDate: row.end_date,
    // 총액은 저장하지 않는다 — planItemTotal()이 기간을 곱해 구한다.
    budgetDaily: Number(row.budget_daily),
    sortOrder: row.sort_order ?? 0,
  };
}

/**
 * plan 행 + 그 하위 item 행들을 하나의 Plan으로 합친다.
 * items는 sortOrder → 시작일 순으로 정렬해 화면이 정렬 책임을 지지 않게 한다.
 */
export function rowToPlan(row, itemRows = []) {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes ?? null,
    items: itemRows
      .filter((i) => i.plan_id === row.id)
      .map(rowToPlanItem)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.startDate.localeCompare(b.startDate)),
  };
}
