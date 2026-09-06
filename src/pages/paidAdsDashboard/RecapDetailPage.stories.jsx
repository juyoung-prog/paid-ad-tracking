import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PaidAdsShell } from './PaidAdsShell';
import { RecapPage } from './RecapPage';
import { RecapDetailPage } from './RecapDetailPage';
import { PaidAdsStoreProvider } from './PaidAdsStoreProvider';
import { createMockPaidAdsStore } from './createMockPaidAdsStore';
import {
  mockRecapCampaigns,
  mockRecapPerformanceRecords,
  mockEventRecaps,
  mockRecapCampaignNotes,
} from '../../data/paidAdsMockData';

const RECAP_TODAY = new Date('2026-09-06T00:00:00');

const recapStore = (overrides = {}) => createMockPaidAdsStore({
  campaigns: mockRecapCampaigns,
  performanceRecords: mockRecapPerformanceRecords,
  performanceDaily: [],
  eventRecaps: mockEventRecaps,
  recapCampaignNotes: mockRecapCampaignNotes,
  today: RECAP_TODAY,
  ...overrides,
});

const render = (store, path) => (
  <PaidAdsStoreProvider value={ store }>
    <MemoryRouter initialEntries={ [path] }>
      <Routes>
        <Route element={ <PaidAdsShell /> }>
          <Route path="/recap" element={ <RecapPage /> } />
          <Route path="/recap/:event" element={ <RecapDetailPage /> } />
        </Route>
      </Routes>
    </MemoryRouter>
  </PaidAdsStoreProvider>
);

export default {
  title: 'Paid Ads Dashboard/Page/RecapDetailPage',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## RecapDetailPage

이벤트 하나의 결과 보고서(\`/recap/:event\`) — 02-ux-flow 시나리오 7, Build Plan
Phase 4(1단계 마감). 위에서 아래로:

1. **머리글**(RecapHeader) — 이벤트·상태·기간·매장·플랫폼, KPI, 순위 한 줄
2. 저장된 요약 한 단락(있을 때)
3. **단계 타임라인**(PhaseTimelineChart, 읽기 전용) — 막대 옆에 실지출
4. **플랫폼별 캠페인 표**(RecapCampaignTable) — 비율 지표마다 벤치마크, 판정 칩
5. **Notes** — 캠페인별 장점·아쉬운 점·이유(저장된 게 있으면 읽기 전용, 없으면 2단계 안내)
6. **Learnings** — 배운 점 카드 + 다음 제언(저장된 게 있을 때)

계산은 schema.js(buildRecapRows · buildRecapHeadline · localizedText)와
paidAdsPageUtils(buildPhaseTimeline)가 한다. 인쇄 버튼은 브라우저 인쇄(=PDF)를
부르고, PaidAdsShell의 @media print 규칙이 레일·버튼을 숨긴다.

### 확인 포인트
- 머리글 순위 "Best of 5 comparable events by CPM"
- Meta 표는 벤치마크 숫자, TikTok 표는 전부 not enough data
- Grand Opening 판정은 채운 Good(사람 값), Coming Soon은 점선(제안), Now Open은 —
- Notes에 캠페인 3개, Learnings 카드 2개 + Next time
        `,
      },
    },
  },
};

/** G10 Opening — 저장된 Draft 보고서가 있는 이벤트 */
export const Default = {
  render: () => render(recapStore(), '/recap/G10%20Opening'),
};

/** 보고서를 아직 시작하지 않은 이벤트 — Notes는 2단계 안내, Learnings 카드는 없다 */
export const NotStarted = {
  render: () => render(recapStore(), '/recap/BF4%20Opening'),
};

/** 존재하지 않는 이벤트 */
export const NotFound = {
  render: () => render(recapStore(), '/recap/Nope%20Event'),
};

/** 한국어 — ?lang=ko. 화면 문구는 한국어, 저장된 문장은 ko 칸이 비어 en으로 대체되고 "(영어)" 표시가 붙는다 */
export const Korean = {
  render: () => render(recapStore(), '/recap/G10%20Opening?lang=ko'),
};

/** 번체중문 — ?lang=zh-Hant */
export const TraditionalChinese = {
  render: () => render(recapStore(), '/recap/G10%20Opening?lang=zh-Hant'),
};

/** 로딩 중 */
export const Loading = {
  render: () => render(recapStore({ isLoading: true }), '/recap/G10%20Opening'),
};
