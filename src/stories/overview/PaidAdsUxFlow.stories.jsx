import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import { DocumentTitle, PageContainer, SectionTitle } from '../../components/storybookDocumentation';

export default {
  title: 'Overview/Paid Ads Dashboard/02. UX Flow',
  parameters: {
    layout: 'padded',
  },
};

const scenarios = [
  {
    name: '시나리오 1: 현황 파악 (가장 빈번 — 하루 여러 번)',
    goal: '지금 몇 개의 광고가 어떤 매장/플랫폼/기간/예산으로 돌아가고 있는지 인지적 노력 없이 즉시 파악',
    flow: [
      '/dashboard 진입',
      '헤더 KPI 바에서 진행중/예정/종료·미보고 개수를 먼저 확인',
      '상태 탭(진행중/예정/종료)과 필터(플랫폼/계정/매장/기간)로 원하는 범위로 좁힘',
      '캠페인 카드 그리드에서 각 광고의 매장·기간·예산·목표를 스캔',
      '필요 시 카드 클릭 → 상세 Drawer에서 세부 정보 확인',
    ],
    success: '별도 검색/스크롤 없이 화면 진입 후 5초 이내 "지금 뭐가 돌아가는지" 파악',
    exception: '캠페인이 없을 때 → Empty 상태로 "광고 등록" CTA 노출',
  },
  {
    name: '시나리오 2: 신규 광고 등록',
    goal: '새 캠페인을 시작하기 전, 필요한 정보를 한 번에 구조화해서 입력 (다른 채널에 중복 기록하지 않음)',
    flow: [
      '/dashboard에서 "광고 등록" 버튼 클릭 → 등록 폼(Dialog) 오픈, URL은 /dashboard?new=1',
      '플랫폼 선택(Meta/TikTok) → 계정 자동 후보 노출',
      '타겟 매장 범위 선택: 단일 매장 / 복수 매장 / 전체 매장',
      '이벤트 연관 여부 입력 (선택)',
      '기간(시작일~종료일), 예산, 목표 입력',
      '저장 → 캠페인이 "예정" 또는 "진행중" 상태로 대시보드에 즉시 반영',
    ],
    success: '폼 저장 한 번으로 대시보드·필터·매장 분해 뷰에 모두 반영, 별도 채널에 재기록 불필요',
    exception: '종료일이 시작일보다 빠름 → 저장 차단 및 인라인 에러 / 필수값 누락 시 저장 차단',
  },
  {
    name: '시나리오 3: 알림 대응',
    goal: '놓치기 쉬운 상황(종료 임박, 성과 미입력, 중복 타겟팅)을 사전에 인지하고 조치',
    flow: [
      '대시보드 상단 Alert 배너 또는 헤더 알림 아이콘에서 경고 수 확인',
      '배너 클릭 → 해당 유형의 캠페인만 필터링된 리스트로 이동',
      '캠페인 카드 클릭 → Drawer에서 원인 확인',
      '조치 수행: 성과 입력 폼으로 이동하거나, 타겟 매장을 조정',
    ],
    success: '알림을 통해 사용자가 먼저 찾아보지 않아도 놓친 항목을 인지',
    exception: '조치 완료 시 알림 자동 해제, 조치 없이 하루 경과 시 알림 유지',
  },
  {
    name: '시나리오 4: 성과 입력 및 보고서 생성',
    goal: '광고 종료 후 핵심 지표만 빠르게 입력하고, 보고 시점에 재탐색 없이 바로 내보내기',
    flow: [
      '캠페인 카드(종료 상태) 클릭 → Drawer 오픈',
      '"성과 입력" 탭에서 goal에 따라 자동으로 필요한 지표 필드만 노출',
      '저장 시 해당 캠페인의 미보고 알림 자동 해제',
      '/reports로 이동 → 기간/매장/플랫폼 기준으로 캠페인들을 선택',
      '요약 통계 확인 후 CSV/이미지로 내보내기',
    ],
    success: '메타/틱톡을 오가며 전체 데이터를 재다운로드하지 않고, 사전에 정의된 핵심 지표만 기록/보고',
    exception: '성과 미입력 상태로 종료일이 지나면 시나리오 3의 알림 트리거',
  },
  {
    name: '시나리오 5: 매장 마스터 관리',
    goal: '신규 매장이 오픈하면 매장 코드를 등록해 캠페인 타겟 선택 목록에 반영',
    flow: [
      '/stores 이동',
      '"매장 추가" → 코드(예: G11), 이름, 지역(GA/FL), 상태(예정/운영중) 입력',
      '저장 → 캠페인 등록 폼의 매장 선택 목록에 즉시 반영',
    ],
    success: '매장 추가가 캠페인 등록 플로우를 막지 않고 즉시 반영',
    exception: '중복 코드 입력 시 저장 차단 및 인라인 에러',
  },
  {
    name: '시나리오 6: 플랫폼 계정 연결 (신규 — API Integration)',
    goal: 'Meta/TikTok 광고 계정을 연결해 캠페인·성과 데이터가 자동으로 채워지게 함(수동 입력 부담 감소)',
    flow: [
      'Settings(신규 영역)에서 "Connect Meta Account" 클릭',
      'Meta 로그인/권한 동의 화면으로 이동 (백엔드 Edge Function이 OAuth 대행)',
      '동의 완료 → Settings로 복귀, 계정별 연결 상태(연결됨/안 됨) 표시',
      '이후 캠페인 목록·성과 데이터가 자동 동기화(백그라운드), 필요 시 "Sync now"로 즉시 갱신',
    ],
    success: '연결 후 별도 조작 없이 캠페인/성과가 채워짐. 토큰은 항상 서버에만 존재 — 프론트는 연결 상태만 앎',
    exception: '토큰 만료/재인증 필요 시 "연결 끊김" 상태 표시 + 재연결 CTA. 연결 안 된 계정의 캠페인은 시나리오 2(수동 등록)로 계속 지원',
  },
];

