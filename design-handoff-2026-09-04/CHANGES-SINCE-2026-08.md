# 2026-08-04 이식본과의 차이

이전에 다른 프로젝트로 이식한 번들은 **2026-08-04 스냅샷**입니다
(`FONTS.md`와 `src/main.jsx`가 없고 README가 그 이전 버전인 것으로 식별).
그 시점부터 2026-09-04까지 무엇이 같고 무엇이 달라졌는지 정리합니다.

## 한 줄 요약

**디자인 토큰 자체는 하나도 안 바뀌었습니다.** 테마 파일은 md5까지 동일합니다.
바뀐 건 (1) 그 토큰을 **어떻게 쓰라고 설명하는 문서**와 (2) 화면 코드의 **분량**입니다.
문서 4개만 갈아끼우면 동기화가 끝납니다.

## 안 바뀐 것 — 다시 안 보내도 되는 파일

| 파일 | 상태 |
|---|---|
| `src/styles/themes/default.js` (548줄) | **md5 완전 동일.** 팔레트 · 타이포 · spacing · MUI override 전부 그대로 |
| `src/styles/themes/index.js` | 동일 |
| `.claude/rules/code-convention.md` | 동일 |
| `.claude/rules/mui-grid-usage.md` | 동일 |
| `CLAUDE.md` | 동일 |
| `examples/card/InfluencerCard.jsx` | 동일 |
| `examples/templates/FilterBar.jsx` | 동일 |
| `SaasWorkflowView` · `SaasKpiItem` · `SaasStoreSelect` · `SaasDashboard` · `SheetSetupScreen` | 동일 |
| `SaasShell.jsx` | 3줄 차이 (사실상 동일) |

`accent.*` / `surface.*` 토큰도 8월 스냅샷 테마에 **이미 들어 있었습니다.**
새로 생긴 게 아닙니다 — 다만 아래 문서가 그걸 안내하지 않고 있었습니다.

## 반드시 갈아끼워야 하는 것

### 1. `.claude/rules/design-system.md` — 최우선

이게 가장 실질적인 차이입니다. 8월 버전은 MUI 일반론을 예시로 들고 있었고,
지금은 이 대시보드의 실제 규칙으로 교체됐습니다.

