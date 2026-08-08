/**
 * Default Theme
 *
 * 프로젝트의 기본 디자인 토큰을 정의하는 표준 테마입니다.
 * 피그마의 Design Tokens / Variables와 동일한 역할입니다.
 *
 * ## 핵심 철학
 * - **Flat by default**: shape.borderRadius 0 — Card/Paper/Dialog 등 구조 표면은 각짐
 * - **Role-based radius**: 전역 shape을 올리지 않고 상호작용 컨트롤
 *   (Button/Input/Select/Chip, 4px)·분석·참조 카드형 컨테이너(6px) 등 역할
 *   단위로만 예외를 둠 (resources/mui-theme.md 참고)
 * - **Dimmed Shadow**: offset 없이 blur만 사용하는 은은한 그림자
 * - **Pure White**: 깔끔한 흰색 배경
 * - **Brand Blue**: Primary 색상 #0000FF
 */

import { createTheme } from '@mui/material/styles';
import { blueGrey, grey } from '@mui/material/colors';

// ============================================================
// 1. Color Tokens (색상 토큰)
// ============================================================
const palette = {
  mode: 'light',
  // 브랜드 색상
  primary: {
    light: '#6666FF',
    main: '#0000FF',
    dark: '#0000B2',
    contrastText: '#FFFFFF',
  },
  secondary: {
    light: blueGrey[700],
    main: blueGrey[900],
    dark: '#1a252b',
    contrastText: '#FFFFFF',
  },

  // 상태 색상 (Feedback)
  // Brand Blue(#0000FF)의 채도에 맞춰 재조정, info는 primary와 색상군이
  // 겹치지 않도록 청록 계열로 분리 (Visual Direction 문서 참고)
  error: {
    light: '#DE5B4E',
    main: '#B3261E',
    dark: '#7A160F',
    contrastText: '#FFFFFF',
  },
  warning: {
    light: '#C98A2E',
    main: '#8A5A00',
    dark: '#5C3C00',
    contrastText: '#FFFFFF',
  },
  success: {
    light: '#4FAE6F',
    main: '#167C3D',
    dark: '#0E5A2B',
    contrastText: '#FFFFFF',
  },
  info: {
    light: '#4FA3B0',
    main: '#0E6B7A',
    dark: '#06505C',
    contrastText: '#FFFFFF',
  },

  // 텍스트 색상
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },

  // 배경 색상
  background: {
    default: '#FFFFFF',
    paper: '#FFFFFF',
  },

  /**
   * 상호작용 액센트 — 활성·선택·포커스가 모두 이 한 값에서 나온다.
   * (design-handoff 상속: influencer tracking dashboard의 flat-SaaS 리뉴얼 결정)
   *
   * 자리마다 파랑이 다르면 안 된다. 칩 테두리·내비 배경·메뉴 선택이 #0000FF고
   * 탭 밑줄·활성 글자가 #0000B2면 같은 "선택됨"인데 색이 두 개인 셈이다.
   *
   * 기준을 낮은 쪽(#0000B2)으로 잡는다. primary.main은 채도 100%라 화면에서
   * 가장 강한 요소가 되는데, 목록이 주인공인 화면에서 컨트롤이 그 자리를
   * 가져가면 안 된다. 브랜드 색 자체는 primary에 그대로 남는다.
   */
  accent: {
    main: '#0000B2',
    /** 채운 표면(contained 버튼)의 hover — main보다 한 단 어둡게 */
    dark: '#000080',
    /** 선택 배경 — 채우지 않고 옅게 깐다 */
    tint: 'rgba(0, 0, 178, 0.08)',
    /** 선택 배경 hover */
    tintHover: 'rgba(0, 0, 178, 0.14)',
    /**
     * 포커스 외곽 링 — 테두리는 1px로 두고 번짐으로만 알린다.
     * 굵기를 바꾸면 레이아웃이 1px 흔들리므로 두께는 비포커스와 같게 유지한다.
     * 0.18은 링이 테두리만큼 도드라져 컨트롤이 목록보다 강해 보였다.
     */
    ring: 'rgba(0, 0, 178, 0.09)',
  },

  /**
   * 면(surface) 위계.
   * background.default/paper가 둘 다 흰색이라 "한 단 낮은 면"을 표현할 토큰이 없었고,
   * 그 결과 grey.50/100이 날것으로 흩어져 무엇이 사이드바고 무엇이 아바타인지
   * 코드만 봐서는 구분되지 않았다. 이름으로 역할을 고정한다.
   *
   * hover/selected는 여기 두지 않는다 — action.hover/selected는 반투명이라
   * 어떤 면 위에 올려도 합성되지만, 불투명한 grey는 흰 배경에서만 맞다.
   */
  surface: {
    default: '#FFFFFF',
    sunken: grey[50],
    muted: grey[100],
  },

  // 구분선
  divider: 'rgba(0, 0, 0, 0.12)',

  // 액션 상태
  action: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
    focus: 'rgba(0, 0, 0, 0.12)',
  },

  // Grey 스케일
  grey: {
    50: grey[50],
    100: grey[100],
    200: grey[200],
    300: grey[300],
    400: grey[400],
    500: grey[500],
    600: grey[600],
    700: grey[700],
    800: grey[800],
    900: grey[900],
  },
};

