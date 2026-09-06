import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { PhaseDetailPanel } from './PhaseDetailPanel';
import { PLATFORM } from '../../data/schema';

/** buildPhaseTimeline()이 만드는 phase 한 건 — 같은 단계를 Meta·TikTok에 나눠 돌린 경우 */
const PHASE = {
  key: 'g10 now open',
  name: 'G10_Now Open_0706~0831',
  platformLabel: 'Meta + TikTok',
  startDate: '2026-07-06',
  endDate: '2026-08-31',
  totalDaily: 45,
  totalBudget: 2565,
};

const CAMPAIGNS = [
  { id: 'c-meta', name: 'G10_Now Open_0706 ~0831', platform: PLATFORM.META, spend: 1119.3, thumbnailUrl: null },
  { id: 'c-tiktok', name: 'G10_Now Open_0706~0831', platform: PLATFORM.TIKTOK, spend: 931.88, thumbnailUrl: null },
];

export default {
  title: 'Paid Ads Dashboard/Templates/PhaseDetailPanel',
  component: PhaseDetailPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## PhaseDetailPanel

Reports의 Event timeline에서 **막대 한 줄(phase)**을 눌렀을 때 열리는 읽기 전용 패널.

타임라인의 한 줄은 캠페인 하나가 아니다 — 같은 단계를 Meta·TikTok에 나눠 돌리면
캠페인 두 건이 한 막대로 합쳐진다(\`buildPhaseTimeline\`). 실계정의 "G10 Opening"은
다섯 줄 중 넷이 \`Meta + TikTok\`이라, 그 줄을 눌렀을 때 캠페인 드로어를 바로 열면
**둘 중 어느 쪽인지** 정할 수 없다. 그래서 한 단계를 더 둔다: 이 패널이 단계의
합계를 먼저 말하고, 아래 목록에서 한 건을 고르면 기존 \`CampaignDetailPanel\`이 열린다.

캠페인이 한 건뿐인 단계도 같은 화면을 지난다 — 어떤 줄은 바로 열리고 어떤 줄은 한 번
더 눌러야 하는 목록이 되면, 눌러보기 전에는 어느 쪽인지 알 수 없다.

### Props

| Prop | 타입 | 설명 |
|---|---|---|
| \`phase\` | object | buildPhaseTimeline()이 만든 phase (key/name/platformLabel/기간/예산) |
| \`campaigns\` | array | 이 phase를 이루는 캠페인들. 호출부가 \`phase.key\`로 걸러 넘긴다 |
| \`onClose\` | function | 닫기 |
| \`onSelectCampaign\` | function | 목록에서 캠페인을 고를 때. 없으면 목록이 클릭 불가 |
        `,
      },
    },
  },
  argTypes: {
    phase: { control: 'object', description: 'buildPhaseTimeline()이 만든 phase 한 건' },
    campaigns: { control: 'object', description: '이 phase를 이루는 캠페인 배열 { id, name, platform, spend, thumbnailUrl }' },
    onClose: { action: 'closed' },
    onSelectCampaign: { action: 'campaignSelected' },
  },
};

/** Drawer라 항상 열린 채로 렌더된다 — 버튼으로 열고 닫아 실제 진입을 재현한다. */
function Harness({ phase, campaigns, onSelectCampaign }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Box sx={{ p: 4 }}>
      <Button variant="outlined" onClick={() => setIsOpen(true)} sx={{ boxShadow: 'none' }}>
        Open phase
      </Button>
      {isOpen && (
        <PhaseDetailPanel
          phase={phase}
          campaigns={campaigns}
          onClose={() => setIsOpen(false)}
          onSelectCampaign={onSelectCampaign}
        />
      )}
    </Box>
  );
}

/**
 * Performance 탭에서 연 단계 — 캠페인 두 건(Meta·TikTok)이 한 막대로 합쳐진 경우.
 *
 * 확인 포인트:
 * - 헤더가 타임라인에서 잘렸던 **원본 이름 전체**를 보여준다(타임라인 첫 줄은
 *   코드·기간을 벗긴 표시 이름이다)
 * - 예산은 정수(`$45/day`, `$2,565`), 집행은 2자리(`$2,051.18`) — utils/format.js 규칙
 * - `Spent vs planned`는 계획이 있을 때만 나온다
 * - 캠페인 줄이 눌리는 객체다(커서·hover·Enter/Space) — 고르면 호출부가 이 패널을
 *   닫고 CampaignDetailPanel을 연다
 */
export const TwoPlatforms = {
  render: () => <Harness phase={PHASE} campaigns={CAMPAIGNS} onSelectCampaign={() => {}} />,
};

/**
 * 캠페인이 한 건뿐인 단계 — 그래도 같은 패널을 지난다.
 *
 * 확인 포인트: 목록 제목이 `Campaigns (1)`이고 줄이 하나다. 이 경우에도 캠페인
 * 패널을 바로 열지 않는 이유는 컴포넌트 주석 참고.
 */
export const SingleCampaign = {
  render: () => (
    <Harness
      phase={{ ...PHASE, key: 'g10 1 month deals', name: 'G10_1_Month Deals_0710~0831', platformLabel: 'TikTok', totalDaily: 20, totalBudget: 1060 }}
      campaigns={[CAMPAIGNS[1]]}
      onSelectCampaign={() => {}}
    />
  ),
};

/**
 * 아직 성과가 안 들어온 단계 — 동기화 전이거나 집행 전이다.
 *
 * 확인 포인트: `Spend`와 `Spent vs planned` 줄이 **통째로 사라진다**(Row가 값 없는
 * 줄을 안 그린다). 캠페인 줄의 금액도 `$0.00`이 아니라 `—` — 0을 찍으면 "0을
 * 측정했다"는 주장이 된다.
 */
export const NoSpendYet = {
  render: () => (
    <Harness
      phase={PHASE}
      campaigns={CAMPAIGNS.map((c) => ({ ...c, spend: null }))}
      onSelectCampaign={() => {}}
    />
  ),
};

/**
 * 계획 예산이 없는 단계 — 동기화 캠페인은 플랫폼에 계획 예산 개념이 없어 0으로
 * 저장된다.
 *
 * 확인 포인트: `Planned budget`과 `Spent vs planned`가 빠지고 일일 예산·실지출만
 * 남는다. `$0`으로 찍으면 "0으로 계획했다"로 읽힌다.
 */
export const NoPlannedBudget = {
  render: () => (
    <Harness phase={{ ...PHASE, totalBudget: 0 }} campaigns={CAMPAIGNS} onSelectCampaign={() => {}} />
  ),
};
