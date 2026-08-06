# MUI Custom Theme (SHOULD)

MUI 커스텀 테마 설정 규칙

## 테마 파일 관리

- 커스텀 테마는 별도의 파일로 관리한다
- 위치: `src/styles/theme.js` 또는 유사 경로

## Typography

### 본문
- **Pretendard Variable** 버전을 웹폰트로 사용

### Headline
- **영어**: Google Font의 **Outfit**
- **한글**: Pretendard의 가장 높은 weight

## Color

### Primary Color
```jsx
primary: {
  main: '#0000FF'
}
```

### Secondary Color
```jsx
secondary: {
  main: blueGrey[900]  // blueGrey의 가장 어두운색
}
```

## Elevation

Paper에 기본적으로 사용되는 elevation의 box shadow 설정:

- x, y offset: 0
- opacity 값: 낮춤
- blur 값: 높임 (dimmed shadow)

```jsx
shadows: [
  'none',
  '0 0 8px rgba(0, 0, 0, 0.08)',
  '0 0 16px rgba(0, 0, 0, 0.08)',
  // ...
]
```

## Border Radius — Surface Radius System

`shape.borderRadius`는 전역 기본값으로 **0**을 유지한다. 라운딩이 필요한 표면은
전역 shape 값을 올리는 대신, **역할(role) 단위로만** 예외를 준다 — Card/Paper/Dialog
같은 구조 표면은 그대로 0으로 두고, 실제로 라운딩이 필요한 역할에만 컴포넌트 레벨
override 또는 로컬 sx로 값을 준다. 전체 화면이 하나의 radius로 통일되면 안 된다.

Button은 한때 구조 표면과 묶여 0이었는데 **상호작용 컨트롤(4px)로 재분류**했다 —
이 시스템 스스로 "클릭 가능한 상호작용 객체 → control radius"라는 기준으로 레일
내비 행·KPI 포커스를 4px로 분류해 왔는데, 가장 상호작용적인 객체인 버튼만 표면
취급이라 4px 입력 필드 바로 옆 0px Save 버튼처럼 한 폼 안에 모서리 문법이 두 개였다
(실사용 피드백으로 재분류). 각진 인상은 Card/Paper/Dialog(여전히 0)가 담당한다.

```jsx
shape: {
  borderRadius: 0, // 전역 기본값 — Card/Paper/Dialog 등 구조 표면은 그대로 0
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
| **0px** (기본) | Card, Paper, Dialog 등 구조 표면 전체. 반복되는 dense row/list 컨테이너는 화면 성격상 항상 flat 유지 | `shape.borderRadius: 0` (아무 것도 안 함) |
| **3px** (`radius.inlay`) | 컨트롤 *안*의 미세 요소(버튼 안 키캡 등) · 높이 6px 진행 막대(LinearProgress — 절반 값이라 풀 필이 된다: PacingIndicator, Reports Budget by Platform) | 로컬 sx — `` borderRadius: theme => `${theme.shape.radius.inlay}px` `` |
| **4px** (`radius.control`) | Button · ToggleButton(세그먼트) · Input/Select(TextField, Select) · Chip/Badge · 상태 표시가 필요한 Alert 배너(MuiAlert·AlertBanner 행) · Skeleton(rounded) · document-like 화면의 컨테이너(Accordion 등) | 전역 성격이면 `components.MuiButton` / `MuiToggleButton` / `MuiAlert` / `MuiSkeleton` / `MuiOutlinedInput` / `MuiChip` 오버라이드, 개별 화면 성격이면 로컬 sx — `` borderRadius: theme => `${theme.shape.radius.control}px` `` ('4px' 리터럴 금지, 토큰 참조) |
| **6px** (`radius.container`) | 하나의 분석 단위로 스캔되어야 하는 카드형 컨테이너(예: KPI 카드, 차트/테이블 컨테이너, 참조 카드) | 로컬 sx — `` borderRadius: theme => `${theme.shape.radius.container}px` `` |
| **50%** | Avatar | MUI 기본값, 손대지 않음 |

Shadow는 이 시스템에 포함하지 않는다 — 위계는 border + spacing + radius로만 만들고,
box-shadow를 추가로 얹지 않는다.

```jsx
components: {
  MuiButton: { styleOverrides: { root: { borderRadius: shape.radius.control } } }, // 4px — 상호작용 컨트롤
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
    primary: { main: '#0000FF' },
    secondary: { main: '#263238' },  // blueGrey[900]
  },
  typography: {
    fontFamily: 'Pretendard Variable, sans-serif',
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
