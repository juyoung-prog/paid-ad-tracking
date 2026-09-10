import Box from '@mui/material/Box';
import { PhaseTimelineChart } from './PhaseTimelineChart';
import { MOCK_TODAY } from './paidAdsPageUtils';
import { money } from '../../utils/format';

/**
 * buildPhaseTimeline()이 만드는 모양 그대로. 실계정 "G10 Opening"에서 가져온
 * 다섯 단계다 — 넷은 Meta·TikTok 두 캠페인이 한 막대로 합쳐졌고, 하나는
 * 부스팅 게시물(이름에 타입 접두사·이모지·줄바꿈이 그대로 들어온다)이다.
 */
const PHASES = [
  {
    key: 'instagram post: coming soon to union city',
    name: 'Instagram post: 🌟 COMING SOON TO UNION CITY, GA ✨\n🤩Don’t miss...',
    platformLabel: 'Meta',
    startDate: '2026-06-17',
    endDate: '2026-06-24',
    totalDaily: 10,
    totalBudget: 80,
  },
  {
    key: 'g10 coming soon',
    name: 'G10_Coming Soon_0617~0707',
    platformLabel: 'Meta + TikTok',
    startDate: '2026-06-17',
    endDate: '2026-07-07',
    totalDaily: 20,
    totalBudget: 420,
  },
  {
    key: 'g10 grand opening',
    name: 'G10_Grand Opening_0706~0801',
    platformLabel: 'Meta + TikTok',
    startDate: '2026-07-06',
    endDate: '2026-08-01',
    totalDaily: 60,
    totalBudget: 1620,
  },
  {
    key: 'g10 now open',
    name: 'G10_Now Open_0706~0831',
    platformLabel: 'Meta + TikTok',
    startDate: '2026-07-06',
    endDate: '2026-08-31',
    totalDaily: 20,
    totalBudget: 1140,
  },
  {
    key: 'g10 1 month deals',
    name: 'G10_1_Month Deals_0710~0831',
    platformLabel: 'Meta + TikTok',
    startDate: '2026-07-10',
    endDate: '2026-08-31',
    totalDaily: 20,
    totalBudget: 1060,
  },
];

/** Performance 탭이 막대 옆에 붙이는 실지출 */
const SPEND_BY_KEY = {
  'g10 coming soon': 699.68,
  'g10 grand opening': 1716.14,
  'g10 now open': 2051.18,
  'g10 1 month deals': 1601.77,
};
const spendSuffix = (phase) =>
  (SPEND_BY_KEY[phase.key] != null ? `${money(SPEND_BY_KEY[phase.key])} spent` : null);

