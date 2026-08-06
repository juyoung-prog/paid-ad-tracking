import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import logoUrl from '../../../assets/beautymaster-logo.png';
import '@fontsource-variable/inter';

/** flat-SaaS 시안 공통 폰트 스택 (modern_saas_design_core_features.md 기반 시안 전용) */
export const SAAS_FONT = '"Inter Variable", Inter, "Pretendard Variable", Pretendard, sans-serif';

/** 기존 대시보드의 탭 구성(Operations / Analytics / Workflow)을 사이드바로 옮긴 것 */
const NAV_ITEMS = [
  { key: 'operations', label: 'Operations', Icon: ListAltOutlinedIcon },
  { key: 'analytics', label: 'Analytics', Icon: BarChartOutlinedIcon },
  { key: 'workflow', label: 'Workflow', Icon: RouteOutlinedIcon },
];

/** 접힌 레일 폭 — 아이콘만 보인다 */
const RAIL_WIDTH = 56;
/**
 * hover/focus 시 펼쳐지는 폭.
 * 헤더 제목("Influencer Tracking Dashboard")이 가장 긴 문자열이다. overflow:hidden이라
 * 넘치면 조용히 잘리므로 폰트 렌더링 차이를 흡수할 여유를 둔다.
 */
const EXPANDED_WIDTH = 264;
/** 사이드바 좌우 패딩(px 1.25 = 10px)을 뺀 안쪽 폭 */
const RAIL_ROW_WIDTH = RAIL_WIDTH - 20;
const EXPANDED_ROW_WIDTH = EXPANDED_WIDTH - 20;
/**
 * sync 캡션은 접힘/펼침 모두 같은 높이를 차지한다(보이기만 페이드).
 * 높이를 접으면 그 아래 divider와 유틸리티 아이콘이 위아래로 움직이기 때문이다.
 */
const SYNC_ROW_HEIGHT = 22;

/**
 * 헤더 로고 한 변.
 * 접힘 상태에서 레일 중심(56/2 = 28)에 오도록 좌측 여백을 (56 - 20) / 2 - 10 = 8px 준다.
 * 그래야 아래 네비 아이콘(16px, 중심 28)과 같은 세로축에 선다.
 */
const LOGO_SIZE = 20;

/**
 * 폭이 바뀌는 요소에 공통으로 붙이는 클래스.
 * 로고 행 · 네비 행 · 하단 유틸리티 블록이 모두 이 하나의 규칙으로 함께 늘어난다 —
 * 접힘/펼침용 요소를 따로 두지 않기 위한 장치다.
 */
const WIDTH_CLASS = 'saas-nav-w';
/** 펼칠 때만 나타나는 텍스트(라벨·카운트) */
const LABEL_CLASS = 'saas-nav-label';
/** 하단 sync 캡션 */
const SYNC_CLASS = 'saas-nav-sync';

/**
 * NavRow — 사이드바의 한 줄 (아이콘 + 라벨).
 *
 * 접힘 상태에서는 행 자체가 아이콘 크기(36px)라 활성 배경이 아이콘 주변에만 둥글게 깔리고,
 * 펼치면 같은 행이 늘어나 배경이 라벨·카운트까지 감싼다. 별도 요소를 쓰지 않는다.
 * 아이콘은 행 좌측 패딩 안에 있어 폭이 바뀌어도 x·y가 움직이지 않는다.
 * `rest`로 component/href/onClick 등을 그대로 넘겨 button·anchor 어느 쪽으로도 쓴다.
 *
 * Props:
 * @param {elementType} Icon - 좌측 아이콘 컴포넌트 [Required]
 * @param {string} label - 펼쳤을 때 보이는 라벨 [Required]
 * @param {boolean} isActive - 활성 상태 여부 [Optional, 기본값: false]
 * @param {node} trailing - 라벨 우측에 붙일 요소(카운트 등) [Optional, 기본값: null]
 * @param {object} iconSx - 아이콘에 덧붙일 sx (동기화 중 회전 등) [Optional]
 *
 * Example usage:
 * <NavRow component="button" type="button" onClick={onRefresh} Icon={RefreshOutlinedIcon} label="Refresh" />
 */
