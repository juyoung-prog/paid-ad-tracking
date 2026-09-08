# 페이드 광고 트래킹 대시보드 — UX Flow

## 유저 시나리오

### 시나리오 1: 현황 파악 (가장 빈번 — 하루 여러 번)

- **사용자**: 페이드 광고 실무자 본인
- **목표**: 지금 몇 개의 광고가 어떤 매장/플랫폼/기간/예산으로 돌아가고 있는지 인지적 노력 없이 즉시 파악
- **플로우**:
  1. `/dashboard` 진입
  2. 헤더 KPI 바에서 진행중/예정/종료·미보고 개수를 먼저 확인
  3. 상태 탭(진행중/예정/종료)과 필터(플랫폼/계정/매장/기간)로 원하는 범위로 좁힘
  4. 캠페인 카드 그리드에서 각 광고의 매장·기간·예산·목표를 스캔
  5. 필요 시 카드 클릭 → 상세 Drawer에서 세부 정보 확인
- **성공 조건**: 별도 검색/스크롤 없이 화면 진입 후 5초 이내 "지금 뭐가 돌아가는지" 파악
- **예외 상황**: 캠페인이 없을 때 → Empty 상태로 "광고 등록" CTA 노출

### 시나리오 2: 신규 광고 등록

- **사용자**: 페이드 광고 실무자 본인
- **목표**: 새 캠페인을 시작하기 전, 필요한 정보를 한 번에 구조화해서 입력 (다른 채널에 중복 기록하지 않음)
- **플로우**:
  1. `/dashboard`에서 "광고 등록" 버튼 클릭 → 등록 폼(Dialog) 오픈, URL은 `/dashboard?new=1`
  2. 플랫폼 선택(Meta/TikTok) → 계정 자동 후보 노출 (Meta 선택 시 조지아/플로리다 계정 중 선택, TikTok은 통합 계정 자동 지정)
  3. 타겟 매장 범위 선택: 단일 매장 / 복수 매장 / 전체 매장
     - 단일·복수 선택 시 매장 코드 멀티셀렉트 노출
  4. 이벤트 연관 여부 입력 (선택) — 예: 그랜드 오프닝 이벤트 태그
  5. 기간(시작일~종료일), 예산, 목표 입력
  6. 저장 → 캠페인이 "예정" 또는 "진행중" 상태로 대시보드에 즉시 반영
- **성공 조건**: 폼 저장 한 번으로 대시보드·필터·매장 분해 뷰에 모두 반영, 별도 채널에 재기록 불필요
- **예외 상황**: 종료일이 시작일보다 빠름 → 저장 차단 및 인라인 에러 / 필수값(플랫폼·계정·기간·예산) 누락 시 저장 차단

### 시나리오 3: 알림 대응

- **사용자**: 페이드 광고 실무자 본인
- **목표**: 놓치기 쉬운 상황(종료 임박, 성과 미입력, 중복 타겟팅)을 사전에 인지하고 조치
- **플로우**:
  1. 대시보드 상단 Alert 배너 또는 헤더 알림 아이콘에서 경고 수 확인
  2. 배너 클릭 → 해당 유형의 캠페인만 필터링된 리스트로 이동
  3. 캠페인 카드 클릭 → Drawer에서 원인 확인 (예: 종료 D-3, 성과 미입력)
  4. 조치 수행: 성과 입력 폼으로 이동하거나, 타겟 매장을 조정
- **성공 조건**: 알림을 통해 사용자가 먼저 찾아보지 않아도 놓친 항목을 인지
- **예외 상황**: 조치 완료 시 알림 자동 해제, 조치 없이 하루 경과 시 알림 유지(반복 노출)

### 시나리오 4: 성과 입력 및 보고서 생성

- **사용자**: 페이드 광고 실무자 본인
- **목표**: 광고 종료 후 핵심 지표만 빠르게 입력하고, 보고 시점에 재탐색 없이 바로 내보내기
- **플로우**:
  1. 캠페인 카드(종료 상태) 클릭 → Drawer 오픈
  2. "성과 입력" 탭에서 캠페인의 `goal`에 따라 자동으로 필요한 지표 필드만 노출 (공통 필수 + 영상 지표는 항상, 참여/전환 지표는 목표에 따라 조건부 표시) — 메타/틱톡 기본 화면에서 1회 확인 후 입력
  3. 저장 시 해당 캠페인의 미보고 알림 자동 해제
  4. `/reports`로 이동 → 기간/매장/플랫폼 기준으로 캠페인들을 선택
  5. 요약 통계 확인 후 CSV/이미지로 내보내기
- **성공 조건**: 메타/틱톡을 오가며 전체 데이터를 재다운로드하지 않고, 사전에 정의된 핵심 지표만 기록/보고
- **예외 상황**: 성과 미입력 상태로 종료일이 지나면 시나리오 3의 알림 트리거

### 시나리오 5: 매장 마스터 관리

- **사용자**: 페이드 광고 실무자 본인 (매장 확장 시)
- **목표**: 신규 매장이 오픈하면 매장 코드를 등록해 캠페인 타겟 선택 목록에 반영
- **플로우**:
  1. `/stores` 이동
  2. "매장 추가" → 코드(예: G11), 이름, 지역(GA/FL), 상태(예정/운영중) 입력
  3. 저장 → 캠페인 등록 폼의 매장 선택 목록에 즉시 반영
- **성공 조건**: 매장 추가가 캠페인 등록 플로우를 막지 않고 즉시 반영
- **예외 상황**: 중복 코드 입력 시 저장 차단 및 인라인 에러

### 시나리오 6: 플랫폼 계정 연결 (신규 — API Integration)

