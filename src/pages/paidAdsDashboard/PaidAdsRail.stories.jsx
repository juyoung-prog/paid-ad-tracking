import { MemoryRouter } from 'react-router-dom';
import Box from '@mui/material/Box';
import { PaidAdsRail, RAIL_WIDTH } from './PaidAdsRail';
import { PaidAdsStoreProvider } from './PaidAdsStoreProvider';
import { createMockPaidAdsStore } from './createMockPaidAdsStore';

export default {
  title: 'Paid Ads Dashboard/Layout/PaidAdsRail',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## PaidAdsRail

네 페이지가 공유하는 좌측 아이콘 레일 내비게이션. 기본은 56px 아이콘 레일이고,
**마우스를 올리거나 키보드 포커스가 들어오면** 240px로 펼쳐지며 라벨이 나타난다.

- Dashboard / Reports / Stores 는 1급 내비, **Settings는 하단 유틸리티**로 분리했다.
  계정·토큰 관리는 매일 보는 화면이 아니라 같은 위계에 놓으면 내비가 평평해진다.
- 펼침은 본문 **위에 겹쳐서** 일어나므로 본문 폭·위치는 접힘/펼침과 무관하게 고정이다.
- 터치 기기에서는 펼치지 않는다(\`hover: hover\`) — 탭 후 hover가 남아 레일이
  펼쳐진 채 고정되기 때문. 라벨은 \`aria-label\`로 남는다.

### 200px 상시 노출로 바꿨다가 되돌렸다
"터치에서는 라벨이 영원히 안 나온다"는 이유로 hover 펼침을 걷어내고 200px 고정으로
바꾼 적이 있다. 되돌렸다 — **레퍼런스(influencer tracking dashboard)가 정확히 이
구조**이기 때문이다(접힘 52px 아이콘 전용, hover 시 261px). 이 프로젝트의 1순위
목표는 "같은 회사 툴군처럼 보이기"고, 두 도구를 오가는 사람에게는 내비게이션 폭이
다른 것 자체가 "다른 제품"이라는 신호가 된다.

일반 UX 원칙과 레퍼런스 일치가 부딪히면 **이 프로젝트에서는 일치가 먼저다.** 터치
라벨 문제를 정말 풀어야 한다면 레퍼런스 쪽과 함께 바꿔야지 이 앱만 따로 바꾸면
안 된다.

### 하단 유틸리티 블록 — 레퍼런스와 같은 구성
\`Last synced {시각}\` → \`Refresh\` → \`Settings\` 순서(13-4 실측). 레퍼런스의
\`Open Google Sheet\`만 없다 — 그쪽은 데이터 원천이 시트 하나라 그 행이 있고,
우리 원천은 Meta·TikTok 광고 관리자 둘이라 대응되는 단일 링크가 없다(캠페인
단위 딥링크는 Drawer가 담당).

Refresh는 Dashboard 헤더의 Sync now와 같은 동작(캠페인 → 성과 순서)이고, 끝나면
\`paidads:refresh\` 이벤트로 현재 페이지의 스토어에 다시 읽기를 알린다 — 레일은
어떤 페이지의 스토어에도 직접 접근할 수 없다. Last synced 행은 아이콘이 없어서
접힘 상태에서는 **높이째** 접힌다(라벨만 숨기면 빈 슬롯이 남는다).

이 프로젝트 전용이라 컴포넌트 라이브러리가 아니라 페이지 폴더에 둔다.
        `,
      },
    },
  },
};

/** 레일은 position:absolute라 높이가 정해진 relative 컨테이너 안에서만 보인다 */
const RailFrame = ({ path }) => (
  /* 스토어를 주입해 실조회(useSyncRuns)와 동기화 호출을 끈다 — 레일이 하단
     유틸리티 데이터를 스스로 읽기 때문에, 안 감싸면 스토리가 Supabase에
     실제 쿼리를 날린다. 주입 모드에서는 Last synced 행이 숨고(값 없음)
     Refresh는 보이되 눌러도 아무 일도 안 한다. */
  <PaidAdsStoreProvider value={ createMockPaidAdsStore() }>
  <MemoryRouter initialEntries={ [path] }>
    <Box sx={ { position: 'relative', isolation: 'isolate', display: 'flex', height: 420 } }>
      <Box aria-hidden sx={ { width: RAIL_WIDTH, flexShrink: 0 } } />
      <PaidAdsRail />
      <Box sx={ { flex: 1, minWidth: 0, p: 3, backgroundColor: 'background.default' } }>
        본문. 레일을 펼쳐도 이 영역의 폭과 위치는 움직이지 않는다.
      </Box>
    </Box>
  </MemoryRouter>
  </PaidAdsStoreProvider>
);

export const Default = {
  render: () => <RailFrame path="/dashboard" />,
};

export const OnStoresPage = {
  render: () => <RailFrame path="/stores" />,
};

/** 하단 유틸리티가 활성일 때 — 1급 내비와 다른 자리에서 강조된다 */
export const OnSettingsPage = {
  render: () => <RailFrame path="/settings" />,
};
