# MUI Custom Theme (SHOULD)

MUI 커스텀 테마 설정 규칙

## 테마 파일 관리

- 커스텀 테마는 별도의 파일로 관리한다
- 위치: `src/styles/themes/default.js` (배럴: `src/styles/themes/index.js`)

## Typography

### 본문
- **Pretendard Variable** 버전을 웹폰트로 사용

### Headline
- **영어**: Google Font의 **Outfit**
- **한글**: Pretendard의 가장 높은 weight

## Color

### 원칙 — 상태는 accent, 면은 surface

브랜드 파랑(`primary.main` #0000FF)은 **정체성 값으로만 남긴다**. 화면에서 직접 쓰는 곳은 없다.
활성·선택·포커스는 전부 `accent`가 맡고, 배경 위계는 `surface`가 맡는다.
`grey.50` / `grey.100`을 컴포넌트에서 직접 쓰지 않는다 — 그러면 무엇이 사이드바고 무엇이 태그인지
코드만 봐서는 구분되지 않는다.

### Accent — 활성 · 선택 · 포커스

```jsx
accent: {
  main: '#0000B2',                    // 활성 라벨, 선택 칩 테두리, 링크
  tint: 'rgba(0, 0, 178, 0.08)',      // 선택 배경 — 채우지 않고 옅게 깐다
  tintHover: 'rgba(0, 0, 178, 0.14)', // 선택 항목 hover
  ring: 'rgba(0, 0, 178, 0.09)',      // 포커스 링 — boxShadow 0 0 0 3px
}
```

포커스는 **테두리 두께를 바꾸지 않는다**. 1px을 유지하고 바깥 링으로만 알린다 —
두께가 변하면 레이아웃이 1px 흔들린다.

```jsx
'&.Mui-focused': { boxShadow: theme => `0 0 0 3px ${theme.palette.accent.ring}` }
```

### Surface — 면 위계

```jsx
surface: {
  default: '#FFFFFF',   // 메인 영역
  sunken: grey[50],     // 한 단 낮은 면 — 사이드바, 표 헤더, 그룹 헤더
  muted: grey[100],     // 채워진 작은 면 — 태그, 프로그레스 트랙, 아바타
}
```

hover/selected는 여기 두지 않는다 — `action.hover` / `action.selected`는 반투명이라
어떤 면 위에 올려도 합성되지만, 불투명한 grey는 흰 배경에서만 맞다.

### Brand · Semantic

```jsx
primary:   { main: '#0000FF', dark: '#0000B2' },  // dark만 링크 글자로 나간다
secondary: { main: blueGrey[900] },               // 역할 배지
success:   { main: '#167C3D' },   // 4단계 완료, 연결 성공
warning:   { main: '#8A5A00' },   // 미이행 경고
error:     { main: '#B3261E' },   // 실패, 부정 의견
// info는 정의돼 있으나 화면에서 쓰지 않는다
```

읽어야 하는 글자는 `text.primary` / `text.secondary` 둘로 끝낸다.
`text.disabled`는 대비 2.68:1로 AA 미달이라 **비활성 컨트롤 전용**이다.

## Elevation

Paper에 기본적으로 사용되는 elevation의 box shadow 설정:

- x, y offset: 0
- opacity 값: 낮춤
- blur 값: 높임 (dimmed shadow)

MUI의 `shadows` 배열(25단)은 건드리지 않는다. 대신 `theme.customShadows`를 두고
`MuiPaper` 오버라이드에서 elevation 단계에 매핑한다.

```jsx
const customShadows = {
  none: 'none',
  sm: '0 0 12px rgba(0, 0, 0, 0.06)',
  md: '0 0 16px rgba(0, 0, 0, 0.08)',
  lg: '0 0 20px rgba(0, 0, 0, 0.10)',
  xl: '0 0 24px rgba(0, 0, 0, 0.12)',
};

components: {
  MuiPaper: {
    styleOverrides: {
      elevation1: { boxShadow: customShadows.sm },
      elevation2: { boxShadow: customShadows.md },
      // ...
    },
  },
}
```

실제 화면에 남아 있는 그림자는 포커스 링과 좌측 패널 경계뿐이다 —
위계는 border + spacing + radius로 만들고 그림자를 얹지 않는다.

## Border Radius — Surface Radius System

`shape.borderRadius`는 전역 기본값으로 **0**을 유지한다. 라운딩이 필요한 표면은
전역 shape 값을 올리는 대신, **역할(role) 단위로만** 예외를 준다 — Button/Card/Paper
같은 구조 표면은 그대로 0으로 두고, 실제로 라운딩이 필요한 역할에만 컴포넌트 레벨
override 또는 로컬 sx로 값을 준다. 전체 화면이 하나의 radius로 통일되면 안 된다.

```jsx
shape: {
  borderRadius: 0, // 전역 기본값 — Button/Card/Paper 등 구조 표면은 그대로 0
}
```

### ⚠️ 숫자 vs 문자열 (자주 틀리는 부분)

MUI의 `sx={{ borderRadius: N }}`에서 `N`이 숫자면 `theme.shape.borderRadius`를
곱해서 픽셀을 계산한다. 이 프로젝트는 `shape.borderRadius`가 0이므로
**숫자를 넣으면 항상 0px로 계산되어 라운딩이 씹힌다.** 실제로 라운딩을 주려면
반드시 **px 단위 문자열**을 써서 곱셈을 우회해야 한다.

```jsx
sx={{ borderRadius: 1 }}      // ❌ 1 * 0 = 0px, 적용 안 됨
sx={{ borderRadius: '4px' }}  // ✅ 문자열은 곱셈 없이 그대로 적용
```

theme `components` 오버라이드(`styleOverrides.root`)는 sx 곱셈 로직을 타지 않는
raw CSS-in-JS라 숫자를 그대로 써도 된다 (예: 아래 `MuiChip`, `MuiOutlinedInput`).

### 역할별 값

| 값 | 대상 | 적용 방식 |
|---|---|---|
| **0px** (기본) | Button, Card, Paper 등 구조 표면 전체. Operations의 반복되는 dense row/list 컨테이너(스케줄 행, 인플루언서 리스트 행)는 화면 성격상 항상 flat 유지 | `shape.borderRadius: 0` (아무 것도 안 함) |
| **4px** | Input/Select(TextField, Select) · Chip/Badge · 상태 표시가 필요한 Alert 배너 · document-like 화면의 컨테이너(예: Workflow의 Accordion) | 전역 성격이면 `components.MuiOutlinedInput` / `MuiChip` 오버라이드, 개별 화면 성격이면 로컬 sx `borderRadius: '4px'` |
| **6px** | 하나의 분석 단위로 스캔되어야 하는 카드형 컨테이너(예: Analytics의 KPI 카드·차트/퍼널/테이블 컨테이너, Workflow의 Files & Systems 참조 카드) | 로컬 sx `borderRadius: '6px'` — 전역 shape을 올리지 않고 해당 컴포넌트에서만 지정 |
| **50%** | Avatar | MUI 기본값, 손대지 않음 |

Shadow는 이 시스템에 포함하지 않는다 — 위계는 border + spacing + radius로만 만들고,
box-shadow를 추가로 얹지 않는다.

```jsx
components: {
  MuiButton: { styleOverrides: { root: { borderRadius: 0 } } },
  MuiCard:   { styleOverrides: { root: { borderRadius: 0 } } },
  MuiChip:   { styleOverrides: { root: { borderRadius: 4 } } },
  MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 4 } } }, // TextField + Select
}
```

## 테마 적용 예시

```jsx
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#0000FF', dark: '#0000B2' },
    secondary: { main: '#263238' },  // blueGrey[900]
    accent: { main: '#0000B2', tint: 'rgba(0,0,178,0.08)', ring: 'rgba(0,0,178,0.09)' },
    surface: { default: '#FFFFFF', sunken: grey[50], muted: grey[100] },
  },
  typography: {
    fontFamily: 'Pretendard Variable, sans-serif',
    headingFontFamily: 'Outfit Variable, Pretendard Variable, sans-serif',
    h1: {
      fontFamily: 'Outfit, Pretendard Variable, sans-serif',
      fontWeight: 900,
    },
    // ...
  },
  shape: {
    borderRadius: 0,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* 앱 내용 */}
    </ThemeProvider>
  );
}
```