- **사용자**: 페이드 광고 실무자 본인
- **목표**: Meta/TikTok 광고 계정을 연결해 캠페인·성과 데이터가 자동으로 채워지게 함(수동 입력 부담 감소)
- **플로우**:
  1. Settings(신규 영역)에서 "Connect Meta Account" 클릭
  2. Meta 로그인/권한 동의 화면으로 이동 (백엔드 Edge Function이 OAuth 대행)
  3. 동의 완료 → Settings로 복귀, 계정별 연결 상태(연결됨/안 됨) 표시
  4. 이후 캠페인 목록·성과 데이터가 자동 동기화(백그라운드), 필요 시 "Sync now"로 즉시 갱신
- **성공 조건**: 연결 후 별도 조작 없이 캠페인/성과가 채워짐. 토큰은 항상 서버에만 존재 — 프론트는 연결 상태만 앎
- **예외 상황**: 토큰 만료/재인증 필요 시 "연결 끊김" 상태 표시 + 재연결 CTA. 연결 안 된 계정의 캠페인은 시나리오 2(수동 등록)로 계속 지원

### 시나리오 7: 캠페인 종료 후 결과 보고 (신규 — Recap, 2026-09)

- **사용자**: 페이드 광고 실무자 본인(작성), 상사/경영진(읽기 전용)
- **목표**: 이벤트(예: G10 Opening)가 끝나면 보고용 문서를 대시보드 안에서 만든다. 숫자는 동기화 데이터로 자동, 사람은 판정·장점·아쉬운 점·배운 점만 쓴다. Reports는 "지금 어떻게 되고 있나"(진행 확인)이고 Recap은 "끝났으니 무엇을 배웠나"(보고)다 — 목적이 달라 별도 메뉴로 둔다
- **플로우**:
  1. 레일에서 `Recap` 진입 → 이벤트 목록(최근 종료 순, 보고서 상태 Draft/Final 표시)
  2. 이벤트 클릭 → `/recap/{event}`: 머리글(이벤트·기간·매장·플랫폼·계획 예산 대비 지출), 단계 타임라인, **플랫폼별 캠페인 표**(순위·매장·캠페인·일예산·지출·판정·영상 반응·참여 반응·행동)
  3. 표의 비율 지표(CPM·CTR·Hook·Hold·참여율·참여당 비용·CPC)마다 **벤치마크** — 같은 플랫폼·같은 목표(같은 단계 우선)의 다른 이벤트 캠페인 중앙값 대비 차이와 백분위(예: `Hook 23% · median 18% · top 25%`). 머리글에 "역대 오프닝 중 CPM 2위" 같은 순위 한 줄
  4. 판정(good / mid / bad)은 백분위로 자동 제안(상위 30% good, 하위 30% bad)하고 사람이 바꾼다
  5. 캠페인마다 장점·아쉬운 점·이유, 이벤트마다 배운 점·다음 제언을 쓴다 → 저장(**2단계**, 로그인 필요)
  6. 인쇄/PDF(브라우저 인쇄, 1단계) 또는 Excel(3단계)로 내보내거나 링크를 그대로 보낸다 — 읽기는 로그인 없이 열린다
- **성공 조건**: 이벤트 종료 후 대시보드 밖에서 보고서를 다시 만들지 않는다. 읽는 사람이 숫자를 몰라도 벤치마크로 잘 됐는지 안다
- **예외 상황**: 비교군이 3개 미만이면 벤치마크 자리에 `not enough data`. 동기화 안 된(직접 등록) 캠페인은 지표가 비어 있으면 표에 `—`. 2023년 이전 캠페인은 지표가 거의 없어 비교군에서 제외
- **단계**: 1단계 숫자·벤치마크·인쇄(DB 변경 없음) → 2단계 코멘트·배운 점 저장(새 테이블 2개, 로그인 게이트) → 3단계 Excel, 한국어·번체중문, AI 초안/번역, 오가닉(계정 전체) 지표 선택 입력. **세 단계 모두 구현됨(2026-09-06)** — 2단계는 마이그레이션 20 적용, 3단계 AI는 recap-draft Edge Function 배포 + ANTHROPIC_API_KEY 시크릿이 선행 조건
- **다국어 전제**: 화면 문자열은 언어별 문자열 표(영어만 채운 채 시작), 사람이 쓰는 문장은 `{ en, ko, zh-Hant }` 칸. Recap에만 적용

---

## UX 플로우

```mermaid
flowchart TD
    A[진입: /dashboard] --> B[헤더 KPI 바 확인]
    B --> C{다음 행동}
    C -->|현황만 확인| D[필터/상태탭으로 범위 좁힘]
    D --> D1[캠페인 카드 그리드 스캔]
    D1 --> D2[카드 클릭 → 상세 Drawer]

    C -->|신규 광고 등록| E[등록 폼 오픈 /dashboard?new=1]
    E --> E1[플랫폼/계정/매장범위 선택]
    E1 --> E2[기간·예산·목표 입력]
    E2 --> E3[저장 → 대시보드 반영]

    C -->|알림 확인| F[Alert 배너/알림 아이콘]
    F --> F1[해당 유형 필터링]
    F1 --> F2[Drawer에서 원인 확인]
    F2 --> F3{조치}
    F3 -->|성과 입력 필요| G
    F3 -->|타겟 조정| E1

    D2 --> G[성과 입력 탭]
    G --> G1[핵심 지표 입력·저장]
    G1 --> H[/reports 이동]
    H --> H1[기간/매장/플랫폼 선택]
    H1 --> H2[내보내기 CSV/이미지]

    C -->|매장 관리| I[/stores 이동]
    I --> I1[매장 추가/수정]
    I1 --> E1

    C -->|이벤트 종료 후 보고| J[/recap 이벤트 목록]
    J --> J1[/recap/:event — 숫자·벤치마크 자동]
    J1 --> J2[판정·코멘트·배운 점 작성 — 로그인]
    J2 --> J3[인쇄/PDF · Excel · 링크 공유]
```

### UX-flow 단계별 서사

