# Design Language Handoff — Influencer Tracking Dashboard (beautymaster)

influencer tracking dashboard(beautymaster)의 디자인 언어를 같은 팀의 다른
프로젝트에서 상속하기 위한 번들입니다. React 19 + MUI v7 기반이며, 모든 스타일은
theme 토큰 + `sx` prop으로 작성되어 있습니다.

**기준일: 2026-09-04** (커밋 `0d1148a`, 브랜치 `chore/design-system-sync-2026-09`). 이전 이식본(2026-08-04 스냅샷)에서 무엇이 바뀌었는지는
[`CHANGES-SINCE-2026-08.md`](CHANGES-SINCE-2026-08.md)에 정리돼 있습니다.
**이미 한 번 이식한 프로젝트라면 그 문서를 먼저 읽으세요** — 테마 파일은 바뀌지
않았고, 문서 4개만 갈아끼우면 됩니다.

## 이 번들의 구조

| 경로 | 성격 |
|---|---|
| `src/` | **그대로 복사해서 쓰는 파일.** 새 프로젝트의 같은 경로에 넣으면 동작합니다. |
| `.claude/` | **프로젝트 룰·스킬.** 새 프로젝트의 `.claude/`에 상주시킵니다. |
| `.storybook/` | Storybook 설정 (테마 decorator, 폰트 로딩, 스토리 정렬 순서) |
| `examples/` | **읽기 전용 레퍼런스.** 이 언어가 실제 화면에서 어떻게 쓰이는지 보는 용도입니다. 복사해 넣지 마세요 — 이 프로젝트 고유의 데이터·훅을 import하므로 그대로는 빌드되지 않습니다. |
| `ref/` | 실제 화면 캡처 |

> 이전 번들과 달라진 점: 예시 컴포넌트를 `src/`가 아니라 `examples/`로 분리했습니다.
> `src/**/*.stories.jsx`를 글로브로 잡는 Storybook 설정에 예시 파일이 딸려 들어가
> 빌드가 깨지는 걸 막기 위해서입니다.

## 사용법 (다른 프로젝트에서)

1. **룰 상주**: `.claude/rules/` 4개 파일을 새 프로젝트의 `.claude/rules/`로 복사한다.
   일회성 프롬프트가 아니라 프로젝트 룰로 상주시킨다.
2. **스킬 상주**: `.claude/skills/component-work/`를 새 프로젝트의 `.claude/skills/`로
   복사한다. 단 `resources/components.md`는 **이 프로젝트의 컴포넌트 목록**이므로,
   새 프로젝트에서는 내용을 비우고 형식만 유지한 채 자기 컴포넌트로 다시 채운다.
3. **테마 연결**: `src/styles/themes/`를 같은 경로에 복사해 MUI ThemeProvider에
   연결한다. 테마는 그대로 쓰고, 프로젝트 고유 색이 필요하면 팔레트를 **확장**한다
   (덮어쓰지 않는다).
4. **폰트 로딩**: `FONTS.md`를 따라 폰트 패키지를 설치하고 엔트리 포인트에서
   로드한다. 테마는 폰트 **이름**만 지정하므로, 이 단계를 빼면 서체가 폴백으로 나온다.
   — 2026-08-04 이식본에는 이 문서가 빠져 있었으니 반드시 확인할 것.
5. **Storybook 문서 이식**: `.storybook/`, `src/components/storybookDocumentation/`,
   `src/stories/`를 복사하면 Style 문서(색상·타이포·간격·아이콘·컴포넌트 토큰)가
   그대로 뜬다. 이 다섯 문서가 디자인 언어의 **눈으로 보는** 명세다.
6. **레퍼런스 참조**: `examples/`와 `ref/`는 "이 언어가 실제로 어떻게 쓰이는지"의
   레퍼런스로만 참조시킨다.

### 필요한 패키지

```bash
pnpm add @mui/material @mui/icons-material @emotion/react @emotion/styled
pnpm add pretendard @fontsource-variable/outfit @fontsource-variable/inter
pnpm add pixelarticons   # 아이콘 문서에서 참조
```

원본 기준 버전: `@mui/material ^7.3.5`, `@mui/icons-material ^7.3.5`,
`react ^19.2.0`, `pretendard ^1.3.9`, `@fontsource-variable/outfit ^5.2.8`,
`@fontsource-variable/inter ^5.3.0`, `pixelarticons ^1.8.1`.

## 1순위 — 디자인 언어의 원천

- `src/styles/themes/default.js` — 팔레트(accent · surface 포함), 타이포그래피,
  간격, role-based surface radius 시스템, MUI 컴포넌트 오버라이드.
  **디자인 언어의 단일 소스.** 2026-08-04 이후 한 글자도 바뀌지 않았다.
