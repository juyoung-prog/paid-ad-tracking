import { useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { ScrollArea } from '../../components/container/ScrollArea';
import { FilterBar } from '../../components/templates/FilterBar';
import { PhaseTimelineChart } from './PhaseTimelineChart';
import { PlanForm } from '../../components/templates/PlanForm';
import { KpiBar } from '../../components/data-display/KpiBar';
import { getReportSummary, getGoalMetricsRow, campaignGroupKey, campaignNameKey, effectiveBudgetPlanned, planVsActual, planItemTotal, PLATFORM, GOAL } from '../../data/schema';
import { campaignInDateRange, shortDate, PAGE_GUTTER_X } from './paidAdsPageUtils';
import { money, moneyWhole, count, percent, seconds } from '../../utils/format';
import { BackendErrorBanner } from '../../components/data-display/BackendErrorBanner';
import { useViewUrlSync } from './useViewUrlSync';

const PLATFORM_LABEL = {
  [PLATFORM.META]: 'Meta',
  [PLATFORM.TIKTOK]: 'TikTok',
};

// Dashboard의 VIEW_STORAGE_KEY와 같은 규칙, 키만 화면별로 분리 — 두 화면의
// 마지막 뷰가 서로를 덮어쓰면 안 된다.
// v2 — Dashboard와 같은 이유로 저장 형태가 평평한 맵으로 바뀌었다.
const REPORT_VIEW_STORAGE_KEY = 'paidAdsReports:lastView:v2';

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
 * 제목은 문장형 볼드, 부속/분류 라벨만 대문자(label 토큰).
 *
 * 크기는 subtitle1(16/500)에서 title 토큰(18/600)으로 올렸다 — subtitle1은
 * body1(16/400)과 **크기가 같고 굵기만 100 차이**라 제목으로 스캔되지 않았다
 * (실화면 리뷰). 굵기가 아니라 크기로 제목임을 말한다.
 *
 * 제목 옆에는 범위(개수·합계)를 같은 줄에 붙인다. 캡션 줄을 따로 만들지 않고
 * 제목 한 줄이 "무엇을 몇 개 기준으로 보고 있는지"까지 말하게 한다.
 */
const SECTION_TITLE_SX = { display: 'block', mb: 1.5, color: 'text.primary' };

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
  return moneyWhole(value);
}

// 표기 규칙 자체는 utils/format.js가 갖는다. 여기 남은 건 이 화면의 '없음'
// 표기(EMPTY_CELL)와 위 fmtBudget의 "0도 없음으로 본다"는 도메인 판단뿐이다.
const fmtCurrency = money;
const fmtNumber = count;
const fmtPercent = (value) => percent(value, { digits: 2 });

/**
 * 컬럼 정의 헬퍼.
 *
 * `cell`(포맷된 문자열)만 갖고 있던 시절엔 이 표로 **중앙값을 계산할 수 없었다** —
 * 값이 이미 "$8.63" 같은 문자열이라 다시 파싱해야 했다. 원본 숫자(`value`)와
 * 표기(`format`)를 나눠 두면 셀과 기준선이 같은 정의를 공유한다.
 *
 * @param {string} header - 컬럼 라벨
 * @param {function} value - 행에서 원본 숫자를 꺼낸다. `(row) => number|null`
 * @param {function} format - 표기. `(number|null) => string`
 * @param {object} [opts] - width, note(정의 툴팁), hasBenchmark(중앙값 표시 여부)
 */
function metricColumn(header, value, format, opts = {}) {
  return { header, value, format, cell: (r) => format(value(r)), ...opts };
}

/**
 * 지표 정의.
 *
 * 예전엔 Hook Rate·Hold Rate 둘만 native `title`로 설명이 붙어 있었다. 나머지
 * 열세 개는 아무 설명이 없었는데, `CPM`·`CTR`·`CPA`는 광고를 매일 다루지 않는
 * 사람에게 자명하지 않고 **플랫폼마다 정의가 다른 지표가 한 표에 섞여 있다**.
 * 정의 없이 나란히 놓인 숫자는 비교를 부추기면서 비교의 근거는 주지 않는다.
 */
const NOTE = {
  spend: 'Total charged by the platform for this campaign, all time.',
  impressions: 'Times the ad was shown, including repeat views by the same person.',
  reach: 'Unique people who saw the ad at least once.',
  cpm: 'Cost per 1,000 impressions — spend ÷ impressions × 1,000. Lower is cheaper.',
  clicks: 'Link clicks. Meta counts link_click, TikTok counts click.',
  ctr: 'Clicks ÷ impressions.',
  cpc: 'Spend ÷ clicks. Lower is cheaper.',
  engagements: 'Likes + comments + shares. Meta reports this as post_engagement.',
  engagementRate: 'Engagements ÷ impressions.',
  conversions: 'Actions the platform counted for this campaign objective.',
  cpa: 'Spend ÷ conversions. Lower is cheaper.',
  videoPlays: 'Total plays, with no minimum watch time.',
  hookRate: 'Platform-specific: TikTok counts a 2-second view, Meta counts 25% of the video.',
  holdRate: 'Share of hook views that watched to completion — based on the platform-specific hook definition.',
  heldViews: 'Views that reached 100% of the video.',
  avgWatch: 'Average seconds watched per play.',
  follows: 'New followers attributed to the campaign. TikTok only — Meta has no campaign-level equivalent.',
  profileVisits: 'Profile visits from the ad. TikTok only.',
};