> `/supabase-integration` 04-data-bridge.md § 2 입력. 각 시나리오에서 실제로 DB가 바뀌는
> 단계만 뽑는다. **Alert는 별도 insert/update가 없다** — `alerts` 테이블에 쓰지 않고
> `campaigns`/`performance_records`를 읽어 매번 재계산한다(schema.js `generateAlerts()`,
> DashboardPage.jsx 주석 "알림은 저장된 값이 아니라 매번 다시 계산된다" 참고). 아래 서사에도
> 이 원칙을 그대로 반영했다.

#### 시나리오 1. 현황 파악

- **`/dashboard` 진입** → `campaigns`/`performance_records` read (KPI 집계), Alert는 read된 값으로 그 자리에서 재계산(쓰기 없음)
- **필터/상태탭 조작** → 추가 DB 동작 없음(클라이언트 사이드 필터링)
- **카드 클릭 → Drawer** → 해당 `campaigns` row 1건 read

#### 시나리오 2. 신규 광고 등록

- **플랫폼/계정 선택** → `ad_accounts` read (선택지 노출용)
- **매장 범위 선택** → `stores` read (선택지 노출용)
- **저장** → `campaigns` insert (1 row)

#### 시나리오 3. 알림 대응

- **배너/아이콘 확인 → 필터링 → Drawer** → read만 (위 원칙대로 alerts 쓰기 없음)
- **조치: 타겟 조정** → `campaigns` update
- **조치: 성과 입력 필요** → 시나리오 4로 이동
- **조치 완료 인지** → 별도 update 없음. `performance_records.reported_at`이 채워지거나 캠페인 상태가 바뀌면 다음 조회 때 해당 알림이 재계산 결과에서 자연히 빠짐

#### 시나리오 4. 성과 입력 및 보고서 생성

- **Drawer "성과 입력" 탭 저장** → `performance_records` insert (`source='manual'`, `reported_at`에 오늘 날짜)
- **`/reports` 이동 → 필터** → `campaigns`/`performance_records` read
- **내보내기(CSV/이미지)** → DB 동작 없음(클라이언트 사이드 생성)

#### 시나리오 5. 매장 마스터 관리

- **`/stores` 이동** → `stores` read
- **매장 추가/수정 저장** → `stores` insert 또는 update

#### 시나리오 6. 플랫폼 계정 연결 (신규)

- **"Connect Meta/TikTok Account" 클릭** → DB 동작 없음(Edge Function이 OAuth 대행)
- **OAuth 콜백 완료** → `connections` insert/upsert (access_token 등, Edge Function의 service_role만 write — 프론트는 직접 쓰지 않음)
- **Settings 화면 표시** → `connections_public`(토큰 제외 view) read
- **자동/수동 동기화("Sync now")** → `sync-campaigns` Edge Function이 `campaigns` upsert(`external_campaign_id` 기준), `sync-performance`가 `performance_records` insert(`source='api'`)

#### 시나리오 7. 캠페인 종료 후 결과 보고 (신규 — Recap)

- **`/recap` 이벤트 목록** → `campaigns` read(campaign_group으로 묶음), `event_recaps` read(보고서 상태)
- **`/recap/{event}` 진입** → `campaigns`/`performance_records`/`performance_daily`/`plans` read. 벤치마크는 같은 read 결과로 그 자리에서 계산(저장 없음 — Alert와 같은 원칙)
- **판정·코멘트 저장(2단계)** → `event_recaps` insert/update(이벤트 1행), `recap_campaign_notes` upsert(캠페인마다 1행). 로그인 사용자만 write
- **인쇄/PDF·Excel·링크 공유** → DB 동작 없음(클라이언트 사이드). 읽기는 anon read 정책으로 공개

## 정보 구조 (IA)

```
Paid Ads Dashboard
├── /dashboard (메인 — 기본 진입점)
│   ├── 헤더 (sticky)
│   │   ├── KpiBar — 진행중 N · 예정 N · 종료 N · 미보고 N
│   │   ├── 알림 아이콘 (경고 수 뱃지)
│   │   └── "광고 등록" 버튼
│   ├── AlertBanner (경고 있을 때만 노출)
│   ├── FilterBar — 플랫폼 / 계정 / 매장 / 기간
│   ├── 상태 탭 — 진행중 / 예정 / 종료
│   ├── StoreBreakdown — 매장별 캠페인 목록 (예산 분배 없음, 아래 데이터 모델 참고)
│   └── 캠페인 카드 그리드
│       └── 카드 클릭 → 상세 Drawer (개요 / 성과 입력 탭)
├── /dashboard?new=1 — 캠페인 등록 폼 (Dialog, 딥링크 가능)
├── /stores — 매장 마스터 관리
│   └── 매장 리스트 + 추가/수정 폼
├── /reports — 성과 보고서
│   ├── 기간 · 매장 · 플랫폼 선택
│   ├── 요약 통계 (StoreBreakdown/CampaignSummaryGrid 계열 재사용)
│   └── 내보내기 (CSV/이미지)
├── /settings (신규 — API Integration) — 플랫폼 계정 연결 관리
│   └── 계정별(Meta-GA/Meta-FL/TikTok) 연결 상태 + Connect/재연결 CTA
└── /recap (신규 — 2026-09) — 캠페인 종료 후 결과 보고
    ├── 이벤트 목록 (최근 종료 순, Draft/Final 상태)
    └── /recap/:event — 이벤트 하나의 보고서
        ├── 머리글 — 이벤트 · 기간 · 매장 · 플랫폼 · 계획 예산 대비 지출 · 역대 순위 한 줄
        ├── 단계 타임라인 (PhaseTimelineChart 재활용)
        ├── 플랫폼별 캠페인 표 — 순위 · 매장 · 캠페인 · 일예산 · 지출 · 판정 · 영상 반응 · 참여 반응 · 행동 (각 비율 지표에 벤치마크)
        │   └── 숫자 줄 클릭(어디든) → 캠페인 상세 Drawer(Performance와 같은 CampaignDetailPanel) — 성과 · 예산 페이싱 · Campaign insights(What worked · Could improve · Why · Next action, 사람 글 우선, 없으면 데이터 해석) · 일별 지출. 타임라인 행 클릭은 그 줄로 스크롤 + 선택 표시만
        ├── 배운 점 · 다음 제언 (2단계, 언어별)
        └── 내보내기 — 인쇄/PDF(1단계) · Excel(3단계) · 언어 전환(3단계)
```

