import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DocumentTitle, PageContainer, SectionTitle } from '../../components/storybookDocumentation';
import {
  buildRecapRows,
  buildRecapHeadline,
  phaseNameOf,
  localizedText,
  BENCHMARK_METRICS,
  RECAP_LANG,
} from '../../data/schema';
import { t, metricLabel } from '../../data/recapStrings';
import { mockRecapCampaigns, mockRecapPerformanceRecords, mockEventRecaps, mockRecapCampaignNotes } from '../../data/paidAdsMockData';
import { money, percent } from '../../utils/format';

export default {
  title: 'Test Data/Recap Benchmark',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## Recap 벤치마크 — 함수만 검증

Build Plan Phase 1의 검증 스토리. 컴포넌트 없이 \`schema.js\`의 Recap 함수
(\`buildRecapRows\` · \`buildRecapHeadline\` · \`phaseNameOf\` · \`localizedText\`)와
\`recapStrings.t\`를 목 데이터에 돌려 결과를 표로 찍는다. Phase 2~4의 컴포넌트는
이 표의 숫자를 그대로 받아 그리므로, 여기 숫자가 틀리면 아래 전부가 틀린다.

### 확인 포인트
- 비교군 사슬(2026-09-07): 같은 플랫폼 + 같은 goal + 같은 단계(다른 이벤트) → 같은 플랫폼 + 같은 goal → 3개 미만이면 \`none\`
- Meta 줄 중 같은 goal 비교군이 3개 이상인 것만 scope \`phase\`/\`goal\`, 나머지는 \`none\`(전부 \`not enough data\`)
- 비용 효율(budgetEfficiency) = goal별 KPI(cpm/cpc/cpe/cpa) 값 그 자체 — 과거·비교군 무관
- 종합 성과(overall) = buildOverallPerformance: 목표(OVERALL_RULES)의 primary 지표 구간이 등급을 정하고(top → STRONG · mid → AVERAGE · bottom → WEAK) secondary 구간이 한 단만 움직인다. 구간은 benchmarks.band(과거 비교군) — 고정 문턱 없음. primary 구간이 없으면 rating null + reason insufficient. strengths/weaknesses = 중요도 순 top/bottom 지표 키. 사람이 고른 note.verdict가 우선
- 과거 비교 = benchmarks: 비교군 3개 미만이면 순위 없음 — 억지로 만들지 않는다
- cpe = 지출 ÷ (좋아요+댓글+공유)
- 순위는 플랫폼 안에서 대표 지표 백분위 순
- 머리글: 같은 단계가 겹치는 이벤트 5개 중 CPM 순위
- localizedText: ko를 요청하면 en으로 대체하고 isFallback=true
        `,
      },
    },
  },
};

const fmt = (key, v) => {
  if (v == null) return '—';
  if (['cpm', 'cpc', 'cpa'].includes(key)) return money(v);
  return percent(v, { digits: 2 });
};

function BenchmarkTable() {
  const notesById = Object.fromEntries(mockRecapCampaignNotes.map((n) => [n.campaignId, n]));
  const { byPlatform, peerEvents } = buildRecapRows('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords, { notesById });
  const headline = buildRecapHeadline('G10 Opening', mockRecapCampaigns, mockRecapPerformanceRecords);
  const recap = mockEventRecaps[0];
  const koSummary = localizedText(recap.summary, RECAP_LANG.KO);

  return (
    <>
      <DocumentTitle
        title="Recap Benchmark"
        status="Test Data"
        note="schema.js Recap functions run against mock data — no components"
        brandName="BeautyMaster"
        systemName="Paid Ads Dashboard"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Recap 벤치마크 계산 결과</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          G10 Opening · 비교군 이벤트: {peerEvents.join(', ') || '없음'}
        </Typography>

        <SectionTitle title="머리글 순위 (buildRecapHeadline)" />
        <Typography variant="body2" sx={{ mb: 4 }}>
          {headline
            ? `${t(headline.rank === 1 ? 'recap.headline.best' : 'recap.headline.rank', RECAP_LANG.EN, { rank: headline.rank, total: headline.total, metric: metricLabel(headline.metricKey) })} — ${headline.peerEvents.join(' > ')}`
            : 'null (비교 이벤트 3개 미만)'}
        </Typography>

        {Object.entries(byPlatform).map(([platform, rows]) => (
          <Box key={platform} sx={{ mb: 4 }}>
            <SectionTitle title={`${platform} — buildRecapRows`} description="행마다 지표 값 / 중앙값 / 백분위 / N / scope" />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Phase (phaseNameOf)</TableCell>
                    <TableCell>Goal</TableCell>
                    <TableCell>Spend</TableCell>
                    {BENCHMARK_METRICS.map((m) => <TableCell key={m.key}>{metricLabel(m.key)}</TableCell>)}
                    <TableCell>Overall</TableCell>
                    <TableCell>Note verdict</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.campaignId}>
                      <TableCell>{r.rank}</TableCell>
                      <TableCell>{r.phaseName}<Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>{r.name}</Typography></TableCell>
                      <TableCell>{r.goal}</TableCell>
                      <TableCell>{money(r.spend)}</TableCell>
                      {BENCHMARK_METRICS.map((m) => {
                        const b = r.benchmarks[m.key];
                        return (
                          <TableCell key={m.key} sx={{ fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>
                            {fmt(m.key, b.value)}
                            <Box component="span" sx={{ display: 'block', color: 'text.secondary' }}>
                              {b.peerScope === 'none' ? t('benchmark.notEnough') : `med ${fmt(m.key, b.median)} · p${b.percentile} · n${b.sampleSize} · ${b.peerScope}`}
                            </Box>
                          </TableCell>
                        );
                      })}
                      <TableCell>{r.overall?.rating ?? r.overall?.reason ?? 'null'}{r.overall?.strengths?.length ? ` +${r.overall.strengths.join(',')}` : ''}{r.overall?.weaknesses?.length ? ` −${r.overall.weaknesses.join(',')}` : ''}</TableCell>
                      <TableCell>{r.note?.verdict ?? (r.note ? 'null' : '(no note)')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        <SectionTitle title="localizedText / phaseNameOf" />
        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ width: '30%' }}>summary (ko 요청)</TableCell>
                <TableCell>{koSummary.value} — isFallback: {String(koSummary.isFallback)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>summary (en 요청)</TableCell>
                <TableCell>isFallback: {String(localizedText(recap.summary, RECAP_LANG.EN).isFallback)}</TableCell>
              </TableRow>
              {['G10_Coming Soon_0617~0707', 'BF4_1MonthDeals_0417~0531', 'Instagram post: COMING SOON', 'G09 Grand Opening 0615 ~ 0710'].map((name) => (
                <TableRow key={name}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{name}</TableCell>
                  <TableCell>{phaseNameOf(name)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageContainer>
    </>
  );
}

/** 함수 결과 표 — Phase 2~4 컴포넌트가 받을 숫자 그대로 */
export const Default = {
  render: () => <BenchmarkTable />,
};
