/**
 * Carbon Theme
 *
 * IBM Carbon Design System(v11, **White** 테마)을 MUI 테마 한 벌로 옮긴 것.
 * 대시보드 레일의 "Design" 버튼으로 Default 테마와 오간다(DesignSystemProvider).
 *
 * ## 원칙
 * - **컴포넌트 라이브러리가 아니라 토큰이다.** `@carbon/react`를 들이지 않는다.
 *   Carbon의 색·타입·모션·형태 토큰을 default.js와 **같은 키**로 채워서, 컴포넌트
 *   코드는 한 글자도 바꾸지 않고 테마 교체만으로 전환되게 한다.
 * - **default.js의 커스텀 키를 전부 갖는다** — accent·surface·shape.radius·
 *   layout·iconSize·customShadows·typography.display/title/label/shellFontFamily.
 *   한쪽에만 있는 키는 다른 쪽에서 undefined가 되어 조용히 깨진다.
 * - **White 테마**를 골랐다(흰 배경 + 회색 layer-01). Default 테마도 흰 배경 위에
 *   surface.sunken(grey.50)을 한 단 낮게 까는 구조라 면 위계가 1:1로 대응된다.
 *   Gray 10 테마(회색 배경 + 흰 카드)는 위계가 뒤집혀 화면 구조를 다시 짜야 한다.
 * - **밀도는 Carbon compact.** 이 대시보드의 본문 스케일은 10~14px이고 컨트롤은
 *   32px가 주력이라, Carbon의 lg(48px) 기본값을 그대로 쓰면 목록이 두 배로 늘어난다.
 *   버튼·입력 sm 32 / md 40, 표 행 32(short) / 48(medium)로 잡는다.
 *
 * ## 값의 원천은 IBM 패키지다
 * 색·역할 토큰·타입 스케일·모션·브레이크포인트를 전부 `@carbon/colors`·`@carbon/themes`·
 * `@carbon/type`·`@carbon/motion`·`@carbon/layout`에서 읽는다(컴포넌트 없는 토큰 전용
 * 패키지). 처음엔 문서를 보고 손으로 옮겨 적었는데, 패키지와 대조하니 v10 값이 섞여
 * 있었다(primary hover #0353e9 → v11은 #0050e6, secondary hover #4c4c4c → #474747,
 * skeleton #e5e5e5 → #e8e8e8). 손으로 적은 숫자는 그 순간의 기억이고, 패키지는 IBM이
 * 갱신하면 따라온다. 이 파일에 hex를 직접 쓰지 않는다.
 *
 * 컴포넌트별 토큰(button·notification·tag)은 테마 이름을 키로 갖는 객체라
 * (`buttonTokens.buttonPrimaryHover.whiteTheme`) `ct()`로 White 값을 꺼낸다.
 */

import { createTheme } from '@mui/material/styles';
import { blue, gray, red, green, yellow } from '@carbon/colors';
import { white, buttonTokens, notificationTokens, tagTokens } from '@carbon/themes';
import {
  fontFamilies, fontWeights,
  body01, body02, bodyCompact01, label01, helperText01,
  headingCompact01, headingCompact02, heading03, heading04, heading05, heading06, heading07,
} from '@carbon/type';
import { fast01, fast02, moderate01, moderate02, slow01, easings } from '@carbon/motion';
import { breakpoints as carbonBreakpoints, baseFontSize } from '@carbon/layout';

// ============================================================
// 0. Carbon 역할 토큰 (White 테마)
// ============================================================
/** 컴포넌트 토큰 그룹에서 White 테마 값을 꺼낸다 */
const ct = (group, key) => group[key].whiteTheme ?? group[key].fallback;

/**
 * 아래 팔레트·컴포넌트가 전부 이 이름으로 읽는다 — 값이 아니라 역할로 참조해야
 * Gray 10 테마로 바꿀 때 `white` → `g10` 한 줄만 갈면 된다.
 */