const dbSteps = [
  {
    scenario: '시나리오 1. 현황 파악',
    steps: [
      '/dashboard 진입 → campaigns/performance_records read (KPI 집계). Alert는 그 자리에서 재계산(쓰기 없음)',
      '카드 클릭 → Drawer → 해당 campaigns row 1건 read',
    ],
  },
  {
    scenario: '시나리오 2. 신규 광고 등록',
    steps: [
      '플랫폼/계정 선택 → ad_accounts read',
      '매장 범위 선택 → stores read',
      '저장 → campaigns insert (1 row)',
    ],
  },
  {
    scenario: '시나리오 3. 알림 대응',
    steps: [
      '배너/아이콘 확인 → 필터링 → Drawer → read만 (alerts 쓰기 없음)',
      '조치: 타겟 조정 → campaigns update',
      '조치 완료 인지 → 별도 update 없음. performance_records.reported_at이 채워지면 다음 조회 때 재계산 결과에서 자연히 빠짐',
    ],
  },
  {
    scenario: '시나리오 4. 성과 입력 및 보고서 생성',
    steps: [
      "Drawer \"성과 입력\" 탭 저장 → performance_records insert (source='manual')",
      '/reports 이동 → 필터 → campaigns/performance_records read',
      '내보내기(CSV/이미지) → DB 동작 없음(클라이언트 사이드)',
    ],
  },
  {
    scenario: '시나리오 5. 매장 마스터 관리',
    steps: ['/stores 이동 → stores read', '매장 추가/수정 저장 → stores insert 또는 update'],
  },
  {
    scenario: '시나리오 6. 플랫폼 계정 연결 (신규)',
    steps: [
      '"Connect Meta/TikTok Account" 클릭 → DB 동작 없음(Edge Function이 OAuth 대행)',
      'OAuth 콜백 완료 → connections insert/upsert (service_role만 write)',
      'Settings 화면 표시 → connections_public(토큰 제외 view) read',
      "자동/수동 동기화(\"Sync now\") → sync-campaigns가 campaigns upsert(external_campaign_id 기준), sync-performance가 performance_records insert(source='api')",
    ],
  },
];

const mermaidFlow = `flowchart TD
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
    I1 --> E1`;

