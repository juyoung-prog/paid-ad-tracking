import { MemoryRouter } from 'react-router-dom';
import Box from '@mui/material/Box';
import { ReportSummarySection } from './ReportSummarySection';
import { mockCampaigns, mockPerformanceRecords } from '../../data/paidAdsMockData';
import { PLATFORM, GOAL, TARGET_SCOPE } from '../../data/schema';

/**
 * Gantt 타임라인은 Event(campaignGroup)를 골라야 나타나는데, mockCampaigns에는
 * campaignGroup이 하나도 없어서 그 경로가 스토리에서 한 번도 실행되지 않는다.
 *
 * 아래 데이터는 그 경로를 재현하면서, **실계정에서 실제로 터졌던 네 가지**를
 * 한 화면에 몰아넣는다. 넷 다 목데이터가 너무 깔끔해서 놓쳤던 것들이다.
 *
 * 1. 같은 단계인데 플랫폼마다 이름의 구분자 공백이 다르다 — 사람이 Meta와
 *    TikTok 광고 관리자에서 따로 이름을 짓기 때문이다. campaignNameKey()가
 *    이걸 흡수해 한 막대로 합쳐야 한다("Grand Opening"과 "Now Open" 쌍).
 * 2. Meta가 게시물 부스팅을 캠페인으로 만들 때 캡션 앞부분을 잘라 이름으로
 *    쓴다 — 이름 안에 `타입: 내용` 꼴과 이모지·줄바꿈·말줄임표가 들어온다.
 *    타임라인은 콜론 앞을 굵게 떼어 계획 캠페인과 구분해야 한다.
 * 3. 마지막 phase가 타임라인 끝에서 하루만 도는 경우 — 막대 이름이 차트
 *    오른쪽 밖으로 나가지 않고 막대 오른쪽 끝 기준으로 눕어야 한다.
 * 4. 시작일이 며칠 안 되게 붙은 phase — 축 눈금이 겹치지 않게 걸러져야 한다.
 */
const PHASES = [
  // [id, name, platform, 시작, 종료, 총예산, 일일예산]
  ['g-1a', 'G10_Coming Soon_0617~0707', PLATFORM.TIKTOK, '2026-06-17', '2026-07-07', 1200, null],
  ['g-1b', 'G10_Coming Soon_0617~0707', PLATFORM.META, '2026-06-17', '2026-07-07', 900, 40],
  /* 부스팅 게시물 — 콜론 접두사 + 이모지 + 줄바꿈이 이름에 그대로 들어온 형태.
     총예산이 0인 것도 의도적이다: 동기화 캠페인은 플랫폼에 계획 예산 개념이
     없어 0으로 저장되는데, effectiveBudgetPlanned가 일일예산×기간으로 복원해서
     Budget Breakdown과 PLANNED BUDGET에 실제 금액이 뜨는지 이 행이 확인한다
     ($10 × 8일 = $80). 예전엔 저장된 0을 그대로 써서 화면 전체가 $0이었다. */
  ['g-2', 'Instagram post: 🌟 COMING SOON TO UNION CITY, GA ✨\n🤩Don’t miss...', PLATFORM.META, '2026-06-17', '2026-06-24', 0, 10],
  // 같은 단계인데 Meta 쪽 이름에만 공백이 더 있다 → 한 막대로 합쳐져야 한다
  ['g-3a', 'G10_Grand Opening_0706~0801', PLATFORM.TIKTOK, '2026-07-06', '2026-08-01', 1800, null],
  ['g-3b', 'G10_Grand Opening _0706 ~ 0801', PLATFORM.META, '2026-07-06', '2026-08-01', 1500, 30],
  ['g-4a', 'G10_Now Open_0706~0831', PLATFORM.TIKTOK, '2026-07-06', '2026-08-31', 2400, null],
  ['g-4b', 'G10_Now Open_0706 ~0831', PLATFORM.META, '2026-07-06', '2026-08-31', 2000, 25],
  // 7/6과 나흘 차이 — 축 눈금 최소 간격 판정에 걸리는 자리
  ['g-5', 'G10_1_Month Deals_0710~0831', PLATFORM.TIKTOK, '2026-07-10', '2026-08-31', 900, null],
  // 타임라인 맨 끝에서 하루짜리 — 막대·이름이 축 오른쪽으로 넘치면 안 된다.
  // 두 이름은 대시 문자가 다르다(em dash — vs ASCII -): campaignNameKey가
  // 대시 변형을 접어서 한 막대로 합쳐야 한다(실데이터의 Meta em dash 사례).
  ['g-6a', 'G10_Final Week Push — last-week concentrated spend across all stores', PLATFORM.META, '2026-08-31', '2026-08-31', 600, 600],
  ['g-6b', 'G10_Final Week Push - last-week concentrated spend across all stores', PLATFORM.TIKTOK, '2026-08-31', '2026-08-31', 400, 400],
];

