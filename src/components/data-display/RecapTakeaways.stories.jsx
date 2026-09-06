import Box from '@mui/material/Box';
import { RecapTakeaways } from './RecapTakeaways';
import { buildRecapRows, buildRecapTakeaways } from '../../data/schema';
import { mockRecapCampaigns, mockRecapPerformanceRecords } from '../../data/paidAdsMockData';

/* 재료는 schema.js — 스토리는 결과를 넘길 뿐 */
const PLATFORM_LABEL = { meta: 'Meta', tiktok: 'TikTok' };
const { byPlatform } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords);
const items = buildRecapTakeaways(byPlatform);

export default {
  title: 'Paid Ads Dashboard/Data Display/RecapTakeaways',
  component: RecapTakeaways,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapTakeaways

Recap 머리글과 타임라인 사이의 **핵심 요약**(Key takeaways). 표가 증거라면 이 칸은
해석이다 — 가장 좋았던 캠페인, 뒤처진 캠페인, 플랫폼 차이, 다음 제언을 최대 4개.

### 지어내지 않는다
재료는 \`schema.js\`의 \`buildRecapTakeaways()\`가 벤치마크에서 뽑는다. 뒤처진
캠페인은 대표 지표가 하위 구간일 때만, 플랫폼 차이는 정의가 같은 CPM으로 15% 이상
벌어질 때만 나온다. 근거가 없으면 항목이 빠지고, 하나도 없으면 "아직 결론을 내릴
수 없다"고만 말한다.

### 문장
표에 이미 있는 숫자를 반복하지 않고 "비교 가능한 캠페인 중 best of 5" 같은 상대
위치만 붙인다. 문장 조립은 recapStrings(3개 언어).
        `,
      },
    },
  },
  argTypes: {
    items: { control: 'object', description: 'buildRecapTakeaways() 결과' },
    platformLabel: { control: 'object', description: '플랫폼 값 → 표시명' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

const card = (children) => (
  <Box sx={(theme) => ({ maxWidth: 880, border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.container}px` })}>{children}</Box>
);

/** G10 Opening 목 데이터 — best · weakest · platform · recommendation 네 항목 */
export const Default = {
  args: { items, platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapTakeaways {...args} />),
};

/** 한국어 */
export const Korean = {
  args: { items, platformLabel: PLATFORM_LABEL, lang: 'ko' },
  render: (args) => card(<RecapTakeaways {...args} />),
};

/** 근거가 없을 때 — 비교군이 하나도 없는 이벤트 */
export const Empty = {
  args: { items: [], platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapTakeaways {...args} />),
};
