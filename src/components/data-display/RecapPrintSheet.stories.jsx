import Box from '@mui/material/Box';
import { RecapPrintSheet } from './RecapPrintSheet';
import { buildRecapRows, buildRecapHeadline, campaignNameKey } from '../../data/schema';
import { buildPhaseTimeline, PLATFORM_LABEL } from '../../pages/paidAdsDashboard/paidAdsPageUtils';
import { mockRecapCampaigns, mockRecapPerformanceRecords, mockRecapCampaignNotes } from '../../data/paidAdsMockData';

/* 스토리는 계산하지 않는다 — 페이지가 넘기는 것과 같은 모양(schema.js 결과)을 그대로 넘긴다 */
const notesById = Object.fromEntries(mockRecapCampaignNotes.map((n) => [n.campaignId, n]));
const { byPlatform } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords, { notesById });
const eventCampaigns = mockRecapCampaigns.filter((c) => c.campaignGroup === 'G10 Opening');
const phases = buildPhaseTimeline(eventCampaigns);
const sections = Object.keys(PLATFORM_LABEL)
  .filter((p) => byPlatform[p]?.length)
  .map((platform) => ({ platform, label: PLATFORM_LABEL[platform], rows: byPlatform[platform] }));
const allRows = sections.flatMap((s) => s.rows);
const spend = allRows.reduce((sum, r) => sum + (r.spend ?? 0), 0);
const headline = buildRecapHeadline('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords);
/* 단계별 지출 — 페이지와 같은 방식(행의 지출을 단계 키로 합친다) */
const phaseSpend = allRows.reduce((acc, r) => {
  if (r.spend != null) acc[campaignNameKey(r.name)] = (acc[campaignNameKey(r.name)] ?? 0) + r.spend;
  return acc;
}, {});

/**
 * 종이 한 장 흉내 — 이 컴포넌트는 @media print에서만 그려지므로, 스토리에서는
 * Letter 세로의 내용 폭(216mm − 좌우 12mm ≈ 726px)을 가진 흰 면 안에서 display를 되살려 본다.
 * 실제 인쇄에서는 이 틀 없이 종이 여백을 @page가 준다.
 */
const PAPER_SX = {
  width: 726,
  maxWidth: '100%',
  mx: 'auto',
  p: 3,
  backgroundColor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  '& [data-print="sheet"]': { display: 'block' },
};
const onPaper = (args) => (
  <Box sx={PAPER_SX}>
    <RecapPrintSheet {...args} />
  </Box>
);

export default {
  title: 'Paid Ads Dashboard/Data Display/RecapPrintSheet',
  component: RecapPrintSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapPrintSheet

Event Recap의 **인쇄 전용 문서**(Letter 세로). 인쇄본은 화면을 축소한 것이 아니라 종이 한 장의
흐름에 맞춰 다시 짠 문서다 — 화면의 아홉 열짜리 표와 가로 막대 타임라인은 세로 Letter에 들어가지
않으므로, 인쇄에서는 같은 값을 세로로 읽는 형태로 바꾼다. 화면 컴포넌트는 그대로 두고 이 컴포넌트만
\`@media print\`에서 나타난다 — **웹 레이아웃은 한 픽셀도 바뀌지 않는다**.

### 구성
- **머리글**: 이벤트 이름 + 상태, "Jun 17 – Aug 31 · G10 · Meta + TikTok", "9 campaigns · $6,068.77 spent of $6,728 planned", 순위 한 줄. 화면의 KPI 카드는 종이에서 자리만 먹어 쓰지 않는다
- **Timeline**: 화면과 같은 **막대 그래프**(RecapPrintTimeline) — 표로 바꾸지 않는다. 겹침·기간은 막대의 위치와 길이만 답한다. 좁아진 폭은 치수를 다시 잡아 해결한다(왼쪽 40% 정보 / 축 60%, 눈금은 각 달 1·15일과 기간 양 끝)
- **플랫폼 제목**(Meta campaigns / TikTok campaigns) 아래 **캠페인 블록**이 세로로 쌓인다. 한 블록은 이름·순위·목표·기간 다음에 Budget / Spend · Primary KPI · Video response · Engagement / Action · What worked · Could improve를 라벨-값 목록으로 놓는다
- 블록은 \`break-inside: avoid\` — 페이지 경계에서 쪼개지지 않는다(실측 블록 높이 100–217px, Letter 내용 높이 965px)

### 규칙
- **글자 크기는 pt**다(본문 9pt · 보조 8pt · 블록 제목 10.5pt · 섹션 11pt · 제목 17pt) — 종이에서만 그려지는 컴포넌트라 px가 아니라 종이 단위로 잡는다
- **색은 흑백 출력에서 살아남는 것만**: text.primary · text.secondary · divider. 순위의 초록·주황은 회색으로 뭉개져 뜻을 잃으므로 색 대신 글자로만 말한다("CPM $2.41 (best of 12)")
- 목표별 지표 구성과 해석 문장은 화면 표와 **같은 모듈**(\`recapRowView\`)에서 온다 — 웹에서 읽은 문장이 PDF에서 달라지지 않는다
- 값이 없는 줄은 라벨째 빠진다(빈 라벨만 남는 줄은 종이를 낭비한다)

### 인쇄 지면
용지·여백은 셸(\`PaidAdsShell\`)의 \`@page { size: letter portrait; margin: 12mm }\`가 정하고, 화면 블록은
\`data-print="hide"\`로 통째로 빠진다(사이드바·언어 선택·Edit·Export·AI draft·Translate·Save·Cancel·⋯ 버튼·입력 칸).
브라우저가 찍는 머리글·꼬리글(날짜·URL)은 CSS로 끌 수 없다 — 인쇄 대화상자의 "Headers and footers"를 끈다.
        `,
      },
    },
  },
  argTypes: {
    phases: { control: false, description: 'buildPhaseTimeline() 결과 — 단계별 요약 표' },
    sections: { control: false, description: '[{ platform, label, rows }] — 플랫폼별 캠페인 행(buildRecapRows 결과)' },
    phaseSpend: { control: 'object', description: 'phase.key → 지출 합' },
    headline: { control: 'object', description: 'buildRecapHeadline() 결과. 없으면 순위 줄을 생략한다' },
    status: { control: 'select', options: [null, 'draft', 'final'], description: '보고서 상태' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
  },
};

