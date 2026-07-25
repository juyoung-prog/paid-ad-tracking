# 페이드 광고 트래킹 대시보드 — Visual Direction

> 내부 운영 툴. 하루 여러 번 들여다보는 화면이므로 판독 속도가 최우선이며, 같은 회사의 Influencer Tracking Dashboard와 시각적으로 한 팀이 만든 툴군처럼 읽혀야 한다.

---

## 톤앤매너

- **키워드**: Operational · Clean · Status-first · Low friction
- **설명**: 아름다움보다 "지금 뭐가 돌아가는지 5초 안에 읽히는가"가 우선. 브랜드 감성은 헤더 타이틀 한 줄 정도에만 쓰고 나머지는 기능적으로 간다.
- **일관성 근거**: Influencer Tracking Dashboard(`03-visual-direction.md`)와 동일한 톤앤매너를 채택 — 같은 회사·같은 사용자·같은 "운영자가 반복적으로 보는 화면"이라는 성격이 동일하기 때문. 새로운 톤을 만들지 않는 것 자체가 이번 프로젝트의 의도적 결정.
- **참조 레퍼런스**: Linear, Notion 대시보드, Vercel Dashboard — Influencer Tracking Dashboard와 동일하게 유지 (사용자가 별도 레퍼런스를 제공하지 않았으므로 기존 결정을 그대로 승계, 새 레퍼런스 원하시면 교체 가능)

---

## 레이아웃 방향

### 2컬럼 구조 (Influencer Tracking Dashboard와 동일 골격)

| 영역 | 너비 | 스크롤 | 역할 |
|------|------|--------|------|
| 좌측 보조 패널 | 280px 고정 | 독립 스크롤 | FilterBar + StoreBreakdown — 항상 화면에 고정 |
| 우측 메인 | 나머지 전체 | 독립 스크롤 | AlertBanner + 상태 탭 + 캠페인 카드 그리드 |
| 헤더 | 100% | sticky | KpiBar + 알림 아이콘 + "광고 등록" 버튼 |

### 공간 원칙

