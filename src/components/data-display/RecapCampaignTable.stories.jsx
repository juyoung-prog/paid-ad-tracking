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

Recap(캠페인 종료 후 결과 보고)의 플랫폼별 캠페인 표(Build Plan Phase 3) — **임원용 평가 시트**(2026-09-08).
한 줄을 왼쪽에서 오른쪽으로 읽으면 결정에 필요한 이야기가 가로 스크롤 없이 끝난다(1600px 이상 창, 열 폭 합 1458):
무엇인가(캠페인 + Goal) → 얼마 썼나(Budget / Spend) → 주 결과는(Primary KPI + 그 아래 과거 비교) → 주변 반응은
(Video response · Engagement / Action) → 그래서(What worked · Could improve). 표는 여기서 끝난다.
종합 등급·vs target·드로어 해석은 없다(제품 결정). 좁은 창(1440 이하)은 글자를 줄이지 않고 가로 스크롤한다.

### 셀 구성
- **Campaign**: 28px 소재 썸네일 + 단계 이름 굵게(한 줄 말줄임, 원본 이름은 hover) + "G10 · Jul 6 – Aug 31 (57 days)"(매장 열을 따로 두지 않는다). 줄 전체가 드로어 버튼
- **Goal**: 캠페인 데이터의 목표 한 단어. 등급도 해석도 없다
- **Budget / Spend**: "$20.00/day"(옅게) 위, "$1,119.30 spent"(굵게) 아래. 계획 대비 ±20/30% 벗어나면 셋째 줄
- **Primary KPI**: 목표가 정하는 실제 대표 결과 — 인지 CPM · 트래픽 CPC · 참여 Cost/eng · 전환/매장 방문 CPA. 라벨(옅게) + 값(700), **그 아래 같은 KPI의 과거 비교**("↗ best of 12", 비교군 3개 미만이면 "—"). 순위는 맥락이지 등급이 아니다. 판단어 없음
- **Video response**: Hook / Hold(라벨 + 값 600, 아래 순위) 앞에, "Reach 163K · Plays 296K · Avg 2s"는 옅은 보조 줄
- **Engagement / Action**: 목표가 대표 두 자리와 보조 줄을 정한다 — 인지 참여율·CTR + 클릭 수·CPC · 트래픽 CTR·CPC + 클릭 수·참여율 · 참여 참여율·Cost/eng + 좋아요·공유 · 전환 CPA·CTR + 결과 수·CPC. 원본 값은 전부 행에 남아 있다
- **What worked · Could improve**: 12px 한 문장(1600px 창에서 240px 폭 → 두 줄), 네 줄에서 잘리고 전문은 hover. **편집 모드(\`isEditing\`)에서는 이 두 칸이 그 자리에서 입력 칸이 된다**(2026-09-10 — 지표를 보면서 해석을 쓰도록. 예전엔 아래 Notes 섹션으로 내려가야 했다): 본문과 같은 12px, 두 줄로 시작해 여섯 줄까지, 값은 사람이 쓴 원문만 넣고 자동 문장은 placeholder로 깔아 "비우면 이게 남는다"를 보인다. 편집 중에는 줄 클릭(드로어)이 꺼진다. 왼쪽 숫자를 되풀이하지 않고 **해석**만 한다 — "Early video attention stood out against comparable campaigns." / "Engagement efficiency was the clearest opportunity." 근거 지표는 **목표가 정한다**(schema \`GOAL_INSIGHT_METRICS\` — 인지 CPM + Hook·Hold·참여율·CTR · 트래픽 CPC·CTR + Hook·Hold · 참여 Cost/eng·참여율 + Hook·Hold · 전환 CPA + CTR·CPC·Hook·Hold). 이 목록은 표가 그 목표에서 실제로 그리는 지표와 같아 근거를 눈으로 좇을 수 있고, 대표 KPI가 약하면 그 약점이 Could improve에 먼저 온다. 근거가 없으면 "—"(억지 결론을 만들지 않는다). Reason·Next action 열은 없다. 사람이 쓴 note 우선(자리표시자 무시). 첫 열 왼쪽에 옅은 구분선

값의 무게는 지표의 **역할**이 정한다: 목표의 대표 KPI 700 > 나머지 대표 자리 600 > 보조 줄 11px 옅게.

### 계산은 하지 않는다
\`rows\`는 \`schema.js\`의 \`buildRecapRows().byPlatform[platform]\` — 순위·벤치마크·
Primary KPI·해석 재료(insight)까지 끝난 값이다. 이 컴포넌트는 자리에 놓고 \`utils/format\`으로 표기만
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
    isEditing: { control: 'boolean', description: 'true면 What worked · Could improve가 인라인 편집 칸이 된다' },
    onNoteChange: { action: 'noteChanged', description: '(campaignId, field, value) => void — field는 strength | weakness' },
    isDisabled: { control: 'boolean', description: '저장 중 등 입력 잠금' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    onRowClick: { action: 'rowClicked', description: '숫자 줄 전체 클릭 (campaignId) => void — 보고서는 이걸로 캠페인 상세 드로어(성과·페이싱·캠페인 해석·일별 지출)를 연다. 벤치마크 글자는 예외' },
    label: { control: 'text', description: '스크롤 영역 접근성 이름' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/**
 * Meta — 비교군이 충분한 쪽. 확인 포인트:
 * - 순위가 대표 지표 백분위 순인가(Grand Opening 1위)
 * - Primary KPI는 목표별로 다르다(인지 CPM · 트래픽 CPC · 매장 방문 CPA). Now Open(store_visit)은 비교군이 없어 KPI 아래 순위 줄이 "—"
 * - 해석 두 열: Grand Opening은 사람이 쓴 note가 우선(툴팁 "Written by a person in Edit."), 나머지는 순위 근거 해석. 근거가 없으면 "—"
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
        note: null, budgetEfficiency: { metricKey: 'cpm', value: null },
      },
    ],
  },
};



/** 편집 모드 — What worked · Could improve가 표 안에서 바로 고쳐진다. 사람이 쓴 값이 없으면 칸은 비고 자동 문장이 placeholder로 깔린다 */
export const Editing = {
  args: { rows: byPlatform.meta, isEditing: true },
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