const carbon = {
  background: white.background,
  backgroundHover: white.backgroundHover,
  backgroundActive: white.backgroundActive,
  backgroundSelected: white.backgroundSelected,
  layer01: white.layer01,
  layerHover01: white.layerHover01,
  layerSelected01: white.layerSelected01,
  layerSelectedInverse: white.layerSelectedInverse,
  layerAccent01: white.layerAccent01,
  field01: white.field01,
  fieldHover01: white.fieldHover01,
  borderSubtle: white.borderSubtle00,
  borderStrong: white.borderStrong01,
  borderInteractive: white.borderInteractive,
  textPrimary: white.textPrimary,
  textSecondary: white.textSecondary,
  textPlaceholder: white.textPlaceholder,
  textDisabled: white.textDisabled,
  textOnColor: white.textOnColor,
  textInverse: white.textInverse,
  textHelper: white.textHelper,
  iconSecondary: white.iconSecondary,
  interactive: white.interactive,
  linkPrimary: white.linkPrimary,
  linkPrimaryHover: white.linkPrimaryHover,
  focus: white.focus,
  hoverUi: white.layerHover01,
  buttonPrimary: ct(buttonTokens, 'buttonPrimary'),
  buttonPrimaryHover: ct(buttonTokens, 'buttonPrimaryHover'),
  buttonPrimaryActive: ct(buttonTokens, 'buttonPrimaryActive'),
  buttonSecondary: ct(buttonTokens, 'buttonSecondary'),
  buttonSecondaryHover: ct(buttonTokens, 'buttonSecondaryHover'),
  buttonSecondaryActive: ct(buttonTokens, 'buttonSecondaryActive'),
  buttonTertiary: ct(buttonTokens, 'buttonTertiary'),
  buttonTertiaryHover: ct(buttonTokens, 'buttonTertiaryHover'),
  buttonTertiaryActive: ct(buttonTokens, 'buttonTertiaryActive'),
  buttonDisabled: ct(buttonTokens, 'buttonDisabled'),
  supportError: white.supportError,
  supportSuccess: white.supportSuccess,
  supportWarning: white.supportWarning,
  supportInfo: white.supportInfo,
  notificationError: ct(notificationTokens, 'notificationBackgroundError'),
  notificationSuccess: ct(notificationTokens, 'notificationBackgroundSuccess'),
  notificationWarning: ct(notificationTokens, 'notificationBackgroundWarning'),
  notificationInfo: ct(notificationTokens, 'notificationBackgroundInfo'),
  tagBackgroundGray: ct(tagTokens, 'tagBackgroundGray'),
  tagColorGray: ct(tagTokens, 'tagColorGray'),
  tagBorderGray: ct(tagTokens, 'tagBorderGray'),
  skeleton: white.skeletonBackground,
  toggleOff: white.toggleOff,
  overlay: white.overlay,
  highlight: white.highlight,
  shadowMenu: `0 2px 6px 0 ${white.shadow}`,
};