const groupedCampaigns = PHASES.map(([id, name, platform, startDate, endDate, budgetPlanned, budgetDaily]) => ({
  id,
  name,
  campaignGroup: 'G10 Opening',
  platform,
  accountId: platform === PLATFORM.META ? 'meta-bm' : 'tiktok-unified',
  targetScope: TARGET_SCOPE.ALL_STORES,
  targetStoreIds: [],
  startDate,
  endDate,
  budgetPlanned,
  budgetDaily,
  goal: GOAL.TRAFFIC,
  manualStatus: null,
  creativeUrl: '',
  createdAt: '2026-06-01T09:00:00Z',
  updatedAt: '2026-07-20T09:00:00Z',
}));

/**
 * 막대에 `Spend $X`가 붙는 경로를 살리기 위한 성과 기록. 예전 스토리는 빈
 * 배열을 넘겨서 barSuffix가 항상 null이었고, 그래서 지출 표기가 스토리에서
 * 한 번도 렌더되지 않았다.
 *
 * 부스팅 게시물(g-2)에는 일부러 기록을 주지 않는다 — 실계정에도 성과가 없는
 * 캠페인이 섞여 있고, 그때 막대가 '—' 없이 예산까지만 말하는지 봐야 한다.
 */
const groupedPerformance = groupedCampaigns
  .filter((c) => c.id !== 'g-2')
  .map((c, i) => ({
    id: `perf-${c.id}`,
    campaignId: c.id,
    impressions: 120000 + i * 18000,
    reach: 60000 + i * 9000,
    clicks: 1400 + i * 130,
    spend: Math.round(c.budgetPlanned * 0.72 * 100) / 100,
    videoPlays: 70000 + i * 11000,
    avgWatchSeconds: 2.0,
    follows: 4 + i,
    profileVisits: 200 + i * 40,
    hookViews: 6000 + i * 900,
    heldViews: 900 + i * 120,
    engagements: null,
    conversions: null,
  }));

