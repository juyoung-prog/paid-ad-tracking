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
  title: 'Overview/Paid Ads Dashboard/04. Build Plan',
  parameters: {
    layout: 'padded',
  },
};

const schemaBlocks = [
  { block: 'JSDoc @typedef', content: 'Store, AdAccount, Campaign, PerformanceRecord, Alert — ux-flow 문서 필드 그대로' },
  { block: 'Enum 상수 (Object.freeze)', content: 'PLATFORM, REGION, STORE_STATUS, TARGET_SCOPE, GOAL, CAMPAIGN_STATUS, MANUAL_STATUS, ALERT_TYPE' },
  { block: '파생/계산 함수 (순수 함수)', content: 'getComputedStatus, getEffectiveStatus, calcCPM, calcCTR, calcCPC, calcHookRate, calcHoldRate, calcEngagementRate, calcCPA, shouldTriggerOverlapAlert' },
  { block: '(선택) 검증 함수', content: 'isValidCampaign 등 — MVP에서는 생략 가능, 필요 시 후속 추가' },
];

const tiers = [
  { tier: '0', components: 'StoreMultiSelect, PacingIndicator', category: 'input, data-display', dep: '없음 (원자)' },
  { tier: '1', components: 'CampaignCard(CustomCard 수정), KpiBar, AlertBanner, LastUpdatedBar', category: 'card, data-display, layout', dep: '없음 (props만 받음)' },
  { tier: '2', components: 'StoreBreakdown, CampaignSummaryGrid', category: 'data-display', dep: 'Tier 1 카드형 요소 조합' },
  { tier: '3', components: 'CampaignForm, PerformanceForm', category: 'templates', dep: 'Tier 0 입력요소 조합, goal 기반 조건부 필드' },
  { tier: '4', components: 'FilterBar 수정', category: 'templates', dep: '없음 (옵션 세트만 교체)' },
];

/* ────────────────────────────────────────────────────────────────
   Recap(캠페인 종료 후 결과 보고) 생성 계획 — 2026-09.
   02 UX Flow 시나리오 7을 입력으로, 위와 같은 원칙(데이터는 schema.js 한 파일,
   컴포넌트는 props만)으로 Phase를 의존 순서대로 잡는다.
   진행: Phase 1~6 전부 구현됨 — 2026-09-06. Phase 5는 마이그레이션 20 적용, Phase 6은
   recap-draft 함수 배포 + ANTHROPIC_API_KEY 시크릿이 선행 조건.
   ──────────────────────────────────────────────────────────────── */

/** schema.js에 추가할 타입 — 전부 JSDoc @typedef. 저장되는 것과 계산 전용을 나눈다. */
const recapTypes = [
  { name: 'LocalizedText', kind: '저장', fields: '{ en: string, ko: string|null, "zh-Hant": string|null }', note: '영어 필수. 비어 있는 언어는 화면에서 en으로 대체하고 isFallback 표시' },
  { name: 'EventRecap', kind: '저장', fields: 'id, ownerId, eventName, status(RECAP_STATUS), summary: LocalizedText|null, learnings: Array<{ title: LocalizedText, body: LocalizedText }>, nextSteps: LocalizedText|null, createdAt, updatedAt', note: 'eventName = Campaign.campaignGroup. 이벤트당 1건' },
  { name: 'RecapCampaignNote', kind: '저장', fields: 'id, recapId, campaignId, verdict: VERDICT|null, strength / weakness / reason: LocalizedText|null, organicViews: number|null, organicEngagements: number|null', note: '캠페인당 1건. verdict가 null이면 화면은 suggestedVerdict를 점선 칩으로' },
  { name: 'BenchmarkStat', kind: '계산 전용', fields: 'metricKey, value: number|null, median: number|null, percentile: number|null(0~100, "높을수록 좋음"으로 정규화), sampleSize: number, lowerIsBetter: boolean, peerScope: "phase"|"goal"|"none"', note: 'sampleSize < BENCHMARK_MIN_PEERS면 median/percentile null, peerScope "none" → 컴포넌트는 not enough data' },
  { name: 'RecapCampaignRow', kind: '계산 전용', fields: 'getGoalMetricsRow(...)의 모든 필드 + storeCode, phaseName, dailyBudget, rank, benchmarks: Record<metricKey, BenchmarkStat>, budgetEfficiency(Primary KPI), kpiTarget(vs target), note: RecapCampaignNote|null', note: '표 한 행. 정렬·순위까지 끝난 상태로 컴포넌트에 내려간다' },
  { name: 'RecapHeadline', kind: '계산 전용', fields: '{ metricKey, rank, total, peerEvents: string[] } | null', note: '머리글 한 줄("역대 오프닝 5개 중 CPM 2위")의 재료. 문장은 recapStrings가 만든다' },
];