// ============================================================
// 1. Color Tokens
// ============================================================
const palette = {
  mode: 'light',
  /**
   * Carbon은 브랜드 색과 상호작용 색이 같다(Blue 60). Default 테마가 primary
   * (#0000FF)와 accent(#0000B2)를 나눈 이유("100% 채도 파랑이 목록보다 강하다")가
   * Carbon에는 없다 — Blue 60은 흰 배경 대비 4.66:1로 처음부터 UI용으로 만든 색이다.
   * 차트의 데이터 잉크(primary.main)도 그래서 Blue 60이다.
   */
  primary: {
    light: blue[50],
    main: carbon.buttonPrimary,
    dark: carbon.buttonPrimaryHover,
    contrastText: carbon.textOnColor,
  },
  /** Carbon secondary 버튼(Gray 80) */
  secondary: {
    light: gray[70],
    main: carbon.buttonSecondary,
    dark: gray[90],
    contrastText: carbon.textOnColor,
  },

  /**
   * 상태 색. Carbon의 support-* 토큰은 **아이콘·막대용**이라 글자로 쓰면 AA에
   * 미달하는 게 있다(support-warning #f1c21b는 흰 배경 1.6:1, support-success
   * #24a148은 3.5:1). 이 프로젝트는 warning.main·success.main을 글자에 16곳 넘게
   * 쓰므로 main은 글자가 되는 단계(Yellow 60 / Green 60)로 두고, 원래 support 색은
   * light에 둔다 — 아이콘·채움은 light를, 글자는 main을 읽는다.
   */
  error: {
    light: red[50],
    main: carbon.supportError, // 4.5:1 — 글자로도 통과
    dark: red[70],
    contrastText: carbon.textOnColor,
  },
  warning: {
    light: carbon.supportWarning,
    main: yellow[60], // 5.1:1
    dark: yellow[70],
    contrastText: carbon.textOnColor,
  },
  success: {
    light: carbon.supportSuccess,
    main: green[60], // 4.7:1
    dark: green[70],
    contrastText: carbon.textOnColor,
  },
  info: {
    light: blue[50],
    main: carbon.supportInfo,
    dark: blue[80],
    contrastText: carbon.textOnColor,
  },

  text: {
    primary: carbon.textPrimary,
    secondary: carbon.textSecondary,
    disabled: carbon.textDisabled,
  },

  background: {
    default: carbon.background,
    paper: carbon.background,
  },

  /**
   * 상호작용 액센트 — Default 테마와 같은 키. Carbon에서는 interactive(Blue 60)
   * 하나가 활성·선택·포커스를 전부 맡는다.
   * ring은 반투명이 아니라 **불투명 Blue 60**이다. Carbon 포커스는 번짐이 아니라
   * 2px 실선이라, 호출부의 `0 0 0 3px ring`이 그대로 실선 링이 된다.
   */
  accent: {
    main: carbon.interactive,
    dark: carbon.buttonPrimaryHover,
    tint: blue[10],
    tintHover: carbon.highlight,
    ring: carbon.focus,
  },

  /**
   * 차트 데이터 잉크 — Default 테마와 같은 키. 기본 막대는 border-strong(Gray 50),
   * 강조 막대만 interactive(Blue 60). 격자는 border-subtle 한 단계와 그 아래
   * layer-accent(Gray 20)로 나눈다.
   */
  chart: {
    bar: carbon.borderStrong,
    barEmphasis: carbon.interactive,
    grid: carbon.layerAccent01,
    gridStrong: carbon.borderSubtle,
  },

  /** 면 위계 — background / layer-01 / layer-accent-01 */
  surface: {
    default: carbon.background,
    sunken: carbon.layer01,
    muted: carbon.layerAccent01,
  },

  divider: carbon.borderSubtle,

  action: {
    active: carbon.textSecondary,
    hover: carbon.backgroundHover,
    hoverOpacity: 0.12,
    selected: carbon.backgroundSelected,
    selectedOpacity: 0.2,
    disabled: carbon.textDisabled,
    disabledBackground: carbon.buttonDisabled,
    disabledOpacity: 0.25,
    focus: 'rgba(15, 98, 254, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.5,
  },

  /**
   * grey.N → Carbon Gray. MUI grey는 50~900 열 단계, Carbon Gray는 10~100 열 단계라
   * 순서대로 1:1이다. grey.50/100을 직접 쓴 자리(사이드바·태그 배경)가 layer-01 /
   * layer-accent-01로 떨어진다.
   */
  grey: {
    50: gray[10],
    100: gray[20],
    200: gray[30],
    300: gray[40],
    400: gray[50],
    500: gray[60],
    600: gray[70],
    700: gray[80],
    800: gray[90],
    900: gray[100],
  },
};

