# Influencer-Tracking 디자인 이식 핸드오프

paid-ad-tracking 대시보드의 화면 스타일을 `juyoung-prog/Influencer-Tracking`
(React 19 + MUI 7, 같은 계정)에 옮기기 위한 인수인계 문서다. 실제 이식 작업은
**Influencer-Tracking Codespace에서** 한다. 이 폴더는 그쪽 세션이 읽고 시작할 재료다.

## 0. 결론부터

- 두 저장소는 같은 뿌리다. 디렉토리 구조, `.claude/rules`, 테마 토큰 키(accent · surface ·
  chart · shape.radius · typography.display/title/label), 좌측 아이콘 레일(`SaasShell.jsx`,
  RAIL_WIDTH 56)까지 이미 같다. 테마 파일을 그대로 덮어써도 화면 픽셀 차이는 0.56%였다
  (accent `#0000B2` → `#2563EB`가 거의 전부).
- 그래서 옮길 것은 **테마가 아니라 화면 관용구**다. 섹션 카드, 고밀도 표와 미니 그리드,
  벤치마크 델타, 스크롤 영역 가장자리, 인쇄 규칙. 아래 3절이 그 목록이다.

## 1. 1단계 패치 적용 (테마 · 서체 · 규칙)

이 Codespace의 GitHub 토큰은 paid-ad-tracking 저장소에만 쓰기 권한이 있어
`design/paid-ads-style` 브랜치 푸시가 403으로 거부됐다. 대신 그 커밋(`12e603e`)을
패치 파일로 여기 남겼다.

- `0001-design-theme-paid-ad-tracking-1.patch` — 바꾸는 파일 3개
  - `src/styles/themes/default.js` (paid-ad-tracking 버전으로 교체)
  - `src/main.jsx` (`import '@fontsource-variable/inter'` 한 줄)
  - `.claude/rules/design-system.md` (paid-ad-tracking 버전으로 교체)

Influencer-Tracking Codespace에서:

```bash
git checkout -b design/paid-ads-style
curl -fsSL https://raw.githubusercontent.com/juyoung-prog/paid-ad-tracking/main/docs/design-handoff/influencer-tracking/0001-design-theme-paid-ad-tracking-1.patch | git am
pnpm build
```

`git am`이 충돌하면 `git am --abort` 후 위 세 파일을 raw URL로 직접 받아 덮어써도 같다
(`https://raw.githubusercontent.com/juyoung-prog/paid-ad-tracking/main/<경로>`).

## 2. 대상 저장소에서 본 것 (2026-09-14, main 기준)

- 화면은 `/beautymaster` 하나에 Operations · Report(Analytics) · Workflow 세 뷰
  (`src/components/templates/beautymaster/Saas*View.jsx`), 셸은 `SaasShell.jsx`.
- Report 뷰는 1600px 폭에서 우측 사이드 패널이 본문과 겹친다 — 이식하면서 같이 고친다.
- `boxShadow`를 쓰는 파일 5개(SaasShell, SaasOperationsView, SaasWorkflowView,
  SaasDateRangeSelect, SaasStoreSelect). paid-ad-tracking 규칙은 "그림자 없음, 1px divider +
  여백"이라 전부 걷어낸다.

## 3. 옮길 관용구와 원천 파일

원천은 전부 paid-ad-tracking `main`이다. 경로 앞에 raw URL 접두사를 붙이면 바로 받을 수 있다.

