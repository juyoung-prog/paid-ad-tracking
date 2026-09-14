import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PaidAdsShell } from './PaidAdsShell';
import { DashboardPage } from './DashboardPage';
import { PaidAdsStoreProvider } from './PaidAdsStoreProvider';
import { createMockPaidAdsStore } from './createMockPaidAdsStore';

export default {
  title: 'Paid Ads Dashboard/Page/DashboardPage',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## DashboardPage

레일에서는 **Campaigns**(2026-09-10, 예전 이름 Dashboard — 캠페인 색인이라는 역할을 이름이 말하게 했다.
경로 \`/dashboard\`와 컴포넌트 이름은 그대로). 메인 현황 화면(\`/dashboard\`). 실제 앱에서는 usePaidAdsStore가 Supabase를
읽지만, 스토리북에는 백엔드도 로그인 세션도 없으므로 PaidAdsStoreProvider로
mock 스토어를 주입해 렌더한다. 알림은 저장된 값이 아니라 schema.js의
generateAlerts()로 매번 다시 계산된다. 타이틀+네비는 PaidAdsShell(글로벌 셸)이
그리므로, 실제 화면과 동일하게 셸까지 포함해서 렌더링한다.

### 동기화 캠페인 드로어 — 참여 칸은 사람이 고칠 수 있다 (2026-09-11)
동기화 캠페인은 입력 폼 대신 읽기 목록(PlatformMetricList)을 보이는데, 그 아래 **Engagement** 편집 그리드
(SocialMetricsFields)가 있다 — Meta는 Likes · Comments · Shares · Saves · Reposts, TikTok은 Likes · Comments ·
Shares · Saves(Follows · Profile Visits는 API 값만, 수정 금지). Save Engagement는 manual 행을 만들지 않고 **최신 api
행의 그 칸만** 고치고(스토어 \`updatePerformanceEngagement\`), 고친 칸은 \`manual_fields\`에 적혀 라벨 옆에 "edited"가
붙는다 — 다음 동기화가 그 칸은 API 값으로 덮지 않는다. 이 스토리의 mock 스토어에서는 저장이 noop이다.

Meta 캠페인의 **View ad**는 광고용 사본이 아니라 원본 인스타 게시물(\`/p/<code>/\`)로 간다(2026-09-12,
sync-campaigns가 creative.source_instagram_media_id의 permalink를 우선한다).

### 상단의 "no Event" 안내는 정상이다
mockCampaigns에는 \`campaignGroup\` 필드가 아예 없어서, 모든 mock 캠페인이 태그 없는
상태로 렌더된다 — 그래서 \`N campaigns have no Event\` 안내가 항상 뜬다. 이건 버그가
아니라 **실제 계정의 기본 상태를 그대로 재현한 것**이다: 동기화로 들어온 캠페인은
Event 태그 없이 도착하고, 태그를 안 붙이면 이벤트 요약·계획 대비에서 통째로 빠진다.

\`Tag them\`을 누르면 BulkEventTagDialog가 열린다. mock 스토어의
\`bulkSetCampaignGroup\`은 상태를 바꾸지 않지만 마지막 인자를 그대로 돌려주는
스텁이라(실패로 보이지 않게 하려는 의도), 적용하면 성공 스낵바가 뜬다 — 태그된
개수 자리에 이벤트 이름이 들어가고 목록의 태그도 그대로다. 대화상자 자체의
동작은 그 컴포넌트의 스토리에서 확인한다.
        `,
      },
    },
  },
};

export const Default = {
  render: () => (
    <PaidAdsStoreProvider value={ createMockPaidAdsStore() }>
      <MemoryRouter initialEntries={ ['/dashboard'] }>
        <Routes>
          <Route element={ <PaidAdsShell /> }>
            <Route path="/dashboard" element={ <DashboardPage /> } />
          </Route>
        </Routes>
      </MemoryRouter>
    </PaidAdsStoreProvider>
  ),
};

/** 데이터가 하나도 없을 때의 빈 상태 — 실제 신규 계정이 처음 보는 화면이다. */
export const Empty = {
  render: () => (
    <PaidAdsStoreProvider value={ createMockPaidAdsStore({ campaigns: [], performanceRecords: [] }) }>
      <MemoryRouter initialEntries={ ['/dashboard'] }>
        <Routes>
          <Route element={ <PaidAdsShell /> }>
            <Route path="/dashboard" element={ <DashboardPage /> } />
          </Route>
        </Routes>
      </MemoryRouter>
    </PaidAdsStoreProvider>
  ),
};
