// pg_cron(1일 1회) 또는 프론트 "지금 동기화"가 invoke. 연결된 모든 계정의 캠페인 목록을
// 가져와 campaigns 테이블에 넣는다(external_campaign_id 기준). 05-api-integration.md
// "왜 웹훅이 아니라 폴링인가" 참고 — 두 플랫폼 다 캠페인 변경 웹훅을 제공하지 않는다.
//
// 이미 있는 캠페인은 이름만 갱신한다. 기간/타겟/목표/예산은 사용자가 화면에서 채우고
// 다듬는 값이라, 매일 도는 동기화가 덮어쓰면 손으로 넣은 정보가 조용히 날아간다.
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

/** campaigns에 넣을 행. NOT NULL 컬럼이 하나라도 빠지면 insert가 통째로 실패한다. */
type CampaignRow = {
  owner_id: string;
  platform: string;
  account_id: string;
  external_campaign_id: string;
  name: string;
  target_scope: string;
  target_store_ids: string[];
  start_date: string;
  end_date: string;
  budget_planned: number;
  goal: string;
};

function toISODate(value: Date) {
  return value.toISOString().slice(0, 10);
}

/**
 * 캠페인 이름에서 기간을 읽는다. 이 계정의 명명 규칙이 "..._MMDD~MMDD" 형태로
 * 일관돼 있어(예: "G10_1_Month Deals_0710~0831") 날짜를 지어내는 대신 여기서 얻는다.
 * 구분자로 ~ 대신 -를 쓴 것도 있고 뒤에 "_2" 같은 접미사가 붙기도 한다.
 *
 * 연도는 플랫폼이 준 생성 시각에서 가져온다. 끝이 시작보다 앞서면 해를 넘긴 것으로 본다.
 */
function parseRangeFromName(name: string, createdAt: Date) {
  const match = name.match(/(\d{2})(\d{2})\s*[~-]\s*(\d{2})(\d{2})/);
  if (!match) return null;

  const [, startMonth, startDay, endMonth, endDay] = match;
  const year = createdAt.getUTCFullYear();
  const start = new Date(Date.UTC(year, Number(startMonth) - 1, Number(startDay)));
  const end = new Date(Date.UTC(year, Number(endMonth) - 1, Number(endDay)));

  // 월/일이 실제로 존재하는지 확인한다 — "1231~1345" 같은 문자열이 조용히 통과하면 안 된다.
  if (start.getUTCMonth() !== Number(startMonth) - 1 || end.getUTCMonth() !== Number(endMonth) - 1) {
    return null;
  }
  if (end < start) end.setUTCFullYear(year + 1);

  return { startDate: toISODate(start), endDate: toISODate(end) };
}

/**
 * 이름에서 기간을 못 읽었을 때의 대체값. 생성일부터 오늘까지로 둔다 —
 * 끝을 미래로 지어내면 대시보드가 "진행중"이라고 거짓말하고, 하루짜리로 두면 종료된 것으로
 * 보여 성과 동기화 대상에서 빠진다. 사용자가 화면에서 고치면 그 값이 유지된다.
 */
function fallbackRange(createdAt: Date) {
  const today = toISODate(new Date());
  const created = toISODate(createdAt);
  return { startDate: created <= today ? created : today, endDate: today };
}

// ============================================================
// Meta
// ============================================================

async function fetchMetaCampaigns(accessToken: string, externalAccountId: string) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/act_${externalAccountId}/campaigns?fields=id,name,status,objective,start_time,stop_time,created_time,lifetime_budget&access_token=${accessToken}`
  );
  const json = await res.json();
  if (json?.error) {
    console.error('Meta campaigns 조회 실패', json.error);
    return [];
  }
  return json.data ?? [];
}

/** Meta objective → 우리 goal enum. 모르는 값은 traffic으로 둔다(가장 중립적). */
function mapMetaGoal(objective: string | undefined) {
  switch (objective) {
    case 'OUTCOME_AWARENESS':
    case 'BRAND_AWARENESS':
    case 'REACH':
      return 'awareness';
    case 'OUTCOME_ENGAGEMENT':
    case 'POST_ENGAGEMENT':
    case 'VIDEO_VIEWS':
      return 'engagement';
    case 'OUTCOME_SALES':
    case 'CONVERSIONS':
      return 'conversion';
    case 'STORE_VISITS':
    case 'OUTCOME_STORE_VISITS':
      return 'store_visit';
    default:
      return 'traffic';
  }
}

function mapMetaCampaign(item: any, base: Pick<CampaignRow, 'owner_id' | 'platform' | 'account_id'>): CampaignRow {
  const createdAt = new Date(item.created_time ?? Date.now());
  const fallback = fallbackRange(createdAt);
  // Meta는 캠페인에 기간이 있으므로 이름을 파싱할 필요가 없다.
  const startDate = item.start_time ? item.start_time.slice(0, 10) : fallback.startDate;
  const endDate = item.stop_time ? item.stop_time.slice(0, 10) : fallback.endDate;

  return {
    ...base,
    external_campaign_id: String(item.id),
    name: item.name,
    target_scope: 'all_stores',
    target_store_ids: [],
    start_date: startDate,
    end_date: endDate < startDate ? startDate : endDate,
    budget_planned: Number(item.lifetime_budget ?? 0) / 100, // Meta는 최소 화폐 단위(센트)로 준다
    goal: mapMetaGoal(item.objective),
  };
}

// ============================================================
// TikTok
// ============================================================

async function fetchTikTokCampaigns(accessToken: string, advertiserId: string) {
  const res = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${advertiserId}`,
    { headers: { 'Access-Token': accessToken } }
  );
  const json = await res.json();
  // TikTok은 HTTP 200에 body의 code로 실패를 알린다 — res.ok만 보면 에러를 놓친다.
  if (json?.code !== 0) {
    console.error('TikTok campaign/get 실패', { code: json?.code, message: json?.message });
    return [];
  }
  return json?.data?.list ?? [];
}

