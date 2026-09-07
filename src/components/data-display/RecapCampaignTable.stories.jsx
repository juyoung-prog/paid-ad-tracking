import Box from '@mui/material/Box';
import { RecapCampaignTable } from './RecapCampaignTable';
import { buildRecapRows } from '../../data/schema';
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
- **Campaign**: 28px 소재 썸네일(CampaignThumbnail, 없으면 이니셜) + 단계 이름(\`phaseNameOf\`) 굵게 + 기간·일수 · 목표("Jul 6 – Aug 31 (57 days) · Awareness" — 캠페인 데이터의 goal, 드로어와 같은 원천, 없으면 기간만). 원본 이름은 hover title. 줄 전체가 드로어 버튼(onRowClick)이라 칸 안에 따로 버튼이 없고, 줄 끝 셰브론·아래 펼침도 없다(2026-09-07 — 해석은 드로어의 Campaign insights로)
- **Spend**: 실제 총지출만(CPM·순위는 Efficiency 칸으로 — 같은 정보가 두 칸에 있었다, 2026-09-07)
- **Performance**: 종합 성과 — 목표별 규칙(schema GOAL_PERFORMANCE_RULES)을 과거 비교군 구간에 적용한 Good/Fair/Weak 배지 + 한 줄 설명("Strong cost · weak hold"). 사람이 Edit에서 고른 판정이 우선, primary 구간이 없으면 "—" + Not enough data. 툴팁에 규칙
- **Cost efficiency** 층: 위 = 이 캠페인의 결과당 비용(목표별 KPI 라벨 + 값, 과거 무관·성과만 있으면 항상, 툴팁에 계산식) → (설정된 목표치가 있으면 "↓ 20% vs target $3.00") → 아래 "vs past" = 같은 KPI의 과거 비교군 순위(3개 미만이면 "—" + 툴팁 Not enough comparison data)
- **Video**: 보조 지표 Reach · Plays · Avg(라벨 → 값, 한 단 조용한 12px/500) 위에, 대표 지표 Hook / Hold(13px/600 + 벤치마크) 아래
- **Engagement**: Like · Cmt · Share 보조 지표 + 참여율 대표 지표
- **Action**: Clicks · Results · Profile 보조 지표 + CTR / CPC (+ conversion goal이면 CPA)

모든 지표가 같은 문법 **라벨 → 값 → 비교**를 쓴다(2026-09-07 — 예전엔 보조 지표만 "Reach 163,290 · Plays 295,857" 문장이라
메타데이터처럼 읽혔다). 위계는 글자 무게로만, 무게는 지표의 **역할**이 정한다(2026-09-07): 목표의 대표 KPI(인지 CPM ·
트래픽 CPC · 참여 Cost/eng · 전환 CPA) 700 > 진단 지표(Hook·Hold·Eng. rate·CTR) 600 > 대표가 아닌 비용 지표·수량 지표
(Reach·Plays·Like·Clicks…) 400. 라벨은 11px secondary, 순위 글자는 그대로.
보조 지표 항목은 minWidth(52/36/56)로, 대표 지표 첫 자리는 고정 폭(Video 80 · Action 88)으로 값 길이가 달라도
Hold·CPC가 모든 줄에서 같은 x에 온다. 보조 묶음과 대표 묶음 사이 8px.

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
    selectedIds: { control: 'object', description: '타임라인에서 고른 단계에 속한 캠페인 id들 — 해당 줄에 옅은 accent 면 + 왼쪽 2px 선' },
    rows: { control: 'object', description: 'buildRecapRows().byPlatform[platform] — 한 플랫폼의 행 배열(순위순)' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    onRowClick: { action: 'rowClicked', description: '숫자 줄 전체 클릭 (campaignId) => void — 보고서는 이걸로 캠페인 상세 드로어(성과·페이싱·캠페인 해석·일별 지출)를 연다. 벤치마크 글자는 예외' },
    label: { control: 'text', description: '스크롤 영역 접근성 이름' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/**
 * Meta — 비교군이 충분한 쪽. 확인 포인트:
 * - 순위가 대표 지표 백분위 순인가(Grand Opening 1위)
 * - Grand Opening의 판정은 사람이 고른 good, Coming Soon은 제안값(툴팁 "suggested"), Now Open은 "—"
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

/** onRowClick — 숫자 줄 전체가 버튼(보고서에서는 캠페인 상세 드로어). hover는 중립 면 140ms, 벤치마크 글자는 줄 클릭에서 빠진다. Tab으로 행에 포커스, Enter로 눌린다 */
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
 * 타임라인에서 고른 단계의 줄(selectedIds) — 옅은 accent 면 + 첫 칸 왼쪽 2px 선, 글자·지표 색은 그대로.
 * 줄을 누르면 드로어(onRowClick)가 열리고, hover 위에서도 선택 표시는 유지된다.
 */
export const SelectedFromTimeline = {
  args: { rows: byPlatform.meta, selectedIds: [byPlatform.meta[1]?.campaignId].filter(Boolean) },
  render: (args) => <Box sx={(theme) => ({ border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.container}px` })}><RecapCampaignTable {...args} /></Box>,
};
