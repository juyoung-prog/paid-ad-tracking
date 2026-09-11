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
 * 데이터 흐름: 스크립트가 대시보드 데이터베이스(Supabase)의 campaigns · performance_records_latest · ad_accounts를
 * **읽기 전용**으로 가져와 이 스프레드시트 안에 "Recap" 탭을 그린다. 시트의 내용을 밖으로 보내는 요청은 없다
 * (썸네일 주소를 한 번 받아 보는 것은 그림이 깨지지 않는지 확인하는 읽기다). 읽기 키(anon)는 대시보드 화면이 쓰는 공개 키와 같은 것이고,
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
 *   · 매 실행마다 sheet.clear()이므로 손으로 고친 서식은 사라진다. 유지할 디자인(열 폭·행 높이·병합·테두리·줄바꿈)은 전부 renderReport_에 있다
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
  /** Engagement / Action 칸의 대표 두 지표(순위 포함) — 목표가 정한다 (recapRowView ENGAGEMENT_ACTION_LAYOUT) */
  ENGAGEMENT_ACTION_LAYOUT: {
    awareness: { primary: ['engagementRate', 'ctr'] },
    traffic: { primary: ['ctr', 'cpc'] },
    engagement: { primary: ['engagementRate', 'cpe'] },
    conversion: { primary: ['cpa', 'ctr'] },
    store_visit: { primary: ['cpa', 'ctr'] },
  },
  /** 그 아래 참여 내역 줄 — 목표와 무관. Follow·Profile은 TikTok만 값이 있다 (recapRowView ENGAGEMENT_BREAKDOWN_KEYS) */
  ENGAGEMENT_BREAKDOWN_KEYS: ['likes', 'comments', 'shares', 'follows', 'profileVisits'],
  /** 예외 명단 — 이벤트가 아니라 "이벤트 미배정"을 뜻하는 campaign_group 값 (schema isUnassignedEvent) */
  UNASSIGNED_EVENT_PATTERN: /^(noname|no[\s_-]?name|unassigned|none|n\/a|-)$/i,
  /** 플랫폼 표시명·순서 (paidAdsPageUtils PLATFORM_LABEL) */
  PLATFORM_LABEL: { meta: 'Meta', tiktok: 'TikTok' },
  /** 목표 표시명 (recapStrings goalLabel.*) */
  GOAL_LABEL: { awareness: 'Awareness', traffic: 'Traffic', engagement: 'Engagement', conversion: 'Conversion', store_visit: 'Store visit' },
  /** 지표 표시명 (recapStrings metric.*) */
  METRIC_LABEL: { cpm: 'CPM', cpc: 'CPC', cpa: 'CPA', cpe: 'Cost/eng', ctr: 'CTR', hookRate: 'Hook', holdRate: 'Hold', engagementRate: 'Eng. rate', likes: 'Like', comments: 'Cmt', shares: 'Share', follows: 'Follow', profileVisits: 'Profile' },
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
      // 광고 계정 — Ads Manager 링크(external_account_id)에만 쓴다. 없어도 보고서는 그려진다(링크만 빠진다)
      accounts: rowsToGrid(fetchSupabaseTable_('ad_accounts', 'id')),
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
/**
 * 물리 열 폭(B열부터) — 캠페인 표(8열, 대시보드와 같은 구성)와 타임라인(8열)이 서로 다른 폭을 요구하므로, 두 표의 열 경계를
 * 모두 담은 잘게 나눈 물리 열 위에 각 논리 열을 병합(span)으로 얹는다. 좁은 조각 열(10~40px)은 병합 안에 숨어 보이지 않는다.
 *
 *   경계(px, B열 시작 0):  260 360 380 480 495 580 620 635 730 825 920 930 1220 1480 1740
 *   캠페인 표: Campaign 260 · Goal 100 · Budget/Spend 135 · Primary KPI 125 · Video response 300 · Engagement/Action 300 ·
 *              What worked 260 · Could improve 260  (끝 1740 — 그 뒤 열은 없다)
 *   타임라인:  Phase 260 · Platforms 120 · Start 100 · End 100 · Days 55 · Daily budget 95 · Planned 95 · Spent 105
 *   KPI:       Period 260 · Campaigns 100 · Total spent 120 · Planned 100 · Stores 55
 * 첫 두 조각(36 + 224)이 Campaign — 36은 썸네일 칸.
 */
var PHYSICAL_WIDTHS = [36, 224, 100, 20, 100, 15, 85, 40, 15, 95, 95, 95, 10, 290, 260, 260];

/** 지표 순위 노트 꼬리 */
var METRIC_RANK_NOTE = '\nAfter a value: rank among comparable past campaigns (same platform, same goal, other events since ' + CONFIG.BENCHMARK_SINCE +
  '; same phase when 3+ exist) — ↑ top · ↓ bottom · mid. Nothing if fewer than 3 peers. Context only, not a grade.';

