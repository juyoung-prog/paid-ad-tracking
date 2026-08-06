import { MemoryRouter } from 'react-router-dom';
import Box from '@mui/material/Box';
import { PaidAdsRail, RAIL_WIDTH } from './PaidAdsRail';

export default {
  title: 'Paid Ads Dashboard/Layout/PaidAdsRail',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## PaidAdsRail

네 페이지가 공유하는 좌측 아이콘 레일 내비게이션. 기본은 56px 아이콘 레일이고,
**마우스를 올리거나 키보드 포커스가 들어오면** 펼쳐지며 라벨이 나타난다.

- Dashboard / Reports / Stores 는 1급 내비, **Settings는 하단 유틸리티**로 분리했다.
  계정·토큰 관리는 매일 보는 화면이 아니라 같은 위계에 놓으면 내비가 평평해진다.
- 펼침은 본문 **위에 겹쳐서** 일어나므로 본문 폭·위치는 접힘/펼침과 무관하게 고정이다.
- 터치 기기에서는 펼치지 않는다(\`hover: hover\`) — 탭 후 hover가 남아 레일이
  펼쳐진 채 고정되기 때문. 라벨은 \`aria-label\`로 남는다.

이 프로젝트 전용이라 컴포넌트 라이브러리가 아니라 페이지 폴더에 둔다.
        `,
      },
    },
  },
};

/** 레일은 position:absolute라 높이가 정해진 relative 컨테이너 안에서만 보인다 */
const RailFrame = ({ path }) => (
  <MemoryRouter initialEntries={ [path] }>
    <Box sx={ { position: 'relative', isolation: 'isolate', display: 'flex', height: 420 } }>
      <Box aria-hidden sx={ { width: RAIL_WIDTH, flexShrink: 0 } } />
      <PaidAdsRail />
      <Box sx={ { flex: 1, minWidth: 0, p: 3, backgroundColor: 'background.default' } }>
        본문. 레일을 펼쳐도 이 영역의 폭과 위치는 움직이지 않는다.
      </Box>
    </Box>
  </MemoryRouter>
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
