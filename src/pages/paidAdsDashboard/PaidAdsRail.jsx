import { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import { supabase } from '../../lib/supabase';
import { useSnackbar } from '../../hooks/useSnackbar';
import { PaidAdsStoreContext } from './usePaidAdsStore';
import { useSyncRuns } from './useSyncRuns';
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
 * 접힌 레일 폭 — 아이콘만 보인다. 셸이 본문 위치를 잡을 때도 이 값을 쓴다.
 *
 * ## 한 번 200px 상시 노출로 바꿨다가 되돌렸다
 *
 * 바꿨던 이유는 타당했다: 펼침을 `@media (hover: hover) and (pointer: fine)`로
 * 가둬야 해서(안 그러면 터치에서 탭한 뒤 hover가 남아 레일이 펼쳐진 채 본문을
 * 가린다) **터치 기기에서는 라벨이 영원히 안 나온다.**
 *
 * 그런데 **레퍼런스(influencer tracking dashboard)가 정확히 이 구조다** — 접힘
 * 52px 아이콘 전용, hover 시 261px로 펼쳐지며 제목·라벨·하단 유틸리티가 나온다.
 * 이 프로젝트의 1순위 목표는 "같은 회사 툴군처럼 보이기"고, 두 도구를 오가는
 * 사람에게는 내비게이션 폭이 다른 것 자체가 "다른 제품"이라는 신호가 된다
 * (실사용 지적으로 되돌림).
 *
 * 일반 UX 원칙과 레퍼런스 일치가 부딪히면 **이 프로젝트에서는 일치가 먼저다.**
 * 터치 라벨 문제를 정말 풀어야 한다면 레퍼런스 쪽과 함께 바꿔야지, 이 앱만
 * 따로 바꾸면 안 된다.
 */
export const RAIL_WIDTH = 56;

/**
 * hover/focus 시 펼쳐지는 폭.
 * 헤더 제목("Paid Ads Dashboard")이 가장 긴 문자열이다. overflow:hidden이라
 * 넘치면 조용히 잘리므로 폰트 렌더링 차이를 흡수할 여유를 둔다.
 */
const EXPANDED_WIDTH = 240;

/** 사이드바 좌우 패딩(px 1.25 = 10px)을 뺀 안쪽 폭 */
const RAIL_ROW_WIDTH = RAIL_WIDTH - 20;
const EXPANDED_ROW_WIDTH = EXPANDED_WIDTH - 20;

/**
 * 헤더 마크 한 변. 접힘 상태에서 레일 중심에 오도록 좌측 여백을 계산해 쓴다.
 * 마크는 회사(beautymaster) 자산이고 앱 구분은 옆의 제목이 한다 — 같은 팀의
 * influencer tracking dashboard도 같은 마크에 제목만 다르게 쓴다.
 */
const MARK_SIZE = 20;

/**
 * 폭이 바뀌는 요소에 공통으로 붙이는 클래스.
 * 헤더 행 · 네비 행 · 하단 유틸리티 블록이 모두 이 규칙 하나로 함께 늘어난다 —
 * 접힘/펼침용 요소를 따로 두지 않기 위한 장치다.
 */
const WIDTH_CLASS = 'rail-w';
/** 펼칠 때만 나타나는 텍스트 */
const LABEL_CLASS = 'rail-label';
/**
 * 펼칠 때만 나타나는 **행**(Last synced). LABEL_CLASS는 행 안의 텍스트만 숨겨서
 * 접힌 레일에도 행 높이가 남는데, 이 행은 아이콘이 없어서 접힘 상태에 빈 슬롯만
 * 남긴다 — 레퍼런스의 접힌 레일 하단은 아이콘 3개가 빈틈없이 쌓여 있으므로
 * 높이째 접는다.
 */
const SYNCED_CLASS = 'rail-synced';

/**
 * RailRow — 레일의 한 줄 (아이콘 + 라벨).
 *
 * 접힘 상태에서는 행 자체가 아이콘 크기라 활성 배경이 아이콘 주변에만 깔리고,
 * 펼치면 같은 행이 늘어나 배경이 라벨까지 감싼다. 별도 요소를 쓰지 않는다.
 * 아이콘은 행 좌측 패딩 안에 있어 폭이 바뀌어도 x·y가 움직이지 않는다.
 *
 * 아이콘은 컴포넌트 타입이 아니라 **엘리먼트 노드**로 받는다. 크기는 각 호출부가
 * 아니라 이 행이 CSS로 한 번에 정하므로 호출부는 아이콘만 넘기면 된다.
 *
 * Props:
 * @param {node} icon - 좌측 아이콘 엘리먼트 [Required]
 * @param {string} label - 펼쳤을 때 보이는 라벨. 접힘 상태에서는 접근성 이름으로만 남는다 [Required]
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
      aria-label={ label }
      aria-current={ isActive ? 'page' : undefined }
      className={ WIDTH_CLASS }
      sx={ theme => ({
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
        transition: theme.transitions.create(['width', 'background-color', 'color'], {
          duration: 180,
          easing: theme.transitions.easing.easeOut,
        }),
        // hover는 마우스가 있는 기기에서만 — 가드가 없으면 터치에서 탭한 뒤
        // 배경이 눌어붙는다(같은 파일의 레일 펼침은 이미 이 가드를 쓴다).
        '@media (hover: hover)': {
          '&:hover': {
            backgroundColor: isActive ? theme.palette.accent.tintHover : theme.palette.action.hover,
          },
        },
        /* 아이콘 크기는 호출부가 아니라 여기서 한 번에 정한다.
           16px인 건 취향이 아니라 정렬 때문이다 — 행 좌측 여백이 20px(레일 10 +
           행 10)이므로 아이콘 중심이 20 + 16/2 = 28px가 되고, 이건 헤더 로고
           중심(레일 56의 절반)과 정확히 같다. 18px로 올리면 29px가 돼서 로고
           바로 아래 세로로 쌓이는 아이콘들이 1px씩 밀려 보인다. */
        '& .MuiSvgIcon-root': { fontSize: theme.iconSize.inline, flexShrink: 0 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }) }
    >
      { icon }
      <Typography
        variant="body2"
        className={ LABEL_CLASS }
        sx={ { fontWeight: isActive ? 600 : 500, lineHeight: 1 } }
      >
        { label }
      </Typography>
    </Box>
  );
}