const baseArgs = {
  eventName: 'G10 Opening',
  startDate: '2026-06-17',
  endDate: '2026-08-31',
  campaignCount: eventCampaigns.length,
  spend,
  plannedBudget: 6728,
  stores: ['G10'],
  platforms: sections.map((s) => s.label),
  headline,
  status: 'draft',
  phases,
  phaseSpend,
  sections,
};

/**
 * 기본 — 인쇄에서 나오는 그대로. 확인 포인트:
 * - 머리글이 네 줄 안에 끝나는가(KPI 카드 없음)
 * - Timeline이 단계마다 한 줄인가
 * - 캠페인 블록이 세로로 쌓이고, 라벨 열이 한 줄로 정렬되는가
 * - 순위가 색이 아니라 괄호 글자인가("(best of 12)")
 */
export const Default = { args: baseArgs, render: onPaper };

/** 요약 단락이 있을 때 — 머리글 바로 아래 한 단락. 없으면 그 자리는 비지 않고 사라진다 */
export const WithSummary = {
  render: onPaper,
  args: { ...baseArgs, summary: { en: 'Opening week carried the whole event — Meta reach efficiency was the best we have recorded, while engagement cost on TikTok stayed high through the last two phases.' } },
};

/** 순위 재료가 없을 때 — 머리글의 순위 줄이 사라진다(지어내지 않는다) */
export const WithoutHeadline = {
  render: onPaper,
  args: { ...baseArgs, headline: null, status: 'final' },
};