| 관용구 | 원천 | 요지 |
|---|---|---|
| 섹션 카드 | `src/pages/paidAdsDashboard/paidAdsPageUtils.js` → `SECTION_CARD_SX`, `PAGE_GUTTER_X` | 1px divider + `radius.container`, 그림자 없음, `overflow:hidden`, `mb:3`. 안쪽 여백은 카드가 아니라 제목 행과 셀(`px:2`)이 갖는다. 페이지 좌우 여백은 한 곳(`PAGE_GUTTER_X`)에서만 |
| 고밀도 표 + 미니 그리드 | `src/components/data-display/RecapCampaignTable.jsx` → `SecondaryMetricGrid`, `KpiSlot`, `HEAD_SX`/`CELL_SX`/`META_SX` | 셀 안 보조 지표는 "라벨 위 · 값 아래" 그리드(라벨 11px/400 secondary, 값 12px/600 tabular-nums). 표 헤더 `surface.sunken`, 본문 12–13px, 메타 11px |
| 표의 뷰 모델 분리 | `src/components/data-display/recapRowView.js` | 표가 문장·항목을 직접 만들지 않고 뷰 모델 함수가 만든다. 시트 내보내기·검증 스크립트가 같은 함수를 쓴다 |
| 벤치마크 델타 | `src/components/data-display/BenchmarkDelta.jsx`, `BenchmarkArrow.jsx` | 값 옆에 중앙값 대비 화살표·밴드. size/emphasis 프리셋 |
| KPI 바 | `src/components/data-display/KpiBar.jsx` | `variant="display"` 숫자 + `label` 캡션 한 줄. Influencer-Tracking에도 같은 이름이 있으니 diff로 맞춘다 |
| 스크롤 영역 | `src/components/container/ScrollArea.jsx` | 가로 스크롤 가장자리 페이드(`edgeStrength`), 스크롤 힌트. 넓은 표를 감싼다 |
| 타임라인 | `src/pages/paidAdsDashboard/PhaseTimelineChart.jsx` | 격자 `chart.grid`, 막대 `chart.bar`(강조 하나만 `chart.barEmphasis`), 인쇄 시 막대를 선으로. Influencer의 `ScheduleTimeline.jsx`에 적용 |
| 레일 | `src/pages/paidAdsDashboard/PaidAdsRail.jsx` | 이미 거의 같다. 활성 항목 `accent.tint`, 유틸리티 항목 하단, `Design` 스위치 |
| 인쇄 | `src/pages/paidAdsDashboard/PaidAdsShell.jsx` → `PRINT_STYLES`, `RecapDetailPage.jsx` `data-print` 속성, `RecapCampaignTable.jsx` `PRINT_COLUMN_WIDTH` | 인쇄 전용 컴포넌트를 만들지 않는다. 같은 컴포넌트가 `'@media print'` sx로 Letter 세로에 맞춘다. `@page { size: letter portrait; margin: 10mm 12mm }`, 1쪽 본문 ≈ 980px, 행 `breakInside:'avoid'`, `<col>` 폭은 인라인이라 `!important` |
| 타이포 역할 | `src/styles/themes/default.js` → `typography.display/title/label` | display 24/600 tabular, title 18/600(h3), label 13/600 uppercase. 본문은 10·11·12·13·14px, `body1`/`h1` 안 씀 |
| 규칙 | `.claude/rules/design-system.md` | 1단계 패치에 포함. 컴포넌트는 hex·px radius를 모른다 |

## 4. 순서

1. 1단계 패치 적용, 빌드·콘솔 0 에러 확인.
2. Report(Analytics) 뷰: 섹션 카드 + 표 헤더/셀 스케일 + 미니 그리드 + BenchmarkDelta. 사이드 패널 겹침 수정.
3. Operations 뷰: 목록 행을 카드 안 표로, 그림자 제거, ScrollArea.
4. Workflow 뷰와 셀렉트류: 그림자 제거, `accent.*` 통일.
5. 인쇄: 셸에 `PRINT_STYLES`, Report 뷰에 `'@media print'`. 별도 인쇄 컴포넌트 금지.
6. Storybook: 바뀐 컴포넌트마다 스토리 갱신, `components.md` 동기화, `pnpm generate-rules`.

## 5. Influencer-Tracking Codespace 킥오프 프롬프트

```
paid-ad-tracking 저장소의 대시보드 디자인 스타일을 이 저장소(Influencer-Tracking)에 이식한다.
먼저 https://raw.githubusercontent.com/juyoung-prog/paid-ad-tracking/main/docs/design-handoff/influencer-tracking/README.md 를 읽고,
1절의 패치를 design/paid-ads-style 브랜치에 적용해 빌드를 확인한 뒤, 4절 순서대로 진행해.
2단계(Report 뷰)부터는 3절 표의 원천 파일을 raw URL로 받아 참고하되, 컴포넌트는 복사가 아니라
이 저장소의 기존 컴포넌트(KpiBar, ScheduleTimeline, Saas*View)를 고쳐서 맞춘다.
UI 문자열은 영어, 대화는 한글. 푸시는 내가 말할 때만.
```
