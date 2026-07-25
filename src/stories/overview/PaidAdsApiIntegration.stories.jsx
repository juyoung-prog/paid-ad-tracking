import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DocumentTitle, PageContainer, SectionTitle } from '../../components/storybookDocumentation';

export default {
  title: 'Overview/Paid Ads Dashboard/05. API Integration',
  parameters: {
    layout: 'padded',
  },
};

const executionSteps = [
  { step: '1', content: '02-ux-flow.md 갱신 완료 (Connection 엔티티·신규 필드·시나리오 6 추가)', owner: '완료' },
  { step: '2', content: 'Meta for Developers / TikTok for Business 앱 등록 + App Review 신청', owner: '사용자 (외부 콘솔)' },
  { step: '3', content: 'Supabase 프로젝트 생성 + DB 스키마·Auth·RLS 설계', owner: 'Claude + 사용자 승인 (/supabase-integration Phase 1~3)' },
  { step: '4', content: 'Edge Function으로 OAuth 교환 + Meta/TikTok API 프록시 구현', owner: 'Claude (/supabase-integration Phase 6)' },
  { step: '5', content: '프론트엔드를 mock 데이터에서 Supabase 클라이언트 호출로 전환', owner: 'Claude (/supabase-integration Phase 5, 데이터 훅)' },
  { step: '6', content: '동기화 스케줄링 (pg_cron 또는 "Sync now" 온디맨드 호출)', owner: 'Claude + 사용자 결정' },
];

const oauthSequence = `sequenceDiagram
    participant U as 사용자 (브라우저)
    participant F as 프론트엔드 (이 앱)
    participant E as Supabase Edge Function
    participant D as Supabase Postgres (RLS)
    participant P as Meta/TikTok

    U->>F: "Connect Meta Account" 클릭
    F->>E: invoke('auth-meta-start')
    E->>U: 플랫폼 로그인/동의 화면으로 redirect
    U->>P: 로그인 + 권한 동의
    P->>E: redirect_uri?code=... (authorization code)
    E->>P: code + client_secret으로 토큰 교환 (secret은 Supabase 프로젝트 시크릿)
    P->>E: access_token, refresh_token, expires_in
    E->>D: connections 테이블에 암호화 저장
    E->>F: { connected: true, accountLabel: "Meta - Georgia" }
    F->>U: "연결됨" 상태만 표시 (토큰은 프론트에 절대 안 옴)`;

const platformSetup = [
  { platform: 'Meta', todo: 'Meta for Developers에서 앱 생성 → Marketing API 제품 추가 → ads_read 권한 App Review 제출', result: 'Client ID/Secret, 승인 대기' },
  { platform: 'TikTok', todo: 'TikTok for Business에서 앱 생성 → Ads 권한 신청', result: 'Client ID/Secret, 승인 대기' },
];

const schemaChanges = [
  { table: 'connections (신규)', field: 'platform, account_id, access_token(암호화), refresh_token, expires_at', purpose: 'RLS: 본인 행만 조회 가능, service_role만 write' },
  { table: 'campaigns', field: 'external_campaign_id', purpose: 'null이면 API로 안 들어온 수동 등록 캠페인' },
  { table: 'performance_records', field: "source ('manual' | 'api')", purpose: 'API 값 우선, 사용자 override 가능' },
];

const edgeFunctions = [
  { fn: 'auth-meta-start / auth-tiktok-start', role: 'OAuth 인증 URL로 redirect' },
  { fn: 'auth-meta-callback / auth-tiktok-callback', role: 'code → token 교환, connections에 저장' },
  { fn: 'sync-campaigns', role: '플랫폼 캠페인 목록 조회 → campaigns upsert' },
  { fn: 'sync-performance', role: '플랫폼 insights/report 조회 → performance_records upsert(source=\'api\')' },
];

const fieldMapping = [
  { ours: 'impressions', meta: 'impressions', tiktok: 'impressions' },
  { ours: 'reach', meta: 'reach', tiktok: 'reach' },
  { ours: 'clicks', meta: 'clicks (또는 link_click)', tiktok: 'clicks' },
  { ours: 'spend', meta: 'spend', tiktok: 'spend' },
  { ours: 'hookViews', meta: 'video_p25_watched_actions (근사치)', tiktok: 'video_watched_2s' },
  { ours: 'heldViews', meta: 'video_p100_watched_actions', tiktok: 'video_watched_6s' },
  { ours: 'engagements', meta: 'post_engagement', tiktok: 'engagement' },
  { ours: 'conversions', meta: 'actions 중 offsite_conversion 등', tiktok: 'conversion' },
];