/**
 * 캠페인 표 — 대시보드 RecapCampaignTable과 같은 8열. span은 병합할 물리 열 수(합 16).
 * rich: true인 열은 순수부가 만든 { text, runs }(줄·강조)를 RichText로 그린다.
 */
var COLUMNS = [
  // 썸네일 칸 + 글 칸. 이름은 굵게 + Ads Manager 링크(있을 때만), 둘째 줄은 매장 · 기간(작고 회색)
  { key: 'campaignText', label: 'Campaign', span: 2, align: 'left', thumbKey: 'thumbnailUrl', linkKey: 'campaignUrl', linkLength: 'phaseNameLength',
    note: 'Thumbnail (when the platform provides one), phase name, then store · period (days). The name links to the campaign in Meta / TikTok Ads Manager when the account id is known. Rows are ordered by the primary KPI\'s rank among comparable past campaigns, then by spend.' },
  { key: 'goalLabel', label: 'Goal', span: 1, align: 'center' },
  { key: 'budgetSpend', label: 'Budget / Spend', span: 3, align: 'center', rich: true,
    note: 'Daily budget, then actual spend. "Over N%" / "Under N%" appears only when spend is ≥20% over or ≥30% under the planned budget (stored budget_planned, else daily budget × days).' },
  { key: 'primaryKpi', label: 'Primary KPI', span: 2, align: 'center', rich: true,
    note: 'The main result for the campaign goal — reported, not judged. Awareness → CPM · Traffic → CPC · Engagement → Cost/eng · Conversion / Store visit → CPA.\nCPM = spend ÷ impressions × 1,000 · CPC = spend ÷ clicks · Cost/eng = spend ÷ (likes + comments + shares) · CPA = spend ÷ results.' + METRIC_RANK_NOTE },
  { key: 'videoResponse', label: 'Video response', span: 4, align: 'left', rich: true,
    note: 'Hook = hook views ÷ video plays (Meta: 3-second plays, TikTok: 2-second plays) · Hold = completed views ÷ hook views. Third line: reach · plays · average watch time as the platform reports them.' + METRIC_RANK_NOTE },
  { key: 'engagementAction', label: 'Engagement / Action', span: 2, align: 'left', rich: true,
    note: 'The two engagement / action metrics the goal emphasises — Awareness: Eng. rate · CTR, Traffic: CTR · CPC, Engagement: Eng. rate · Cost/eng, Conversion / Store visit: CPA · CTR. Third line: the engagement breakdown as the ad platform reports it — likes · comments · shares, plus follows · profile visits on TikTok. Saves and reposts are not available from the ad APIs.\nEng. rate = engagements ÷ impressions · CTR = clicks ÷ impressions · CPC = spend ÷ clicks · Cost/eng = spend ÷ (likes + comments + shares).' + METRIC_RANK_NOTE },
  { key: 'worked', label: 'What worked', span: 1, align: 'left',
    note: 'Generated from this campaign\'s metrics and comparable past campaigns. Candidates are the metrics the goal shows (primary KPI first, then diagnostic Hook/Hold/CTR/Eng. rate); the one ranked in the top band wins. Nothing here is a claim about creative, targeting or messaging. "—" means no evidence.' },
  { key: 'improve', label: 'Could improve', span: 1, align: 'left',
    note: 'Same candidates as "What worked", the one in the bottom band (primary KPI first). If none, and spend ran more than 20% over plan, that is noted instead. "—" means no evidence.' },
];

/** 타임라인 표 열 — 물리 열 13개에 병합으로 얹는다 */
var TIMELINE_COLUMNS = [
  { key: 'name', label: 'Phase', span: 2, align: 'left' },
  { key: 'platformLabel', label: 'Platforms', span: 2, align: 'center' },
  { key: 'startDate', label: 'Start', span: 1, align: 'center' },
  { key: 'endDate', label: 'End', span: 2, align: 'center' },
  { key: 'days', label: 'Days', span: 2, align: 'center', fmt: '0' },
  { key: 'totalDaily', label: 'Daily budget', span: 1, align: 'right', fmt: '"$"#,##0.00' },
  { key: 'totalBudget', label: 'Planned', span: 1, align: 'right', fmt: '"$"#,##0' },
  { key: 'spent', label: 'Spent', span: 2, align: 'right', fmt: '"$"#,##0.00' },
];

/** KPI 블록 — 헤더 줄 + 값 줄 */
var KPI_COLUMNS = [
  { key: 'periodText', label: 'Period', span: 2, align: 'left' },
  { key: 'campaignCount', label: 'Campaigns', span: 1, align: 'center', fmt: '0' },
  { key: 'spend', label: 'Total spent', span: 2, align: 'right', fmt: '"$"#,##0.00' },
  { key: 'plannedBudget', label: 'Planned', span: 2, align: 'right', fmt: '"$"#,##0',
    note: 'Sum of each campaign\'s planned budget: stored budget_planned, else daily budget × days (start and end inclusive). The dashboard uses the Plan document when one exists.' },
  { key: 'storeCount', label: 'Stores', span: 2, align: 'center', fmt: '0' },
];

