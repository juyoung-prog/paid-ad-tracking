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
└── /settings (신규 — API Integration) — 플랫폼 계정 연결 관리
    └── 계정별(Meta-GA/Meta-FL/TikTok) 연결 상태 + Connect/재연결 CTA
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

### 핵심 엔티티

| 엔티티 | 주요 필드 | 관계 |
|--------|----------|------|
| Store (매장) | id, name, region, status | Campaign.targetStoreIds가 참조 |
| AdAccount (광고 계정) | id, platform, region, label | Campaign.accountId가 참조 |
| Campaign (캠페인/광고) | id, name, platform, accountId, targetScope, targetStoreIds, dateRange, budgetPlanned, goal, status, tags | Store·AdAccount 참조, PerformanceRecord·Alert의 부모 |
| PerformanceRecord (성과 기록) | id, campaignId, recordedAt, 지표들 | Campaign 1:1 (또는 1:N 스냅샷) |
| Alert (알림) | id, campaignId, type, triggeredAt, resolvedAt | Campaign 참조 |
| Connection (플랫폼 연결, 신규 — API Integration) | id, platform, accountId, accessToken(암호화), refreshToken, expiresAt, connectedAt | AdAccount 참조. **서버 전용** — RLS로 본인 행만 조회, 프론트에는 연결 상태(boolean)만 노출 |

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
| ConnectionCard (신규 — API Integration) | Settings에서 계정별 연결 상태 + Connect/재연결 CTA 표시 | 신규 | 카테고리: card — CustomCard 위에 구성, 상태는 Chip(연결됨=success, 끊김=warning) 재활용 |

> CampaignTable(2줄 리스트, 아바타 없음)과 KpiBar(라벨-위-숫자 배치)는 이후 라운드에서 Influencer Tracking Dashboard 실측 기준으로 갱신됨 — 위 표는 초기 이식 시점 기준이라 세부 배치는 각 컴포넌트 자체 주석/`components.md`가 최신 기준이다.
