import { NavLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import logoUrl from '../../assets/beautymaster-logo.png';

/**
 * 1급 내비게이션 — 매일 오가는 화면들.
 * Settings는 여기 넣지 않는다(아래 UTILITY_ITEMS 참고).
 */
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: <SpaceDashboardOutlinedIcon /> },
  { to: '/reports', label: 'Reports', icon: <AssessmentOutlinedIcon /> },
  { to: '/stores', label: 'Stores', icon: <StorefrontOutlinedIcon /> },
];

/**
 * 하단 유틸리티 — 계정·토큰 관리처럼 성격이 다른 화면.
 * 위 셋과 같은 위계에 놓으면 "매일 보는 화면"과 "가끔 설정하는 화면"이
 * 구분되지 않아 내비게이션이 평평해진다.
 */
const UTILITY_ITEMS = [
  { to: '/settings', label: 'Settings', icon: <SettingsOutlinedIcon /> },
];

/**
 * 레일 폭. 셸이 본문 위치를 잡을 때도 이 값을 쓴다.
 *
 * 예전엔 56px 아이콘 전용 레일이었고, hover하거나 포커스가 들어오면 240px로
 * 펼쳐지며 라벨이 페이드인됐다. 그 구조를 걷어낸 이유:
 *
 * 1. **터치 기기에서는 라벨이 영원히 안 나왔다.** 펼침을 `@media (hover: hover)
 *    and (pointer: fine)`로 가둬야 했기 때문이다 — 안 그러면 탭한 뒤 :hover와
 *    :focus-within이 남아 레일이 펼쳐진 채 본문을 절반 넘게 가렸다. 결과적으로
 *    태블릿 사용자는 라벨 없는 아이콘 3개만 보고 앱을 썼다.
 * 2. **hover 전까지 목적지를 알 수 없다.** 매일 쓰는 도구에서 1급 내비게이션의
 *    이름을 숨겨 얻는 건 144px의 가로 공간인데, 이 앱의 본문은 표와 차트라
 *    그 144px이 판단을 바꿀 만큼 아쉬운 적이 없었다.
 *
 * 폭은 라벨이 잘리지 않는 선에서 가장 좁게 잡는다 — 헤더 제목("Paid Ads
 * Dashboard")이 가장 긴 문자열이다.
 */
export const RAIL_WIDTH = 200;

/** 레일 좌우 패딩(px 1.25 = 10px)을 뺀 안쪽 폭 */
const RAIL_ROW_WIDTH = RAIL_WIDTH - 20;

/**
 * 헤더 마크 한 변. 네비 아이콘과 **왼쪽 모서리를 맞춘다** — 예전엔 접힘 상태의
 * 레일 중심에 마크를 놓느라 별도 계산식이 필요했는데, 상시 펼침에서는 모든
 * 요소가 하나의 좌측 기준선을 공유하는 쪽이 맞다.
 */
const MARK_SIZE = 20;

/** 활성 행 좌측의 액센트 바 두께 — 색만으로 상태를 말하지 않기 위한 두 번째 신호 */
const ACTIVE_BAR_WIDTH = 2;

/**
 * RailRow — 레일의 한 줄 (아이콘 + 라벨).
 *
 * 아이콘은 컴포넌트 타입이 아니라 **엘리먼트 노드**로 받는다. 크기는 각 호출부가
 * 아니라 이 행이 CSS로 한 번에 정하므로 호출부는 아이콘만 넘기면 된다.
 *
 * Props:
 * @param {node} icon - 좌측 아이콘 엘리먼트 [Required]
 * @param {string} label - 행에 표시할 라벨 [Required]
 * @param {string} to - 이동할 라우트 경로 [Required]
 * @param {boolean} isActive - 활성 상태 여부 [Optional, 기본값: false]
 *
 * Example usage:
 * <RailRow to="/reports" icon={<AssessmentOutlinedIcon />} label="Reports" isActive />
 */