/**
 * 디자인 상수 — 참고: G10_Grand Opening Influencer 시트. 모든 셀에 얇은 연회색 격자(가로·세로·바깥), 헤더는 연회색 바탕 + 굵게,
 * 행 높이 일정, 지표 칸은 값(보통) + 순위(작고 회색) 두 줄. 대시보드 카드가 아니라 스프레드시트 보고서다.
 */
var STYLE = {
  border: '#dadce0',
  headerBg: '#f3f3f3',
  secondary: '#666666',
  fontSize: 10,
  smallFontSize: 9,
  titleSize: 16,
  sectionSize: 12,
  leftGutter: 20,
  left: 2,
  heights: { title: 34, section: 28, kpiHeader: 28, kpiValue: 30, timelineHeader: 28, timelineRow: 28, campaignHeader: 28, campaignRow: 64 },
  sectionGap: 2,
};

/** 셀 하나에 놓을 값 — 없으면 "—"(문자열). 금액·비율은 숫자 그대로(서식은 열이 정한다) */
function cellValue_(v) {
  return v == null || v === '' ? EMPTY : v;
}

/** 열 정의의 span 합 — 표가 차지하는 물리 열 수 */
function spanOf_(columns) {
  return columns.reduce(function (sum, c) { return sum + (c.span || 1); }, 0);
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
  var totalCols = STYLE.left - 1 + PHYSICAL_WIDTHS.length;
  if (sheet.getMaxColumns() < totalCols) sheet.insertColumnsAfter(sheet.getMaxColumns(), totalCols - sheet.getMaxColumns());
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).setFontSize(STYLE.fontSize).setVerticalAlignment('middle');

  var L = STYLE.left;
  var H = STYLE.heights;
  var row = 2; // 1행은 위 여백

  // 2) 제목 · 메타 줄
  sheet.getRange(row, L).setValue(model.eventName).setFontSize(STYLE.titleSize).setFontWeight('bold').setHorizontalAlignment('left')
    .setNote('Recap — read from the dashboard database (read-only) and drawn by the Report script. Rules match the dashboard (src/data/schema.js). Refresh: Report → Refresh report.');
  sheet.setRowHeight(row, H.title);
  row += 1;
  sheet.getRange(row, L).setValue(model.metaLine).setFontColor(STYLE.secondary).setHorizontalAlignment('left');
  row += 2;

  // 3) KPI 블록
  var kpiRow = { periodText: model.periodText, campaignCount: model.campaignCount, spend: model.spend, plannedBudget: model.plannedBudget, storeCount: model.stores.length || null };
  row = renderTable_(sheet, row, L, KPI_COLUMNS, [kpiRow], { headerHeight: H.kpiHeader, rowHeight: H.kpiValue, valuesBold: true });
  row += 1;

  // 4) 순위 한 줄 — 굵게, 비교 이벤트는 다음 줄 회색
  if (model.headline) {
    sheet.getRange(row, L).setValue(model.headline.text).setFontWeight('bold').setFontSize(STYLE.sectionSize).setHorizontalAlignment('left')
      .setNote('Event-level rank by the primary KPI of the event\'s most common goal (' + CONFIG.METRIC_LABEL[model.headline.metricKey] +
        '), recomputed from summed numerators and denominators, against other events that share at least one phase name. Needs 3+ events including this one.');
    row += 1;
    sheet.getRange(row, L).setValue(model.headline.peerEvents.join(' · ')).setFontColor(STYLE.secondary).setHorizontalAlignment('left');
    row += 1;
  }
  row += STYLE.sectionGap;

  // 5) 타임라인 — 단계별 기간·예산·지출 + Total
  row = renderSectionTitle_(sheet, row, 'Timeline — ' + countText_(model.phases.length, 'phase'));
  row = renderTable_(sheet, row, L, TIMELINE_COLUMNS, model.phases, { headerHeight: H.timelineHeader, rowHeight: H.timelineRow, total: model.phaseTotal });
  row += STYLE.sectionGap;

  // 6) 플랫폼별 캠페인 표 — 셀 안 줄바꿈이 있어 줄이 높고 WRAP
  model.sections.forEach(function (section) {
    row = renderSectionTitle_(sheet, row, section.label + ' campaigns — ' + countText_(section.rows.length, 'campaign'));
    row = renderTable_(sheet, row, L, COLUMNS, section.rows, { headerHeight: H.campaignHeader, rowHeight: H.campaignRow, wrap: true });
    row += STYLE.sectionGap;
  });

  // 7) 꼬리말
  sheet.getRange(row, L).setValue('Refreshed ' + model.refreshedText + ' from the dashboard database · rules synced with src/data/schema.js · What worked / Could improve are generated sentences; notes written by a person live in the dashboard.')
    .setFontSize(8).setFontColor(STYLE.secondary).setHorizontalAlignment('left');

  // 8) 열 폭 — A열 여백, B열부터 물리 열 폭
  sheet.setColumnWidth(1, STYLE.leftGutter);
  PHYSICAL_WIDTHS.forEach(function (w, i) { sheet.setColumnWidth(L + i, w); });
  // 남는 빈 행·열은 지운다 — 스크롤 끝이 표 끝이어야 읽기 편하다
  if (sheet.getMaxRows() > row + 2) sheet.deleteRows(row + 3, sheet.getMaxRows() - row - 2);
  if (sheet.getMaxColumns() > totalCols) sheet.deleteColumns(totalCols + 1, sheet.getMaxColumns() - totalCols);
}

