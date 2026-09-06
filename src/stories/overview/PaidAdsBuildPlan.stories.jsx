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

/* Recap(캠페인 종료 후 결과 보고, 2026-09 계획) — 같은 Tier 규칙으로 생성 순서를 잡는다.
   1단계는 DB 변경 없이 화면과 계산만, 2단계에서 테이블 2개, 3단계는 내보내기·다국어. */
const recapTiers = [
  { tier: '0', components: 'BenchmarkDelta, VerdictChip', category: 'data-display', dep: '없음 (원자) — 1단계', phase: '1' },
  { tier: '1', components: 'RecapCampaignTable', category: 'data-display', dep: 'Tier 0 + PerformanceReportTable 열 정의 공유 — 1단계', phase: '1' },
  { tier: '2', components: 'Print stylesheet (@media print)', category: 'PaidAdsShell', dep: '없음 — 1단계', phase: '1' },
  { tier: '3', components: 'RecapNoteEditor', category: 'templates', dep: 'event_recaps · recap_campaign_notes 테이블 + 로그인 게이트 — 2단계', phase: '2' },
  { tier: '4', components: 'LanguageSwitch, Excel export', category: 'input, utils', dep: '언어별 문자열 표 · LocalizedText 칸 — 3단계', phase: '3' },
];

const recapLogic = [
  { block: 'schema.js 벤치마크 함수 (순수)', content: 'buildBenchmarkPeers(campaign, allCampaigns) — 같은 platform + 같은 단계 이름(→ goal → not enough data 순 fallback), 2024년 이후만 · benchmarkStats(values, value, lowerIsBetter) — 중앙값·백분위·N · suggestVerdict(percentiles, goal) — 상위 30% good / 하위 30% bad' },
  { block: '페이지 (Tier 5)', content: 'RecapPage(목록) · RecapDetailPage(/recap/:event) — Reports의 buildPhaseTimeline·goalRows 계산을 재사용, 레일에 Recap 메뉴 추가' },
  { block: 'Recap 문자열 표', content: 'recapStrings.js — { en, ko, "zh-Hant" } 키로 화면 문구. 1단계는 en만 채우고 나머지 키는 비워둔다(빈 값이면 en으로 대체)' },
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

        <SectionTitle title="Recap 생성 계획 (2026-09 추가)" description="캠페인 종료 후 결과 보고 — 02 UX Flow 시나리오 7. 같은 Tier 규칙, 단계별로 나눠 만든다" />
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '8%' }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>컴포넌트</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '16%' }}>카테고리</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '32%' }}>의존 / 단계</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recapTiers.map((t) => (
                <TableRow key={`recap-${t.tier}`}>
                  <TableCell>
                    <Chip label={`Tier ${t.tier}`} size="small" variant="outlined" color={t.phase === '1' ? 'primary' : 'default'} sx={{ borderRadius: (th) => `${th.shape.radius.control}px` }} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.components}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{t.category}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{t.dep}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TableContainer sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '25%' }}>로직 레이어</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>내용</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recapLogic.map((b) => (
                <TableRow key={b.block}>
                  <TableCell sx={{ fontWeight: 600 }}>{b.block}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{b.content}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          1단계(Tier 0~2 + 페이지)는 DB 변경이 없어 먼저 배포할 수 있다. 2단계는 마이그레이션 2개(event_recaps · recap_campaign_notes, anon read + owner write RLS)와 Recap 편집에서만 켜는 로그인 게이트가 선행 조건이다. 3단계의 AI 초안/번역(Claude API)은 Edge Function으로 두고 프론트는 결과만 받는다.
        </Typography>

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
