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
    // disableElevation을 전역 defaultProps로 걸었다가 되돌렸다 — Paid Ads
    // Dashboard 한 화면에서 관찰된 그림자 불일치를 고치려던 건데, 이 테마는
    // Button.stories.jsx/Dialog.stories.jsx/Card.stories.jsx 등 프로젝트
    // 전체 컴포넌트가 공유하는 전역 테마라서 영향 범위를 확인하지 않은 채
    // 다른 모든 컨테인드 버튼의 기본 모양을 바꿔버리는 문제가 있었다.
    // Paid Ads 쪽 버튼들은 각 파일에서 개별적으로 sx={{ boxShadow: 'none' }}
    // 을 다시 붙이는 방식으로 되돌렸다 — 범위가 넓은 디자인 시스템 차원의
    // "그림자 없는 버튼" 결정은 여기서 임의로 내리지 않는다.
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
  // Input/Select는 역할별로 4px — shape.borderRadius(전역 0)는 그대로 두고
  // 이 컴포넌트에만 예외를 준다. Button/Card/Paper 같은 구조 표면은 각지고,
  // 입력 컨트롤은 별개의 상호작용 객체로 읽히게 한다. TextField/Select(outlined)
  // 둘 다 이 override를 공유한다 (mui-theme.md의 Surface Radius System 참고).
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 4,
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
        width: 440,
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