// ============================================================
// 2. Typography Tokens — IBM Plex Sans, Carbon productive type set (@carbon/type)
// ============================================================
/**
 * @carbon/type의 sans 스택은 'IBM Plex Sans' 뒤에 system-ui로 떨어진다. 우리는
 * @fontsource-variable로 셀프 호스팅하므로 가변 서체 이름을 맨 앞에 두고, 한글
 * 폴백(Pretendard·Apple SD Gothic Neo…)을 IBM 스택 앞에 끼운다 — Plex Sans에 한글
 * 글리프가 없어 이 자리가 없으면 한글이 OS 기본 서체로 떨어진다.
 */
const PLEX = `"IBM Plex Sans Variable", ${fontFamilies.sans.replace(/,\s*system-ui/, ', "Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui')}`;

/** Carbon 타입 스타일 → MUI variant. fontFamily는 헤딩에만 명시(Default 테마와 같은 규칙) */
const withFamily = (style) => ({ fontFamily: PLEX, ...style });

const typography = {
  fontFamily: PLEX,
  headingFontFamily: PLEX,
  /** 셸 서체도 Plex — Default 테마의 Inter 자리(default.js 주석 참고) */
  shellFontFamily: PLEX,

  fontSize: 14,
  htmlFontSize: baseFontSize,

  /** Carbon은 light 300 · regular 400 · semibold 600 셋뿐이다. 700은 없다 */
  fontWeightLight: fontWeights.light,
  fontWeightRegular: fontWeights.regular,
  fontWeightMedium: fontWeights.semibold,
  fontWeightBold: fontWeights.semibold,

  h1: withFamily(heading07),
  h2: withFamily(heading06),
  h3: withFamily(heading05),
  h4: withFamily({ ...heading04, fontVariantNumeric: 'tabular-nums' }),
  h5: withFamily({ ...heading03, fontVariantNumeric: 'tabular-nums' }),
  h6: withFamily(headingCompact02),

  body1: body02,
  body2: body01,
  subtitle1: headingCompact02,
  subtitle2: headingCompact01,

  /**
   * 역할 토큰 — default.js와 같은 세 칸. Carbon 스케일에서 가장 가까운 단계로
   * 옮기되 **굵기는 Carbon 방식(400)**이다. Carbon의 KPI·섹션 제목은 굵기가 아니라
   * 크기로 위계를 만든다.
   */
  /** KPI 값 — heading-04 (28/36, 400) */
  display: withFamily({ ...heading04, fontVariantNumeric: 'tabular-nums' }),
  /** 섹션 제목 — heading-03 (20/28, 400) */
  title: withFamily(heading03),
  /**
   * 그룹·컬럼 헤더 — label-01 (12/16). Carbon은 대문자 변환을 쓰지 않는다 —
   * Default 테마의 uppercase를 여기서 끄는 게 두 시스템의 가장 눈에 띄는 차이 중
   * 하나다.
   */
  label: { ...label01, textTransform: 'none' },

  button: { ...bodyCompact01, textTransform: 'none' },
  caption: helperText01,
  overline: { ...label01, textTransform: 'none' },
};

/** 컴포넌트 override에서 쓰는 Carbon 자간 */
const TRACK_14 = bodyCompact01.letterSpacing;
const TRACK_12 = label01.letterSpacing;

// ============================================================
// 3. Spacing — Carbon spacing-03(8px)이 기본 단위. 2·4·8·12·16·24·32·40·48 스케일과 호환
// ============================================================
const spacing = 8;

// ============================================================
// 4. Shape — Carbon은 radius가 없다. 예외는 Tag(pill)뿐이고 그건 MuiChip override가 맡는다
// ============================================================
const shape = {
  borderRadius: 0,
  radius: {
    control: 0,
    container: 0,
    inlay: 0,
  },
};

// ============================================================
// 5. Shadows — 면은 그림자 대신 경계선으로 나눈다. 떠 있는 것(메뉴·팝오버)만 그림자
// ============================================================
const customShadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
  md: carbon.shadowMenu,
  lg: carbon.shadowMenu,
  xl: '0 4px 12px rgba(0, 0, 0, 0.3)',
};