> 캠페인 상세·성과 입력은 별도 페이지 없이 Drawer로 처리 (Influencer Tracking Dashboard와 동일한 패턴 — 운영 툴은 페이지 전환보다 즉시 열람이 우선).

### 페이지 리스트

> `/supabase-integration` 04-data-bridge.md § 3 입력. 페이지명은 아래 표와 글자 단위로
> 일치해야 한다.

| 페이지명 | 경로 | 다루는 데이터 (R/W) |
|---|---|---|
| Dashboard | `/dashboard` | Campaign(R), PerformanceRecord(R, 집계), Store(R, 필터), AdAccount(R, 필터) — Alert는 저장 없이 재계산 |
| Campaign Register | `/dashboard?new=1` | Campaign(W, insert), Store(R), AdAccount(R) |
| Campaign Detail Drawer | `/dashboard?campaign={id}` | Campaign(R/W, update), PerformanceRecord(R/W, insert) |
| Stores | `/stores` | Store(R/W, insert·update) |
| Reports | `/reports` | Campaign(R), PerformanceRecord(R) |
| Settings (신규) | `/settings` | Connection(R, `connections_public` view만 — 토큰 필드는 프론트에 노출 안 함) |
| Recap (신규 — 2026-09) | `/recap` | Campaign(R, 이벤트 묶음), EventRecap(R, 상태) |
| Recap Detail (신규 — 2026-09) | `/recap/{event}` | Campaign(R), PerformanceRecord(R), PerformanceDaily(R), Plan(R), EventRecap(R/W), RecapCampaignNote(R/W) — 벤치마크는 저장 없이 계산 |

### 라우팅 설계

| 경로 | 설명 |
|------|------|
| `/` | `/dashboard` 리다이렉트 |
| `/dashboard` | 메인 현황 대시보드 |
| `/dashboard?platform=meta&account=ga&store=G01&status=active` | 필터 상태 URL 유지 |
| `/dashboard?tab=ended` | 상태 탭 딥링크 |
| `/dashboard?campaign={id}` | 특정 캠페인 Drawer 오픈 상태로 진입 |
| `/dashboard?new=1` | 캠페인 등록 Dialog 오픈 상태로 진입 |
| `/stores` | 매장 마스터 관리 |
| `/reports` | 성과 보고서 뷰/내보내기 |
| `/reports?from=2026-01-01&to=2026-03-31&store=G01` | 보고서 필터 상태 URL 유지 |
| `/settings` | 플랫폼 계정 연결 관리 (신규 — API Integration) |
| `/recap` | 이벤트별 결과 보고 목록 (신규 — 2026-09) |
| `/recap/{event}` | 이벤트 하나의 보고서. `{event}`는 `campaigns.campaign_group` 값(URL 인코딩) |
| `/recap/{event}?lang=ko` | 보고서 언어 전환 (3단계 — en 기본, ko / zh-Hant) |

## 데이터 모델

### 데이터 모델 활용

> `/supabase-integration` 스킬(04-data-bridge.md)의 입력이 되는 사전. 아래 "핵심 엔티티" 표를
> 그대로 근거로 하되, 테이블명 형식(snake_case, 복수형)만 확정한다. 이름은 SQL 예약어/흔한
> 충돌 단어와 대조해 안전함을 확인했다 (`sql-reserved-words.md` 기준).

| 데이터명 | 예상 테이블명 | 설명 (1줄) |
|---|---|---|
| Store | `stores` | 매장 마스터 (조지아/플로리다 매장 코드·지역·운영 상태) |
| AdAccount | `ad_accounts` | 플랫폼별 광고 계정 (Meta는 조지아/플로리다 분리, TikTok은 통합) |
| Campaign | `campaigns` | 캠페인/광고. 타겟 매장·기간·예산·목표를 갖는 핵심 엔티티 |
| PerformanceRecord | `performance_records` | 캠페인별 성과 지표 (수동 입력 또는 API 자동 수집) |
| Alert | `alerts` | 종료 임박/성과 미입력/중복 타겟팅 등 경고 |
| Connection | `connections` | Meta/TikTok OAuth 연결 상태 — 서버 전용, RLS로 본인 행만 조회 |
| User | `auth.users` (Supabase 내장) | 로그인 사용자. 1인 운영 기준이며 모든 테이블의 `owner_id`가 참조 |
| EventRecap (신규 — 2026-09) | `event_recaps` | 이벤트 하나의 결과 보고서 — 상태(draft/final), 배운 점·다음 제언(언어별). 2단계에서 생성 |
| RecapCampaignNote (신규 — 2026-09) | `recap_campaign_notes` | 보고서 안 캠페인 하나의 판정과 코멘트(장점·아쉬운 점·이유, 언어별) + 선택 입력 오가닉 지표. 2단계에서 생성 |

### 핵심 엔티티