/** schema.js 상수 — 기존 Object.freeze 패턴 그대로 */
const recapEnums = [
  { name: 'RECAP_STATUS', value: "{ DRAFT: 'draft', FINAL: 'final' }" },
  { name: 'VERDICT', value: "{ GOOD: 'good', MID: 'mid', BAD: 'bad' }" },
  { name: 'RECAP_LANG', value: "{ EN: 'en', KO: 'ko', ZH_HANT: 'zh-Hant' } + RECAP_DEFAULT_LANG = 'en'" },
  { name: 'BENCHMARK_METRICS', value: "[cpm, cpc, cpa, cpe(지출 ÷ 좋아요+댓글+공유), ctr, hookRate, holdRate, engagementRate] — 비율 지표만, 비용 지표는 lowerIsBetter" },
  { name: 'GOAL_HEADLINE_METRICS', value: "{ awareness: ['cpm'], traffic: ['cpc'], engagement: ['cpe'], conversion: ['cpa'], store_visit: ['cpa'] } — goal별 대표 KPI 하나(2026-09-07). Efficiency 배지·순위·Key takeaways·머리글이 공유. Hook/Hold/CTR/참여율은 진단 지표" },
  { name: 'BENCHMARK_MIN_PEERS / BENCHMARK_SINCE', value: "3 / '2024-01-01' — 비교군 최소 수, 비교 대상 시작일(2023년 이전은 지표가 거의 없다)" },
  { name: 'VERDICT_PERCENTILE', value: '{ good: 70, bad: 30 } — 벤치마크 구간(band top/bottom) 경계: 백분위 70 이상 top, 30 이하 bottom. 셀 ↗↘ 색과 해석(What worked / Could improve)이 쓴다' },
  { name: 'budgetEfficiency(row, goal)', value: "→ { metricKey, value } — 표의 Primary KPI — 이 캠페인의 목표별 결과당 현재 비용(판단 없음). vs target(kpiTarget)·vs past(benchmarks)·집행률(pacingRatio)과 층을 나눈다. 종합 등급은 없다(2026-09-08 제품 결정)" },
];