/** 같은 실행 안에서 썸네일 URL 확인 결과를 기억한다 — 한 이벤트에 같은 소재가 여러 번 나온다 */
var thumbnailCheckCache_ = {};
/**
 * data: 썸네일 최대 길이 — 셀 이미지는 base64 data 주소를 대략 1.5MB까지 받는다. 그보다 길면 넣지 않고 글만 보인다.
 * (Meta 일부 캠페인은 thumbnail_url이 주소가 아니라 PNG를 base64로 박은 값이다 — 0.8~1MB)
 */
var MAX_DATA_URL_LENGTH = 1900000;

/**
 * 썸네일 한 칸 — 셀 안 이미지(비율 유지, 칸에 맞춤). 깨진 그림 아이콘을 남기지 않기 위해 https 주소는 먼저 받아 보고
 * 이미지(2xx + image/*)일 때만 넣는다. data: 주소는 그대로 넣는다. 실패하면 칸을 비운다.
 */
function renderThumbnail_(cell, url, altText) {
  if (!url) return;
  var source = String(url);
  try {
    if (/^https?:/i.test(source)) {
      if (thumbnailCheckCache_[source] === undefined) {
        var res = UrlFetchApp.fetch(source, { muteHttpExceptions: true, followRedirects: true });
        var type = String(res.getHeaders()['Content-Type'] || res.getHeaders()['content-type'] || '');
        thumbnailCheckCache_[source] = res.getResponseCode() >= 200 && res.getResponseCode() < 300 && /^image\//i.test(type);
      }
      if (!thumbnailCheckCache_[source]) return;
    } else if (!/^data:image\//i.test(source) || source.length > MAX_DATA_URL_LENGTH) {
      // data: 주소는 그대로 넣되, 너무 큰 것(수백 KB의 base64)은 셀 이미지로 들어가지 않으므로 건너뛴다
      return;
    }
    var image = SpreadsheetApp.newCellImage().setSourceUrl(source).setAltTextTitle(altText || 'Campaign thumbnail').build();
    cell.setValue(image);
  } catch (e) {
    // 그림은 장식이다 — 못 넣으면 조용히 비운다
    console.warn('Thumbnail skipped: ' + (e && e.message ? e.message : e));
  }
}

/**
 * 캠페인 글 칸 — 첫 줄(이름)은 굵게 + Ads Manager 링크(있을 때만), 둘째 줄(매장 · 기간)은 회색.
 * 링크가 없어도 이름은 그대로 읽힌다. 주소 원문은 화면에 보이지 않는다.
 */
function renderLinkedText_(cell, text, nameLength, url) {
  var nameEnd = Math.min(nameLength || 0, text.length);
  var builder = SpreadsheetApp.newRichTextValue().setText(text);
  if (nameEnd > 0) {
    builder.setTextStyle(0, nameEnd, SpreadsheetApp.newTextStyle().setBold(true).build());
    if (url) builder.setLinkUrl(0, nameEnd, url);
  }
  if (nameEnd < text.length) {
    builder.setTextStyle(nameEnd, text.length, SpreadsheetApp.newTextStyle().setForegroundColor(STYLE.secondary).setFontSize(STYLE.smallFontSize).build());
  }
  cell.setRichTextValue(builder.build());
}

/**
 * 순수부가 만든 { text, runs } → RichText. run.style: 'small'(9pt 회색 — 순위·보조 줄·라벨) · 'bold'(값 강조).
 * 글자 위치는 순수부가 계산했으므로 여기서는 옮겨 적기만 한다.
 */
function renderRichCell_(cell, rich) {
  var small = SpreadsheetApp.newTextStyle().setForegroundColor(STYLE.secondary).setFontSize(STYLE.smallFontSize).build();
  var bold = SpreadsheetApp.newTextStyle().setBold(true).build();
  var builder = SpreadsheetApp.newRichTextValue().setText(rich.text);
  rich.runs.forEach(function (run) {
    if (run.end <= run.start) return;
    builder.setTextStyle(run.start, run.end, run.style === 'bold' ? bold : small);
  });
  cell.setRichTextValue(builder.build());
}

/** "4 phases" / "1 campaign" */
function countText_(n, noun) {
  return n + ' ' + noun + (n === 1 ? '' : 's');
}

