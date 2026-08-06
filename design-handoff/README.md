# Design Language Handoff — Influencer Tracking Dashboard (beautymaster)

이 번들은 influencer tracking dashboard(beautymaster)의 디자인 언어를 같은 팀의
다른 프로젝트에서 상속하기 위한 자료입니다. React + MUI v7 기반이며, 모든 스타일은
theme 토큰 + `sx` prop으로 작성되어 있습니다. (2026-08-04 기준, flat-SaaS 리뉴얼
이후 최신 상태)

## 사용법 (다른 프로젝트에서)

1. `.claude/rules/` 4개 파일을 새 프로젝트의 `.claude/rules/`로 복사한다 —
   일회성 프롬프트가 아니라 프로젝트 룰로 상주시킨다.
2. `src/styles/themes/`를 새 프로젝트의 같은 경로에 복사해 MUI ThemeProvider에
   연결한다. 테마는 그대로 쓰고, 프로젝트 고유 색이 필요하면 팔레트를 확장한다
   (덮어쓰지 않는다).
3. 나머지 파일(컴포넌트, 스크린샷)은 "이 언어가 실제로 어떻게 쓰이는지"의
   레퍼런스로 참조시킨다.

## 1순위 — 디자인 언어의 원천

- `src/styles/themes/default.js` — 팔레트, 타이포그래피, 간격, role-based surface
  radius 시스템, MUI 컴포넌트 오버라이드. 디자인 언어의 단일 소스.
- `src/data/componentTokenMap.js` — 컴포넌트별 토큰 사용 매핑 (토큰을 "어떻게"
  쓰는지의 규칙).

## 2순위 — 문서화된 팀 컨벤션

- `CLAUDE.md` — 프로젝트 워크플로우 규칙
- `.claude/rules/design-system.md` — 토큰 사용 원칙, 컴포넌트 재활용 원칙
- `.claude/rules/code-convention.md` — JS/React 코드 컨벤션, props 주석 규칙
- `.claude/rules/directory-structure.md` — 디렉토리/파일 배치 규칙
- `.claude/rules/mui-grid-usage.md` — MUI v7 Grid import 규칙 (Grid2 금지)

## 3순위 — 실제 적용 예시 (flat-SaaS 리뉴얼 이후)

- `src/pages/beautymaster/BeautymasterDashboard.jsx` — 페이지 셸 조립 (뷰 전환,
  드로어/모달 연결)
- `src/components/templates/beautymaster/SaasShell.jsx` — 사이드바 + 콘텐츠 셸
- `src/components/templates/beautymaster/SaasDashboard.jsx` — 대시보드 뷰 조립
- `src/components/templates/beautymaster/SaasAnalyticsView.jsx`,
  `SaasOperationsView.jsx`, `SaasWorkflowView.jsx` — 뷰(패널) 패턴
- `src/components/templates/beautymaster/SaasKpiItem.jsx` — KPI 표시 패턴
- `src/components/templates/beautymaster/SaasStoreSelect.jsx` — 셀렉트 패턴
- `src/components/templates/beautymaster/SheetSetupScreen.jsx` — 온보딩/설정 화면
- `src/components/templates/FilterBar.jsx` — 필터 바 패턴
- `src/components/card/InfluencerCard.jsx` — 대표 카드 컴포넌트

## 참고 스크린샷

- `ref/screen1.png`, `ref/screen2.png`, `ref/update1.png`, `ref/update2.png` —
  최신 대시보드 화면 캡처

## 상속받는 프로젝트에서 기대하는 산출물

기존 디자인 언어를 분석해서 다음 세 가지로 분류:
1. **상속할 것** — 그대로 가져갈 토큰/패턴
2. **확장할 것** — 새 프로젝트 고유 요소를 위해 기존 언어 위에 추가할 부분
3. **고칠 것** — 기존 대시보드에서 반복된 문제가 있다면 답습하지 않을 부분
