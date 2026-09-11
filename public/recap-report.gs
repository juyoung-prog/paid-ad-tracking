/**
 * Recap report — Google Sheets Apps Script
 * ------------------------------------------------------------
 * 설치 (4단계)
 *   1. 스프레드시트 메뉴 확장 프로그램 → Apps Script
 *   2. 열린 편집기의 Code.gs 내용을 전부 지우고 이 파일을 붙여 넣는다 → 저장(⌘S / Ctrl+S)
 *   3. 스프레드시트 탭으로 돌아와 새로고침한다 — 상단에 "Report" 메뉴가 생긴다
 *   4. Report → Refresh report. 첫 실행에서 권한 허용 1회(본인 계정, 이 스프레드시트 읽기·쓰기 + 대시보드 DB 읽기).
 *      이후로는 시트를 열 때마다 자동 갱신되고, 열어 둔 채 최신을 보려면 메뉴의 Refresh만 누른다.
 *
 * 데이터 흐름: 스크립트가 대시보드 데이터베이스(Supabase)를 **읽기 전용**으로 가져와 이 스프레드시트 안에 "Recap"
 * 탭을 그린다. 시트의 내용을 밖으로 보내는 요청은 없다. 읽기 키(anon)는 대시보드 화면이 쓰는 공개 키와 같은 것이고,
 * 대시보드 제목 옆 링크로 내려받으면 CONFIG.SUPABASE에 채워져 있다. (직접 복사한 파일이면 거기에 URL·키를 적는다.)
 *
 * 대안 — DB 대신 이 시트의 탭을 읽기: CONFIG.DATA_SOURCE = 'sheet'로 두고 SOURCE_GIDS에 탭 gid를 적는다
 *   (Supabase Table Editor → campaigns / performance_records → Export CSV → 파일 › 가져오기. 열 이름은 snake_case·camelCase 둘 다 읽는다)
 *
 * ------------------------------------------------------------
 * 산정 규칙 — 대시보드 src/data/schema.js와 **완전히 같다**. 두 화면 숫자가 어긋나면 보고가 깨진다.
 *   1. 캠페인당 성과 1건 = recorded_at이 가장 늦은 행, 같은 날이면 source='manual' 우선
 *      (Supabase 뷰 performance_records_latest와 같은 규칙)
 *   2. CPM = spend ÷ impressions × 1000 · CPC = spend ÷ clicks · CPA = spend ÷ conversions
 *      CTR = clicks ÷ impressions · Eng. rate = engagements ÷ impressions
 *      Cost/eng(cpe) = spend ÷ (likes + comments + shares) — 플랫폼의 engagements 합계는 쓰지 않는다
 *      Hook = hook_views ÷ video_plays · Hold = held_views ÷ hook_views
 *      분모가 0이거나 없으면 값은 없음(—). 0으로 만들지 않는다
 *   3. 이벤트 = campaign_group(없으면 캠페인 이름). 비교 키는 소문자·`_`→공백·대시/물결 통일·구분자 주변 공백 제거
 *   4. 단계 이름 = 이름에서 앞의 매장 코드(G10_)와 뒤의 기간(_0617~0707)을 벗긴 것
 *   5. 비교군(vs past) = 같은 플랫폼 + 같은 목표 + **다른 이벤트** + BENCHMARK_SINCE 이후 시작.
 *      같은 단계 이름이 3개 이상이면 그 안에서(phase), 아니면 같은 목표 전체(goal), 그것도 3개 미만이면 비교 없음
 *   6. 백분위 = (더 나쁜 수 + 동점 ÷ 2) ÷ 비교군 수 × 100, 반올림. 비용 지표는 낮을수록 좋음으로 뒤집는다.
 *      구간: ≥70 top · ≤30 bottom · 그 사이 mid. 값이 있는 비교군이 3개 미만이면 비교 없음
 *   7. Primary KPI = 목표별 하나: 인지 CPM · 트래픽 CPC · 참여 Cost/eng · 전환/매장 방문 CPA. 판정·등급 없음
 *   8. 플랫폼 안 순위 = Primary KPI 백분위 내림차순, 같으면 지출 내림차순. 백분위 없으면 맨 뒤
 *   9. 머리글 순위 = 이벤트의 최다 목표의 Primary KPI를 이벤트 단위로(분자·분모를 합쳐) 다시 계산해,
 *      단계 이름이 하나라도 겹치는 다른 이벤트들과 비교. 이 이벤트 포함 3개 미만이면 없음
 *  10. 계획 예산 = 저장된 budget_planned(>0) 아니면 일예산 × 기간 일수(양 끝 포함). 근거 없으면 없음
 *      집행률은 지출 ÷ 계획이 1.2 이상(Over) 또는 0.7 이하(Under)일 때만 적는다
 *  11. What worked / Could improve = 목표가 정한 후보 지표(GOAL_INSIGHT_METRICS) 중 top / bottom 구간인 것.
 *      대표(primary) 지표가 먼저, 같은 층이면 백분위 순. bottom이 없고 지출이 계획의 120%를 넘으면 초과 지출.
 *      후보가 없으면 "—" — 억지로 만들지 않는다. (사람이 대시보드 Edit에서 쓴 글은 이 시트에 없다)
 *
 * 구조
 *   · onOpen(단순 트리거) → 메뉴 + 갱신 시도(try/catch). 단순 트리거는 외부 읽기 권한이 없어 첫 갱신은 메뉴에서 해야 하고,
 *     그때 설치형 onOpen 트리거를 만들어 두어 다음 열기부터는 자동 갱신된다
 *   · refreshReport_ → readGrids_(DB 또는 gid 탭 → 2차원 배열) → buildReportModel(순수 계산) → renderReport_(clear 후 재렌더)
 *   · buildReportModel 아래는 Apps Script API를 쓰지 않는 순수 함수다 — node로 떼어 돌려 대시보드와 대조한다:
 *       node --import ./scripts/recap-report-check/register.mjs scripts/recap-report-check/verify.mjs [--real]
 *     (schema.js의 규칙·상수를 바꿨으면 이 파일의 CONFIG·계산부도 고치고 위 명령으로 다시 대조할 것)
 *   · 매 실행마다 sheet.clear()이므로 손으로 고친 서식은 사라진다. 유지할 디자인은 renderReport_에 있다
 */

// ============================================================
// CONFIG — 설정값은 여기 한 곳. ⚠ 산정 규칙 상수는 대시보드 src/data/schema.js와
// **수동 동기화**다. 대시보드에서 값을 바꾸면 여기도 같이 바꿔야 두 화면이 같은 숫자를 낸다.
// ============================================================
var CONFIG = {
  /** 데이터 원천 — 'supabase'(기본: 대시보드 DB를 읽기 전용으로 가져온다) 또는 'sheet'(이 시트의 탭을 읽는다) */
  DATA_SOURCE: 'supabase',
  /** 대시보드 DB 읽기 주소·공개 읽기 키. 대시보드 제목 옆 링크로 받은 파일에는 채워져 있다 */
  SUPABASE: {
    url: '__SUPABASE_URL__',
    anonKey: '__SUPABASE_ANON_KEY__',
  },
  /** DATA_SOURCE = 'sheet'일 때 원본 탭 — 이름이 아니라 gid(탭 URL 끝의 #gid=…). 탭 이름이 바뀌어도 안 깨진다 */
  SOURCE_GIDS: {
    campaigns: null,     // Supabase `campaigns` 표를 가져온 탭
    performance: null,   // Supabase `performance_records` 표를 가져온 탭. null이면 campaigns 탭 안의 두 번째 표를 쓴다
  },
  /** 보고서 탭 이름. 매 실행마다 이 탭을 만들거나 갱신한다 */
  REPORT_SHEET_NAME: 'Recap',
  /** 보고서 탭을 이 이름의 탭 바로 오른쪽에 둔다. null이거나 없으면 맨 왼쪽 */
  ANCHOR_SHEET_NAME: null,
  /** 보고할 이벤트(campaign_group 값). null이면 가장 최근에 끝난 이벤트 — 대시보드 Reports 목록의 첫 줄 */
  EVENT_NAME: null,

  // ---- 아래는 src/data/schema.js와 같은 값이어야 한다 ----
  /** 비교 대상 시작일 — 2024년 이전 캠페인은 지표가 거의 없다 (schema BENCHMARK_SINCE) */
  BENCHMARK_SINCE: '2024-01-01',
  /** 비교군 최소 수 — 이보다 적으면 벤치마크도 순위도 없다 (schema BENCHMARK_MIN_PEERS) */
  BENCHMARK_MIN_PEERS: 3,
  /** 백분위 구간 경계 (schema VERDICT_PERCENTILE) */
  VERDICT_PERCENTILE: { good: 70, bad: 30 },
  /** 집행률 표시 문턱 (schema RECAP_PACING_FLAG) */
  RECAP_PACING_FLAG: { over: 1.2, under: 0.7 },
  /** 초과 지출을 Could improve에 적는 비율 (schema OVERSPEND_RATIO) */
  OVERSPEND_RATIO: 0.2,
  /** 벤치마크 지표 — 비율 지표만, 비용은 낮을수록 좋음 (schema BENCHMARK_METRICS) */
  BENCHMARK_METRICS: [
    { key: 'cpm', lowerIsBetter: true },
    { key: 'cpc', lowerIsBetter: true },
    { key: 'cpa', lowerIsBetter: true },
    { key: 'cpe', lowerIsBetter: true },
    { key: 'ctr', lowerIsBetter: false },
    { key: 'hookRate', lowerIsBetter: false },
    { key: 'holdRate', lowerIsBetter: false },
    { key: 'engagementRate', lowerIsBetter: false },
  ],
  /** 목표별 Primary KPI — 하나씩 (schema GOAL_HEADLINE_METRICS) */
  GOAL_HEADLINE_METRICS: {
    awareness: ['cpm'],
    traffic: ['cpc'],
    engagement: ['cpe'],
    conversion: ['cpa'],
    store_visit: ['cpa'],
  },
  /** 해석 후보 지표 — 목표가 정한다 (schema GOAL_INSIGHT_METRICS) */
  GOAL_INSIGHT_METRICS: {
    awareness: { primary: ['cpm'], diagnostic: ['hookRate', 'holdRate', 'engagementRate', 'ctr'] },
    traffic: { primary: ['cpc', 'ctr'], diagnostic: ['hookRate', 'holdRate'] },
    engagement: { primary: ['cpe', 'engagementRate'], diagnostic: ['hookRate', 'holdRate'] },
    conversion: { primary: ['cpa'], diagnostic: ['ctr', 'cpc', 'hookRate', 'holdRate'] },
    store_visit: { primary: ['cpa'], diagnostic: ['ctr', 'cpc', 'hookRate', 'holdRate'] },
  },
  /** 예외 명단 — 이벤트가 아니라 "이벤트 미배정"을 뜻하는 campaign_group 값 (schema isUnassignedEvent) */
  UNASSIGNED_EVENT_PATTERN: /^(noname|no[\s_-]?name|unassigned|none|n\/a|-)$/i,
  /** 플랫폼 표시명·순서 (paidAdsPageUtils PLATFORM_LABEL) */
  PLATFORM_LABEL: { meta: 'Meta', tiktok: 'TikTok' },
  /** 목표 표시명 (recapStrings goalLabel.*) */
  GOAL_LABEL: { awareness: 'Awareness', traffic: 'Traffic', engagement: 'Engagement', conversion: 'Conversion', store_visit: 'Store visit' },
  /** 지표 표시명 (recapStrings metric.*) */
  METRIC_LABEL: { cpm: 'CPM', cpc: 'CPC', cpa: 'CPA', cpe: 'Cost/eng', ctr: 'CTR', hookRate: 'Hook', holdRate: 'Hold', engagementRate: 'Eng. rate' },
};