/** TikTok objective → 우리 goal enum. 모르는 값은 traffic으로 둔다. */
function mapTikTokGoal(objective: string | undefined) {
  switch (objective) {
    case 'REACH':
      return 'awareness';
    case 'VIDEO_VIEWS':
    case 'ENGAGEMENT':
      return 'engagement';
    case 'CONVERSIONS':
    case 'PRODUCT_SALES':
      return 'conversion';
    default:
      return 'traffic';
  }
}

function mapTikTokCampaign(item: any, base: Pick<CampaignRow, 'owner_id' | 'platform' | 'account_id'>): CampaignRow {
  const createdAt = new Date(item.create_time ?? Date.now());
  const range = parseRangeFromName(item.campaign_name ?? '', createdAt) ?? fallbackRange(createdAt);

  return {
    ...base,
    external_campaign_id: String(item.campaign_id),
    name: item.campaign_name,
    // 어느 매장을 대상으로 하는지는 플랫폼이 모르는 우리 쪽 정보다. 이름의 접두사
    // (G10 / BF2 / AllStores)로 유추할 수 있지만 규칙이 깨지면 조용히 틀린 매장에
    // 귀속되므로, 비워두고 사용자가 화면에서 지정하게 한다.
    target_scope: 'all_stores',
    target_store_ids: [],
    start_date: range.startDate,
    end_date: range.endDate,
    // BUDGET_MODE_INFINITE면 budget이 0으로 온다. 계획 예산은 사용자가 넣는 값이다.
    budget_planned: Number(item.budget ?? 0),
    goal: mapTikTokGoal(item.objective),
  };
}

// ============================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = supabaseAdmin();

  // ad_accounts를 임베드로 끌어오지 않고 따로 읽는다 — PostgREST의 to-one 임베드는
  // supabase-js 타입 추론에서 배열로 잡혀 deno check(배포 시 실행됨)를 통과하지 못한다.
  const [{ data: connections, error }, { data: adAccounts, error: accError }] = await Promise.all([
    admin.from('connections').select('owner_id, platform, account_id, access_token'),
    admin.from('ad_accounts').select('id, external_account_id'),
  ]);

  if (error || accError) {
    return new Response(JSON.stringify({ error: error?.message ?? accError?.message }), { status: 500, headers: corsHeaders });
  }

  const externalIdByAccount = new Map(
    (adAccounts ?? []).map((a) => [a.id, a.external_account_id])
  );

  const results: Record<string, { inserted: number; updated: number; failed: number }> = {};
  const errors: string[] = [];

  for (const conn of connections ?? []) {
    const externalAccountId = externalIdByAccount.get(conn.account_id);
    const key = `${conn.platform}:${conn.account_id}`;
    results[key] = { inserted: 0, updated: 0, failed: 0 };

    if (!externalAccountId) {
      errors.push(`${key}: ad_accounts.external_account_id가 없습니다`);
      continue;
    }

    const base = { owner_id: conn.owner_id, platform: conn.platform, account_id: conn.account_id };
    const raw =
      conn.platform === 'meta'
        ? await fetchMetaCampaigns(conn.access_token, externalAccountId)
        : await fetchTikTokCampaigns(conn.access_token, externalAccountId);

    const rows: CampaignRow[] = raw.map((item: any) =>
      conn.platform === 'meta' ? mapMetaCampaign(item, base) : mapTikTokCampaign(item, base)
    );
    if (rows.length === 0) continue;

    // 이미 있는 캠페인은 이름만 갱신한다. 전체 upsert로 덮으면 사용자가 화면에서
    // 채운 기간·타겟·예산·목표가 매일 동기화 때마다 기본값으로 되돌아간다.
    const { data: existing, error: existingError } = await admin
      .from('campaigns')
      .select('external_campaign_id')
      .in('external_campaign_id', rows.map((r) => r.external_campaign_id));

    if (existingError) {
      errors.push(`${key}: 기존 캠페인 조회 실패 — ${existingError.message}`);
      continue;
    }
    const existingIds = new Set((existing ?? []).map((c) => c.external_campaign_id));

    for (const row of rows) {
      // 한 건이 실패해도 나머지는 계속한다 — 부분 성공이 전체 실패보다 낫다.
      if (existingIds.has(row.external_campaign_id)) {
        const { error: updateError } = await admin
          .from('campaigns')
          .update({ name: row.name, updated_at: new Date().toISOString() })
          .eq('external_campaign_id', row.external_campaign_id);

        if (updateError) {
          console.error('campaigns 갱신 실패', { id: row.external_campaign_id, message: updateError.message });
          errors.push(`${row.name}: ${updateError.message}`);
          results[key].failed += 1;
        } else {
          results[key].updated += 1;
        }
        continue;
      }

      const { error: insertError } = await admin.from('campaigns').insert(row);
      if (insertError) {
        console.error('campaigns 삽입 실패', { id: row.external_campaign_id, message: insertError.message });
        errors.push(`${row.name}: ${insertError.message}`);
        results[key].failed += 1;
      } else {
        results[key].inserted += 1;
      }
    }
  }

  // 실패가 있으면 200으로 "성공"이라 말하지 않는다 — 예전 버전이 저장 결과를 보지 않고
  // 가져온 건수만 세는 바람에, 0건 저장하고도 10건 동기화했다고 보고했다.
  return new Response(JSON.stringify({ synced: results, errors }), {
    status: errors.length > 0 ? 207 : 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