/** schema.js 순수 함수 — 입력/출력만 적는다. 컴포넌트는 이 결과를 props로 받을 뿐 안에서 다시 계산하지 않는다. */
const recapFunctions = [
  { name: 'phaseNameOf(campaign)', io: 'Campaign → string', note: '캠페인명에서 매장 코드 접두사(G10_)와 기간 접미사(_0617~0707)를 뗀 단계 이름("Grand Opening"). 지금 PhaseTimelineChart.displayName과 ReportSummarySection.buildPhaseTimeline에 나뉘어 있는 규칙을 여기로 올리고 둘이 이걸 쓰게 한다(기존 스토리 통과 확인)' },
  { name: 'buildBenchmarkPeers(campaign, allCampaigns, { since, region })', io: '→ { peers: Campaign[], scope: "phase"|"goal"|"none" }', note: '같은 platform + 같은 phaseNameOf + 다른 campaignGroup + startDate ≥ since. 3개 미만이면 같은 platform + 같은 goal로, 그래도 미만이면 scope "none". region을 주면 같은 지역 계정만' },
  { name: 'median(values)', io: 'number[] → number|null', note: '빈 배열이면 null' },
  { name: 'percentileRank(values, value, lowerIsBetter)', io: '→ number|null (0~100)', note: '"높을수록 좋음"으로 정규화 — CPM·CPC는 뒤집는다. 동점은 절반으로 센다' },
  { name: 'benchmarkStat(metricKey, value, peerRows)', io: '→ BenchmarkStat', note: 'peerRows는 getGoalMetricsRow 결과 배열. null 값은 표본에서 뺀다' },
  { name: 'buildRecapRows(eventName, campaigns, records, options)', io: '→ { byPlatform: Record<platform, RecapCampaignRow[]>, peerEvents: string[] }', note: '이벤트 캠페인마다 getGoalMetricsRow → benchmarks → budgetEfficiency → 플랫폼별로 대표 지표 백분위 순 정렬 후 rank 부여. notesById를 주면 note를 붙인다' },
  { name: 'buildRecapHeadline(eventName, rows, allCampaigns, records)', io: '→ RecapHeadline|null', note: '같은 단계 구성의 다른 이벤트들과 이벤트 단위 대표 지표(지출 가중)를 비교해 순위. 이벤트가 3개 미만이면 null' },
  { name: 'localizedText(text, lang)', io: 'LocalizedText|null, RECAP_LANG → { value: string, isFallback: boolean }', note: '요청 언어가 비면 en. 컴포넌트는 이 결과만 받는다(언어 판단을 컴포넌트가 하지 않는다)' },
  { name: 'recapStrings (src/data/recapStrings.js, 별도 파일)', io: 't(key, lang, params) → string', note: '화면 문구 표 { key: { en, ko, "zh-Hant" } }. 1단계는 en만 채우고 나머지는 빈 값(→ en 대체). 문장 조립("Top 25% of 12 similar campaigns")은 여기서만' },
];

/** paidAdsMockData.js 추가분 — 스토리가 벤치마크 숫자와 not enough data 양쪽을 다 보여줄 수 있어야 한다 */
const recapMock = [
  { name: 'mockEventRecaps', content: "'G10 Opening' draft 1건 — summary·learnings 2개·nextSteps, en만 채우고 ko/zh-Hant는 null(fallback 표시 확인용)" },
  { name: 'mockRecapCampaignNotes', content: '캠페인 3건 — verdict good/null/bad, strength·weakness·reason, organicViews는 1건만' },
  { name: '비교군 캠페인 + 레코드', content: "BF4 Opening(2026-04)·BF3 Opening(2025-10)·G09 Opening(2025-06)의 Grand Opening / Coming Soon 캠페인 — Meta는 단계별 3개 이상(숫자가 나온다), TikTok Coming Soon은 2개(not enough data가 나온다)" },
];

