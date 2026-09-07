import Box from '@mui/material/Box';
import { RecapPatterns } from './RecapPatterns';
import { buildRecapRows, buildRecapPlaybook } from '../../data/schema';
import { mockRecapCampaigns, mockRecapPerformanceRecords } from '../../data/paidAdsMockData';

const PLATFORM_LABEL = { meta: 'Meta', tiktok: 'TikTok' };
const { byPlatform } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords);
const playbook = buildRecapPlaybook(byPlatform);

export default {
  title: 'Paid Ads Dashboard/Data Display/RecapPatterns',
  component: RecapPatterns,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapPatterns

Learnings 카드 안의 **다음 이벤트 플레이북** — "다음 비슷한 이벤트에서 무엇을 반복하고
무엇을 바꿀까"에만 답한다. 2×2 칸 **KEEP · USE SELECTIVELY · IMPROVE · VALIDATE**(점 색
success / accent / warning / disabled), 칸마다 상태 → 제목 → 근거 한 줄. 아래 **NEXT EVENT**
줄은 결정 문장(15px/600) + 검증 문장(12px 보조).

### 반복하지 않는다
"Reach efficiency was consistently strong" 같은 회고 요약은 Key takeaways와 표가 이미
말한다. 여기서는 그 재료를 행동으로 옮긴다 — 플랫폼 CPM 차이 → KEEP "Meta for reach",
CTR 차이 → USE SELECTIVELY "TikTok for click-focused campaigns", 일관되게 약한 지표 →
IMPROVE, 엇갈리거나 패턴이 없는 지표 → VALIDATE.

### 지어내지 않는다
재료는 \`schema.js\`의 \`buildRecapPlaybook()\` — buildRecapPatterns()의 결과(캠페인 2개
이상 같은 방향, 이벤트 단위 플랫폼 CPM·CTR 15% 차이)만 쓴다. 근거 없는 칸은 비우고,
넷 다 비면 "Not enough repeated evidence". 방법론은 카드 제목 ⓘ 툴팁. 사람이 쓴
제언이 있으면 NEXT EVENT 줄은 숨는다.
        `,
      },
    },
  },
  argTypes: {
    playbook: { control: 'object', description: 'buildRecapPlaybook() 결과 — { keep, useSelectively, improve, validate, nextEvent }' },
    platformLabel: { control: 'object', description: '플랫폼 값 → 표시명' },
    hasWrittenLearnings: { control: 'boolean', description: '사람이 쓴 배운 점이 위에 있으면 true' },
    hasWrittenNextSteps: { control: 'boolean', description: '사람이 쓴 제언이 있으면 NEXT EVENT 줄을 숨긴다' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

const card = (children) => (
  <Box sx={(theme) => ({ maxWidth: 880, border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.container}px` })}>{children}</Box>
);

/** G10 Opening 목 데이터 — 재료가 있는 칸만 채워진다 */
export const Default = {
  args: { playbook, platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapPatterns {...args} />),
};

/** 네 칸 + NEXT EVENT가 전부 채워진 이벤트(플랫폼 CPM·CTR 갈림, Hold 약함, 참여 패턴 없음) */
export const FullPlaybook = {
  args: {
    playbook: {
      keep: { kind: 'platformReach', platform: 'meta' },
      useSelectively: { kind: 'platformClicks', platform: 'tiktok' },
      improve: { kind: 'weak', aspect: 'hold', metricKey: 'holdRate', count: 2, total: 6 },
      validate: { kind: 'uncovered', aspect: 'engagement' },
      nextEvent: { kind: 'split', reachPlatform: 'meta', clickPlatform: 'tiktok', validateAspects: ['hold', 'engagement'] },
    },
    platformLabel: PLATFORM_LABEL,
  },
  render: (args) => card(<RecapPatterns {...args} />),
};

/** 플랫폼 하나가 CPM·CTR 모두 앞선 이벤트 + 엇갈린 지표(VALIDATE mixed) */
export const LeanAndMixed = {
  args: {
    playbook: {
      keep: { kind: 'platformBoth', platform: 'meta', other: 'tiktok' },
      useSelectively: { kind: 'platformOther', platform: 'tiktok', leader: 'meta' },
      improve: null,
      validate: { kind: 'mixed', aspect: 'click', metricKey: 'ctr', count: 2, countBottom: 2, total: 6 },
      nextEvent: { kind: 'lean', platform: 'meta', validateAspects: ['click'] },
    },
    platformLabel: PLATFORM_LABEL,
  },
  render: (args) => card(<RecapPatterns {...args} />),
};

/** 사람이 쓴 제언이 있어 NEXT EVENT 줄은 숨긴 상태 */
export const WithWrittenNextSteps = {
  args: { playbook, platformLabel: PLATFORM_LABEL, hasWrittenLearnings: true, hasWrittenNextSteps: true },
  render: (args) => card(<RecapPatterns {...args} />),
};

/** 한국어 */
export const Korean = {
  args: { playbook, platformLabel: PLATFORM_LABEL, lang: 'ko' },
  render: (args) => card(<RecapPatterns {...args} />),
};

/** 근거가 하나도 없을 때 */
export const Empty = {
  args: { playbook: { keep: null, useSelectively: null, improve: null, validate: null, nextEvent: null }, platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapPatterns {...args} />),
};