/**
 * RailButton — RailRow의 버튼 판. 링크가 아니라 **동작**(Refresh)을 담는 행이라
 * NavLink 대신 button으로 그린다. 스타일은 RailRow와 같은 문법을 쓴다 — 하단
 * 유틸리티 블록에서 링크 행(Settings)과 나란히 놓이므로 시각적으로 갈리면 안 된다.
 *
 * Props:
 * @param {node} icon - 좌측 아이콘 엘리먼트 [Required]
 * @param {string} label - 라벨. 접힘 상태에서는 접근성 이름으로만 남는다 [Required]
 * @param {function} onClick - 클릭 핸들러 [Required]
 * @param {boolean} isBusy - 진행 중 여부. 클릭을 막고 라벨을 바꾸는 건 호출부 책임 [Optional, 기본값: false]
 */
function RailButton({ icon, label, onClick, isBusy = false }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={ onClick }
      disabled={ isBusy }
      aria-label={ label }
      className={ WIDTH_CLASS }
      sx={ theme => ({
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
        border: 0,
        backgroundColor: 'transparent',
        borderRadius: `${theme.shape.radius.control}px`,
        cursor: isBusy ? 'default' : 'pointer',
        color: 'text.secondary',
        font: 'inherit',
        textAlign: 'left',
        transition: theme.transitions.create(['width', 'background-color'], {
          duration: 180,
          easing: theme.transitions.easing.easeOut,
        }),
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: theme.palette.action.hover },
        },
        '& .MuiSvgIcon-root': { fontSize: theme.iconSize.inline, flexShrink: 0 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }) }
    >
      { icon }
      <Typography variant="body2" className={ LABEL_CLASS } sx={ { fontWeight: 500, lineHeight: 1 } }>
        { label }
      </Typography>
    </Box>
  );
}

