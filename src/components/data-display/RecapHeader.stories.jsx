import Button from '@mui/material/Button';
import { RecapHeader } from './RecapHeader';
import { buildRecapHeadline } from '../../data/schema';
import { mockRecapCampaigns, mockRecapPerformanceRecords } from '../../data/paidAdsMockData';

/* 순위 재료는 schema.js가 만든다 — 스토리는 결과를 넘길 뿐 */
const headline = buildRecapHeadline('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords);

export default {
  title: 'Paid Ads Dashboard/Data Display/RecapHeader',
  component: RecapHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RecapHeader

Recap 문서의 머리글(Build Plan Phase 3) — 이벤트 이름 + 보고서 상태, 기간·매장·
플랫폼 한 줄, KpiBar(캠페인 수 · 지출 · 매장), 그리고 **순위 한 줄**.

### 순위 한 줄이 왜 따로 있나
"Best of 5 comparable events by CPM"은 읽는 사람이 가장 먼저 보는 판단이라 KPI
아래에 굵게 둔다. 재료(\`headline\`)는 \`schema.js\`의 \`buildRecapHeadline()\`이
만들고, 비교 이벤트가 3개 미만이면 null이 와서 그 줄이 사라진다 — 없는 비교를
지어내지 않는다.

### 계산은 하지 않는다
합계·순위는 페이지가 schema.js로 만들어 넘긴다. 이 컴포넌트는 KpiBar를 재활용해
자리에 놓고 문구를 \`recapStrings\`에서 꺼낼 뿐이다.
        `,
      },
    },
  },
  argTypes: {
    eventName: { control: 'text', description: '이벤트 이름' },
    startDate: { control: 'text', description: '시작일(ISO date)' },
    endDate: { control: 'text', description: '종료일(ISO date)' },
    campaignCount: { control: 'number', description: '캠페인 수' },
    spend: { control: 'number', description: '총 지출' },
    plannedBudget: { control: 'number', description: '계획 예산 합 — 있으면 "of $X planned"' },
    stores: { control: 'object', description: '타겟 매장 코드 목록' },
    platforms: { control: 'object', description: '플랫폼 표시명 목록' },
    headline: { control: 'object', description: 'buildRecapHeadline() 결과 또는 null' },
    status: { control: 'select', options: ['draft', 'final', null], description: '보고서 상태' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    actions: { control: false, description: '오른쪽 위 액션(인쇄 버튼 등)' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

const base = {
  eventName: 'G10 Opening',
  startDate: '2026-06-17',
  endDate: '2026-08-31',
  campaignCount: 6,
  spend: 3896.5,
  plannedBudget: 4320,
  stores: ['G10'],
  platforms: ['Meta', 'TikTok'],
  status: 'draft',
};

/** 순위 1위 — "Best of 5 comparable events by CPM" + 이벤트 순서 */
export const Default = {
  args: { ...base, headline },
};

/** 순위 2위 — "#2 of 5 …" */
export const Ranked = {
  args: { ...base, headline: { ...headline, rank: 2 } },
};

/** 비교 이벤트가 3개 미만 — 순위 줄이 사라진다 */
export const NoHeadline = {
  args: { ...base, headline: null },
};

/** Final 상태 + 오른쪽 액션(인쇄) */
export const FinalWithActions = {
  args: { ...base, headline, status: 'final' },
  render: (args) => (
    <RecapHeader {...args} actions={<Button variant="outlined" size="small">Print / PDF</Button>} />
  ),
};

/** 아직 보고서를 시작하지 않은 이벤트 — 상태 "Not started", 계획 예산 없음 */
export const NotStarted = {
  args: { ...base, headline: null, status: null, plannedBudget: null, stores: [], platforms: ['Meta'] },
};
