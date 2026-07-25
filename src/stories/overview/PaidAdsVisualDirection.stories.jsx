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
  title: 'Overview/Paid Ads Dashboard/03. Visual Direction',
  parameters: {
    layout: 'padded',
  },
};

const cardMock = `┌────────────────────────────────────────────┐
│ ● Morrow Grand Opening Awareness    진행중  │  ← Hero: 캠페인명 + 상태 칩
│ Meta · Georgia          G11                 │  ← 플랫폼·계정 chip + 매장 chip
│ 08.01–08.31   ·   $1,500 (집행 $1,204)       │  ← 기간 · 예산(tabular-nums)
│ ⚠ 종료 D-3                                   │  ← 고긴급 알림 뱃지 (있을 때만)
└────────────────────────────────────────────┘`;

const typographyScale = [
  { role: '페이지 타이틀', variant: 'h6', size: '18px', weight: '700', note: '헤더 안에서 작게' },
  { role: 'KPI 숫자', variant: 'h4', size: '32px', weight: '700', note: 'tabular-nums' },
  { role: 'KPI 라벨', variant: 'caption', size: '11px', weight: '400', note: '숫자 아래, uppercase' },
  { role: '캠페인명 (카드 Hero)', variant: 'body1', size: '16px', weight: '600', note: '—' },
  { role: '캠페인 메타(플랫폼·계정·매장)', variant: 'body2', size: '14px', weight: '400', note: 'text.secondary' },
  { role: '기간·예산', variant: 'body2', size: '14px', weight: '500', note: '예산 숫자는 tabular-nums' },
  { role: 'AlertBanner 문구', variant: 'body2', size: '14px', weight: '500', note: 'warning.main / error.main' },
  { role: 'Drawer 섹션 라벨', variant: 'overline', size: '11px', weight: '600', note: 'letter-spacing 넓게' },
  { role: 'Drawer 성과 지표', variant: 'h5', size: '24px', weight: '700', note: 'tabular-nums 필수' },
  { role: '계산 필드 (CPM/CTR/Hook Rate 등)', variant: 'body2', size: '14px', weight: '500', note: 'raw 값 옆 괄호 병기, text.secondary' },
];

