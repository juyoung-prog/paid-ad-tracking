import { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { ScrollArea } from '../../components/container/ScrollArea';
import { FilterBar } from '../../components/templates/FilterBar';
import { PhaseTimelineChart } from './PhaseTimelineChart';
import { KpiBar } from '../../components/data-display/KpiBar';
import { getReportSummary, getGoalMetricsRow, campaignGroupKey, campaignNameKey, PLATFORM, GOAL } from '../../data/schema';
import { campaignInDateRange, shortDate, PAGE_GUTTER_X } from './paidAdsPageUtils';

const PLATFORM_LABEL = {
  [PLATFORM.META]: 'Meta',
  [PLATFORM.TIKTOK]: 'TikTok',
};

// Dashboard의 VIEW_STORAGE_KEY와 같은 규칙, 키만 화면별로 분리 — 두 화면의
// 마지막 뷰가 서로를 덮어쓰면 안 된다.
const REPORT_VIEW_STORAGE_KEY = 'paidAdsReports:lastView:v1';

function loadLastReportView() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(REPORT_VIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Plan 탭 Gantt의 phase 막대 채움. 색을 순환시키지 않고 primary 하나의 명도만
// 바꾼다(시간 순 옅음→진함).
//
// 왜 순환을 버렸나:
//  1) 대비 실패. 예전 5색 순환(info/success/warning/primary/secondary)은 검증에서
//     떨어졌다 — success↔info가 정상 시야 ΔE 12.1(기준 15), 색각이상 4.9.
//  2) 텍스트가 안 읽혔다. 막대 채움은 {token}.light인데 글자는 {token}.contrastText
//     (흰색)를 썼다. contrastText는 .main 기준으로 정의된 값이라 .light 위에서는
//     2.76~4.28:1로 5개 중 4개가 WCAG AA(4.5:1)에 미달했다.
//  3) 애초에 색이 정체성을 나를 필요가 없다. 막대마다 자기 행이 있고 이름이 막대
//     안에 직접 적혀 있다. phase는 시간 순서가 있으니 순차 램프가 맞는 인코딩이다.
//
// 막대의 존재감은 테두리(primary.main, 흰 배경 대비 8.59:1)가 맡고, 채움을 밝게
// 두어 진한 텍스트가 전 구간에서 4.95:1 이상을 유지한다.
const PHASE_FILL_MIN_ALPHA = 0.15;
const PHASE_FILL_MAX_ALPHA = 0.50;

/**
 * 섹션 제목 — 본문 영역에서 "이 블록이 무엇인가"를 말하는 진짜 제목.
 *
 * 예전엔 이 자리가 대문자 overline이었고, 그 아래 부속 라벨은 오히려 문장형
 * caption이었다 — 위계가 뒤집혀서 둘 다 같은 급으로 읽혔다. 두 단으로 나눈다:
 * 제목은 문장형 볼드, 부속/분류 라벨만 대문자 overline.
 *
 * 제목 옆에는 범위(개수·합계)를 같은 줄에 붙인다. 캡션 줄을 따로 만들지 않고
 * 제목 한 줄이 "무엇을 몇 개 기준으로 보고 있는지"까지 말하게 한다.
 */
const SECTION_TITLE_SX = { display: 'block', mb: 1.5, fontWeight: 600, color: 'text.primary' };

/** 제목 옆 범위 텍스트 — 제목과 같은 줄, 한 단 약하게 */
const SECTION_SCOPE_SX = { fontWeight: 400, color: 'text.secondary' };

/** 시간 순 index를 채움 불투명도로. phase가 하나뿐이면 가장 옅은 값을 쓴다. */
function phaseFillAlpha(index, total) {
  if (total <= 1) return PHASE_FILL_MIN_ALPHA;
  const t = index / (total - 1);
  return PHASE_FILL_MIN_ALPHA + (PHASE_FILL_MAX_ALPHA - PHASE_FILL_MIN_ALPHA) * t;
}

// 같은 이름(phase)의 캠페인을 플랫폼별로 묶어 하나의 타임라인 막대 + Budget
// Breakdown 한 행으로 합친다 — "G10 Grand Opening"이 Meta/TikTok 두 캠페인으로
// 나뉘어 있어도 하나의 phase로 취급한다(실사용 피드백: 플랫폼별로 행이
// 중복돼 보이는 게 불편했음). 기간은 두 플랫폼의 시작일 중 이른 날짜~
// 종료일 중 늦은 날짜로 합친다(보통 동일하지만, 혹시 다르더라도 안전).
//
// 묶음 키는 이름 그대로가 아니라 campaignNameKey()다 — 플랫폼마다 사람이 따로
// 이름을 지어서 구분자 공백이 흔들린다(schema.js의 함수 주석에 실제 사례).
// 표시는 그 그룹에서 처음 만난 원본 이름을 쓴다.
function buildPhaseTimeline(campaigns) {
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
      const byPlatform = {};
      group.forEach((c) => {
        byPlatform[c.platform] = { daily: c.budgetDaily ?? null, total: c.budgetPlanned };
      });
      const totalBudget = group.reduce((sum, c) => sum + c.budgetPlanned, 0);
      // 플랫폼별 일일 예산의 합 = 이 phase가 하루에 쓰는 돈. 막대 라벨이
      // 총액과 함께 이 값을 말한다 — "하루 얼마씩"과 "총 얼마"는 예산을
      // 판단할 때 서로 대체되지 않는 두 질문이다. 아무 플랫폼도 일일 예산을
      // 안 쓰면 null(있는 것만 말한다).
      const dailyValues = group.map((c) => c.budgetDaily).filter((v) => v != null);
      const totalDaily = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) : null;
      const days = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      return {
        key,
        name,
        startDate,
        endDate,
        days,
        byPlatform,
        totalBudget,
        totalDaily,
      };
    })
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0))
    // 램프는 정렬이 끝난 뒤에 매긴다 — 정렬 전 index로 주면 색이 시간 순과 어긋난다.
    .map((phase, index, all) => ({ ...phase, fillAlpha: phaseFillAlpha(index, all.length) }));
}

// Performance 탭에서 goal별로 캠페인을 묶어 각각 다른 컬럼의 표를 그린다 —
// goal에 따라 실제로 의미 있는 지표가 다른데(Awareness는 도달, Traffic은
// 클릭, Engagement는 참여, Conversion/Store Visit은 전환) 전부 한 표에
// CPM/CTR/CPC만 욱여넣으면 "진짜 그 목적에 맞는 데이터"가 안 보인다는
// 피드백으로 분리했다. schema.js의 getGoalMetricsRow()가 goal과 무관하게
// 원본 필드는 다 채우고, 여기서 goal별로 어떤 계산값 2개를 보여줄지만 고른다.
const GOAL_META = [
  { value: GOAL.AWARENESS, label: 'Awareness' },
  { value: GOAL.TRAFFIC, label: 'Traffic' },
  { value: GOAL.ENGAGEMENT, label: 'Engagement' },
  { value: GOAL.CONVERSION, label: 'Conversion' },
  { value: GOAL.STORE_VISIT, label: 'Store Visit' },
];

/**
 * 값 없음 표기. 모든 포매터가 이 하나를 쓰기 때문에, "이 컬럼이 통째로 비었나"를
 * 셀 출력값 비교만으로 판정할 수 있다(isColumnEmpty) — 컬럼마다 어떤 필드를
 * 보는지 따로 알 필요가 없다.
 */
const EMPTY_CELL = '—';

/**
 * 계획 예산 셀 표기. 0도 '—'로 취급한다 — 동기화로 들어온 캠페인은 계획
 * 예산이라는 개념 자체가 없어서 0으로 저장되는데, 그걸 "$0"으로 찍으면
 * "예산을 0으로 계획했다"로 읽힌다(실데이터 스크린샷 리뷰에서 Total Budget
 * 컬럼 전체가 $0으로 도배된 걸로 발견). 값이 없는 것과 0으로 계획한 것을
 * 화면에서 구분할 수 없으므로 없음 쪽으로 몰아준다.
 */