/**
 * 해석 문장 — 대시보드 src/data/recapStrings.js의 cell.worked.* / cell.improve.* (영어)와 수동 동기화.
 * 지표 종류가 문구를 고른다: cpe·cpc는 자기 문구, 나머지는 aspect(reach·hook·hold·click·engagement·result).
 */
var STRINGS = {
  worked: {
    reach: 'Reach efficiency stood out against comparable campaigns.',
    hook: 'Early video attention stood out against comparable campaigns.',
    hold: 'Watch-through stood out against comparable campaigns.',
    click: 'Click response stood out against comparable campaigns.',
    cpc: 'Cost per click stood out against comparable campaigns.',
    engagement: 'Engagement response stood out against comparable campaigns.',
    cpe: 'Engagement efficiency stood out against comparable campaigns.',
    result: 'Result efficiency stood out against comparable campaigns.',
  },
  improve: {
    reach: 'Reach efficiency was the clearest opportunity.',
    hook: 'Early video attention was the clearest opportunity.',
    hold: 'Watch-through was the clearest opportunity.',
    click: 'Click response was the clearest opportunity.',
    cpc: 'Cost per click was the clearest opportunity.',
    engagement: 'Engagement response was the clearest opportunity.',
    cpe: 'Engagement efficiency was the clearest opportunity.',
    result: 'Result efficiency was the clearest opportunity.',
    overspend: 'Spend ran {pct}% over plan.',
  },
};

var EMPTY = '—';

// ============================================================
// 메뉴 · 트리거
// ============================================================

/** 시트를 열면 메뉴를 만들고 보고서를 1회 갱신한다. 갱신 실패는 삼킨다 — 메뉴는 살아 있어야 한다 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Report')
    .addItem('Refresh report', 'refreshReport')
    .addItem('Refresh for event…', 'chooseEvent')
    .addSeparator()
    .addItem('Show tab gids', 'showTabGids')
    .addToUi();
  // 단순 트리거에서는 외부 읽기(UrlFetch) 권한이 없어 보통 실패한다 — 그래도 메뉴는 살아 있어야 한다.
  // 첫 Refresh 뒤에는 설치형 트리거(refreshOnOpen)가 열 때마다 대신 갱신한다
  try {
    refreshReport_({ silent: true });
  } catch (e) {
    console.warn('Recap auto-refresh skipped: ' + (e && e.message ? e.message : e));
  }
}

/** 설치형 onOpen 트리거 — 권한이 있는 문맥이라 DB를 읽어 자동 갱신할 수 있다 */
function refreshOnOpen() {
  try {
    refreshReport_({ silent: true });
  } catch (e) {
    console.warn('Recap auto-refresh failed: ' + (e && e.message ? e.message : e));
  }
}

/** refreshOnOpen 트리거가 없으면 만든다 — 메뉴 Refresh(권한 있는 문맥)에서만 부른다 */
function ensureOpenTrigger_() {
  try {
    var exists = ScriptApp.getProjectTriggers().some(function (tr) { return tr.getHandlerFunction() === 'refreshOnOpen'; });
    if (!exists) ScriptApp.newTrigger('refreshOnOpen').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onOpen().create();
  } catch (e) {
    console.warn('Could not install the open trigger: ' + (e && e.message ? e.message : e));
  }
}

/** 메뉴 → 보고서 갱신 */
function refreshReport() {
  refreshReport_({ silent: false });
}

/** 메뉴 → 이벤트 이름을 물어 그 이벤트로 갱신한다. 선택은 이 문서에 저장되어 다음 갱신에도 쓰인다 */
function chooseEvent() {
  var ui = SpreadsheetApp.getUi();
  var grids = readGrids_();
  var events = listEventNames(grids);
  var current = storedEventName_() || CONFIG.EVENT_NAME || (events[0] || '');
  var answer = ui.prompt(
    'Refresh for event',
    'Event name (campaign_group). Leave empty for the most recently ended event.\n\nAvailable:\n' + events.join('\n') + '\n\nCurrent: ' + current,
    ui.ButtonSet.OK_CANCEL
  );
  if (answer.getSelectedButton() !== ui.Button.OK) return;
  var name = String(answer.getResponseText() || '').trim();
  var props = PropertiesService.getDocumentProperties();
  if (name) props.setProperty('RECAP_EVENT_NAME', name); else props.deleteProperty('RECAP_EVENT_NAME');
  refreshReport_({ silent: false });
}

