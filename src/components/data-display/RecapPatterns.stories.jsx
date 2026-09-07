import Box from '@mui/material/Box';
import { RecapPatterns } from './RecapPatterns';
import { buildRecapRows, buildRecapPatterns } from '../../data/schema';
import { mockRecapCampaigns, mockRecapPerformanceRecords } from '../../data/paidAdsMockData';

const PLATFORM_LABEL = { meta: 'Meta', tiktok: 'TikTok' };
const { byPlatform } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords);
const patterns = buildRecapPatterns(byPlatform);

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

Learnings 카드 안의 **임원용 패턴 + 행동 요약**. 2×2 항목마다 "지표 이름 — 상태
(Strong / Mixed / Weak, 점 + 글자) — 한 줄 근거('4 of 6 · top CPM band')"라 상태만 훑어도
이벤트가 읽힌다. 아래 Recommended action은 첫 줄이 결정, 둘째 줄이 이유.

항목은 \`schema.js\`의 \`buildRecapPatterns()\`가 캠페인 2개 이상이 같은 방향일 때만
만든다(상위/하위 구간, 양쪽 다 2개 이상이면 Mixed). 단계 간 CTR 1.5배, 이벤트 안 플랫폼
CPM·CTR 15% 차이는 중립 상태의 패턴으로. 방법론 설명은 본문이 아니라 카드 제목의 ⓘ
툴팁에 있다. 캠페인 이름에서 메시지 전략을 추정하지 않는다. 자동 제언은 사람이 쓴
제언이 없을 때만 보인다.
        `,
      },
    },
  },
  argTypes: {
    patterns: { control: 'object', description: 'buildRecapPatterns() 결과' },
    platformLabel: { control: 'object', description: '플랫폼 값 → 표시명' },
    hasWrittenLearnings: { control: 'boolean', description: '사람이 쓴 배운 점이 위에 있으면 true' },
    hasWrittenNextSteps: { control: 'boolean', description: '사람이 쓴 제언이 있으면 자동 제언을 숨긴다' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

const card = (children) => (
  <Box sx={(theme) => ({ maxWidth: 880, border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.container}px` })}>{children}</Box>
);

/** G10 Opening 목 데이터 — 반복 패턴과 자동 제언 */
export const Default = {
  args: { patterns, platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapPatterns {...args} />),
};

/** 사람이 쓴 제언이 있어 자동 제언은 숨긴 상태 */
export const WithWrittenNextSteps = {
  args: { patterns, platformLabel: PLATFORM_LABEL, hasWrittenLearnings: true, hasWrittenNextSteps: true },
  render: (args) => card(<RecapPatterns {...args} />),
};

/** 패턴이 하나도 없을 때 */
export const Empty = {
  args: { patterns: { learnings: [], nextSteps: [] }, platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapPatterns {...args} />),
};