function fmtBudget(value) {
  if (!value) return EMPTY_CELL;
  return `$${value.toLocaleString('en-US')}`;
}

function fmtCurrency(value) {
  if (value == null) return EMPTY_CELL;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNumber(value) {
  if (value == null) return EMPTY_CELL;
  return value.toLocaleString('en-US');
}

function fmtPercent(value) {
  if (value == null) return EMPTY_CELL;
  return `${(value * 100).toFixed(2)}%`;
}

// goal별로 Campaign/Platform/Spend(공통) 다음에 붙는 2~3개 컬럼 — 그 목적에서
// 실제로 판단 근거가 되는 지표만 고른다(예: Engagement 목표 캠페인에 CTR/CPC를
// 보여줘봤자 "참여가 잘 됐는지"는 알 수 없다).
function goalExtraColumns(goalValue) {
  switch (goalValue) {
    case GOAL.AWARENESS:
      return [
        { header: 'Impressions', cell: (r) => fmtNumber(r.impressions) },
        { header: 'Reach', cell: (r) => fmtNumber(r.reach) },
        { header: 'CPM', cell: (r) => fmtCurrency(r.cpm) },
      ];
    case GOAL.TRAFFIC:
      return [
        { header: 'Clicks', cell: (r) => fmtNumber(r.clicks) },
        { header: 'CTR', cell: (r) => fmtPercent(r.ctr) },
        { header: 'CPC', cell: (r) => fmtCurrency(r.cpc) },
      ];
    case GOAL.ENGAGEMENT:
      return [
        { header: 'Engagements', cell: (r) => fmtNumber(r.engagements) },
        { header: 'Engagement Rate', cell: (r) => fmtPercent(r.engagementRate) },
      ];
    case GOAL.CONVERSION:
    case GOAL.STORE_VISIT:
      return [
        { header: 'Conversions', cell: (r) => fmtNumber(r.conversions) },
        { header: 'CPA', cell: (r) => fmtCurrency(r.cpa) },
      ];
    default:
      return [];
  }
}

function fmtSeconds(value) {
  if (value == null) return EMPTY_CELL;
  return `${value.toFixed(2)}s`;
}

// goal별 컬럼 뒤에 모든 표가 공통으로 붙이는 블록. 위 goalExtraColumns가 "이 목적에서
// 판단 근거가 되는가"로 고르는 것과 달리, 여기 지표는 목적이 아니라 소재가 어땠는지를
// 말한다 — 영상이 붙은 캠페인이면 목적과 무관하게 의미가 있어서 goal별로 나누지 않는다.
// 수기 입력 레코드에는 없는 값이라 '—'로 그려진다.
// Video(소재 시청)와 Engagement(소셜 반응)로 나눠 둔 것은 그룹 헤더 단위 —
// 15개 안팎 컬럼을 가로 스크롤로 훑는 중에 "지금 보는 게 어느 지표군인지"를
// 그룹 행이 알려준다.
// width는 라벨이 한 줄에 들어가는 최소치로 잡은 고정값이다 — 표마다 auto로
// 맞추면 goal 표끼리 같은 컬럼의 폭이 달라져서, 세로로 훑을 때 그룹 구분선이
// 섹션마다 지그재그로 밀린다(실화면 스크린샷 리뷰로 발견).
const CREATIVE_VIDEO_COLUMNS = [
  { header: 'Video Plays', width: 112, cell: (r) => fmtNumber(r.videoPlays) },
  // Hook Rate = 초반 시청 / 노출, Hold Rate = 완전 시청 / 초반 시청.
  // 계산 함수(calcHookRate/calcHoldRate)는 진작 있었는데 어느 화면에서도 안 쓰였다.
  // note는 헤더 title로 붙는다 — 기준이 플랫폼마다 다르다는 사실을 Drawer의
  // PlatformMetricList만 알려주고 이 표는 침묵하고 있었는데, VIDEO 그룹으로 묶은
  // 뒤로는 오히려 행 간 비교를 부추기는 배치가 됐다.
  {
    header: 'Hook Rate',
    width: 104,
    note: 'Platform-specific: TikTok counts a 2-second view, Meta counts 25% of the video.',
    cell: (r) => fmtPercent(r.hookRate),
  },
  {
    header: 'Hold Rate',
    width: 104,
    note: 'Share of hook views that watched to completion — based on the platform-specific hook definition.',
    cell: (r) => fmtPercent(r.holdRate),
  },
  { header: 'Held Views', width: 108, cell: (r) => fmtNumber(r.heldViews) },
  { header: 'Avg Watch', width: 108, cell: (r) => fmtSeconds(r.avgWatchSeconds) },
];

const CREATIVE_ENGAGEMENT_COLUMNS = [
  { header: 'Likes', width: 88, cell: (r) => fmtNumber(r.likes) },
  { header: 'Comments', width: 104, cell: (r) => fmtNumber(r.comments) },
  { header: 'Shares', width: 88, cell: (r) => fmtNumber(r.shares) },
  { header: 'Follows', width: 92, cell: (r) => fmtNumber(r.follows) },
  { header: 'Profile Visits', width: 120, cell: (r) => fmtNumber(r.profileVisits) },
];

/**
 * 컬럼 폭 체계. tableLayout:'fixed' + colgroup으로 강제한다.
 *
 * goalRegion은 개별 컬럼 폭이 아니라 **영역 합계**다 — Cost+Performance에
 * 들어가는 컬럼 수가 goal마다 다른데(Awareness/Traffic 4개, Engagement 3개),
 * 합계를 고정해 두면 그 뒤에 오는 Video·Engagement 그룹의 경계가 모든 goal
 * 표에서 같은 x에 온다. 개별 폭은 남은 컬럼 수로 나눠 계산한다.
 */
const COLUMN_WIDTH = {
  // 캠페인명은 이 표에서 행을 식별하는 유일한 값이다. 한때 280으로 조였다가
  // 되돌렸다 — 이 팀의 네이밍은 접두사가 길고 뒤쪽 날짜·접미사로 갈리는데
  // (BF4_ComingSoon_Teaser_0327_0401_MAPUPDATE vs ..._0325_0401) 꼬리가 잘리면
  // 서로 다른 두 행이 같은 이름으로 보인다. 표는 어차피 가로 스크롤을 전제로
  // 하고 그래서 이 열을 sticky로 고정해 둔 것이므로, 스크롤을 아끼자고 식별자를
  // 깎는 건 앞뒤가 안 맞는다.
  campaign: 360,
  platform: 96,
  goalRegion: 480,
};

/**
 * 이 표에서 전부 비어 있는 컬럼인지. Meta는 캠페인 레벨에 Follows/Profile
 * Visits가 없어서 Awareness 표에서 두 컬럼이 통째로 '—'로 남는데, 그룹 라벨을
 * 붙이고 나니 "ENGAGEMENT 그룹이 왜 죽어 있나"로 읽혔다(실화면 리뷰). Drawer의
 * PlatformMetricList가 이미 같은 규칙("값 없는 지표는 숨긴다 — 빈 줄만 늘어서면
 * '아직 안 왔다'인지 '원래 없다'인지 구분이 안 된다")을 쓰고 있어서 표에도 맞춘다.
 */
const isColumnEmpty = (column, rows) => rows.every((r) => column.cell(r) === EMPTY_CELL);

// Cost 그룹 구성용 — Spend(모든 goal 공통)와, goalExtraColumns 중 비용 지표
// (CPM/CPC/CPA)를 한 그룹으로 묶는다. 예전엔 비용 지표가 goal 지표들 뒤에
// 섞여 있었는데(예: Impressions·Reach 다음 CPM), "얼마 썼고 단가가 얼마인가"와
// "얼마나 잘 됐나"는 서로 다른 질문이라 그룹으로 가른다.
const SPEND_COLUMN = { header: 'Spend', cell: (r) => fmtCurrency(r.spend) };
const COST_METRIC_HEADERS = new Set(['CPM', 'CPC', 'CPA']);

// 그룹 헤더 행 — 눈썹 라벨 + 아주 옅은 배경 띠. 처음엔 배경 없이 라벨만 뒀는데,
// 그러면 부모(그룹 11px 회색)가 자식(컬럼 헤더 14px 세미볼드)보다 약해서 위계가
// 뒤집혀 보였다(실화면 리뷰). 띠는 그룹별로 다르게 칠하지 않고 행 전체에 하나만
// 깐다 — 그룹 구분은 이미 세로 divider가 하고 있어서 색까지 더하면 과하다.
// borderBottom을 지워 이 띠가 아래 컬럼 헤더 행에 그대로 얹힌 모자처럼 읽히게 한다.
// surface.sunken(#FAFAFA)으로 시작했는데 흰 배경과 2% 차이라 화면에서 띠가
// 있는지조차 분간이 안 됐다(실화면 리뷰) — 위계는 라벨 색이 혼자 감당하고 띠는
// 일을 안 하고 있었다. 한 단 올린다. 색이 아니라 명도만 쓰므로 여전히 조용하다.
const GROUP_ROW_BG = 'surface.muted';
/**
 * 그룹 행 높이. 라벨이 11px 한 줄뿐이라 기본 셀 패딩을 그대로 두면 컬럼 헤더
 * 행과 높이가 비슷해져 두 줄이 한 덩어리로 뭉친다 — box-sizing으로 패딩까지
 * 이 높이 안에 넣어 라벨 줄을 명확히 얇게 유지한다.
 */
const GROUP_ROW_HEIGHT = 28;

/**
 * 한 번에 보여줄 행 수.
 *
 * 실데이터의 Traffic 표는 124행이라 페이지가 끝없이 늘어나고, 조금만 내려가면
 * 헤더가 사라진 채 숫자만 읽게 됐다. 한때 표를 자기 높이를 가진 창(maxHeight)에
 * 가두고 헤더를 그 창 위쪽에 고정해서 풀려 했는데 실패했다 — 창 자체가 페이지
 * 스크롤을 타고 툴바 위로 올라가면서 헤더도 같이 시야 밖으로 나갔고, 스크롤만
 * 두 겹으로 중첩됐다(실화면 리뷰). 증상이 아니라 원인을 자른다: 표를 끊으면
 * 어떤 표도 한 화면을 크게 넘지 않아 헤더가 사라질 일이 없고 페이지 길이도
 * 정상으로 돌아온다(Carbon·Fiori가 대용량 테이블에 처방하는 것과 같다).
 *
 * 값이 25가 아니라 15인 이유: 25행 페이지는 이 화면에서 두 화면 높이라 아래
 * 절반을 여전히 헤더 없이 읽었다(실화면 리뷰). 그러면 COST/PERFORMANCE/VIDEO/
 * ENGAGEMENT 그룹 헤더를 붙인 값어치가 페이지마다 절반씩 사라진다. 15행이면
 * 헤더+행+페이저가 약 665px라 노트북 화면에서도 한 화면에 들어와, 모든 행을
 * 헤더와 함께 읽는다. 페이지가 9개로 늘어나는 비용은 작다 — 124행은 필터를
 * 아무것도 안 건 "전체 보기"고, 실제 작업은 Event·기간으로 좁힌 뒤 읽는 것이라
 * 대부분 한두 페이지로 끝난다(전체를 훑어야 하면 Export CSV가 더 빠르다).
 */
const ROWS_PER_PAGE = 15;
const GROUP_ROW_CELL_SX = {
  height: GROUP_ROW_HEIGHT,
  boxSizing: 'border-box',
  py: 0,
  borderBottom: 0,
  backgroundColor: GROUP_ROW_BG,
};
const GROUP_LABEL_SX = {
  ...GROUP_ROW_CELL_SX,
  color: 'text.primary',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  lineHeight: 1.4,
};

// 그룹 경계 — 배경색 차이 대신 얇은 좌측 divider 하나만 쓴다(flat 시스템에
// 면 배경까지 더하면 과함). 각 그룹의 첫 컬럼(헤더·바디 동일)에 붙인다.
const GROUP_DIVIDER_SX = { borderLeft: '1px solid', borderLeftColor: 'divider' };

// Campaign 열 고정 — 가로 스크롤 중 "이 행이 어느 캠페인인지"를 잃지 않게 한다.
// 15개 안팎 컬럼에서는 그룹 헤더보다 이게 먼저다. 배경을 불투명하게 깔아
// 스크롤된 셀이 밑으로 비치지 않게 하고, 우측 divider로 고정 경계를 명시한다.
const STICKY_CAMPAIGN_SX = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  backgroundColor: 'background.default',
  borderRight: '1px solid',
  borderRightColor: 'divider',
};