/** 메뉴 → 탭 이름과 gid 목록 — CONFIG.SOURCE_GIDS를 채울 때 본다 */
function showTabGids() {
  var lines = SpreadsheetApp.getActiveSpreadsheet().getSheets().map(function (s) {
    return s.getName() + '  →  gid ' + s.getSheetId();
  });
  SpreadsheetApp.getUi().alert('Tab gids', lines.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
}

/** 문서에 저장된 이벤트 선택. 권한이 없는 문맥(onOpen 등)에서는 null */
function storedEventName_() {
  try {
    return PropertiesService.getDocumentProperties().getProperty('RECAP_EVENT_NAME') || null;
  } catch (e) {
    return null;
  }
}

/**
 * 갱신 본체: 원본 읽기 → 순수 계산 → 렌더 → 탭 위치 고정 → 보던 탭으로 복귀.
 * @param {{ silent: boolean }} options - silent면 알림창을 띄우지 않고 예외를 던진다(onOpen이 잡는다)
 */
function refreshReport_(options) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var previous = ss.getActiveSheet();
  try {
    var grids = readGrids_();
    var eventName = storedEventName_() || CONFIG.EVENT_NAME;
    var model = buildReportModel(grids, new Date(), eventName);
    var sheet = ss.getSheetByName(CONFIG.REPORT_SHEET_NAME) || ss.insertSheet(CONFIG.REPORT_SHEET_NAME);
    renderReport_(sheet, model);
    placeReportSheet_(ss, sheet, previous);
    if (!(options && options.silent)) ensureOpenTrigger_();
  } catch (e) {
    if (options && options.silent) throw e;
    SpreadsheetApp.getUi().alert('Recap report', 'Could not refresh the report.\n\n' + (e && e.message ? e.message : e), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ============================================================
// 데이터 읽기 — Supabase(읽기 전용) 또는 이 시트의 탭 · 탭 위치
// ============================================================

/**
 * Supabase REST에서 표 하나를 전부 읽는다(1000행씩). 대시보드가 읽는 것과 같은 표·뷰를 같은 anon 키로 읽는다.
 * @returns {Object[]} 행 객체 배열(snake_case 키)
 */
function fetchSupabaseTable_(table, order) {
  var cfg = CONFIG.SUPABASE;
  if (!cfg.url || !cfg.anonKey || /^__/.test(cfg.url) || /^__/.test(cfg.anonKey)) {
    throw new Error('CONFIG.SUPABASE.url / anonKey is not filled in. Download the script again from the dashboard (the link next to the report title fills them in), or paste the values from the dashboard\'s environment.');
  }
  var rows = [];
  var PAGE = 1000;
  for (var from = 0; ; from += PAGE) {
    var url = cfg.url.replace(/\/$/, '') + '/rest/v1/' + table + '?select=*&order=' + encodeURIComponent(order) + '&offset=' + from + '&limit=' + PAGE;
    var res = UrlFetchApp.fetch(url, { headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Supabase ' + table + ': HTTP ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 200));
    var page = JSON.parse(res.getContentText());
    rows = rows.concat(page);
    if (page.length < PAGE) break;
  }
  return rows;
}

/** 원본 두 표를 2차원 배열(첫 줄 = 헤더)로 — DB에서 읽거나(기본) 이 시트의 탭에서 읽는다 */
function readGrids_() {
  if (CONFIG.DATA_SOURCE !== 'sheet') {
    // 성과는 캠페인당 최신 1건 뷰(performance_records_latest) — 대시보드 화면이 읽는 것과 같은 원천
    return {
      campaigns: rowsToGrid(fetchSupabaseTable_('campaigns', 'start_date.desc')),
      performance: rowsToGrid(fetchSupabaseTable_('performance_records_latest', 'campaign_id')),
    };
  }
  return readSheetGrids_();
}

/** gid로 탭을 찾는다. 없으면 null */
function findSheetByGid_(ss, gid) {
  if (gid == null) return null;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i += 1) {
    if (sheets[i].getSheetId() === Number(gid)) return sheets[i];
  }
  return null;
}

/** DATA_SOURCE = 'sheet' — gid로 찾은 탭을 2차원 배열로 읽는다 */
function readSheetGrids_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var read = function (key) {
    var gid = CONFIG.SOURCE_GIDS[key];
    if (gid == null) throw new Error('CONFIG.SOURCE_GIDS.' + key + ' is not set. Run "Report → Show tab gids" and put the gid of the ' + key + ' tab into the script.');
    var sheet = findSheetByGid_(ss, gid);
    if (!sheet) throw new Error('No tab with gid ' + gid + ' for "' + key + '". Run "Report → Show tab gids" and fix CONFIG.SOURCE_GIDS.');
    return sheet.getDataRange().getValues();
  };
  // performance gid가 없으면 campaigns 탭 하나에 두 표(캠페인·성과)가 위아래로 있는 것으로 본다 — 나누기는 순수부가 한다
  return { campaigns: read('campaigns'), performance: CONFIG.SOURCE_GIDS.performance == null ? null : read('performance') };
}

/**
 * 보고서 탭을 앵커 탭 바로 오른쪽에 두고, 갱신 전에 보던 탭으로 되돌린다.
 * moveActiveSheet는 활성 탭만 옮기므로 잠깐 활성화했다가 복귀한다.
 */
function placeReportSheet_(ss, sheet, previous) {
  var anchor = CONFIG.ANCHOR_SHEET_NAME ? ss.getSheetByName(CONFIG.ANCHOR_SHEET_NAME) : null;
  var target;
  if (anchor && anchor.getSheetId() !== sheet.getSheetId()) {
    var anchorIndex = anchor.getIndex();
    target = sheet.getIndex() < anchorIndex ? anchorIndex : anchorIndex + 1;
  } else {
    target = 1; // 앵커가 없으면 맨 왼쪽 — 열었을 때 바로 보이는 자리
  }
  if (sheet.getIndex() !== target) {
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(target);
  }
  if (previous) ss.setActiveSheet(previous);
}

// ============================================================
// 렌더 — 매 실행마다 clear() 후 다시 그린다. 손으로 고친 서식은 유지되지 않는다.
// 유지할 디자인(테두리·행 높이·열 폭·정렬·숫자 서식)은 전부 여기에 있다.
// ============================================================

/** 표 열 정의 — 캠페인 표. key는 model 행의 필드, fmt는 setNumberFormat, align은 가로 정렬 */
var COLUMNS = [
  { key: 'rank', label: '#', width: 50, fmt: '0' },
  { key: 'phaseName', label: 'Campaign', width: 200, align: 'left' },
  { key: 'storeCode', label: 'Store', width: 110 },
  { key: 'goalLabel', label: 'Goal', width: 100 },
  { key: 'startDate', label: 'Start', width: 90 },
  { key: 'endDate', label: 'End', width: 90 },
  { key: 'days', label: 'Days', width: 60, fmt: '0' },
  { key: 'dailyBudget', label: 'Daily budget', width: 100, fmt: '"$"#,##0.00' },
  { key: 'spend', label: 'Spend', width: 100, fmt: '"$"#,##0.00', bold: true },
  { key: 'pacingText', label: 'Pacing', width: 90,
    note: 'Spend ÷ planned budget (stored budget_planned, else daily budget × days). Shown only when ≥20% over or ≥30% under plan; otherwise blank.' },
  { key: 'primaryKpiLabel', label: 'Primary KPI', width: 100,
    note: 'The main result for the campaign goal — reported, not judged.\nAwareness → CPM · Traffic → CPC · Engagement → Cost/eng · Conversion / Store visit → CPA.\nCPM = spend ÷ impressions × 1,000 · CPC = spend ÷ clicks · Cost/eng = spend ÷ (likes + comments + shares) · CPA = spend ÷ results.\nThere is no overall grade.' },
  { key: 'primaryKpiValue', label: 'KPI value', width: 100, fmt: 'kpi', bold: true },
  { key: 'primaryKpiVsPast', label: 'KPI vs past', width: 110, note: 'vsPast' },
  { key: 'hookRate', label: 'Hook', width: 80, fmt: '0.00%',
    note: 'Hook = hook views ÷ video plays (Meta: 3-second plays, TikTok: 2-second plays). Same basis as the platform ads manager.' },
  { key: 'hookRateVsPast', label: 'Hook vs past', width: 110, note: 'vsPast' },
  { key: 'holdRate', label: 'Hold', width: 80, fmt: '0.00%',
    note: 'Hold = completed views ÷ hook views — of the people who stayed past the hook, how many watched through.' },
  { key: 'holdRateVsPast', label: 'Hold vs past', width: 110, note: 'vsPast' },
  { key: 'engagementRate', label: 'Eng. rate', width: 90, fmt: '0.00%', note: 'Engagement rate = platform engagements ÷ impressions.' },
  { key: 'engagementRateVsPast', label: 'Eng. rate vs past', width: 120, note: 'vsPast' },
  { key: 'ctr', label: 'CTR', width: 80, fmt: '0.00%', note: 'CTR = clicks ÷ impressions.' },
  { key: 'ctrVsPast', label: 'CTR vs past', width: 110, note: 'vsPast' },
  { key: 'cpc', label: 'CPC', width: 90, fmt: '"$"#,##0.00', note: 'CPC = spend ÷ clicks.' },
  { key: 'cpcVsPast', label: 'CPC vs past', width: 110, note: 'vsPast' },
  { key: 'cpe', label: 'Cost/eng', width: 90, fmt: '"$"#,##0.00',
    note: 'Cost per engagement = spend ÷ (likes + comments + shares). The platform "engagements" total is not used here so the value matches the Likes · Comments · Shares columns.' },
  { key: 'cpeVsPast', label: 'Cost/eng vs past', width: 120, note: 'vsPast' },
  { key: 'cpa', label: 'CPA', width: 90, fmt: '"$"#,##0.00', note: 'CPA = spend ÷ results (conversions).' },
  { key: 'cpaVsPast', label: 'CPA vs past', width: 110, note: 'vsPast' },
  { key: 'cpm', label: 'CPM', width: 90, fmt: '"$"#,##0.00', note: 'CPM = spend ÷ impressions × 1,000.' },
  { key: 'cpmVsPast', label: 'CPM vs past', width: 110, note: 'vsPast' },
  { key: 'reach', label: 'Reach', width: 90, fmt: '#,##0' },
  { key: 'impressions', label: 'Impressions', width: 100, fmt: '#,##0' },
  { key: 'videoPlays', label: 'Plays', width: 90, fmt: '#,##0' },
  { key: 'avgWatchSeconds', label: 'Avg watch (s)', width: 100, fmt: '0.00' },
  { key: 'clicks', label: 'Clicks', width: 80, fmt: '#,##0' },
  { key: 'likes', label: 'Likes', width: 80, fmt: '#,##0' },
  { key: 'comments', label: 'Comments', width: 90, fmt: '#,##0' },
  { key: 'shares', label: 'Shares', width: 80, fmt: '#,##0' },
  { key: 'conversions', label: 'Results', width: 80, fmt: '#,##0' },
  { key: 'worked', label: 'What worked', width: 340, align: 'left',
    note: 'Generated from this campaign\'s metrics and comparable past campaigns. Candidates are the metrics the goal shows (primary KPI first, then diagnostic Hook/Hold/CTR/Eng. rate); the one ranked in the top band wins. Nothing here is a claim about creative, targeting or messaging. "—" means no evidence.' },
  { key: 'improve', label: 'Could improve', width: 340, align: 'left',
    note: 'Same candidates as "What worked", the one in the bottom band (primary KPI first). If none, and spend ran more than 20% over plan, that is noted instead. "—" means no evidence.' },
];

var VS_PAST_NOTE = 'Where this value ranks among comparable past campaigns — same platform, same goal, other events, started on/after ' +
  CONFIG.BENCHMARK_SINCE + '. Same phase name when 3+ exist, else same goal. "best of N" / "top X%" / "mid" / "bottom X%" / "lowest of N"; ' +
  'percentile = (worse + ties ÷ 2) ÷ peers × 100, cost metrics inverted so higher is better. Fewer than 3 peers → "—". Context only, not a grade.';

/** 타임라인 표 열 — 캠페인 표의 B~I 열을 나눠 쓴다(폭은 그 열을 따른다) */
var TIMELINE_COLUMNS = [
  { key: 'name', label: 'Phase', align: 'left' },
  { key: 'platformLabel', label: 'Platforms' },
  { key: 'startDate', label: 'Start' },
  { key: 'endDate', label: 'End' },
  { key: 'days', label: 'Days', fmt: '0' },
  { key: 'totalDaily', label: 'Daily budget', fmt: '"$"#,##0.00' },
  { key: 'totalBudget', label: 'Planned', fmt: '"$"#,##0' },
  { key: 'spent', label: 'Spent', fmt: '"$"#,##0.00' },
];

/** KPI 블록 — 작은 표 하나(헤더 줄 + 값 줄). 참고 디자인(i-28)과 같은 꼴 */
var KPI_COLUMNS = [
  { key: 'periodText', label: 'Period' },
  { key: 'campaignCount', label: 'Campaigns', fmt: '0' },
  { key: 'spend', label: 'Total spent', fmt: '"$"#,##0.00' },
  { key: 'plannedBudget', label: 'Planned', fmt: '"$"#,##0',
    note: 'Sum of each campaign\'s planned budget: stored budget_planned, else daily budget × days (start and end inclusive). The dashboard uses the Plan document when one exists.' },
  { key: 'storeCount', label: 'Stores', fmt: '0' },
];

/**
 * 디자인 상수 — 참고 디자인(issue/i-28.png): 흰 배경, 모든 셀 얇은 회색 테두리, 헤더 연회색 바탕·굵게, 기본 중앙 정렬,
 * 굵은 Total 행, A열은 좁은 여백. 색은 테두리·헤더 바탕·회색 글자 셋뿐이다.
 */
var STYLE = {
  border: '#c9c9c9',
  headerBg: '#f3f3f3',
  secondary: '#666666',
  fontSize: 10,
  rowHeight: 27,
  titleSize: 16,
  sectionSize: 12,
  leftGutter: 20,
  /** 표는 B열부터 — A열은 여백 */
  left: 2,
};

/** 셀 하나에 놓을 값 — 없으면 "—"(문자열). 금액·비율은 숫자 그대로(서식은 열이 정한다) */
function cellValue_(v) {
  return v == null || v === '' ? EMPTY : v;
}

/** 모든 변 얇은 회색 실선 */
function borderAll_(range) {
  range.setBorder(true, true, true, true, true, true, STYLE.border, SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * 보고서 탭을 처음부터 다시 그린다.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Object} model - buildReportModel() 결과
 */
function renderReport_(sheet, model) {
  // 1) 전부 지운다 — 값·서식·노트·병합·고정. 남는 것은 열 폭뿐이고 그것도 아래서 다시 준다
  sheet.clear();
  sheet.clearNotes();
  sheet.getDataRange().breakApart();
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);
  sheet.setHiddenGridlines(true);
  var totalCols = STYLE.left - 1 + COLUMNS.length;
  if (sheet.getMaxColumns() < totalCols) sheet.insertColumnsAfter(sheet.getMaxColumns(), totalCols - sheet.getMaxColumns());
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).setFontSize(STYLE.fontSize).setVerticalAlignment('middle').setHorizontalAlignment('center');

  var L = STYLE.left;
  var row = 2; // 1행은 위 여백

  // 2) 제목 · 메타 줄
  sheet.getRange(row, L).setValue(model.eventName).setFontSize(STYLE.titleSize).setFontWeight('bold').setHorizontalAlignment('left')
    .setNote('Recap — read from the dashboard database (read-only) and drawn by the Report script. Rules match the dashboard (src/data/schema.js). Refresh: Report → Refresh report.');
  sheet.setRowHeight(row, 32);
  row += 1;
  sheet.getRange(row, L).setValue(model.metaLine).setFontColor(STYLE.secondary).setHorizontalAlignment('left');
  row += 2;

  // 3) KPI 블록 — 헤더 줄 + 값 줄, 전체 테두리
  var kpiRow = { periodText: model.periodText, campaignCount: model.campaignCount, spend: model.spend, plannedBudget: model.plannedBudget, storeCount: model.stores.length || null };
  row = renderTable_(sheet, row, L, KPI_COLUMNS, [kpiRow], { valuesBold: true });
  row += 1;

  // 4) 순위 한 줄 — 굵게, 비교 이벤트는 다음 줄 회색
  if (model.headline) {
    sheet.getRange(row, L).setValue(model.headline.text).setFontWeight('bold').setFontSize(STYLE.sectionSize).setHorizontalAlignment('left')
      .setNote('Event-level rank by the primary KPI of the event\'s most common goal (' + CONFIG.METRIC_LABEL[model.headline.metricKey] +
        '), recomputed from summed numerators and denominators, against other events that share at least one phase name. Needs 3+ events including this one.');
    row += 1;
    sheet.getRange(row, L).setValue(model.headline.peerEvents.join(' · ')).setFontColor(STYLE.secondary).setHorizontalAlignment('left');
    row += 2;
  }

  // 5) 타임라인 — 단계별 기간·예산·지출 + Total
  row = renderSectionTitle_(sheet, row, 'Timeline — ' + countText_(model.phases.length, 'phase'));
  row = renderTable_(sheet, row, L, TIMELINE_COLUMNS, model.phases, { total: model.phaseTotal });
  row += 2;

  // 6) 플랫폼별 캠페인 표 + Total
  model.sections.forEach(function (section) {
    row = renderSectionTitle_(sheet, row, section.label + ' campaigns — ' + countText_(section.rows.length, 'campaign'));
    row = renderTable_(sheet, row, L, COLUMNS, section.rows, { total: section.total });
    row += 2;
  });

  // 7) 꼬리말
  sheet.getRange(row, L).setValue('Refreshed ' + model.refreshedText + ' from the dashboard database · rules synced with src/data/schema.js · What worked / Could improve are generated sentences; notes written by a person live in the dashboard.')
    .setFontSize(8).setFontColor(STYLE.secondary).setHorizontalAlignment('left');

  // 8) 열 폭 — A열 여백, B열부터 캠페인 표 기준. 타임라인·KPI는 같은 열을 나눠 쓴다
  sheet.setColumnWidth(1, STYLE.leftGutter);
  COLUMNS.forEach(function (col, i) { sheet.setColumnWidth(L + i, col.width); });
  // 남는 빈 행·열은 지운다 — 스크롤 끝이 표 끝이어야 읽기 편하다
  if (sheet.getMaxRows() > row + 2) sheet.deleteRows(row + 3, sheet.getMaxRows() - row - 2);
  if (sheet.getMaxColumns() > totalCols) sheet.deleteColumns(totalCols + 1, sheet.getMaxColumns() - totalCols);
}