/** 컴포넌트/페이지 Phase — 의존 순서. 앞 Phase가 끝나야 다음이 시작된다. */
const recapPhases = [
  {
    phase: '1', title: '데이터 레이어 (구현됨)', stage: '1단계', deps: '없음',
    items: [
      'schema.js — 위 타입·상수·함수 추가. phaseNameOf로 PhaseTimelineChart·ReportSummarySection 리팩토링(동작 동일, 기존 스토리 통과)',
      'paidAdsMockData.js — 위 목 데이터',
      'recapStrings.js — en 문구 표',
      '검증: Storybook "Test Data" 카테고리에 벤치마크 계산 결과를 표로 찍는 스토리 하나(컴포넌트 없이 함수만)',
    ],
  },
  {
    phase: '2', title: '원자 컴포넌트 (Tier 0, 구현됨)', stage: '1단계', deps: 'Phase 1의 BenchmarkStat 타입',
    items: [
      'BenchmarkDelta — data-display. props: stat(BenchmarkStat), formattedValue(string), label(string), size("sm"|"md"). 중앙값 대비 화살표·백분위·N, sampleSize 부족이면 not enough data. KpiBar delta와 같은 화살표·톤 문법',
      'VerdictChip — data-display. props: verdict(VERDICT|null), lang. good=success / mid=중립 / bad=warning 옅은 틴트 + 옅은 실선 테두리. 자동 등급을 없앤 뒤(2026-09-08 제품 결정) 표·편집기에서는 쓰지 않는다 — 사람이 고른 평가를 보여줄 자리가 생기면 다시 쓴다',
    ],
  },
  {
    phase: '3', title: '조합 컴포넌트 (Tier 1, 구현됨)', stage: '1단계', deps: 'Phase 2',
    items: [
      'RecapCampaignTable — data-display. props: rows(RecapCampaignRow[]), platform, lang, onRowClick?. 열: 순위·매장·캠페인·일예산·지출·판정·영상 반응(Reach / Hook·Hold / 조회)·참여 반응·행동. 각 비율 지표 셀에 BenchmarkDelta. PerformanceReportTable의 COLUMN 정의를 공유 모듈로 뽑아 같이 쓴다',
      'RecapHeader — data-display. props: event, dateRange, stores, platforms, spend, plannedBudget, headline(RecapHeadline|null), lang. KpiBar 재활용 + 순위 한 줄',
    ],
  },
  {
    phase: '4', title: '페이지 조립 + 인쇄 (Tier 5, 구현됨) — 1단계 마감', stage: '1단계', deps: 'Phase 3',
    items: [
      'RecapPage(/recap) — 이벤트 목록: campaignGroup별 기간·캠페인 수·지출·Recap 상태. usePaidAdsStore 재사용',
      'RecapDetailPage(/recap/:event) — buildRecapRows·buildRecapHeadline 호출은 여기(페이지)까지만. PhaseTimelineChart 읽기 전용 재활용. 하단에 2단계 자리(코멘트·배운 점)는 비워둔다',
      'PaidAdsRail에 메뉴(처음 이름 Recap → 2026-09-07 Reports로 개명, 기존 Reports는 Performance. 내부 경로 /recap·/reports는 그대로), App.jsx 라우트 2개, useViewUrlSync에 lang 파라미터 자리',
      '@media print — PaidAdsShell 레벨: 레일·툴바 숨김, 섹션 카드 page-break-inside: avoid, 표 폭 축소. 브라우저 인쇄 = PDF',
      'Storybook: Page 카테고리에 RecapPage/RecapDetailPage 스토리(목 데이터), 인쇄 미리보기 스토리',
    ],
  },
  {
    phase: '5', title: '코멘트·배운 점 저장 (구현됨) — 2단계', stage: '2단계', deps: 'Phase 4 + 마이그레이션 20',
    items: [
      '마이그레이션 2개 — event_recaps, recap_campaign_notes: owner_id 기본값 auth.uid(), anon read 정책(00000000000019 방식), owner write. LocalizedText는 jsonb',
      'usePaidAdsStore — recaps/notes 읽기 + upsert 함수. 저장 실패는 BackendErrorBanner 문법 그대로',
      'RecapNoteEditor — templates. props: note(RecapCampaignNote|null), campaignLabel, lang, onChange, isDisabled. 평가는 사람이 고르는 것만(자동 제안 없음, 2026-09-08). 읽기/편집이 같은 자리, 인쇄는 읽기 모드',
      'RecapLearningsEditor — templates. props: learnings, nextSteps, lang, onChange. 카드 추가·삭제·순서',
      '로그인 게이트 — Recap 편집 버튼에서만 켠다(읽기는 그대로 공개). 지금 꺼둔 LoginPage 재사용',
    ],
  },
  {
    phase: '6', title: '내보내기·다국어·초안 (구현됨) — 3단계', stage: '3단계', deps: 'Phase 5 + recap-draft 배포',
    items: [
      'LanguageSwitch — input. props: value(RECAP_LANG), onChange. Select 드롭다운, ?lang= 동기화. recapStrings에 ko / zh-Hant 채움',
      'PeerCompareDialog — templates. 벤치마크 글자를 누르면 비교군 캠페인을 나란히(schema.js buildPeerComparison). Reports goal 표에는 열 정렬(TableSortLabel) 추가',
      'Google Sheets 내보내기 — utils/recapSheets.js. 표를 탭 구분 텍스트로 클립보드에 복사하고 sheets.new를 연다(Google 계정 없이 시트를 직접 만들 수는 없다 — OAuth 연동은 별도 단계). 한때 exceljs Excel이었는데 Google Sheets로 바꿈(사용자 결정, 2026-09). ExportMenu 드롭다운에 PDF(인쇄)와 함께',
      'AI 초안/번역 — Edge Function(recap-draft): 숫자·벤치마크를 주면 strength/weakness/reason 초안과 ko/zh-Hant 번역을 돌려준다. 프론트는 결과를 에디터에 채우기만, 최종 문장은 사람이 다듬는다',
      'RecapNoteEditor에 organicViews/organicEngagements 선택 입력 칸',
    ],
  },
  {
    phase: '7', title: '임원용 다듬기 (구현됨) — 2026-09-07', stage: '다듬기', deps: 'Phase 6',
    items: [
      'Key takeaways → RecapTakeaways 세 칸(BEST RESULT · ATTENTION · NEXT MOVE): schema.js buildRecapExecutiveSummary()가 기존 takeaways 재료를 합성. 라벨 → 16px 결론 → 12px 근거, 플랫폼 CPM 차이는 NEXT MOVE의 근거',
      '캠페인 해석 → 표의 네 열(What worked · Could improve · Why · Next action, 2026-09-08 — 드로어의 Campaign insights를 표로 옮겨 현재 지표 → 과거 맥락 → 해석 → 다음 행동을 가로로 읽는다. 한때 줄 아래 펼침 → 드로어 섹션이었다). 한 문장씩, 순위 근거만. schema.js buildCampaignInsight()가 벤치마크 구간에서만 재료를 만들고 원인은 지어내지 않는다. 표의 숫자 줄 전체 클릭 = 드로어, 타임라인 행 클릭 = 그 줄로 스크롤 + 선택 표시',
      'Learnings → RecapPatterns 플레이북: KEEP · USE SELECTIVELY · IMPROVE · VALIDATE 2×2(상태 → 제목(행동) → 근거) + NEXT EVENT 두 문장(결정 + 집행 중 검증). schema.js buildRecapPlaybook()이 buildRecapPatterns() 재료(캠페인 2개 이상 같은 방향, 양쪽 2개 이상이면 mixed, 플랫폼 CPM·CTR 차이)를 행동으로 합성 — 회고 요약은 Key takeaways가 맡는다. 방법론은 카드 제목 ⓘ 툴팁',
      '기호·배지: ▲▼ → BenchmarkArrow(↗↘ 얇은 선), Efficiency 배지는 틴트 + 옅은 실선(점선 제거), ScrollArea edgeStrength="subtle"',
      '내비 이름: Reports → Performance, Recap → Reports(레일·목록 제목·"All reports"·저장 알림). 내부 경로 유지',
      'recap-draft SYSTEM 프롬프트도 같은 규칙(원인 지어내지 않기, 이벤트 범위) — 바꾼 뒤 재배포 필요',
    ],
  },
];

