/**
 * Default Theme
 *
 * 프로젝트의 기본 디자인 토큰을 정의하는 표준 테마입니다.
 * 피그마의 Design Tokens / Variables와 동일한 역할입니다.
 *
 * ## 핵심 철학
 * - **Flat by default**: shape.borderRadius 0 — Button/Card/Paper 등 구조 표면은 각짐
 * - **Role-based radius**: 전역 shape을 올리지 않고 Input/Select/Chip(4px),
 *   분석·참조 카드형 컨테이너(6px) 등 역할 단위로만 예외를 둠 (resources/mui-theme.md 참고)
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
  // MUI 기본값에서 교체됨 — Brand Blue(#0000FF)의 채도에 맞춰 재조정,
  // info는 primary와 색상군이 겹치지 않도록 청록 계열로 분리 (VisualDirection 참고)
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
   *
   * 예전에는 자리마다 파랑이 달랐다. 칩 테두리·내비 배경·메뉴 선택은 #0000FF,
   * 탭 밑줄·활성 글자는 #0000B2였다. 같은 "선택됨"인데 색이 두 개였던 셈이다.
   *
   * 기준을 낮은 쪽(#0000B2)으로 잡는다. primary.main은 채도 100%라 화면에서
   * 가장 강한 요소가 되는데, 목록이 주인공인 화면에서 컨트롤이 그 자리를
   * 가져가면 안 된다. 브랜드 색 자체는 primary에 그대로 남는다.
   */
  accent: {
    main: '#0000B2',
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
    fontVariantNumeric: 'tabular-nums', // KPI 숫자 자릿수 변경 시 레이아웃 고정
  },
  h5: {
    fontFamily: '"Outfit Variable", "Pretendard Variable", Pretendard, sans-serif',
    fontWeight: 700,
    fontSize: '1.25rem',     // 20px
    lineHeight: 1.4,
    letterSpacing: '0',
    fontVariantNumeric: 'tabular-nums', // 성과 지표 수치 레이아웃 고정
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
    styleOverrides: {
      root: {
        borderRadius: 0,
        textTransform: 'none',
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
  // Input/Select get a small radius by role (not a shape.borderRadius change) —
  // surfaces stay sharp (Button/Card/Paper at 0), form controls read as distinct
  // interactive objects. Covers both TextField and Select (outlined variant).
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
  MuiTableRow: {
    styleOverrides: {
      root: {
        // 인터랙티브 행 hover — 클릭 가능한 행에 cursor pointer 적용 시 함께 사용
        '&.MuiTableRow-hover:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        width: 400, // VD 명시값 — 성과 지표 6개 + Note 수용 최소 너비
        boxSizing: 'border-box',
      },
    },
  },
};

// ============================================================
// Theme 생성
// ============================================================
const defaultTheme = createTheme({
  palette,
  typography,
  spacing,
  shape,
  breakpoints,
  zIndex,
  transitions,
  components,
});

// 커스텀 속성 추가 (타입 확장 없이 접근 가능하도록)
defaultTheme.customShadows = customShadows;

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