function NavRow({ Icon, label, isActive = false, trailing = null, iconSx, ...rest }) {
  return (
    <Box
      {...rest}
      className={WIDTH_CLASS}
      sx={theme => ({
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
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
        textDecoration: 'none',
        // 활성 표시는 테두리가 아니라 아주 옅은 브랜드 틴트 — outlined 버튼처럼 보이지 않게
        backgroundColor: isActive ? theme.palette.accent.tint : 'transparent',
        // 글자·선은 primary.dark — 순수 #0000FF는 흰 배경 위 가장자리가 떨려 보인다(색수차)
        color: isActive ? 'accent.main' : 'text.secondary',
        transition: theme.transitions.create(['width', 'background-color', 'color'], {
          duration: 180,
          easing: theme.transitions.easing.easeOut,
        }),
        '&:hover': {
          backgroundColor: isActive
            ? theme.palette.accent.tintHover
            : theme.palette.action.hover,
        },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      })}
    >
      <Icon sx={{ fontSize: 16, flexShrink: 0, ...iconSx }} />
      <Typography className={LABEL_CLASS} sx={{ fontSize: 13, fontWeight: isActive ? 600 : 500, lineHeight: 1 }}>
        {label}
      </Typography>
      {trailing}
    </Box>
  );
}

/**
 * SaasShell component
 *
 * flat-SaaS 셸 — 좌측 사이드바 + 유동 본문.
 * 사이드바는 하나의 구조로, 폭과 라벨 표시만 바뀐다(Meta Ads Manager 방식).
 * 기본은 아이콘만 보이는 56px 레일이고, hover하거나 키보드 포커스가 들어오면
 * 248px로 늘어나며 라벨이 페이드인된다. 접힘/펼침용 컴포넌트를 따로 두지 않는다 —
 * 로고 행·네비 행·하단 유틸리티가 모두 같은 폭 규칙 하나로 함께 늘어난다.
 *
 * 펼침은 본문 **위에 겹쳐서** 일어난다 — absolute로 띄우고 레일 폭만큼 spacer를
 * 흐름에 남겨두므로 본문 폭·위치는 접힘/펼침과 무관하게 고정이다.
 * 아이콘의 x·y와 하단 유틸리티의 y도 상태와 무관하게 고정이다(sync 캡션이 항상
 * 같은 높이를 차지해 divider와 아이콘을 밀지 않는다).
 * md 미만에서는 레일과 spacer를 모두 숨긴다.
 *
 * Props:
 * @param {string} activeNav - 활성 네비 키 (operations|analytics|workflow) [Required]
 * @param {Date|null} lastSyncedAt - 마지막 동기화 시각 (사이드바 하단, 펼침 시 표시) [Optional, 기본값: null]
 * @param {function} onNavigate - 네비 항목 클릭 핸들러 (key) => void [Optional]
 * @param {boolean} isSyncing - 시트 조회 진행 중 여부. 아이콘을 돌리고 캡션을 바꿔 눌린 걸 알린다 [Optional, 기본값: false]
 * @param {function} onRefresh - Refresh 클릭 핸들러 [Optional]
 * @param {string} sheetUrl - Google Sheet 원본 링크. 없으면 해당 줄을 숨긴다 [Optional, 기본값: '']
 * @param {function} onOpenSettings - Settings 클릭 핸들러 [Optional]
 * @param {node} children - 본문 뷰 [Required]
 * @param {object} sx - 루트 Box에 적용할 MUI sx 오버라이드 [Optional]
 *
 * Example usage:
 * <SaasShell activeNav="operations" onNavigate={setView}>...</SaasShell>
 */
