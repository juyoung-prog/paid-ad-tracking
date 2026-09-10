import Box from '@mui/material/Box';
import { RecapPrintTimeline } from './RecapPrintTimeline';
import { buildPhaseTimeline } from '../../pages/paidAdsDashboard/paidAdsPageUtils';
import { mockRecapCampaigns } from '../../data/paidAdsMockData';

const eventCampaigns = mockRecapCampaigns.filter((c) => c.campaignGroup === 'G10 Opening');
const phases = buildPhaseTimeline(eventCampaigns);
const phaseSpend = Object.fromEntries(phases.map((p) => [p.key, p.totalBudget * 0.93]));

/** 종이 폭 흉내 — Letter 세로의 내용 폭(216mm − 좌우 12mm ≈ 726px). 인쇄에서 실제로 받는 폭이다 */
const PAPER_SX = { width: 726, maxWidth: '100%', mx: 'auto', p: 3, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' };
const onPaper = (args) => (
  <Box sx={PAPER_SX}>
    <RecapPrintTimeline {...args} />
  </Box>
);

export default {
  title: 'Paid Ads Dashboard/Data Display/RecapPrintTimeline',
  component: RecapPrintTimeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapPrintTimeline

인쇄본(Letter 세로)의 타임라인 — 화면 타임라인(PhaseTimelineChart)과 **같은 그림**이되 세로 종이 폭에
맞춰 치수를 다시 잡은 것이다. 인쇄에서 타임라인을 표(기간·일수 목록)로 바꾸지 않는 이유는 표가
답하지 못하는 질문이 있기 때문이다 — **어느 캠페인이 겹쳤나, 얼마나 오래 갔나**는 막대의 위치와
길이만 답한다.

\`transform: scale()\`로 화면 차트를 줄이지 않는다. 줄이면 글자가 6pt 아래로 내려가고 격자가 뭉갠다.

### 치수(인쇄 전용)
- **왼쪽 40%**: 부르는 이름(9pt/600) / 플랫폼 / "40/day · 840 planned · 699.68 spent"(달러 표기)(7.5pt)
- **오른쪽 60%**: 월 라벨(8pt/600, 자기 구간 위 — 구간이 11% 미만이면 생략) + 날짜 눈금(7pt) + 옅은 세로 격자
- **눈금 밀도**: 후보는 각 달의 **1·15일**과 기간 **양 끝**, 앞 눈금과 12%(≈52px) 미만이면 버린다 →
  G10 Opening에서 Jun 17 · Jul 1 · Jul 15 · Aug 1 · Aug 15 · Aug 31 여섯 개. 막대 위치는 눈금과 무관하게 **실제 날짜**를 쓴다
- **막대**: 4px 중립 회색(\`chart.bar\`) 하나 + 양 끝 6px 점. 화면의 파랑 강조(진행 중·선택)는 인쇄에서 쓰지 않는다 — 흑백에서 뜻을 잃는다
- **날짜 라벨**: 막대 밖 아래. 막대가 축의 30% 미만으로 좁으면 "Jun 17 – Jun 24" 한 줄로 합친다

### 이름
\`phaseDisplayName\`(recapRowView) — 화면 타임라인과 같은 규칙이라 내부 이름(\`G10_Coming Soon_0617~0707\`)이
인쇄에 새어 나오지 않는다. \`Instagram post: …\` 꼴은 캡션이 이름이 된다.

### 계산은 하지 않는다
\`phases\`는 \`paidAdsPageUtils\`의 \`buildPhaseTimeline()\` 결과 그대로다.
        `,
      },
    },
  },
  argTypes: {
    phases: { control: false, description: 'buildPhaseTimeline() 결과' },
    phaseSpend: { control: 'object', description: 'phase.key → 지출 합. 없으면 예산만 적는다' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
  },
};

/**
 * G10 Opening — 확인 포인트:
 * - 월 라벨(Jun/Jul/Aug 2026)과 날짜 눈금이 서로, 그리고 막대 끝 날짜와 겹치지 않는가
 * - Now Open(Jul 6 – Aug 31)과 1 Month Deals(Jul 10 – Aug 31)의 **겹침**이 눈에 보이는가
 * - 이름이 부르는 이름인가(`G10_Now Open_0706~0831`이 아니라 `Now Open`)
 */
export const Default = { args: { phases, phaseSpend }, render: onPaper };

/** 지출이 아직 없을 때 — 예산만 적고 줄이 하나 줄어든다 */
export const PlannedOnly = { args: { phases, phaseSpend: {} }, render: onPaper };

/** 단계가 하나뿐일 때 — 축은 그 기간에 맞춰 잡히고 눈금은 양 끝만 남을 수 있다 */
export const SinglePhase = { args: { phases: phases.slice(1, 2), phaseSpend }, render: onPaper };
