# Design System (MUST)

## 핵심 원칙

### 1. 기존 컴포넌트 재활용 (CRITICAL)

새로운 컴포넌트를 만들기 전에 반드시 기존 컴포넌트로 대체 가능한지 확인하고, 가능하면 최대한 재활용해라. 불필요한 중복 컴포넌트 생성을 피해야 함.

### 2. 디자인 토큰 사용 (CRITICAL)

스토리북 Style 카테고리에 명시된 디자인 토큰(색상, 타이포그래피, 간격 등)과 아이콘을 우선 사용해라. 임의의 색상값, 폰트 크기, 간격을 직접 지정하지 말고 theme 토큰을 참조할 것.

#### 색상
```jsx
// 활성 · 선택 · 포커스는 전부 accent
sx={{ color: 'accent.main', backgroundColor: 'accent.tint' }}
sx={{ boxShadow: theme => `0 0 0 3px ${theme.palette.accent.ring}` }}

// 면 위계는 surface (grey.50 / grey.100을 직접 쓰지 않는다)
sx={{ backgroundColor: 'surface.sunken' }}   // 사이드바, 표 헤더
sx={{ backgroundColor: 'surface.muted' }}    // 태그, 프로그레스 트랙

// 읽는 글자는 두 단계
sx={{ color: 'text.primary' }}
sx={{ color: 'text.secondary' }}
```

`primary.main`(#0000FF)은 브랜드 값으로만 남기고 화면에서 직접 쓰지 않는다.
**예외(이 프로젝트): 차트의 데이터 잉크** — Phase 타임라인·Daily spend 막대의
테두리/채움은 `primary.main`을 쓴다(흰 배경 대비 8.59:1, `ReportSummarySection.jsx`
주석 참고). 상호작용(선택·활성·포커스·버튼)은 여전히 accent다.

`text.disabled`는 AA 미달이라 비활성 컨트롤 전용이다. 상태색은 success/warning/error
셋만 쓴다 (예외: 정보 안내 Alert의 `severity="info"`는 허용).

#### 타이포그래피
```jsx
// 제목·KPI·그룹 헤더는 이 프로젝트의 역할 토큰(테마 변형)을 먼저 쓴다
<Typography variant="title" component="h2">섹션 제목</Typography>  // 18px 600 (h3로 매핑됨)
<Typography variant="display">$93,276</Typography>                 // 24px 700, tabular-nums
<Typography variant="label">GROUP HEADER</Typography>              // 13px 600, uppercase

// 역할 토큰에 없는 세부 크기는 시맨틱 태그 + sx의 px로
<Typography component="h2" sx={{ fontSize: 14, fontWeight: 600 }}>작은 섹션 제목</Typography>
<Typography sx={{ fontSize: 11, color: 'text.secondary' }}>표 헤더 · 메타</Typography>

// 숫자는 자릿수가 바뀌어도 폭이 흔들리지 않게
<Typography sx={{ fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{count}</Typography>
```

운영 화면 본문 스케일은 10 · 11 · 12 · 13 · 14px가 주력이다.
`variant="h1"` / `body1`(16px) 같은 기본 스케일은 이 대시보드의 정보 밀도에 맞지 않는다
(밀도 높은 목록·표의 강조 텍스트는 body1 대신 `body2 + fontWeight` 또는 sx px).
자세한 근거는 Storybook의 Style/Typography 문서 참고.

#### 간격
```jsx
// theme.spacing 기반 값 사용 — 운영 화면은 작은 단계가 주력이다
sx={{ gap: 0.75 }}   // 행 안쪽, 아이콘과 글자 사이 (6px)
sx={{ gap: 1.5 }}    // 카드 안 요소 사이 (12px)
sx={{ px: 2, py: 0.875 }}  // 패널 가로 여백 / 목록 행 높이
sx={{ mb: 4 }}       // 섹션 사이 (32px)
```

#### 아이콘
- @mui/icons-material, pixelarticons 아이콘 우선 사용
- `src/stories/style/Icons.stories.jsx` 참고

## 스타일링 규칙

### MUI 기반

- 모든 기본 컴포넌트는 MUI의 가장 최신버전 사용
- 모든 컴포넌트의 스타일은 가능한 MUI의 sx 함수를 사용
- Grid 컴포넌트는 반드시 `CLAUDE.md`의 MUI Grid Import 규칙 참조

### 모듈화

- 수정 시 의존성을 줄 만한 기능들을 독립된 컴포넌트로 모듈화
- 새로운 수정, 추가사항이 있을 때 지시하지 않은 기존 기능, 형태에 영향을 주지 않도록 조심

### UX 가이드

- 특별한 의도가 없다면 구글 머티리얼 디자인의 가이드에 기반한 UX에 충실
