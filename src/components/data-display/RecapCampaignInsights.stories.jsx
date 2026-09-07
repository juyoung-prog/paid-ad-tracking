import Box from '@mui/material/Box';
import { RecapCampaignInsights } from './RecapCampaignInsights';
import { buildRecapRows, buildCampaignInsight, localizedText } from '../../data/schema';
import { mockRecapCampaigns, mockRecapPerformanceRecords, mockRecapCampaignNotes } from '../../data/paidAdsMockData';

const PLATFORM_LABEL = { meta: 'Meta', tiktok: 'TikTok' };
const notesById = Object.fromEntries(mockRecapCampaignNotes.map((n) => [n.campaignId, n]));
const withInsight = (rows) => rows.map((r) => ({ ...r, insight: buildCampaignInsight(r) }));
const { byPlatform } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords);
const { byPlatform: byPlatformWithNotes } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords, { notesById });
const allRows = [...(byPlatform.meta ?? []), ...(byPlatform.tiktok ?? [])];
const allRowsWithNotes = [...(byPlatformWithNotes.meta ?? []), ...(byPlatformWithNotes.tiktok ?? [])];

export default {
  title: 'Paid Ads Dashboard/Data Display/RecapCampaignInsights',
  component: RecapCampaignInsights,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapCampaignInsights

Recap의 Notes 카드 본문 — 캠페인마다 Strength · Weakness · Why. 사람이 쓴 글이
있으면 그것(라벨 옆 "written"), 없으면 **데이터에서 만든 문장**을 근거 수준과 함께
보여준다.

### 근거 수준
- **observed** — 지표 값 자체(예: 계획보다 20% 초과 지출)
- **compared** — 비교군 순위·백분위("best of 5", "bottom 26%")
- **inferred** — 관측된 패턴의 해석. "~일 수 있다"로만 말하고, 소재·타겟·메시지 같은
  데이터에 없는 원인은 절대 적지 않는다
- **unknown** — 근거 부족("Not enough evidence to determine why.")

### 지어내지 않는다
재료는 \`schema.js\`의 \`buildCampaignInsight()\`가 벤치마크에서 뽑는다. Strength는
상위 구간 지표, Weakness는 하위 구간 지표(없으면 초과 지출)만이고, Why는 두 지표의
조합(도달 강·클릭 약 등)이 있을 때만 해석을 붙인다. 하나도 없으면 "—"가 낫다.
        `,
      },
    },
  },
  argTypes: {
    rows: { control: 'object', description: '캠페인 행 + insight(buildCampaignInsight 결과)' },
    platformLabel: { control: 'object', description: '플랫폼 값 → 표시명' },
    localize: { control: false, description: 'LocalizedText → { value, isFallback }' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

const card = (children) => (
  <Box sx={(theme) => ({ border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.container}px` })}>{children}</Box>
);

/**
 * 사람 글 없이 데이터 해석만 — 확인 포인트:
 * - Meta Grand Opening: compared Strength(CPM best of 5) + Why "allStrong"(inferred)
 * - Meta 1 Month Deals: Hold lowest → Weakness compared, Why는 hookNotHold가 아니라 singleSignal/noPattern
 * - Meta Now Open(store_visit, 비교군 없음): Why "No comparable campaigns yet", Strength·Weakness "—"
 * - TikTok: 비교군 부족 → 전부 "—" + noPeers
 */
export const DataOnly = {
  args: { rows: withInsight(allRows), platformLabel: PLATFORM_LABEL, localize: (text) => localizedText(text, 'en') },
  render: (args) => card(<RecapCampaignInsights {...args} />),
};

/** 사람이 쓴 글이 있는 캠페인은 "written"으로, 나머지는 데이터 해석 */
export const MixedWithWrittenNotes = {
  args: { rows: withInsight(allRowsWithNotes), platformLabel: PLATFORM_LABEL, localize: (text) => localizedText(text, 'en') },
  render: (args) => card(<RecapCampaignInsights {...args} />),
};

/** 성과 데이터가 없는 캠페인 — 한 줄 안내만 */
export const NoData = {
  args: {
    rows: withInsight([{ ...allRows[0], spend: null, impressions: null, reach: null, clicks: null, note: null, benchmarks: {} }]),
    platformLabel: PLATFORM_LABEL,
    localize: (text) => localizedText(text, 'en'),
  },
  render: (args) => card(<RecapCampaignInsights {...args} />),
};

/** 한국어 */
export const Korean = {
  args: { rows: withInsight(allRows), platformLabel: PLATFORM_LABEL, localize: (text) => localizedText(text, 'ko'), lang: 'ko' },
  render: (args) => card(<RecapCampaignInsights {...args} />),
};