- **헤더 높이**: 56px — Influencer Dashboard와 동일 기준 유지
- **좌측 패널 배경**: `grey.50`(#FAFAFA) — 경계선 없이 배경색만으로 구분
- **우측 메인 배경**: `background.default`(white)
- **캠페인 카드 그리드**: **2열 고정**(1280px+) → **1열**(960px 미만) — 캠페인 카드가 인플루언서 카드보다 정보량이 많아(플랫폼·계정·매장·기간·예산·목표·상태) 3열은 과밀하다고 판단, Influencer의 3열보다 한 단계 낮춤
- **카드 간격**: `gap: 2`(16px)
- **섹션 간격**: `mb: 3`(24px)

### 반응형 범위 (명시적 결정)

Influencer Tracking Dashboard와 동일하게 **데스크탑 우선, 반응형 최소화**를 가정한다 — 실무자 본인이 매일 데스크탑에서 반복 확인하는 업무 패턴이 동일하기 때문. 팀원 합류 후 모바일 확인 니즈가 실제로 발생하면 그때 반응형 범위를 재검토한다 (지금 미리 설계하지 않음, 이 문서에서 명시적으로 스코프 제외).

### borderRadius

기존 테마 `borderRadius: 0` 유지. 예외는 Influencer Dashboard와 동일:
- Chip(플랫폼·매장·goal 뱃지): `4px` — 이 프로젝트 기본 테마에 이미 설정되어 있어 **변경 불필요**
- Avatar류: 사용하지 않음 (사람이 아니라 캠페인이 주체이므로 아바타 불필요)
- 카드: `0` 유지

---

## 컬러 팔레트

### 기반 컬러 — Influencer Tracking Dashboard의 커스텀 토큰을 그대로 승계

이 프로젝트(vibe-design-starterkit) 기본 테마는 success/warning/error/info가 MUI 기본값이지만, Influencer Tracking Dashboard에서 이미 다음과 같이 재조정했다. 같은 회사 내부 툴 간 컬러 언어를 통일하기 위해 **그대로 채택**한다 (임의 재조정 없음).

| 토큰 | 현재값 (이 프로젝트 기본) | 변경값 (Influencer Dashboard 채택) | 근거 |
|------|--------------------------|-----------------------------------|------|
| `primary.main` | `#0000FF` | 유지 | Brand Blue — 인터랙티브 요소 전용으로 사용 범위 좁힘 |
| `secondary.main` | `blueGrey[900]` (`#263238`) | 유지 | 헤더/구분 요소 |
| `error.main` | `#d32f2f` | `#B3261E` | Brand Blue 채도에 맞춰 재조정 (Influencer VD 근거 승계) |
| `warning.main` | `#ed6c02` | `#8A5A00` | 상동 |
| `success.main` | `#2e7d32` | `#167C3D` | 상동 |
| `info.main` | `#0288d1` | `#0E6B7A` | primary와 색상군이 겹치지 않도록 청록 계열로 분리 |
| `grey.50` | `#FAFAFA` | 유지 | 좌측 패널 배경 |

### 상태/알림 컬러 매핑 (신규 정의 — 이번 프로젝트 고유)

Influencer Dashboard는 "완료/미완료" 2단 판독이었지만, 이 프로젝트는 캠페인 상태(3종) + 알림(5종)이 공존해 판독 체계를 새로 정의해야 한다. **알림 피로 방지를 위해 긴급도를 2단계로만 나눈다.**

| 유형 | 컬러 | 처리 |
|------|------|------|
| 캠페인 상태 — 진행중 | `success.main` | 상태 칩 |
| 캠페인 상태 — 예정 | `grey.500` | 상태 칩 |
| 캠페인 상태 — 종료 | `grey.400` (outline) | 상태 칩 |
| **고긴급 알림** (`ending_soon`, `missing_performance`, `budget_pacing`) | `warning.main` (missing_performance만 `error.main`) | 상단 AlertBanner에 노출, 카드에도 뱃지 표시 |
| **저긴급 알림** (`overlap_target`) | `grey.500` (outline chip, 색 채움 없음) | 카드에 작은 인라인 표시만, AlertBanner에는 노출 안 함 — 오탐/피로 방지 |
| `new_store_reminder` | 색 없음, `text.secondary` | `/stores` 페이지 내 안내 문구로만 처리, Alert 시스템 밖 |

> `missing_performance`만 `error`로 격상하는 이유: 종료됐는데 성과가 없으면 보고 자체가 막히는 상태라 다른 두 유형(아직 시간 여유 있음)보다 실질적으로 더 급함.

### 플랫폼 구분 — 색상 대신 아이콘+텍스트

Meta/TikTok을 색으로 구분하지 않는다 (예: 파랑=메타, 검정=틱톡 같은 임의 매핑 금지). Influencer Dashboard의 "컬러 사용 제한" 원칙을 승계 — 플랫폼은 아이콘 + 텍스트 라벨의 outline Chip으로만 표시한다. 이유: 알림/상태 컬러(success/warning/error)와 시각적으로 경쟁하면 판독 속도가 떨어진다.

### 컬러 사용 제한 (Influencer Dashboard 원칙 승계)

- `primary.main`은 인터랙티브 요소에만 (링크, 활성 탭, "광고 등록" 버튼)
- 배경·카드에 파란색 금지
- 상태/알림 컬러는 텍스트·아이콘·칩 테두리로만, 카드 전체 배경 채색 금지

---

## 정보 밀도

### 원칙

Influencer Dashboard와 동일하게 **Compact 모드** 기준. 단, 캠페인 카드는 필드 수가 많아 밀도를 한 단계 낮춘다(3열→2열, 위 레이아웃 방향 참고).

| 요소 | 값 | 근거 |
|------|-----|------|
| 카드 패딩 | `p: 2`(16px) | Influencer와 동일 |
| 카드 총 높이 | ~104px (4행) | 캠페인명, 플랫폼·계정·매장, 기간·예산, (있을 때만) 알림 뱃지 |
| KPI 헤더 높이 | 56px | 숫자+라벨 2줄 최소값 |
| 좌측 StoreBreakdown 행 높이 | 40px | 매장 코드 + 캠페인 수만 표시, 클릭 시 필터 적용 |
| Drawer 너비 | 440px | Influencer(400px)보다 약간 넓힘 — 성과 입력 폼 필드(Tier 1~4)가 더 많아서 |

### 캠페인 카드 밀도 설계

```
┌────────────────────────────────────────────┐
│ ● Morrow Grand Opening Awareness    진행중  │  ← Hero: 캠페인명(16px bold) + 상태 칩
│ Meta · Georgia          G11                 │  ← 플랫폼·계정 outline chip + 매장 chip
│ 08.01–08.31   ·   $1,500 (집행 $1,204)       │  ← 기간 · 예산(tabular-nums)
│ ⚠ 종료 D-3                                   │  ← 고긴급 알림 뱃지 (있을 때만)
└────────────────────────────────────────────┘
```

- 2열 그리드에서 1280px 기준 카드 너비 약 560px
- "지금 이 캠페인이 뭐고 언제 끝나는가"만 카드에서 즉시 전달, 성과 지표(Tier 1~4)는 전부 Drawer로 숨김 — Influencer Dashboard의 "카드는 최소 정보, 나머지는 Drawer" 원칙 그대로 적용

---

## 타이포그래피 원칙

### 폰트 패밀리 (Influencer Dashboard와 동일하게 승계)

| 용도 | 폰트 |
|------|------|
| 헤더 타이틀 | Outfit Variable(영문) / Pretendard Variable(한글) |
| 본문 전체 | Pretendard Variable |
| KPI·예산·성과 숫자 | Pretendard Variable — `font-variant-numeric: tabular-nums` |

### 타이포그래피 스케일

| 요소 | variant | 크기 | weight | 비고 |
|------|---------|------|--------|------|
| 페이지 타이틀 | `h6` | 18px | 700 | 헤더 안에서 작게 |
| KPI 숫자 (진행중/예정/종료/미보고) | `h4` | 32px | 700 | tabular-nums |
| KPI 라벨 | `caption` | 11px | 400 | 숫자 아래, uppercase |
| 캠페인명 (카드 Hero) | `body1` | 16px | 600 | |
| 캠페인 메타(플랫폼·계정·매장) | `body2` | 14px | 400 | `text.secondary` |
| 기간·예산 | `body2` | 14px | 500 | 예산 숫자는 tabular-nums |
| StoreBreakdown 행 | `body2` | 14px | 400 | 매장코드는 monospace 느낌으로 letter-spacing 살짝 |
| AlertBanner 문구 | `body2` | 14px | 500 | `warning.main`/`error.main` |
| Drawer 섹션 라벨 | `overline` | 11px | 600 | letter-spacing 넓게 |
| Drawer 성과 지표 (Tier 1~4) | `h5` | 24px | 700 | tabular-nums 필수 |
| 계산 필드 (CPM/CTR/Hook Rate 등) | `body2` | 14px | 500 | raw 값 옆에 괄호로 병기, `text.secondary` |

### 원칙

- **숫자는 tabular-nums 필수** — KPI, 예산, 성과 raw 필드, 계산 필드(CPM/CTR/Hook Rate/Hold Rate 등) 전부. 자릿수 바뀔 때 레이아웃이 흔들리면 "5초 판독"이라는 목표 자체가 깨짐.
- **헤더 타이틀은 작게, KPI 숫자가 화면에서 제일 큰 글자** — h1/h2/h3는 이 화면에서 쓰지 않는다.
- **raw 값과 계산 값을 위계로 구분** — 예: "노출 120,000 (CPM $12.40)"처럼 raw는 굵게, 계산값은 보조색·괄호로. 사용자가 입력한 값과 시스템이 계산한 값을 혼동하지 않도록.

---

## 레퍼런스

사용자가 이번 프로젝트에 별도 레퍼런스 이미지를 제공하지 않아, Influencer Tracking Dashboard 수립 시 사용한 레퍼런스를 그대로 승계한다 (일관성 유지가 이번 프로젝트의 명시적 목표이므로).

| # | 레퍼런스 | 참고 포인트 |
|---|---------|------------|
| 1 | Linear | 정보 밀도, 상태 칩 사용 방식 |
| 2 | Notion 대시보드 | 좌측 고정 패널 + 우측 스크롤 그리드 구조 |
| 3 | Vercel Dashboard | 화이트 베이스, 명확한 상태 컬러, sticky 헤더 |

---

## 변경 필요 토큰 요약

Influencer Tracking Dashboard가 이미 검증한 값과 동일하게 맞춘다 — 새 토큰을 발명하지 않고 그대로 이식하는 것이 이번 결정의 핵심.

| 토큰 경로 | 현재값 | 변경값 | 적용 대상 |
|-----------|--------|--------|----------|
| `palette.error.light/main/dark` | `#ef5350` / `#d32f2f` / `#c62828` | `#DE5B4E` / `#B3261E` / `#7A160F` | `missing_performance` 알림, 삭제/차단 액션 |
| `palette.warning.light/main/dark` | `#ff9800` / `#ed6c02` / `#e65100` | `#C98A2E` / `#8A5A00` / `#5C3C00` | `ending_soon`, `budget_pacing` 알림 |
| `palette.success.light/main/dark` | `#4caf50` / `#2e7d32` / `#1b5e20` | `#4FAE6F` / `#167C3D` / `#0E5A2B` | 진행중 상태 칩 |
| `palette.info.light/main/dark` | `#03a9f4` / `#0288d1` / `#01579b` | `#4FA3B0` / `#0E6B7A` / `#06505C` | 정보성 표시 (필요 시) |
| `typography.headingFontFamily` | `"Outfit"` | `"Outfit Variable"` | 헤더 타이틀 |
| `typography.h1~h6.fontFamily`, `subtitle1/2.fontFamily` | `"Outfit"` | `"Outfit Variable"` | 동일 |
| `typography.h4`, `h5`(KPI·성과 숫자용) | 미설정 | `fontVariantNumeric: 'tabular-nums'` 추가 | KPI 바, Drawer 성과 지표, 카드 예산 표기 |
| `components.MuiChip.styleOverrides.root.borderRadius` | `4` | 변경 없음 (이미 동일) | — |
| `components.MuiDrawer.styleOverrides.paper.width` | 미설정 | `440` | 캠페인 상세/성과 입력 Drawer |
| `components.MuiTableRow.styleOverrides` | 미설정 | hover 시 `rgba(0,0,0,0.03)` 배경 | StoreBreakdown, `/reports` 테이블 |

> `primary.main`, `secondary.main`, `shape.borderRadius`, `shadows`, `spacing` — 모두 이 프로젝트 기본값 유지. 새로 발명한 토큰은 없음 (알림 긴급도 2단계 매핑은 기존 warning/error/grey 토큰의 사용 규칙일 뿐, 값 추가 아님).