const iaTree = `Paid Ads Dashboard
├── /dashboard (메인 — 기본 진입점)
│   ├── 헤더 (sticky)
│   │   ├── KpiBar — 진행중 N · 예정 N · 종료 N · 미보고 N
│   │   ├── 알림 아이콘 (경고 수 뱃지)
│   │   └── "광고 등록" 버튼
│   ├── AlertBanner (경고 있을 때만 노출)
│   ├── FilterBar — 플랫폼 / 계정 / 매장 / 기간
│   ├── 상태 탭 — 진행중 / 예정 / 종료
│   ├── StoreBreakdown — 매장별 캠페인 목록 (예산 분배 없음)
│   └── 캠페인 카드 그리드
│       └── 카드 클릭 → 상세 Drawer (개요 / 성과 입력 탭)
├── /dashboard?new=1 — 캠페인 등록 폼 (Dialog, 딥링크 가능)
├── /stores — 매장 마스터 관리
│   └── 매장 리스트 + 추가/수정 폼
├── /reports — 성과 보고서
│   ├── 기간 · 매장 · 플랫폼 선택
│   ├── 요약 통계
│   └── 내보내기 (CSV/이미지)
└── /settings (신규 — API Integration) — 플랫폼 계정 연결 관리
    └── 계정별(Meta-GA/Meta-FL/TikTok) 연결 상태 + Connect/재연결 CTA`;

const pageList = [
  { page: 'Dashboard', path: '/dashboard', data: 'Campaign(R), PerformanceRecord(R, 집계), Store(R, 필터), AdAccount(R, 필터) — Alert는 저장 없이 재계산' },
  { page: 'Campaign Register', path: '/dashboard?new=1', data: 'Campaign(W, insert), Store(R), AdAccount(R)' },
  { page: 'Campaign Detail Drawer', path: '/dashboard?campaign={id}', data: 'Campaign(R/W, update), PerformanceRecord(R/W, insert)' },
  { page: 'Stores', path: '/stores', data: 'Store(R/W, insert·update)' },
  { page: 'Reports', path: '/reports', data: 'Campaign(R), PerformanceRecord(R)' },
  { page: 'Settings (신규)', path: '/settings', data: "Connection(R, connections_public view만 — 토큰 필드는 프론트에 노출 안 함)" },
];

const routes = [
  { path: '/', desc: '/dashboard 리다이렉트' },
  { path: '/dashboard', desc: '메인 현황 대시보드' },
  { path: '/dashboard?platform=meta&account=ga&store=G01&status=active', desc: '필터 상태 URL 유지' },
  { path: '/dashboard?tab=ended', desc: '상태 탭 딥링크' },
  { path: '/dashboard?campaign={id}', desc: '특정 캠페인 Drawer 오픈 상태로 진입' },
  { path: '/dashboard?new=1', desc: '캠페인 등록 Dialog 오픈 상태로 진입' },
  { path: '/stores', desc: '매장 마스터 관리' },
  { path: '/reports', desc: '성과 보고서 뷰/내보내기' },
  { path: '/reports?from=2026-01-01&to=2026-03-31&store=G01', desc: '보고서 필터 상태 URL 유지' },
  { path: '/settings', desc: '플랫폼 계정 연결 관리 (신규 — API Integration)' },
];

