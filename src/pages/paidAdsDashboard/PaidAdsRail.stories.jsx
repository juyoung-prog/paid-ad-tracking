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

네 페이지가 공유하는 좌측 내비게이션 레일. 아이콘과 라벨이 **항상** 보인다(200px).

- Dashboard / Reports / Stores 는 1급 내비, **Settings는 하단 유틸리티**로 분리했다.
  계정·토큰 관리는 매일 보는 화면이 아니라 같은 위계에 놓으면 내비가 평평해진다.
- 활성 행은 **옅은 액센트 틴트 + 액센트 글자색 + 좌측 2px 바** 세 가지로 표시한다.
  앞의 둘은 모두 색 신호라, 색각 이상이나 밝은 화면에서는 "지금 어디인지"가
  사라진다 — 좌측 바가 형태로 같은 말을 한 번 더 한다.
- 본문 **위에 겹쳐서** 배치되지만(absolute) 셸이 레일 폭만큼 spacer를 남기므로
  본문 폭·위치는 이 레일과 무관하게 고정이다.

### 왜 hover 펼침을 없앴나
예전엔 56px 아이콘 전용 레일이 hover/포커스 시 240px로 펼쳐지며 라벨이
페이드인됐다. 두 가지 이유로 걷어냈다:

1. **터치 기기에서는 라벨이 영원히 안 나왔다.** 펼침을 \`@media (hover: hover)
   and (pointer: fine)\`로 가둬야 했기 때문이다 — 안 그러면 탭한 뒤 \`:hover\`와
   \`:focus-within\`이 남아 레일이 펼쳐진 채 본문을 절반 넘게 가렸다. 결과적으로
   태블릿 사용자는 라벨 없는 아이콘 3개만 보고 앱을 썼다.
2. **hover 전까지 목적지를 알 수 없다.** 매일 쓰는 도구에서 1급 내비게이션의
   이름을 숨겨 얻는 건 144px의 가로 공간인데, 이 앱의 본문은 표와 차트라
   그 144px이 판단을 바꿀 만큼 아쉬운 적이 없었다.

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
        본문. 레일은 absolute라 이 영역 위에 겹치지만, 좌측 spacer가 폭을 잡아줘서
        실제로 가려지지는 않는다.
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