function RailRow({ icon, label, to, isActive = false }) {
  return (
    <Box
      component={ NavLink }
      to={ to }
      aria-current={ isActive ? 'page' : undefined }
      sx={ theme => ({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        width: RAIL_ROW_WIDTH,
        flexShrink: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        px: 1.25,
        py: 0.75,
        mb: 0.25,
        // 내비 행은 클릭 가능한 상호작용 객체 → control radius.
        // (핸드오프 SaasShell은 6px를 썼지만 그건 차트 컨테이너와 같은 값이라
        //  역할 구분이 안 됐다. 입력·칩과 같은 4px로 맞춘다.)
        borderRadius: `${theme.shape.radius.control}px`,
        textDecoration: 'none',
        // 활성 표시는 테두리가 아니라 아주 옅은 액센트 틴트 — outlined 버튼처럼 보이지 않게
        backgroundColor: isActive ? theme.palette.accent.tint : 'transparent',
        color: isActive ? 'accent.main' : 'text.secondary',
        transition: theme.transitions.create(['background-color', 'color'], {
          duration: 180,
          easing: theme.transitions.easing.easeOut,
        }),
        /* 활성 상태를 색 하나에만 싣지 않는다 — 옅은 틴트(8%)와 액센트 글자색은
           둘 다 색 신호라, 색각 이상이나 밝은 화면에서는 "지금 어디인지"가
           사라진다. 좌측 바는 형태로 같은 말을 한 번 더 한다. */
        '&::before': isActive
          ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 6,
              bottom: 6,
              width: ACTIVE_BAR_WIDTH,
              borderRadius: `${theme.shape.radius.inlay}px`,
              backgroundColor: theme.palette.accent.main,
            }
          : undefined,
        // hover는 마우스가 있는 기기에서만 — 가드가 없으면 터치에서 탭한 뒤
        // 배경이 눌어붙는다.
        '@media (hover: hover)': {
          '&:hover': {
            backgroundColor: isActive ? theme.palette.accent.tintHover : theme.palette.action.hover,
          },
        },
        // 아이콘 크기는 호출부가 아니라 여기서 한 번에 정한다 (theme.iconSize).
        '& .MuiSvgIcon-root': { fontSize: theme.iconSize.control, flexShrink: 0 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }) }
    >
      { icon }
      <Typography
        variant="body2"
        sx={ { fontWeight: isActive ? 600 : 500, lineHeight: 1 } }
      >
        { label }
      </Typography>
    </Box>
  );
}

/**
 * PaidAdsRail
 *
 * 좌측 내비게이션 레일. 아이콘과 라벨이 **항상** 보인다 — 예전의 56px 아이콘
 * 레일 + hover 펼침 구조는 터치 기기에서 라벨이 영원히 나타나지 않는 문제가
 * 있었다(RAIL_WIDTH 주석 참고).
 *
 * 본문 **위에 겹쳐서** 배치된다(absolute). 셸이 레일 폭만큼 spacer를 흐름에
 * 남겨두므로 본문 폭·위치는 이 레일과 무관하게 고정이다.
 *
 * 이 프로젝트 전용이라 컴포넌트 라이브러리(src/components/navigation/)가 아니라
 * 페이지 폴더에 둔다 — GNB처럼 범용 재사용을 목표로 하지 않는다.
 *
 * Props:
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <PaidAdsRail />
 */
export function PaidAdsRail({ sx }) {
  const { pathname } = useLocation();
  const isPathActive = (to) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={ theme => ({
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: RAIL_WIDTH,
        zIndex: theme.zIndex.appBar,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'surface.sunken',
        px: 1.25,
        py: 1.75,
        ...sx,
      }) }
    >
      {/* 헤더 — 마크와 제목. 마크의 좌측 모서리를 네비 아이콘과 맞춰
          레일 전체가 하나의 좌측 기준선을 공유하게 한다. */}
      <Box
        sx={ {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: RAIL_ROW_WIDTH,
          height: MARK_SIZE,
          flexShrink: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          px: 1.25,
          mb: 2.25,
        } }
      >
        {/* 원본은 300px 정사각이고 어두운 배경이 이미지에 구워져 있다(알파 없음) —
            그래서 배경을 깔지 않고 모서리만 굴린다. */}
        <Box
          component="img"
          src={ logoUrl }
          alt="BeautyMaster"
          sx={ theme => ({
            width: MARK_SIZE,
            height: MARK_SIZE,
            flexShrink: 0,
            display: 'block',
            borderRadius: `${theme.shape.radius.control}px`,
          }) }
        />
        <Typography
          variant="body2"
          sx={ { fontWeight: 600, letterSpacing: '-0.01em' } }
        >
          Paid Ads Dashboard
        </Typography>
      </Box>

      {/* 네비 — 남는 높이를 차지해 아래 유틸리티를 하단에 붙인다 */}
      <Box sx={ { flex: 1, minHeight: 0 } }>
        { NAV_ITEMS.map(({ to, label, icon }) => (
          <RailRow key={ to } to={ to } icon={ icon } label={ label } isActive={ isPathActive(to) } />
        )) }
      </Box>

      {/* 유틸리티 — 상단 divider로 1급 내비게이션과 성격을 가른다 */}
      <Box
        sx={ {
          flexShrink: 0,
          width: RAIL_ROW_WIDTH,
          pt: 1,
          mt: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
        } }
      >
        { UTILITY_ITEMS.map(({ to, label, icon }) => (
          <RailRow key={ to } to={ to } icon={ icon } label={ label } isActive={ isPathActive(to) } />
        )) }
      </Box>
    </Box>
  );
}