/** Carbon 2x grid 브레이크포인트(rem) → px. sm 320 · md 672 · lg 1056 · xlg 1312 · max 1584 */
const remToPx = (rem) => parseFloat(rem) * baseFontSize;
const breakpoints = {
  values: {
    xs: 0,
    sm: remToPx(carbonBreakpoints.md.width),
    md: remToPx(carbonBreakpoints.lg.width),
    lg: remToPx(carbonBreakpoints.xlg.width),
    xl: remToPx(carbonBreakpoints.max.width),
  },
};

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
// 6. Motion — @carbon/motion의 duration('70ms')·easing을 MUI 이름에 매핑
// ============================================================
const ms = (duration) => parseInt(duration, 10);
const transitions = {
  duration: {
    shortest: ms(fast01),
    shorter: ms(fast02),
    short: ms(moderate01),
    standard: ms(moderate02),
    complex: ms(slow01),
    enteringScreen: ms(moderate02),
    leavingScreen: ms(moderate01),
  },
  easing: {
    easeInOut: easings.standard.productive,
    easeOut: easings.entrance.productive,
    easeIn: easings.exit.productive,
    sharp: easings.exit.productive,
  },
};

// ============================================================
// 7. Component overrides — Carbon 컴포넌트의 생김새를 MUI 컴포넌트에 입힌다
// ============================================================
/** Carbon 포커스: 2px 실선을 안쪽으로. 굵기 변화로 레이아웃이 흔들리지 않는다 */
const FOCUS_INSET = `inset 0 0 0 2px ${carbon.focus}`;