/** 섹션 제목 줄 — 굵은 12pt 한 칸, 밑줄·바탕 없음 */
function renderSectionTitle_(sheet, row, title) {
  sheet.getRange(row, STYLE.left).setValue(title).setFontSize(STYLE.sectionSize).setFontWeight('bold').setHorizontalAlignment('left');
  sheet.setRowHeight(row, STYLE.heights.section);
  return row + 1;
}

/**
 * 표 하나 — 헤더 줄(연회색 바탕·굵게·위아래 중간 회색 선·노트) + 데이터 줄(옅은 가로선, 세로선 없음) + 선택적 Total 줄(굵게, 위 선 진하게).
 * span > 1인 열은 물리 열을 병합한다.
 * @param {{ headerHeight: number, rowHeight: number, total?: Object|null, valuesBold?: boolean, wrap?: boolean }} options
 * @returns {number} 다음 빈 줄
 */
function renderTable_(sheet, row, startCol, columns, rows, options) {
  options = options || {};
  var width = spanOf_(columns);
  var offsets = [];
  var acc = 0;
  columns.forEach(function (c) { offsets.push(acc); acc += (c.span || 1); });
  // 병합 — 썸네일 칸이 있는 열(thumbKey)은 본문에서 병합하지 않는다(그림 칸 + 글 칸). 헤더는 병합한다
  var mergeRow = function (r, isHeader) {
    columns.forEach(function (c, i) {
      if ((c.span || 1) > 1 && (isHeader || !c.thumbKey)) sheet.getRange(r, startCol + offsets[i], 1, c.span).merge();
    });
  };

  var borderAll = function (range) { range.setBorder(true, true, true, true, true, true, STYLE.border, SpreadsheetApp.BorderStyle.SOLID); };

  // 헤더 — 연회색 바탕, 굵게, 모든 변 테두리, 세로 가운데
  var headerRange = sheet.getRange(row, startCol, 1, width);
  var header = [];
  columns.forEach(function (c) { for (var k = 0; k < (c.span || 1); k += 1) header.push(k === 0 ? c.label : ''); });
  headerRange.setValues([header]).setFontWeight('bold').setBackground(STYLE.headerBg).setWrap(false).setVerticalAlignment('middle');
  borderAll(headerRange);
  mergeRow(row, true);
  columns.forEach(function (c, i) {
    var cell = sheet.getRange(row, startCol + offsets[i]);
    cell.setHorizontalAlignment(c.align || 'center');
    if (c.note) cell.setNote(c.note);
  });
  sheet.setRowHeight(row, options.headerHeight);
  row += 1;

  var bodyRows = rows.slice();
  var totalIndex = -1;
  if (options.total) { totalIndex = bodyRows.length; bodyRows.push(options.total); }

  if (bodyRows.length === 0) {
    var emptyRange = sheet.getRange(row, startCol, 1, width);
    emptyRange.merge().setValue('No campaigns on this platform.').setFontColor(STYLE.secondary).setHorizontalAlignment('left');
    borderAll(emptyRange);
    sheet.setRowHeight(row, options.rowHeight);
    return row + 1;
  }

  // 본문 — 값은 병합 첫 칸에, 나머지 칸은 빈 문자열. 모든 셀에 격자
  var values = bodyRows.map(function (r, j) {
    var line = [];
    columns.forEach(function (c, i) {
      var v;
      if (j === totalIndex && i === 0) v = 'Total';
      else if (j === totalIndex && r[c.key] == null) v = '';
      else if (c.rich) v = r[c.key] && r[c.key].text ? r[c.key].text : EMPTY;
      else v = cellValue_(r[c.key]);
      if (c.thumbKey && j !== totalIndex) { line.push(''); line.push(v); return; } // 그림 칸은 비워 두고 글은 둘째 칸에
      for (var k = 0; k < (c.span || 1); k += 1) line.push(k === 0 ? v : '');
    });
    return line;
  });
  var body = sheet.getRange(row, startCol, bodyRows.length, width);
  body.setValues(values).setVerticalAlignment('middle');
  body.setWrapStrategy(options.wrap ? SpreadsheetApp.WrapStrategy.WRAP : SpreadsheetApp.WrapStrategy.CLIP);
  borderAll(body);
  for (var j = 0; j < bodyRows.length; j += 1) mergeRow(row + j, false);
  sheet.setRowHeights(row, bodyRows.length, options.rowHeight);
  if (options.valuesBold) body.setFontWeight('bold').setFontSize(11);

  columns.forEach(function (c, i) {
    var textCol = startCol + offsets[i] + (c.thumbKey ? 1 : 0);
    var colRange = sheet.getRange(row, textCol, bodyRows.length, 1);
    colRange.setHorizontalAlignment(c.align || 'center');
    if (c.fmt) colRange.setNumberFormat(c.fmt);
    else if (c.key === 'startDate' || c.key === 'endDate') colRange.setNumberFormat('@');
    if (c.thumbKey) {
      sheet.getRange(row, startCol + offsets[i], bodyRows.length, 1).setHorizontalAlignment('center');
      bodyRows.forEach(function (r, j) {
        if (j === totalIndex) return;
        renderThumbnail_(sheet.getRange(row + j, startCol + offsets[i]), r[c.thumbKey], r.phaseName);
        renderLinkedText_(sheet.getRange(row + j, textCol), String(r[c.key] || ''), r[c.linkLength] || 0, r[c.linkKey] || null);
      });
    } else if (c.rich) {
      bodyRows.forEach(function (r, j) {
        if (j === totalIndex || !r[c.key] || !r[c.key].runs || !r[c.key].runs.length) return;
        renderRichCell_(sheet.getRange(row + j, textCol), r[c.key]);
      });
    }
  });

  if (totalIndex >= 0) {
    sheet.getRange(row + totalIndex, startCol, 1, width).setFontWeight('bold');
    sheet.getRange(row + totalIndex, startCol).setHorizontalAlignment('left');
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
 * @param {{ campaigns: any[][], performance: any[][]|null, accounts?: any[][]|null }} grids - 첫 줄이 헤더인 2차원 배열. performance가 null이면 campaigns 안에 두 표가 헤더 줄로 나뉘어 있다고 본다. accounts(ad_accounts)는 Ads Manager 링크에만 쓰고 없어도 된다
 * @param {Date|string} today - 생성 시각(꼬리말·"generatedAt"에만 쓴다 — 계산은 날짜에 의존하지 않는다)
 * @param {string|null} [eventName] - 보고할 이벤트. 없으면 가장 최근에 끝난 이벤트
 * @returns {Object} { eventName, generatedAt, metaLine, periodText, startDate, endDate, campaignCount, spend, plannedBudget, stores, platforms, headline, phases, sections, events }
 */
function buildReportModel(grids, today, eventName) {
  var source = grids.performance ? grids : splitBlocks(grids.campaigns);
  var campaigns = parseCampaigns(source.campaigns);
  var records = parsePerformance(source.performance);
  var accountById = {};
  parseAccounts(grids.accounts).forEach(function (a) { accountById[a.id] = a; });
  var campaignById = {};
  campaigns.forEach(function (c) { campaignById[c.id] = c; });
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
    return {
      platform: p,
      label: CONFIG.PLATFORM_LABEL[p],
      rows: recap.byPlatform[p].map(function (r) {
        var campaign = campaignById[r.campaignId] || null;
        return Object.assign(flattenRow(r), {
          // Campaign 칸의 장식 — 썸네일은 플랫폼이 준 주소 그대로, 링크는 대시보드와 같은 Ads Manager 규칙(adsManagerUrl)
          thumbnailUrl: campaign ? campaign.thumbnailUrl : null,
          campaignUrl: campaign ? adsManagerUrl(campaign, accountById[campaign.accountId]) : null,
          phaseNameLength: r.phaseName.length,
        });
      }),
    };
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
      // Campaign 칸의 장식 재료 — 계산에는 쓰지 않는다
      thumbnailUrl: str(r.thumbnailurl),
      externalCampaignId: str(r.externalcampaignid),
    };
  }).filter(function (c) { return c.id; });
}

