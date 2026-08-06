import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import { DocumentTitle, PageContainer, SectionTitle } from '../../components/storybookDocumentation';

export default {
  title: 'Overview/Paid Ads Dashboard/01. Project Summary',
  parameters: {
    layout: 'padded',
  },
};

const features = [
  { name: '광고 현황 대시보드', desc: '진행중/예정/종료 광고를 플랫폼(메타/틱톡)·계정(조지아/플로리다/틱톡통합)·매장·기간·예산·목표 기준으로 시각화', priority: '필수' },
  { name: '광고 등록/관리 폼', desc: '광고 생성 시 플랫폼, 계정, 대상 매장(단일/복수/전체), 기간, 예산, 목표를 구조화된 폼으로 1회 입력', priority: '필수' },
  { name: '매장 마스터 관리', desc: '조지아(G01~), 플로리다(BF1~) 매장 코드를 관리하고 신규 매장 추가를 지원', priority: '필수' },
  { name: '성과 기록 및 보고', desc: '광고 종료 후 핵심 성과 지표를 입력/조회하고 보고용으로 정리·내보내기', priority: '필수' },
  { name: '알림/경고', desc: '광고 종료 임박(D-day) 알림, 종료 후 성과 데이터 미입력 알림, 동일 기간·동일 매장 캠페인 중복 알림 등', priority: '필수' },
  { name: 'Google Sheets 연동', desc: 'Marketing Log & Budget, 이벤트별 시트, 연간 마케팅 플랜과의 연동 방식 (범위는 추후 확정)', priority: '선택' },
  { name: 'Meta/TikTok Ads API 자동 수집', desc: '성과 데이터를 플랫폼에서 자동으로 가져오는 연동 (1차 범위 제외, 우선 수동 입력)', priority: '선택' },
];

