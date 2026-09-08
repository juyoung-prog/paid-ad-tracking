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

Recap(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표(Build Plan Phase 3). 회장님이 보던 보고서의
정보 구조 — 순위 · 매장 · 캠페인 · 일예산 · 지출 · **종합 성과** · 영상 반응 · 참여 반응 · 강점 · 개선점 · 이유 — 를
따르되, 스프레드시트 스타일이 아니라 지금의 시각 체계(흰 바탕, 옅은 경계선, 절제된 상태색)로 그린다(2026-09-08).
세 층으로 읽힌다: 1층 종합 성과 한 단어(5초) → 2층 무슨 일이 있었나(영상·참여 숫자) → 3층 해석(강점·개선점·이유).

### 셀 구성
- **Campaign**: 28px 소재 썸네일(CampaignThumbnail, 없으면 이니셜) + 단계 이름 굵게 + 기간·일수 · 목표. 원본 이름은 hover. 줄 전체가 드로어 버튼
- **Spend**: 실제 총지출만
- **Overall performance**: STRONG / AVERAGE / WEAK 배지(VerdictChip, 대문자·옅은 틴트) — schema \`buildOverallPerformance\`: 캠페인 목표(\`OVERALL_RULES\`)가 어떤 지표를 얼마나 중요하게 볼지 정하고 비용 + 영상 반응 + 참여 반응을 합친다. 대표 지표가 등급을 정하고 보조 지표는 한 단만 움직인다. 회사 KPI 기준값이 없어 고정 문턱은 없고, 각 지표는 앱의 기존 잣대(같은 플랫폼·목표의 과거 비교군 구간)로 읽되 순위 하나가 등급을 정하지 않는다. 대표 지표를 못 읽으면 "INSUFFICIENT DATA". 배지 아래 목표 결과의 비용 KPI("CPM $2.41", 옅게), 캠페인 목표치가 있을 때만 "↓ 20% vs target" 한 줄. 사람이 Edit에서 고른 등급이 우선. 툴팁에 규칙
- **Video response**: Reach · Plays · Avg(라벨 → 값, 12px/400) 위에 Hook / Hold(13px/600 + 비교군 화살표는 보조) 아래
- **Engagement response**: 목표가 강조를 정한다 — 트래픽은 Clicks·Like·Cmt·Share + CTR / CPC, 전환은 Results·Clicks·Like·Cmt + CPA / CTR / CPC, 나머지는 Like·Cmt·Share + Eng. rate / Cost/eng
- **Strengths · Areas to improve · Reason**: 사람이 Edit에서 쓴 문장이 우선, 없으면 등급과 같은 근거(지표 구간)에서 자동 생성 — 중요도 순으로 상위/하위인 지표 하나둘("Strong reach efficiency" / "Weak watch-through"), 이유는 관측된 관계만("Reach was generated efficiently, while engagement remained limited."). 원인(소재·메시지·타깃)은 단정하지 않는다. 인지 캠페인의 낮은 CTR은 개선점이 되지 않는다

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
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    onRowClick: { action: 'rowClicked', description: '숫자 줄 전체 클릭 (campaignId) => void — 보고서는 이걸로 캠페인 상세 드로어(성과·페이싱·캠페인 해석·일별 지출)를 연다. 벤치마크 글자는 예외' },
    label: { control: 'text', description: '스크롤 영역 접근성 이름' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/**
 * Meta — 비교군이 충분한 쪽. 확인 포인트:
 * - 순위가 대표 지표 백분위 순인가(Grand Opening 1위)
 * - 종합 성과: Grand Opening은 사람이 고른 등급(note.verdict)이 우선, 나머지는 자동. Now Open(store_visit)은 비교군이 없어 INSUFFICIENT DATA
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
        note: null, overall: { rating: null, reason: 'noData', strengths: [], weaknesses: [], primaryKeys: ['cpm'], secondaryKeys: ['hookRate', 'holdRate'], metricKey: 'cpm', value: null },
      },
    ],
  },
};

/** 캠페인에 목표치가 설정돼 있으면 종합 성과 배지 아래 "↓ 20% vs target $3.83" 한 줄이 붙는다(첫 줄만). 목표치 계산은 그대로다 */
export const WithTarget = {
  args: {
    rows: byPlatform.meta.map((r, i) => (i === 0 ? { ...r, kpiTarget: r.budgetEfficiency?.value != null ? Math.round(r.budgetEfficiency.value * 1.25 * 100) / 100 : null } : r)),
  },
};

/** 사람이 Edit에서 고른 등급·쓴 문장이 자동 값보다 우선한다 — 첫 줄은 사람이 쓴 것(툴팁 "Written by a person in Edit.") */
export const WithWrittenNotes = {
  args: {
    rows: byPlatform.meta.map((r, i) => (i === 0 ? { ...r, note: { ...(r.note ?? {}), verdict: 'mid', strength: { en: 'Store staff reported walk-ins during the teaser week' }, weakness: { en: 'Sale message ran two days late' }, reason: { en: 'Written by the store manager after the event.' } } } : r)),
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