export default {
  title: 'Paid Ads Dashboard/Section/ReportSummarySection',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## ReportSummarySection

/reports 페이지를 구성하는 섹션. 기간·플랫폼·Event 필터(FilterBar) + 요약
통계(KpiBar) + Plan/Performance 두 탭. Store 필터는 없다 — 이 페이지의 핵심
질문은 "어떤 Event에 어떤 캠페인이 있나"라서 Event가 1급 필터고, Event를
이미 골랐으면 Store로 또 좁힐 일이 실질적으로 없다(실사용 피드백으로 제거).
Plan 탭은 Event를 선택하면 Gantt 타임라인 + Budget Breakdown 표로, Performance
탭은 goal별로 다른 컬럼의 표(PerformanceReportTable이 아니라 schema.js
getGoalMetricsRow() 기반 자체 렌더링)로 보여준다. 행 클릭 시 /dashboard?
campaign={id}로 이동 — useNavigate를 쓰므로 스토리에서도 MemoryRouter로 감싼다.

### 헤더는 한 줄이다
컬럼 그룹 라벨 행(COST/PERFORMANCE/VIDEO/ENGAGEMENT)을 걷어냈다. 두 가지가
걸렸기 때문이다 — Campaign·Platform에는 얹을 그룹이 없어 **표 위에 빈 자리**가
생겼고, 그 행만큼 헤더가 두꺼워져 라벨이 접히는 컬럼과 겹치면 세 줄이 됐다.
레퍼런스(influencer tracking dashboard)의 성과 표도 헤더가 한 줄뿐이고 그룹
개념이 없다. 그룹은 이제 **컬럼 순서와 경계 세로선**으로만 남는다.

같은 이유로 라벨을 짧게 잡고(\`Video Plays\`→\`Plays\`, \`Hook Rate\`→\`Hook\`,
\`Avg Watch\`→\`Watch\`) 헤더에 nowrap을 건다. 폭이 부족하면 줄바꿈이 아니라
**옆 컬럼 침범**이 되므로, 컬럼 폭은 "라벨 + ⓘ + 패딩"이 들어가는 최소치로 잡혀
있다 — 라벨을 바꾸면 폭도 같이 봐야 한다.

### 중앙값은 제목과 툴팁에 있다
한때 헤더 안에 \`med 5.47%\` 한 줄로 붙였는데 그게 헤더를 세 줄로 만든 원인이었다.
레퍼런스처럼 **대표 중앙값 하나만 섹션 제목**에 적고(\`— 40 campaigns · median
CPM $2.94\`), 컬럼별 중앙값은 ⓘ 툴팁이 갖는다. 대표 지표는 그 goal의 첫 번째
벤치마크 컬럼이다 — 컬럼 순서가 이미 "그 목적에서 판단 근거가 되는 순서"라
첫 번째가 대표가 된다.

### 행이 세 가지 상태로 갈린다
- **정상** — 지표를 그린다
- \`No performance data yet\` — 성과 레코드가 아예 없다(전 컬럼 '—')
- \`Never delivered — no spend, no impressions\` — 레코드는 있는데 지출도 노출도 0이다

셋째를 따로 두는 이유: 그냥 그리면 \`$0.00 · 0 · 0 · 0s · 0\`이 한 줄로 늘어서고
\`Watch 0s\`가 **"0초를 시청했다고 측정했다"**로 읽힌다. 실제로는 노출이 0이라
측정할 게 없었다 — 이 앱의 "모르는 값과 0을 구분한다" 원칙의 뒷면이다.

**노출까지 0일 때만** 이 판정을 쓴다. 돈은 썼는데 노출이 0인 캠페인(진짜 문제)은
정상 행으로 그려서 숫자가 그대로 보이게 둔다.

### 남는 폭은 컬럼들이 나눠 갖는다
\`width:100%\` + \`minWidth: tableWidth\`이고 **여백 열은 없다.** table-layout:fixed에서
지정 폭의 합이 표 폭보다 작으면 브라우저가 남은 폭을 지정 폭에 비례해 각 컬럼에
나눠준다. 그래서 colgroup의 px 값은 절대 폭이 아니라 **비율의 기준이자 좁을 때의
하한선**이다.

이 자리를 두 번 고쳤다. 원래는 폭 미지정 여백 열이 남는 폭을 흡수해서 goal 표끼리
오른쪽 끝선을 공유하게 했다(그룹 경계 정렬용). 그룹 라벨 행을 걷어내며 맞출 대상이
사라지자 마지막 컬럼 너머로 이어지는 **빈 행 구분선**만 남았고, 그래서 표를 콘텐츠
폭으로 고정했다 — 그건 방향이 틀렸다. 선은 사라졌지만 그 자리에 흰 여백이 그대로
남아 오히려 더 비어 보였다. 없애야 할 건 선이 아니라 **빈 공간 자체**였다.

### 행을 클릭하면 그 자리에서 상세가 열린다
예전엔 \`/dashboard?campaign={id}\`로 이동했다. Reports는 비교하는 화면인데 한 행을
확인하려고 페이지를 떠나면 맥락이 날아간다 — 필터는 URL에 있어 살아남지만
**스크롤 위치와 페이지 번호는 안 살아난다**(Traffic 8페이지 중 7페이지에서 보고
돌아오면 1페이지). 이제 CampaignDetailPanel이 그 자리에서 열리고, 고칠 게 있을
때만 \`Edit on Dashboard\`로 간다.

### 전 컬럼을 보여준다 — 가로 스크롤은 결함이 아니다
한동안 Reach·Plays·Comments·Shares·Follows·Visits를 표에서 빼고 상세 패널에만
뒀다(가로 스크롤을 없애려고). 되돌렸다 — 결국 만든 사람조차 "왜 Likes에서
끝나나"를 다시 물었고, 결정적으로 **이 도구의 사용자가 매일 쓰는 Meta 광고
관리자가 가로 스크롤 테이블이다**: '—' 셀도 그대로 두고 첫 컬럼을 고정한 채
옆으로 넘긴다. 그게 이 카테고리의 표준 문법이고 우리도 같은 장치(Campaign
sticky + 스크롤 그림자)가 이미 있다. 스크롤을 없애겠다고 데이터를 클릭 뒤로
숨기는 쪽이 오히려 비표준이었다.

전부 비어 있는 컬럼은 표 단위로 자동으로 빠진다 — Meta만 있는 표에서는
TikTok 전용인 Follows·Visits가 알아서 사라진다.

### 행을 클릭하면 그 자리에서 상세가 열린다
예전엔 \`/dashboard?campaign={id}\`로 이동했다. Reports는 비교하는 화면인데 한 행을
확인하려고 페이지를 떠나면 맥락이 날아간다 — 필터는 URL에 있어 살아남지만
**스크롤 위치와 페이지 번호는 안 살아난다**(Traffic 8페이지 중 7페이지에서 보고
돌아오면 1페이지). 이제 CampaignDetailPanel이 그 자리에서 열리고, 고칠 게 있을
때만 \`Edit on Dashboard\`로 간다.

### 표에서 뺀 컬럼
\`Reach\`(Impressions와 강하게 붙어 다니고 둘의 비를 이 표에서 쓰는 판단이 없다),
\`Plays\`(영상 광고에서 Impressions와 사실상 같은 축), 그리고 소셜 지표 넷.
goal 컬럼도 고정 총폭(goalRegion) 분할을 그만두고 각자 폭을 갖는다 — 컬럼이 적은
표에서 \`CPM $2.34\` 하나가 187px를 차지하던 낭비가 있었다. 결과적으로 표 폭이
1,584 → 1,300~1,368px가 되어 1633px 창에서도 가로 스크롤이 사라진다.
빠진 값은 전부 상세 패널에 있다.

### 소셜 지표는 표에 없다
\`Comments · Shares · Follows · Visits\`는 표에 넣지 않는다. 한때 토글로 접었다
폈다 하게 뒀는데 **눌러도 화면이 안 변했다**(실사용 신고). 데이터가 없어서가
아니다 — Awareness 39건 중 comments 29·follows 26건에 값이 있다. 위치가 문제였다:
접힌 표가 이미 1,584px인데 화면 콘텐츠 폭이 1,648px이라, 펴면 388px이 통째로
오른쪽 화면 밖으로 나갔다. 있으나 마나 한 컨트롤이었다.

이 지표들은 **캠페인 상세 드로어의 PlatformMetricList가 이미 전부** 보여준다.
표에서 행을 클릭하면 \`/dashboard?campaign={id}\`로 이동해 그 드로어가 열린다.
거기는 폭 제약이 없고 값 없는 지표는 알아서 숨기므로 원래 그 자리가 맞다.
표의 일은 "캠페인끼리 비교"인데, 화면 밖 컬럼은 비교에 아무 기여를 못 한다.

\`Likes\`만 남긴다 — 화면 안에 들어오고 39건 중 36건에 값이 있어 실제로 훑어
비교된다. 나머지가 어디 있는지는 \`Likes\` 헤더의 ⓘ가 알려준다.

### 컬럼 헤더의 ⓘ### 컬럼 헤더의 ⓘ
컬럼 헤더마다 정의 툴팁(ⓘ)이 붙는다. 예전엔 Hook/Hold Rate 둘만 native \`title\`이라
**보이는 신호가 없었고 터치 기기에서는 아예 열리지 않았다** — CPM·CTR·CPA는 광고를
매일 다루지 않는 사람에게 자명하지 않고, 플랫폼마다 정의가 다른 지표가 한 표에 섞여
있다.

중앙값은 **이 표 자신의** 값이다. 외부 벤치마크는 이 앱에 없지만 "우리 평균보다
나은가"는 대부분의 판단에 충분하다.
- **평균이 아니라 중앙값**인 이유: $10짜리 부스팅 게시물과 $2,000짜리 캠페인이 한
  표에 섞여 있어 산술평균은 극단값에 끌려간다
- **현재 페이지가 아니라 표 전체** 기준: 페이지마다 기준선이 달라지면 같은 값이
  페이지를 넘길 때 좋아 보였다 나빠 보였다 한다
- 값이 있는 행이 **3건 미만이면 표시하지 않는다** — 그 표본으로 "평균"을 말하면
  근거 없는 권위를 준다

### Plan 목록의 \`Not linked\` 배지
계획은 \`plans.name = campaigns.campaignGroup\` 문자열로만 실제와 붙는다. 매칭되는
캠페인이 0건이면 배지를 상시 표시해서, **"실제 $0"이 "안 썼다"가 아니라 "안 붙었다"**
임을 구분한다(저장 시점 경고만으로는 부족하다 — 무시하고 저장할 수도 있고, 나중에
캠페인 쪽 태그가 바뀌어 끊어질 수도 있다).
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <MemoryRouter>
      <Box>
        <ReportSummarySection campaigns={mockCampaigns} performanceRecords={mockPerformanceRecords} />
      </Box>
    </MemoryRouter>
  ),
};

/**
 * Event(G10 Opening)를 고른 상태 — 두 탭이 공유하는 Gantt 타임라인이 나온다.
 * 캠페인 10건이 들어가지만 phase는 **6개**로 합쳐져야 정상이다.
 *
 * 확인 포인트:
 * - 이름이 어긋난 네 쌍이 각각 한 막대로 합쳐지고 `Meta + TikTok`이 붙는가 —
 *   구분자 공백 차이 세 쌍(Coming Soon·Grand Opening·Now Open)과
 *   대시 문자 차이 한 쌍(Final Week Push: em dash — vs ASCII -)
 * - 부스팅 게시물 줄만 `Instagram post`가 굵고 뒤 캡션은 보통 굵기인가
 *   (이름 안의 줄바꿈이 한 줄로 접히는지도 같이 본다)
 * - 막대 안이 `기간 · $일일예산/day · $총예산 · Spend $X` 순인가.
 *   성과가 없는 부스팅 게시물 막대는 Spend 없이 끝나야 한다
 * - PLANNED BUDGET이 `$0`이 아닌가 — 총예산 0 + 일일예산 있는 행(부스팅 게시물,
 *   $10/day × 8일)이 $80으로 복원돼 합계에 들어가야 한다. Budget Breakdown의
 *   Total 컬럼도 '—'가 아니어야 한다
 * - 축 눈금이 `6/17 · 7/6 · 7/10 · 8/31`인가 — 7/6과 7/10은 붙어 있지만
 *   최소 간격을 넘어 둘 다 남고, 양 끝은 예외 없이 남는다.
 *   눈금이 버려진 날짜에는 세로 점선도 없어야 한다(날짜 없는 선 금지)
 * - 마지막 하루짜리 phase(8/31)의 **막대와 이름이 축 오른쪽 끝을 넘지 않는가**
 *   — 최소 폭 보정(1.5%)만큼 왼쪽으로 되밀려 오른쪽 끝이 8/31 눈금에 붙는다
 * - 타임라인 시작(6/17)에는 세로 점선이 없는가 — 축 원점과 겹치는 점선은
 *   구간 경계가 아니라 y축처럼 읽혀서 긋지 않는다
 */
export const EventTimeline = {
  name: 'Event Timeline (Gantt)',
  render: () => (
    <MemoryRouter>
      <Box>
        <ReportSummarySection campaigns={groupedCampaigns} performanceRecords={groupedPerformance} />
      </Box>
    </MemoryRouter>
  ),
};

/**
 * phase가 상한(PHASE_TIMELINE_MAX_PHASES=15)을 넘는 그룹 — 실계정의 "noname"
 * (부스팅 게시물 96건, 79 phases) 재현. 이름이 전부 달라 phase로 안 합쳐지고,
 * 기간이 길어 축이 늘어나면 막대가 전부 최소폭이 된다. 그 상태의 차트는 첫
 * 글자만 남은 막대 + 점선 도배라 정보가 0이었다(issue/i-1, i-2) — 그리지 않는
 * 것이 정상 동작이다.
 *
 * 확인 포인트:
 * - Plan 탭: 타임라인 대신 `Too many phases...` 안내 한 줄, 바로 아래 Budget
 *   Breakdown 표는 20행 전부 그대로 나온다
 * - Performance 탭: Event timeline 섹션이 **제목까지 통째로** 없다 — 차트가
 *   하던 약속(spend per phase)은 goal별 표가 이미 지키고 있어서, 안내만 남기면
 *   빈 섹션이 된다
 */
export const TimelineOverload = {
  name: 'Timeline hidden (too many phases)',
  render: () => {
    // 20건 — 상한(15)을 넘되 스토리 스크롤이 감당되는 크기. 두 달에 하나씩
    // 부스팅해서 실데이터처럼 축이 몇 년으로 늘어난 상태를 만든다.
    const campaigns = Array.from({ length: 20 }, (_, i) => {
      const year = 2024 + Math.floor(i / 6);
      const month = String(((i * 2) % 12) + 1).padStart(2, '0');
      return {
        id: `nn-${i}`,
        name: `Instagram post: boosted caption #${i + 1} 🌟 Don’t miss...`,
        campaignGroup: 'noname',
        platform: PLATFORM.META,
        accountId: 'meta-bm',
        targetScope: TARGET_SCOPE.ALL_STORES,
        targetStoreIds: [],
        startDate: `${year}-${month}-05`,
        endDate: `${year}-${month}-09`,
        budgetPlanned: 0,
        budgetDaily: 10,
        goal: GOAL.ENGAGEMENT,
        manualStatus: null,
        creativeUrl: '',
        createdAt: '2026-06-01T09:00:00Z',
        updatedAt: '2026-07-20T09:00:00Z',
      };
    });
    return (
      <MemoryRouter>
        <Box>
          <ReportSummarySection campaigns={campaigns} performanceRecords={[]} />
        </Box>
      </MemoryRouter>
    );
  },
};