/** "4 phases" / "1 campaign" */
function countText_(n, noun) {
  return n + ' ' + noun + (n === 1 ? '' : 's');
}

/** 섹션 제목 줄 — 굵은 12pt 한 칸, 밑줄·바탕 없음 */
function renderSectionTitle_(sheet, row, title) {
  sheet.getRange(row, STYLE.left).setValue(title).setFontSize(STYLE.sectionSize).setFontWeight('bold').setHorizontalAlignment('left');
  sheet.setRowHeight(row, 30);
  return row + 1;
}

/**
 * 표 하나 — 헤더 줄(연회색 바탕·굵게·노트) + 데이터 줄 + 선택적 Total 줄(굵게). 모든 셀에 얇은 회색 테두리, 기본 중앙 정렬.
 * @param {{ total?: Object|null, valuesBold?: boolean }} [options]
 * @returns {number} 다음 빈 줄
 */
function renderTable_(sheet, row, startCol, columns, rows, options) {
  options = options || {};
  var n = columns.length;
  var header = columns.map(function (c) { return c.label; });
  var headerRange = sheet.getRange(row, startCol, 1, n);
  headerRange.setValues([header]).setFontWeight('bold').setBackground(STYLE.headerBg).setWrap(false).setHorizontalAlignment('center');
  borderAll_(headerRange);
  columns.forEach(function (c, i) {
    var note = c.note === 'vsPast' ? VS_PAST_NOTE : c.note;
    if (note) sheet.getRange(row, startCol + i).setNote(note);
  });
  sheet.setRowHeight(row, STYLE.rowHeight);
  row += 1;

  var bodyRows = rows.slice();
  var totalIndex = -1;
  if (options.total) { totalIndex = bodyRows.length; bodyRows.push(options.total); }

  if (bodyRows.length === 0) {
    var emptyRange = sheet.getRange(row, startCol, 1, n);
    emptyRange.setValue('No campaigns on this platform.').setFontColor(STYLE.secondary);
    borderAll_(emptyRange);
    sheet.setRowHeight(row, STYLE.rowHeight);
    return row + 1;
  }

  var values = bodyRows.map(function (r, j) {
    return columns.map(function (c, i) {
      if (j === totalIndex && i === 0) return 'Total';
      return j === totalIndex && r[c.key] == null ? '' : cellValue_(r[c.key]);
    });
  });
  var body = sheet.getRange(row, startCol, bodyRows.length, n);
  body.setValues(values).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setHorizontalAlignment('center');
  borderAll_(body);
  sheet.setRowHeights(row, bodyRows.length, STYLE.rowHeight);
  if (options.valuesBold) body.setFontWeight('bold').setFontSize(11);

  columns.forEach(function (c, i) {
    var colRange = sheet.getRange(row, startCol + i, bodyRows.length, 1);
    if (c.align) colRange.setHorizontalAlignment(c.align);
    if (c.fmt === 'kpi') {
      // Primary KPI는 목표마다 다른 지표라 줄마다 서식이 다르다(비용 = 금액, 나머지 = 비율)
      bodyRows.forEach(function (r, j) {
        sheet.getRange(row + j, startCol + i).setNumberFormat(r.primaryKpiIsMoney === false ? '0.00%' : '"$"#,##0.00');
      });
    } else if (c.fmt) {
      colRange.setNumberFormat(c.fmt);
    } else if (c.key === 'startDate' || c.key === 'endDate') {
      colRange.setNumberFormat('@');
    }
    if (c.bold) colRange.setFontWeight('bold');
  });

  if (totalIndex >= 0) {
    var totalRange = sheet.getRange(row + totalIndex, startCol, 1, n);
    totalRange.setFontWeight('bold');
    if (columns[0].key === 'rank') sheet.getRange(row + totalIndex, startCol).setHorizontalAlignment('center');
  }

  return row + bodyRows.length;
}

// ============================================================
// ↓↓↓ 순수 계산 — 이 줄 아래는 Apps Script API를 쓰지 않는다 ↓↓↓
// node로 파일을 그대로 evaluate해서 buildReportModel(grids, today)를 부르면 같은 결과가 나온다.
// 규칙은 src/data/schema.js와 같아야 한다(파일 상단 목록).
// ============================================================

/**
 * 원본 표 두 개 → 보고서 모델. 대시보드 RecapDetailPage가 화면에 놓는 값과 같은 숫자를 낸다.
 *
 * @param {{ campaigns: any[][], performance: any[][]|null }} grids - 첫 줄이 헤더인 2차원 배열. performance가 null이면 campaigns 안에 두 표가 헤더 줄로 나뉘어 있다고 본다
 * @param {Date|string} today - 생성 시각(꼬리말·"generatedAt"에만 쓴다 — 계산은 날짜에 의존하지 않는다)
 * @param {string|null} [eventName] - 보고할 이벤트. 없으면 가장 최근에 끝난 이벤트
 * @returns {Object} { eventName, generatedAt, metaLine, periodText, startDate, endDate, campaignCount, spend, plannedBudget, stores, platforms, headline, phases, sections, events }
 */
