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
| **PerformanceReportTable** | 신규(구현됨, 계획 문서에 없었음) | 캠페인별 성과 지표 표, Dashboard Drawer로 딥링크 |
| FilterBar | 수정 | 기간/매장/플랫폼 선택 |

## Settings (`/settings`, 신규 — API Integration)

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| ConnectionCard | 신규 | 계정별(Meta-GA/Meta-FL/TikTok) 연결 상태 + Connect/재연결 CTA — CustomCard 위에 구성, 상태 Chip(연결됨=success, 끊김=warning) 재활용 |

## 전역 (모든 화면 공통)

| 컴포넌트 | 구분 | 역할 |
|---|---|---|
| AppShell / GNB | 재활용 | 전체 셸, 상단 네비 |
| PageContainer | 재활용 | 반응형 페이지 컨테이너 |