/**
 * Performance 표의 **행 상태 네 가지**를 한 화면에 모은다. 문서로만 설명하던
 * 분기를 실제로 그려서, 판정이 바뀌면 여기서 바로 드러나게 한다.
 *
 * 확인 포인트:
 * - `Delivered normally` — 지표가 그대로 그려진다
 * - `No record at all` — 성과 레코드가 없어 `No performance data yet` 한 칸으로 합쳐진다
 * - `Never ran` — 레코드는 있지만 지출·노출이 0이라
 *   `Never delivered — no spend, no impressions`가 된다. 그냥 그리면
 *   `$0.00 · 0 · 0 · 0s · 0`이 늘어서고 **`Watch 0s`가 "0초를 시청했다고 측정했다"로
 *   읽힌다** — 실제로는 노출이 0이라 측정할 게 없었다
 * - `Spent but no impressions` — **접히면 안 된다.** 돈은 나갔는데 노출이 0인 건
 *   진짜 문제라 숫자가 그대로 보여야 한다. 이 행이 "Never delivered"로 합쳐지면
 *   가장 중요한 이상 신호가 문장 뒤로 숨는다
 */
export const RowStates = {
  name: 'Row states (delivered / no record / never ran)',
  render: () => {
    const base = {
      campaignGroup: 'Row States',
      platform: PLATFORM.META,
      accountId: 'meta-bm',
      targetScope: TARGET_SCOPE.ALL_STORES,
      targetStoreIds: [],
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      budgetPlanned: 0,
      budgetDaily: 20,
      goal: GOAL.AWARENESS,
      manualStatus: null,
      creativeUrl: '',
      createdAt: '2026-06-01T09:00:00Z',
      updatedAt: '2026-07-20T09:00:00Z',
    };
    const campaigns = [
      { ...base, id: 'rs-1', name: 'Delivered normally' },
      { ...base, id: 'rs-2', name: 'No record at all' },
      { ...base, id: 'rs-3', name: 'Never ran' },
      { ...base, id: 'rs-4', name: 'Spent but no impressions' },
    ];
    const blank = {
      reach: null, clicks: null, videoPlays: null, hookViews: null, heldViews: null,
      avgWatchSeconds: null, likes: null, comments: null, shares: null,
      follows: null, profileVisits: null, engagements: null, conversions: null,
    };
    const performanceRecords = [
      {
        id: 'p-1', campaignId: 'rs-1', ...blank,
        impressions: 125877, reach: 59373, spend: 346.79,
        videoPlays: 74587, hookViews: 8937, heldViews: 766, avgWatchSeconds: 2, likes: 12,
      },
      // rs-2에는 레코드를 아예 안 만든다 → "No performance data yet"
      { id: 'p-3', campaignId: 'rs-3', ...blank, impressions: 0, spend: 0, heldViews: 0, avgWatchSeconds: 0, likes: 0 },
      { id: 'p-4', campaignId: 'rs-4', ...blank, impressions: 0, spend: 120.5, heldViews: 0, avgWatchSeconds: 0, likes: 0 },
    ];
    return (
      <MemoryRouter>
        <Box>
          <ReportSummarySection campaigns={campaigns} performanceRecords={performanceRecords} />
        </Box>
      </MemoryRouter>
    );
  },
};