// goal별로 Campaign/Platform/Spend(공통) 다음에 붙는 2~3개 컬럼 — 그 목적에서
// 실제로 판단 근거가 되는 지표만 고른다(예: Engagement 목표 캠페인에 CTR/CPC를
// 보여줘봤자 "참여가 잘 됐는지"는 알 수 없다).
function goalExtraColumns(goalValue) {
  switch (goalValue) {
    case GOAL.AWARENESS:
      return [
        metricColumn('Impressions', (r) => r.impressions, fmtNumber, { note: NOTE.impressions }),
        metricColumn('Reach', (r) => r.reach, fmtNumber, { note: NOTE.reach }),
        metricColumn('CPM', (r) => r.cpm, fmtCurrency, { note: NOTE.cpm, hasBenchmark: true }),
      ];
    case GOAL.TRAFFIC:
      return [
        metricColumn('Clicks', (r) => r.clicks, fmtNumber, { note: NOTE.clicks }),
        metricColumn('CTR', (r) => r.ctr, fmtPercent, { note: NOTE.ctr, hasBenchmark: true }),
        metricColumn('CPC', (r) => r.cpc, fmtCurrency, { note: NOTE.cpc, hasBenchmark: true }),
      ];
    case GOAL.ENGAGEMENT:
      return [
        metricColumn('Engagements', (r) => r.engagements, fmtNumber, { note: NOTE.engagements }),
        metricColumn('Engagement Rate', (r) => r.engagementRate, fmtPercent, { note: NOTE.engagementRate, hasBenchmark: true }),
      ];
    case GOAL.CONVERSION:
    case GOAL.STORE_VISIT:
      return [
        metricColumn('Conversions', (r) => r.conversions, fmtNumber, { note: NOTE.conversions }),
        metricColumn('CPA', (r) => r.cpa, fmtCurrency, { note: NOTE.cpa, hasBenchmark: true }),
      ];
    default:
      return [];
  }
}

/* utils/format.js에 위임한다. 포맷터를 한 곳으로 모을 때 fmtBudget·fmtCurrency·
   fmtNumber·fmtPercent만 옮기고 이것만 빠뜨렸는데, 그 사이 seconds()가 "Meta는
   정수 초만 준다"는 이유로 표기를 바꿨는데도 이 표만 옛 규칙(2자리 고정)으로
   남아 `2.00s`·`11.00s`를 찍고 있었다(실화면 12-14~12-17). 규칙이 두 벌이면
   한쪽만 고쳐진다는 걸 이 파일이 스스로 증명한 셈이다. */
const fmtSeconds = seconds;

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
  metricColumn('Video Plays', (r) => r.videoPlays, fmtNumber, { width: 112, note: NOTE.videoPlays }),
  // Hook Rate = 초반 시청 / 노출, Hold Rate = 완전 시청 / 초반 시청.
  /* 폭 104 → 124. 헤더에 기준선(`med 21.89%`)이 붙으면서 104px로는 라벨·ⓘ·
     기준선이 세 줄로 쪼개졌다(실화면 12-12). 기준선이 들어갈 자리를 준다. */
  metricColumn('Hook Rate', (r) => r.hookRate, fmtPercent, { width: 124, note: NOTE.hookRate, hasBenchmark: true, isPlatformSpecific: true }),
  metricColumn('Hold Rate', (r) => r.holdRate, fmtPercent, { width: 124, note: NOTE.holdRate, hasBenchmark: true, isPlatformSpecific: true }),
  metricColumn('Held Views', (r) => r.heldViews, fmtNumber, { width: 108, note: NOTE.heldViews }),
  metricColumn('Avg Watch', (r) => r.avgWatchSeconds, fmtSeconds, { width: 116, note: NOTE.avgWatch, hasBenchmark: true }),
];