function SaasShell({
  activeNav,
  lastSyncedAt = null,
  isSyncing = false,
  onNavigate,
  onRefresh,
  sheetUrl = '',
  onOpenSettings,
  children,
  sx,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        minHeight: 0,
        // 펼친 사이드바가 본문 위에 겹치도록 기준점을 잡고, z-index를 셸 안으로 가둔다
        position: 'relative',
        isolation: 'isolate',
        backgroundColor: 'background.paper',
        fontFamily: SAAS_FONT,
        '@keyframes saas-spin': { to: { transform: 'rotate(360deg)' } },
        '& .MuiTypography-root, & .MuiButton-root, & .MuiChip-root, & .MuiTableCell-root, & .MuiInputBase-root, & .MuiAvatar-root': {
          fontFamily: 'inherit',
        },
        // 폼 요소는 font-family를 상속하지 않고 UA 기본값(Arial 등)을 쓴다.
        // 이걸 빼면 위의 inherit 규칙이 역효과를 낸다 — 버튼 안의 Typography가
        // 테마 폰트가 아니라 버튼의 Arial을 물려받는다(Workflow의 Accordion이 그랬다).
        '& button, & input, & select, & textarea, & optgroup': { fontFamily: 'inherit' },
        ...sx,
      }}
    >
      {/* 레일 자리 확보 — 사이드바가 펼쳐져도 본문이 밀리지 않게 흐름에 폭만 남긴다 */}
      <Box aria-hidden sx={{ width: RAIL_WIDTH, flexShrink: 0 }} />

      {/* Sidebar — 하나의 구조. 폭과 라벨 표시만 바뀐다. md 미만 숨김 */}
      <Box
        component="nav"
        sx={theme => ({
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
          // 높이는 항상 차지하고 보이기만 바뀐다 — 아래 divider·아이콘을 밀지 않기 위해
          [`& .${SYNC_CLASS}`]: {
            opacity: 0,
            height: SYNC_ROW_HEIGHT,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transition: theme.transitions.create('opacity', { duration: 150 }),
          },
          /* 펼침은 마우스가 있는 기기에서만 한다.
             터치에서는 탭한 뒤 :hover와 :focus-within이 그대로 남아 레일이
             펼쳐진 채 고정된다 — 390px 화면에서 264px면 화면의 68%를 가린다.
             터치 기기에서는 56px 아이콘 레일로만 쓴다(라벨은 접근성 이름으로 남는다). */
          '@media (hover: hover) and (pointer: fine)': {
            '&:hover, &:focus-within': {
              width: EXPANDED_WIDTH,
              backgroundColor: 'background.paper',
              boxShadow: '4px 0 12px rgba(0, 0, 0, 0.04)',
              [`& .${WIDTH_CLASS}`]: { width: EXPANDED_ROW_WIDTH },
              [`& .${LABEL_CLASS}`]: { opacity: 1 },
              [`& .${SYNC_CLASS}`]: { opacity: 1 },
            },
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            [`& .${LABEL_CLASS}, & .${SYNC_CLASS}`]: { transition: 'none' },
          },
        })}
      >
        {/* 헤더 — 접힘/펼침이 같은 하나의 행이다. 폭과 제목 표시 여부만 바뀐다.
            로고는 항상 보이므로 접힘 상태에서도 상단이 비지 않고, 높이가 고정이라
            아래 네비 아이콘의 y는 두 상태에서 정확히 같다. */}
        <Box
          className={WIDTH_CLASS}
          sx={theme => ({
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            width: RAIL_ROW_WIDTH,
            height: LOGO_SIZE,
            flexShrink: 0,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            // 로고 중심을 레일 중심에 맞추는 값. 네비 행의 px(1.25)와 다른 이유는
            // 로고(20px)가 네비 아이콘(16px)보다 크기 때문이다.
            pl: `${(RAIL_WIDTH - LOGO_SIZE) / 2 - 10}px`,
            pr: 1.25,
            mb: 2.25,
            transition: theme.transitions.create('width', { duration: 180, easing: theme.transitions.easing.easeOut }),
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          })}
        >
          <Box
            component="img"
            src={ logoUrl }
            alt="BeautyMaster"
            sx={{ width: LOGO_SIZE, height: LOGO_SIZE, flexShrink: 0, borderRadius: '6px', display: 'block' }}
          />
          <Typography className={LABEL_CLASS} sx={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Influencer Tracking Dashboard
          </Typography>
        </Box>

        {/* 네비 — 남는 높이를 차지해 아래 유틸리티를 하단에 붙인다 */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const isActive = key === activeNav;
            return (
              <NavRow
                key={key}
                component="button"
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate?.(key)}
                Icon={Icon}
                label={label}
                isActive={isActive}
              />
            );
          })}
        </Box>

        {/* 전역 유틸리티 — 블록 자체가 폭 규칙을 타므로 상단 divider도 같이 늘어난다 */}
        <Box
          className={WIDTH_CLASS}
          sx={theme => ({
            flexShrink: 0,
            width: RAIL_ROW_WIDTH,
            pt: 1,
            mt: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            transition: theme.transitions.create('width', { duration: 180, easing: theme.transitions.easing.easeOut }),
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          })}
        >
          <Typography
            className={SYNC_CLASS}
            sx={{ display: 'block', px: 1.25, fontSize: 11, lineHeight: `${SYNC_ROW_HEIGHT}px`, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
          >
            {isSyncing
              ? 'Syncing…'
              : `Last synced ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}`}
          </Typography>
          <NavRow
            component="button"
            type="button"
            onClick={onRefresh}
            disabled={isSyncing}
            aria-busy={isSyncing}
            Icon={RefreshOutlinedIcon}
            label="Refresh"
            iconSx={isSyncing ? { animation: 'saas-spin 900ms linear infinite' } : undefined}
          />
          {sheetUrl && (
            <NavRow
              component="a"
              href={sheetUrl}
              target="_blank"
              rel="noopener"
              Icon={OpenInNewOutlinedIcon}
              label="Open Google Sheet"
            />
          )}
          <NavRow component="button" type="button" onClick={onOpenSettings} Icon={SettingsOutlinedIcon} label="Settings" />
        </Box>
      </Box>

      {/* Main — 중앙 정렬 없이 프레임 가득. 스크롤은 각 뷰가 소유 */}
      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default SaasShell;
