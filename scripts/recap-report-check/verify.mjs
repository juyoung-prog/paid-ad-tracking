/**
 * recap-report.gs의 순수 계산부를 node로 돌려 대시보드(schema.js 등)와 항목별로 대조한다.
 *   node --import ./scripts/recap-report-check/register.mjs scripts/recap-report-check/verify.mjs [--real]
 *   (--real: .env.local의 anon 키로 Supabase를 읽어 실데이터 전 이벤트를 대조한다)
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const schema = await import(`${ROOT}/src/data/schema.js`);
const strings = await import(`${ROOT}/src/data/recapStrings.js`);
const rowView = await import(`${ROOT}/src/components/data-display/recapRowView.js`);
const pageUtils = await import(`${ROOT}/src/pages/paidAdsDashboard/paidAdsPageUtils.js`);
const mappers = await import(`${ROOT}/src/pages/paidAdsDashboard/paidAdsMappers.js`);
const format = await import(`${ROOT}/src/utils/format.js`);
const mock = await import(`${ROOT}/src/data/paidAdsMockData.js`);
const recapSheets = await import(`${ROOT}/src/utils/recapSheets.js`);

// ---- .gs를 그대로 evaluate — Apps Script 전역은 없다. 순수부만 부르므로 문제 없어야 한다
const src = fs.readFileSync(`${ROOT}/public/recap-report.gs`, 'utf8');
const sandbox = { console, module: { exports: {} } };
vm.runInNewContext(src, sandbox, { filename: 'recap-report.gs' });
const gs = sandbox.module.exports;

// ---- 그리드 만들기: Supabase CSV처럼 snake_case 헤더, 날짜는 시트가 Date로 바꾼 것처럼
const CAMPAIGN_COLS = ['id', 'name', 'campaign_group', 'platform', 'account_id', 'target_scope', 'target_store_ids', 'start_date', 'end_date', 'budget_planned', 'budget_daily', 'goal'];
const PERF_COLS = ['id', 'campaign_id', 'recorded_at', 'source', 'spend', 'impressions', 'reach', 'clicks', 'video_plays', 'hook_views', 'held_views', 'avg_watch_seconds', 'likes', 'comments', 'shares', 'engagements', 'follows', 'profile_visits', 'conversions'];
const toSheetDate = (iso) => (iso ? new Date(`${iso}T00:00:00`) : '');
function gridsFromModel(campaigns, records) {
  const cRows = campaigns.map((c) => [c.id, c.name, c.campaignGroup ?? '', c.platform, c.accountId ?? '', c.targetScope ?? '', `{${(c.targetStoreIds ?? []).join(',')}}`, toSheetDate(c.startDate), toSheetDate(c.endDate), c.budgetPlanned ?? '', c.budgetDaily ?? '', c.goal]);
  const pRows = records.map((r) => [r.id ?? '', r.campaignId, toSheetDate(r.recordedAt), r.source ?? '', r.spend ?? '', r.impressions ?? '', r.reach ?? '', r.clicks ?? '', r.videoPlays ?? '', r.hookViews ?? '', r.heldViews ?? '', r.avgWatchSeconds ?? '', r.likes ?? '', r.comments ?? '', r.shares ?? '', r.engagements ?? '', r.follows ?? '', r.profileVisits ?? '', r.conversions ?? '']);
  return { campaigns: [CAMPAIGN_COLS, ...cRows], performance: [PERF_COLS, ...pRows] };
}

// ---- 비교
const near = (a, b) => (a == null && b == null) || (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : a === b);
const mismatches = [];
function check(scope, field, dash, sheet) {
  const ok = Array.isArray(dash) ? JSON.stringify(dash) === JSON.stringify(sheet) : near(dash, sheet);
  if (!ok) mismatches.push({ scope, field, dashboard: dash, sheet });
  return ok;
}

function dashboardHeadlineText(h) {
  if (!h) return null;
  return strings.t(h.rank === 1 ? 'recap.headline.best' : 'recap.headline.rank', 'en', { rank: h.rank, total: h.total, metric: strings.metricLabel(h.metricKey, 'en') });
}
function dashboardPosition(stat) {
  return stat && stat.peerScope !== 'none' && stat.percentile != null
    ? `${stat.band === 'top' ? '↗ ' : stat.band === 'bottom' ? '↘ ' : ''}${strings.benchmarkPositionText(stat, 'en')}`
    : null;
}
function dashboardPacing(ratio) {
  if (ratio == null) return null;
  if (ratio >= schema.RECAP_PACING_FLAG.over) return strings.t('recap.table.over', 'en', { pct: Math.round((ratio - 1) * 100) });
  if (ratio <= schema.RECAP_PACING_FLAG.under) return strings.t('recap.table.under', 'en', { pct: Math.round((1 - ratio) * 100) });
  return null;
}

function compareEvent(label, eventName, campaigns, records, grids) {
  const model = gs.buildReportModel(grids, new Date('2026-09-11'), eventName);
  const dash = schema.buildRecapRows(eventName, campaigns, records, {});
  const headline = schema.buildRecapHeadline(eventName, campaigns, records);
  const eventCampaigns = dash.campaigns;
  const allRows = Object.values(dash.byPlatform).flat();
  const scope = `${label} / ${eventName}`;

  // 머리글
  const spendValues = allRows.map((r) => r.spend).filter((v) => v != null);
  check(scope, 'header.spend', spendValues.length ? spendValues.reduce((a, b) => a + b, 0) : null, model.spend);
  check(scope, 'header.plannedBudget', eventCampaigns.reduce((s, c) => s + (schema.effectiveBudgetPlanned(c) ?? 0), 0) || null, model.plannedBudget);
  check(scope, 'header.campaignCount', eventCampaigns.length, model.campaignCount);
  check(scope, 'header.startDate', eventCampaigns.reduce((m, c) => (c.startDate < m ? c.startDate : m), eventCampaigns[0].startDate), model.startDate);
  check(scope, 'header.endDate', eventCampaigns.reduce((m, c) => (c.endDate > m ? c.endDate : m), eventCampaigns[0].endDate), model.endDate);
  check(scope, 'header.stores', [...new Set(eventCampaigns.flatMap((c) => c.targetStoreIds ?? []))].sort(), model.stores);
  check(scope, 'header.periodText', format.dateRange(model.startDate, model.endDate), model.periodText);
  check(scope, 'headline.text', dashboardHeadlineText(headline), model.headline?.text ?? null);
  check(scope, 'headline.peerEvents', headline?.peerEvents ?? null, model.headline?.peerEvents ?? null);

  // 타임라인
  const phases = pageUtils.buildPhaseTimeline(eventCampaigns);
  const spendByPhaseKey = allRows.reduce((acc, r) => { const k = schema.campaignNameKey(r.name); if (r.spend != null) acc[k] = (acc[k] ?? 0) + r.spend; return acc; }, {});
  check(scope, 'timeline.count', phases.length, model.phases.length);
  phases.forEach((p, i) => {
    const s = model.phases[i] ?? {};
    const ps = `${scope} / phase ${p.name}`;
    check(ps, 'name', rowView.phaseDisplayName(p.name), s.name);
    check(ps, 'platformLabel', p.platformLabel, s.platformLabel);
    check(ps, 'startDate', p.startDate, s.startDate);
    check(ps, 'endDate', p.endDate, s.endDate);
    check(ps, 'days', p.days, s.days);
    check(ps, 'totalDaily', p.totalDaily, s.totalDaily);
    check(ps, 'totalBudget', p.totalBudget || null, s.totalBudget);
    check(ps, 'spent', spendByPhaseKey[p.key] ?? null, s.spent);
  });

  // 캠페인 표
  const sheetRows = Object.fromEntries(model.sections.flatMap((s) => s.rows).map((r) => [r.campaignId, r]));
  check(scope, 'platform.order', Object.keys(pageUtils.PLATFORM_LABEL).filter((p) => dash.byPlatform[p]), model.sections.map((s) => s.platform));
  let rowCount = 0;
  allRows.forEach((r) => {
    const s = sheetRows[r.campaignId];
    const rs = `${scope} / ${r.phaseName} (${r.platform})`;
    if (!s) { mismatches.push({ scope: rs, field: 'row', dashboard: 'present', sheet: 'missing' }); return; }
    rowCount += 1;
    check(rs, 'rank', r.rank, s.rank);
    check(rs, 'phaseName', r.phaseName, s.phaseName);
    check(rs, 'storeCode', r.storeCode, s.storeCode);
    check(rs, 'goal', rowView.goalText(r.goal, 'en'), s.goalLabel);
    check(rs, 'dailyBudget', r.dailyBudget, s.dailyBudget);
    check(rs, 'spend', r.spend, s.spend);
    check(rs, 'plannedBudget', r.plannedBudget, s.plannedBudget);
    check(rs, 'pacingText', dashboardPacing(r.pacingRatio), s.pacingText);
    const { kpi, stat } = rowView.primaryKpiOf(r);
    check(rs, 'primaryKpi.metricKey', kpi.metricKey, s.primaryKpiKey);
    check(rs, 'primaryKpi.value', kpi.value, s.primaryKpiValue);
    check(rs, 'primaryKpi.vsPast', dashboardPosition(stat), s.primaryKpiVsPast);
    ['reach', 'impressions', 'videoPlays', 'avgWatchSeconds', 'clicks', 'likes', 'comments', 'shares', 'conversions'].forEach((k) => check(rs, k, r[k], s[k]));
    schema.BENCHMARK_METRICS.forEach((m) => {
      check(rs, m.key, r[m.key], s[m.key]);
      check(rs, `${m.key}.vsPast`, dashboardPosition(r.benchmarks[m.key]), s[`${m.key}VsPast`]);
      check(rs, `${m.key}.percentile`, r.benchmarks[m.key].percentile, s.benchmarks[m.key].percentile);
      check(rs, `${m.key}.median`, r.benchmarks[m.key].median, s.benchmarks[m.key].median);
      check(rs, `${m.key}.peerScope`, r.benchmarks[m.key].peerScope, s.benchmarks[m.key].peerScope);
      check(rs, `${m.key}.sampleSize`, r.benchmarks[m.key].sampleSize, s.benchmarks[m.key].sampleSize);
    });
    const cells = rowView.insightCellsOf(r, 'en');
    check(rs, 'worked', cells[0].text ?? null, s.worked);
    check(rs, 'improve', cells[1].text ?? null, s.improve);
  });
  return { model, dash, headline, rowCount };
}

function printSummary(model, dash, headline) {
  const allRows = Object.values(dash.byPlatform).flat();
  const money = (v) => (v == null ? '—' : `$${v.toFixed(2)}`);
  const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(2)}%`);
  console.log(`\n== ${model.eventName} ==`);
  console.log(`headline  dashboard: ${dashboardHeadlineText(headline) ?? '—'} | sheet: ${model.headline?.text ?? '—'}`);
  console.log(`spend     dashboard: ${money(allRows.map((r) => r.spend).filter((v) => v != null).reduce((a, b) => a + b, 0))} | sheet: ${money(model.spend)}`);
  const lines = [['platform', 'rank', 'campaign', 'kpi', 'dash value', 'sheet value', 'dash vs past', 'sheet vs past', 'hook d/s', 'hold d/s', 'worked =', 'improve =']];
  model.sections.forEach((sec) => sec.rows.forEach((s) => {
    const r = allRows.find((x) => x.campaignId === s.campaignId);
    const { kpi, stat } = rowView.primaryKpiOf(r);
    const cells = rowView.insightCellsOf(r, 'en');
    const f = rowView.kpiFormat(kpi.metricKey);
    lines.push([sec.label, `${r.rank}/${s.rank}`, s.phaseName, kpi.metricKey ?? '—', kpi.value == null ? '—' : f(kpi.value), s.primaryKpiValue == null ? '—' : f(s.primaryKpiValue),
      dashboardPosition(stat) ?? '—', s.primaryKpiVsPast ?? '—', `${pct(r.hookRate)}/${pct(s.hookRate)}`, `${pct(r.holdRate)}/${pct(s.holdRate)}`,
      (cells[0].text ?? null) === s.worked ? 'same' : 'DIFF', (cells[1].text ?? null) === s.improve ? 'same' : 'DIFF']);
  }));
  const widths = lines[0].map((_, i) => Math.max(...lines.map((l) => String(l[i]).length)));
  lines.forEach((l) => console.log(l.map((c, i) => String(c).padEnd(widths[i])).join('  ')));
}

// ---- 1) 목 데이터
let checksBefore = 0;
{
  const campaigns = mock.mockRecapCampaigns;
  const records = mock.mockRecapPerformanceRecords;
  const grids = gridsFromModel(campaigns, records);
  const events = schema.buildRecapEvents(campaigns, records);
  let rows = 0;
  let primary = null;
  for (const e of events) {
    const out = compareEvent('mock', e.eventName, campaigns, records, grids);
    rows += out.rowCount;
    if (!primary) primary = out;
  }
  console.log(`[mock] events ${events.length}, campaign rows compared ${rows}, mismatches ${mismatches.length}`);
  check('mock', 'default event (no name)', events[0].eventName, gs.buildReportModel(grids, new Date(), null).eventName);
  printSummary(primary.model, primary.dash, primary.headline);
  checksBefore = mismatches.length;
}

// ---- 2) 실데이터 (Supabase anon 읽기) — --real 일 때만
if (process.argv.includes('--real')) {
  const env = Object.fromEntries(fs.readFileSync(`${ROOT}/.env.local`, 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => l.split('=').map((s) => s.trim())));
  const headers = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` };
  const fetchAll = async (table, order) => {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=*&order=${order}&offset=${from}&limit=1000`, { headers });
      if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
      const page = await res.json();
      out.push(...page);
      if (page.length < 1000) break;
    }
    return out;
  };
  const campaignRows = await fetchAll('campaigns', 'start_date.desc');
  const perfRows = await fetchAll('performance_records', 'campaign_id,recorded_at');
  const latestRows = await fetchAll('performance_records_latest', 'campaign_id');
  const campaigns = campaignRows.map(mappers.rowToCampaign);
  const records = latestRows.map(mappers.rowToPerformanceRecord); // 대시보드가 실제로 읽는 것
  // 기본 경로(DATA_SOURCE='supabase'): 스크립트는 campaigns + performance_records_latest JSON을 rowsToGrid로 2차원 배열로 만든다
  const grids = { campaigns: gs.rowsToGrid(campaignRows), performance: gs.rowsToGrid(latestRows) };
  // 대안 경로(DATA_SOURCE='sheet'): CSV를 탭에 가져온 것 — 날짜는 Date, 성과는 전체 이력(최신 1건 고르기는 스크립트 규칙 1)
  const sheetGrids = { campaigns: [CAMPAIGN_COLS, ...campaignRows.map((r) => CAMPAIGN_COLS.map((k) => (k.endsWith('_date') ? toSheetDate(r[k]) : k === 'target_store_ids' ? `{${(r[k] ?? []).join(',')}}` : r[k] ?? '')))],
    performance: [PERF_COLS, ...perfRows.map((r) => PERF_COLS.map((k) => (k === 'recorded_at' ? toSheetDate(r[k]) : r[k] ?? '')))] };
  const events = schema.buildRecapEvents(campaigns, records);
  let rows = 0;
  let primary = null;
  for (const e of events) {
    const out = compareEvent('real', e.eventName, campaigns, records, grids);
    rows += out.rowCount;
    if (!primary) primary = out;
  }
  console.log(`\n[real · DB rows via rowsToGrid] campaigns ${campaigns.length}, events ${events.length}, campaign rows compared ${rows}, mismatches ${mismatches.length - checksBefore}`);
  checksBefore = mismatches.length;
  let sheetRowsCompared = 0;
  for (const e of events) sheetRowsCompared += compareEvent('real/sheet', e.eventName, campaigns, records, sheetGrids).rowCount;
  console.log(`[real · CSV tabs] performance rows ${perfRows.length}, campaign rows compared ${sheetRowsCompared}, mismatches ${mismatches.length - checksBefore}`);
  // 다운로드 시 템플릿 채우기 — 자리표시자가 남지 않아야 한다
  const filled = recapSheets.fillRecapScript(src, { url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY });
  check('real', 'script.placeholdersFilled', false, /__SUPABASE_(URL|ANON_KEY)__/.test(filled));
  check('real', 'script.urlFilled', true, filled.includes(`url: '${env.VITE_SUPABASE_URL}'`));
  if (primary) printSummary(primary.model, primary.dash, primary.headline);
}

if (mismatches.length) {
  console.log('\nMISMATCHES');
  mismatches.slice(0, 60).forEach((m) => console.log(` ${m.scope} · ${m.field}: dashboard=${JSON.stringify(m.dashboard)} sheet=${JSON.stringify(m.sheet)}`));
  if (mismatches.length > 60) console.log(` … ${mismatches.length - 60} more`);
  process.exit(1);
}
console.log('\nALL MATCH');