| 엔티티 | 주요 필드 | 관계 |
|--------|----------|------|
| Store (매장) | id, name, region, status | Campaign.targetStoreIds가 참조 |
| AdAccount (광고 계정) | id, platform, region, label | Campaign.accountId가 참조 |
| Campaign (캠페인/광고) | id, name, platform, accountId, targetScope, targetStoreIds, dateRange, budgetPlanned, goal, status, tags | Store·AdAccount 참조, PerformanceRecord·Alert의 부모 |
| PerformanceRecord (성과 기록) | id, campaignId, recordedAt, 지표들 | Campaign 1:1 (또는 1:N 스냅샷) |
| Alert (알림) | id, campaignId, type, triggeredAt, resolvedAt | Campaign 참조 |
| Connection (플랫폼 연결, 신규 — API Integration) | id, platform, accountId, accessToken(암호화), refreshToken, expiresAt, connectedAt | AdAccount 참조. **서버 전용** — RLS로 본인 행만 조회, 프론트에는 연결 상태(boolean)만 노출 |
| EventRecap (결과 보고서, 신규 — 2026-09) | id, eventName, status, summary(언어별), learnings(언어별 목록), nextSteps(언어별), createdAt, updatedAt | eventName = Campaign.campaignGroup. RecapCampaignNote의 부모. 읽기는 anon 공개, 쓰기는 로그인 |
| RecapCampaignNote (캠페인 코멘트, 신규 — 2026-09) | id, recapId, campaignId, verdict, strength(언어별), weakness(언어별), reason(언어별), organicViews, organicEngagements | EventRecap·Campaign 참조. 캠페인당 1행 |

> Connection은 05-api-integration.md의 Supabase 연동을 위해 추가된 엔티티다. `/supabase-integration`이 이 섹션을 입력으로 읽으므로, 아래 필드 추가 사항과 함께 반드시 여기 반영한다.

### API 연동을 위한 필드 추가 (05-api-integration.md 연계)

| 대상 | 추가 필드 | 용도 |
|------|----------|------|
| AdAccount | externalAccountId | Meta `ad_account_id` / TikTok `advertiser_id` 매핑 |
| Campaign | externalCampaignId (string \| null) | 플랫폼 캠페인 ID. `null`이면 API로 안 들어온 수동 등록 캠페인 |
| PerformanceRecord | source (`'manual'` \| `'api'`) | 수동 입력 vs API 자동 수집 구분. API 값이 있으면 기본으로 쓰되 사용자가 override 가능 |

### 필드 포맷 상세

#### Store

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| id | string | 매장 코드, PK | 조지아 `G` + 2자리, 플로리다 `BF` + 1자리 | `"G01"`, `"BF1"` |
| name | string | free text | 매장명 | `"Georgia - Duluth"` |
| region | enum | `GA` \| `FL` | 지역 구분 | `"GA"` |
| status | enum | `active` \| `planned` \| `closed` | 운영 상태 | `"active"` |
| createdAt | string | ISO 8601 datetime | 등록 시각 | `"2026-07-20T09:00:00Z"` |

#### AdAccount

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| id | string | slug, PK | 플랫폼+지역 조합 슬러그 | `"meta-ga"`, `"meta-fl"`, `"tiktok-unified"` |
| platform | enum | `meta` \| `tiktok` | 광고 플랫폼 | `"meta"` |
| region | enum | `GA` \| `FL` \| `ALL` | 계정이 커버하는 지역 (틱톡은 `ALL`) | `"GA"` |
| label | string | free text | UI 표시명 | `"Meta - Georgia"` |

#### Campaign

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| id | string | UUID v4, PK | 캠페인 고유 ID | `"c4e1f6b0-..."` |
| name | string | free text, 1~100자 | 캠페인명 | `"Morrow Grand Opening Awareness"` |
| platform | enum | `meta` \| `tiktok` | — | `"meta"` |
| accountId | string | FK → AdAccount.id | — | `"meta-ga"` |
| targetScope | enum | `single_store` \| `multi_store` \| `all_stores` | 타겟 범위 | `"single_store"` |
| targetStoreIds | string[] | Store.id 배열, `all_stores`면 빈 배열 | 타겟 매장 | `["G11"]` |
| eventTag | string \| null | kebab-case slug | 연관 이벤트(그랜드 오프닝 등) | `"morrow-grand-opening"` |
| startDate | string | ISO 8601 date (`YYYY-MM-DD`) | 시작일 | `"2026-08-01"` |
| endDate | string | ISO 8601 date (`YYYY-MM-DD`), startDate 이후 | 종료일 | `"2026-08-31"` |
| budgetPlanned | number | USD, 소수점 2자리 | 계획 예산 | `1500.00` |
| goal | enum | `awareness` \| `traffic` \| `engagement` \| `conversion` \| `store_visit` | 광고 목표 | `"awareness"` |
| status | enum | `planned` \| `active` \| `ended` (계산 필드) | `startDate`/`endDate`와 오늘 날짜로 자동 계산 — 저장하지 않음 | `"active"` |
| manualStatus | enum \| null | `ended_early` \| `archived` \| `null` | 유일한 수동 override. 값이 있으면 `status` 계산 결과보다 무조건 우선 — "active로 강제 변경" 같은 날짜와 모순되는 상태는 애초에 만들 수 없음 | `null` |
| tags | string[] | kebab-case, 자유 태그 | 검색/분류용 태그 | `["grand-opening", "promo"]` |
| creativeUrl | string \| null | URL, `https://`로 시작 | Ads Manager 소재/캠페인 링크 | `"https://business.facebook.com/adsmanager/..."` |
| notes | string \| null | free text | 비고 | `"인플루언서 협업 소재 재사용"` |
| createdAt / updatedAt | string | ISO 8601 datetime | — | `"2026-07-20T09:00:00Z"` |

> **매장 귀속(attribution) 규칙**: `targetScope`가 `multi_store`/`all_stores`인 캠페인은 매장별로 예산/성과를 분배하지 않는다. `StoreBreakdown`은 각 매장에 "이 캠페인이 걸려 있다"는 사실만 표시하고, 금액은 캠페인 단위로만 집계한다 (숫자를 인위적으로 쪼개서 부정확해지는 것을 방지).
>
> **status SSOT 규칙**: `effectiveStatus = manualStatus ?? computedStatus(startDate, endDate, today)`. 자동 계산이 기본값이고, `manualStatus`(조기종료/보관)가 설정된 경우에만 그 값이 이긴다. 그 외의 수동 상태 변경(예: 날짜가 안 끝났는데 강제로 "종료"로 바꾸는 것 이외의 임의 조작)은 지원하지 않는다.