/**
 * Performance 탭에서 Event를 골랐을 때 쓸 수 있는 비교 지표.
 * 한 번에 하나만 그린다 — 축이 다른 두 지표를 한 그래프에 겹치면(이중 축)
 * 어느 막대가 어느 축인지 알 수 없고, 축 범위만 바꿔도 결론이 뒤집힌다.
 */
const PHASE_METRICS = [
  { key: 'spend', label: 'Spend', format: fmtCurrency },
  { key: 'impressions', label: 'Impressions', format: fmtNumber },
  { key: 'follows', label: 'Follows', format: fmtNumber },
  { key: 'hookRate', label: 'Hook Rate', format: fmtPercent },
];

/**
 * 같은 이름의 캠페인(= 한 phase)을 플랫폼 구분 없이 합쳐 지표를 낸다.
 * buildPhaseTimeline과 같은 묶음 기준을 써서 Plan 탭과 같은 순서·같은 단위로 읽힌다.
 *
 * hookRate는 캠페인별 비율을 평균 내지 않는다 — 노출이 100인 캠페인의 50%와
 * 노출이 100만인 캠페인의 1%를 평균 내면 25.5%라는 존재하지 않는 숫자가 나온다.
 * 분자(hookViews)와 분모(impressions)를 각각 합친 뒤 다시 나눈다.
 */
function buildPhasePerformance(campaigns, rowByCampaignId) {
  const byName = new Map();
  campaigns.forEach((c) => {
    const key = campaignNameKey(c.name);
    if (!byName.has(key)) byName.set(key, { key, name: c.name, startDate: c.startDate, rows: [] });
    const phase = byName.get(key);
    if (c.startDate < phase.startDate) phase.startDate = c.startDate;
    const row = rowByCampaignId.get(c.id);
    if (row) phase.rows.push(row);
  });

  const sum = (rows, key) => {
    const values = rows.map((r) => r[key]).filter((v) => v != null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) : null;
  };

  return [...byName.values()]
    .map((phase) => {
      const impressions = sum(phase.rows, 'impressions');
      const hookViews = sum(phase.rows, 'hookViews');
      return {
        key: phase.key,
        name: phase.name,
        startDate: phase.startDate,
        spend: sum(phase.rows, 'spend'),
        impressions,
        follows: sum(phase.rows, 'follows'),
        hookRate: impressions ? (hookViews ?? 0) / impressions : null,
      };
    })
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
}

function toCsvRow(values) {
  return values.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
}

function planToCsv(campaigns) {
  const header = ['Campaign', 'Platform', 'Start', 'End', 'Daily Budget', 'Total Budget'];
  const lines = campaigns.map((c) =>
    toCsvRow([c.name, c.platform, c.startDate, c.endDate, c.budgetDaily ?? '', c.budgetPlanned])
  );
  return [toCsvRow(header), ...lines].join('\n');
}

