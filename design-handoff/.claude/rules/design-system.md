# Design System (MUST)

## 핵심 원칙

### 1. 기존 컴포넌트 재활용 (CRITICAL)

새로운 컴포넌트를 만들기 전에 반드시 기존 컴포넌트로 대체 가능한지 확인하고, 가능하면 최대한 재활용해라. 불필요한 중복 컴포넌트 생성을 피해야 함.

### 2. 디자인 토큰 사용 (CRITICAL)

스토리북 Style 카테고리에 명시된 디자인 토큰(색상, 타이포그래피, 간격 등)과 아이콘을 우선 사용해라. 임의의 색상값, 폰트 크기, 간격을 직접 지정하지 말고 theme 토큰을 참조할 것.

#### 색상
```jsx
// theme.palette 토큰 사용
sx={{ color: 'primary.main' }}
sx={{ backgroundColor: 'secondary.main' }}
sx={{ color: 'grey.100' }}
```

#### 타이포그래피
```jsx
// theme.typography 사용
<Typography variant="h1">제목</Typography>
<Typography variant="body1">본문</Typography>
```

#### 간격
```jsx
// theme.spacing 기반 값 사용
sx={{ p: 2, m: 3, gap: 1 }}
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