| | 8월 이식본 (틀린 안내) | 현재 |
|---|---|---|
| 색 | `color: 'primary.main'`, `backgroundColor: 'secondary.main'`, `color: 'grey.100'` | 활성·선택·포커스는 전부 `accent.*`. 면 위계는 `surface.sunken` / `surface.muted`. `grey.50/100` 직접 사용 금지. `primary.main`(#0000FF)은 브랜드 값으로만 남기고 화면에서 안 씀 |
| 타이포 | `<Typography variant="h1">`, `variant="body1"` | 시맨틱만 `component="h2"`로 잡고 크기는 `sx`의 px로. 본문 스케일 10 · 11 · 12 · 13 · 14px, 수치는 18 · 22 + `fontVariantNumeric: tabular-nums`. **`body1`(16px)은 이 정보 밀도에 안 맞음** |
| 간격 | `sx={{ p: 2, m: 3, gap: 1 }}` | 작은 단계가 주력 — `gap: 0.75`(6px, 행 안쪽) · `gap: 1.5`(12px, 카드 안) · `px: 2, py: 0.875`(패널·행 높이) · `mb: 4`(섹션 사이) |

추가된 제약: `text.disabled`는 AA 미달이라 비활성 컨트롤 전용, 상태색은
success / warning / error 셋만.

> **⚠️ 이식받은 프로젝트가 8월 문서를 보고 작업했다면 `primary.main`이나
> `variant="h1"`을 썼을 가능성이 큽니다.** 테마는 맞는데 결과 화면이 다르게
> 보인다면 원인은 거의 여기입니다. 문서를 갈아끼운 뒤 기존 코드에서
> `primary.main` · `secondary.main` · `grey.` · `variant="h1"` · `variant="body1"`을
> 검색해 정리하는 걸 권합니다.

### 2. `src/data/componentTokenMap.js` — 전면 재작성

622줄 → 667줄, 809줄 교체. 성격 자체가 바뀌었습니다.

- **이전**: "MUI 컴포넌트가 디자인될 때 어떤 테마 토큰을 참조하는지" — MUI 일반론
- **현재**: "이 대시보드가 **실제로 화면에 그리는** MUI 컴포넌트만. 각 항목의
  token/role은 소스에서 확인한 값이며, MUI 일반론이 아니다"

예를 들어 Button 항목은 이전엔 contained/outlined/text × 6색 팔레트 설명이었는데,
지금은 "개수가 적다 — 필터 초기화, Alert의 Retry, 시트 설정 진입 정도. 목록
화면에서는 버튼에 색을 주지 않는다. 강조는 accent가 맡는다"로 바뀌었습니다.
`themeOverride` 필드가 새로 생겨서, 테마에서 이미 잡아둔 규칙(화면 코드에서 다시
쓸 필요 없는 것)을 표시합니다. 최상단 항목도 Button에서 Typography로 바뀌었습니다.

### 3. `.claude/rules/directory-structure.md`

`storybookDocumentation/` 카테고리, `hooks/` · `pages/` 경로, BeautyMaster 배치
규칙(화면 부품 / 오버레이 / 데이터 단일 원천 / 시트 연동 체인) 섹션 추가.

### 4. `FONTS.md` + `src/main.jsx` — 8월 이식본에 아예 없던 파일

테마는 폰트 **이름**만 지정합니다. Pretendard · Outfit을 설치하고 엔트리
포인트에서 import하지 않으면 **서체가 폴백으로 나옵니다.** 8월 이식본에는 이
설정 문서가 빠져 있었으므로, 이식받은 프로젝트에서 폰트가 제대로 나오는지
먼저 확인하세요. 실제 렌더링에 눈에 보이는 차이를 만드는 유일한 항목입니다.

## 애초에 이식된 적 없는 것 (이번에 처음 포함)

### Storybook 문서 일체

8월 번들에는 `.stories.jsx`가 **한 개도** 들어가지 않았습니다. Style 카테고리
문서(Colors · Typography · Spacing · Icons · ComponentTokens · Overview)와
`ForDesigners`, 그리고 이들이 쓰는 `storybookDocumentation/` 컴포넌트,
`.storybook/` 설정이 전부 이번에 처음 들어갑니다. 디자인 언어를 **눈으로 보는**
명세라서, 사람이 참조하기엔 룰 문서보다 이쪽이 낫습니다.

### `.claude/skills/component-work/`

룰(`rules/`)만 갔고 스킬은 안 갔습니다. 컴포넌트 생성·수정·삭제·스토리 워크플로우와
설계 기준 문서(mui-theme · storybook-writing · typography-criteria ·
interactive-principles · taxonomy)가 이번에 포함됩니다.

> `resources/components.md`(59KB)는 **이 프로젝트의** 컴포넌트 인벤토리입니다.
> 새 프로젝트에 그대로 두면 없는 컴포넌트를 있다고 착각하게 만듭니다.
> 형식만 남기고 내용은 자기 프로젝트 것으로 다시 채우세요.

## 화면 코드 — 분량은 늘었지만 언어는 그대로

| 파일 | 8월 | 현재 |
|---|---|---|
| `SaasAnalyticsView.jsx` | 841줄 | 1,573줄 |
| `SaasOperationsView.jsx` | 1,115줄 | 1,375줄 |

늘어난 코드가 쓰는 토큰을 전부 뽑아보면 `text.secondary`, `fontSize 11/12/13`,
`accent.main`, `surface.sunken`, `surface.muted`, `py: 0.875`, `gap: 0.75`,
`gap: 1.5` — **새 토큰도, 새 패턴도 하나도 없습니다.** 기존 언어 그대로 기능만
늘어난 것이므로, 디자인 언어 관점에서는 "같은 문법으로 쓴 더 긴 예문"입니다.
다만 밀도 높은 표·목록의 레퍼런스로는 값이 커졌으니 `examples/`에서 참조하세요.

신규 컴포넌트: `SaasDateRangeSelect.jsx` · `SaasRangeCalendar.jsx` (기간 선택 패턴).

## 재이식 체크리스트

- [ ] `.claude/rules/design-system.md` 교체 → 기존 코드에서 `primary.main` ·
      `secondary.main` · `grey.` · `variant="h1"` · `variant="body1"` 검색해 정리
- [ ] `src/data/componentTokenMap.js` 교체
- [ ] `.claude/rules/directory-structure.md` 교체
- [ ] `FONTS.md` 따라 폰트 패키지 설치 + 엔트리 포인트 로드 확인
- [ ] `.claude/skills/component-work/` 추가 (`components.md`는 비우고 형식만 유지)
- [ ] `.storybook/` + `src/components/storybookDocumentation/` + `src/stories/` 추가
- [ ] `src/styles/themes/` — **건드리지 않는다** (동일)