- `src/data/componentTokenMap.js` — 컴포넌트별 토큰 사용 매핑. 토큰을 "어떻게"
  쓰는지의 규칙. **2026-09 전면 재작성됨** — MUI 일반론이 아니라 이 대시보드가
  실제로 화면에 그리는 컴포넌트만, 소스에서 확인한 값으로 담는다.
- `FONTS.md` + `src/main.jsx` — 폰트 패키지(Pretendard · Outfit · Inter) 설치와
  로딩 방법.

## 2순위 — 눈으로 보는 명세 (Storybook)

`pnpm storybook`으로 띄우면 Style 카테고리에 다음 문서가 뜬다.

- `src/stories/style/Overview.stories.jsx` — 디자인 언어 전체 개요
- `src/stories/style/Colors.stories.jsx` — 팔레트와 각 색의 역할
- `src/stories/style/Typography.stories.jsx` — 운영 화면 글자 스케일(10~14px)과 근거
- `src/stories/style/Spacing.stories.jsx` — 간격 단계
- `src/stories/style/Icons.stories.jsx` — 승인된 아이콘 세트
- `src/stories/style/ComponentTokens.stories.jsx` — `componentTokenMap`의 시각화
- `src/stories/overview/ForDesigners.stories.jsx` — 디자이너용 안내
- `src/components/storybookDocumentation/` — 위 문서들이 쓰는 문서 전용 컴포넌트
  (DocumentTitle · SectionTitle · PageContainer · TreeNode)

## 3순위 — 문서화된 팀 컨벤션

- `CLAUDE.md` — 프로젝트 워크플로우 규칙
- `.claude/rules/design-system.md` — 토큰 사용 원칙, 컴포넌트 재활용 원칙 **(2026-09 개정)**
- `.claude/rules/code-convention.md` — JS/React 코드 컨벤션, props 주석 규칙
- `.claude/rules/directory-structure.md` — 디렉토리/파일 배치 규칙 **(2026-09 개정)**
- `.claude/rules/mui-grid-usage.md` — MUI v7 Grid import 규칙 (Grid2 금지)
- `.claude/skills/component-work/` — 컴포넌트 작업 워크플로우 스킬 **(신규 포함)**
  - `resources/mui-theme.md` — 테마 구조 설명 (가장 이식성 높은 문서)
  - `resources/storybook-writing.md` — 스토리 작성 규칙
  - `resources/typography-criteria.md` · `interactive-principles.md` — 설계 기준
  - `resources/taxonomy-index.md` · `taxonomy-v0.4.md` — 컴포넌트 택소노미
  - `resources/components.md` — **이 프로젝트의** 컴포넌트 목록 (형식만 참고할 것)

## 4순위 — 실제 적용 예시 (`examples/`)

- `pages/beautymaster/BeautymasterDashboard.jsx` — 페이지 셸 조립
- `templates/beautymaster/SaasShell.jsx` — 사이드바 + 콘텐츠 셸
- `templates/beautymaster/SaasDashboard.jsx` — 대시보드 뷰 조립
- `templates/beautymaster/SaasAnalyticsView.jsx` · `SaasOperationsView.jsx` ·
  `SaasWorkflowView.jsx` — 뷰(패널) 패턴. **밀도 높은 표·목록 화면의 레퍼런스로
  가장 값이 크다.**
- `templates/beautymaster/SaasKpiItem.jsx` — KPI 표시 패턴
- `templates/beautymaster/SaasStoreSelect.jsx` — 셀렉트 패턴
- `templates/beautymaster/SaasDateRangeSelect.jsx` · `SaasRangeCalendar.jsx` —
  기간 선택 패턴 (2026-08-04 이후 신규)
- `templates/beautymaster/SheetSetupScreen.jsx` — 온보딩/설정 화면
- `templates/FilterBar.jsx` — 필터 바 패턴
- `card/InfluencerCard.jsx` — 대표 카드 컴포넌트
- 각 `*.stories.jsx` — 스토리 작성 실례 (규칙은 `storybook-writing.md`)

## 참고 스크린샷

- `ref/operations-2026-09.png` — 최신 Operations 뷰 (2026-09-03)
- `ref/analytics-2026-09.png` — 최신 Analytics 뷰 (2026-09-03)
- `ref/screen1.png` · `ref/screen2.png` · `ref/update1.png` · `ref/update2.png` —
  이전(2026-08) 캡처
- `ref/logo.png` — 로고

## 상속받는 프로젝트에서 기대하는 산출물

기존 디자인 언어를 분석해서 다음 세 가지로 분류:

1. **상속할 것** — 그대로 가져갈 토큰/패턴
2. **확장할 것** — 새 프로젝트 고유 요소를 위해 기존 언어 위에 추가할 부분
3. **고칠 것** — 기존 대시보드에서 반복된 문제가 있다면 답습하지 않을 부분
