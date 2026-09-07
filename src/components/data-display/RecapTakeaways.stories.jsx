import Box from '@mui/material/Box';
import { RecapTakeaways } from './RecapTakeaways';
import { buildRecapRows, buildRecapExecutiveSummary } from '../../data/schema';
import { mockRecapCampaigns, mockRecapPerformanceRecords } from '../../data/paidAdsMockData';

const PLATFORM_LABEL = { meta: 'Meta', tiktok: 'TikTok' };
const { byPlatform } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords);
const summary = buildRecapExecutiveSummary(byPlatform);

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

보고서 머리글 아래의 **임원용 핵심 요약** — 세 칸 한 줄(BEST RESULT · ATTENTION ·
NEXT MOVE). 칸마다 작은 라벨 → 큰 결론 한 줄 → 작은 근거 한 줄. 5초 안에 "무엇이
이겼고, 무엇을 봐야 하고, 다음에 뭘 할지"가 읽히는 게 목표라 문장을 늘어놓지 않는다.

### 합성 규칙
재료는 \`schema.js\`의 \`buildRecapExecutiveSummary()\` — 기존 takeaways 재료(가장
좋았던 캠페인·뒤처진 캠페인·플랫폼 CPM 차이·제언)를 세 칸으로 합친다. "플랫폼 차이"는
칸을 따로 갖지 않고 NEXT MOVE의 근거("17% lower CPM than TikTok in this event")가 된다.
근거 하나만 붙이고, 원인은 지어내지 않는다(CPM은 플랫폼 간 비교 가능, Hook·Hold는 아님).

### 모양
카드 안의 카드가 아니라 얇은 구분선 하나로 나눈 세 칸(데스크톱 세로선, 모바일 가로선).
색은 라벨 옆 14px 선 아이콘에만 — success / warning / accent.
        `,
      },
    },
  },
  argTypes: {
    summary: { control: 'object', description: 'buildRecapExecutiveSummary() 결과 — { best, attention, next }' },
    platformLabel: { control: 'object', description: '플랫폼 값 → 표시명' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

const card = (children) => (
  <Box sx={(theme) => ({ maxWidth: 1100, border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.container}px` })}>{children}</Box>
);

/** G10 Opening 목 데이터 — 세 칸 모두 채워진 상태 */
export const Default = {
  args: { summary, platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapTakeaways {...args} />),
};

/** 뒤처진 캠페인이 없을 때 — ATTENTION은 "No weak spots flagged" */
export const NoAttention = {
  args: { summary: { ...summary, attention: null, next: summary.next && { ...summary.next, weakPlatform: null, weakPhaseName: null } }, platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapTakeaways {...args} />),
};

/** 플랫폼 차이 없이 제언만 — NEXT MOVE가 "Shift launch budget toward …" */
export const NextFromBestOnly = {
  args: { summary: { ...summary, next: summary.best ? { kind: 'best', platform: summary.best.platform, phaseName: summary.best.phaseName, weakPlatform: summary.attention?.platform ?? null, weakPhaseName: summary.attention?.phaseName ?? null } : null }, platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapTakeaways {...args} />),
};

/** 한국어 */
export const Korean = {
  args: { summary, platformLabel: PLATFORM_LABEL, lang: 'ko' },
  render: (args) => card(<RecapTakeaways {...args} />),
};

/** 좁은 화면 — 세로로 쌓인다 */
export const Narrow = {
  args: { summary, platformLabel: PLATFORM_LABEL },
  render: (args) => <Box sx={{ maxWidth: 360 }}>{card(<RecapTakeaways {...args} />)}</Box>,
};

/** 근거가 없을 때 */
export const Empty = {
  args: { summary: { best: null, attention: null, next: null }, platformLabel: PLATFORM_LABEL },
  render: (args) => card(<RecapTakeaways {...args} />),
};
