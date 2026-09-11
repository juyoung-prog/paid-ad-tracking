import Box from '@mui/material/Box';
import { useState } from 'react';
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
- **Video response**: Hook / Hold(라벨 + 값 600, 아래 순위) 앞에, 그 아래 Reach · Plays · Avg는 **3열 미니 그리드**(라벨 11px 옅게 위 · 값 12px 600 아래). 2026-09-12에 " · "로 이은 한 문장에서 바꿨다 — 숫자를 훑는 자리에 문장을 두면 읽어야 답이 나온다
- **Engagement / Action**: 대표 두 자리는 목표가 정한다 — 인지 참여율·CTR · 트래픽 CTR·CPC · 참여 참여율·Cost/eng · 전환 CPA·CTR. 그 아래는 목표와 무관하게 **참여 내역 4열 미니 그리드** — 첫 줄 Like · Cmt · Share · Save, 넘치면 둘째 줄에 같은 열로(Meta는 Repost. 한 줄에 다섯 이상 늘어놓지 않는다, 2026-09-12). TikTok의 Follow · Visits는 수집은 하되 **일단 감춘다**(schema HIDDEN_METRIC_KEYS — Meta에 같은 지표가 없어 두 플랫폼이 다른 칸을 보이던 것을 없앴다).(값 없는 항목은 뺀다 — 2026-09-11. 인플루언서 시트와 같은 일곱 값 없는 항목은 뺀다 — 2026-09-11. 인플루언서 시트와 같은 일곱 가지를 드로어·Performance·Reports가 같은 목록으로 본다. Save는 Meta만(post_save), Repost는 두 광고 API에 없어 수기 레코드만). 원본 값은 전부 행에 남아 있다
- **What worked · Could improve**: 12px 한 문장(1600px 창에서 240px 폭 → 두 줄), 네 줄에서 잘리고 전문은 hover. **편집 모드(\`isEditing\`)에서는 이 두 칸이 그 자리에서 입력 칸이 된다**(2026-09-10 — 지표를 보면서 해석을 쓰도록. 예전엔 아래 Notes 섹션으로 내려가야 했다): 본문과 같은 12px, 두 줄로 시작해 여섯 줄까지, 값은 **사람이 쓴 원문만** 들어간다 — 자동 문장은 값도 placeholder도 아니다(2026-09-10: placeholder에 자동 문장을 깔았더니 이미 저장된 글처럼 읽혔다). placeholder는 "Add custom note…" 안내뿐이고, 자동 문장은 **빈 칸에 hover·focus할 때 툴팁**("Generated note")으로 본다. 사람이 쓰기 시작하면 툴팁은 꺼진다. 테두리는 기본 divider · hover 한 단 진하게 · focus accent 1px. 편집 중에는 줄 클릭(드로어)이 꺼진다. 왼쪽 숫자를 되풀이하지 않고 **해석**만 한다 — "Early video attention stood out against comparable campaigns." / "Engagement efficiency was the clearest opportunity." 근거 지표는 **목표가 정한다**(schema \`GOAL_INSIGHT_METRICS\` — 인지 CPM + Hook·Hold·참여율·CTR · 트래픽 CPC·CTR + Hook·Hold · 참여 Cost/eng·참여율 + Hook·Hold · 전환 CPA + CTR·CPC·Hook·Hold). 이 목록은 표가 그 목표에서 실제로 그리는 지표와 같아 근거를 눈으로 좇을 수 있고, 대표 KPI가 약하면 그 약점이 Could improve에 먼저 온다. 근거가 없으면 "—"(억지 결론을 만들지 않는다). Reason·Next action 열은 없다. 사람이 쓴 note가 있으면 무엇이든 그대로 우선(2026-09-12: "..."·"ㅇㅇ" 같은 자리표시자도 걸러내지 않는다 — 저장한 것은 보인다. 지우면 자동 문장으로 돌아간다). 첫 열 왼쪽에 옅은 구분선

값의 무게는 지표의 **역할**이 정한다: 목표의 대표 KPI 700 > 나머지 대표 자리 600 > 보조 줄 11px 옅게.

### 계산은 하지 않는다
\`rows\`는 \`schema.js\`의 \`buildRecapRows().byPlatform[platform]\` — 순위·벤치마크·
Primary KPI·해석 재료(insight)까지 끝난 값이다. 이 컴포넌트는 자리에 놓고 \`utils/format\`으로 표기만
한다. 문구는 \`recapStrings\`에서 꺼낸다.

### 폭
열 폭은 고정(colgroup)이고 합이 컨테이너보다 넓으면 ScrollArea가 가로 스크롤과
좌측 그림자를 준다.

### 인쇄(2026-09-10 단일화)
**인쇄용 표를 따로 만들지 않는다** — 이 컴포넌트가 \`@media print\`에서 종이 치수로 갈아입는다.
한때 인쇄 전용 보고서 컴포넌트를 뒀는데 같은 보고서가 두 벌이 되어 시간이 지나면 갈라질 구조라 지웠다.
- **한 캠페인 = 한 줄**. 화면에서 한 줄인 것은 종이에서도 한 줄이어야 표로 읽힌다(2026-09-10: 해석 두 열을 둘째 줄로
  접어 봤더니 줄 높이가 두 배가 되어 다섯 캠페인이 한 쪽에 못 들어갔다). \`break-inside: avoid\`로 줄이 쪽을 넘어 갈라지지 않는다
- 열 폭: colgroup을 CSS로 덮어써 합 **726px**(Letter 세로 내용 폭, 인라인 style이라 \`!important\`가 필요하다) —
  14 / 92 / 54 / 58 / 60 / 140 / 140 / 84 / 84. 우선순위는 캠페인 이름 > 영상·참여 > 해석 두 열 > 숫자 칸 > 목표 > 순위
- 글자: 화면 위계 그대로 한 단씩 pt로(13 → 8pt · 12 → 7pt · 11 → 6.5pt). 네 줄 자르기는 풀고, 이름도 말줄임 대신 접는다 —
  종이에서 "…"는 정보를 영영 지운다. 해석 문장은 84px 열에서 두세 줄로 접힌다
- 여백은 조인다(px 3pt · py 2pt), 소재 썸네일과 ⓘ는 뺀다 — 88px 열에서 28px을 그림에 주면 이름이 두 글자만 남는다
- ScrollArea는 인쇄에서 스크롤 상자가 아니라 그냥 흐르는 내용이 된다(잘리는 열이 없다)
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
    renderRowExtra: { control: false, description: '(row) => node — 캠페인 칸 오른쪽 끝의 작은 것(편집 모드의 수기 입력 ⋯ 버튼). 열을 늘리지 않는다' },
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



/**
 * 편집 모드 — What worked · Could improve를 표 안에서 바로 고친다.
 * 첫 줄은 **사람이 쓴 값**이 있어 칸에 그 글이 들어가고, 나머지는 비어 있어 "Add custom note…" 안내만 보인다.
 * 자동 문장은 값도 placeholder도 아니다 — 빈 칸에 마우스를 올리거나 포커스하면 툴팁("Generated note")으로 보인다.
 */
export const Editing = {
  args: { isEditing: true },
  render: (args) => {
    // 스토리에서도 실제처럼 입력이 남아야 지우기·되돌아오기를 확인할 수 있다 — 페이지의 draft.notesById와 같은 모양
    const [notesById, setNotesById] = useState(() => Object.fromEntries(mockRecapCampaignNotes.map((n) => [n.campaignId, n])));
    const rows = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords, { notesById }).byPlatform.meta;
    return (
      <RecapCampaignTable
        {...args}
        rows={rows}
        onNoteChange={(campaignId, field, value) => setNotesById((prev) => ({
          ...prev,
          [campaignId]: { ...(prev[campaignId] ?? { campaignId }), [field]: { ko: null, 'zh-Hant': null, ...(prev[campaignId]?.[field] ?? {}), en: value } },
        }))}
      />
    );
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