#### PerformanceRecord

성과 지표는 **raw 필드만 저장**하고 CPM/CTR/CPC/Hook Rate/Hold Rate/Engagement Rate/CPA는 모두 계산 필드로 처리한다 (중복 저장 방지). 입력 폼은 Campaign의 `goal`에 따라 Tier 3/4 필드를 조건부로 노출해 "뭘 입력해야 하는지" 고민을 없앤다.

**Tier 1 — 공통 필수 (모든 캠페인)**

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| impressions | number \| null | 정수 | 노출수 | `120000` |
| reach | number \| null | 정수 | 도달수 | `85000` |
| clicks | number \| null | 정수 | 링크 클릭수 | `1400` |
| spend | number | USD, 소수점 2자리 | 실집행 예산 | `1487.32` |

**Tier 2 — 영상 지표 (기본 노출, 훅/홀드레이트 계산용)**

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| hookViews | number \| null | 정수 | 3초/2초 조회수 — Meta "3-Sec Video Plays" / TikTok "2-Sec Video Views" | `42000` |
| heldViews | number \| null | 정수 | 완전시청수 — Meta ThruPlays 또는 95%+ / TikTok Video Views 100% | `9800` |

**Tier 3 — `goal = engagement`일 때만**

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| engagements | number \| null | 정수 | 좋아요+댓글+공유+저장 합계 | `3200` |

**Tier 4 — `goal = conversion` \| `store_visit`일 때만**

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| conversions | number \| null | 정수 | Meta "Results" / TikTok "Conversions" | `62` |

**공통 메타 필드**

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| id | string | UUID v4, PK | — | `"a1b2..."` |
| campaignId | string | FK → Campaign.id | — | `"c4e1f6b0-..."` |
| recordedAt | string | ISO 8601 date | 입력 시점 | `"2026-09-02"` |
| resultUrl | string \| null | URL | 리포트/스크린샷 링크 | `"https://drive.google.com/..."` |
| reportedAt | string \| null | ISO 8601 date | 보고 완료 일자 (null이면 미보고 → 알림 트리거) | `"2026-09-03"` |

**계산 필드 (저장 안 함)**

| 계산 필드 | 계산식 |
|---|---|
| CPM | `spend ÷ impressions × 1000` |
| CTR | `clicks ÷ impressions` |
| CPC | `spend ÷ clicks` |
| Hook Rate | `hookViews ÷ impressions` |
| Hold Rate | `heldViews ÷ hookViews` |
| Engagement Rate | `engagements ÷ impressions` |
| CPA (Cost per Result) | `spend ÷ conversions` |

#### EventRecap (신규 — 2026-09, 2단계)

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| id | string | UUID v4, PK | — | `"r-01"` |
| eventName | string | `campaigns.campaign_group`과 같은 값, owner 안에서 unique | 어느 이벤트의 보고서인가 | `"G10 Opening"` |
| status | enum | `draft` \| `final` | 목록에서 표시. final이면 편집 전 확인 | `"draft"` |
| summary | LocalizedText | `{ en, ko, zh-Hant }` (ko/zh-Hant는 null 가능) | 머리글 아래 한 단락 | `{ en: "Grand Opening drove ..." }` |
| learnings | LocalizedText[] | 항목마다 `{ title, body }`의 언어별 칸 | "배운 점" 카드 목록(이전 보고서의 4개 카드) | — |
| nextSteps | LocalizedText | 언어별 | 다음 캠페인 제언 | — |
| createdAt / updatedAt | string | ISO 8601 datetime | — | — |

> **LocalizedText**: `{ en: string, ko: string \| null, "zh-Hant": string \| null }`. 영어는 필수, 나머지는 3단계에서 채운다. 화면은 요청 언어가 비어 있으면 영어로 대체하고 "(English)" 표시를 붙인다.

#### RecapCampaignNote (신규 — 2026-09, 2단계)

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| id | string | UUID v4, PK | — | — |
| recapId | string | FK → EventRecap.id | — | — |
| campaignId | string | FK → Campaign.id, (recapId, campaignId) unique | 캠페인당 1행 | — |
| verdict | enum \| null | `good` \| `mid` \| `bad` | 예산 효율 판정. null이면 벤치마크 백분위로 자동 제안한 값을 보여준다 | `"good"` |
| strength / weakness / reason | LocalizedText | 언어별 | 이전 보고서의 장점 · 아쉬운 점 · 이유 | — |
| organicViews / organicEngagements | number \| null | 정수 | 계정 전체(오가닉) 조회·참여 — 광고 API에 없어 선택 입력(3단계) | `100250` |

#### Recap 벤치마크 (계산 전용 — 저장 안 함)