// Plan CSV와 달리 goal 컬럼도 같이 내보낸다 — CSV는 화면 표와 달리 goal별로
// 파일을 쪼갤 필요 없이 한 장에 다 담아도 빈 셀이 문제되지 않는다(스프레드시트는
// 화면 표처럼 "빈 컬럼이 많으면 어색해 보이는" 제약이 없다).
function performanceToCsv(rows) {
  const header = [
    'Campaign', 'Platform', 'Goal', 'Spend', 'Impressions', 'Reach', 'Clicks',
    'Engagements', 'Conversions', 'CPM', 'CTR', 'CPC', 'Engagement Rate', 'CPA',
    'Video Plays', 'Hook Rate', 'Hold Rate', 'Held Views', 'Avg Watch (s)',
    'Likes', 'Comments', 'Shares', 'Follows', 'Profile Visits',
  ];
  const lines = rows.map((r) =>
    toCsvRow([
      r.name, r.platform, r.goal, r.spend ?? '', r.impressions ?? '', r.reach ?? '', r.clicks ?? '',
      r.engagements ?? '', r.conversions ?? '',
      r.cpm != null ? r.cpm.toFixed(2) : '',
      r.ctr != null ? (r.ctr * 100).toFixed(2) : '',
      r.cpc != null ? r.cpc.toFixed(2) : '',
      r.engagementRate != null ? (r.engagementRate * 100).toFixed(2) : '',
      r.cpa != null ? r.cpa.toFixed(2) : '',
      r.videoPlays ?? '',
      r.hookRate != null ? (r.hookRate * 100).toFixed(2) : '',
      r.holdRate != null ? (r.holdRate * 100).toFixed(2) : '',
      r.heldViews ?? '',
      r.avgWatchSeconds != null ? r.avgWatchSeconds.toFixed(2) : '',
      r.likes ?? '', r.comments ?? '', r.shares ?? '',
      r.follows ?? '', r.profileVisits ?? '',
    ])
  );
  return [toCsvRow(header), ...lines].join('\n');
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * ReportSummarySection
 *
 * /reports 페이지를 구성하는 섹션. 정보 위계는 Dashboard와 같은 순서다 —
 * KPI 툴바(sticky) → 탭 → 필터 → 내용. 예전엔 필터 → KPI → 탭 순서라 같은
 * 앱의 두 화면이 정반대로 읽혔고, sticky가 없어 스크롤하면 KPI가 사라졌다
 * (스크린샷 리뷰로 발견). 툴바가 sticky로 붙으려면 스크롤 컨테이너(셸 main)
 * 기준 좌우 여백을 이 섹션이 직접 소유해야 해서, ReportsPage의 PageContainer
 * 래핑을 걷어내고 PAGE_GUTTER_X를 여기서 쓴다.
 *
 * Plan/Performance 두 탭으로 나눈 이유 — "캠페인 전에 보는 리포트"(계획:
 * 이름·기간·일일/총예산·플랫폼별 예산)와 "캠페인 후 리포트"(실적: goal별로
 * 실제 의미 있는 지표)는 답하는 질문 자체가 달라서 하나의 표에 욱여넣으면
 * 어느 쪽도 제대로 못 보여준다는 피드백.
 *
 * Store 필터는 한때 있었는데 뺐다 — 이 페이지의 핵심 질문은 "어떤 Event에
 * 어떤 캠페인이 있나"라서 Event가 1급 필터고, Event를 이미 골랐으면(대개
 * 이벤트=매장 하나에 귀속) Store로 또 좁힐 일이 실질적으로 없었다. 오히려
 * Event+Store를 동시에 걸면 서로 안 맞는 조합에서 왜 0건이 뜨는지 이유가
 * 안 보이는 함정만 있었다(실사용 피드백으로 발견 — Donald Norman 리뷰: Event
 * 선택 후에도 옆에 계속 떠 있는 미사용 Store 드롭다운이 "이거 지금 뭘 하는
 * 컨트롤이지"라는 의문을 줌).
 *
 * ## Plan 탭
 * Campaign/Period/Daily Budget/Total Budget 표 + Budget by Platform 비율 바.
 * 예전엔 Campaign Group(Event)을 선택해야만 나타나는 부가 섹션이었는데,
 * 독립된 탭이 된 지금은 Event 없이도(현재 필터에 걸린 캠페인 전체 기준으로)
 * 항상 보여준다 — Event는 다른 필터(Platform/기간)와 동급으로 선택적
 * narrowing 축일 뿐, 탭 자체가 있고 없고의 조건이 아니다. 비율 바는 새 차트
 * 라이브러리 없이 PacingIndicator가 이미 쓰는 LinearProgress 문법을 재사용
 * 한다 — 플랫폼이 Meta/TikTok 2개뿐이라 파이차트 같은 새 시각 문법이 필요할
 * 만큼 복잡하지 않다.
 *
 * ## Performance 탭
 * schema.js의 getGoalMetricsRow()로 만든 행을 campaign.goal별로 묶어서 각각
 * 다른 컬럼의 표로 보여준다 — Awareness는 Impressions/Reach/CPM(도달),
 * Traffic은 Clicks/CTR/CPC(클릭), Engagement는 Engagements/Engagement
 * Rate(참여), Conversion·Store Visit은 Conversions/CPA(전환)처럼 그 목적에서
 * 실제로 의미 있는 지표만 보여준다 — 예전엔 모든 캠페인에 CPM/CTR/CPC만
 * 고정으로 보여줬는데, goal이 Engagement인데 CTR/CPC만 보이면 "이 캠페인이
 * 잘 됐는지" 판단할 근거가 표에 없는 문제가 있었다.
 *
 * 각 goal 테이블은 2줄 헤더를 쓴다 — 그룹 행(Cost | {Goal} Performance |
 * Video | Engagement, 눈썹 라벨 + 그룹 경계 얇은 divider) 위에 기존 컬럼
 * 행이 붙는다. 15개 안팎 컬럼을 가로 스크롤로 훑는 중에 지표군의 위치를
 * 잃는 문제(엔터프라이즈 리뷰) 대응. 같은 이유로 Campaign 컬럼은 sticky
 * left 고정 — 스크롤 중 행 식별을 잃지 않는 게 그룹 헤더보다 먼저다.
 * 비용 지표(CPM/CPC/CPA)는 goal 지표 뒤에 섞여 있던 것을 Spend 옆 Cost
 * 그룹으로 모았다 — "얼마 썼나"와 "잘 됐나"는 다른 질문이다.
 *
 * 그룹 라벨을 붙이면서 두 가지가 따라왔다(실화면 스크린샷 리뷰):
 * - 값이 전혀 없는 컬럼은 표에서 뺀다(isColumnEmpty). Meta는 캠페인 레벨에
 *   Follows/Profile Visits가 없어 Awareness 표에서 두 컬럼이 통째로 비는데,
 *   라벨이 생기니 "이 그룹은 왜 죽어 있나"로 읽혔다. 그룹의 컬럼이 전부
 *   비면 그룹째 사라진다.
 * - 컬럼 폭을 콘텐츠가 아니라 상수(COLUMN_WIDTH + 컬럼별 width)로 고정한다.
 *   auto 폭이면 캠페인 이름 길이 같은 표별 사정으로 같은 컬럼도 폭이 달라져,
 *   goal 표를 세로로 훑을 때 그룹 구분선이 섹션마다 지그재그로 밀렸다.
 * - 성과 레코드가 없는 캠페인 행은 '—'를 반복하지 않고 한 칸으로 합쳐
 *   "No performance data yet"으로 말한다(missing_performance 알림의 대상과
 *   같은 캠페인들이다).
 * - 표는 ROWS_PER_PAGE로 끊는다(그 상수 주석 참고). 스크롤 영역은
 *   TableContainer가 아니라 ScrollArea다 — 기본 overflow는 넘쳤다는 신호를
 *   주지 않아서 마지막 컬럼이 통째로 안 보여도 표가 딱 맞게 끝난 것처럼 보였다.
 *
 * Planned Budget에 있던 accent(파란 강조) 색은 의도적으로 뺐다 — Dashboard의
 * KpiBar는 색상을 오직 긴급 알림(isAlert)에만 쓰고 있어서, 예산 숫자에도
 * 색을 넣으면 같은 컴포넌트 안에서 색상이 두 가지 다른 의미(경고 vs 강조)를
 * 갖게 된다.
 *
 * 필터 상태는 이 섹션이 직접 소유하되, Dashboard와 같은 lastView 규칙으로
 * localStorage에 기억한다 — 예전엔 세션 useState뿐이라 행 클릭 →
 * /dashboard?campaign= 이동 → 뒤로가기에서 Event/기간/탭이 전부 초기화됐다.
 * 이 화면의 핵심 플로우("Event를 골라 캠페인들을 훑고 하나씩 열어본다")에서
 * 두 번째 캠페인부터는 필터를 처음부터 다시 거는 반복 노동이었고, 같은 앱의
 * 두 화면이 서로 다른 기억 규칙을 갖는 비대칭이기도 했다.
 *
 * 표 행을 클릭하면 /dashboard?campaign={id}로 이동한다. DashboardPage가
 * 마운트 시 이 쿼리 파라미터를 한 번만 읽어 해당 캠페인 Drawer를 자동으로
 * 연다 — 필터 상태 전체를 두 페이지가 공유하는 것은 아니고, 캠페인 진입점만
 * 딥링크로 연결한다.
 *
 * Props:
 * @param {Campaign[]} campaigns - 캠페인 목록 [Required]
 * @param {PerformanceRecord[]} performanceRecords - 성과 레코드 목록 [Required]
 * @param {boolean} isLoading - 데이터 로드 중 여부. true면 표 대신 스켈레톤 [Optional, 기본값: false]
 * @param {string|null} error - 백엔드 오류 메시지. 있으면 상단에 오류 배너 [Optional, 기본값: null]
 * @param {function} onRetry - 오류 배너의 Retry 클릭 시 실행할 함수 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <ReportSummarySection campaigns={campaigns} performanceRecords={performanceRecords} />
 */
export function ReportSummarySection({ campaigns, performanceRecords, isLoading = false, error = null, onRetry, sx }) {
  const navigate = useNavigate();
  const theme = useTheme();
  /* 기본 탭은 Performance다. 이 화면 이름이 Reports이고, 보고서에 오는 사람의
     첫 질문은 "얼마나 잘 됐나"다 — Plan(예산·타임라인)은 기획 단계에서 보는
     산출물이라 빈도가 낮고, "지금 뭐가 돌고 뭐가 예정인가"는 Dashboard가 이미
     답한다. 탭 순서도 같이 뒤집었다: 순서는 Plan-먼저인데 마지막 탭 기억 때문에
     화면은 Performance로 열려서 "내가 왜 여기 있지"가 됐다(실사용 피드백).
     보이는 순서와 열리는 탭이 어긋나면 기억 기능이 오히려 혼란을 만든다. */
  const [reportTab, setReportTab] = useState(() => loadLastReportView()?.reportTab ?? 'performance');
  const [groupValues, setGroupValues] = useState(() => loadLastReportView()?.groupValues ?? { platform: '', campaignGroup: '' });
  const [dateRange, setDateRange] = useState(() => loadLastReportView()?.dateRange ?? { start: '', end: '' });
  const [phaseMetric, setPhaseMetric] = useState('spend');
  /* goal별 현재 페이지. 표가 goal마다 하나씩 렌더되는데 훅은 map 콜백 안에서
     못 부르므로, 표마다 상태를 따로 두는 대신 goal을 키로 한 객체 하나로 모은다. */
  const [pageByGoal, setPageByGoal] = useState({});

  // 탭/필터가 바뀔 때마다 저장 — Dashboard의 VIEW_STORAGE_KEY와 같은 규칙.
  useEffect(() => {
    try {
      window.localStorage.setItem(REPORT_VIEW_STORAGE_KEY, JSON.stringify({ reportTab, groupValues, dateRange }));
    } catch {
      // localStorage 사용 불가 — 조용히 무시, 세션 내 상태는 계속 동작
    }
  }, [reportTab, groupValues, dateRange]);

  /* FilterBar의 Campaign Group 드롭다운 옵션 — Dashboard와 동일 규칙(명시적으로
     태그한 campaignGroup은 1개여도 옵션, 이름만 우연히 겹치는 경우만 2개 이상). */
  const explicitGroups = new Set(campaigns.filter((c) => c.campaignGroup).map((c) => c.campaignGroup));
  const nameCounts = campaigns.reduce((counts, c) => {
    const key = campaignGroupKey(c);
    return { ...counts, [key]: (counts[key] ?? 0) + 1 };
  }, {});
  const campaignGroupOptions = Object.keys(nameCounts)
    .filter((key) => explicitGroups.has(key) || nameCounts[key] > 1)
    .map((key) => ({ value: key, label: key }));

  /* 저장된 Event 값이 지금 데이터에 없으면 필터를 걸지 않는다. 탭·필터를
     localStorage에 기억하기 시작하면서 생긴 함정이다 — 그 이벤트의 캠페인이
     삭제되거나 이름이 바뀌면 옵션 목록에서 사라지는데, 저장된 값은 그대로 남아
     "아무것도 안 걸린 것처럼 보이는데 결과는 0건"이 된다. 옵션이 하나도 없어
     드롭다운 자체가 렌더되지 않는 경우엔 해제할 UI조차 없어서, 새로고침해도
     복원되는 영구 빈 화면이 된다. */
  const activeCampaignGroup = campaignGroupOptions.some((o) => o.value === groupValues.campaignGroup)
    ? groupValues.campaignGroup
    : '';

  const filteredCampaigns = campaigns.filter((c) => {
    if (groupValues.platform && c.platform !== groupValues.platform) return false;
    if (activeCampaignGroup && campaignGroupKey(c) !== activeCampaignGroup) return false;
    if (!campaignInDateRange(c, dateRange)) return false;
    return true;
  });

  const summary = useMemo(
    () => getReportSummary(filteredCampaigns, performanceRecords.filter((r) => filteredCampaigns.some((c) => c.id === r.campaignId))),
    [filteredCampaigns, performanceRecords]
  );

  const goalRows = useMemo(
    () => filteredCampaigns.map((c) => getGoalMetricsRow(c, performanceRecords.find((r) => r.campaignId === c.id))),
    [filteredCampaigns, performanceRecords]
  );

  // Plan 탭이 Event를 골랐을 때만 타임라인을 그리는 것과 같은 조건이다 —
  // 여러 Event가 섞인 상태에서 phase 막대를 그리면 서로 무관한 캠페인이 한 축에 놓인다.
  // 막대 라벨이 phase 키로 지표를 찾으므로 Map으로 만들어 둔다. 키는 표시 이름이
  // 아니라 campaignNameKey() — 두 빌더가 같은 정규화를 쓰므로 항상 짝이 맞는다.
  const performanceByPhaseKey = useMemo(() => {
    if (!activeCampaignGroup) return new Map();
    const rowByCampaignId = new Map(goalRows.map((r) => [r.campaignId, r]));
    return new Map(buildPhasePerformance(filteredCampaigns, rowByCampaignId).map((p) => [p.key, p]));
  }, [activeCampaignGroup, filteredCampaigns, goalRows]);

  // Plan 탭 — 지금 필터에 걸린 캠페인 전체 기준(Event 선택 여부와 무관).
  const planCampaigns = filteredCampaigns;
  const planBudgetByPlatform = planCampaigns.reduce((acc, c) => {
    acc[c.platform] = (acc[c.platform] ?? 0) + c.budgetPlanned;
    return acc;
  }, {});
  const planTotalBudget = planCampaigns.reduce((sum, c) => sum + c.budgetPlanned, 0);

  /* Event를 선택했을 때만 타임라인을 그린다 — 여러 Event가 섞인 상태에서 phase
     막대를 그리면 서로 무관한 캠페인들이 같은 축에 놓여 의미가 없다. Event 없이
     볼 때 Plan은 기존 단순 표(Campaign/Period/Daily/Total)+플랫폼 비율 바를 쓰고,
     Performance는 goal별 표만 보여준다.
     이 값은 **두 탭이 공유한다** — 같은 Event를 골랐으면 어느 탭에서든 같은
     타임라인이 나와야 한다(PhaseTimelineChart 주석 참고). */
  // 타임라인 축·마일스톤 계산은 PhaseTimelineChart가 스스로 한다 — 두 탭이 같은
  // 차트를 쓰므로 계산도 컴포넌트 안에 두는 편이 두 벌로 갈라지지 않는다.
  const phases = activeCampaignGroup ? buildPhaseTimeline(planCampaigns) : [];

  const phaseMetaTotal = phases.reduce((sum, p) => sum + (p.byPlatform[PLATFORM.META]?.total ?? 0), 0);
  const phaseTikTokTotal = phases.reduce((sum, p) => sum + (p.byPlatform[PLATFORM.TIKTOK]?.total ?? 0), 0);
  const phaseGrandTotal = phases.reduce((sum, p) => sum + p.totalBudget, 0);

  return (
    <Box sx={sx}>
      {/* 페이지 툴바 — DashboardPage 툴바와 같은 문법(sticky top:0 · py:2.5 ·
          borderBottom · PAGE_GUTTER_X). KPI는 좌측, 액션(Export CSV)은 우측 —
          Dashboard의 KPI/New Campaign 배치와 같은 역할 분담이다. Export를
          툴바로 올린 이유: 탭 콘텐츠 안에 있으면 스크롤로 사라지는데, 이
          버튼은 "지금 보고 있는 탭 전체"에 대한 액션이라 탭 어디서든 닿아야
          한다. */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: PAGE_GUTTER_X,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.default',
        }}
      >
        <KpiBar
          items={
            reportTab === 'plan'
              ? [
                  { label: 'Campaigns', value: summary.totalCampaigns },
                  { label: 'Planned Budget', value: `$${summary.totalBudgetPlanned.toLocaleString('en-US')}` },
                ]
              : [
                  { label: 'Campaigns', value: summary.totalCampaigns },
                  { label: 'Total Spend', value: `$${summary.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                  { label: 'Avg. CPM', value: summary.avgCPM != null ? `$${summary.avgCPM.toFixed(2)}` : EMPTY_CELL, sub: 'across reported campaigns' },
                ]
          }
          sx={{ minWidth: 0, flex: '1 1 auto' }}
        />
        <Button
          size="small"
          variant="outlined"
          sx={{ flexShrink: 0 }}
          disabled={reportTab === 'plan' ? planCampaigns.length === 0 : goalRows.length === 0}
          onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            if (reportTab === 'plan') {
              downloadCsv(planToCsv(planCampaigns), `paid-ads-plan-${today}.csv`);
            } else {
              downloadCsv(performanceToCsv(goalRows), `paid-ads-performance-${today}.csv`);
            }
          }}
        >
          Export CSV
        </Button>
      </Box>

      <Box sx={{ px: PAGE_GUTTER_X, py: 3 }}>
      <Tabs
        value={reportTab}
        onChange={(e, next) => setReportTab(next)}
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Performance" value="performance" sx={{ textTransform: 'none' }} />
        <Tab label="Plan" value="plan" sx={{ textTransform: 'none' }} />
      </Tabs>

      <FilterBar
        showSearch={false}
        searchValue=""
        onSearchChange={() => {}}
        filterGroups={[
          /* Event가 맨 앞 — 이 페이지 스스로 "Event가 1급 필터"라며 Store를
             뺐는데(위 컴포넌트 주석), 정작 순서는 Platform이 먼저라 위계
             선언과 화면이 어긋나 있었다. Dashboard와 같은 순서로 맞춘다. */
          ...(campaignGroupOptions.length > 0
            ? [{ key: 'campaignGroup', label: 'Event', options: campaignGroupOptions }]
            : []),
          {
            key: 'platform',
            label: 'Platform',
            variant: 'segmented',
            options: [
              { value: PLATFORM.META, label: 'Meta' },
              { value: PLATFORM.TIKTOK, label: 'TikTok' },
            ],
          },
        ]}
        groupValues={groupValues}
        // 필터가 바뀌면 페이지를 1로 되돌린다 — 안 되돌리면 7페이지를 보던 중
        // 필터를 바꿨을 때 완전히 다른 결과 집합의 7페이지(91번째 행)부터 표가
        // 열려서, 상단 개수와 표 내용이 어긋난 것처럼 보인다. 클램프만으로는
        // 부족하다: 좁혔다 다시 넓히면 손대지도 않은 옛 페이지로 되돌아간다.
        onGroupChange={(key, value) => {
          setPageByGoal({});
          setGroupValues((v) => ({ ...v, [key]: value }));
        }}
        dateRange={dateRange}
        onDateRangeChange={(next) => {
          setPageByGoal({});
          setDateRange(next);
        }}
        sx={{ mb: 3 }}
      />

      {/* Dashboard와 같은 규칙 — 백엔드 오류는 배너로 드러내고, 로딩과
          "결과 없음"을 구분한다(로드 전 빈 배열이 "No campaigns match"로
          위장되지 않게). */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )}
        >
          Something went wrong talking to the backend — data shown may be incomplete or stale. ({error})
        </Alert>
      )}

      {isLoading && (
        <Box aria-label="Loading report" role="status">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={40} sx={{ mb: 1 }} />
          ))}
        </Box>
      )}

      {!isLoading && (reportTab === 'plan' ? (
        planCampaigns.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
            No campaigns match the current filters.
          </Typography>
        ) : phases.length > 0 ? (
          <Box>
            {/* Event 타임라인 — Plan·Performance 두 탭이 같은 컴포넌트를 쓴다
                (PhaseTimelineChart 주석 참고). 막대에는 기간과 함께 일일 예산·
                총 예산이 붙는다. */}
            <PhaseTimelineChart phases={phases} sx={{ mb: 4 }} />

            {/* Budget Breakdown — phase 하나당 한 행(플랫폼별로 안 쪼갬). 각
                phase가 어느 캠페인 하나에 대응하지 않고 여러 캠페인(플랫폼별)을
                합친 값이라, 위 Plan 표와 달리 행 클릭으로 캠페인 Drawer에 못
                보낸다(어느 캠페인을 열지 애매함) — 그래서 클릭 불가로 둔다. */}
            <Typography variant="subtitle1" sx={SECTION_TITLE_SX}>
              Budget Breakdown{' '}
              <Typography component="span" variant="body2" sx={SECTION_SCOPE_SX}>
                — {phases.length} {phases.length === 1 ? 'phase' : 'phases'} · ${planTotalBudget.toLocaleString('en-US')} planned
              </Typography>
            </Typography>
            <TableContainer sx={{ mb: 2, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Campaign</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Run Dates</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Days</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Meta Daily</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Meta Budget</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>TikTok Daily</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>TikTok Budget</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {phases.map((p) => (
                    <TableRow key={p.key}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* 위 Gantt 막대와 같은 램프를 쓴다 — 표의 점과 막대가 다른 색이면
                              같은 phase인지 눈으로 이어지지 않는다. 점은 작아서 채움만으로는
                              흐릿하므로 막대와 동일하게 primary.main 테두리를 함께 준다. */}
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: alpha(theme.palette.primary.main, p.fillAlpha),
                              border: '1px solid',
                              borderColor: 'primary.main',
                              flexShrink: 0,
                            }}
                          />
                          {p.name}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {shortDate(p.startDate)}–{shortDate(p.endDate)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{p.days}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtBudget(p.byPlatform[PLATFORM.META]?.daily)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtBudget(p.byPlatform[PLATFORM.META]?.total)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtBudget(p.byPlatform[PLATFORM.TIKTOK]?.daily)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtBudget(p.byPlatform[PLATFORM.TIKTOK]?.total)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {fmtBudget(p.totalBudget)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell />
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${phaseMetaTotal.toLocaleString('en-US')}</TableCell>
                    <TableCell />
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${phaseTikTokTotal.toLocaleString('en-US')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${phaseGrandTotal.toLocaleString('en-US')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box>
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Campaign</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Daily Budget</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Total Budget</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {planCampaigns.map((c) => (
                    <TableRow key={c.id} hover onClick={() => navigate(`/dashboard?campaign=${c.id}`)} sx={{ cursor: 'pointer' }}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{c.name}</TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {shortDate(c.startDate)}–{shortDate(c.endDate)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {c.budgetDaily != null ? `$${c.budgetDaily.toLocaleString('en-US')}/day` : EMPTY_CELL}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtBudget(c.budgetPlanned)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 플랫폼별 예산 비율 — 플랫폼이 Meta/TikTok 2개뿐이라 새 차트
                문법(파이차트 등) 대신 PacingIndicator와 같은 가로 막대 문법을
                재사용한다. 단계(phase)마다 기간이 다를 수 있어 "총 일일예산"처럼
                하나로 합친 숫자는 착시가 생길 수 있다(안 겹치는 기간의 일일예산을
                그냥 더하면 실제보다 커 보임) — 그래서 여기선 총예산(기간과 무관하게
                단순 합산해도 되는 값)만 비율로 보여주고, 일일예산은 위 표에서
                캠페인별로만 보여준다. */}
            {/* Budget Breakdown 아래 붙는 부속 블록이라 제목이 아니라 눈썹 라벨 */}
            <Typography variant="overline" sx={{ display: 'block', mb: 1, color: 'text.secondary', letterSpacing: '0.08em' }}>
              Budget by Platform
            </Typography>
            {Object.entries(PLATFORM).map(([, platformValue]) => {
              const amount = planBudgetByPlatform[platformValue];
              if (!amount) return null;
              const ratio = planTotalBudget > 0 ? amount / planTotalBudget : 0;
              return (
                <Box key={platformValue} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography variant="body2" color="text.secondary">{PLATFORM_LABEL[platformValue] ?? platformValue}</Typography>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      ${amount.toLocaleString('en-US')} ({Math.round(ratio * 100)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={ratio * 100}
                    sx={{
                      height: 6,
                      // PacingIndicator 막대와 동일 — 6px 높이의 절반(inlay 3px) 풀 필
                      borderRadius: (theme) => `${theme.shape.radius.inlay}px`,
                      backgroundColor: 'surface.muted',
                      // 위 phase 막대와 같은 이유로 primary.light (기본은 primary.main)
                      '& .MuiLinearProgress-bar': { backgroundColor: 'primary.light' },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        )
      ) : goalRows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          No campaigns match the current filters.
        </Typography>
      ) : (
        <>
          {/* Event 타임라인 — Plan 탭과 **같은 차트**다(PhaseTimelineChart).
              예전엔 여기만 별도의 "지표별 비교 막대"(이름 | 막대 | 값)를 그려서,
              같은 Event를 골라도 탭을 옮기면 완전히 다른 그림이 나왔다(실사용
              피드백). 시간 축 하나로 통일하고, 이 탭에서만 필요한 성과 지표는
              막대 라벨 뒤에 덧붙인다 — 막대 길이는 양쪽 다 "기간"을 뜻하므로
              탭을 오갈 때 읽는 규칙이 바뀌지 않는다. */}
          {phases.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ ...SECTION_TITLE_SX, mb: 0 }}>
                  Event timeline{' '}
                  <Typography component="span" variant="body2" sx={SECTION_SCOPE_SX}>
                    — {phases.length} {phases.length === 1 ? 'phase' : 'phases'} ·{' '}
                    {PHASE_METRICS.find((m) => m.key === phaseMetric)?.label} on each bar
                  </Typography>
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={phaseMetric}
                  onChange={(_, next) => { if (next) setPhaseMetric(next); }}
                  aria-label="Metric to show on each bar"
                >
                  {PHASE_METRICS.map((m) => (
                    <ToggleButton key={m.key} value={m.key} sx={{ textTransform: 'none', px: 1.5 }}>
                      {m.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <PhaseTimelineChart
                phases={phases}
                barSuffix={(phase) => {
                  const metric = PHASE_METRICS.find((m) => m.key === phaseMetric) ?? PHASE_METRICS[0];
                  const value = performanceByPhaseKey.get(phase.key)?.[metric.key];
                  // 기록이 없으면 지표를 아예 안 붙인다 — '—'를 붙이면 예산 뒤에
                  // 의미 없는 기호가 매달려 라벨만 길어진다.
                  return value != null ? `${metric.label} ${metric.format(value)}` : null;
                }}
              />
            </Box>
          )}

        {GOAL_META.map(({ value, label }) => {
          const rowsForGoal = goalRows.filter((r) => r.goal === value);
          if (rowsForGoal.length === 0) return null;
          /* 컬럼을 그룹으로 재편 — 식별(Campaign·Platform, 라벨 없음) | Cost
             (Spend+단가) | {Goal} Performance(그 goal의 성과 지표) | Video |
             Engagement. goal 분할 테이블(goal마다 의미 있는 지표만)은 그대로
             유지하고, 각 테이블 안에서만 그룹 헤더를 얹는다 — 단일 와이드
             테이블로 합치면 goal과 무관한 빈 셀이 대량으로 돌아온다(이 표가
             goal별로 쪼개진 원래 이유). 성과 그룹 라벨은 그냥 "Performance"다 —
             한때 `${label} Performance`였는데 바로 위 섹션 제목이 이미 goal
             이름이라 같은 단어를 두 번 읽히고("Awareness — 9 campaigns" 아래
             "AWARENESS PERFORMANCE"), Engagement goal에서는 소재 그룹
             "Engagement"와도 헷갈렸다. */
          const keep = (columns) => columns.filter((c) => !isColumnEmpty(c, rowsForGoal));
          const goalCols = goalExtraColumns(value);
          const costCols = keep([SPEND_COLUMN, ...goalCols.filter((c) => COST_METRIC_HEADERS.has(c.header))]);
          const perfCols = keep(goalCols.filter((c) => !COST_METRIC_HEADERS.has(c.header)));
          // 영역 합계(goalRegion)를 남은 컬럼 수로 나눠 개별 폭을 만든다 — 컬럼이
          // 몇 개든 영역 총폭이 같아서 뒤따르는 그룹 경계가 표끼리 어긋나지 않는다.
          const goalColWidth = COLUMN_WIDTH.goalRegion / Math.max(costCols.length + perfCols.length, 1);
          const sized = (columns) => columns.map((c) => ({ ...c, width: goalColWidth }));
          const columnGroups = [
            { key: 'cost', label: 'Cost', columns: sized(costCols) },
            { key: 'perf', label: 'Performance', columns: sized(perfCols) },
            { key: 'video', label: 'Video', columns: keep(CREATIVE_VIDEO_COLUMNS) },
            { key: 'social', label: 'Engagement', columns: keep(CREATIVE_ENGAGEMENT_COLUMNS) },
          ].filter((g) => g.columns.length > 0);
          const dataColumns = columnGroups.flatMap((g) => g.columns.map((col, colIndex) => ({ ...col, group: g.key, isGroupStart: colIndex === 0 })));
          /* 컬럼 폭의 합. 표는 width:100%로 늘리되 colgroup 마지막에 폭을 지정하지
             않은 여백 열을 하나 두어, 남는 폭을 그 열이 전부 흡수하게 한다 —
             table-layout:fixed에서 폭 미지정 열이 잔여 공간을 가져가는 규칙이다.
             지정 열들은 어느 표에서든 정확히 같은 폭을 유지하므로 그룹 경계 정렬이
             깨지지 않고, 동시에 컬럼 수가 다른 표들도 오른쪽 끝선을 공유한다
             (여백 열이 없을 때는 컬럼이 적은 Awareness 표만 짧게 끝나서 페이지가
             미완성처럼 보였다 — 실화면 리뷰). minWidth로 이 합을 걸어두면 창이
             좁아질 때 여백 열이 0이 되고 그 뒤부터 가로 스크롤이 걸린다. */
          const tableWidth = COLUMN_WIDTH.campaign + COLUMN_WIDTH.platform + dataColumns.reduce((sum, c) => sum + c.width, 0);
          // 성과 레코드가 아예 없는 캠페인 — 전 컬럼이 '—'로 채워진 행이 된다.
          const isRowEmpty = (r) => dataColumns.every((col) => col.cell(r) === EMPTY_CELL);
          /* 플랫폼별 정의가 다른 지표(Hook/Hold Rate)가 이 표에 있고, 실제로 두
             플랫폼이 섞여 있을 때만 경고를 단다 — 한 플랫폼만 있는 표에서는
             비교 위험이 없어서 각주가 소음이다. 정의 자체는 헤더 title로 항상
             닿는다(col.note). */
          const hasPlatformSpecificMetric = dataColumns.some((col) => col.note);
          const isMixedPlatform = new Set(rowsForGoal.map((r) => r.platform)).size > 1;
          /* 컬럼 구성(빈 컬럼 제거)은 페이지가 아니라 표 전체를 기준으로 판단한다 —
             페이지를 넘길 때마다 컬럼이 생겼다 없어지면 표가 아니라 다른 표가 된다.
             자르는 건 화면에 그릴 행뿐이다. */
          const pageCount = Math.max(1, Math.ceil(rowsForGoal.length / ROWS_PER_PAGE));
          // 필터가 좁혀져 페이지 수가 줄면 현재 페이지가 범위를 벗어날 수 있다.
          const page = Math.min(pageByGoal[value] ?? 0, pageCount - 1);
          const visibleRows = rowsForGoal.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
          return (
            <Box key={value} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={SECTION_TITLE_SX}>
                {label}{' '}
                <Typography component="span" variant="body2" sx={SECTION_SCOPE_SX}>
                  — {rowsForGoal.length} {rowsForGoal.length === 1 ? 'campaign' : 'campaigns'}
                </Typography>
              </Typography>
              {/* TableContainer 대신 ScrollArea — 기본 overflow는 넘쳤다는 신호를
                  전혀 주지 않아서, 마지막 컬럼이 통째로 안 보이는데도 표가 딱 맞게
                  끝난 것처럼 보였다(실화면 리뷰). 좌측 그림자는 고정 열 오른쪽
                  경계에 붙어야 "여기서부터 움직인다"로 읽히므로 Campaign 폭을 넘긴다. */}
              <ScrollArea label={`${label} performance table`} startOffset={COLUMN_WIDTH.campaign}>
                {/* tableLayout:'fixed' + colgroup — 폭을 콘텐츠가 아니라 위 상수가
                    정한다. 콘텐츠 기반(auto)이면 캠페인 이름 길이 같은 표별 사정에
                    따라 같은 컬럼도 폭이 달라져, goal 표를 세로로 훑을 때 그룹
                    구분선이 섹션마다 밀린다. */}
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: tableWidth }}>
                  <colgroup>
                    <col style={{ width: COLUMN_WIDTH.campaign }} />
                    <col style={{ width: COLUMN_WIDTH.platform }} />
                    {dataColumns.map((col) => (
                      <col key={`${col.group}-${col.header}`} style={{ width: col.width }} />
                    ))}
                    {/* 폭 미지정 = 잔여 공간 흡수용 여백 열 (위 tableWidth 주석 참고) */}
                    <col />
                  </colgroup>
                  <TableHead>
                    {/* 그룹 행 — 식별 컬럼 2개는 라벨 없이 빈 스팬(컬럼 1개짜리
                        "Campaign Info" 그룹 라벨은 위계가 아니라 장식이다).
                        Campaign 자리는 바디와 같은 sticky를 유지해야 스크롤된
                        그룹 라벨이 밑으로 비쳐 보이지 않는다 — 다만 배경은 이 행의
                        띠 색으로 덮어써야 띠 중간에 흰 구멍이 뚫리지 않는다. */}
                    <TableRow>
                      <TableCell sx={{ ...STICKY_CAMPAIGN_SX, ...GROUP_ROW_CELL_SX }} />
                      <TableCell sx={GROUP_ROW_CELL_SX} />
                      {columnGroups.map((g) => (
                        <TableCell key={g.key} colSpan={g.columns.length} sx={{ ...GROUP_LABEL_SX, ...GROUP_DIVIDER_SX }}>
                          {g.label}
                        </TableCell>
                      ))}
                      <TableCell sx={GROUP_ROW_CELL_SX} />
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, ...STICKY_CAMPAIGN_SX }}>Campaign</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Platform</TableCell>
                      {dataColumns.map((col) => (
                        <TableCell
                          key={`${col.group}-${col.header}`}
                          align="right"
                          title={col.note}
                          sx={{ fontWeight: 600, verticalAlign: 'bottom', ...(col.isGroupStart ? GROUP_DIVIDER_SX : null) }}
                        >
                          {col.header}
                        </TableCell>
                      ))}
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleRows.map((r) => (
                      <TableRow key={r.campaignId} hover onClick={() => navigate(`/dashboard?campaign=${r.campaignId}`)} sx={{ cursor: 'pointer' }}>
                        {/* 폭이 고정이라 아주 긴 캠페인명은 잘린다 — 전체 이름은 title로 남긴다 */}
                        <TableCell
                          title={r.name}
                          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...STICKY_CAMPAIGN_SX }}
                        >
                          {r.name}
                        </TableCell>
                        {/* 원본 값('tiktok')에 capitalize를 걸면 'Tiktok'이 돼서 같은
                            화면의 필터 버튼('TikTok')과 표기가 어긋난다 — 브랜드
                            표기는 PLATFORM_LABEL 한 곳에서만 정한다. */}
                        <TableCell>{PLATFORM_LABEL[r.platform] ?? r.platform}</TableCell>
                        {/* 성과가 하나도 없는 캠페인은 '—'를 열 몇 개씩 반복하는 대신
                            한 칸으로 합쳐 한 문장으로 말한다 — 반복되는 무의미한 기호는
                            읽는 사람이 매번 "빈 건가 0인가"를 확인하게 만든다. 이 행들이
                            곧 missing_performance 알림의 대상이라, 표에서도 그 사실이
                            보이는 게 맞다. */}
                        {isRowEmpty(r) ? (
                          <TableCell
                            colSpan={dataColumns.length + 1}
                            sx={{ color: 'text.secondary', ...GROUP_DIVIDER_SX }}
                          >
                            No performance data yet
                          </TableCell>
                        ) : (
                          <>
                            {dataColumns.map((col) => (
                              <TableCell
                                key={`${col.group}-${col.header}`}
                                align="right"
                                sx={{ fontVariantNumeric: 'tabular-nums', ...(col.isGroupStart ? GROUP_DIVIDER_SX : null) }}
                              >
                                {col.cell(r)}
                              </TableCell>
                            ))}
                            <TableCell />
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {/* 페이지가 하나뿐이면 컨트롤 자체를 그리지 않는다 — 넘길 곳이 없는
                  페이저는 정보가 아니라 장식이다. rowsPerPageOptions를 비우면
                  "행 수 선택" 셀렉트가 사라지고 "1–25 of 124"와 이동 버튼만 남는다. */}
              {pageCount > 1 && (
                <TablePagination
                  component="div"
                  count={rowsForGoal.length}
                  page={page}
                  onPageChange={(e, nextPage) => setPageByGoal((prev) => ({ ...prev, [value]: nextPage }))}
                  rowsPerPage={ROWS_PER_PAGE}
                  rowsPerPageOptions={[]}
                  sx={{ borderBottom: 'none' }}
                />
              )}
              {hasPlatformSpecificMetric && isMixedPlatform && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  This table mixes Meta and TikTok. Hook Rate and Hold Rate use platform-specific
                  definitions (TikTok counts a 2-second view, Meta counts 25% of the video) — compare
                  them within a platform, not across.
                </Typography>
              )}
            </Box>
          );
        })}
        </>
      ))}
      </Box>
    </Box>
  );
}