/** Documentation */
export const Doc = {
  render: () => (
    <>
      <DocumentTitle
        title="Project Summary"
        status="Approved"
        note="Paid Ads Tracking Dashboard — background, scope, success criteria"
        brandName="BeautyMaster"
        systemName="Paid Ads Dashboard"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          페이드 광고 트래킹 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          메타/틱톡 페이드 광고의 현황과 성과를 한 눈에 파악해 기록/보고에 드는 인지적 부담과 중복 작업을 줄이는 대시보드
        </Typography>

        <SectionTitle title="왜 만드는가" description="문제 / 기회" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '20%', verticalAlign: 'top' }}>운영 현황</TableCell>
                <TableCell>메타(조지아 계정, 플로리다 계정) + 틱톡(통합 1계정)으로 페이드 광고 운영 중. 매장은 조지아 10개(G01~), 플로리다 5개(BF1~)이며 향후 계속 추가 예정</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>인지 부담</TableCell>
                <TableCell>광고 1개는 문제없지만, 여러 개가 동시에 돌아가면 "어떤 광고 · 어떤 계정 · 어떤 플랫폼 · 기간 · 예산 · 목표 · 성과"를 계속 기억/추적해야 해서 부담이 큼</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>중복 기록</TableCell>
                <TableCell>캠페인 기록이 5개 채널(트렐로 / Marketing Log &amp; Budget 시트 / 이벤트별 시트 / 연간 마케팅 플랜 시트 / 성과보고용 별도 엑셀)로 분산되어 중복 기록 발생</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>보고 비효율</TableCell>
                <TableCell>성과보고 시점마다 메타·틱톡에서 수동으로 데이터를 찾고 다운로드해야 하며, 어떤 지표를 봐야 할지 매번 고민되어 결국 전체 데이터를 다 받는 비효율이 반복됨</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="기대 효과" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>광고가 여러 개 동시에 돌아가도 현황(진행중/예정/종료, 매장, 기간, 예산, 목표)을 시각적으로 한 눈에 파악 → 인지 부담 감소</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>성과 보고에 필요한 데이터를 구조화해 기록 → 보고 시점의 재탐색/재다운로드 최소화</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>광고 관련 기록을 대시보드 하나로 통합 → 여러 채널에 나눠 기록하던 중복 제거 (트렐로 연동 없이 대시보드가 광고 기록의 유일한 지점이 됨)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="핵심 기능" description="우선순위 순으로 나열" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>기능</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>설명</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '10%' }}>우선순위</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {features.map((f) => (
                <TableRow key={f.name}>
                  <TableCell sx={{ fontWeight: 600 }}>{f.name}</TableCell>
                  <TableCell>{f.desc}</TableCell>
                  <TableCell>
                    <Chip
                      label={f.priority}
                      size="small"
                      variant="outlined"
                      color={f.priority === '필수' ? 'primary' : 'default'}
                      sx={{ borderRadius: '4px' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="대상 사용자" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>주요 사용자</TableCell>
                <TableCell>페이드 광고를 직접 운영·기록·보고하는 마케팅 실무자 본인 (1인 운영)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>보조 사용자</TableCell>
                <TableCell>팀원 (향후 함께 사용할 예정 — 매장 확장에 따라 팀 단위 사용을 염두에 둠)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="기술적 범위" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '15%' }}>구분</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>내용</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>포함</TableCell>
                <TableCell>
                  광고 현황 대시보드 UI (필터: 플랫폼/계정/매장/기간/상태) · 광고 등록 폼 및 매장 마스터 데이터(동적 추가 가능) · 알림/경고 로직(종료 임박, 성과 미입력, 중복 타겟팅) · 성과 데이터 수동 입력 및 보고서 뷰/내보내기 · 동일 회사(BeautyMaster)의{' '}
                  <Link href="https://github.com/juyoung-prog/Influencer-Tracking" target="_blank" rel="noopener">Influencer Tracking Dashboard</Link>에서 확립된 커스텀 테마 토큰과 운영 툴 컴포넌트 패턴 재사용/참고
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>제외 (1차 범위)</TableCell>
                <TableCell>트렐로 연동 (대시보드를 광고 기록의 원툴로 사용) · Meta/TikTok Ads API 실시간 자동 수집 (추후 확장 검토) · Google Sheets 각 시트와의 완전 자동 동기화</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>제약사항</TableCell>
                <TableCell>
                  매장 마스터는 코드 체계(G01, BF1 등)를 유지하며 확장 가능해야 함 · 캠페인은 단일/복수/전체 매장 타겟 세 케이스를 모두 지원 · 메타(조지아/플로리다 계정 분리)·틱톡(통합 1계정) 비대칭 구조를 데이터 모델에 반영 · 1차 범위는 단일 사용자 기준, 향후 다중 사용자(권한/역할) 확장 고려 · 비주얼/컴포넌트는 Influencer Tracking Dashboard와 통일감 유지 · 빌드 여부는 노코드 대안과 비교 검토 후 커스텀 대시보드로 확정 · 매장 귀속(attribution): multi_store/all_stores 캠페인은 매장별 예산을 분배하지 않고 캠페인 단위로만 집계
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="성공 기준" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableBody>
              <TableRow><TableCell>여러 광고가 동시에 돌아갈 때 현황을 한 눈에 파악할 수 있다 (인지적 부담 감소)</TableCell></TableRow>
              <TableRow><TableCell>성과 보고 시 메타/틱톡을 오가며 데이터를 재탐색·재다운로드하는 시간이 줄어든다</TableCell></TableRow>
              <TableRow><TableCell>광고 관련 기록이 대시보드 하나로 통합되어, 트렐로나 다른 시트에 별도로 남기지 않아도 된다</TableCell></TableRow>
              <TableRow><TableCell>광고 종료 임박·성과 미입력 등 놓치기 쉬운 상황을 알림으로 사전에 인지할 수 있다</TableCell></TableRow>
              <TableRow><TableCell>같은 회사의 Influencer Tracking Dashboard와 시각적으로 통일된 느낌을 준다</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="Influencer Tracking Dashboard 재사용 근거" />
        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '20%', verticalAlign: 'top' }}>톤앤매너</TableCell>
                <TableCell>Operational · Clean · Status-first · Low friction (Linear/Notion/Vercel 스타일 레퍼런스) — 운영자가 하루 여러 번 보는 화면이라는 성격이 동일</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>재사용 테마 토큰</TableCell>
                <TableCell><Box component="code" sx={{ fontFamily: 'monospace', fontSize: 12 }}>src/styles/themes/default.js</Box> — success/warning/error 상태 컬러, KPI 숫자용 tabular-nums, Outfit Variable 헤딩 폰트, Chip 4px 라운딩</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>재사용 후보 컴포넌트</TableCell>
                <TableCell>KpiBar → 현황 요약, StoreBreakdown → 매장별 분해, InfluencerFilterBar 패턴 → 필터 바, SyncStatusBar → 갱신 상태. (계획 당시 AppShell/StickyAsideCenterLayout → 2컬럼 구상은 이후 좌측 아이콘 레일 셸(PaidAdsRail) + 단일 컬럼으로 교체됨)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>적용 방식</TableCell>
                <TableCell>코드를 그대로 복붙하지 않고 <Box component="code" sx={{ fontFamily: 'monospace', fontSize: 12 }}>component-work</Box> 스킬 워크플로우로 이 프로젝트 taxonomy에 맞게 이식</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </PageContainer>
    </>
  ),
};