const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
        // Plex Sans는 기본이 proportional figures — 표·KPI가 많은 화면이라 전역 tabular
        fontFeatureSettings: '"tnum"',
      },
    },
  },

  /* 모든 ButtonBase(버튼·탭·아이콘 버튼·메뉴 항목)에 같은 포커스 문법 */
  MuiButtonBase: {
    styleOverrides: {
      root: {
        '&.Mui-focusVisible': { boxShadow: FOCUS_INSET },
      },
    },
  },

  /* 면은 경계선으로 나눈다 — elevation 숫자를 써도 Carbon의 메뉴 그림자만 나온다 */
  MuiPaper: {
    styleOverrides: {
      root: { boxShadow: customShadows.none, backgroundImage: 'none' },
      elevation1: { boxShadow: customShadows.sm },
      elevation2: { boxShadow: customShadows.md },
      elevation3: { boxShadow: customShadows.lg },
      elevation4: { boxShadow: customShadows.xl },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 0, border: `1px solid ${carbon.borderSubtle}` },
    },
  },

  MuiTypography: {
    defaultProps: {
      variantMapping: { display: 'div', label: 'div', title: 'h3' },
    },
  },

  /**
   * Carbon Button — 글자를 왼쪽에 붙이고 오른쪽에 아이콘 자리를 비워 두는 것이
   * 시그니처다(padding-right 64px). 크기는 sm 32 / md 40 / lg 48.
   * primary: Blue 60 → hover #0353e9 → active Blue 80
   * secondary: Gray 80 → hover #4c4c4c
   * tertiary(outlined): 파란 테두리, hover 시 **채워진다**
   * ghost(text): 파란 글자, hover 시 회색 면
   */
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: 0,
        textTransform: 'none',
        fontWeight: 400,
        justifyContent: 'flex-start',
        paddingLeft: 16,
        paddingRight: 64,
        minWidth: 0,
        '&.Mui-disabled': {
          color: carbon.textDisabled,
          backgroundColor: carbon.buttonDisabled,
          borderColor: carbon.buttonDisabled,
        },
      },
      sizeSmall: { minHeight: 32, paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 48, fontSize: '0.875rem' },
      sizeMedium: { minHeight: 40, paddingTop: 10, paddingBottom: 10 },
      sizeLarge: { minHeight: 48, paddingTop: 14, paddingBottom: 14 },
      /* 텍스트 버튼(ghost)은 오른쪽 여백을 비우지 않는다 — 인라인에 자주 놓인다 */
      text: { paddingRight: 16, '&.MuiButton-sizeSmall': { paddingRight: 12 }, '&.Mui-disabled': { backgroundColor: 'transparent' } },
      containedPrimary: {
        backgroundColor: carbon.buttonPrimary,
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: carbon.buttonPrimaryHover },
        },
        '&:active': { backgroundColor: carbon.buttonPrimaryActive },
      },
      containedSecondary: {
        backgroundColor: carbon.buttonSecondary,
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: carbon.buttonSecondaryHover },
        },
        '&:active': { backgroundColor: carbon.buttonSecondaryActive },
      },
      outlined: {
        borderWidth: 1,
        '&.Mui-disabled': { backgroundColor: 'transparent', borderColor: carbon.buttonDisabled },
      },
      outlinedPrimary: {
        color: carbon.buttonTertiary,
        borderColor: carbon.buttonTertiary,
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: carbon.buttonTertiaryHover, borderColor: carbon.buttonTertiaryHover, color: carbon.textOnColor },
        },
        '&:active': { backgroundColor: carbon.buttonTertiaryActive, borderColor: carbon.buttonTertiaryActive, color: carbon.textOnColor },
      },
      textPrimary: {
        color: carbon.interactive,
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: carbon.hoverUi, color: carbon.linkPrimaryHover },
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 0,
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: carbon.hoverUi },
        },
      },
    },
  },

  /**
   * Carbon Text Input / Select — 회색 필드(field-01) + 아래 1px 실선(border-strong).
   * 좌우·위 테두리가 없다. 포커스는 2px 파란 안쪽 실선, 오류는 2px 빨간 실선.
   */
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 0,
        backgroundColor: carbon.field01,
        transition: `background-color ${transitions.duration.shortest}ms ${transitions.easing.easeInOut}`,
        '& .MuiOutlinedInput-notchedOutline': {
          border: 0,
          borderBottom: `1px solid ${carbon.borderStrong}`,
          borderRadius: 0,
        },
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: carbon.fieldHover01 },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderBottomColor: carbon.borderStrong },
        },
        '&.Mui-focused': { boxShadow: FOCUS_INSET },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderBottomColor: 'transparent', borderWidth: 1 },
        '&.Mui-error': { boxShadow: `inset 0 0 0 2px ${carbon.supportError}` },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderBottomColor: 'transparent' },
        '&.Mui-disabled': { backgroundColor: carbon.field01, color: carbon.textDisabled },
        '&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderBottomColor: 'transparent' },
      },
      input: {
        '&::placeholder': { color: carbon.textPlaceholder, opacity: 1 },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: carbon.textSecondary,
        '&.Mui-focused': { color: carbon.textSecondary },
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: { ...typography.caption, marginLeft: 0, color: carbon.textHelper },
    },
  },

  /* Carbon Menu — 40px 항목, 선택은 layer-selected(회색), hover는 layer-hover */
  MuiMenu: {
    styleOverrides: {
      paper: { borderRadius: 0, boxShadow: carbon.shadowMenu },
      list: { padding: 0 },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        minHeight: 40,
        fontSize: '0.875rem',
        letterSpacing: TRACK_14,
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: carbon.layerHover01 },
        },
        '&.Mui-selected': { backgroundColor: carbon.layerSelected01, fontWeight: 600 },
        '&.Mui-selected:hover': { backgroundColor: carbon.layerHover01 },
        '&.Mui-selected.Mui-focusVisible': { backgroundColor: carbon.layerSelected01 },
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: { borderRadius: 0, boxShadow: carbon.shadowMenu },
    },
  },

  /* Carbon Tag — Carbon에서 유일하게 둥근 것. gray tag = Gray 20 위 Gray 100 */
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 24,
        height: 24,
        fontSize: '0.75rem',
        letterSpacing: TRACK_12,
        backgroundColor: carbon.tagBackgroundGray,
        color: carbon.tagColorGray,
      },
      outlined: { borderColor: carbon.tagBorderGray, backgroundColor: 'transparent' },
      sizeSmall: { height: 18, fontSize: '0.75rem' },
      labelSmall: { paddingLeft: 8, paddingRight: 8 },
      label: { paddingLeft: 8, paddingRight: 8 },
    },
  },

  /* Carbon Content Switcher — 선택된 조각은 Gray 100 채움에 흰 글자 */
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: { borderRadius: 0 },
      grouped: { border: `1px solid ${carbon.borderStrong}` },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        borderRadius: 0,
        textTransform: 'none',
        fontWeight: 400,
        color: carbon.textSecondary,
        borderColor: carbon.borderStrong,
        '&.Mui-selected': {
          color: carbon.textInverse,
          backgroundColor: carbon.layerSelectedInverse,
          borderColor: carbon.layerSelectedInverse,
        },
        '@media (hover: hover)': {
          '&:hover': { backgroundColor: carbon.hoverUi, color: carbon.textPrimary },
          '&.Mui-selected:hover': { backgroundColor: gray[80], color: carbon.textInverse },
        },
      },
    },
  },

  /* Carbon Inline Notification — 왼쪽 3px 색 막대 + 옅은 배경, 글자는 항상 Gray 100 */
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: 0, color: carbon.textPrimary, borderLeft: '3px solid', paddingLeft: 13 },
      standardError: { backgroundColor: carbon.notificationError, borderLeftColor: carbon.supportError, '& .MuiAlert-icon': { color: carbon.supportError } },
      standardSuccess: { backgroundColor: carbon.notificationSuccess, borderLeftColor: carbon.supportSuccess, '& .MuiAlert-icon': { color: carbon.supportSuccess } },
      standardWarning: { backgroundColor: carbon.notificationWarning, borderLeftColor: carbon.supportWarning, '& .MuiAlert-icon': { color: yellow[60] } },
      standardInfo: { backgroundColor: carbon.notificationInfo, borderLeftColor: carbon.supportInfo, '& .MuiAlert-icon': { color: carbon.supportInfo } },
      outlinedError: { borderLeftColor: carbon.supportError },
      outlinedSuccess: { borderLeftColor: carbon.supportSuccess },
      outlinedWarning: { borderLeftColor: carbon.supportWarning },
      outlinedInfo: { borderLeftColor: carbon.supportInfo },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: { backgroundColor: carbon.skeleton },
      rounded: { borderRadius: 0 },
    },
  },

  /**
   * Carbon Line Tabs — 선택 탭은 2px 파란 밑줄, 비선택 탭도 2px 회색 밑줄을 가진다
   * (밑줄이 트랙처럼 이어진다). 선택 글자는 Gray 100 600, 비선택은 Gray 70 400.
   */
  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 40 },
      indicator: {
        height: 2,
        '&.MuiTabs-indicatorColorPrimary': { backgroundColor: carbon.interactive },
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        minHeight: 40,
        padding: '0 16px',
        textTransform: 'none',
        fontWeight: 400,
        fontSize: '0.875rem',
        letterSpacing: TRACK_14,
        color: carbon.textSecondary,
        borderBottom: `2px solid ${carbon.borderSubtle}`,
        '@media (hover: hover)': {
          '&:hover': { borderBottomColor: carbon.borderStrong, color: carbon.textPrimary },
        },
        '&.MuiTab-textColorPrimary.Mui-selected': { color: carbon.textPrimary, fontWeight: 600 },
      },
    },
  },

  /**
   * Carbon Data Table — 헤더는 layer-accent(Gray 20) 위 600, 행은 아래 1px Gray 20.
   * 행 높이: size="small" → short 32, 기본 → medium 48. hover는 layer-hover.
   */
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${carbon.borderSubtle}`,
        fontSize: '0.875rem',
        letterSpacing: TRACK_14,
        padding: '0 16px',
        height: 48,
      },
      head: {
        backgroundColor: carbon.layerAccent01,
        color: carbon.textPrimary,
        fontWeight: 600,
        borderBottom: 0,
      },
      stickyHeader: { backgroundColor: carbon.layerAccent01 },
      sizeSmall: { height: 32, padding: '0 16px' },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&.MuiTableRow-hover:hover': { backgroundColor: carbon.layerHover01 },
        '&.Mui-selected': { backgroundColor: carbon.layerSelected01 },
        '&.Mui-selected:hover': { backgroundColor: carbon.layerHover01 },
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: { borderTop: `1px solid ${carbon.borderSubtle}` },
      toolbar: { backgroundColor: carbon.layer01, minHeight: 40 },
    },
  },

  /* Carbon Checkbox·Radio는 파랑이 아니라 Gray 100, Toggle은 켜짐이 Green 50이다 */
  MuiCheckbox: {
    styleOverrides: {
      root: {
        color: carbon.textPrimary,
        borderRadius: 0,
        '&.Mui-checked': { color: carbon.textPrimary },
        '&.MuiCheckbox-indeterminate': { color: carbon.textPrimary },
      },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: {
        color: carbon.textPrimary,
        '&.Mui-checked': { color: carbon.textPrimary },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: { padding: 8 },
      track: { borderRadius: 12, backgroundColor: carbon.toggleOff, opacity: 1 },
      thumb: { boxShadow: 'none' },
      switchBase: {
        color: carbon.textOnColor,
        '&.Mui-checked': { color: carbon.textOnColor },
        '&.Mui-checked + .MuiSwitch-track': { backgroundColor: carbon.supportSuccess, opacity: 1 },
      },
    },
  },

  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: 0, backgroundColor: carbon.borderSubtle },
      bar: { borderRadius: 0 },
      barColorPrimary: { backgroundColor: carbon.interactive },
    },
  },

  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: carbon.textPrimary,
        color: carbon.textOnColor,
        fontSize: '0.875rem',
        letterSpacing: TRACK_14,
        borderRadius: 2,
        padding: '8px 16px',
      },
      arrow: { color: carbon.textPrimary },
    },
  },

  /* Carbon Side Panel / Modal — 그림자 대신 1px 경계, radius 0, 배경 layer-01 */
  MuiDrawer: {
    styleOverrides: {
      paper: {
        width: 440,
        boxSizing: 'border-box',
        boxShadow: 'none',
        borderLeft: `1px solid ${carbon.borderSubtle}`,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: 0, backgroundColor: carbon.layer01, boxShadow: 'none' },
    },
  },
  MuiBackdrop: {
    styleOverrides: {
      root: { backgroundColor: carbon.overlay },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: { borderColor: carbon.borderSubtle },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        color: carbon.interactive,
        textDecorationColor: 'currentColor',
        '@media (hover: hover)': {
          '&:hover': { color: carbon.linkPrimaryHover },
        },
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: { backgroundColor: carbon.layerAccent01, color: carbon.textPrimary },
    },
  },
};

// ============================================================
// Theme 생성
// ============================================================
const shadows = [
  customShadows.none,
  ...Array(6).fill(customShadows.sm),
  ...Array(6).fill(customShadows.md),
  ...Array(6).fill(customShadows.lg),
  ...Array(6).fill(customShadows.xl),
];

const carbonTheme = createTheme({
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

carbonTheme.customShadows = customShadows;

/** default.js와 같은 값 — 폭은 디자인 시스템이 아니라 화면 구조의 결정이다 */
carbonTheme.layout = {
  content: {
    narrow: 480,
    default: 720,
    wide: 1120,
    full: 'none',
  },
};

carbonTheme.iconSize = {
  inline: 16,
  control: 20,
  nav: 24,
};

/** Carbon 원색과 역할 토큰을 문서화·차트에서 읽을 수 있게 남긴다 (Style 스토리 참고용) */
carbonTheme.carbon = { blue, gray, red, green, yellow, tokens: carbon };

export default carbonTheme;

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
