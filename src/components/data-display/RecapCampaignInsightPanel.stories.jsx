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

보고서 캠페인 표의 한 줄을 펼치면 바로 아래에 나오는 **간결한 진단 요약** — What worked ·
Could improve · Why · Next action. 칸마다 작은 라벨 → 짧은 결론(2~6단어, 가장 강하게) →
한 줄 근거(↗↘ + "Hook top 9%"). 임원이 5~10초에 읽는 게 목표라 문단을 쓰지 않는다.

### 어디에 나오나
2026-09-07부터 표 아래 펼침이 아니라 캠페인 상세 드로어(CampaignDetailPanel)의 **Campaign insights**
섹션(예산 페이싱 뒤, 일별 지출 앞)에 \`layout="grid"\`(2×2)로 들어간다. 표의 줄을 누르면 성과·예산·
해석이 한 드로어에 다 있다 — 숨은 셰브론을 찾을 필요가 없다.

### 근거 수준은 툴팁에만
observed / compared / inferred / unknown / written은 라벨에 마우스를 올리면 보인다 —
논리(\`schema.js\` \`buildCampaignInsight()\`)는 그대로고, 칸마다 "· compared"를 붙이던
표시만 뺐다. Why는 원인을 단정하지 않는다 — 결론은 항상 "Insufficient evidence", 근거 줄에
관측된 지표 패턴("Strong hook but weak hold — no causal signal in metrics")만 적는다. Next
action도 "Keep the strong hook"이 아니라 "Improve engagement without losing hook performance"
처럼 관측된 지표 기준으로 말한다(강한 Hook이 소재가 좋다는 증거는 아니다).

### 비우는 규칙
원인을 모르면 "Insufficient evidence / No reliable causal signal". 성과 데이터가 없으면
장점·약점 "—", Why "Insufficient data", Next action "Collect more performance data".
소재·타겟·메시지 같은 데이터에 없는 원인은 적지 않는다. 사람이 쓴 글(written)이 결론 자리에 온다.
        `,
      },
    },
  },
  argTypes: {
    row: { control: 'object', description: '캠페인 행 + insight(buildCampaignInsight 결과)' },
    platformLabel: { control: 'object', description: '플랫폼 값 → 표시명' },
    localize: { control: false, description: 'LocalizedText → { value, isFallback }' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    layout: { control: 'select', options: ['row', 'grid'], description: "'row' 4열 한 줄(넓은 자리) / 'grid' 2×2(드로어)" },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/** 표 안의 펼침 줄처럼 — surface.sunken 면 + 위아래 1px 경계 */
const inTable = (children) => (
  <Box sx={{ backgroundColor: 'surface.sunken', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>{children}</Box>
);

/** 장점·약점 둘 다 → Why "Insufficient evidence" + Next action(keepAndTest: "Improve … without losing … performance") 네 칸 */
export const FourFields = {
  args: { row: withInsight(metaRows[1] ?? metaRows[0]), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 장점만 — Could improve는 "—", Next action은 "Repeat and confirm … performance" */
export const StrengthOnly = {
  args: { row: withInsight(metaRows[0]), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 비교군이 없는 TikTok — 장점·약점 "—", Why "No comparable campaigns" */
export const NoPeers = {
  args: { row: withInsight(tiktokRows[0] ?? metaRows[0]), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 사람이 쓴 글이 있는 캠페인 — "written"이 자동 문장보다 우선 */
export const WithWrittenNote = {
  args: { row: withInsight((byPlatformWithNotes.meta ?? []).find((r) => r.note) ?? metaRows[0]), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 성과 데이터가 없는 캠페인 — "—" / "—" / Insufficient data / Collect more performance data */
export const NoData = {
  args: { row: withInsight({ ...metaRows[0], spend: null, impressions: null, reach: null, clicks: null, note: null, benchmarks: {} }), platformLabel: PLATFORM_LABEL, localize },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 한국어 */
export const Korean = {
  args: { row: withInsight(metaRows[1] ?? metaRows[0]), platformLabel: PLATFORM_LABEL, localize: (text) => localizedText(text, 'ko'), lang: 'ko' },
  render: (args) => inTable(<RecapCampaignInsightPanel {...args} />),
};

/** 드로어 안(≈560px)에서 쓰는 2×2 — CampaignDetailPanel의 "Campaign insights" 섹션이 이 모양이다 */
export const GridInDrawer = {
  args: { row: withInsight(metaRows[1] ?? metaRows[0]), platformLabel: PLATFORM_LABEL, localize, layout: 'grid' },
  render: (args) => <Box sx={(theme) => ({ maxWidth: 560, border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.control}px` })}><RecapCampaignInsightPanel {...args} sx={{ px: 1.5, py: 1.25 }} /></Box>,
};
