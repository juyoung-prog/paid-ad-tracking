# 페이드 광고 트래킹 대시보드 — Screen ↔ Component Map

> `/supabase-integration` Phase 0.5(04-data-bridge.md § 매트릭스 컬럼 3)의 입력. 02-ux-flow.md의
> "정보 구조(IA)" + "컴포넌트 리스트"를 화면 단위로 재구성했다. 초기 계획(컴포넌트 리스트 작성 시점)과
> 실제 구현이 갈린 부분은 **실제 구현 기준**으로 적었고, 괄호로 계획 대비 변경 사항을 남겼다.

## Dashboard (`/dashboard`)

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| KpiBar | 재활용 | 헤더 KPI 요약(진행중·예정·종료·미보고), Reports와 공용 |
| AlertBanner | 신규(구현됨) | 고긴급 알림 배너 |
| FilterBar | 수정 | 플랫폼/계정/매장/기간 필터 (좌측 사이드바) |
| Tabs [MUI] | 재활용 | 진행중/예정/종료 상태 탭 |
| StoreBreakdown | 신규(구현됨) | 좌측 매장별 캠페인 분해 |
| **CampaignTable** | 신규(구현됨) | 캠페인 목록 — **계획 대비 변경**: 원래 CampaignCard 그리드였으나, 실제 Influencer Tracking Dashboard 레퍼런스 확인 후 아바타 없는 2줄 리스트(CampaignTable)로 교체 |
| CampaignThumbnail | 재활용 | 목록 행/Drawer 소재 썸네일 (플랫폼색 이니셜 fallback) |
| Drawer [MUI] | 재활용 | 캠페인 상세 패널 |
| CampaignForm | 신규 | Drawer 내 캠페인 필드 편집 |
| PerformanceForm | 신규 | Drawer 내 성과 입력 |
| PacingIndicator | 신규 | 예산 소진 속도 시각화 |
| LastUpdatedBar | 신규 | 최근 갱신 시각 표시 |

## Campaign Register (`/dashboard?new=1`)

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| Dialog [MUI] | 재활용 | 등록 폼 컨테이너 |
| CampaignForm | 신규 | 플랫폼/계정/매장/기간/예산/목표/소재URL/썸네일URL 입력 |
| StoreMultiSelect | 신규 | 단일/복수/전체 매장 타겟 선택 |
| CampaignThumbnail | 재활용 | 썸네일 URL 실시간 미리보기 |

## Campaign Detail Drawer (`/dashboard?campaign={id}`)

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| Drawer [MUI] | 재활용 | 상세 패널 |
| CampaignForm | 신규 | 캠페인 필드 수정 |
| PerformanceForm | 신규 | goal 기반 Tier 1~4 조건부 성과 입력 |
| CampaignThumbnail | 재활용 | 소재 미리보기 + "View Ad" 외부 링크 |

## Stores (`/stores`)

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| **StoreTable** | 신규(구현됨, 계획 문서에 없었음) | 매장 마스터 목록(코드/이름/지역/상태 + 캠페인 수) |
| StoreForm | 신규 | 매장 추가/수정 폼 |

## Reports (`/reports`)

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| KpiBar | 재활용 | 요약 통계 — **계획 대비 변경**: 원래 CampaignSummaryGrid(테두리 박스 그리드)였으나, Dashboard와 같은 개념을 다른 컴포넌트로 보여주는 문제가 있어 KpiBar로 통일. CampaignSummaryGrid는 재사용 후보로 남아있으나 현재 어느 화면에도 연결 안 됨 |
| **PerformanceReportTable** | 신규(구현됨, 계획 문서에 없었음) | 캠페인별 성과 지표 표, Dashboard Drawer로 딥링크. goal별 표는 ReportSummarySection 안에 있고 열 머리로 정렬된다(2026-09) |
| FilterBar | 수정 | 기간/매장/플랫폼 선택 |

## Settings (`/settings`, 신규 — API Integration)

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| ConnectionCard | 신규 | 계정별(Meta-GA/Meta-FL/TikTok) 연결 상태 + Connect/재연결 CTA — CustomCard 위에 구성, 상태 Chip(연결됨=success, 끊김=warning) 재활용 |

## Recap (`/recap`, `/recap/{event}` — 신규, 2026-09)

> 캠페인 종료 후 결과 보고. Reports(진행 확인)와 목적이 달라 별도 메뉴. 1·2·3단계 전부 구현됨(2026-09-06). 2단계는 마이그레이션 20(event_recaps · recap_campaign_notes), 3단계는 recap-draft Edge Function + ANTHROPIC_API_KEY 시크릿이 선행 조건.

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| KpiBar | 재활용 | 머리글 요약 — 캠페인 수 · 지출 · 계획 대비 · 대표 지표(`delta`로 벤치마크 대비) |
| PhaseTimelineChart | 재활용 | 단계 타임라인(읽기 전용, 클릭 없음). buildPhaseTimeline은 Reports와 공유(paidAdsPageUtils) |
| **RecapHeader** | 신규(구현됨) | 머리글 — 이벤트·상태·기간·매장·플랫폼, KpiBar, 순위 한 줄 |
| **RecapCampaignTable** | 신규(구현됨) | 플랫폼별 캠페인 표 — 순위 · 매장 · 캠페인 · 일예산 · 지출 · 판정 · 영상 반응 · 참여 반응 · 행동. PerformanceReportTable과 열 정의 공유 |
| **BenchmarkDelta** | 신규(구현됨) | 비율 지표 옆 "중앙값 대비 · 백분위 · N" 표시, `not enough data` 상태 |
| **VerdictChip** | 신규(구현됨) | good / mid / bad. 자동 제안이면 점선 테두리 |
| **RecapNoteEditor** | 신규(구현됨, 2단계) | 캠페인별 장점·아쉬운 점·이유, 이벤트 배운 점·다음 제언. 언어 탭 |
| **LanguageSwitch** | 신규(구현됨, 3단계) | en / ko / zh-Hant 드롭다운 — URL ?lang= 동기화 |
| **RecapLearningsEditor** | 신규(구현됨, 2단계) | 상태·요약·배운 점 카드·다음 제언 편집 |
| **SignInDialog** | 신규(구현됨, 2단계) | Edit를 눌렀는데 세션이 없을 때만 뜨는 로그인 대화상자 |
| recapSheets (utils) | 신규(구현됨, 3단계) | Google Sheets — 표를 클립보드에 복사하고 sheets.new를 연다(Excel 대신, 사용자 결정) |
| **ExportMenu** | 신규(구현됨, 3단계) | Export 드롭다운 — Google Sheets · PDF(인쇄) |
| **PeerCompareDialog** | 신규(구현됨) | 벤치마크 글자를 누르면 비교군 캠페인을 나란히 — 열 정렬 |
| recap-draft (Edge Function) | 신규(구현됨, 3단계) | Claude로 빈 코멘트·배운 점 초안과 ko/zh-Hant 번역. 로그인 세션만 호출 가능, 결과는 에디터의 빈 칸에만 채운다 |
| Print stylesheet | 신규(구현됨 — PaidAdsShell GlobalStyles, data-print 속성) | `@media print` — 레일·툴바 숨김, 카드 분리 방지 |

## 전역 (모든 화면 공통)

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| AppShell / GNB | 재활용 | 전체 셸, 상단 네비 |
| PageContainer | 재활용 | 반응형 페이지 컨테이너 |
