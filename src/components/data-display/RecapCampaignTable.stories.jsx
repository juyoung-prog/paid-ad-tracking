import Box from '@mui/material/Box';
import { RecapCampaignTable } from './RecapCampaignTable';
import { RecapCampaignInsightPanel } from './RecapCampaignInsightPanel';
import { buildRecapRows, buildCampaignInsight, localizedText } from '../../data/schema';
import { mockRecapCampaigns, mockRecapPerformanceRecords, mockRecapCampaignNotes } from '../../data/paidAdsMockData';

/* 스토리는 계산하지 않는다 — schema.js buildRecapRows()가 순위·벤치마크·판정
   제안까지 끝낸 결과를 그대로 넘긴다(컴포넌트가 실제로 받는 형태). */
const notesById = Object.fromEntries(mockRecapCampaignNotes.map((n) => [n.campaignId, n]));
const { byPlatform } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords, { notesById });

export default {
  title: 'Paid Ads Dashboard/Data Display/RecapCampaignTable',
  component: RecapCampaignTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapCampaignTable

Recap(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표(Build Plan Phase 3). 이전
보고서의 표 구성 — 순위 · 매장 · 캠페인 · 일예산 · 지출 · 판정 · 영상 반응 ·
참여 반응 · 행동 — 을 그대로 따르되, 비율 지표마다 \`BenchmarkDelta\`로
"비슷한 캠페인 대비 어디쯤"이 붙는다.

### 셀 구성
- **Campaign**: 단계 이름(\`phaseNameOf\`) 굵게 + 기간·일수. 원본 이름은 hover title
- **Spend**: 지출 + 그 아래 CPM 벤치마크
- **Efficiency**: 사람이 고른 판정이 있으면 채운 칩, 없으면 제안값을 점선 칩으로
- **Video**: Reach · Plays · Avg 한 줄 + Hook / Hold 벤치마크
- **Engagement**: Like · Cmt · Share 한 줄 + 참여율 벤치마크
- **Action**: Clicks · Results · Profile 한 줄 + CTR / CPC (+ conversion goal이면 CPA)

### 계산은 하지 않는다
\`rows\`는 \`schema.js\`의 \`buildRecapRows().byPlatform[platform]\` — 순위·벤치마크·
판정 제안까지 끝난 값이다. 이 컴포넌트는 자리에 놓고 \`utils/format\`으로 표기만
한다. 문구는 \`recapStrings\`에서 꺼낸다.

### 폭
열 폭은 고정(colgroup)이고 합이 컨테이너보다 넓으면 ScrollArea가 가로 스크롤과
좌측 그림자를 준다. 인쇄에서는 Phase 4의 print 규칙이 스크롤 없이 접는다.
        `,
      },
    },
  },
  argTypes: {
    renderDetail: { control: false, description: '(row) => ReactNode. 있으면 줄 끝에 화살표가 붙고 누르면 그 줄 아래에 펼쳐진다(한 번에 한 줄)' },
    rows: { control: 'object', description: 'buildRecapRows().byPlatform[platform] — 한 플랫폼의 행 배열(순위순)' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    onRowClick: { action: 'rowClicked', description: '행 클릭 핸들러 (campaignId) => void' },
    label: { control: 'text', description: '스크롤 영역 접근성 이름' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/**
 * Meta — 비교군이 충분한 쪽. 확인 포인트:
 * - 순위가 대표 지표 백분위 순인가(Grand Opening 1위)
 * - Grand Opening의 판정은 사람이 고른 good(채운 칩), Coming Soon은 제안값(점선 칩), Now Open은 "—"
 * - Now Open(store_visit)은 비교군이 없어 전 지표 "not enough data"이고 Action 칸에 CPA가 추가로 보이는가
 * - Spend 아래 CPM이 "best of 5"처럼 양 끝 표현을 쓰는가
 */
export const Meta = {
  args: { rows: byPlatform.meta },
};

/** TikTok — 비교군 2개뿐이라 모든 벤치마크가 "not enough data". 값은 그대로 보인다 */
export const TikTokNotEnoughData = {
  args: { rows: byPlatform.tiktok },
};

/** 성과 레코드가 없는 캠페인 — 지표 세 칸이 한 칸으로 합쳐져 "No performance data" */
export const NoPerformanceData = {
  args: {
    rows: [
      { ...byPlatform.meta[0], rank: 1 },
      {
        ...byPlatform.meta[1],
        rank: 2,
        spend: null, impressions: null, reach: null, clicks: null, videoPlays: null,
        note: null, suggestedVerdict: null,
      },
    ],
  },
};

/** 행 클릭 — Dashboard 드로어로 딥링크할 때. Tab으로 행에 포커스가 가고 Enter로 눌린다 */
export const Clickable = {
  args: { rows: byPlatform.meta },
  render: (args) => <RecapCampaignTable {...args} />,
};

/** 빈 목록 */
export const Empty = {
  args: { rows: [] },
};

/** 좁은 컨테이너 — 가로 스크롤과 좌측 그림자(고정 열 뒤) */
export const Narrow = {
  args: { rows: byPlatform.meta },
  render: (args) => (
    <Box sx={{ maxWidth: 820 }}>
      <RecapCampaignTable {...args} />
    </Box>
  ),
};

/**
 * 줄 끝 화살표로 캠페인 해석을 그 자리에 펼친다(renderDetail) — 숫자와 해석을 같은
 * 줄에서 읽는다. 한 번에 한 줄만 열리고, 줄 클릭(onRowClick)과는 별개다.
 */
export const Expandable = {
  args: {
    rows: byPlatform.meta,
    onRowClick: undefined,
    renderDetail: (row) => (
      <RecapCampaignInsightPanel
        row={{ ...row, insight: buildCampaignInsight(row) }}
        platformLabel={{ meta: 'Meta', tiktok: 'TikTok' }}
        localize={(text) => localizedText(text, 'en')}
      />
    ),
  },
  render: (args) => <Box sx={(theme) => ({ border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.container}px` })}><RecapCampaignTable {...args} /></Box>,
};
