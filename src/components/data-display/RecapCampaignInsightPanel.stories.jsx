import Box from '@mui/material/Box';
import { RecapCampaignInsightPanel } from './RecapCampaignInsightPanel';
import { buildRecapRows, buildCampaignInsight, localizedText } from '../../data/schema';
import { mockRecapCampaigns, mockRecapPerformanceRecords, mockRecapCampaignNotes } from '../../data/paidAdsMockData';

const PLATFORM_LABEL = { meta: 'Meta', tiktok: 'TikTok' };
const notesById = Object.fromEntries(mockRecapCampaignNotes.map((n) => [n.campaignId, n]));
const withInsight = (row) => ({ ...row, insight: buildCampaignInsight(row) });
const { byPlatform } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords);
const { byPlatform: byPlatformWithNotes } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords, { notesById });
const metaRows = byPlatform.meta ?? [];
const tiktokRows = byPlatform.tiktok ?? [];
const localize = (text) => localizedText(text, 'en');

export default {
  title: 'Paid Ads Dashboard/Data Display/RecapCampaignInsightPanel',
  component: RecapCampaignInsightPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapCampaignInsightPanel

Recap 캠페인 표의 한 줄을 펼치면 바로 아래에 나오는 해석 — **What worked · What could
improve · Why · Recommendation**. 표의 숫자를 읽고, 같은 줄을 펼쳐서, 무엇이 좋았고
무엇을 고칠지, 데이터가 설명할 수 있는 것과 없는 것, 다음에 할 일을 그 자리에서 읽는다.

### 근거 수준
- **observed** — 지표 값 자체(예: 계획보다 20% 초과 지출)
- **compared** — 비교군 순위·백분위("best of 5", "bottom 26%")
- **inferred** — 관측된 패턴의 해석과 거기서 나온 다음 실험. "~일 수 있다"로만 말하고,
  소재·타겟·메시지 같은 데이터에 없는 원인은 절대 적지 않는다
- **unknown** — 근거 부족("Not enough evidence to determine why.")

### 비우는 규칙
근거 없는 칸은 그리지 않는다 — 네 칸을 억지로 채우지 않는다. Recommendation은
장점·약점 재료가 있을 때만 나오고, "관측 결과 → 다음에 확인할 것"이지 일반론이 아니다.
성과 데이터가 아예 없으면 한 줄 안내만. 사람이 쓴 글(written)은 자동 문장보다 우선.
        `,
      },
    },
  },
  argTypes: {
    row: { control: 'object', description: '캠페인 행 + insight(buildCampaignInsight 결과)' },
    platformLabel: { control: 'object', description: '플랫폼 값 → 표시명' },
    localize: { control: false, description: 'LocalizedText → { value, isFallback }' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/** 표 안의 펼침 줄처럼 — surface.sunken 면 + 위아래 1px 경계 */
const inTable = (children) => (
  <Box sx={{ backgroundColor: 'surface.sunken', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>{children}</Box>
);

/** 장점·약점 둘 다 → Why(inferred) + Recommendation(keepAndTest) 네 칸 */
export const FourFields = {
  args: { row: withInsight(metaRows[1] ?? metaRows[0]), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 장점만 — What could improve 칸이 없고 Recommendation은 "기준점으로 삼기" */
export const StrengthOnly = {
  args: { row: withInsight(metaRows[0]), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 비교군이 없는 TikTok — Why · unknown 한 칸만 */
export const NoPeers = {
  args: { row: withInsight(tiktokRows[0] ?? metaRows[0]), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 사람이 쓴 글이 있는 캠페인 — "written"이 자동 문장보다 우선 */
export const WithWrittenNote = {
  args: { row: withInsight((byPlatformWithNotes.meta ?? []).find((r) => r.note) ?? metaRows[0]), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 성과 데이터가 없는 캠페인 — 한 줄 안내만 */
export const NoData = {
  args: { row: withInsight({ ...metaRows[0], spend: null, impressions: null, reach: null, clicks: null, note: null, benchmarks: {} }), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 한국어 */
export const Korean = {
  args: { row: withInsight(metaRows[1] ?? metaRows[0]), platformLabel: PLATFORM_LABEL, localize: (text) => localizedText(text, 'ko'), lang: 'ko' },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};