const recapChecklist = [
  '중앙값·백분위·순위·목표 결과는 schema.js에서만 계산한다 — BenchmarkDelta·RecapCampaignTable은 계산 결과(BenchmarkStat, RecapCampaignRow)만 받아 표기만 한다',
  '언어 대체(빈 ko → en)는 localizedText()가 정하고 컴포넌트는 { value, isFallback }만 받는다',
  '문장 조립("Top 25% of 12")은 recapStrings.js에서만 — 컴포넌트 안에 영어 문자열 리터럴을 두지 않는다',
  '페이지(RecapDetailPage)만 schema.js 함수를 호출한다. 컴포넌트 파일은 schema.js를 import하지 않는다(스토리는 예외)',
  '1단계는 DB 변경 0건 — Phase 1~4가 끝나면 마이그레이션 없이 배포 가능해야 한다',
  '기존 Reports·PhaseTimelineChart 스토리가 phaseNameOf 리팩토링 후에도 그대로 통과한다',
];

const checklist = [
  'schema.js에 React import 없음 (순수 JS 로직만)',
  '컴포넌트 파일에서 mock 데이터 직접 import 안 함 (스토리 파일만 예외)',
  '컴포넌트가 날짜 비교·나눗셈 등 계산을 직접 하지 않고 계산된 값을 props로만 받음',
  '파일당 컴포넌트 하나 원칙 유지',
];