/** ad_accounts 표 → { id, platform, externalAccountId }. 표가 없으면 빈 배열 */
function parseAccounts(grid) {
  return gridToObjects(grid).map(function (r) {
    return { id: str(r.id), platform: (str(r.platform) || '').toLowerCase(), externalAccountId: str(r.externalaccountid) };
  }).filter(function (a) { return a.id; });
}

/**
 * Ads Manager 캠페인 링크 — 대시보드 paidAdsPageUtils.adsManagerUrl과 같은 규칙. 계정 id를 모르면 null(추측해서 만들지 않는다).
 *   Meta   : 계정(act_ 접두사 제거) + 외부 캠페인 id → 그 캠페인이 선택된 캠페인 목록
 *   TikTok : 광고주(aadvid) 캠페인 목록 — TikTok Ads Manager는 캠페인 하나로 바로 가는 주소를 주지 않는다
 */
function adsManagerUrl(campaign, account) {
  if (!account || !account.externalAccountId) return null;
  if (campaign.platform === 'meta') {
    if (!campaign.externalCampaignId) return null;
    var accountId = String(account.externalAccountId).replace(/^act_/, '');
    return 'https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=' + encodeURIComponent(accountId) + '&selected_campaign_ids=' + encodeURIComponent(campaign.externalCampaignId);
  }
  if (campaign.platform === 'tiktok') {
    return 'https://ads.tiktok.com/i18n/perf/campaign?aadvid=' + encodeURIComponent(String(account.externalAccountId));
  }
  return null;
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

/** 벤치마크 위치 문구 (recapStrings benchmarkPositionText) — 짧은 표기: top ↑ · bottom ↓ · mid는 기호 없음 */
function benchmarkPositionText(stat) {
  if (!stat || stat.peerScope === 'none' || stat.percentile == null) return null;
  if (stat.percentile >= 100) return '↑ best of ' + (stat.sampleSize + 1);
  if (stat.percentile <= 0) return '↓ lowest of ' + (stat.sampleSize + 1);
  if (stat.band === 'top') return '↑ top ' + (100 - stat.percentile) + '%';
  if (stat.band === 'bottom') return '↓ bottom ' + stat.percentile + '%';
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
    follows: r.follows,
    profileVisits: r.profileVisits,
    conversions: r.conversions,
    worked: hasData ? insightSentence('strength', r.insight.strength) : null,
    improve: hasData ? insightSentence('weakness', r.insight.weakness) : null,
    benchmarks: r.benchmarks,
  };
  // 임원용 표의 문장형 칸 — 대시보드 RecapCampaignTable과 같은 표기. 값은 utils/format의 money·percent 규칙(2자리)
  // 대시보드 RecapCampaignTable과 같은 8열 구성의 칸 — 줄·강조는 { text, runs }로 넘기고 렌더가 RichText로 옮긴다
  flat.campaignText = [r.phaseName, [storeText(r.storeCode), dateRangeWithDays(r.startDate, r.endDate)].filter(Boolean).join(' · ')].filter(Boolean).join('\n');
  flat.budgetSpend = budgetSpendCell(r);
  flat.primaryKpi = hasData ? primaryKpiCell(kpi, kpiStat) : richLines([[{ text: EMPTY }]]);
  flat.videoResponse = hasData ? videoResponseCell(r) : richLines([[{ text: 'No performance data' }]]);
  flat.engagementAction = hasData ? engagementActionCell(r) : richLines([[{ text: EMPTY }]]);
  CONFIG.BENCHMARK_METRICS.forEach(function (m) {
    var b = r.benchmarks[m.key];
    flat[m.key] = r[m.key];
    flat[m.key + 'VsPast'] = benchmarkPositionText(b);
    flat[m.key + 'Band'] = b ? b.band : null;
  });
  return flat;
}