const CREATIVE_ENGAGEMENT_COLUMNS = [
  metricColumn('Likes', (r) => r.likes, fmtNumber, { width: 88 }),
  metricColumn('Comments', (r) => r.comments, fmtNumber, { width: 104 }),
  metricColumn('Shares', (r) => r.shares, fmtNumber, { width: 88 }),
  metricColumn('Follows', (r) => r.follows, fmtNumber, { width: 92, note: NOTE.follows }),
  metricColumn('Profile Visits', (r) => r.profileVisits, fmtNumber, { width: 120, note: NOTE.profileVisits }),
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

/**
 * 이 표 전체의 중앙값. 컬럼 헤더 아래에 붙어 각 행이 비교될 기준이 된다.
 *
 * ## 왜 필요한가
 *
 * `Hook Rate 22.4%`가 좋은 건지 나쁜 건지 이 앱은 답을 갖고 있지 않았다.
 * 벤치마크도, 목표치도, 과거 평균도 저장하지 않으니 15개 컬럼 × 수십 행의
 * 숫자가 **하나도 판단으로 이어지지 않았다.** 외부 업계 평균은 우리에게 없지만,
 * **우리 자신의 분포**는 이미 화면에 있는 데이터로 계산된다. "우리 평균보다
 * 나은가"는 대부분의 실무 판단에 충분하다.
 *
 * ## 왜 평균이 아니라 중앙값인가
 *
 * 이 계정에는 $10짜리 부스팅 게시물과 $2,000짜리 캠페인이 한 표에 섞여 있다.
 * 산술평균은 극단값 하나에 끌려가서 "평균"이 어느 캠페인과도 닮지 않게 된다.
 *
 * ## 왜 현재 페이지가 아니라 전체 행인가
 *
 * 페이지마다 기준선이 달라지면 같은 값이 페이지를 넘길 때 좋아 보였다 나빠
 * 보였다 한다. 기준은 표 전체(필터가 적용된 goal 집합)에서 한 번만 계산한다.
 *
 * @returns {number|null} 값이 있는 행이 3개 미만이면 null — 그 표본으로 "평균"을
 *   말하면 근거 없는 권위를 주는 셈이다
 */
function columnMedian(column, rows) {
  const values = rows
    .map((r) => column.value?.(r))
    .filter((v) => v != null && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (values.length < 3) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
}

// Cost 그룹 구성용 — Spend(모든 goal 공통)와, goalExtraColumns 중 비용 지표
// (CPM/CPC/CPA)를 한 그룹으로 묶는다. 예전엔 비용 지표가 goal 지표들 뒤에
// 섞여 있었는데(예: Impressions·Reach 다음 CPM), "얼마 썼고 단가가 얼마인가"와
// "얼마나 잘 됐나"는 서로 다른 질문이라 그룹으로 가른다.
const SPEND_COLUMN = metricColumn('Spend', (r) => r.spend, fmtCurrency, { note: NOTE.spend });
const COST_METRIC_HEADERS = new Set(['CPM', 'CPC', 'CPA']);

/*
 * 그룹 헤더 행 — 눈썹 라벨 + 관할 범위를 긋는 밑줄.
 *
 * 이 자리는 두 번 바뀌었다. 처음엔 배경 없이 라벨만 뒀는데 부모(그룹 라벨)가
 * 자식(컬럼 헤더 14px 세미볼드)보다 약해 보였고, 그래서 surface.sunken →
 * surface.muted로 배경 띠를 한 단씩 올렸다.
 *
 * 그런데 배경을 올릴수록 다른 문제가 자랐다 — 회색 띠가 채워지니 그 줄이
 * **아래 헤더 행과 무관한 자기 완결적인 띠**로 보여서, COST/PERFORMANCE/VIDEO/
 * ENGAGEMENT 줄과 Spend/CPM/... 줄이 각각 독립된 헤더 두 개로 읽혔다(실화면
 * 리뷰 12-1). 세로 divider는 그룹끼리를 갈라줄 뿐, "이 라벨이 아래 이 컬럼들을
 * 덮는다"는 부모-자식 관계는 아무것도 말해주지 않았다.
 *
 * 배경으로 존재감을 만드는 대신 관계를 직접 그린다: 배경을 걷고, 각 그룹
 * 라벨 아래에 그 그룹의 colSpan만큼만 밑줄을 긋는다. 밑줄의 **길이 자체가**
 * 관할 범위라, 라벨이 조용해도(12px secondary) 무엇을 덮는지 한눈에 보인다.
 * 이게 grouped header의 표준 처방이기도 하다.
 *
 * 배경색 상수는 **없애야** 한다. 남겨서 'transparent'를 깔면 아래 셀 스타일
 * 합성(`{...STICKY_CAMPAIGN_SX, ...GROUP_ROW_CELL_SX}`)에서 뒤쪽이 이겨 고정
 * Campaign 셀까지 투명해지고, 가로 스크롤 시 그 밑으로 지나가는 숫자가 비쳐
 * 보인다. 배경을 지정하지 않으면 sticky 셀은 자기 흰 배경을 그대로 유지한다.
 */
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
};
const GROUP_LABEL_SX = {
  ...GROUP_ROW_CELL_SX,
  /* 조용한 라벨 + 관할 범위 밑줄. 라벨이 컬럼 헤더(14/600 primary)보다 약한 건
     이제 문제가 아니다 — 부모임을 말하는 건 굵기가 아니라 밑줄의 길이다.
     크기도 11px(0.6875rem)이라는 앱 어디에도 없던 고아 값에서 스케일의
     caption(12px)으로 되돌린다. */
  color: 'text.secondary',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  lineHeight: 1.4,
  borderBottom: '1px solid',
  borderBottomColor: 'divider',
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
 * 같은 phase에 속한 캠페인의 실제 지출을 플랫폼 구분 없이 합친다.
 * buildPhaseTimeline과 같은 묶음 기준(campaignNameKey)을 써서 Plan 탭과 같은
 * 순서·같은 단위로 읽힌다.
 *
 * 지출 하나만 낸다. 예전엔 Impressions·Follows·Hook Rate까지 계산해 두고 막대에
 * 무엇을 붙일지 사용자가 고르게 했는데, 고를 이유가 없는 선택이었다 — 이 차트가
 * 답하는 질문은 "각 단계가 언제, 얼마짜리였나"이고 그 옆에 놓일 수 있는 실적은
 * 예산과 같은 단위인 지출뿐이다. 노출·팔로우·훅률은 축이 달라서 예산 옆에 붙여도
 * 비교가 안 되고, 정작 그 지표들은 바로 아래 goal별 표가 캠페인 단위로 다 보여준다.
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

  return [...byName.values()]
    .map((phase) => {
      const spends = phase.rows.map((r) => r.spend).filter((v) => v != null);
      return {
        key: phase.key,
        name: phase.name,
        startDate: phase.startDate,
        spend: spends.length > 0 ? spends.reduce((a, b) => a + b, 0) : null,
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
    toCsvRow([c.name, c.platform, c.startDate, c.endDate, c.budgetDaily ?? '', effectiveBudgetPlanned(c) ?? ''])
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
 * 계획 항목을 PhaseTimelineChart가 읽는 phase 배열로 바꾼다.
 *
 * 실제 집행 타임라인(buildPhaseTimeline)과 **같은 차트·같은 문법**을 쓴다 —
 * 계획과 실제를 다른 그림으로 보여주면 둘을 머릿속에서 다시 맞춰야 한다
 * (Plan/Performance 탭이 서로 다른 차트를 쓰다가 하나로 합친 것과 같은 이유).
 *
 * 같은 라벨의 항목은 플랫폼이 달라도 한 막대로 합친다. 계획은 "Coming Soon /
 * Meta"와 "Coming Soon / TikTok"을 따로 적지만, 그건 예산을 나눠 적은 것이지
 * 서로 다른 단계가 아니다 — 실제 타임라인이 플랫폼별 캠페인을 한 phase로
 * 합치는 것과 같은 판단이다.
 */
function buildPlanPhases(plan) {
  const byLabel = new Map();
  (plan?.items ?? []).forEach((item) => {
    const key = item.label.trim().toLowerCase();
    if (!byLabel.has(key)) byLabel.set(key, { key, name: item.label.trim(), items: [] });
    byLabel.get(key).items.push(item);
  });

  return [...byLabel.values()]
    .map(({ key, name, items }) => {
      const platforms = [...new Set(items.map((i) => i.platform))]
        .sort((a, b) => Object.keys(PLATFORM_LABEL).indexOf(a) - Object.keys(PLATFORM_LABEL).indexOf(b));
      return {
        key,
        name,
        platformLabel: platforms.map((p) => PLATFORM_LABEL[p] ?? p).join(' + '),
        startDate: items.reduce((min, i) => (i.startDate < min ? i.startDate : min), items[0].startDate),
        endDate: items.reduce((max, i) => (i.endDate > max ? i.endDate : max), items[0].endDate),
        totalDaily: items.reduce((sum, i) => sum + i.budgetDaily, 0),
        totalBudget: items.reduce((sum, i) => sum + (planItemTotal(i) ?? 0), 0),
      };
    })
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0))
    .map((phase, index, all) => ({ ...phase, fillAlpha: phaseFillAlpha(index, all.length) }));
}

/** 계획 금액 표기 — 계획은 소수점이 의미 없어 정수로 반올림한다. */
function fmtPlanMoney(amount) {
  return amount == null ? EMPTY_CELL : moneyWhole(amount);
}

/**
 * 계획 목록 — Event를 고르지 않았을 때 Plan 탭이 보여주는 것.
 *
 * 계획을 만드는 입구가 여기 있어야 한다. 예전엔 Event를 골라야만 계획 UI가
 * 나왔는데, Event 옵션은 **이미 집행된 캠페인**에서 뽑히므로 아직 안 연 매장의
 * 계획은 시작할 방법이 아예 없었다(실사용 지적) — "집행 전에 세우는 문서"라는
 * 전제와 정면으로 어긋난다. 새 계획은 이벤트 선택과 무관하게 언제나 만들 수 있다.
 */
function PlanList({ plans, campaigns, performanceRecords, eventOptions, onSave, onDelete, onOpen }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState({ name: '', notes: '', items: [] });

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const saved = await onSave?.({
      name: values.name,
      notes: values.notes,
      items: values.items.filter((i) => i.label.trim() && i.startDate && i.endDate && Number(i.budgetDaily) > 0),
    });
    setIsSaving(false);
    if (saved) {
      setIsCreating(false);
      setValues({ name: '', notes: '', items: [] });
      // 저장 직후 그 계획으로 보낸다 — 만들자마자 "그래서 어떻게 됐나"를 볼 수 있어야 한다.
      onOpen?.(saved.name);
    }
  };

  if (isCreating) {
    return (
      <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: (t) => `${t.shape.radius.container}px` }}>
        <PlanForm
          values={values}
          onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
          onItemsChange={(items) => setValues((v) => ({ ...v, items }))}
          eventOptions={eventOptions}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button size="small" onClick={() => setIsCreating(false)}>Cancel</Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !values.name.trim()}
            sx={{ boxShadow: 'none' }}
          >
            {isSaving ? 'Saving…' : 'Save plan'}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        <Typography variant="title" sx={{ ...SECTION_TITLE_SX, mb: 0 }}>
          Plans{' '}
          <Typography component="span" variant="body2" sx={SECTION_SCOPE_SX}>
            — budgets set before spending, compared against actuals
          </Typography>
        </Typography>
        <Button size="small" variant="outlined" onClick={() => setIsCreating(true)} sx={{ boxShadow: 'none' }}>
          New plan
        </Button>
      </Box>

      {plans.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No plans yet. Create one to set a budget before the campaigns run — it does not have to exist in Meta or TikTok yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Phases</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Planned</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actual</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Difference</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => {
              const c = planVsActual(plan, campaigns, performanceRecords);
              const isOver = c.diff != null && c.diff > 0;
              return (
                <TableRow
                  key={plan.id}
                  hover
                  onClick={() => onOpen?.(plan.name)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    {plan.name}
                    {/* 계획이 실제 집행과 **연결되지 않았다는 사실**은 저장
                        시점의 경고만으로는 부족하다 — 경고를 무시하고 저장할
                        수도 있고, 나중에 캠페인 쪽 Event 태그가 바뀌어 끊어질
                        수도 있다. 목록에 상시 표시해서 "실제 $0"이 "안 썼다"가
                        아니라 "안 붙었다"임을 구분한다. */}
                    {c.campaignCount === 0 && (
                      <Tooltip title={`No campaigns are tagged with the Event "${plan.name}". Tag them on the Dashboard, or rename this plan to match.`}>
                        <Box
                          component="span"
                          sx={{
                            ml: 1,
                            px: 0.75,
                            py: 0.25,
                            typography: 'caption',
                            fontWeight: 600,
                            color: 'warning.main',
                            border: '1px solid',
                            borderColor: 'warning.main',
                            borderRadius: (t) => `${t.shape.radius.control}px`,
                            cursor: 'help',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Not linked
                        </Box>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="right">{plan.items.length}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtPlanMoney(c.planned)}</TableCell>
                  {/* 집행이 아직 없으면 '—'. 0으로 찍으면 "한 푼도 안 썼다"는
                      주장이 되는데, 실제로는 캠페인이 아직 없는 상태다. */}
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {c.campaignCount === 0 ? EMPTY_CELL : fmtPlanMoney(c.actual)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontVariantNumeric: 'tabular-nums', color: c.diff == null ? 'text.primary' : isOver ? 'warning.main' : 'text.primary' }}
                  >
                    {c.diff == null ? EMPTY_CELL : `${c.diff > 0 ? '+' : '−'}${fmtPlanMoney(Math.abs(c.diff))}`}
                  </TableCell>
                  <TableCell sx={{ p: 0 }}>
                    <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete?.(plan.id); }}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

/**
 * 이벤트 계획 패널 — 집행 **전에** 세운 예산·일정과, 그 대비 실제 집행.
 *
 * 계획 단계와 실제 캠페인을 한 줄씩 짝지으려 하지 않는다 — 같은 단계를 플랫폼
 * 마다 사람이 따로 이름 짓는 게 이 계정의 기본값이라 억지 매칭은 조용히 틀린
 * 귀속을 만든다(schema.js planVsActual 주석). 총액만 비교하고 단계 목록은 계획
 * 쪽을 그대로 보여준다 — 어긋남은 숨기지 않는다.
 */
function PlanPanel({ eventName, plan, eventOptions, comparison, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState({ name: eventName, notes: '', items: [] });

  const startEditing = () => {
    setValues({
      name: plan?.name ?? eventName,
      notes: plan?.notes ?? '',
      items: (plan?.items ?? []).map((i) => ({ ...i, budgetDaily: String(i.budgetDaily) })),
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const saved = await onSave?.({
      id: plan?.id,
      name: values.name,
      notes: values.notes,
      /* 덜 채워진 줄은 저장하지 않는다 — 빈 줄이 계획에 남으면 합계가 조용히
         틀린다(0으로 세든 빼든 둘 다 사실과 다르다). */
      items: values.items.filter((i) => i.label.trim() && i.startDate && i.endDate && Number(i.budgetDaily) > 0),
    });
    setIsSaving(false);
    if (saved) setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: (t) => `${t.shape.radius.container}px` }}>
        <PlanForm
          values={values}
          onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
          onItemsChange={(items) => setValues((v) => ({ ...v, items }))}
          eventOptions={eventOptions}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button size="small" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSave}
            disabled={isSaving || !values.name.trim()}
            sx={{ boxShadow: 'none' }}
          >
            {isSaving ? 'Saving…' : 'Save plan'}
          </Button>
        </Box>
      </Box>
    );
  }

  if (!plan) {
    return (
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          No plan for {eventName} yet — set the intended budget to compare against actual spend.
        </Typography>
        <Button size="small" variant="outlined" onClick={startEditing} sx={{ boxShadow: 'none' }}>
          Create plan
        </Button>
      </Box>
    );
  }

  const planPhases = buildPlanPhases(plan);
  const isOver = comparison?.diff != null && comparison.diff > 0;
  const diffText = comparison?.diff == null
    ? EMPTY_CELL
    : `${comparison.diff > 0 ? '+' : '−'}${fmtPlanMoney(Math.abs(comparison.diff))}`;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        <Typography variant="title" sx={{ ...SECTION_TITLE_SX, mb: 0 }}>
          Plan{' '}
          <Typography component="span" variant="body2" sx={SECTION_SCOPE_SX}>
            — {plan.items.length} {plan.items.length === 1 ? 'phase' : 'phases'}
          </Typography>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={startEditing}>Edit</Button>
          <Button size="small" color="error" onClick={() => onDelete?.(plan.id)}>Delete</Button>
        </Box>
      </Box>

      {/* 계획 vs 실제 — 이 패널의 존재 이유다. 계획만 보여주면 "그래서 맞췄나"에
          답하지 못한다. 실제 기록이 없으면 '—'로 두고 차이도 말하지 않는다
          (0으로 찍으면 "한 푼도 안 썼다"는 거짓 주장이 된다). */}
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2 }}>
        {[
          { label: 'Planned', value: fmtPlanMoney(comparison?.planned) },
          { label: 'Actual', value: fmtPlanMoney(comparison?.actual) },
          {
            label: 'Difference',
            value: diffText,
            color: comparison?.diff == null ? 'text.primary' : isOver ? 'warning.main' : 'text.primary',
            sub: comparison?.diffRatio != null
              ? `${comparison.diffRatio > 0 ? '+' : ''}${Math.round(comparison.diffRatio * 100)}% vs plan`
              : null,
          },
        ].map((item) => (
          <Box key={item.label}>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {item.label}
            </Typography>
            <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums', color: item.color ?? 'text.primary' }}>
              {item.value}
            </Typography>
            {item.sub && <Typography variant="caption" color="text.secondary">{item.sub}</Typography>}
          </Box>
        ))}
      </Box>

      {/* 계획 타임라인 — 실제 집행 타임라인과 같은 컴포넌트다. 표만 있으면
          "언제 뭐가 겹치는지"가 안 보이는데, 단계·기간·예산이 이미 다 있으므로
          그릴 수 있다. 아래 실제 타임라인과 같은 문법이라 둘을 눈으로 바로
          비교할 수 있다. */}
      {planPhases.length > 0 && <PhaseTimelineChart phases={planPhases} sx={{ mb: 2 }} />}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Phase</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Platform</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Dates</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Daily</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Planned</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {plan.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.label}</TableCell>
              <TableCell>{PLATFORM_LABEL[item.platform] ?? item.platform}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{shortDate(item.startDate)}–{shortDate(item.endDate)}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {moneyWhole(item.budgetDaily)}
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtPlanMoney(planItemTotal(item))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
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
export function ReportSummarySection({ campaigns, performanceRecords, plans = [], onSavePlan, onDeletePlan, isLoading = false, error = null, onRetry, sx }) {
  const navigate = useNavigate();
  const theme = useTheme();
  /* 기본 탭은 Performance다. 이 화면 이름이 Reports이고, 보고서에 오는 사람의
     첫 질문은 "얼마나 잘 됐나"다 — Plan(예산·타임라인)은 기획 단계에서 보는
     산출물이라 빈도가 낮고, "지금 뭐가 돌고 뭐가 예정인가"는 Dashboard가 이미
     답한다. 탭 순서도 같이 뒤집었다: 순서는 Plan-먼저인데 마지막 탭 기억 때문에
     화면은 Performance로 열려서 "내가 왜 여기 있지"가 됐다(실사용 피드백).
     보이는 순서와 열리는 탭이 어긋나면 기억 기능이 오히려 혼란을 만든다. */
  /* 초기값은 localStorage에서만 읽는다 — URL이 있으면 useViewUrlSync가 덮어쓴다. */
  const [reportTab, setReportTab] = useState(() => loadLastReportView()?.tab || 'performance');
  const [groupValues, setGroupValues] = useState(() => {
    const saved = loadLastReportView();
    return { platform: saved?.platform ?? '', campaignGroup: saved?.event ?? '' };
  });
  const [dateRange, setDateRange] = useState(() => {
    const saved = loadLastReportView();
    return { start: saved?.from ?? '', end: saved?.to ?? '' };
  });
  /* goal별 현재 페이지. 표가 goal마다 하나씩 렌더되는데 훅은 map 콜백 안에서
     못 부르므로, 표마다 상태를 따로 두는 대신 goal을 키로 한 객체 하나로 모은다. */
  const [pageByGoal, setPageByGoal] = useState({});

  /* 탭·필터를 URL과 묶는다 — Dashboard와 같은 규칙. 이 화면이 특히 중요한 게,
     "G10 Opening 성과"를 동료에게 보여주려면 지금까지는 링크가 아니라 조작
     순서를 말로 설명해야 했다. */
  useViewUrlSync(
    {
      tab: reportTab,
      platform: groupValues.platform ?? '',
      event: groupValues.campaignGroup ?? '',
      from: dateRange.start ?? '',
      to: dateRange.end ?? '',
    },
    (next) => {
      setReportTab(next.tab || 'performance');
      setGroupValues((v) => ({ ...v, platform: next.platform, campaignGroup: next.event }));
      setDateRange({ start: next.from, end: next.to });
    },
    { storageKey: REPORT_VIEW_STORAGE_KEY },
  );

  /* Event 드롭다운 옵션 = **이벤트로 유도된 그룹만**.
     예전엔 "이름이 같은 캠페인이 2건 이상"도 옵션으로 올렸다. 그 규칙은 사람이
     묶으려고 일부러 같은 이름을 지었을 때를 위한 것이었는데, 실데이터에서는 같은
     게시물을 여러 번 부스팅하면 캡션이 그대로 이름이라 **우연히** 중복되고 그게
     전부 "이벤트"로 올라왔다(드롭다운이 캡션 목록으로 뒤덮인 원인의 절반).
     이제 서버가 유도 못 한 이름에는 그룹을 안 붙이므로(resolveEventGroup이 null)
     이 조건 하나로 충분하다 — 유도된 게 없으면 이벤트도 없다. */
  /* 옵션 = 집행된 이벤트 + **계획만 있는 이벤트**.
     계획은 캠페인이 생기기 전에 세우는 문서라, 캠페인에서만 옵션을 뽑으면 아직
     안 연 매장의 계획은 만들고도 다시 찾아갈 수 없다(실사용 지적). 계획 이름도
     같은 목록에 넣어 "계획만 있고 집행은 아직"인 상태를 고를 수 있게 한다. */
  const executedGroups = [...new Set(campaigns.map((c) => c.campaignGroup).filter(Boolean))];
  /* 순서는 **최근순**이다. campaigns가 start_date 내림차순으로 오므로 Set의
     삽입 순서가 곧 "그 이벤트의 가장 최근 캠페인" 순이 된다 — 지금 작업 중인
     이벤트는 보통 최근 것이라 이 순서가 실무에 맞는다.

     한때 알파벳순이었는데(계획 이름을 합치면서 딸려 들어간 정렬), "1$ Deals"·
     "50%Offdeals Trafp" 같은 게 맨 위를 차지하고 정작 자주 쓰는 "G10 Opening"이
     한참 아래로 밀렸다(실사용 지적).

     집행이 아직 없는 계획은 맨 위에 둔다 — 정렬 기준이 될 날짜가 아예 없고,
     Plan 탭에서 찾는 대상이 바로 그것이다. 집행이 있는 계획은 최근순 자리에
     그대로 둔다(계획이 있다는 이유로 오래된 이벤트를 위로 끌어올리지 않는다). */
  const planOnlyGroups = plans.map((p) => p.name).filter((name) => !executedGroups.includes(name));
  const campaignGroupOptions = [...planOnlyGroups, ...executedGroups]
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

  /**
   * 필터를 걸지 않은 전체 기준선. KPI의 "그래서 이 숫자가 좋은 건가"에 답하기
   * 위한 유일한 정직한 비교 대상이다.
   *
   * 기간 비교("지난 30일 대비")는 **계산할 수 없다** — 이 앱의 성과 레코드는
   * 캠페인당 누적 1건이라 시계열 축이 아예 없다(schema.js의 PerformanceRecord).
   * 없는 비교를 지어내느니 도출 가능한 것만 말한다: 지금 걸러 보고 있는 집합이
   * 전체 평균보다 비싼가 싼가.
   */
  const baselineSummary = useMemo(
    () => getReportSummary(campaigns, performanceRecords),
    [campaigns, performanceRecords]
  );

  /**
   * Avg. CPM 옆에 붙는 비교. 필터가 실제로 범위를 좁혔을 때만 의미가 있다 —
   * 안 좁혔으면 비교 대상이 자기 자신이라 항상 0%가 된다.
   *
   * CPM은 **낮을수록 좋다**. 방향(▲/▼)과 좋고 나쁨(tone)이 반대로 붙는 지표라
   * 색만 보고 판단하지 않도록 문구에 cheaper/pricier를 적는다.
   */
  const cpmDelta = useMemo(() => {
    const mine = summary.avgCPM;
    const base = baselineSummary.avgCPM;
    if (mine == null || base == null || base === 0) return undefined;
    if (filteredCampaigns.length === campaigns.length) return undefined;
    const ratio = mine / base - 1;
    if (Math.abs(ratio) < 0.01) return { text: 'in line with your average', direction: 'flat', tone: 'neutral' };
    return {
      text: `${percent(Math.abs(ratio))} ${ratio > 0 ? 'pricier' : 'cheaper'} than your average`,
      direction: ratio > 0 ? 'up' : 'down',
      tone: ratio > 0 ? 'bad' : 'good',
    };
  }, [summary.avgCPM, baselineSummary.avgCPM, filteredCampaigns.length, campaigns.length]);

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
    acc[c.platform] = (acc[c.platform] ?? 0) + (effectiveBudgetPlanned(c) ?? 0);
    return acc;
  }, {});
  const planTotalBudget = planCampaigns.reduce((sum, c) => sum + (effectiveBudgetPlanned(c) ?? 0), 0);

  /* 계획 vs 실제. 계산은 schema.js가 하고 화면은 그리기만 한다 — 같은 숫자를
     두 곳에서 따로 계산하면 조용히 갈린다(이 세션에서 계획 예산이 화면마다
     달랐던 일이 그 예다). */
  const activePlan = activeCampaignGroup ? plans.find((p) => p.name === activeCampaignGroup) ?? null : null;
  const planComparison = activePlan ? planVsActual(activePlan, campaigns, performanceRecords) : null;

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
                  {
                    label: 'Planned Budget',
                    /* 계획 문서가 있으면 **그 값**이 계획 예산이다. 없을 때만
                       캠페인에서 역산한 값(일일예산×기간)을 쓴다.

                       예전엔 항상 캠페인에서만 뽑아서, 계획을 세워둔 이벤트를
                       고르면 헤더는 '—'인데 바로 아래 패널은 '$209'라고 말했다 —
                       같은 단어로 다른 값을 말하는 상태다(이번 세션에서 계획
                       예산이 드로어 $1,060 / Reports $0으로 갈렸던 것과 같은 종류).
                       null은 0이 아니라 '—'로 찍는다: $0은 "0으로 계획했다"는
                       거짓 주장이 된다. */
                    value: (() => {
                      const amount = planComparison?.planned ?? summary.totalBudgetPlanned;
                      return amount != null ? moneyWhole(amount) : EMPTY_CELL;
                    })(),
                    sub: planComparison?.planned != null ? 'from the saved plan' : undefined,
                  },
                ]
              : [
                  { label: 'Campaigns', value: summary.totalCampaigns },
                  {
                    label: 'Total Spend',
                    value: money(summary.totalSpend),
                    /* 계획이 있을 때만 붙는다. 계획 없이 "얼마 썼다"만 크게
                       띄우면 화면이 그 숫자가 많은지 적은지에 답하지 못한다. */
                    delta:
                      planComparison?.planned > 0
                        ? {
                            text: `${percent(summary.totalSpend / planComparison.planned)} of ${moneyWhole(planComparison.planned)} planned`,
                            tone: summary.totalSpend > planComparison.planned ? 'bad' : 'neutral',
                          }
                        : undefined,
                  },
                  {
                    label: 'Avg. CPM',
                    value: summary.avgCPM != null ? money(summary.avgCPM) : EMPTY_CELL,
                    /* 모집단과 계산 방식을 밝힌다. 이 값은 **전체 캠페인의 평균**
                       인데, 바로 아래 goal별 표의 헤더에는 **그 표만의 중앙값**이
                       붙는다(Awareness med $2.68). 같은 화면에 3배 차이나는 두
                       CPM이 놓이는데 무엇이 다른지 화면이 말하지 않으면 둘 중
                       하나가 틀린 것으로 읽힌다(실화면 12-11). */
                    sub: `mean across ${summary.totalCampaigns} campaigns · tables below show each goal's median`,
                    delta: cpmDelta,
                  },
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
        <BackendErrorBanner error={ error } onRetry={ onRetry } sx={{ mb: 2 }} />
      )}

      {isLoading && (
        <Box aria-label="Loading report" role="status">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={40} sx={{ mb: 1 }} />
          ))}
        </Box>
      )}

      {/* 집행 전 계획 — 실제 집행(아래 타임라인·Budget Breakdown)과 별개 층이다.
          Event를 골랐을 때만 보여준다: 계획은 이벤트 단위 문서라 "전체" 상태에서는
          어느 계획을 말하는지 정할 수 없다. */}
      {!isLoading && reportTab === 'plan' && (
        activeCampaignGroup ? (
          <PlanPanel
            eventName={activeCampaignGroup}
            plan={activePlan}
            eventOptions={campaignGroupOptions.map((o) => o.value)}
            comparison={planComparison}
            onSave={onSavePlan}
            onDelete={onDeletePlan}
          />
        ) : (
          /* Event를 안 골랐을 때 — 계획 목록과 새 계획 만들기.
             예전엔 Event를 골라야만 계획 UI가 나왔는데, 옵션은 이미 집행된
             캠페인에서만 뽑히므로 **아직 안 연 매장의 계획은 시작할 방법이
             없었다**. 계획은 집행 전 문서라는 전제와 정면으로 어긋난다. */
          <PlanList
            plans={plans}
            campaigns={campaigns}
            performanceRecords={performanceRecords}
            eventOptions={campaignGroupOptions.map((o) => o.value)}
            onSave={onSavePlan}
            onDelete={onDeletePlan}
            onOpen={(name) => setGroupValues((v) => ({ ...v, campaignGroup: name }))}
          />
        )
      )}

      {!isLoading && (reportTab === 'plan' ? (
        planCampaigns.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
            No campaigns match the current filters.
          </Typography>
        ) : phases.length > 0 ? (
          /* Plan 탭은 컬럼이 7개뿐이라 뷰포트 전폭에 늘리면 우측 절반이 비고,
             같은 탭 그룹의 Performance 표(15컬럼, 가로 스크롤)와 밀도가 극단으로
             갈렸다(실화면 리뷰 12-9 vs 12-1). 분석 화면 폭 토큰으로 묶는다 —
             표가 주인공이라 폭을 풀어야 하는 건 Performance 쪽뿐이다. */
          <Box sx={(theme) => ({ maxWidth: theme.layout.content.wide })}>
            {/* Event 타임라인 — Plan·Performance 두 탭이 같은 컴포넌트를 쓴다
                (PhaseTimelineChart 주석 참고). 막대에는 기간과 함께 일일 예산·
                총 예산이 붙는다. */}
            <PhaseTimelineChart phases={phases} sx={{ mb: 4 }} />

            {/* Budget Breakdown — phase 하나당 한 행(플랫폼별로 안 쪼갬). 각
                phase가 어느 캠페인 하나에 대응하지 않고 여러 캠페인(플랫폼별)을
                합친 값이라, 위 Plan 표와 달리 행 클릭으로 캠페인 Drawer에 못
                보낸다(어느 캠페인을 열지 애매함) — 그래서 클릭 불가로 둔다. */}
            <Typography variant="title" sx={SECTION_TITLE_SX}>
              Budget Breakdown{' '}
              <Typography component="span" variant="body2" sx={SECTION_SCOPE_SX}>
                — {phases.length} {phases.length === 1 ? 'phase' : 'phases'} · {moneyWhole(planTotalBudget)} planned
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
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{moneyWhole(phaseMetaTotal)}</TableCell>
                    <TableCell />
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{moneyWhole(phaseTikTokTotal)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{moneyWhole(phaseGrandTotal)}</TableCell>
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
                        {c.budgetDaily != null ? `${moneyWhole(c.budgetDaily)}/day` : EMPTY_CELL}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {fmtBudget(effectiveBudgetPlanned(c))}
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
            <Typography variant="label" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
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
                      {moneyWhole(amount)} ({percent(ratio)})
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
              피드백). 시간 축 하나로 통일하고, 이 탭에서만 필요한 실적은 막대
              라벨 뒤에 덧붙인다 — 막대 길이는 양쪽 다 "기간"을 뜻하므로 탭을
              오갈 때 읽는 규칙이 바뀌지 않는다.

              덧붙이는 값은 지출로 고정한다. 지표 선택기(Spend·Impressions·
              Follows·Hook Rate)를 뒀다가 뺐다 — 예산 옆에 놓을 수 있는 건 같은
              단위인 지출뿐이고, 나머지 지표는 바로 아래 goal별 표가 캠페인
              단위로 이미 다 보여준다. */}
          {phases.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="title" sx={SECTION_TITLE_SX}>
                Event timeline{' '}
                <Typography component="span" variant="body2" sx={SECTION_SCOPE_SX}>
                  — {phases.length} {phases.length === 1 ? 'phase' : 'phases'} · Spend on each bar
                </Typography>
              </Typography>

              <PhaseTimelineChart
                phases={phases}
                barSuffix={(phase) => {
                  const spend = performanceByPhaseKey.get(phase.key)?.spend;
                  // 기록이 없으면 지표를 아예 안 붙인다 — '—'를 붙이면 예산 뒤에
                  // 의미 없는 기호가 매달려 라벨만 길어진다.
                  return spend != null ? `Spend ${fmtCurrency(spend)}` : null;
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
             비교 위험이 없어서 각주가 소음이다. 정의 자체는 헤더의 ⓘ 툴팁으로
             항상 닿는다(col.note). */
          /* note 유무로 판단하면 안 된다 — 지금은 거의 모든 컬럼에 정의가 붙어
             있어서 항상 참이 된다. 각주가 말하는 건 "정의가 있다"가 아니라
             "플랫폼마다 정의가 **다르다**"이므로 그 컬럼만 표시한다. */
          const hasPlatformSpecificMetric = dataColumns.some((col) => col.isPlatformSpecific);
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
              <Typography variant="title" sx={SECTION_TITLE_SX}>
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
                      {dataColumns.map((column) => {
                        /* 기준선은 **현재 페이지가 아니라 표 전체**(rowsForGoal)에서
                           계산한다 — 페이지마다 기준이 달라지면 같은 값이 페이지를
                           넘길 때 좋아 보였다 나빠 보였다 한다. */
                        const median = column.hasBenchmark ? columnMedian(column, rowsForGoal) : null;
                        return (
                          <TableCell
                            key={`${column.group}-${column.header}`}
                            align="right"
                            sx={{ fontWeight: 600, verticalAlign: 'bottom', ...(column.isGroupStart ? GROUP_DIVIDER_SX : null) }}
                          >
                            {/* 예전엔 정의가 native title이라 **보이는 신호가 없었고**
                                터치 기기에서는 아예 열리지 않았다. 아이콘으로 "여기
                                설명이 있다"를 먼저 말한다. */}
                            {column.note ? (
                              <Tooltip title={column.note} arrow enterTouchDelay={0}>
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, cursor: 'help' }}>
                                  {column.header}
                                  <InfoOutlinedIcon
                                    sx={(t) => ({ fontSize: t.iconSize.inline, color: 'text.disabled' })}
                                  />
                                </Box>
                              </Tooltip>
                            ) : (
                              column.header
                            )}
                            {/* 이 표 자신의 중앙값. 외부 벤치마크는 없지만 "우리
                                평균보다 나은가"는 대부분의 판단에 충분하다. */}
                            {median != null && (
                              <Typography
                                variant="caption"
                                component="div"
                                /* 이 줄이 쪼개지면 "med"와 값이 다른 줄에 놓여
                                   헤더가 세 줄이 된다(실화면 12-12). */
                                sx={{
                                  fontWeight: 400,
                                  color: 'text.secondary',
                                  fontVariantNumeric: 'tabular-nums',
                                  whiteSpace: 'nowrap',
                                }}
                                /* 무엇의 중앙값인지 밝힌다 — 이 표 **전체**가
                                   기준이라 지금 페이지에 보이는 15행만 보면
                                   기준선이 틀린 것처럼 보인다(Traffic 표에서
                                   보이는 행 대부분이 CTR 0%인데 med는 1.57%). */
                                title={`Median across all ${rowsForGoal.length} campaigns in this table, not just this page`}
                              >
                                {`med ${column.format(median)}`}
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
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