function buildReportModel(grids, today, eventName) {
  var source = grids.performance ? grids : splitBlocks(grids.campaigns);
  var campaigns = parseCampaigns(source.campaigns);
  var records = parsePerformance(source.performance);
  var events = buildRecapEvents(campaigns, records);
  if (campaigns.length === 0) throw new Error('The campaigns tab has no rows (or no recognizable header).');
  if (events.length === 0) throw new Error('No campaign has a campaign_group, so there is no event to report.');

  var chosen = eventName ? findEvent(events, eventName) : events[0];
  if (!chosen) throw new Error('No event named "' + eventName + '". Available: ' + events.map(function (e) { return e.eventName; }).join(', '));

  var recap = buildRecapRows(chosen.eventName, campaigns, records);
  var headline = buildRecapHeadline(chosen.eventName, campaigns, records);
  var eventCampaigns = recap.campaigns;
  var allRows = [];
  Object.keys(recap.byPlatform).forEach(function (p) { allRows = allRows.concat(recap.byPlatform[p]); });

  var spendValues = allRows.map(function (r) { return r.spend; }).filter(function (v) { return v != null; });
  var spend = spendValues.length > 0 ? spendValues.reduce(function (a, b) { return a + b; }, 0) : null;
  var plannedSum = eventCampaigns.reduce(function (sum, c) { return sum + (effectiveBudgetPlanned(c) || 0); }, 0);
  var plannedBudget = plannedSum || null;
  var startDate = eventCampaigns.reduce(function (min, c) { return c.startDate < min ? c.startDate : min; }, eventCampaigns[0].startDate);
  var endDate = eventCampaigns.reduce(function (max, c) { return c.endDate > max ? c.endDate : max; }, eventCampaigns[0].endDate);
  var stores = uniqueSorted(flatMap(eventCampaigns, function (c) { return c.targetStoreIds; }));
  var platformOrder = Object.keys(CONFIG.PLATFORM_LABEL).filter(function (p) { return recap.byPlatform[p]; });
  var platforms = platformOrder.map(function (p) { return CONFIG.PLATFORM_LABEL[p]; });

  var spendByPhaseKey = {};
  allRows.forEach(function (r) {
    var key = campaignNameKey(r.name);
    if (r.spend != null) spendByPhaseKey[key] = (spendByPhaseKey[key] || 0) + r.spend;
  });
  var phases = buildPhaseTimeline(eventCampaigns).map(function (p) {
    return {
      key: p.key,
      name: phaseDisplayName(p.name),
      platformLabel: p.platformLabel,
      startDate: p.startDate,
      endDate: p.endDate,
      days: p.days,
      totalDaily: p.totalDaily,
      totalBudget: p.totalBudget || null,
      spent: spendByPhaseKey[p.key] != null ? spendByPhaseKey[p.key] : null,
    };
  });

  var sections = platformOrder.map(function (p) {
    return { platform: p, label: CONFIG.PLATFORM_LABEL[p], rows: recap.byPlatform[p].map(flattenRow), total: sectionTotalOf(recap.byPlatform[p]) };
  });

  var headlineModel = headline ? {
    metricKey: headline.metricKey,
    rank: headline.rank,
    total: headline.total,
    peerEvents: headline.peerEvents,
    text: headline.rank === 1
      ? 'Best of ' + headline.total + ' comparable events by ' + CONFIG.METRIC_LABEL[headline.metricKey]
      : '#' + headline.rank + ' of ' + headline.total + ' comparable events by ' + CONFIG.METRIC_LABEL[headline.metricKey],
  } : null;

  var periodText = dateRange(startDate, endDate);
  var todayIso = toISODate(today);
  var refreshedText = dateTimeText(today);
  // 메타 줄 — 참고 디자인과 같은 꼴: "Jun 17 – Aug 31, 2026 · 76 days · G10 · Meta + TikTok · completed  (refreshed Sep 11, 2026 11:30)"
  var status = endDate < todayIso ? 'completed' : (startDate > todayIso ? 'scheduled' : 'in progress');
  var metaLine = [dateRangeWithYear(startDate, endDate), countText(daysBetween(startDate, endDate), 'day'), stores.join(', ') || null, platforms.join(' + ') || null, status]
    .filter(Boolean).join(' · ') + '  (refreshed ' + refreshedText + ')';
  return {
    eventName: chosen.eventName,
    generatedAt: todayIso,
    refreshedText: refreshedText,
    status: status,
    metaLine: metaLine,
    periodText: periodText,
    startDate: startDate,
    endDate: endDate,
    campaignCount: eventCampaigns.length,
    spend: spend,
    plannedBudget: plannedBudget,
    stores: stores,
    platforms: platforms,
    headline: headlineModel,
    phases: phases,
    phaseTotal: phaseTotalOf(phases),
    sections: sections,
    events: events.map(function (e) { return e.eventName; }),
  };
}

/** 타임라인 Total 줄 — 일예산·계획·지출 합. 값이 하나도 없으면 null */
function phaseTotalOf(phases) {
  var sum = function (key) {
    var vals = phases.map(function (p) { return p[key]; }).filter(function (v) { return v != null; });
    return vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) : null;
  };
  return { totalDaily: sum('totalDaily'), totalBudget: sum('totalBudget'), spent: sum('spent') };
}

/**
 * 플랫폼 표 Total 줄 — 합계는 더하고, 비율·비용 지표는 분자·분모를 합쳐 다시 계산한다(aggregateMetric, 대시보드 머리글 순위와 같은 방식).
 * 순위·목표·기간·vs past·해석은 합계가 없으므로 비운다.
 */
function sectionTotalOf(rows) {
  var sum = function (key) {
    var vals = rows.map(function (r) { return r[key]; }).filter(function (v) { return v != null; });
    return vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) : null;
  };
  var total = {
    dailyBudget: sum('dailyBudget'),
    spend: sum('spend'),
    reach: sum('reach'),
    impressions: sum('impressions'),
    videoPlays: sum('videoPlays'),
    clicks: sum('clicks'),
    likes: sum('likes'),
    comments: sum('comments'),
    shares: sum('shares'),
    conversions: sum('conversions'),
    primaryKpiIsMoney: true,
  };
  CONFIG.BENCHMARK_METRICS.forEach(function (m) { total[m.key] = aggregateMetric(rows, m.key); });
  return total;
}

/** 이벤트 이름 목록(최근 끝난 순) — 메뉴 "Refresh for event…"가 쓴다 */
function listEventNames(grids) {
  var source = grids.performance ? grids : splitBlocks(grids.campaigns);
  return buildRecapEvents(parseCampaigns(source.campaigns), parsePerformance(source.performance)).map(function (e) { return e.eventName; });
}

function findEvent(events, name) {
  var key = campaignNameKey(name);
  for (var i = 0; i < events.length; i += 1) {
    if (campaignNameKey(events[i].eventName) === key) return events[i];
  }
  return null;
}

// ---------- 원본 표 파싱 ----------

/** 행 객체 배열(DB JSON) → 첫 줄이 헤더인 2차원 배열. 열은 모든 행의 키 합집합, 없는 값은 '' */
function rowsToGrid(rows) {
  var keys = [];
  var seen = {};
  (rows || []).forEach(function (r) {
    Object.keys(r || {}).forEach(function (k) { if (!seen[k]) { seen[k] = true; keys.push(k); } });
  });
  var grid = [keys];
  (rows || []).forEach(function (r) {
    grid.push(keys.map(function (k) { return r[k] == null ? '' : r[k]; }));
  });
  return grid;
}

/**
 * 한 탭에 붙여 넣은 두 표를 헤더 줄로 나눈다 — 캠페인 헤더(id·platform·goal)와 성과 헤더(campaignId·spend).
 * 표 사이의 빈 줄은 무시한다. 한쪽 표가 없으면 빈 배열.
 */
function splitBlocks(grid) {
  var blocks = { campaigns: [], performance: [] };
  var current = null;
  (grid || []).forEach(function (line) {
    var keys = (line || []).map(normalizeHeader);
    var has = function (k) { return keys.indexOf(k) >= 0; };
    if (has('id') && has('platform') && has('goal')) { current = 'campaigns'; blocks.campaigns = [line]; return; }
    if (has('campaignid') && has('spend')) { current = 'performance'; blocks.performance = [line]; return; }
    if (!current) return;
    var empty = (line || []).every(function (v) { return v === '' || v == null; });
    if (!empty) blocks[current].push(line);
  });
  if (blocks.performance.length === 0) throw new Error('No performance table found in the data tab. Import performance_records into its own tab and set CONFIG.SOURCE_GIDS.performance.');
  return blocks;
}

/** 헤더 정규화 — `campaign_group`·`campaignGroup`·`Campaign Group` 전부 `campaigngroup` */
function normalizeHeader(h) {
  return String(h == null ? '' : h).toLowerCase().replace(/[\s_\-]/g, '');
}

/** 2차원 배열 → 정규화된 키의 객체 배열. 완전히 빈 줄은 뺀다 */
function gridToObjects(grid) {
  if (!grid || grid.length < 2) return [];
  var headers = grid[0].map(normalizeHeader);
  var out = [];
  for (var i = 1; i < grid.length; i += 1) {
    var line = grid[i];
    var hasAny = false;
    var obj = {};
    for (var j = 0; j < headers.length; j += 1) {
      var v = line[j];
      if (v !== '' && v != null) hasAny = true;
      if (headers[j]) obj[headers[j]] = v;
    }
    if (hasAny) out.push(obj);
  }
  return out;
}