/** 금액 표기 — "$1,639.68" (utils/format money). 자리표시자·null은 "—" */
function moneyText(v) {
  if (v == null || !isFinite(v)) return EMPTY;
  // 대시보드(toLocaleString)는 십진 표기 기준 반올림이다 — 229.565 → $229.57. toFixed는 이진 오차로 229.56을 내므로
  // 십진 문자열(toPrecision)에서 센트 단위로 반올림한다
  var cents = Math.round(Number(Number(Math.abs(v)).toPrecision(15) + 'e2'));
  var fixed = (cents / 100).toFixed(2);
  var parts = fixed.split('.');
  var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (v < 0 ? '-' : '') + '$' + intPart + '.' + parts[1];
}

/** 비율 표기 — "6.78%" (utils/format percent, 2자리) */
function percentText(v) {
  if (v == null || !isFinite(v)) return EMPTY;
  return (v * 100).toFixed(2) + '%';
}

function isMoneyMetric(key) {
  return ['cpm', 'cpc', 'cpa', 'cpe'].indexOf(key) >= 0;
}

/** 지표 값 표기 — 비용은 돈, 나머지는 비율 (recapRowView kpiFormat) */
function metricText(key, v) {
  return isMoneyMetric(key) ? moneyText(v) : percentText(v);
}

/** 매장 표기 — 여러 곳이면 "G10 +2" (recapRowView storeTextOf) */
function storeText(storeCode) {
  var stores = String(storeCode || '').split(/,\s*/).filter(Boolean);
  if (stores.length === 0) return null;
  return stores.length > 1 ? stores[0] + ' +' + (stores.length - 1) : stores[0];
}

/**
 * 줄·강조가 있는 칸의 재료 — lines: 줄마다 세그먼트 배열 [{ text, style? }]. style은 'small'(작고 회색) · 'bold'.
 * 결과 { text, runs: [{ start, end, style }] }. 글자 위치를 여기서 계산해 두면 렌더는 옮겨 적기만 한다.
 */
function richLines(lines) {
  var text = '';
  var runs = [];
  lines.forEach(function (segments, i) {
    if (i > 0) text += '\n';
    segments.forEach(function (seg) {
      var start = text.length;
      text += seg.text;
      if (seg.style) runs.push({ start: start, end: text.length, style: seg.style });
    });
  });
  return { text: text, runs: runs };
}

/** "Jul 6 – Aug 1 (27 days)" (utils/format dateRangeWithDays) */
function dateRangeWithDays(startIso, endIso) {
  var days = daysBetween(startIso, endIso);
  var range = dateRange(startIso, endIso);
  return days == null || days < 1 ? range : range + ' (' + countText(days, 'day') + ')';
}

/** Budget / Spend — "$20.00/day"(작게) ⏎ "$1,119.30 spent"(굵게) ⏎ "Over 25%"(작게, 문턱 밖일 때만). 지출 없으면 "—" */
function budgetSpendCell(r) {
  var lines = [];
  if (r.dailyBudget != null) lines.push([{ text: moneyText(r.dailyBudget) + '/day', style: 'small' }]);
  lines.push(r.spend != null ? [{ text: moneyText(r.spend) + ' spent', style: 'bold' }] : [{ text: EMPTY }]);
  var pacing = pacingText(r.pacingRatio);
  if (pacing) lines.push([{ text: pacing, style: 'small' }]);
  return richLines(lines);
}