| 항목 | 정의 |
|---|---|
| 비교군 | 같은 `platform` + 같은 `goal` + 같은 단계 이름(buildPhaseTimeline이 캠페인명에서 뽑는 "Grand Opening" 등)의 **다른 이벤트** 캠페인. 3개 미만이면 같은 platform + 같은 goal(다른 이벤트)로, 그래도 3개 미만이면 벤치마크·순위를 만들지 않는다(`not enough data`). 목표가 먼저인 이유: 결과당 비용은 목표가 같아야 비교가 성립한다(2026-09-07) |
| 종합 등급 | **없다**(2026-09-08 제품 결정). 회사 KPI 기준값이 없고, 과거 비교로 Strong/Average/Weak를 만들지 않는다. 표의 열은 서로 다른 질문 하나씩이다: Goal(무엇을 하려 했나) · Primary KPI(실제 대표 결과) · vs target(명시된 목표를 맞췄나) · vs past(비슷한 과거와 비교하면) · Video/Engagement/Action response(설명이 되는 보조 신호) |
| 목표치(vs target) | 캠페인에 명시적으로 설정된 목표치(`kpiTarget`)와 Primary KPI의 비교만 — "↓ 20% vs target $3.00". 없으면 "—"(툴팁 Not set) — 과거 중앙값·사분위·플랫폼 기준·추정치·고정 문턱으로 대신하지 않는다. 플랫폼 표의 캠페인 중 하나도 목표치가 없으면 열을 숨기고 폭을 나눠 준다(표시 층만) |
| Primary KPI | 목표가 정하는 **실제 대표 결과**(`budgetEfficiency`): 인지 CPM · 트래픽 CPC · 참여 Cost/eng = 지출 ÷ 좋아요+댓글+공유 · 전환/매장 방문 CPA. 라벨 + 현재 값만 — Strong/Good/Efficient 같은 판단어는 붙이지 않는다(2026-09-08) |
| 대상 지표 | CPM · CTR · CPC · Hook Rate · Hold Rate · Engagement Rate — 비율만. Reach·조회수 같은 절대값은 예산·기간에 묶여 비교 불가 |
| 통계 | 중앙값(median) + 이번 캠페인의 백분위(낮을수록 좋은 CPM·CPC는 뒤집어 계산) + 비교군 수 N |
| 강점 · 개선점 · 이유 | 표에는 없다. 캠페인 드로어의 Campaign insights(`buildCampaignInsight`)가 과거 비교군 순위라는 명시된 근거로만 말한다("Strongest reach in its peer group — CPM best of 12 among comparable Meta awareness campaigns"). 원인(소재·타깃·메시지)은 추정하지 않고, 근거가 없으면 "Not enough evidence". 사람이 Edit에서 쓴 문장은 시트에 남는다 |
| 기간 | 2024년 이후 캠페인만(2023년 이전은 지표가 거의 없음). 지역 필터(같은 GA/FL만) 전환 가능 |
| 원칙 | Meta와 TikTok을 섞지 않는다(Hook 정의가 다르다). 평균이 아니라 중앙값 — 하나 터진 캠페인이 기준을 끌어올리지 않게 |

#### Alert

| 필드 | 타입 | 포맷 | 설명 | 예시 |
|------|------|------|------|------|
| id | string | UUID v4, PK | — | `"al-01"` |
| campaignId | string | FK → Campaign.id | — | `"c4e1f6b0-..."` |
| type | enum | `ending_soon` \| `missing_performance` \| `budget_pacing` \| `overlap_target` \| `new_store_reminder` | 알림 유형 | `"ending_soon"` |
| triggeredAt | string | ISO 8601 datetime | 발생 시각 | `"2026-08-28T00:00:00Z"` |
| resolvedAt | string \| null | ISO 8601 datetime | 해제 시각 (null이면 활성) | `null` |
| message | string | free text | 표시 문구 | `"D-3 — Morrow Grand Opening Awareness 종료 임박"` |

> **`overlap_target` 트리거 조건 (알림 피로 방지)**: 같은 `platform` + 타겟 매장 교집합 존재 + 같은 `goal` + 기간이 겹칠 때만 발생. 플랫폼이 다르거나 goal이 다르면 의도된 멀티채널/퍼널 전략일 가능성이 높으므로 알림을 띄우지 않는다 (정상 운영을 경고로 오탐하는 것을 방지).

## 컴포넌트 리스트

기존 디자인 시스템(이 프로젝트 `components.md`) 재사용을 우선하고, 부족한 부분은 Influencer Tracking Dashboard 컴포넌트를 `component-work` 워크플로우로 이식한다.

