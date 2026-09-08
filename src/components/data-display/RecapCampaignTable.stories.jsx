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

Recap(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표(Build Plan Phase 3). 열은 서로 다른 질문 하나씩이고
**종합 등급은 없다**(2026-09-08 제품 결정 — 회사 KPI 기준값이 없고, 과거 비교로 등급을 만들지 않는다):
순위 · 매장 · 캠페인 · **Goal** · 일예산 · 지출 · **Primary KPI** · **vs target** · **vs past** · 영상 반응 · 참여 반응 · 행동 반응 ·
**What worked · Could improve · Why · Next action**(2026-09-08 — 드로어의 Campaign insights를 표로 옮겼다. 현재 지표 → 과거 맥락 →
해석 → 다음 행동을 가로로 한 번에 읽는다. 표가 넓어져 가로 스크롤한다).

### 셀 구성
- **Campaign**: 28px 소재 썸네일(CampaignThumbnail, 없으면 이니셜) + 단계 이름 굵게(한 줄 말줄임, 원본 이름은 hover) + 기간·일수. 줄 전체가 드로어 버튼
- **Goal**: 캠페인 데이터의 목표 한 단어(Awareness · Traffic · Engagement · Conversion · Store visit). 등급도 해석도 과거 비교도 없다
- **Spend**: 실제 총지출만
- **Primary KPI**: 목표가 정하는 실제 대표 결과 — 인지 CPM · 트래픽 CPC · 참여 Cost/eng(지출 ÷ 좋아요+댓글+공유) · 전환/매장 방문 CPA. 라벨(옅게) + 현재 값(700). Strong/Good/Efficient 같은 판단어는 붙이지 않는다. 툴팁에 계산식만
- **vs target**: 캠페인에 명시적으로 설정된 목표치(kpiTarget)와의 비교만 — "↓ 20% vs target $3.00", 없으면 "—"(툴팁 Not set). 과거 중앙값·사분위·플랫폼 기준·고정 문턱으로 대신하지 않는다. 이 표의 캠페인 중 하나도 목표치가 없으면 열을 숨기고 그 74px를 캠페인·영상·참여·행동에 나눠 준다
- **vs past**: Primary KPI를 같은 플랫폼·목표의 과거 비교군(다른 이벤트, 3개 이상)과 견준 순위("↗ best of 12" · "top 9%" · "mid" · "↘ lowest of 4"), 부족하면 "—". 과거 데이터가 쓰이는 유일한 전용 열이며 **맥락일 뿐 등급이 아니다**
- **Video response**: Reach · Plays · Avg(라벨 → 값, 12px/400) 위에 Hook / Hold(13px/600) 아래. 지표 옆 화살표는 "비교군 4개 중 최고" 같은 명시된 과거 맥락
- **Engagement response**: Like · Cmt · Share + Eng. rate / Cost/eng
- **Action response**: Clicks · Results · Profile + CTR / CPC (+ conversion goal이면 CPA)
- **What worked · Could improve · Why · Next action**: 한 문장씩(12px, 네 줄에서 잘리고 전문은 hover). 재료는 schema \`buildCampaignInsight\`(비교군 순위·초과 지출뿐)이고 문장은 \`insightSentence\`가 만든다 — "CPM ranked best among 12 comparable Meta awareness campaigns." / "Hold was in the bottom 26% of comparable Meta awareness campaigns." 순위 근거 없이 strong/weak라 하지 않고, Why는 관측된 관계만 적고 "the data does not show why"로 닫는다(소재·타깃·메시지 추정 없음). Next action은 관측에 붙는 구체적 한 걸음. 사람이 Edit에서 쓴 note(strength/weakness/reason)가 있으면 우선(툴팁 "Written by a person in Edit."). 첫 열 왼쪽에 옅은 구분선, 상자·등급 없음

모든 지표가 같은 문법 **라벨 → 값 → 비교**를 쓴다. 위계는 글자 무게로만, 무게는 지표의 **역할**이 정한다: 목표의 대표 KPI 700 >
진단 지표(Hook·Hold·Eng. rate·CTR) 600 > 그 밖의 수량·비용 지표 400. 라벨은 11px secondary, 순위 글자는 그대로.

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
    platformLabel: { control: 'text', description: '해석 문장에 쓰는 플랫폼 표시명("Meta")' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    onRowClick: { action: 'rowClicked', description: '숫자 줄 전체 클릭 (campaignId) => void — 보고서는 이걸로 캠페인 상세 드로어(성과·페이싱·캠페인 해석·일별 지출)를 연다. 벤치마크 글자는 예외' },
    label: { control: 'text', description: '스크롤 영역 접근성 이름' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/**
 * Meta — 비교군이 충분한 쪽. 확인 포인트:
 * - 순위가 대표 지표 백분위 순인가(Grand Opening 1위)
 * - Primary KPI는 목표별로 다르다(인지 CPM · 트래픽 CPC · 매장 방문 CPA). Now Open(store_visit)은 비교군이 없어 vs past가 "—"
 * - 해석 네 열: Grand Opening은 사람이 쓴 note가 우선(툴팁 "Written by a person in Edit."), 나머지는 순위 근거 문장. 비교군 없는 줄은 Why가 "Not enough evidence"
 * - Now Open(store_visit)은 비교군이 없어 전 지표 "not enough data"이고 Action 칸에 CPA가 추가로 보이는가
 * - Spend 아래 CPM이 "best of 5"처럼 양 끝 표현을 쓰는가
 */
export const Meta = {
  args: { rows: byPlatform.meta, platformLabel: 'Meta' },
};

/** TikTok — 비교군 2개뿐이라 모든 벤치마크가 "not enough data". 값은 그대로 보인다 */
export const TikTokNotEnoughData = {
  args: { rows: byPlatform.tiktok, platformLabel: 'TikTok' },
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
        note: null, budgetEfficiency: { metricKey: 'cpm', value: null },
      },
    ],
  },
};

/** 캠페인에 목표치가 설정돼 있으면 vs target 열이 나타난다 — 첫 줄은 "↓ 20% vs target $3.83", 나머지는 "—". 목표치 계산은 그대로다 */
export const WithTarget = {
  args: {
    rows: byPlatform.meta.map((r, i) => (i === 0 ? { ...r, kpiTarget: r.budgetEfficiency?.value != null ? Math.round(r.budgetEfficiency.value * 1.25 * 100) / 100 : null } : r)),
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
