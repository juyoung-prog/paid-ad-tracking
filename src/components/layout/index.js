/**
 * Layout Components
 *
 * 레이아웃 관련 컴포넌트 모음
 * 황금비율, 그리드, 화면 분할 등 다양한 레이아웃 패턴을 제공
 */

// PhiSplit - 황금비율 2분할 레이아웃
export { PhiSplit } from './PhiSplit.jsx';

// BentoGrid - 벤토 박스 그리드 레이아웃
export { BentoGrid, BentoItem } from './BentoGrid.jsx';
export { BENTO_PRESETS } from './bentoPresets.js';

// FullPageContainer - 전체 화면 섹션 컨테이너
export {
  FullPageContainer,
  FullPageSection,
  FullPageSnap,
} from './FullPageContainer.jsx';

// SplitScreen - 화면 분할 레이아웃
export {
  SplitScreen,
  StickySection,
  SplitOverlay,
} from './SplitScreen.jsx';

// PageContainer - 반응형 페이지 컨테이너
export { PageContainer } from './PageContainer.jsx';

// AppShell - 반응형 앱 셸
export { AppShell } from './AppShell.jsx';
export { useAppShell } from './useAppShell.js';

// LastUpdatedBar - 최근 수정 시각 표시
export { LastUpdatedBar } from './LastUpdatedBar.jsx';