/** Primary KPI — "CPM"(작게) ⏎ "$2.41"(굵게) ⏎ "↑ best of 12"(작게, 비교군 있을 때만). 값 없으면 "—" */
function primaryKpiCell(kpi, stat) {
  if (!kpi || !kpi.metricKey || kpi.value == null) return richLines([[{ text: EMPTY }]]);
  var lines = [
    [{ text: CONFIG.METRIC_LABEL[kpi.metricKey], style: 'small' }],
    [{ text: metricText(kpi.metricKey, kpi.value), style: 'bold' }],
  ];
  var position = benchmarkPositionText(stat);
  if (position) lines.push([{ text: position, style: 'small' }]);
  return richLines(lines);
}

/** 지표 한 줄 — "Hook 23.11%" + "  ↑ top 9%"(작게). 값 없으면 "Hook —" */
function metricLine(r, key) {
  var segments = [{ text: CONFIG.METRIC_LABEL[key] + ' ' + (r[key] == null ? EMPTY : metricText(key, r[key])) }];
  var position = r[key] == null ? null : benchmarkPositionText(r.benchmarks ? r.benchmarks[key] : null);
  if (position) segments.push({ text: '  ' + position, style: 'small' });
  return segments;
}

/** 압축 수량 — 1만 미만 "1,074", 1만 이상 "163K", 100만 이상 "1.2M" (utils/format countCompact) */
function countCompactText(v) {
  if (v == null || !isFinite(v)) return EMPTY;
  var abs = Math.abs(v);
  if (abs >= 1000000) return (v / 1000000).toFixed(abs >= 10000000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (abs >= 10000) return Math.round(v / 1000) + 'K';
  return countNumberText(v);
}

/** "1,074" (utils/format count) */
function countNumberText(v) {
  if (v == null || !isFinite(v)) return EMPTY;
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 참여 내역 줄 — "Like 508 · Cmt 10 · Share 601" (TikTok은 "· Follow 12 · Profile 40"까지). 값이 없는 항목은 뺀다 (recapRowView engagementBreakdownText) */
function engagementBreakdownText(r) {
  return CONFIG.ENGAGEMENT_BREAKDOWN_KEYS
    .map(function (k) { return r[k] == null ? null : CONFIG.METRIC_LABEL[k] + ' ' + countNumberText(r[k]); })
    .filter(Boolean)
    .join(' · ');
}

/**
 * Video response — 대시보드와 같은 구성: Hook 줄, Hold 줄(각각 순위 포함), 보조 줄 "Reach 163K · Plays 296K · Avg 2s"(작게).
 * (대시보드는 Hook·Hold를 좌우로 놓지만 시트 셀은 비례 글꼴이라 줄로 쌓는다 — 순위는 자기 지표 옆에 붙어 있다)
 */
function videoResponseCell(r) {
  var lines = [metricLine(r, 'hookRate'), metricLine(r, 'holdRate')];
  var secondary = [
    r.reach != null ? 'Reach ' + countCompactText(r.reach) : null,
    r.videoPlays != null ? 'Plays ' + countCompactText(r.videoPlays) : null,
    r.avgWatchSeconds != null ? 'Avg ' + secondsText(r.avgWatchSeconds) : null,
  ].filter(Boolean);
  if (secondary.length) lines.push([{ text: secondary.join(' · '), style: 'small' }]);
  return richLines(lines);
}

/** Engagement / Action — 목표가 정한 대표 두 지표 줄(순위 포함) + 참여 내역 줄(작게). 구성은 대시보드와 같다 */
function engagementActionCell(r) {
  var layout = CONFIG.ENGAGEMENT_ACTION_LAYOUT[r.goal] || CONFIG.ENGAGEMENT_ACTION_LAYOUT.awareness;
  var lines = layout.primary.map(function (k) { return metricLine(r, k); });
  var breakdown = engagementBreakdownText(r);
  if (breakdown) lines.push([{ text: breakdown, style: 'small' }]);
  return richLines(lines);
}

/** "2s" / "2.95s" — 값이 가진 만큼만 (utils/format seconds) */
function secondsText(v) {
  if (v == null || !isFinite(v)) return EMPTY;
  return (Math.round(v * 100) / 100).toFixed(2).replace(/\.?0+$/, '') + 's';
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
  module.exports = { CONFIG: CONFIG, STRINGS: STRINGS, buildReportModel: buildReportModel, splitBlocks: splitBlocks, rowsToGrid: rowsToGrid, adsManagerUrl: adsManagerUrl, listEventNames: listEventNames, buildRecapRows: buildRecapRows, buildRecapHeadline: buildRecapHeadline };
}
