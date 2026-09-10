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

이벤트 하나의 결과 보고서(\`/recap/:event\`, 레일 이름은 **Reports**) — 02-ux-flow
시나리오 7, Build Plan Phase 4~7. 위에서 아래로:

1. **머리글**(RecapHeader) — 이벤트·상태·기간·매장·플랫폼, KPI, 순위 한 줄. 오른쪽에 언어 드롭다운·Edit·Export
2. 저장된 요약 한 단락(있을 때)
3. (Key takeaways 섹션은 2026-09-08에 뺐다 — 캠페인 표가 같은 요약을 준다. 다른 요약 섹션으로 대체하지 않는다)
4. **단계 타임라인**(PhaseTimelineChart) — 막대 옆에 실지출. 행을 누르면 아래 표의 그 단계 줄로 스크롤하고 선택 표시만 한다(드로어는 열지 않는다)
5. **플랫폼별 캠페인 표**(RecapCampaignTable) — 숫자 줄 아무 데나 누르면 Performance와 같은 캠페인 상세 드로어(CampaignDetailPanel)가 이 페이지 위에 열린다: 소재·View ad·Ads Manager·Billing·예산·페이싱·일별 지출. 비율 지표마다 벤치마크(↗↘), Efficiency 배지. 줄 끝 셰브론·아래 펼침은 없다
6. (Learnings 섹션도 2026-09-08에 뺐다 — 표의 해석 열과 중복. 편집 모드의 이벤트 글 폼은 남는다)

편집 모드(Edit, 로그인)는 화면을 옮기지 않는다(2026-09-10) — **표의 What worked · Could improve 칸이 그 자리에서
입력 칸이 되어** 지표를 보면서 해석을 쓴다. 아래 Notes 카드에는 화면에 안 나오는 값(평가·이유·오가닉 조회/참여)만
남고, 이벤트 글(상태·요약·배운 점·제언) 편집기가 함께 나온다. AI draft·Translate는 빈 칸에만 초안을 채운다.
계산은 schema.js(buildRecapRows · buildRecapHeadline · buildCampaignInsight ·
localizedText)와 paidAdsPageUtils(buildPhaseTimeline)가 한다. Export의 PDF는 브라우저
인쇄를 부르고 PaidAdsShell의 @media print 규칙이 레일·버튼을 숨긴다. Google Sheets는 표를 클립보드에 복사한다.

### 확인 포인트
- 머리글 순위 "Best of 5 comparable events by CPM"
- Meta 표는 벤치마크(↗ best of 5 …), TikTok 표는 전부 not enough data
- 표에 등급 열은 없다 — Primary KPI(목표별 실제 값, 그 아래 과거 비교 순위)와 해석 두 열(What worked · Could improve)뿐. 사람이 쓴 note가 있으면 그것이 우선(툴팁 "Written by a person in Edit."), 없으면 순위 근거 문장
- 타임라인 "Grand Opening" 행 클릭 → 표의 그 줄로 스크롤 + 옅은 accent 면 + 왼쪽 2px 선(선택 표시). 드로어는 안 열린다. 빈 곳을 누르면 표시가 사라진다
- 줄 클릭 → 드로어(성과·페이싱·일별 지출). 편집 모드에서는 줄 클릭이 꺼지고 해석 두 칸이 입력 칸이 된다 — 값은 사람이 쓴 글만, 자동 문장은 빈 칸 hover 툴팁("Generated note")과 "Add custom note…" 안내로만 보인다
- Learnings 섹션 없음(2026-09-08) — 편집 모드에서만 이벤트 글(상태·요약·배운 점·제언) 폼
        `,
      },
    },
  },
};

/** G10 Opening — 저장된 Draft 보고서가 있는 이벤트 */
export const Default = {
  render: () => render(recapStore(), '/recap/G10%20Opening'),
};

/** 보고서를 아직 시작하지 않은 이벤트 — 사람이 쓴 note가 없어 해석 두 열이 전부 자동 문장 */
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