/** 시트 값 → 숫자 또는 null. ''·'null'·'NULL'은 null */
function num(v) {
  if (v === '' || v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  var s = String(v).trim();
  if (!s || /^null$/i.test(s)) return null;
  var n = Number(s.replace(/[,$]/g, ''));
  return isFinite(n) ? n : null;
}

/** 시트 값 → 'YYYY-MM-DD'. 시트가 날짜로 자동 인식한 셀은 Date로 들어온다(현지 날짜 기준) */
/** Date 판별 — 다른 실행 문맥(node vm)에서 만든 Date도 잡히게 instanceof를 쓰지 않는다 */
function isDateValue(v) {
  return Object.prototype.toString.call(v) === '[object Date]';
}

function isoDate(v) {
  if (v === '' || v == null) return null;
  if (isDateValue(v)) return toISODate(v);
  var s = String(v).trim();
  if (/^null$/i.test(s)) return null;
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[1] + '-' + m[2] + '-' + m[3] : s;
}

function toISODate(d) {
  if (!isDateValue(d)) {
    var s = String(d == null ? '' : d);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function str(v) {
  if (v === '' || v == null) return null;
  var s = String(v).trim();
  return !s || /^null$/i.test(s) ? null : s;
}

/** target_store_ids — Postgres 배열 텍스트 `{G10,BF3}`, JSON `["G10"]`, 쉼표 구분 전부 */
function parseStoreIds(v) {
  if (v == null || v === '') return [];
  if (Array.isArray(v)) return v.map(String);
  var s = String(v).trim();
  if (!s || /^null$/i.test(s)) return [];
  if (s[0] === '[') {
    try { return JSON.parse(s).map(String); } catch (e) { /* 아래 일반 분해로 */ }
  }
  return s.replace(/^\{|\}$/g, '').split(',').map(function (t) { return t.trim().replace(/^"|"$/g, ''); }).filter(Boolean);
}

/** campaigns 표 → 대시보드 Campaign 모델(paidAdsMappers rowToCampaign과 같은 필드) */
function parseCampaigns(grid) {
  return gridToObjects(grid).map(function (r) {
    return {
      id: str(r.id),
      name: str(r.name) || '',
      campaignGroup: str(r.campaigngroup),
      platform: (str(r.platform) || '').toLowerCase(),
      accountId: str(r.accountid),
      targetScope: str(r.targetscope),
      targetStoreIds: parseStoreIds(r.targetstoreids),
      startDate: isoDate(r.startdate),
      endDate: isoDate(r.enddate),
      budgetPlanned: num(r.budgetplanned) || 0,
      budgetDaily: num(r.budgetdaily),
      goal: str(r.goal),
    };
  }).filter(function (c) { return c.id; });
}

/** performance_records 표 → 대시보드 PerformanceRecord 모델(rowToPerformanceRecord와 같은 필드 + recordedAt·source) */
function parsePerformance(grid) {
  return gridToObjects(grid).map(function (r) {
    var spendValue = num(r.spend);
    return {
      id: str(r.id),
      campaignId: str(r.campaignid),
      recordedAt: isoDate(r.recordedat),
      source: str(r.source),
      impressions: num(r.impressions),
      reach: num(r.reach),
      clicks: num(r.clicks),
      spend: spendValue == null ? 0 : spendValue,
      videoPlays: num(r.videoplays),
      hookViews: num(r.hookviews),
      heldViews: num(r.heldviews),
      avgWatchSeconds: num(r.avgwatchseconds),
      likes: num(r.likes),
      comments: num(r.comments),
      shares: num(r.shares),
      engagements: num(r.engagements),
      follows: num(r.follows),
      profileVisits: num(r.profilevisits),
      conversions: num(r.conversions),
    };
  }).filter(function (r) { return r.campaignId; });
}

// ---------- 지표 계산 (schema calc*) ----------

function calcCPM(spend, impressions) { if (!impressions) return null; return (spend / impressions) * 1000; }
function calcCTR(clicks, impressions) { if (!impressions || clicks == null) return null; return clicks / impressions; }
function calcCPC(spend, clicks) { if (!clicks) return null; return spend / clicks; }
function calcHookRate(hookViews, videoPlays) { if (!videoPlays || hookViews == null) return null; return hookViews / videoPlays; }
function calcHoldRate(heldViews, hookViews) { if (!hookViews || heldViews == null) return null; return heldViews / hookViews; }
function calcEngagementRate(engagements, impressions) { if (!impressions || engagements == null) return null; return engagements / impressions; }
function calcCPA(spend, conversions) { if (!conversions) return null; return spend / conversions; }
function calcCPE(spend, engagements) { if (!engagements) return null; return spend / engagements; }

/** 양 끝 포함 일수 — UTC로 계산해 DST·타임존과 무관 */
function daysBetween(startIso, endIso) {
  var a = String(startIso || '').split('-').map(Number);
  var b = String(endIso || '').split('-').map(Number);
  if (a.length < 3 || b.length < 3 || !a[0] || !b[0]) return null;
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000) + 1;
}

/** budgetDaily × 기간 (schema calcAutoBudgetPlanned) */
function calcAutoBudgetPlanned(budgetDaily, startDate, endDate) {
  if (!(budgetDaily > 0) || !startDate || !endDate) return null;
  var days = daysBetween(startDate, endDate);
  if (days == null || days <= 0) return null;
  return Math.round(budgetDaily * days * 100) / 100;
}

/** 계획 예산 — 저장값(>0) 아니면 자동 계산, 근거 없으면 null (schema effectiveBudgetPlanned) */
function effectiveBudgetPlanned(campaign) {
  if (campaign && campaign.budgetPlanned > 0) return campaign.budgetPlanned;
  return calcAutoBudgetPlanned(campaign && campaign.budgetDaily, campaign && campaign.startDate, campaign && campaign.endDate);
}

// ---------- 이름·키 (schema campaignNameKey · campaignGroupKey · phaseNameOf) ----------

function campaignNameKey(name) {
  return String(name == null ? '' : name)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/[—–]/g, '-')
    .replace(/～/g, '~')
    .replace(/\s*([~-])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function campaignGroupKey(campaign) {
  return campaign.campaignGroup || campaign.name;
}

function isUnassignedEvent(name) {
  return CONFIG.UNASSIGNED_EVENT_PATTERN.test(String(name == null ? '' : name).trim());
}

var PHASE_DATE_SUFFIX_PATTERN = /[\s_\-–—]*\d{4}\s*[~\-–—]\s*\d{4}\s*$/;
var PHASE_CODE_PREFIX_PATTERN = /^[A-Za-z]{1,3}\d{1,3}[\s_\-–—]+/;

function phaseNameOf(nameOrCampaign) {
  var name = typeof nameOrCampaign === 'string' ? nameOrCampaign : ((nameOrCampaign && nameOrCampaign.name) || '');
  var cleaned = String(name || '')
    .replace(PHASE_DATE_SUFFIX_PATTERN, '')
    .replace(PHASE_CODE_PREFIX_PATTERN, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || name || '';
}

function phaseKey(nameOrCampaign) {
  return campaignNameKey(phaseNameOf(nameOrCampaign));
}

/** 타임라인의 부르는 이름 — `Instagram post: <캡션>`의 접두사를 뗀다 (recapRowView phaseDisplayName) */
var NAME_PREFIX_PATTERN = /^([^:\n]{1,24}):\s*([\s\S]+)$/;
function phaseDisplayName(name) {
  var match = String(name || '').match(NAME_PREFIX_PATTERN);
  var rest = match ? match[2] : '';
  return phaseNameOf(rest || name || '');
}

// ---------- 통계 (schema median · percentileRank · percentileBand) ----------

function median(values) {
  var sorted = (values || []).filter(function (v) { return v != null && isFinite(v); }).sort(function (a, b) { return a - b; });
  if (sorted.length === 0) return null;
  var mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentileRank(values, value, lowerIsBetter) {
  var peers = (values || []).filter(function (v) { return v != null && isFinite(v); });
  if (value == null || !isFinite(value) || peers.length === 0) return null;
  var worse = 0;
  var equal = 0;
  peers.forEach(function (v) {
    if (v === value) equal += 1;
    else if (lowerIsBetter ? v > value : v < value) worse += 1;
  });
  return Math.round(((worse + equal / 2) / peers.length) * 100);
}

function percentileBand(percentile) {
  if (percentile == null) return null;
  if (percentile >= CONFIG.VERDICT_PERCENTILE.good) return 'top';
  if (percentile <= CONFIG.VERDICT_PERCENTILE.bad) return 'bottom';
  return 'mid';
}

// ---------- 성과 행 (schema getGoalMetricsRow · latestRecordFor) ----------

/**
 * 캠페인당 성과 1건 — recorded_at이 가장 늦은 것, 같은 날이면 manual 우선, 그래도 같으면 나중 행.
 * (대시보드가 읽는 performance_records_latest 뷰와 같은 규칙)
 */
function latestRecordFor(campaignId, records) {
  var best;
  (records || []).forEach(function (r) {
    if (r.campaignId !== campaignId) return;
    if (!best) { best = r; return; }
    var a = r.recordedAt || '';
    var b = best.recordedAt || '';
    if (a > b) { best = r; return; }
    if (a === b) {
      var aManual = r.source === 'manual' ? 1 : 0;
      var bManual = best.source === 'manual' ? 1 : 0;
      if (aManual >= bManual) best = r;
    }
  });
  return best;
}

function getGoalMetricsRow(campaign, record) {
  var g = function (k) { return record && record[k] != null ? record[k] : null; };
  var spend = g('spend');
  var impressions = g('impressions');
  var clicks = g('clicks');
  var engagements = g('engagements');
  var conversions = g('conversions');
  var parts = [g('likes'), g('comments'), g('shares')];
  var hasInteraction = parts.some(function (v) { return v != null; });
  var interactions = hasInteraction ? parts.reduce(function (a, b) { return a + (b == null ? 0 : b); }, 0) : null;
  return {
    campaignId: campaign.id,
    name: campaign.name,
    platform: campaign.platform,
    goal: campaign.goal,
    spend: spend,
    impressions: impressions,
    reach: g('reach'),
    clicks: clicks,
    engagements: engagements,
    conversions: conversions,
    cpm: spend != null ? calcCPM(spend, impressions) : null,
    ctr: calcCTR(clicks, impressions),
    cpc: spend != null ? calcCPC(spend, clicks) : null,
    engagementRate: calcEngagementRate(engagements, impressions),
    cpe: spend != null ? calcCPE(spend, interactions) : null,
    cpa: spend != null ? calcCPA(spend, conversions) : null,
    videoPlays: g('videoPlays'),
    hookViews: g('hookViews'),
    heldViews: g('heldViews'),
    avgWatchSeconds: g('avgWatchSeconds'),
    likes: g('likes'),
    comments: g('comments'),
    shares: g('shares'),
    follows: g('follows'),
    profileVisits: g('profileVisits'),
    hookRate: calcHookRate(g('hookViews'), g('videoPlays')),
    holdRate: calcHoldRate(g('heldViews'), g('hookViews')),
  };
}

// ---------- 비교군 · 벤치마크 (schema buildBenchmarkPeers · benchmarkStat) ----------

function buildBenchmarkPeers(campaign, allCampaigns) {
  var selfEvent = campaignNameKey(campaignGroupKey(campaign));
  var base = (allCampaigns || []).filter(function (c) {
    return c.id !== campaign.id
      && c.platform === campaign.platform
      && campaignNameKey(campaignGroupKey(c)) !== selfEvent
      && (c.startDate || '') >= CONFIG.BENCHMARK_SINCE;
  });
  var sameGoal = base.filter(function (c) { return c.goal === campaign.goal; });
  var selfPhase = phaseKey(campaign);
  var sameGoalPhase = sameGoal.filter(function (c) { return phaseKey(c) === selfPhase; });
  if (sameGoalPhase.length >= CONFIG.BENCHMARK_MIN_PEERS) return { peers: sameGoalPhase, scope: 'phase' };
  if (sameGoal.length >= CONFIG.BENCHMARK_MIN_PEERS) return { peers: sameGoal, scope: 'goal' };
  return { peers: [], scope: 'none' };
}

function benchmarkStat(metricKey, value, peerRows, peerScope) {
  var meta = CONFIG.BENCHMARK_METRICS.filter(function (m) { return m.key === metricKey; })[0];
  var lowerIsBetter = meta ? meta.lowerIsBetter : false;
  var peerValues = (peerRows || []).map(function (r) { return r ? r[metricKey] : null; }).filter(function (v) { return v != null && isFinite(v); });
  var enough = peerScope !== 'none' && peerValues.length >= CONFIG.BENCHMARK_MIN_PEERS;
  var percentile = enough ? percentileRank(peerValues, value, lowerIsBetter) : null;
  return {
    metricKey: metricKey,
    value: value == null ? null : value,
    median: enough ? median(peerValues) : null,
    percentile: percentile,
    sampleSize: peerValues.length,
    lowerIsBetter: lowerIsBetter,
    peerScope: enough ? peerScope : 'none',
    band: percentileBand(percentile),
  };
}

/** 벤치마크 위치 문구 (recapStrings benchmarkPositionText) — 화살표는 BenchmarkDelta의 top ↗ · bottom ↘ */
function benchmarkPositionText(stat) {
  if (!stat || stat.peerScope === 'none' || stat.percentile == null) return null;
  if (stat.percentile >= 100) return '↗ best of ' + (stat.sampleSize + 1);
  if (stat.percentile <= 0) return '↘ lowest of ' + (stat.sampleSize + 1);
  if (stat.band === 'top') return '↗ top ' + (100 - stat.percentile) + '%';
  if (stat.band === 'bottom') return '↘ bottom ' + stat.percentile + '%';
  return 'mid';
}

// ---------- Primary KPI · 해석 (schema budgetEfficiency · buildCampaignInsight) ----------

function budgetEfficiency(row, goal) {
  var keys = CONFIG.GOAL_HEADLINE_METRICS[goal] || [];
  var metricKey = keys[0] || null;
  var value = metricKey && row ? row[metricKey] : null;
  return { metricKey: metricKey, value: value != null && isFinite(value) ? value : null };
}

var METRIC_ASPECT = { cpm: 'reach', cpc: 'click', ctr: 'click', cpa: 'result', hookRate: 'hook', holdRate: 'hold', engagementRate: 'engagement', cpe: 'engagement' };

function buildCampaignInsight(row, plannedBudget) {
  var hasData = Boolean(row && (row.spend != null || row.impressions != null));
  if (!hasData) return { hasData: false, strength: null, weakness: null };
  var rule = CONFIG.GOAL_INSIGHT_METRICS[row.goal] || null;
  var eligible = rule ? rule.primary.concat(rule.diagnostic) : [];
  var primaryKeys = rule ? rule.primary : [];
  var stats = Object.keys(row.benchmarks || {}).map(function (k) { return row.benchmarks[k]; })
    .filter(function (b) { return b && b.peerScope !== 'none' && b.percentile != null && eligible.indexOf(b.metricKey) >= 0; });
  var rank = function (list, dir) {
    return list.slice().sort(function (a, b) {
      var h = (primaryKeys.indexOf(b.metricKey) >= 0 ? 1 : 0) - (primaryKeys.indexOf(a.metricKey) >= 0 ? 1 : 0);
      if (h !== 0) return h;
      return dir === 'top' ? b.percentile - a.percentile : a.percentile - b.percentile;
    });
  };
  var top = rank(stats.filter(function (b) { return b.band === 'top'; }), 'top');
  var bottom = rank(stats.filter(function (b) { return b.band === 'bottom'; }), 'bottom');
  var toItem = function (b) { return { kind: 'ranked', metricKey: b.metricKey, aspect: METRIC_ASPECT[b.metricKey], stat: b, scope: b.peerScope, n: b.sampleSize }; };
  var strength = top[0] ? toItem(top[0]) : null;
  var weakness = bottom[0] ? toItem(bottom[0]) : null;
  if (!weakness && plannedBudget && row.spend != null && row.spend > plannedBudget * (1 + CONFIG.OVERSPEND_RATIO)) {
    weakness = { kind: 'overspend', pct: Math.round((row.spend / plannedBudget - 1) * 100) };
  }
  return { hasData: true, strength: strength, weakness: weakness };
}

/** 해석 한 문장 (recapRowView insightSentence, 영어) */
function insightSentence(field, item) {
  if (!item) return null;
  var aspectKey = item.metricKey === 'cpe' ? 'cpe' : item.metricKey === 'cpc' ? 'cpc' : item.aspect;
  if (field === 'strength') return item.kind === 'ranked' && item.stat ? STRINGS.worked[aspectKey] || null : null;
  if (item.kind === 'overspend') return STRINGS.improve.overspend.replace('{pct}', String(item.pct));
  return item.kind === 'ranked' && item.stat ? STRINGS.improve[aspectKey] || null : null;
}

// ---------- 표 행 (schema buildRecapRows) ----------

function headlineScore(benchmarks, goal) {
  var keys = CONFIG.GOAL_HEADLINE_METRICS[goal] || [];
  var pcts = keys.map(function (k) { return benchmarks && benchmarks[k] ? benchmarks[k].percentile : null; }).filter(function (p) { return p != null; });
  return pcts.length === 0 ? -1 : pcts.reduce(function (a, b) { return a + b; }, 0) / pcts.length;
}

function storeCodeOf(campaign) {
  if (campaign.targetScope === 'all_stores' || !(campaign.targetStoreIds && campaign.targetStoreIds.length)) return 'All';
  return campaign.targetStoreIds.join(', ');
}

function buildRecapRows(eventName, allCampaigns, allRecords) {
  var eventKey = campaignNameKey(eventName);
  var eventCampaigns = (allCampaigns || []).filter(function (c) { return campaignNameKey(campaignGroupKey(c)) === eventKey; });
  var peerEventNames = {};

  var rows = eventCampaigns.map(function (c) {
    var row = getGoalMetricsRow(c, latestRecordFor(c.id, allRecords));
    var peerSet = buildBenchmarkPeers(c, allCampaigns);
    peerSet.peers.forEach(function (p) { peerEventNames[campaignGroupKey(p)] = true; });
    var peerRows = peerSet.peers.map(function (p) { return getGoalMetricsRow(p, latestRecordFor(p.id, allRecords)); });
    var benchmarks = {};
    CONFIG.BENCHMARK_METRICS.forEach(function (m) { benchmarks[m.key] = benchmarkStat(m.key, row[m.key], peerRows, peerSet.scope); });
    var planned = effectiveBudgetPlanned(c);
    var withBenchmarks = Object.assign({}, row, { benchmarks: benchmarks });
    return Object.assign(withBenchmarks, {
      storeCode: storeCodeOf(c),
      phaseName: phaseNameOf(c),
      startDate: c.startDate,
      endDate: c.endDate,
      dailyBudget: c.budgetDaily == null ? null : c.budgetDaily,
      plannedBudget: planned,
      pacingRatio: row.spend != null && planned > 0 ? row.spend / planned : null,
      rank: 0,
      budgetEfficiency: budgetEfficiency(row, c.goal),
      insight: buildCampaignInsight(withBenchmarks, planned),
    });
  });

  var byPlatform = {};
  rows.forEach(function (r) { (byPlatform[r.platform] = byPlatform[r.platform] || []).push(r); });
  Object.keys(byPlatform).forEach(function (p) {
    byPlatform[p].sort(function (a, b) {
      var diff = headlineScore(b.benchmarks, b.goal) - headlineScore(a.benchmarks, a.goal);
      return diff !== 0 ? diff : (b.spend || 0) - (a.spend || 0);
    }).forEach(function (r, i) { r.rank = i + 1; });
  });

  return { byPlatform: byPlatform, campaigns: eventCampaigns, peerEvents: Object.keys(peerEventNames).sort() };
}

/** 표 행 → 시트 한 줄의 평평한 값. 금액·비율은 숫자 그대로(서식은 COLUMNS가 정한다) */
function flattenRow(r) {
  var kpi = r.budgetEfficiency;
  var kpiStat = kpi.metricKey ? r.benchmarks[kpi.metricKey] : null;
  var hasData = r.spend != null || r.impressions != null;
  var flat = {
    campaignId: r.campaignId,
    rank: r.rank,
    name: r.name,
    phaseName: r.phaseName,
    storeCode: r.storeCode,
    goal: r.goal,
    goalLabel: CONFIG.GOAL_LABEL[r.goal] || null,
    startDate: r.startDate,
    endDate: r.endDate,
    days: daysBetween(r.startDate, r.endDate),
    dailyBudget: r.dailyBudget,
    spend: r.spend,
    plannedBudget: r.plannedBudget,
    pacingRatio: r.pacingRatio,
    pacingText: pacingText(r.pacingRatio),
    hasData: hasData,
    primaryKpiKey: kpi.metricKey,
    primaryKpiLabel: hasData ? (CONFIG.METRIC_LABEL[kpi.metricKey] || null) : 'No performance data',
    primaryKpiValue: kpi.value,
    primaryKpiIsMoney: ['cpm', 'cpc', 'cpa', 'cpe'].indexOf(kpi.metricKey) >= 0,
    primaryKpiVsPast: benchmarkPositionText(kpiStat),
    primaryKpiBand: kpiStat ? kpiStat.band : null,
    reach: r.reach,
    impressions: r.impressions,
    videoPlays: r.videoPlays,
    avgWatchSeconds: r.avgWatchSeconds,
    clicks: r.clicks,
    likes: r.likes,
    comments: r.comments,
    shares: r.shares,
    conversions: r.conversions,
    worked: hasData ? insightSentence('strength', r.insight.strength) : null,
    improve: hasData ? insightSentence('weakness', r.insight.weakness) : null,
    benchmarks: r.benchmarks,
  };
  CONFIG.BENCHMARK_METRICS.forEach(function (m) {
    var b = r.benchmarks[m.key];
    flat[m.key] = r[m.key];
    flat[m.key + 'VsPast'] = benchmarkPositionText(b);
    flat[m.key + 'Band'] = b ? b.band : null;
  });
  return flat;
}

/** 집행률 문구 — 문턱 밖일 때만 "Over 25%" / "Under 40%" (RecapCampaignTable와 같은 규칙) */
function pacingText(ratio) {
  if (ratio == null) return null;
  if (ratio >= CONFIG.RECAP_PACING_FLAG.over) return 'Over ' + Math.round((ratio - 1) * 100) + '%';
  if (ratio <= CONFIG.RECAP_PACING_FLAG.under) return 'Under ' + Math.round((1 - ratio) * 100) + '%';
  return null;
}

// ---------- 머리글 순위 (schema buildRecapHeadline · aggregateMetric) ----------

function aggregateMetric(rows, metricKey) {
  var sum = function (key) {
    return rows.reduce(function (acc, r) { return r[key] != null ? (acc == null ? 0 : acc) + r[key] : acc; }, null);
  };
  switch (metricKey) {
    case 'cpm': return calcCPM(sum('spend'), sum('impressions'));
    case 'cpc': return calcCPC(sum('spend'), sum('clicks'));
    case 'cpa': return calcCPA(sum('spend'), sum('conversions'));
    case 'ctr': return calcCTR(sum('clicks'), sum('impressions'));
    case 'hookRate': return calcHookRate(sum('hookViews'), sum('videoPlays'));
    case 'holdRate': return calcHoldRate(sum('heldViews'), sum('hookViews'));
    case 'engagementRate': return calcEngagementRate(sum('engagements'), sum('impressions'));
    case 'cpe': {
      var parts = ['likes', 'comments', 'shares'].map(sum);
      if (parts.every(function (v) { return v == null; })) return null;
      return calcCPE(sum('spend'), parts.reduce(function (a, b) { return a + (b == null ? 0 : b); }, 0));
    }
    default: return null;
  }
}

function buildRecapHeadline(eventName, allCampaigns, allRecords) {
  var eventKey = campaignNameKey(eventName);
  var byEvent = {};
  var order = [];
  (allCampaigns || []).forEach(function (c) {
    var key = campaignNameKey(campaignGroupKey(c));
    if (key !== eventKey && (c.startDate || '') < CONFIG.BENCHMARK_SINCE) return;
    if (!byEvent[key]) { byEvent[key] = { name: campaignGroupKey(c), campaigns: [] }; order.push(key); }
    byEvent[key].campaigns.push(c);
  });
  var self = byEvent[eventKey];
  if (!self || self.campaigns.length === 0) return null;

  var goalCounts = {};
  self.campaigns.forEach(function (c) { goalCounts[c.goal] = (goalCounts[c.goal] || 0) + 1; });
  var goal = Object.keys(goalCounts).sort(function (a, b) { return goalCounts[b] - goalCounts[a]; })[0];
  var metricKey = (CONFIG.GOAL_HEADLINE_METRICS[goal] || [])[0];
  if (!metricKey) return null;
  var meta = CONFIG.BENCHMARK_METRICS.filter(function (m) { return m.key === metricKey; })[0];
  var lowerIsBetter = meta ? meta.lowerIsBetter : false;

  var selfPhases = {};
  self.campaigns.forEach(function (c) { selfPhases[phaseKey(c)] = true; });
  var scored = order.map(function (k) { return byEvent[k]; })
    .filter(function (e) { return e === self || e.campaigns.some(function (c) { return selfPhases[phaseKey(c)]; }); })
    .map(function (e) {
      return { name: e.name, value: aggregateMetric(e.campaigns.map(function (c) { return getGoalMetricsRow(c, latestRecordFor(c.id, allRecords)); }), metricKey) };
    })
    .filter(function (e) { return e.value != null; });
  if (scored.length < CONFIG.BENCHMARK_MIN_PEERS || !scored.some(function (e) { return e.name === self.name; })) return null;

  scored.sort(function (a, b) { return lowerIsBetter ? a.value - b.value : b.value - a.value; });
  var rank = 0;
  scored.forEach(function (e, i) { if (rank === 0 && e.name === self.name) rank = i + 1; });
  return { metricKey: metricKey, rank: rank, total: scored.length, peerEvents: scored.map(function (e) { return e.name; }) };
}

// ---------- 이벤트 목록 · 타임라인 (schema buildRecapEvents · paidAdsPageUtils buildPhaseTimeline) ----------

function buildRecapEvents(campaigns, records) {
  var byEvent = {};
  var order = [];
  (campaigns || []).forEach(function (c) {
    if (!c.campaignGroup || isUnassignedEvent(c.campaignGroup)) return;
    var key = campaignNameKey(c.campaignGroup);
    if (!byEvent[key]) { byEvent[key] = { eventName: c.campaignGroup, campaigns: [] }; order.push(key); }
    byEvent[key].campaigns.push(c);
  });
  return order.map(function (key) {
    var list = byEvent[key].campaigns;
    var spends = list.map(function (c) { var r = latestRecordFor(c.id, records); return r ? r.spend : null; }).filter(function (v) { return v != null; });
    var startDate = list.reduce(function (min, c) { return c.startDate < min ? c.startDate : min; }, list[0].startDate);
    return {
      eventName: byEvent[key].eventName,
      startDate: startDate,
      endDate: list.reduce(function (max, c) { return c.endDate > max ? c.endDate : max; }, list[0].endDate),
      campaignCount: list.length,
      spend: spends.length > 0 ? spends.reduce(function (a, b) { return a + b; }, 0) : null,
    };
  }).sort(function (a, b) { return a.endDate < b.endDate ? 1 : a.endDate > b.endDate ? -1 : 0; });
}

function buildPhaseTimeline(campaigns) {
  var byName = {};
  var order = [];
  campaigns.forEach(function (c) {
    var key = campaignNameKey(c.name);
    if (!byName[key]) { byName[key] = { name: c.name, group: [] }; order.push(key); }
    byName[key].group.push(c);
  });
  return order.map(function (key) {
    var entry = byName[key];
    var group = entry.group;
    var startDate = group.reduce(function (min, c) { return c.startDate < min ? c.startDate : min; }, group[0].startDate);
    var endDate = group.reduce(function (max, c) { return c.endDate > max ? c.endDate : max; }, group[0].endDate);
    var byPlatform = {};
    group.forEach(function (c) { byPlatform[c.platform] = true; });
    var totalBudget = group.reduce(function (sum, c) { return sum + (effectiveBudgetPlanned(c) || 0); }, 0);
    var dailyValues = group.map(function (c) { return c.budgetDaily; }).filter(function (v) { return v != null; });
    var totalDaily = dailyValues.length > 0 ? dailyValues.reduce(function (a, b) { return a + b; }, 0) : null;
    return {
      key: key,
      name: entry.name,
      startDate: startDate,
      endDate: endDate,
      days: daysBetween(startDate, endDate),
      platformLabel: Object.keys(CONFIG.PLATFORM_LABEL).filter(function (p) { return byPlatform[p]; }).map(function (p) { return CONFIG.PLATFORM_LABEL[p]; }).join(' + '),
      totalBudget: totalBudget,
      totalDaily: totalDaily,
    };
  }).sort(function (a, b) { return a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0; });
}

// ---------- 작은 도우미 ----------

var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'Jun 17 – Aug 31' — 같은 해면 연도 없이, 해가 다르면 양쪽에 연도 (utils/format dateRange와 같은 규칙) */
function dateRange(startIso, endIso) {
  var a = String(startIso || '').split('-').map(Number);
  var b = String(endIso || '').split('-').map(Number);
  if (a.length < 3 || b.length < 3) return EMPTY;
  var sameYear = a[0] === b[0];
  var fmt = function (p) { return MONTHS[p[1] - 1] + ' ' + p[2] + (sameYear ? '' : ', ' + p[0]); };
  return fmt(a) + ' – ' + fmt(b);
}

/** 'Jun 17 – Aug 31, 2026' — 메타 줄은 참고 디자인처럼 연도를 항상 붙인다(해가 다르면 양쪽에) */
function dateRangeWithYear(startIso, endIso) {
  var a = String(startIso || '').split('-').map(Number);
  var b = String(endIso || '').split('-').map(Number);
  if (a.length < 3 || b.length < 3) return EMPTY;
  var left = MONTHS[a[1] - 1] + ' ' + a[2] + (a[0] !== b[0] ? ', ' + a[0] : '');
  return left + ' – ' + MONTHS[b[1] - 1] + ' ' + b[2] + ', ' + b[0];
}

/** "62 days" / "1 day" */
function countText(n, noun) {
  if (n == null) return null;
  return n + ' ' + noun + (n === 1 ? '' : 's');
}

/** 'Sep 11, 2026 11:30' — 갱신 시각(스크립트 실행 시간대) */
function dateTimeText(d) {
  if (!isDateValue(d)) return String(d == null ? '' : d);
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function flatMap(list, fn) {
  var out = [];
  list.forEach(function (x) { out = out.concat(fn(x) || []); });
  return out;
}

function uniqueSorted(list) {
  var seen = {};
  return list.filter(function (x) { if (seen[x]) return false; seen[x] = true; return true; }).sort();
}

// node 검증용 — Apps Script에서는 module이 없어 무시된다
if (typeof module === 'object' && module && module.exports) {
  module.exports = { CONFIG: CONFIG, STRINGS: STRINGS, buildReportModel: buildReportModel, splitBlocks: splitBlocks, rowsToGrid: rowsToGrid, listEventNames: listEventNames, buildRecapRows: buildRecapRows, buildRecapHeadline: buildRecapHeadline };
}