/**
 * PaidAdsRail
 *
 * 좌측 아이콘 레일 내비게이션. 기본은 아이콘만 보이는 56px 레일이고,
 * hover하거나 키보드 포커스가 들어오면 펼쳐지며 라벨이 페이드인된다.
 * 접힘/펼침용 컴포넌트를 따로 두지 않는다 — 헤더·네비·유틸리티가 모두
 * 같은 폭 규칙 하나로 함께 늘어난다.
 *
 * 펼침은 본문 **위에 겹쳐서** 일어난다(absolute). 셸이 레일 폭만큼 spacer를
 * 흐름에 남겨두므로 본문 폭·위치는 접힘/펼침과 무관하게 고정이다.
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

  /* 하단 유틸리티의 데이터. Storybook은 스토어를 주입하고 백엔드가 없으므로,
     주입 여부로 실조회를 끈다 — DashboardPage와 같은 판별. */
  const injectedStore = useContext(PaidAdsStoreContext);
  const { lastSuccessAt } = useSyncRuns(!injectedStore);
  const [isSyncing, setIsSyncing] = useState(false);
  const { notify, SnackbarComponent } = useSnackbar();

  /* Dashboard 헤더의 Sync now와 같은 순서(캠페인 → 성과 — 뒤집으면 방금 들어온
     캠페인의 성과를 이번 회차에 놓친다). 끝나면 이벤트로 페이지 스토어에
     "다시 읽어라"를 알린다 — 레일은 어떤 페이지의 스토어에도 접근할 수 없다. */
  const handleRefresh = async () => {
    if (isSyncing || injectedStore) return;
    setIsSyncing(true);
    const campaignsRes = await supabase.functions.invoke('sync-campaigns');
    const performanceRes = campaignsRes.error ? null : await supabase.functions.invoke('sync-performance');
    const failure = campaignsRes.error ?? performanceRes?.error;
    setIsSyncing(false);
    if (failure) {
      notify(`Sync failed — ${failure.message}`, 'error');
      return;
    }
    /* 이벤트 하나로 끝낸다 — 페이지 스토어와 useSyncRuns 인스턴스 전부가
       이 신호를 듣는다(자기 것만 직접 refetch하면 다른 화면이 낡은 채 남는다). */
    window.dispatchEvent(new Event('paidads:refresh'));
    notify('Sync complete');
  };

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
        transition: theme.transitions.create(['width', 'background-color', 'box-shadow'], {
          duration: 180,
          easing: theme.transitions.easing.easeOut,
        }),
        [`& .${LABEL_CLASS}`]: {
          opacity: 0,
          whiteSpace: 'nowrap',
          transition: theme.transitions.create('opacity', { duration: 150 }),
        },
        /* 펼침은 마우스가 있는 기기에서만 한다.
           터치에서는 탭한 뒤 :hover와 :focus-within이 그대로 남아 레일이
           펼쳐진 채 고정된다 — 좁은 화면에서 그러면 본문을 절반 넘게 가린다.
           터치 기기에서는 56px 아이콘 레일로만 쓴다(라벨은 aria-label로 남는다).

           핸드오프(SaasShell)는 md 미만에서 레일을 통째로 숨겼는데, 그러면
           모바일에 내비게이션이 아예 없어진다. 우리는 폭이 56px뿐이라
           전 브레이크포인트에서 그대로 두고 펼침만 막는다. */
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover, &:focus-within': {
            width: EXPANDED_WIDTH,
            backgroundColor: 'background.paper',
            // 테마의 그림자 철학은 "offset 없이 blur만"이라 x-offset 값을 직접 쓰지 않는다.
            // 펼친 레일이 본문 위에 떠 있다는 신호는 customShadows 토큰으로 준다.
            boxShadow: theme.customShadows.sm,
            [`& .${WIDTH_CLASS}`]: { width: EXPANDED_ROW_WIDTH },
            [`& .${LABEL_CLASS}`]: { opacity: 1 },
            [`& .${SYNCED_CLASS}`]: { height: 24, opacity: 1 },
          },
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          [`& .${LABEL_CLASS}`]: { transition: 'none' },
        },
        ...sx,
      }) }
    >
      {/* 헤더 — 접힘/펼침이 같은 하나의 행이다. 폭과 제목 표시 여부만 바뀐다.
          마크는 항상 보이므로 접힘 상태에서도 상단이 비지 않고, 높이가 고정이라
          아래 네비 아이콘의 y는 두 상태에서 정확히 같다. */}
      <Box
        className={ WIDTH_CLASS }
        sx={ theme => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: RAIL_ROW_WIDTH,
          height: MARK_SIZE,
          flexShrink: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          // 마크 중심을 레일 중심에 맞추는 값. 네비 행의 px(1.25)와 다른 이유는
          // 마크(20px)가 네비 아이콘(18px)보다 크기 때문이다.
          pl: `${(RAIL_WIDTH - MARK_SIZE) / 2 - 10}px`,
          pr: 1.25,
          mb: 2.25,
          transition: theme.transitions.create('width', { duration: 180, easing: theme.transitions.easing.easeOut }),
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }) }
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
          className={ LABEL_CLASS }
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

      {/* 유틸리티 — 블록 자체가 폭 규칙을 타므로 상단 divider도 같이 늘어난다 */}
      <Box
        className={ WIDTH_CLASS }
        sx={ theme => ({
          flexShrink: 0,
          width: RAIL_ROW_WIDTH,
          pt: 1,
          mt: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          transition: theme.transitions.create('width', { duration: 180, easing: theme.transitions.easing.easeOut }),
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }) }
      >
        {/* 레퍼런스의 하단 블록 순서 그대로: Last synced → Refresh → Settings.
            (레퍼런스의 "Open Google Sheet"만 없다 — 그쪽은 데이터 원천이 시트
            하나라 그 행이 있고, 우리 원천은 Meta·TikTok 광고 관리자 둘이라
            대응되는 단일 링크가 없다. 캠페인 단위 딥링크는 Drawer의 Ads
            Manager 링크가 담당한다.) */}
        { lastSuccessAt && (
          <Typography
            variant="caption"
            className={ SYNCED_CLASS }
            sx={ theme => ({
              display: 'block',
              px: 1.25,
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              height: 0,
              opacity: 0,
              overflow: 'hidden',
              transition: theme.transitions.create(['height', 'opacity'], { duration: 150 }),
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }) }
          >
            { `Last synced ${new Date(lastSuccessAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` }
          </Typography>
        ) }
        {/* 행은 항상 그린다 — 스토어가 주입된 환경(Storybook)에서는 핸들러만
            조용히 빠진다. 행 자체를 숨기면 스토리가 레퍼런스와 다른 레일을
            보여주게 된다. */}
        <RailButton
          icon={ <RefreshIcon /> }
          label={ isSyncing ? 'Syncing…' : 'Refresh' }
          onClick={ handleRefresh }
          isBusy={ isSyncing }
        />
        { UTILITY_ITEMS.map(({ to, label, icon }) => (
          <RailRow key={ to } to={ to } icon={ icon } label={ label } isActive={ isPathActive(to) } />
        )) }
      </Box>
      <SnackbarComponent />
    </Box>
  );
}
