# Directory Structure (MUST)

파일/컴포넌트 생성 시 반드시 아래 구조를 따른다.

## 프로젝트 디렉토리

```
src/
├── components/          # UI 컴포넌트 (기능 카테고리별 폴더)
│   ├── card/            # 카드 계열
│   ├── container/       # 컨테이너 계열
│   ├── content-transition/ # 콘텐츠 전환
│   ├── data-display/    # 데이터 표시 (Table 등)
│   ├── dynamic-color/   # 동적 색상
│   ├── in-page-navigation/ # 페이지 내 네비게이션 (Tabs 등)
│   ├── input/           # 입력 (Button, TextField, Select 등)
│   ├── kinetic-typography/ # 키네틱 타이포그래피
│   ├── layout/          # 레이아웃 (Grid, Split, AppShell 등)
│   ├── media/           # 미디어 (이미지, 캐러셀 등)
│   ├── motion/          # 모션/전환 효과
│   ├── navigation/      # 내비게이션 (GNB, NavMenu 등)
│   ├── overlay-feedback/ # 오버레이 (Dialog 등)
│   ├── scroll/          # 스크롤 기반 인터랙션
│   ├── templates/       # 페이지 템플릿 (CampaignForm, PerformanceForm, FilterBar 등)
│   ├── typography/      # 타이포그래피
│   └── storybookDocumentation/ # 스토리북 문서 전용 (DocumentTitle, SectionTitle, TreeNode)
├── common/ui/           # 공통 유틸리티 UI (Placeholder, Indicator 등)
├── pages/               # 라우트 진입점 (paidAdsDashboard/)
├── hooks/               # 커스텀 훅 (useSnackbar 등)
├── stories/             # Storybook 전용 (style, overview, page, template)
├── styles/themes/       # 테마 (default.js)
├── utils/               # 유틸리티 함수 (format 등)
├── lib/                 # 외부 서비스 클라이언트 (supabase)
└── data/                # 데이터 파일 (schema.js, 택소노미)
```

## Paid Ads Dashboard 배치

- **화면 조립**: `src/pages/paidAdsDashboard/` — DashboardPage(목록·드로어),
  ReportSummarySection(리포트), SettingsPage, 그리고 그 화면 전용 훅/매퍼
  (usePaidAdsStore, paidAdsMappers, useSyncRuns 등)는 페이지 폴더에 함께 둔다
- **데이터 규칙**: `src/data/schema.js`가 단일 원천 — 지표 계산(calcCPM/calcHookRate 등),
  상태 SSOT, 알림 생성이 전부 여기 있고 컴포넌트는 계산을 직접 만들지 않는다
- **백엔드 연동**: `supabase/functions/`(sync-campaigns, sync-performance)가 플랫폼
  API 수집을 전담 — 지표 필드 매핑은 `docs/paid-ads-dashboard/api-integration/` 문서와
  일치해야 한다

## 파일 배치 규칙

### 컴포넌트

- **컴포넌트 파일**: `src/components/{카테고리}/{ComponentName}.jsx`
- **스토리 파일**: 같은 폴더에 `{ComponentName}.stories.jsx`
- **index.js**: 각 카테고리 폴더에 barrel export 파일 유지
- **커스텀 훅**: 해당 컴포넌트 폴더에 `use{HookName}.js`

### 새 카테고리 추가 시

- 기존 카테고리에 맞는 곳이 없을 때만 `src/components/` 하위에 새 폴더 생성
- 폴더명은 kebab-case 사용

### 공통 UI

- 여러 컴포넌트에서 재사용하는 소형 UI → `src/common/ui/`

### 스토리 전용

- 디자인 토큰 문서화 (색상, 타이포 등) → `src/stories/style/`
- 프로젝트 소개/가이드 → `src/stories/overview/`
