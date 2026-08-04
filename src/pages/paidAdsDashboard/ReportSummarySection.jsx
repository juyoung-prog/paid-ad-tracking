import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { FilterBar } from '../../components/templates/FilterBar';
import { KpiBar } from '../../components/data-display/KpiBar';
import { getReportSummary, getGoalMetricsRow, campaignGroupKey, PLATFORM, GOAL } from '../../data/schema';
import { campaignInDateRange } from './paidAdsPageUtils';

const PLATFORM_LABEL = {
  [PLATFORM.META]: 'Meta',
  [PLATFORM.TIKTOK]: 'TikTok',
};

// Plan 탭에서 Event를 선택했을 때만 쓰는 phase(단계) 색 순환 — 임의 hex 대신
// theme palette 토큰만 참조한다(design-system.md 규칙). error는 "문제"라는
// 기존 의미가 있어 순환에서 뺀다.
const PHASE_COLOR_TOKENS = ['info', 'success', 'warning', 'primary', 'secondary'];

// 같은 이름(phase)의 캠페인을 플랫폼별로 묶어 하나의 타임라인 막대 + Budget
// Breakdown 한 행으로 합친다 — "G10 Grand Opening"이 Meta/TikTok 두 캠페인으로
// 나뉘어 있어도 하나의 phase로 취급한다(실사용 피드백: 플랫폼별로 행이
// 중복돼 보이는 게 불편했음). 기간은 두 플랫폼의 시작일 중 이른 날짜~
// 종료일 중 늦은 날짜로 합친다(보통 동일하지만, 혹시 다르더라도 안전).
function buildPhaseTimeline(campaigns) {
  const byName = new Map();
  campaigns.forEach((c) => {
    if (!byName.has(c.name)) byName.set(c.name, []);
    byName.get(c.name).push(c);
  });
  return [...byName.entries()]
    .map(([name, group], index) => {
      const startDate = group.reduce((min, c) => (c.startDate < min ? c.startDate : min), group[0].startDate);
      const endDate = group.reduce((max, c) => (c.endDate > max ? c.endDate : max), group[0].endDate);
      const byPlatform = {};
      group.forEach((c) => {
        byPlatform[c.platform] = { daily: c.budgetDaily ?? null, total: c.budgetPlanned };
      });
      const totalBudget = group.reduce((sum, c) => sum + c.budgetPlanned, 0);
      const days = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      return {
        name,
        startDate,
        endDate,
        days,
        byPlatform,
        totalBudget,
        colorToken: PHASE_COLOR_TOKENS[index % PHASE_COLOR_TOKENS.length],
      };
    })
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
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

// 'YYYY-MM-DD' -> 'M/D' — Plan 표 전용 짧은 표기.
function shortDate(iso) {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
}

function fmtCurrency(value) {
  if (value == null) return '—';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNumber(value) {
  if (value == null) return '—';
  return value.toLocaleString('en-US');
}

function fmtPercent(value) {
  if (value == null) return '—';
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
  if (value == null) return '—';
  return `${value.toFixed(2)}s`;
}

// goal별 컬럼 뒤에 모든 표가 공통으로 붙이는 블록. 위 goalExtraColumns가 "이 목적에서
// 판단 근거가 되는가"로 고르는 것과 달리, 여기 지표는 목적이 아니라 소재가 어땠는지를
// 말한다 — 영상이 붙은 캠페인이면 목적과 무관하게 의미가 있어서 goal별로 나누지 않는다.
// 수기 입력 레코드에는 없는 값이라 '—'로 그려진다.
const CREATIVE_COLUMNS = [
  { header: 'Video Plays', cell: (r) => fmtNumber(r.videoPlays) },
  // Hook Rate = 초반 시청 / 노출, Hold Rate = 완전 시청 / 초반 시청.
  // 계산 함수(calcHookRate/calcHoldRate)는 진작 있었는데 어느 화면에서도 안 쓰였다.
  { header: 'Hook Rate', cell: (r) => fmtPercent(r.hookRate) },
  { header: 'Hold Rate', cell: (r) => fmtPercent(r.holdRate) },
  { header: 'Held Views', cell: (r) => fmtNumber(r.heldViews) },
  { header: 'Avg Watch', cell: (r) => fmtSeconds(r.avgWatchSeconds) },
  { header: 'Likes', cell: (r) => fmtNumber(r.likes) },
  { header: 'Comments', cell: (r) => fmtNumber(r.comments) },
  { header: 'Shares', cell: (r) => fmtNumber(r.shares) },
  { header: 'Follows', cell: (r) => fmtNumber(r.follows) },
  { header: 'Profile Visits', cell: (r) => fmtNumber(r.profileVisits) },
];

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
 * /reports 페이지를 구성하는 섹션. 기간·플랫폼·Event 필터(FilterBar 재사용,
 * 두 탭이 공유)는 탭 위에 두고, 그 아래는 Plan/Performance 두 탭으로 나눈다 —
 * "캠페인 전에 보는 리포트"(계획: 이름·기간·일일/총예산·플랫폼별 예산)와
 * "캠페인 후 리포트"(실적: goal별로 실제 의미 있는 지표)는 답하는 질문 자체가
 * 달라서 하나의 표에 욱여넣으면 어느 쪽도 제대로 못 보여준다는 피드백으로
 * 분리했다.
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
 * Planned Budget에 있던 accent(파란 강조) 색은 의도적으로 뺐다 — Dashboard의
 * KpiBar는 색상을 오직 긴급 알림(isAlert)에만 쓰고 있어서, 예산 숫자에도
 * 색을 넣으면 같은 컴포넌트 안에서 색상이 두 가지 다른 의미(경고 vs 강조)를
 * 갖게 된다.
 *
 * 필터 상태는 이 섹션이 직접 소유한다 — 프레젠테이션 상호작용이라 상위
 * usePaidAdsStore(영속화 대상)로 끌어올리지 않았다.
 *
 * 표 행을 클릭하면 /dashboard?campaign={id}로 이동한다. DashboardPage가
 * 마운트 시 이 쿼리 파라미터를 한 번만 읽어 해당 캠페인 Drawer를 자동으로
 * 연다 — 필터 상태 전체를 두 페이지가 공유하는 것은 아니고, 캠페인 진입점만
 * 딥링크로 연결한다.
 *
 * Props:
 * @param {Campaign[]} campaigns - 캠페인 목록 [Required]
 * @param {PerformanceRecord[]} performanceRecords - 성과 레코드 목록 [Required]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <ReportSummarySection campaigns={campaigns} performanceRecords={performanceRecords} />
 */
export function ReportSummarySection({ campaigns, performanceRecords, sx }) {
  const navigate = useNavigate();
  const [reportTab, setReportTab] = useState('plan');
  const [groupValues, setGroupValues] = useState({ platform: '', campaignGroup: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredCampaigns = campaigns.filter((c) => {
    if (groupValues.platform && c.platform !== groupValues.platform) return false;
    if (groupValues.campaignGroup && campaignGroupKey(c) !== groupValues.campaignGroup) return false;
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

  // FilterBar의 Campaign Group 드롭다운 옵션 — Dashboard와 동일 규칙(명시적으로
  // 태그한 campaignGroup은 1개여도 옵션, 이름만 우연히 겹치는 경우만 2개 이상).
  const explicitGroups = new Set(campaigns.filter((c) => c.campaignGroup).map((c) => c.campaignGroup));
  const nameCounts = campaigns.reduce((counts, c) => {
    const key = campaignGroupKey(c);
    return { ...counts, [key]: (counts[key] ?? 0) + 1 };
  }, {});
  const campaignGroupOptions = Object.keys(nameCounts)
    .filter((key) => explicitGroups.has(key) || nameCounts[key] > 1)
    .map((key) => ({ value: key, label: key }));

  // Plan 탭 — 지금 필터에 걸린 캠페인 전체 기준(Event 선택 여부와 무관).
  const planCampaigns = filteredCampaigns;
  const planBudgetByPlatform = planCampaigns.reduce((acc, c) => {
    acc[c.platform] = (acc[c.platform] ?? 0) + c.budgetPlanned;
    return acc;
  }, {});
  const planTotalBudget = planCampaigns.reduce((sum, c) => sum + c.budgetPlanned, 0);

  // Event를 선택했을 때만 타임라인(Gantt) + Budget Breakdown 뷰를 보여준다 —
  // 여러 Event가 섞인 상태에서 phase별 막대를 그리면 서로 무관한 캠페인들이
  // 같은 타임라인에 뒤섞여 의미가 없다. Event 없이 볼 때는 기존 단순
  // 표(Campaign/Period/Daily/Total)+플랫폼 비율 바를 그대로 쓴다.
  const phases = groupValues.campaignGroup ? buildPhaseTimeline(planCampaigns) : [];
  const timelineStart = phases.reduce((min, p) => (p.startDate < min ? p.startDate : min), phases[0]?.startDate ?? '');
  const timelineEnd = phases.reduce((max, p) => (p.endDate > max ? p.endDate : max), phases[0]?.endDate ?? '');
  const timelineRangeMs = new Date(timelineEnd) - new Date(timelineStart) || 1;
  const timelinePct = (iso) => ((new Date(iso) - new Date(timelineStart)) / timelineRangeMs) * 100;

  // 마일스톤 = 각 phase의 시작일(실사용 확인 완료 — 종료일 기준은 이벤트마다
  // 의미가 달라 일반화하기 어렵고, 시작일은 "다음 단계로 넘어가는 시점"이라는
  // 뜻이 항상 동일하다). 같은 날 시작하는 phase가 여러 개면 마커 하나에
  // 이름을 같이 묶어 표시한다(같은 x 위치에 마커가 겹치지 않도록).
  const milestoneMap = new Map();
  phases.forEach((p) => {
    if (!milestoneMap.has(p.startDate)) milestoneMap.set(p.startDate, []);
    milestoneMap.get(p.startDate).push(p.name);
  });
  const milestones = [...milestoneMap.entries()].map(([date, names]) => ({ date, label: names.join(', ') }));

  const phaseMetaTotal = phases.reduce((sum, p) => sum + (p.byPlatform[PLATFORM.META]?.total ?? 0), 0);
  const phaseTikTokTotal = phases.reduce((sum, p) => sum + (p.byPlatform[PLATFORM.TIKTOK]?.total ?? 0), 0);
  const phaseGrandTotal = phases.reduce((sum, p) => sum + p.totalBudget, 0);

  return (
    <Box sx={sx}>
      <FilterBar
        showSearch={false}
        searchValue=""
        onSearchChange={() => {}}
        filterGroups={[
          {
            key: 'platform',
            label: 'Platform',
            variant: 'segmented',
            options: [
              { value: PLATFORM.META, label: 'Meta' },
              { value: PLATFORM.TIKTOK, label: 'TikTok' },
            ],
          },
          ...(campaignGroupOptions.length > 0
            ? [{ key: 'campaignGroup', label: 'Event', options: campaignGroupOptions }]
            : []),
        ]}
        groupValues={groupValues}
        onGroupChange={(key, value) => setGroupValues((v) => ({ ...v, [key]: value }))}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        sx={{ mb: 3 }}
      />

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
                { label: 'Avg. CPM', value: summary.avgCPM != null ? `$${summary.avgCPM.toFixed(2)}` : '—', sub: 'across reported campaigns' },
              ]
        }
        sx={{ mb: 3 }}
      />

      <Tabs
        value={reportTab}
        onChange={(e, next) => setReportTab(next)}
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Plan" value="plan" sx={{ textTransform: 'none' }} />
        <Tab label="Performance" value="performance" sx={{ textTransform: 'none' }} />
      </Tabs>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          variant="outlined"
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

      {reportTab === 'plan' ? (
        planCampaigns.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
            No campaigns match the current filters.
          </Typography>
        ) : phases.length > 0 ? (
          <Box>
            {/* Event 타임라인(Gantt) — phase(같은 이름의 캠페인, 플랫폼별로 합침)를
                기간에 맞춰 가로 막대로 배치한다. 새 차트 라이브러리 없이 순수
                % 위치 계산(순서: timelinePct)만으로 그린다 — 아래 Budget by
                Platform 막대와 같은 접근(PacingIndicator의 LinearProgress
                문법 재사용 원칙과 동일선상). 마일스톤(수직 점선+라벨)은 각
                phase의 시작일을 자동으로 표시한다. */}
            {/* 바깥 Box(px)는 실제 여백을 만들고, 안쪽 Box(position:relative)는
                패딩 없이 그 안에서만 %로 위치를 계산한다 — absolute 자식의
                left:%는 가장 가까운 position:relative 조상의 "패딩을 포함한"
                박스 기준으로 계산돼서, 같은 Box에 padding과 absolute 자식을
                같이 두면 padding이 % 계산에 반영되지 않는다(실제로 확인한
                버그 — 마일스톤 라벨이 padding을 줬는데도 그대로 화면 밖으로
                잘렸었다). 두 겹으로 나눠야 바깥 padding이 안쪽 %기준 폭 자체를
                줄여서 실제로 여백처럼 동작한다. */}
            {/* 시각 전용 구성(Box 절대위치 + %)이라 <table>/<list> 같은 의미
                구조가 없다 — 스크린리더에 억지로 구조를 씌우기보다, 바로 아래
                Budget Breakdown 표가 이미 같은 데이터(캠페인·기간·예산)를
                접근 가능한 형태로 담고 있으므로 이 블록 전체를 aria-hidden으로
                숨기고 표로 보내는 쪽을 택한다(접근성 리뷰로 발견). */}
            <Box aria-hidden="true" sx={{ px: 12, pt: 9, pb: 3, mb: 4 }}>
              <Box sx={{ position: 'relative' }}>
                {/* 마일스톤(수직 점선+라벨) — 각 phase의 시작일을 자동으로
                    표시한다. top을 인덱스 짝/홀로 번갈아 배치(stagger)하는
                    이유: phase 시작일이 며칠 안 되게 가까우면(예: 7/16과
                    7/20) 라벨 두 개가 겹쳐 보이는 문제가 실제로 있었다. */}
                {milestones.map((m, i) => (
                  <Box
                    key={m.date}
                    sx={{
                      position: 'absolute',
                      left: `${timelinePct(m.date)}%`,
                      top: 24,
                      bottom: 24,
                      borderLeft: '2px dashed',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: i % 2 === 0 ? -28 : -52,
                        left: 0,
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        bgcolor: 'grey.100',
                        color: 'text.secondary',
                        fontWeight: 600,
                        px: 1,
                        py: 0.25,
                        // 숫자 4는 sx borderRadius 곱셈 규칙상 theme.shape.borderRadius(0)와
                        // 곱해져 0px가 된다 — 마일스톤 라벨은 Chip/Badge 역할이라 '4px'
                        // 문자열로 명시(mui-theme.md Surface Radius System, 디자인
                        // 시스템 감사로 발견).
                        borderRadius: '4px',
                      }}
                    >
                      {m.label} ({shortDate(m.date)})
                    </Typography>
                  </Box>
                ))}

                {/* Gantt 막대 — 새 차트 라이브러리 없이 순수 % 위치 계산
                    (timelinePct)만으로 그린다. 아래 Budget by Platform 막대와
                    같은 접근(PacingIndicator의 LinearProgress 문법 재사용
                    원칙과 동일선상). pt:3(margin 아님)은 마일스톤 라벨(가까운
                    stagger 단계, top:-28)의 아래쪽과 겹치지 않기 위한 여백 —
                    margin-top을 썼더니 이 Box가 부모(position:relative, 첫
                    in-flow 자식)와 마진이 겹쳐서(margin collapsing) 여백이
                    안쪽이 아니라 부모 전체를 그대로 밀어버렸다(그러면
                    마일스톤도 같이 내려가서 간격이 그대로 유지되는 버그 —
                    실제로 측정해서 발견함). padding은 겹치지 않아 안전하다. */}
                <Box sx={{ pt: 3 }}>
                {phases.map((p) => {
                  const left = timelinePct(p.startDate);
                  const width = Math.max(timelinePct(p.endDate) - left, 1.5);
                  return (
                    <Box key={p.name} sx={{ position: 'relative', height: 36, mb: 1 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${left}%`,
                          width: `${width}%`,
                          height: '100%',
                          bgcolor: `${p.colorToken}.light`,
                          border: '1px solid',
                          borderColor: `${p.colorToken}.main`,
                          // 차트형 컨테이너(하나의 분석 단위로 스캔되는 phase 막대) 역할이라
                          // '6px' — 숫자 1은 theme.shape.borderRadius(0)와 곱해져 0px가 되는
                          // 버그였다(디자인 시스템 감사로 발견).
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          px: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Typography variant="caption" noWrap sx={{ color: `${p.colorToken}.contrastText`, fontWeight: 600 }}>
                          {p.name} · {shortDate(p.startDate)}–{shortDate(p.endDate)} · ${p.totalBudget.toLocaleString('en-US')}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">{shortDate(timelineStart)}</Typography>
                  <Typography variant="caption" color="text.secondary">{shortDate(timelineEnd)}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Budget Breakdown — phase 하나당 한 행(플랫폼별로 안 쪼갬). 각
                phase가 어느 캠페인 하나에 대응하지 않고 여러 캠페인(플랫폼별)을
                합친 값이라, 위 Plan 표와 달리 행 클릭으로 캠페인 Drawer에 못
                보낸다(어느 캠페인을 열지 애매함) — 그래서 클릭 불가로 둔다. */}
            <Typography variant="overline" sx={{ display: 'block', mb: 1.5, color: 'text.secondary', letterSpacing: '0.08em' }}>
              Budget Breakdown
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
                    <TableRow key={p.name}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: `${p.colorToken}.main`, flexShrink: 0 }} />
                          {p.name}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {shortDate(p.startDate)}–{shortDate(p.endDate)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{p.days}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {p.byPlatform[PLATFORM.META]?.daily != null ? `$${p.byPlatform[PLATFORM.META].daily.toLocaleString('en-US')}` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {p.byPlatform[PLATFORM.META]?.total != null ? `$${p.byPlatform[PLATFORM.META].total.toLocaleString('en-US')}` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {p.byPlatform[PLATFORM.TIKTOK]?.daily != null ? `$${p.byPlatform[PLATFORM.TIKTOK].daily.toLocaleString('en-US')}` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {p.byPlatform[PLATFORM.TIKTOK]?.total != null ? `$${p.byPlatform[PLATFORM.TIKTOK].total.toLocaleString('en-US')}` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        ${p.totalBudget.toLocaleString('en-US')}
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
                        {c.budgetDaily != null ? `$${c.budgetDaily.toLocaleString('en-US')}/day` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${c.budgetPlanned.toLocaleString('en-US')}
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
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary', fontWeight: 600 }}>
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
                    sx={{ height: 6, borderRadius: 0, backgroundColor: 'grey.100' }}
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
        GOAL_META.map(({ value, label }) => {
          const rowsForGoal = goalRows.filter((r) => r.goal === value);
          if (rowsForGoal.length === 0) return null;
          const extraColumns = [...goalExtraColumns(value), ...CREATIVE_COLUMNS];
          return (
            <Box key={value} sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ display: 'block', mb: 1, color: 'text.secondary', letterSpacing: '0.08em' }}>
                Goal: {label}
              </Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Campaign</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Platform</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Spend</TableCell>
                      {extraColumns.map((col) => (
                        <TableCell key={col.header} align="right" sx={{ fontWeight: 600 }}>{col.header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rowsForGoal.map((r) => (
                      <TableRow key={r.campaignId} hover onClick={() => navigate(`/dashboard?campaign=${r.campaignId}`)} sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.name}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{r.platform}</TableCell>
                        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(r.spend)}</TableCell>
                        {extraColumns.map((col) => (
                          <TableCell key={col.header} align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{col.cell(r)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })
      )}
    </Box>
  );
}
