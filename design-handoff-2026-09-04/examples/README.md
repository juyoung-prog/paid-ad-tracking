# examples/ — 읽기 전용 레퍼런스

이 폴더의 파일은 **복사해서 쓰는 용도가 아닙니다.** 이 프로젝트 고유의
데이터 스키마(`src/data/beautymaster/schema.js`), 훅(`useSheetData`),
오버레이 컴포넌트(`InfluencerDrawer` 등)를 import하므로 그대로는 빌드되지 않습니다.

"토큰과 룰이 실제 화면 코드에서 어떻게 조합되는지"를 보는 용도로만 읽으세요.
특히 밀도 높은 표·목록 화면을 만들 때는 `templates/beautymaster/SaasOperationsView.jsx`와
`SaasAnalyticsView.jsx`가 가장 참고할 만합니다.

`*.stories.jsx`는 `.claude/skills/component-work/resources/storybook-writing.md`의
규칙이 실제로 적용된 예시입니다.