/** Documentation */
export const Doc = {
  render: () => (
    <>
      <DocumentTitle
        title="API Integration"
        status="Approved"
        note="Paid Ads Tracking Dashboard — Meta/TikTok Ads API via Supabase (Edge Functions + Postgres)"
        brandName="BeautyMaster"
        systemName="Paid Ads Dashboard"
        version="2.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          페이드 광고 트래킹 대시보드 — API Integration
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Meta/TikTok 광고 API를 실제로 연동하기 위한 실행 계획. 백엔드는 <strong>Supabase</strong>(Edge Functions + Postgres)로 구축한다 — 이 스타터킷에 이미 /supabase-integration 워크플로우가 갖춰져 있어 별도 서버를 새로 세울 필요가 없다. 01. Project Summary 핵심 기능 #7("Meta/TikTok Ads API 자동 수집", 1차 범위 제외)을 실제로 켜는 문서다.
        </Typography>

        <SectionTitle title="실행 순서" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '8%' }}>단계</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>내용</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '30%' }}>담당</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {executionSteps.map((row) => (
                <TableRow key={row.step}>
                  <TableCell sx={{ fontWeight: 600 }}>{row.step}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{row.content}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{row.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="아키텍처" description="Mermaid sequence diagram 소스" />
        <Box
          component="pre"
          sx={{ backgroundColor: 'grey.100', p: 2, mb: 2, fontSize: 12, fontFamily: 'monospace', overflow: 'auto', borderRadius: 1 }}
        >
          {oauthSequence}
        </Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            · Edge Function이 "백엔드 프록시" 역할을 그대로 수행한다 — 별도 Node/Express 서버·호스팅을 새로 마련할 필요가 없다.
          </Typography>
          <Typography variant="body2">
            · service_role 키와 client_secret은 Supabase 프로젝트 시크릿에만 두고, 프론트(VITE_*)에는 anon key만 노출한다.
          </Typography>
        </Box>

        <SectionTitle title="1단계 — 데이터 모델 확정 (완료)" />
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            · /supabase-integration은 02-ux-flow.md § 데이터 모델 활용을 유일한 입력으로 읽는다. 이 문서는 이미 존재했고(시나리오 1~5, IA, 데이터 모델, 컴포넌트 리스트까지 상세히 작성돼 있었음), 여기에 API 연동에 필요한 항목만 추가했다.
          </Typography>
          <Typography variant="body2">
            · 추가한 것: 핵심 엔티티에 Connection(서버 전용) 추가, Campaign.externalCampaignId/PerformanceRecord.source 필드, 시나리오 6(플랫폼 계정 연결), IA에 /settings, 컴포넌트 리스트에 ConnectionCard(신규)·CampaignThumbnail(이미 구현됨) 반영.
          </Typography>
        </Box>

        <SectionTitle title="2단계 — 플랫폼 앱 등록" description="사용자가 직접" />
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>플랫폼</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>할 일</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>결과물</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {platformSetup.map((row) => (
                <TableRow key={row.platform}>
                  <TableCell sx={{ fontWeight: 600 }}>{row.platform}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{row.todo}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{row.result}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            · 두 플랫폼 다 Redirect URI를 Supabase Edge Function URL로 등록한다(예: https://{'{project}'}.supabase.co/functions/v1/auth-meta-callback).
          </Typography>
          <Typography variant="body2">
            · App Review는 실제 사업자 인증이 필요한 외부 절차라 이 부분만은 사용자가 직접 진행해야 한다. 심사 대기 중에도 3~6단계는 mock 토큰으로 미리 구현/검증할 수 있다.
          </Typography>
        </Box>

        <SectionTitle title="3단계 — Supabase 스키마" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>테이블</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>주요 컬럼</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schemaChanges.map((row) => (
                <TableRow key={row.table}>
                  <TableCell sx={{ fontWeight: 600 }}>{row.table}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.field}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{row.purpose}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="4단계 — Edge Functions" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '35%' }}>함수</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>역할</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {edgeFunctions.map((row) => (
                <TableRow key={row.fn}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.fn}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{row.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="5단계 — 프론트엔드 전환" />
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            · usePaidAdsStore를 localStorage 단독에서 Supabase 클라이언트 호출(src/hooks/data/)로 전환 — component-work 스킬로 "Connect Meta Account"/"Connect TikTok Account" 버튼과 연결 상태 UI를 만든다.
          </Typography>
          <Typography variant="body2">
            · mock 데이터(paidAdsMockData.js)는 Storybook 전용으로 남기고, 실제 페이지는 Supabase 훅을 사용하도록 분리한다.
          </Typography>
        </Box>

        <SectionTitle title="6단계 — 동기화 스케줄" />
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            · <strong>자동</strong>: Supabase pg_cron으로 sync-campaigns(1일 1회), sync-performance(진행중 캠페인 매일 + 종료 후 7일간) Edge Function을 호출.
          </Typography>
          <Typography variant="body2">
            · <strong>수동</strong>: 헤더의 "Sync now" 버튼으로 즉시 Edge Function 호출 — App Review 승인 전이나 급할 때 유용.
          </Typography>
        </Box>

        <SectionTitle title="성과 지표 필드 매핑" description="performance_records ↔ 플랫폼 Insights" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>우리 필드</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Meta Graph API Insights</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>TikTok Report</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fieldMapping.map((row) => (
                <TableRow key={row.ours}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{row.ours}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.meta}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.tiktok}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="지금 바로 시작할 수 있는 것" />
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>· /project-planning 호출 → 02-ux-flow.md 작성(신규 엔티티 포함)</Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>· Meta for Developers / TikTok for Business 앱 등록 + App Review 제출(승인 대기 중에도 아래 항목 병행 가능)</Typography>
          <Typography variant="body2">· Supabase 프로젝트 생성(무료 티어로 충분) → /supabase-integration 호출해서 스키마·Auth·RLS부터 진행</Typography>
        </Box>

        <SectionTitle title="사용자가 직접 해야 하는 것" description="외부 절차, 대행 불가" />
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>· Meta/TikTok 개발자 계정 생성 및 앱 등록, App Review 제출</Typography>
          <Typography variant="body2">· Supabase 계정 생성, 프로젝트 시크릿에 Client ID/Secret 등록</Typography>
        </Box>
      </PageContainer>
    </>
  ),
};