// ============================================================
// 2. Typography Tokens (타이포그래피 토큰)
// ============================================================
const typography = {
  // 기본 폰트 패밀리
  fontFamily: [
    '"Pretendard Variable"',
    'Pretendard',
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'Roboto',
    '"Helvetica Neue"',
    '"Segoe UI"',
    '"Apple SD Gothic Neo"',
    '"Noto Sans KR"',
    '"Malgun Gothic"',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    'sans-serif',
  ].join(','),

  // 헤딩 폰트 패밀리
  headingFontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',

  // 폰트 크기 기준
  fontSize: 14,
  htmlFontSize: 16,

  // 폰트 굵기
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,

  // 헤딩 스타일
  h1: {
    fontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',
    fontWeight: 900,
    fontSize: '2.5rem',      // 40px
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',
    fontWeight: 900,
    fontSize: '2rem',        // 32px
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h3: {
    fontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',
    fontWeight: 800,
    fontSize: '1.75rem',     // 28px
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h4: {
    fontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',
    fontWeight: 700,
    fontSize: '1.5rem',      // 24px
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums', // KPI 등 숫자 자릿수 변경 시 레이아웃 고정
  },
  h5: {
    fontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',
    fontWeight: 700,
    fontSize: '1.25rem',     // 20px
    lineHeight: 1.4,
    letterSpacing: '0',
    fontVariantNumeric: 'tabular-nums', // 성과 지표 등 숫자 레이아웃 고정
  },
  h6: {
    fontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',
    fontWeight: 600,
    fontSize: '1.125rem',    // 18px
    lineHeight: 1.4,
    letterSpacing: '0',
  },

  // 본문 스타일
  body1: {
    fontSize: '1rem',        // 16px
    lineHeight: 1.6,
    letterSpacing: '0',
  },
  body2: {
    fontSize: '0.875rem',    // 14px
    lineHeight: 1.6,
    letterSpacing: '0',
  },

  // 부제목
  subtitle1: {
    fontSize: '1rem',        // 16px
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },
  subtitle2: {
    fontSize: '0.875rem',    // 14px
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },

  /**
   * ── 역할 토큰 (display / title / label) ──────────────────────────
   *
   * h1~h6은 **크기 스케일**이고, 아래 셋은 **역할**이다. 둘을 왜 같이 두나:
   *
   * 데이터 화면(Paid Ads)에서 h1~h6을 쓰려니 맞는 칸이 없었다. 실제로 필요한
   * 건 "KPI 숫자 / 섹션 제목 / 그룹·컬럼 헤더" 세 자리인데, 스케일에서 억지로
   * 가장 가까운 걸 골라 쓰다 보니 KPI는 h4(24px), 섹션 제목은 subtitle1(16/500),
   * 그룹 헤더는 overline(12px)로 흩어졌다. 그 결과 **섹션 제목(16/500)과
   * 본문(16/400)이 크기가 같고 굵기만 100 차이**라 제목으로 스캔되지 않았고,
   * **구조를 나누는 그룹 헤더가 화면에서 가장 작은 글씨**라 위계가 역전됐다
   * (실화면 리뷰로 발견).
   *
   * 그렇다고 h1~h6의 값을 바꾸지는 않는다 — 이 테마는 Paid Ads 전용이 아니라
   * 프로젝트 전체 컴포넌트 라이브러리와 Style 스토리가 공유하는 **전역 테마**고,
   * h1~h3만 26곳에서 쓰인다(전부 Paid Ads 밖). 한 화면군의 사정으로 전역
   * 스케일을 재배치하면 그 26곳이 조용히 깨진다. 스케일은 그대로 두고 역할
   * 칸을 새로 판다.
   */

  /**
   * KPI 값 등 화면에서 가장 큰 숫자.
   *
   * 한때 28px로 올렸다가 24px로 되돌렸다. "$93,276.65가 옆 목록의 16px 캠페인명에
   * 눌린다"는 판단이었는데, **레퍼런스(influencer tracking dashboard)의 KPI가
   * 24px**이고 이 프로젝트의 1순위 목표는 "같은 회사 툴군처럼 보이기"다. 일반적인
   * 위계 원칙보다 그 일치가 먼저다 — 두 도구를 오가는 사람에게는 숫자 크기가
   * 다른 것 자체가 "다른 제품"이라는 신호가 된다(실사용 지적).
   */
  display: {
    fontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',
    fontWeight: 700,
    fontSize: '1.5rem',      // 24px — 레퍼런스 실측값
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums', // 자릿수가 바뀌어도 레이아웃이 흔들리지 않게
  },
  /** 섹션 제목. subtitle1(16/500)은 본문(16/400)과 크기가 같아 제목으로 안 읽혔다 */
  title: {
    fontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',
    fontWeight: 600,
    fontSize: '1.125rem',    // 18px
    lineHeight: 1.4,
    letterSpacing: '0',
  },
  /**
   * 그룹 헤더·컬럼 헤더. overline(12px)은 caption과 같은 크기라 구조를 나누는
   * 요소가 가장 약한 위계를 갖는 역전이 있었다. 대문자는 유지한다 — 데이터
   * 테이블 헤더의 관행이고, letterSpacing만 0.08em -> 0.04em으로 좁혀 13px에서
   * 단어가 흩어지지 않게 한다.
   */
  label: {
    fontSize: '0.8125rem',   // 13px
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },

  // 기타
  button: {
    fontSize: '0.875rem',    // 14px
    fontWeight: 600,
    lineHeight: 1.75,
    letterSpacing: '0.02em',
    textTransform: 'none',   // 대문자 변환 비활성화
  },
  caption: {
    fontSize: '0.75rem',     // 12px
    lineHeight: 1.5,
    letterSpacing: '0.02em',
  },
  overline: {
    fontSize: '0.75rem',     // 12px
    fontWeight: 600,
    lineHeight: 2,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};

// ============================================================
// 3. Spacing Token (간격 토큰)
// ============================================================
const spacing = 8; // 기본 단위: 8px

// ============================================================
// 4. Shape Token (모양 토큰)
// ============================================================
const shape = {
  borderRadius: 0, // Sharp corners (0px)

  /**
   * 역할별 radius — 전역 shape.borderRadius(0)는 그대로 두고 역할 단위로만 예외를 둔다.
   *
   * 이 값들은 원래 화면마다 '4px' / '6px' 문자열로 흩어져 있었고, 그 옆에는
   * "숫자 4를 쓰면 shape.borderRadius(0)와 곱해져 0이 된다"는 같은 경고 주석이
   * 반복해서 붙어 있었다. 같은 주석이 여러 파일에 복사된다는 건 토큰이 없다는
   * 신호다. 이름을 붙여 여기 모은다.
   *
   * sx에서는 숫자로 쓰면 곱셈 규칙에 걸리므로 반드시 px 문자열로 넘긴다:
   *   sx={theme => ({ borderRadius: `${theme.shape.radius.control}px` })}
   */
  radius: {
    /** 버튼·입력·셀렉트·칩 등 상호작용 컨트롤. MuiButton/MuiOutlinedInput/MuiChip이 쓰는 값과 같다 */
    control: 4,
    /** 분석·참조용 카드형 컨테이너 (구조 표면인 Card/Paper는 여전히 0) */
    container: 6,
    /** 컨트롤 *안에* 들어가는 미세 요소 — 버튼 안 단축키 힌트 키캡 등 */
    inlay: 3,
  },
};

// ============================================================
// 5. Shadow Tokens (그림자 토큰)
// ============================================================
const customShadows = {
  none: 'none',
  sm: '0 0 12px rgba(0, 0, 0, 0.06)',
  md: '0 0 16px rgba(0, 0, 0, 0.08)',
  lg: '0 0 20px rgba(0, 0, 0, 0.10)',
  xl: '0 0 24px rgba(0, 0, 0, 0.12)',
};

// ============================================================
// 6. Breakpoints (브레이크포인트)
// ============================================================
const breakpoints = {
  values: {
    xs: 0,      // 모바일
    sm: 600,    // 태블릿 세로
    md: 900,    // 태블릿 가로
    lg: 1200,   // 데스크톱
    xl: 1536,   // 대형 데스크톱
  },
};

// ============================================================
// 7. Z-Index (레이어 순서)
// ============================================================
const zIndex = {
  mobileStepper: 1000,
  fab: 1050,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
};

// ============================================================
// 8. Transitions (전환 효과)
// ============================================================
const transitions = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
};

// ============================================================
// 9. Component Overrides (컴포넌트 오버라이드)
// ============================================================
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        boxShadow: customShadows.lg,
      },
      elevation0: {
        boxShadow: customShadows.none,
      },
      elevation1: {
        boxShadow: customShadows.sm,
      },
      elevation2: {
        boxShadow: customShadows.md,
      },
      elevation3: {
        boxShadow: customShadows.lg,
      },
      elevation4: {
        boxShadow: customShadows.xl,
      },
    },
  },
  MuiButton: {
    // disableElevation을 전역 defaultProps로 걸었다가 되돌렸다 — Paid Ads
    // Dashboard 한 화면에서 관찰된 그림자 불일치를 고치려던 건데, 이 테마는
    // Button.stories.jsx/Dialog.stories.jsx/Card.stories.jsx 등 프로젝트
    // 전체 컴포넌트가 공유하는 전역 테마라서 영향 범위를 확인하지 않은 채
    // 다른 모든 컨테인드 버튼의 기본 모양을 바꿔버리는 문제가 있었다.
    // Paid Ads 쪽 버튼들은 각 파일에서 개별적으로 sx={{ boxShadow: 'none' }}
    // 을 다시 붙이는 방식으로 되돌렸다 — 범위가 넓은 디자인 시스템 차원의
    // "그림자 없는 버튼" 결정은 여기서 임의로 내리지 않는다.
    //
    // 색은 그림자와 달리 여기(전역)서 정한다 — 파랑 단일화(accent 주석 참고)를
    // 탭/레일/메뉴/포커스에 적용하고 나니 primary 버튼(#0000FF)만 남은 유일한
    // 100% 채도 파랑이 됐는데, #0000B2 옆의 #0000FF는 "CTA라서 더 강한 색"으로
    // 읽히기보다 미묘하게 어긋난 같은 색으로 읽힌다(실사용 피드백 — "버튼은 왜
    // 아직 #0000FF인가"). 브랜드 색 자체는 palette.primary에 그대로 남고,
    // 버튼이라는 상호작용 컨트롤의 표면색만 accent로 내린다.
    //
    // radius도 같은 재분류다 — 핸드오프는 버튼을 구조 표면(Card/Paper)과 묶어
    // 0으로 뒀는데, 이 프로젝트의 역할 기반 radius 원칙은 클릭 가능한 상호작용
    // 객체를 control(4px)로 분류해 왔다(레일 내비 행·KPI 포커스가 그 근거로
    // 이미 4px). 버튼은 가장 상호작용적인 객체인데 혼자 표면 취급이라, 4px
    // 입력 필드 바로 옆 0px Save 버튼처럼 한 폼 안에 모서리 문법이 두 개였다.
    // 각진 인상 자체는 Card/Paper/Dialog(여전히 0)가 담당하므로 유지된다.
    styleOverrides: {
      root: {
        borderRadius: shape.radius.control,
        textTransform: 'none',
      },
      // hover는 MUI가 그러듯 마우스가 있는 기기에서만 켠다 — 가드가 없으면
      // 터치에서 탭한 뒤 hover 상태가 눌어붙어 색이 남는다.
      containedPrimary: {
        backgroundColor: palette.accent.main,
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: palette.accent.dark },
        },
      },
      outlinedPrimary: {
        color: palette.accent.main,
        borderColor: palette.accent.main,
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: palette.accent.tint, borderColor: palette.accent.main },
        },
      },
      textPrimary: {
        color: palette.accent.main,
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: palette.accent.tint },
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 0,
      },
    },
  },
  // 역할 토큰(display/title/label)의 HTML 태그를 지정한다. 이걸 빼면 MUI가
  // 모르는 variant를 전부 <span>으로 렌더해서, 섹션 제목이 인라인 요소가 되고
  // 스크린리더에 제목으로 잡히지 않는다.
  MuiTypography: {
    defaultProps: {
      variantMapping: {
        // KPI 값·그룹 헤더는 '제목'이 아니라 데이터라 블록 요소로만 둔다.
        display: 'div',
        label: 'div',
        // 섹션 제목은 실제 문서 구조라 heading으로 낸다.
        title: 'h3',
      },
    },
  },
  // Input/Select는 역할별로 4px — shape.borderRadius(전역 0)는 그대로 두고
  // 이 컴포넌트에만 예외를 준다. Button/Card/Paper 같은 구조 표면은 각지고,
  // 입력 컨트롤은 별개의 상호작용 객체로 읽히게 한다. TextField/Select(outlined)
  // 둘 다 이 override를 공유한다 (mui-theme.md의 Surface Radius System 참고).
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        /* MUI 기본 포커스는 테두리를 2px로 굵히고 순수 파랑을 쓴다.
           굵기가 바뀌면 레이아웃이 1px 흔들리고, 컨트롤이 목록보다 강해진다.
           두께는 1px로 두고 바깥에 옅은 링을 둘러 상태를 알린다. */
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: 1,
          borderColor: palette.accent.main,
        },
        '&.Mui-focused': {
          boxShadow: `0 0 0 3px ${palette.accent.ring}`,
        },
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        // MUI 기본값은 alpha(primary.main, 0.08) — 순수 파랑 틴트라 연보라로 보인다.
        // 앱의 다른 "선택됨"과 같은 액센트를 쓴다.
        '&.Mui-selected': { backgroundColor: palette.accent.tint },
        '&.Mui-selected:hover': { backgroundColor: palette.accent.tintHover },
        // 메뉴가 열리면 선택 항목에 포커스가 얹힌다. 이 조합을 빼두면
        // MUI가 selectedOpacity+focusOpacity를 순수 파랑으로 다시 계산한다.
        '&.Mui-selected.Mui-focusVisible': { backgroundColor: palette.accent.tintHover },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
      // compact 모드: small 사이즈 패딩 축소 (운영 툴 정보 밀도 기준)
      sizeSmall: {
        height: 20,
        fontSize: '0.6875rem', // 11px
      },
      labelSmall: {
        paddingLeft: 6,
        paddingRight: 6,
      },
    },
  },
  // Button과 같은 재분류 — 토글(세그먼트 컨트롤)·알림 배너·스켈레톤은 전부
  // 상호작용 컨트롤 내지 컨트롤 크기의 상태 표시라 control radius를 받는다
  // (mui-theme.md 역할표의 4px 행). 전역 shape(0)에 기대던 시절엔 이들이
  // 조용히 각져 있었다 — Alert는 역할표가 4px로 명시하고도 override가 없어
  // 각진 채였고, Skeleton(rounded)은 shape.borderRadius(0)를 그대로 곱해
  // "rounded"라는 이름과 달리 각졌다.
  MuiToggleButton: {
    styleOverrides: {
      root: {
        borderRadius: shape.radius.control,
        textTransform: 'none',
        /* 선택 상태도 accent다. 이 override가 없으면 MUI 기본값(회색
           action.selected 배경 + text.primary)으로 렌더돼서, 탭·레일·메뉴가 전부
           accent로 "선택됨"을 말하는 화면에서 세그먼트 필터만 회색으로 갈린다 —
           앱에서 유일하게 파랑 단일화를 벗어난 컨트롤이었다(감사로 발견). */
        // 비선택 글자색도 레퍼런스와 맞춘다 — MUI 기본은 action.active(0.54)라
        // 레퍼런스의 text.secondary(0.6)보다 한 톤 옅게 나온다.
        color: palette.text.secondary,
        /* 선택은 "틴트 + 파랑 글자"까지다. borderColor는 주지 않는다 —
           레퍼런스 코드에는 borderColor: accent.main이 있지만 그 칩은
           variant="filled"라 MUI가 테두리를 지우므로 화면에는 안 나온다.
           우리 ToggleButton은 테두리가 항상 있어서 같은 값을 주면 진한 파란
           상자가 그려져 레퍼런스보다 훨씬 무겁게 보인다(실화면 비교로 발견).
           그룹의 회색 테두리는 그대로 두고 채움과 글자로만 "켜짐"을 말한다. */
        '&.Mui-selected': {
          color: palette.accent.main,
          backgroundColor: palette.accent.tint,
        },
        '@media (hover: hover)': {
          '&.Mui-selected:hover': { backgroundColor: palette.accent.tintHover },
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: shape.radius.control,
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      rounded: {
        borderRadius: shape.radius.control,
      },
    },
  },
  // 탭도 accent 단일화의 적용 대상 — 팔레트 주석("탭 밑줄·활성 글자가 #0000B2고
  // 다른 곳이 #0000FF면 같은 '선택됨'인데 색이 두 개")이 정확히 이 컴포넌트를
  // 지목하는데, override가 없어서 MUI 기본값(primary.main, 채도 100% 파랑)으로
  // 렌더되고 있었다 — 한 화면 안에서 좌측 레일의 "현재 페이지"(accent)와 본문
  // 탭의 "현재 탭"(primary)이 서로 다른 파랑인 상태. 선언만 하고 집행하지 않은
  // 규칙은 없는 규칙과 같다.
  // primary 변형에만 건다. 처음엔 indicator/Mui-selected 전체에 걸었는데, 그러면
  // indicatorColor="secondary"·textColor="inherit"까지 덮어써서 그 prop들이 앱
  // 전체에서 죽은 컨트롤이 된다(Tabs.stories의 Secondary 예시가 Primary와 똑같이
  // 렌더됐다). 어두운 AppBar 위의 inherit 탭이 남색 글자가 되는 문제도 같은 원인.
  MuiTabs: {
    styleOverrides: {
      indicator: {
        '&.MuiTabs-indicatorColorPrimary': { backgroundColor: palette.accent.main },
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        '&.MuiTab-textColorPrimary.Mui-selected': { color: palette.accent.main },
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        // 인터랙티브 행 hover — 클릭 가능한 행에 cursor pointer 적용 시 함께 사용.
        // 값은 팔레트의 action.hover를 그대로 쓴다 — 예전엔 0.03 리터럴이라
        // 시스템에 hover 회색이 두 개(0.03/0.04)였다.
        '&.MuiTableRow-hover:hover': {
          backgroundColor: palette.action.hover,
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        width: 440,
        boxSizing: 'border-box',
      },
    },
  },
};

// ============================================================
// Theme 생성
// ============================================================
/**
 * MUI elevation 배열(0~24)을 customShadows로 채운다.
 *
 * 이걸 비워두면 sx={{ boxShadow: 2 }} 같은 숫자 단축형이 MUI 기본 Material
 * 엘리베이션(y-offset 있는 3중 그림자)으로 렌더된다 — "offset 없이 blur만"이라는
 * 이 테마의 그림자 철학이 숫자 하나로 뚫리는 구멍이고, 실제로 TagInput·ImageCard가
 * 그 경로로 offset 그림자를 쓰고 있었다(감사로 발견). 배열을 채우면 어떤 표기를
 * 쓰든 같은 철학이 적용된다.
 */
const shadows = [
  customShadows.none,
  ...Array(6).fill(customShadows.sm),
  ...Array(6).fill(customShadows.md),
  ...Array(6).fill(customShadows.lg),
  ...Array(6).fill(customShadows.xl),
];

const defaultTheme = createTheme({
  palette,
  typography,
  spacing,
  shape,
  shadows,
  breakpoints,
  zIndex,
  transitions,
  components,
});

// 커스텀 속성 추가 (타입 확장 없이 접근 가능하도록)
defaultTheme.customShadows = customShadows;

/**
 * 콘텐츠 컨테이너 폭.
 *
 * 예전엔 화면·컴포넌트마다 maxWidth를 직접 박았다 — 320(7곳)·400·420·600·640·
 * 720·900으로 일곱 종류가 흩어져 있어서, 같은 앱인데 Settings는 720px로 좁고
 * Reports 표는 뷰포트 전폭이라 화면마다 캔버스 규칙이 달랐다. 폭도 spacing이나
 * radius처럼 토큰이어야 한다.
 *
 *   sx={(theme) => ({ maxWidth: theme.layout.content.wide })}
 */
defaultTheme.layout = {
  content: {
    /** 폼·설정처럼 한 줄이 길어지면 안 되는 화면 */
    narrow: 480,
    /** 읽기용 문서형 화면 */
    default: 720,
    /** 분석 화면 — 차트와 요약이 함께 놓이는 폭 */
    wide: 1120,
    /** 표가 주인공이라 폭을 제한하지 않는 화면 */
    full: 'none',
  },
};

/**
 * 아이콘 크기 세 단계.
 *
 * 실측으로 fontSize 12·13·14·16·18 하드코딩에 MUI의 `fontSize="small"`(20px)까지
 * 여섯 종류가 섞여 있었다. 12와 13은 눈으로 구분되지 않으면서 코드에만 차이가
 * 남는다 — 그건 시스템이 아니라 잔여물이다.
 */
defaultTheme.iconSize = {
  /** 텍스트 옆에 붙는 인라인 아이콘 (외부 링크, 인디케이터) */
  inline: 16,
  /** 컨트롤 안에 들어가는 아이콘 (IconButton, 버튼 startIcon) */
  control: 20,
  /** 내비게이션 레일 */
  nav: 24,
};

/**
 * 대시보드 스타일 설정 (Default)
 */
defaultTheme.dashboard = {
  style: 'default',
  iconStyle: 'outlined',
  iconWeight: 400,
  cardBorderRadius: 0,
  cardColors: [
    'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 100%)',
    'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 100%)',
    'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 100%)',
    'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 100%)',
    'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 100%)',
    'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 100%)',
  ],
  subCardColors: [
    'linear-gradient(to bottom, #FAFAFA 0%, #FAFAFA 100%)',
    'linear-gradient(to bottom, #FAFAFA 0%, #FAFAFA 100%)',
    'linear-gradient(to bottom, #FAFAFA 0%, #FAFAFA 100%)',
    'linear-gradient(to bottom, #FAFAFA 0%, #FAFAFA 100%)',
    'linear-gradient(to bottom, #FAFAFA 0%, #FAFAFA 100%)',
    'linear-gradient(to bottom, #FAFAFA 0%, #FAFAFA 100%)',
  ],
  textColor: palette.text.primary,
  textSecondary: palette.text.secondary,
  textShadow: '0 0 0 rgba(0, 0, 0, 0)',
  backdropFilter: 'blur(0px)',
  WebkitBackdropFilter: 'blur(0px)',
  border: '1px solid transparent',
  borderColor: 'transparent',
  shadow: customShadows.lg,
  subBorder: '1px solid rgba(0, 0, 0, 0.06)',
  subShadow: '0 0 0 rgba(0, 0, 0, 0)',
  subBackdropFilter: 'blur(0px)',
  subBorderRadius: 0,
  dividerColor: 'rgba(0, 0, 0, 0.12)',
  progressHeight: 6,
  progressTrackColor: 'rgba(0, 0, 0, 0.08)',
  progressBarColor: palette.primary.main,
  progressGradient: false,
  progressBorderRadius: 0,
  background: '#FFFFFF',
  atmosphere: 'linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 100%)',
  atmosphereOpacity: 0,
  accentColor: palette.primary.main,
  accentColors: {
    wind: '#4DB6AC',
    humidity: '#FFB74D',
    uvIndex: '#FF8A65',
    pressure: '#64B5F6',
  },
  blobs: null,
};

export default defaultTheme;

// 개별 토큰 내보내기 (문서화용)
export {
  palette,
  typography,
  spacing,
  shape,
  customShadows,
  breakpoints,
  zIndex,
  transitions,
  components,
};