/** Documentation */
export const Doc = {
  render: () => (
    <>
      <DocumentTitle
        title="Visual Direction"
        status="Approved"
        note="Paid Ads Tracking Dashboard — tone, layout, density, typography"
        brandName="BeautyMaster"
        systemName="Paid Ads Dashboard"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          페이드 광고 트래킹 대시보드 — Visual Direction
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          내부 운영 툴. 하루 여러 번 들여다보는 화면이므로 판독 속도가 최우선이며, Influencer Tracking Dashboard와 시각적으로 한 팀이 만든 툴군처럼 읽혀야 한다.
        </Typography>

        <SectionTitle title="톤앤매너" />
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>키워드</TableCell>
                <TableCell>Operational · Clean · Status-first · Low friction</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>일관성 근거</TableCell>
                <TableCell>Influencer Tracking Dashboard와 동일한 톤앤매너 채택 — 같은 회사·같은 사용자·같은 "운영자가 반복적으로 보는 화면"이라는 성격이 동일</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>참조 레퍼런스</TableCell>
                <TableCell>Linear, Notion 대시보드, Vercel Dashboard — Influencer Tracking Dashboard와 동일하게 승계</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="레이아웃 방향" description="2컬럼 구조 — Influencer Tracking Dashboard와 동일 골격" />
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>영역</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>너비</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>스크롤</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>역할</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>좌측 보조 패널</TableCell>
                <TableCell>280px 고정</TableCell>
                <TableCell>독립 스크롤</TableCell>
                <TableCell>FilterBar + StoreBreakdown</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>우측 메인</TableCell>
                <TableCell>나머지 전체</TableCell>
                <TableCell>독립 스크롤</TableCell>
                <TableCell>AlertBanner + 상태 탭 + 캠페인 카드 그리드</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>헤더</TableCell>
                <TableCell>100%</TableCell>
                <TableCell>sticky</TableCell>
                <TableCell>KpiBar + 알림 아이콘 + "광고 등록" 버튼</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <TableContainer sx={{ mb: 4 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>헤더 높이</TableCell>
                <TableCell>56px — Influencer Dashboard와 동일 기준</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>캠페인 카드 그리드</TableCell>
                <TableCell>2열 고정(1280px+) → 1열(960px 미만) — 정보량이 많아 Influencer의 3열보다 한 단계 낮춤</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>카드/섹션 간격</TableCell>
                <TableCell>카드 gap 2(16px), 섹션 mb 3(24px)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>반응형 범위</TableCell>
                <TableCell>데스크탑 우선, 반응형 최소화 (Influencer Dashboard와 동일 가정 — 명시적 결정, 모바일 니즈 발생 시 재검토)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>borderRadius</TableCell>
                <TableCell>기본 0 유지, Chip만 4px (이 프로젝트 기본 테마에 이미 설정 — 변경 불필요)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="정보 밀도" />
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>요소</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>값</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>근거</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>카드 패딩</TableCell><TableCell>p: 2 (16px)</TableCell><TableCell>Influencer와 동일</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>카드 총 높이</TableCell><TableCell>~104px (4행)</TableCell><TableCell>캠페인명, 플랫폼·계정·매장, 기간·예산, (있을 때만) 알림 뱃지</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>KPI 헤더 높이</TableCell><TableCell>56px</TableCell><TableCell>숫자+라벨 2줄 최소값</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>StoreBreakdown 행 높이</TableCell><TableCell>40px</TableCell><TableCell>매장 코드 + 캠페인 수만 표시</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Drawer 너비</TableCell><TableCell>440px</TableCell><TableCell>Influencer(400px)보다 약간 넓힘 — 성과 입력 폼 필드가 더 많음</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>캠페인 카드 밀도 설계</Typography>
        <Box
          component="pre"
          sx={{ backgroundColor: 'grey.100', p: 2, mb: 1, fontSize: 12, fontFamily: 'monospace', overflow: 'auto', borderRadius: 1 }}
        >
          {cardMock}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          카드는 "지금 이 캠페인이 뭐고 언제 끝나는가"만 전달, 성과 지표는 전부 Drawer로 숨김 (Influencer Dashboard의 "카드는 최소 정보, 나머지는 Drawer" 원칙 적용).
        </Typography>

        <SectionTitle title="타이포그래피 원칙" />
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>헤더 타이틀</TableCell>
                <TableCell>Outfit Variable (영문) / Pretendard Variable (한글)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>본문 전체</TableCell>
                <TableCell>Pretendard Variable</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>KPI·예산·성과 숫자</TableCell>
                <TableCell>Pretendard Variable — font-variant-numeric: tabular-nums</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>요소</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>variant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>크기</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>weight</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {typographyScale.map((t) => (
                <TableRow key={t.role}>
                  <TableCell>{t.role}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.variant}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.size}</TableCell>
                  <TableCell>{t.weight}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{t.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>· 숫자는 tabular-nums 필수 — KPI, 예산, raw/계산 필드 전부. 자릿수 변화 시 레이아웃이 흔들리면 "5초 판독" 목표가 깨짐.</Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>· 헤더 타이틀은 작게, KPI 숫자가 화면에서 제일 큰 글자 — h1/h2/h3는 이 화면에서 쓰지 않는다.</Typography>
          <Typography variant="body2">· raw 값과 계산 값을 위계로 구분 — 예: "노출 120,000 (CPM $12.40)"처럼 raw는 굵게, 계산값은 보조색·괄호.</Typography>
        </Box>

        <SectionTitle title="레퍼런스" />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '20%' }}>레퍼런스</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>참고 포인트</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Linear</TableCell><TableCell>정보 밀도, 상태 칩 사용 방식</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Notion 대시보드</TableCell><TableCell>좌측 고정 패널 + 우측 스크롤 그리드 구조</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Vercel Dashboard</TableCell><TableCell>화이트 베이스, 명확한 상태 컬러, sticky 헤더</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </PageContainer>
    </>
  ),
};

const baseColors = [
  { token: 'primary.main', value: '#0000FF', desc: '유지 — 인터랙티브 요소 전용 (링크, 활성 탭, 버튼)' },
  { token: 'secondary.main', value: '#263238', desc: '유지 — 헤더/구분 요소' },
  { token: 'error.main', value: '#B3261E', desc: 'Brand Blue 채도에 맞춰 재조정 (Influencer VD 근거 승계)' },
  { token: 'warning.main', value: '#8A5A00', desc: '상동' },
  { token: 'success.main', value: '#167C3D', desc: '상동' },
  { token: 'info.main', value: '#0E6B7A', desc: 'primary와 겹치지 않도록 청록 계열로 분리' },
  { token: 'grey.50', value: '#FAFAFA', desc: '유지 — 좌측 패널 배경' },
];

const alertColorMap = [
  { type: '캠페인 상태 — 진행중', color: 'success.main', treat: '상태 칩' },
  { type: '캠페인 상태 — 예정', color: 'grey.500', treat: '상태 칩' },
  { type: '캠페인 상태 — 종료', color: 'grey.400 (outline)', treat: '상태 칩' },
  { type: '고긴급: ending_soon, budget_pacing', color: 'warning.main', treat: '상단 AlertBanner + 카드 뱃지' },
  { type: '고긴급: missing_performance', color: 'error.main', treat: '상단 AlertBanner + 카드 뱃지 (보고 자체가 막히는 상태라 격상)' },
  { type: '저긴급: overlap_target', color: 'grey.500 (outline chip)', treat: '카드 인라인 표시만, AlertBanner 노출 안 함 (알림 피로 방지)' },
  { type: 'new_store_reminder', color: 'text.secondary (색 없음)', treat: '/stores 페이지 내 안내 문구, Alert 시스템 밖' },
];

const tokenChanges = [
  { path: 'palette.error.light/main/dark', before: '#ef5350 / #d32f2f / #c62828', after: '#DE5B4E / #B3261E / #7A160F', target: 'missing_performance 알림, 삭제/차단 액션' },
  { path: 'palette.warning.light/main/dark', before: '#ff9800 / #ed6c02 / #e65100', after: '#C98A2E / #8A5A00 / #5C3C00', target: 'ending_soon, budget_pacing 알림' },
  { path: 'palette.success.light/main/dark', before: '#4caf50 / #2e7d32 / #1b5e20', after: '#4FAE6F / #167C3D / #0E5A2B', target: '진행중 상태 칩' },
  { path: 'palette.info.light/main/dark', before: '#03a9f4 / #0288d1 / #01579b', after: '#4FA3B0 / #0E6B7A / #06505C', target: '정보성 표시 (필요 시)' },
  { path: 'typography.headingFontFamily', before: '"Outfit"', after: '"Outfit Variable"', target: '헤더 타이틀' },
  { path: 'typography.h1~h6 / subtitle1/2.fontFamily', before: '"Outfit"', after: '"Outfit Variable"', target: '동일' },
  { path: 'typography.h4, h5 (KPI·성과 숫자용)', before: '미설정', after: "fontVariantNumeric: 'tabular-nums' 추가", target: 'KPI 바, Drawer 성과 지표, 카드 예산 표기' },
  { path: 'components.MuiChip.styleOverrides.root.borderRadius', before: '4', after: '변경 없음 (이미 동일)', target: '—' },
  { path: 'components.MuiDrawer.styleOverrides.paper.width', before: '미설정', after: '440', target: '캠페인 상세/성과 입력 Drawer' },
  { path: 'components.MuiTableRow.styleOverrides', before: '미설정', after: 'hover 시 rgba(0,0,0,0.03) 배경', target: 'StoreBreakdown, /reports 테이블' },
];

/** 컬러 팔레트 및 변경 토큰 */
export const ColorAndTokens = {
  render: () => (
    <PageContainer>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        컬러 팔레트 및 변경 토큰
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Influencer Tracking Dashboard가 이미 검증한 값을 그대로 승계 — 새 토큰을 발명하지 않는다.
      </Typography>

      <SectionTitle title="기반 컬러" description="이 프로젝트 기본값 대비 Influencer Dashboard 채택값" />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {baseColors.map((c) => (
          <Box key={c.token} sx={{ width: 160 }}>
            <Box
              sx={{
                width: '100%',
                height: 56,
                backgroundColor: c.value,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'flex-end',
                p: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontFamily: 'monospace', fontSize: 10, textShadow: '0 0 2px rgba(0,0,0,0.6)' }}>
                {c.value}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', fontWeight: 600, mt: 0.5 }}>
              {c.token}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 11 }}>
              {c.desc}
            </Typography>
          </Box>
        ))}
      </Box>

      <SectionTitle title="상태/알림 컬러 매핑" description="알림 피로 방지를 위한 2단계 긴급도 구분 (이번 프로젝트 신규 정의)" />
      <TableContainer sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>유형</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>컬러</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>처리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alertColorMap.map((a) => (
              <TableRow key={a.type}>
                <TableCell>{a.type}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{a.color}</TableCell>
                <TableCell sx={{ fontSize: 13 }}>{a.treat}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <SectionTitle title="플랫폼 구분 및 컬러 사용 제한" />
      <Box sx={{ mb: 4 }}>
        <Typography variant="body2" sx={{ mb: 0.5 }}>· Meta/TikTok은 색으로 구분하지 않는다 — 아이콘 + 텍스트 라벨의 outline Chip으로만 표시 (알림 컬러와 경쟁 방지).</Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>· primary.main은 인터랙티브 요소에만, 배경·카드에 파란색 금지.</Typography>
        <Typography variant="body2">· 상태/알림 컬러는 텍스트·아이콘·칩 테두리로만, 카드 전체 배경 채색 금지.</Typography>
      </Box>

      <SectionTitle title="변경 필요 토큰 요약" description="실제 default.js 구현 입력값" />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>토큰 경로</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>현재값</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>변경값</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>적용 대상</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tokenChanges.map((t) => (
              <TableRow key={t.path}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.path}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{t.before}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{t.after}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{t.target}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        primary.main, secondary.main, shape.borderRadius, shadows, spacing — 모두 이 프로젝트 기본값 유지. 새로 발명한 토큰은 없음.
      </Typography>
    </PageContainer>
  ),
};