| 컴포넌트 | 용도 | 구분 | 기존 경로 / 비고 |
|----------|------|------|-----------------|
| AppShell | 전체 레이아웃 셸 (헤더 + 메인) | 재활용 | `components/layout/AppShell.jsx` |
| PageContainer | 반응형 페이지 컨테이너 | 재활용 | `components/layout/PageContainer.jsx` |
| StickyAsideCenterLayout | 좌측 보조 패널(필터/StoreBreakdown) + 중앙 캠페인 그리드 | 재활용 | `components/layout/StickyAsideCenterLayout.jsx` |
| Tabs [MUI] | 진행중/예정/종료 상태 탭 | 재활용 | MUI Tabs |
| Table [MUI] | 매장별/보고서 표 | 재활용 | MUI Table |
| Select, TextField, Checkbox, Button, Chip [MUI] | 폼 입력 요소 전반 | 재활용 | MUI 컴포넌트 |
| Dialog, Drawer [MUI] | 캠페인 등록 폼, 캠페인 상세 패널 | 재활용 | MUI 직접 사용 (커스텀 래핑 불필요) |
| CardContainer / CustomCard | 캠페인 카드 기본 틀 | 수정 | `components/card/CustomCard.jsx` — 상태 뱃지·매장 chip 등 콘텐츠 구성만 추가 |
| FilterBar | 플랫폼/계정/매장/기간 필터 | 수정 | `components/templates/FilterBar.jsx` — 광고 도메인 옵션 세트로 교체 (Influencer Tracking `InfluencerFilterBar.jsx` 옵션 구성 패턴 참고) |
| KpiBar | 헤더 KPI 요약 (진행중·예정·종료·미보고) | 신규 | 카테고리: data-display — Influencer Tracking `KpiBar.jsx` 구조 이식 |
| StoreBreakdown | 매장별 캠페인 목록 (예산 분배 없음, 캠페인 단위 금액만 표시) | 신규 | 카테고리: data-display — Influencer Tracking `StoreBreakdown.jsx` 구조 참고, 금액 분배 로직은 제거 |
| CampaignSummaryGrid | `/reports` 요약 스탯 카드 그리드 | 신규 | 카테고리: data-display — Influencer Tracking `CampaignSummaryGrid.jsx` 이식 |
| CampaignCard | 캠페인 요약 카드 콘텐츠 (플랫폼·계정·매장·기간·예산·상태) | 신규 | 카테고리: card — CustomCard 위에 구성, 상태 아이콘은 Influencer Tracking `StatusIconRow.jsx` 패턴 참고 |
| AlertBanner | 종료 임박/성과 미입력/중복 타겟팅 경고 배너 | 신규 | 카테고리: data-display — Influencer Tracking Alert 배너 패턴 이식 |
| LastUpdatedBar | 캠페인/성과 최근 입력 시각 표시 | 신규 | 카테고리: layout — Influencer Tracking `SyncStatusBar.jsx` 이식(자동 동기화 대신 "최근 수정" 의미로 재해석) |
| StoreMultiSelect | 단일/복수/전체 매장 타겟 선택기 | 신규 | 카테고리: input |
| CampaignForm | 캠페인 등록/수정 폼 | 신규 | 카테고리: templates |
| PerformanceForm | 성과 지표 입력 폼 (goal 기반 Tier 1/2 기본 노출, Tier 3/4 조건부 노출) | 신규 | 카테고리: templates |
| PacingIndicator | 예산 소진 속도(pacing) 시각화 | 신규 | 카테고리: data-display |
| CampaignThumbnail | 캠페인 소재 썸네일 (플랫폼색 이니셜 fallback) | 재활용 | `components/media/CampaignThumbnail.jsx` — 이미 구현됨 |
| ConnectionCard (API Integration) | Settings에서 계정별 연결 상태 + Connect/재연결 CTA 표시 | 미채택 | 계획은 card 카테고리의 별도 컴포넌트였으나 실제로는 SettingsPage 안에 직접 그렸다 — 계정이 넷뿐이고 다른 화면에서 쓰이지 않아 분리할 이유가 없었다. 상태 Chip(연결됨=success)은 계획대로 |
| RecapHeader (신규 — Recap) | Recap 머리글 — 이벤트 이름 + 상태 칩, 기간·매장·플랫폼 한 줄, KpiBar(캠페인 수 · 지출 "of $X planned" · 매장), 순위 한 줄("Best of 5 comparable events by CPM") | 신규(구현됨) | 카테고리: data-display — KpiBar를 안에서 재활용. 순위 재료(headline)가 null이면 그 줄을 생략한다 |
| PhaseTimelineChart (Recap) | 이벤트 단계 타임라인 | 재활용 | `pages/paidAdsDashboard/PhaseTimelineChart.jsx` — 클릭 없이 읽기 전용 |
| BenchmarkDelta (신규 — Recap) | 지표 값 + 중앙값 대비 차이 · 백분위 · N. `not enough data` 상태 포함 | 신규(구현됨) | 카테고리: data-display — KpiBar `delta`와 같은 화살표·톤 문법(낮을수록 좋은 지표는 방향과 색이 반대) |
| VerdictChip (신규 — Recap) | good / mid / bad 판정 표시. 자동 제안이면 점선 테두리 | 신규(구현됨) | 카테고리: data-display — Chip 위에 구성, 색은 success / 중립 / warning |
| RecapCampaignTable (신규 — Recap) | 플랫폼별 캠페인 표 — 순위 · 매장 · 캠페인 · 일예산 · 지출 · 판정 · 영상 반응 · 참여 반응 · 행동 | 신규(구현됨) | 카테고리: data-display — PerformanceReportTable과 열 정의를 공유하되 보고서용으로 셀에 여러 줄(Reach / Hook·Hold / 조회)을 담는다. 인쇄 시 가로 스크롤 없이 접히는 열 규칙 |
| RecapNoteEditor (신규 — Recap 2단계) | 캠페인 한 줄의 판정(good/mid/bad, 제안값 "Use suggestion") + 장점·아쉬운 점·이유 + 오가닉 조회·참여 선택 입력 | 신규(구현됨) | 카테고리: templates — LocalizedText의 `lang` 칸 하나만 편집, 저장은 페이지(onChange patch) |
| RecapLearningsEditor (신규 — Recap 2단계) | 이벤트 단위 글 — 상태(draft/final), 요약, 배운 점 카드(제목+본문, 추가·삭제·순서), 다음 제언 | 신규(구현됨) | 카테고리: templates — 계획 단계에서는 RecapNoteEditor 하나에 묶었으나 캠페인 단위와 이벤트 단위는 저장 대상(테이블)이 달라 분리 |
| SignInDialog (신규 — Recap 2단계) | Edit를 눌렀는데 세션이 없을 때만 뜨는 로그인 대화상자 | 신규(구현됨) | 카테고리: templates — LoginPage와 같은 로직. 앱 전체 게이트는 꺼진 채 "쓰기가 필요한 자리"에서만 연다 |
| LanguageSwitch (신규 — Recap 3단계) | en / ko / zh-Hant 전환, URL `?lang=` 동기화 | 신규(구현됨) | 카테고리: input — ToggleButton 재활용, Recap에만 노출. 라벨은 각 언어의 자기 이름(EN · 한국어 · 繁中) |
| Print stylesheet (Recap) | 인쇄/PDF — 레일·툴바 숨김, 카드 분리 방지, 표 폭 축소 | 신규(구현됨) | 컴포넌트가 아니라 `@media print` 규칙. PaidAdsShell의 GlobalStyles + `data-print` 속성 |

> CampaignTable(2줄 리스트, 아바타 없음)과 KpiBar(라벨-위-숫자 배치)는 이후 라운드에서 Influencer Tracking Dashboard 실측 기준으로 갱신됨 — 위 표는 초기 이식 시점 기준이라 세부 배치는 각 컴포넌트 자체 주석/`components.md`가 최신 기준이다.