export default {
  title: 'Paid Ads Dashboard/Data Display/PhaseTimelineChart',
  component: PhaseTimelineChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## PhaseTimelineChart

Event(캠페인 그룹)를 이루는 phase들을 실제 기간에 맞춰 얇은 가로 막대로 배치하는
타임라인. 차트 라이브러리 없이 % 위치 계산만으로 그린다.

### 표 + 막대
왼쪽 두 열은 표다 — Campaign(표시 이름 + 기간·일수)과 Platform / Budget(/ Spend).
오른쪽이 시간 축인데 **막대 안에는 아무 글자도 없다.** 예전엔 24px 막대 안에
기간·예산·지출을 한 줄로 욱여넣어서 좁은 막대에서는 첫 글자만 남았다. 이제 숫자는
전부 왼쪽 열이 말하고 막대는 "언제부터 언제까지"만 말한다. 시작·종료일은 막대 밖
아래에 작게 붙는다.

왼쪽 두 열은 **고정폭**(320px · 300px)이고 남는 폭은 전부 타임라인이 가진다 —
비율로 나누면 넓은 화면에서 글자 열까지 같이 늘어나 시간 축만 손해다.

### 색
막대는 기본이 중립 회색(\`chart.bar\`)이고 파랑(\`chart.barEmphasis\`)은 강조된
하나에만 쓴다 — \`today\`에 진행 중이거나 \`emphasizedKey\`로 지목된 phase다. 모든
막대가 파랑이면 강조가 성립하지 않는다. 행에 마우스를 올리면 그 행의 막대만
파랑이 된다.

### 축
월 라벨(14px) + 규칙적인 주 눈금(11px) 두 단이고, 눈금 간격은 축의 **실제 픽셀
폭**으로 정한다(1·2·7·14·28일 중 라벨이 겹치지 않는 가장 촘촘한 값). phase 시작일
마다 긋던 마일스톤 점선은 없다 — 옅은 세로 격자와 막대 끝 날짜가 같은 정보를 더
조용히 준다.

### 접근성
왼쪽 두 열은 평문이라 그대로 읽힌다. 막대·격자·축 라벨은 시각 전용이라
\`aria-hidden\`으로 숨기고, 기간은 이름 아래 텍스트가 말한다. \`onPhaseClick\`을 주면
행 **전체**가 버튼이 된다 — 하루짜리 phase는 막대가 몇 px뿐이라 막대만 과녁으로
삼을 수 없다.

### 인쇄(2026-09-10)
같은 차트가 \`@media print\`에서 세로 Letter 치수로 갈아입는다 — 인쇄용 타임라인을 따로 만들지 않는다.
열 비율은 320/300/나머지 대신 **23% / 17% / 60%**, 눈금은 주 단위 대신 각 달의 **1일·15일과 기간 양 끝** 중
서로 12%(≈52px) 이상 떨어진 것만(막대 위치는 눈금과 무관하게 실제 날짜 그대로), 월 라벨은 구간이 11% 이상일 때만.
막대는 배경색이 아니라 **선**으로 그린다 — 브라우저 인쇄의 "배경 그래픽"이 기본으로 꺼져 있어 배경색 막대는
통째로 사라지기 때문이다. 강조(파랑)는 인쇄에서 쓰지 않는다(흑백에서 뜻을 잃는다).
        `,
      },
    },
  },
  argTypes: {
    phases: { control: 'object', description: 'buildPhaseTimeline()이 만든 phase 배열' },
    barSuffix: { control: false, description: '플랫폼/예산 열 끝에 덧붙일 문자열을 돌려주는 함수 (phase) => string|null. 주면 헤더가 `Platform / Budget / Spend`로 바뀐다' },
    today: { control: 'date', description: '기준일. 이 날짜에 진행 중인 phase 막대가 강조된다' },
    emphasizedKey: { control: 'text', description: '강조할 phase의 key. today보다 우선한다' },
    onPhaseClick: { action: 'phaseClicked', description: '행 클릭 핸들러 (phase) => void. 주면 행이 눌리는 객체가 된다' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/**
 * Performance 탭 — 실지출이 붙은 형태.
 *
 * 확인 포인트:
 * - 헤더 둘째 열이 `Platform / Budget / Spend`인가(barSuffix가 있을 때만)
 * - 오늘(7/20)에 진행 중인 세 막대만 파랑이고, 끝난 두 개는 회색인가
 * - 막대 안에 글자가 없고 시작·종료일이 막대 밖 아래에 붙는가
 * - 첫 줄 이름에서 매장 코드(`G10_`)와 기간 접미사(`_0617~0707`)가 벗겨졌는가 —
 *   원본은 hover 툴팁에만 있다
 * - 부스팅 게시물 행도 다른 행과 같은 두 줄인가(이름 안의 줄바꿈이 한 줄로 접힌다)
 */
export const Performance = {
  args: {
    phases: PHASES,
    today: MOCK_TODAY,
    barSuffix: spendSuffix,
  },
  render: (args) => <PhaseTimelineChart {...args} />,
};

/**
 * Plan 탭 — 계획만 있고 실지출이 없는 형태(`barSuffix`를 안 넘긴다).
 *
 * 확인 포인트: 헤더 둘째 열이 `Platform / Budget`인가 — 이 열에 지출이 없는데
 * 헤더가 `Spend`를 약속하면 안 된다.
 */
export const PlanOnly = {
  args: {
    phases: PHASES,
    today: MOCK_TODAY,
  },
  render: (args) => <PhaseTimelineChart {...args} />,
};

/**
 * 행을 누를 수 있는 상태 — Reports가 실제로 쓰는 형태다. 누르면 호출부가
 * PhaseDetailPanel을 연다.
 *
 * 확인 포인트:
 * - 행 위에서 커서가 포인터인가, hover 시 행 배경과 막대 색이 같이 바뀌는가
 * - Tab으로 행에 포커스가 가고 Enter/Space로 눌리는가(포커스 링은 앱 공통 문법)
 * - 하루짜리 phase에서도 **행 전체**가 과녁인가
 */
export const Clickable = {
  args: {
    phases: PHASES,
    today: MOCK_TODAY,
    barSuffix: spendSuffix,
  },
  render: (args) => <PhaseTimelineChart {...args} />,
};

/**
 * 하루짜리 phase와 축 끝 처리.
 *
 * 마지막 단계가 타임라인 오른쪽 끝에서 하루만 도는 경우다. 축은 데이터보다
 * 양쪽으로 조금 넓어서(전체 기간의 3%) 끝점 원과 날짜 라벨이 잘리지 않는다.
 *
 * 확인 포인트:
 * - 8/31 막대가 점 하나로 보이고, 날짜 라벨이 오른쪽으로 넘치지 않는가
 * - 좁은 막대는 시작·종료일을 따로 못 적으므로 `Aug 31` 한 줄로 합쳐지는가
 */
export const SingleDayPhase = {
  args: {
    phases: [
      PHASES[3],
      {
        key: 'g10 final week push',
        name: 'G10_Final Week Push — last-week concentrated spend across all stores',
        platformLabel: 'Meta + TikTok',
        startDate: '2026-08-31',
        endDate: '2026-08-31',
        totalDaily: 1000,
        totalBudget: 1000,
      },
    ],
    today: MOCK_TODAY,
    barSuffix: spendSuffix,
  },
  render: (args) => <PhaseTimelineChart {...args} />,
};

/**
 * 좁은 컨테이너 — Plan 탭처럼 카드가 폭을 제한하는 자리.
 *
 * 확인 포인트: 눈금 간격이 **주 단위에서 2주 단위로 벌어지는가**. 간격은 %가
 * 아니라 축의 실제 픽셀 폭으로 정하므로, 같은 기간이라도 좁으면 눈금이 준다 —
 * 라벨이 겹치는 대신 수가 줄어야 한다.
 */
export const NarrowContainer = {
  args: {
    phases: PHASES,
    today: MOCK_TODAY,
    barSuffix: spendSuffix,
  },
  render: (args) => (
    <Box sx={{ maxWidth: 900 }}>
      <PhaseTimelineChart {...args} />
    </Box>
  ),
};

/**
 * 강조를 직접 지목한 경우 — `emphasizedKey`는 `today` 판정보다 우선한다.
 *
 * 확인 포인트: 오늘 진행 중인 막대가 아니라 지목한 `G10_Coming Soon`(이미 끝난
 * 단계)만 파랑인가.
 */
export const EmphasizedKey = {
  args: {
    phases: PHASES,
    today: MOCK_TODAY,
    emphasizedKey: 'g10 coming soon',
    barSuffix: spendSuffix,
  },
  render: (args) => <PhaseTimelineChart {...args} />,
};