/** Documentation */
export const Doc = {
  render: () => (
    <>
      <DocumentTitle
        title="Build Plan"
        status="Planned"
        note="Paid Ads Tracking Dashboard — data/component layer separation and creation order"
        brandName="BeautyMaster"
        systemName="Paid Ads Dashboard"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          데이터 모델 &amp; 컴포넌트 생성 계획
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          UX Flow(02번 문서) 기반. 이 프로젝트가 이미 문서화한 "레이어 분리 원칙"(Overview/Introduction — UI Layer vs Logic Layer)을 데이터/컴포넌트 분리의 근거로 그대로 적용한다. 아직 구현 전, 계획 단계.
        </Typography>

        <SectionTitle title="원칙" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '25%', verticalAlign: 'top' }}>schema.js 미참조</TableCell>
                <TableCell>컴포넌트는 schema.js를 직접 import하지 않는다 (Storybook 스토리 파일은 mock 데이터를 주입해야 하므로 예외). 컴포넌트는 오직 props 인터페이스만 안다.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>schema.js는 정의만</TableCell>
                <TableCell>JSDoc 타입, enum 상수, 순수 계산 함수만 포함. 실제 목/샘플 데이터 값은 별도 파일.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>컴포넌트는 계산하지 않음</TableCell>
                <TableCell>effectiveStatus, CPM, Hook Rate 같은 파생값은 항상 상위에서 계산되어 prop으로 내려온다. 컴포넌트 안에서 날짜 비교나 나눗셈을 하지 않는다.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="데이터 레이어 계획" description="src/data/schema.js — 단일 파일, 4개 블록" />
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '25%' }}>블록</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>내용</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schemaBlocks.map((b) => (
                <TableRow key={b.block}>
                  <TableCell sx={{ fontWeight: 600 }}>{b.block}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{b.content}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Mock 데이터 (schema.js와 별도 파일)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          <Box component="code" sx={{ fontFamily: 'monospace', fontSize: 12 }}>src/data/paidAdsMockData.js</Box> — 스토리/화면 검증용 샘플 Store·Campaign·PerformanceRecord·Alert.
          schema.js의 enum/타입 구조를 따르되 실제 값("Morrow Grand Opening" 등)은 이 파일에만 둔다. 나중에 실 API/DB로 교체될 때 schema.js는 그대로 재사용되고 이 파일만 갈아끼우면 된다.
          이 저장소의 src/data/는 기존에도 flat 구조(ruleRelationships.js, layoutTaxonomyData.js 등)라 그 컨벤션을 따른다.
        </Typography>

        <SectionTitle title="컴포넌트 레이어 계획" description="생성 순서(Tier) — 의존관계 없는 것부터" />
        <TableContainer sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '8%' }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>컴포넌트</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>카테고리</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '25%' }}>의존</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiers.map((t) => (
                <TableRow key={t.tier}>
                  <TableCell>
                    <Chip label={`Tier ${t.tier}`} size="small" variant="outlined" color="primary" sx={{ borderRadius: (t) => `${t.shape.radius.control}px` }} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.components}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{t.category}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{t.dep}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Tier 5(컴포넌트 생성 범위 밖): DashboardPage/StoresPage/ReportsPage 조립, 상태관리, 라우팅 — "컴포넌트"가 아니라 로직 레이어라서 이 계획에서 제외하고 별도로 다룬다.
        </Typography>

        <SectionTitle title="실행 순서" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableBody>
              <TableRow><TableCell sx={{ width: '5%', fontWeight: 600 }}>1</TableCell><TableCell>schema.js 작성 (모든 작업의 기반)</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>2</TableCell><TableCell>paidAdsMockData.js 작성 (schema 구조 준수)</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>3</TableCell><TableCell>Tier 0 → 1 → 2 → 3 → 4 순으로 component-work 스킬을 통해 개별 생성 (각 컴포넌트마다 스토리 동시 작성, components.md 갱신)</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>4</TableCell><TableCell>Tier 5(페이지 조립/상태관리)는 컴포넌트가 다 만들어진 뒤 별도 계획</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="Recap 생성 계획 (2026-09 추가)" description="캠페인 종료 후 결과 보고 — 02 UX Flow 시나리오 7. 데이터는 schema.js 한 파일, 컴포넌트는 props만. Phase 1~6 구현됨(2026-09-06)" />

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>① schema.js 타입 (JSDoc @typedef)</Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '18%' }}>타입</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '9%' }}>구분</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>필드</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '28%' }}>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recapTypes.map((t) => (
                <TableRow key={t.name}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.name}</TableCell>
                  <TableCell><Chip label={t.kind} size="small" variant="outlined" color={t.kind === '저장' ? 'primary' : 'default'} sx={{ borderRadius: (th) => `${th.shape.radius.control}px` }} /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.fields}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{t.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>② schema.js 상수 (Object.freeze)</Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small">
            <TableBody>
              {recapEnums.map((e) => (
                <TableRow key={e.name}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, width: '25%' }}>{e.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{e.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>③ schema.js 순수 함수 — 입력 → 출력</Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '30%' }}>함수</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '22%' }}>입력 → 출력</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>규칙</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recapFunctions.map((f) => (
                <TableRow key={f.name}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{f.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{f.io}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{f.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>④ 목 데이터 (paidAdsMockData.js)</Typography>
        <TableContainer sx={{ mb: 3 }}>
          <Table size="small">
            <TableBody>
              {recapMock.map((m) => (
                <TableRow key={m.name}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, width: '25%' }}>{m.name}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{m.content}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>⑤ 생성 순서 — Phase 1 → 6 (의존 순)</Typography>
        <TableContainer sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '9%' }}>Phase</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '18%' }}>이름 / 단계</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>만드는 것 (컴포넌트는 props만 적는다)</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '15%' }}>의존</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recapPhases.map((ph) => (
                <TableRow key={ph.phase}>
                  <TableCell>
                    <Chip label={`Phase ${ph.phase}`} size="small" variant="outlined" color={ph.stage === '1단계' ? 'primary' : 'default'} sx={{ borderRadius: (th) => `${th.shape.radius.control}px` }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    <Box sx={{ fontWeight: 600 }}>{ph.title}</Box>
                    <Box sx={{ fontSize: 12, color: 'text.secondary' }}>{ph.stage}</Box>
                  </TableCell>
                  <TableCell>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {ph.items.map((it) => (
                        <Typography component="li" variant="body2" key={it} sx={{ mb: 0.5, fontSize: 12.5 }}>{it}</Typography>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{ph.deps}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Phase 1~4가 1단계다 — DB 변경이 없어 먼저 배포할 수 있다. Phase 5는 마이그레이션 2개와 Recap 편집에서만 켜는 로그인 게이트가 선행 조건. Phase 6의 AI 초안/번역은 Edge Function으로 두고 프론트는 결과만 받는다.
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>⑥ Recap 분리 원칙 체크리스트</Typography>
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableBody>
              {recapChecklist.map((c) => (
                <TableRow key={c}>
                  <TableCell sx={{ fontSize: 13 }}>{c}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="분리 원칙 체크리스트" />
        <TableContainer>
          <Table size="small">
            <TableBody>
              {checklist.map((c) => (
                <TableRow key={c}>
                  <TableCell>{c}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageContainer>
    </>
  ),
};
