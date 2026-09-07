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

Learnings 카드 안의 **데이터에서 본 패턴**. 개별 캠페인 하나로는 항목을 만들지
않는다 — \`schema.js\`의 \`buildRecapPatterns()\`는 캠페인 2개 이상이 같은 방향을
가리킬 때(같은 지표 상위/하위), 단계 간 CTR이 1.5배 이상 갈릴 때(플랫폼마다 같은
방향), 이 이벤트 안에서 플랫폼 CPM·CTR이 15% 이상 갈릴 때만 항목을 낸다.

캠페인 이름("Grand Opening", "Coming Soon")에서 메시지 전략을 추정하지 않는다 —
"Grand Opening 캠페인이 Coming Soon보다 클릭 효율이 높았다"까지만 말한다.
자동 Next time은 사람이 쓴 제언이 없을 때만 보인다.
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