/** Documentation */
export const Doc = {
  render: () => (
    <>
      <DocumentTitle
        title="UX Flow"
        status="Approved"
        note="Paid Ads Tracking Dashboard — user scenarios, flow, information architecture"
        brandName="BeautyMaster"
        systemName="Paid Ads Dashboard"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          페이드 광고 트래킹 대시보드 — UX Flow
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          유저 시나리오, UX 플로우, 정보 구조(IA), 라우팅 설계
        </Typography>

        <SectionTitle title="유저 시나리오" description="핵심 플로우 6개" />
        {scenarios.map((s) => (
          <Box key={s.name} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {s.name}
            </Typography>
            <TableContainer sx={{ mb: 1 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: '15%', verticalAlign: 'top' }}>목표</TableCell>
                    <TableCell>{s.goal}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>플로우</TableCell>
                    <TableCell>
                      <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                        {s.flow.map((step, i) => (
                          <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5 }}>
                            {step}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>성공 조건</TableCell>
                    <TableCell>{s.success}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>예외 상황</TableCell>
                    <TableCell>{s.exception}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        <SectionTitle
          title="UX-flow 단계별 서사"
          description="/supabase-integration 04-data-bridge.md § 2 입력 — 각 시나리오에서 DB가 실제로 바뀌는 단계만 표기. Alert는 별도 테이블 없이 매번 재계산된다"
        />
        {dbSteps.map((d) => (
          <Box key={d.scenario} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              {d.scenario}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {d.steps.map((step, i) => (
                <Typography component="li" variant="body2" color="text.secondary" key={i} sx={{ mb: 0.5 }}>
                  {step}
                </Typography>
              ))}
            </Box>
          </Box>
        ))}
        <Box sx={{ mb: 4 }} />

        <SectionTitle title="UX 플로우" description="Mermaid flowchart 소스 (핵심 분기)" />
        <Box
          component="pre"
          sx={{
            backgroundColor: 'grey.100',
            p: 2,
            mb: 4,
            fontSize: 12,
            fontFamily: 'monospace',
            overflow: 'auto',
            borderRadius: 1,
          }}
        >
          {mermaidFlow}
        </Box>

        <SectionTitle title="정보 구조 (IA)" />
        <Box
          component="pre"
          sx={{
            backgroundColor: 'grey.100',
            p: 2,
            mb: 1,
            fontSize: 12,
            fontFamily: 'monospace',
            overflow: 'auto',
            borderRadius: 1,
          }}
        >
          {iaTree}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          캠페인 상세·성과 입력은 별도 페이지 없이 Drawer로 처리 (Influencer Tracking Dashboard와 동일한 패턴).
        </Typography>

        <SectionTitle title="페이지 리스트" description="/supabase-integration 04-data-bridge.md § 3 입력" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>페이지명</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '25%' }}>경로</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>다루는 데이터 (R/W)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageList.map((p) => (
                <TableRow key={p.page}>
                  <TableCell sx={{ fontWeight: 600 }}>{p.page}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{p.path}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{p.data}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="라우팅 설계" />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '45%' }}>경로</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>설명</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {routes.map((r) => (
                <TableRow key={r.path}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.path}</TableCell>
                  <TableCell>{r.desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageContainer>
    </>
  ),
};

const dataDictionary = [
  { name: 'Store', table: 'stores', desc: '매장 마스터 (조지아/플로리다 매장 코드·지역·운영 상태)' },
  { name: 'AdAccount', table: 'ad_accounts', desc: '플랫폼별 광고 계정 (Meta는 조지아/플로리다 분리, TikTok은 통합)' },
  { name: 'Campaign', table: 'campaigns', desc: '캠페인/광고. 타겟 매장·기간·예산·목표를 갖는 핵심 엔티티' },
  { name: 'PerformanceRecord', table: 'performance_records', desc: '캠페인별 성과 지표 (수동 입력 또는 API 자동 수집)' },
  { name: 'Alert', table: '(없음 — 계산 전용)', desc: 'campaigns/performance_records를 읽어 매번 재계산, 저장 안 함' },
  { name: 'Connection', table: 'connections', desc: 'Meta/TikTok OAuth 연결 상태 — 서버 전용, RLS로 본인 행만 조회' },
  { name: 'User', table: 'auth.users (Supabase 내장)', desc: '로그인 사용자. 1인 운영 기준이며 모든 테이블의 owner_id가 참조' },
];

const entities = [
  {
    name: 'Store (매장)',
    fields: [
      { field: 'id', type: 'string', format: '매장 코드, PK', desc: '조지아 G+2자리, 플로리다 BF+1자리', example: '"G01", "BF1"' },
      { field: 'name', type: 'string', format: 'free text', desc: '매장명', example: '"Georgia - Duluth"' },
      { field: 'region', type: 'enum', format: 'GA | FL', desc: '지역 구분', example: '"GA"' },
      { field: 'status', type: 'enum', format: 'active | planned | closed', desc: '운영 상태', example: '"active"' },
      { field: 'createdAt', type: 'string', format: 'ISO 8601 datetime', desc: '등록 시각', example: '"2026-07-20T09:00:00Z"' },
    ],
  },
  {
    name: 'AdAccount (광고 계정)',
    fields: [
      { field: 'id', type: 'string', format: 'slug, PK', desc: '플랫폼+지역 조합 슬러그', example: '"meta-ga", "tiktok-unified"' },
      { field: 'platform', type: 'enum', format: 'meta | tiktok', desc: '광고 플랫폼', example: '"meta"' },
      { field: 'region', type: 'enum', format: 'GA | FL | ALL', desc: '계정이 커버하는 지역 (틱톡은 ALL)', example: '"GA"' },
      { field: 'label', type: 'string', format: 'free text', desc: 'UI 표시명', example: '"Meta - Georgia"' },
    ],
  },
  {
    name: 'Campaign (캠페인/광고)',
    fields: [
      { field: 'id', type: 'string', format: 'UUID v4, PK', desc: '캠페인 고유 ID', example: '"c4e1f6b0-..."' },
      { field: 'name', type: 'string', format: 'free text, 1~100자', desc: '캠페인명. 캠페인 1개 = 플랫폼 1개라 "메타+틱톡 동시 진행"은 캠페인 2개로 표현하는데, 이름을 완전히 똑같이 지으면 CampaignTable "Also on" 묶음 칩·FilterBar Campaign Group 필터·합산 예산/집행액 요약이 자동으로 묶어준다(별도 groupName 필드는 없앰 — name과 하는 일이 겹쳤음)', example: '"Morrow Grand Opening Awareness"' },
      { field: 'platform', type: 'enum', format: 'meta | tiktok', desc: '—', example: '"meta"' },
      { field: 'accountId', type: 'string', format: 'FK → AdAccount.id', desc: '—', example: '"meta-ga"' },
      { field: 'targetScope', type: 'enum', format: 'single_store | multi_store | all_stores', desc: '타겟 범위', example: '"single_store"' },
      { field: 'targetStoreIds', type: 'string[]', format: 'Store.id 배열', desc: 'all_stores면 빈 배열', example: '["G11"]' },
      { field: 'startDate / endDate', type: 'string', format: 'ISO 8601 date', desc: '캠페인 기간', example: '"2026-08-01"' },
      { field: 'budgetPlanned', type: 'number', format: 'USD, 소수점 2자리', desc: '계획 예산(총액)', example: '1500.00' },
      { field: 'budgetDaily', type: 'number | null', format: 'USD, 소수점 2자리', desc: '일일 예산(선택). 있으면 calcBudgetPacing()의 pacing 신호가 경과일/전체기간 비율 대신 "일평균 소진액 vs 이 값"으로 바뀜(더 직접적인 신호라 우선) — CampaignTable·PacingIndicator·budget_pacing 알림 모두 이 기준을 따름', example: '50.00' },
      { field: 'goal', type: 'enum', format: 'awareness | traffic | engagement | conversion | store_visit', desc: '광고 목표', example: '"awareness"' },
      { field: 'status', type: 'enum (계산 필드)', format: 'planned | active | ended', desc: 'startDate/endDate와 오늘 날짜로 자동 계산, 저장하지 않음', example: '"active"' },
      { field: 'manualStatus', type: 'enum | null', format: 'ended_early | archived | null', desc: '유일한 수동 override, 값이 있으면 status 계산보다 우선', example: 'null' },
      { field: 'creativeUrl', type: 'string | null', format: 'URL', desc: 'Ads Manager 소재/캠페인 링크 또는 실제 영상/게시물 링크. "View Ad" 외부 링크로만 쓰임(사람이 타이핑)', example: '"https://business.facebook.com/..."' },
      { field: 'thumbnailUrl', type: 'string | null', format: '이미지(업로드 전용)', desc: '소재 미리보기 이미지. 없으면 CampaignThumbnail이 플랫폼색 이니셜로 대체. creativeUrl과는 별개 값', example: '"data:image/png;base64,..."' },
      { field: 'externalCampaignId', type: 'string | null', format: 'API 연동 필드', desc: '플랫폼 캠페인 ID 매핑. null이면 API로 안 들어온 수동 등록 캠페인', example: '"120212..."' },
      { field: 'notes', type: 'string | null', format: 'free text', desc: '비고', example: '"인플루언서 협업 소재 재사용"' },
      { field: 'createdAt / updatedAt', type: 'string', format: 'ISO 8601 datetime', desc: '—', example: '"2026-07-20T09:00:00Z"' },
    ],
    note: '매장 귀속(attribution) 규칙: multi_store/all_stores 캠페인은 매장별로 예산/성과를 분배하지 않는다. status SSOT 규칙: effectiveStatus = manualStatus ?? computedStatus(startDate, endDate, today)',
  },
  {
    name: 'PerformanceRecord (성과 기록)',
    fields: [
      { field: 'impressions / reach / clicks', type: 'number | null', format: 'Tier 1 · 공통 필수', desc: '노출/도달/링크클릭', example: '120000' },
      { field: 'spend', type: 'number', format: 'Tier 1 · USD', desc: '실집행 예산', example: '1487.32' },
      { field: 'hookViews', type: 'number | null', format: 'Tier 2 · 영상 지표', desc: '3초/2초 조회수', example: '42000' },
      { field: 'heldViews', type: 'number | null', format: 'Tier 2 · 영상 지표', desc: '완전시청수', example: '9800' },
      { field: 'engagements', type: 'number | null', format: 'Tier 3 · goal=engagement일 때만', desc: '좋아요+댓글+공유+저장 합계', example: '3200' },
      { field: 'conversions', type: 'number | null', format: 'Tier 4 · goal=conversion/store_visit일 때만', desc: 'Results/Conversions', example: '62' },
      { field: 'recordedAt / reportedAt', type: 'string | null', format: 'ISO 8601 date', desc: '입력 시점 / 보고 완료 일자 (null이면 미보고)', example: '"2026-09-02"' },
      { field: 'resultUrl', type: 'string | null', format: 'URL', desc: '리포트/스크린샷 링크', example: '"https://drive.google.com/..."' },
      { field: 'source', type: "enum ('manual' | 'api')", format: 'API 연동 필드', desc: '수동 입력 vs API 자동 수집 구분. API 값이 있으면 기본, 사용자 override 가능', example: '"manual"' },
    ],
    note: 'CPM/CTR/CPC/Hook Rate/Hold Rate/Engagement Rate/CPA는 저장하지 않고 raw 필드 기반 계산 필드로 처리 (중복 저장 방지). 입력 폼은 Campaign.goal에 따라 Tier 3/4를 조건부로 노출.',
  },
  {
    name: 'Alert (알림)',
    fields: [
      { field: 'campaignId', type: 'string', format: 'FK → Campaign.id', desc: '—', example: '"c4e1f6b0-..."' },
      { field: 'type', type: 'enum', format: 'ending_soon | missing_performance | budget_pacing | overlap_target | new_store_reminder', desc: '알림 유형', example: '"ending_soon"' },
      { field: 'triggeredAt / resolvedAt', type: 'string | null', format: 'ISO 8601 datetime', desc: '발생/해제 시각 (resolvedAt null이면 활성)', example: '"2026-08-28T00:00:00Z"' },
      { field: 'message', type: 'string', format: 'free text', desc: '표시 문구', example: '"D-3 — 종료 임박"' },
    ],
    note: 'overlap_target 트리거 조건(알림 피로 방지): 같은 platform + 타겟 매장 교집합 + 같은 goal + 기간 겹침일 때만 발생.',
  },
  {
    name: 'Connection (플랫폼 연결, 신규 — API Integration)',
    fields: [
      { field: 'id', type: 'string', format: 'UUID v4, PK', desc: '—', example: '"conn-01"' },
      { field: 'platform', type: 'enum', format: 'meta | tiktok', desc: '—', example: '"meta"' },
      { field: 'accountId', type: 'string', format: 'FK → AdAccount.id', desc: '—', example: '"meta-ga"' },
      { field: 'accessToken / refreshToken', type: 'string', format: '암호화 저장', desc: 'OAuth 토큰 — 서버 전용, 프론트에 절대 노출 안 함', example: '(암호화됨)' },
      { field: 'expiresAt', type: 'string', format: 'ISO 8601 datetime', desc: '토큰 만료 시각', example: '"2026-09-19T00:00:00Z"' },
      { field: 'connectedAt', type: 'string', format: 'ISO 8601 datetime', desc: '최초 연결 시각', example: '"2026-07-20T09:00:00Z"' },
    ],
    note: 'AdAccount 참조. 서버 전용 — RLS로 본인 행만 조회 가능하며, 프론트는 connections_public(토큰 제외 view)를 통해 연결 상태(boolean)만 읽는다.',
  },
];

/** 데이터 모델 상세 */
export const DataModel = {
  render: () => (
    <PageContainer>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        데이터 모델
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Store / AdAccount / Campaign / PerformanceRecord / Alert / Connection — id, url, tags 등 필드 포맷 상세
      </Typography>

      <SectionTitle title="데이터 모델 활용" description="/supabase-integration 04-data-bridge.md § 1 입력 — 데이터명 → 예상 테이블명 사전" />
      <TableContainer sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: '20%' }}>데이터명</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '25%' }}>예상 테이블명</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>설명 (1줄)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataDictionary.map((d) => (
              <TableRow key={d.name}>
                <TableCell sx={{ fontWeight: 600 }}>{d.name}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{d.table}</TableCell>
                <TableCell sx={{ fontSize: 13 }}>{d.desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {entities.map((e) => (
        <Box key={e.name} sx={{ mb: 4 }}>
          <SectionTitle title={e.name} />
          <TableContainer sx={{ mb: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>필드</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>타입</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>포맷</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>설명</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>예시</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {e.fields.map((f) => (
                  <TableRow key={f.field}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{f.field}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{f.type}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{f.format}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{f.desc}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{f.example}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {e.note && (
            <Typography variant="body2" color="text.secondary">
              {e.note}
            </Typography>
          )}
        </Box>
      ))}
    </PageContainer>
  ),
};

const components = [
  { name: 'PaidAdsShell + PaidAdsRail', usage: '전체 레이아웃 셸 — 좌측 아이콘 레일(hover 시 확장) + 본문', type: '신규(구현됨)', note: 'pages/paidAdsDashboard/PaidAdsRail.jsx — 계획 당시 AppShell(상단 GNB) 재활용 구상을 design-handoff 상속 과정에서 레일 셸로 교체' },
  { name: 'PageContainer', usage: '반응형 페이지 컨테이너', type: '재활용', note: 'components/layout/PageContainer.jsx' },
  { name: 'StickyAsideCenterLayout', usage: '좌측 보조 패널 + 중앙 캠페인 그리드 (계획)', type: '검토 후 미채택', note: '우측에 빈 미러 컬럼을 만드는 대칭 패턴이라 이 화면과 안 맞아 직접 flex로 구현, 이후 사이드바 자체를 제거' },
  { name: 'Tabs / Table / Select / TextField / Checkbox / Button / Chip / Dialog / Drawer', usage: '상태 탭, 표, 폼 입력, 오버레이 전반', type: '재활용', note: 'MUI 컴포넌트 직접 사용' },
  { name: 'FilterBar', usage: '플랫폼/계정/매장/기간 필터', type: '수정', note: 'components/templates/FilterBar.jsx — 광고 도메인 옵션 세트로 교체' },
  { name: 'KpiBar', usage: '헤더 KPI 요약 + /reports 요약 통계', type: '신규(구현됨)', note: '라벨-위-숫자 배치, separator로 알림성 항목 분리 — Dashboard/Reports 공용' },
  { name: 'StoreBreakdown', usage: '매장별 캠페인 목록 (예산 분배 없음)', type: '신규(구현됨)', note: '카테고리: data-display' },
  { name: 'CampaignTable', usage: '캠페인 목록 — 아바타 없는 2줄 리스트', type: '신규(구현됨)', note: '계획 대비 변경: 원래 CampaignCard 그리드였으나 Influencer Tracking 레퍼런스 확인 후 리스트로 교체. 소재 썸네일(CampaignThumbnail) + "View Ad" 외부 링크 포함' },
  { name: 'CampaignThumbnail', usage: '캠페인 소재 썸네일', type: '재활용', note: 'components/media/CampaignThumbnail.jsx — thumbnailUrl 없으면 플랫폼색 이니셜 fallback' },
  { name: 'CampaignCard', usage: '캠페인 요약 카드 콘텐츠 (그리드형)', type: '신규(미사용)', note: 'CustomCard 위에 구성돼 있으나 CampaignTable로 대체되어 현재 어느 화면에도 연결 안 됨 — 재사용 후보로 보존' },
  { name: 'CampaignSummaryGrid', usage: '스탯 카드 그리드', type: '신규(미사용)', note: 'Reports가 KpiBar로 통일되면서 현재 어느 화면에도 연결 안 됨 — 재사용 후보로 보존' },
  { name: 'PerformanceReportTable', usage: '/reports 캠페인별 성과 지표 표', type: '신규(구현됨, 계획 문서에 없었음)', note: '카테고리: data-display — Dashboard Drawer로 딥링크 지원' },
  { name: 'StoreTable', usage: '/stores 매장 마스터 목록', type: '신규(구현됨, 계획 문서에 없었음)', note: '카테고리: data-display — 코드/이름/지역/상태 + 캠페인 수' },
  { name: 'AlertBanner', usage: '종료 임박/성과 미입력/중복 타겟팅 경고 배너', type: '신규(구현됨)', note: '카테고리: data-display' },
  { name: 'LastUpdatedBar', usage: '캠페인/성과 최근 입력 시각 표시', type: '신규(구현됨)', note: '카테고리: layout' },
  { name: 'StoreMultiSelect', usage: '단일/복수/전체 매장 타겟 선택기', type: '신규(구현됨)', note: '카테고리: input' },
  { name: 'CampaignForm', usage: '캠페인 등록/수정 폼', type: '신규(구현됨)', note: '카테고리: templates — Ad Link(텍스트)와 Thumbnail(업로드/붙여넣기 전용, 실시간 미리보기·Uploaded 상태 표시) 별개 필드 포함' },
  { name: 'PerformanceForm', usage: '성과 지표 입력 폼 (goal 기반 Tier 조건부 노출)', type: '신규(구현됨)', note: '카테고리: templates' },
  { name: 'PacingIndicator', usage: '예산 소진 속도(pacing) 시각화', type: '신규(구현됨)', note: '카테고리: data-display' },
  { name: 'ConnectionCard', usage: 'Settings에서 계정별 연결 상태 + Connect/재연결 CTA', type: '신규 — API Integration', note: '카테고리: card — CustomCard 위에 구성, 상태 Chip(연결됨=success, 끊김=warning) 재활용' },
];

function typeColor(type) {
  if (type.startsWith('재활용')) return 'success';
  if (type.startsWith('수정')) return 'warning';
  if (type.includes('미사용')) return 'default';
  return 'primary'; // 신규 계열(구현됨/API Integration 포함)
}

/** 컴포넌트 리스트 */
export const ComponentList = {
  render: () => (
    <PageContainer>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        컴포넌트 리스트
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        기존 디자인 시스템 재활용을 우선하고, 부족한 부분은 Influencer Tracking Dashboard 컴포넌트를 component-work 워크플로우로 이식
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: '22%' }}>컴포넌트</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>용도</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%' }}>구분</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '28%' }}>기존 경로 / 비고</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {components.map((c) => (
              <TableRow key={c.name}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{c.name}</TableCell>
                <TableCell sx={{ fontSize: 13 }}>{c.usage}</TableCell>
                <TableCell>
                  <Chip label={c.type} size="small" color={typeColor(c.type)} variant="outlined" sx={{ borderRadius: '4px' }} />
                </TableCell>
                <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{c.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </PageContainer>
  ),
};
