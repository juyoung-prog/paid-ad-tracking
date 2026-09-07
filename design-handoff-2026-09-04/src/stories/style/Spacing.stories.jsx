import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import {
  DocumentTitle,
  PageContainer,
  SectionTitle,
  TreeNode,
} from '../../components/storybookDocumentation';

export default {
  title: 'Style/Spacing',
  parameters: {
    layout: 'padded',
  },
};

/**
 * 대시보드가 실제로 쓰는 간격 단계.
 *
 * count는 소스에서 센 사용 횟수다. 8px 단위 그리드지만 운영 화면은 밀도가 높아
 * 0.25(2px) 단위까지 내려간다 — 큰 여백보다 작은 여백이 훨씬 자주 쓰인다.
 */
const SPACING_SCALE = [
  { step: 0.25, px: 2, count: 5, prop: 'py', where: '칩·배지 안쪽 세로 여백' },
  { step: 0.5, px: 4, count: 17, prop: 'mb · gap', where: '라벨과 값 사이' },
  { step: 0.75, px: 6, count: 27, prop: 'gap · py · px', where: '행 안쪽 여백, 아이콘과 글자 사이' },
  { step: 1, px: 8, count: 30, prop: 'gap · mt · px', where: '기본 간격' },
  { step: 1.25, px: 10, count: 12, prop: 'px', where: '칩·토글 버튼 가로 여백' },
  { step: 1.5, px: 12, count: 25, prop: 'gap · mb', where: '카드 안 요소 간격' },
  { step: 2, px: 16, count: 26, prop: 'px · mb · py', where: '패널 가로 여백' },
  { step: 3, px: 24, count: 19, prop: 'px · py', where: '메인 영역 여백' },
  { step: 4, px: 32, count: 10, prop: 'mb', where: '섹션 사이' },
];

/** 8의 배수가 아닌, 픽셀을 맞추려고 쓴 값 */
const OFF_GRID = [
  { step: 0.125, px: 1, count: 3, why: '1px 보정 — 보더 두께만큼 밀어줄 때' },
  { step: 0.625, px: 5, count: 4, why: '수치와 단위 사이 (KPI baseline 정렬)' },
  { step: 0.875, px: 7, count: 8, why: '목록 행 높이 — 0.75는 좁고 1은 넓다' },
  { step: 2.25, px: 18, count: 3, why: '표 셀 세로 여백' },
  { step: 2.5, px: 20, count: 3, why: '패널 여백 미세 조정' },
];

/** 간격 시스템 문서 */
export const Docs = {
  render: function SpacingDocs() {
    const theme = useTheme();

    const tokenStructure = {
      spacing: {
        unit: 8,
        'spacing(0.25)': theme.spacing(0.25),
        'spacing(0.5)': theme.spacing(0.5),
        'spacing(0.75)': theme.spacing(0.75),
        'spacing(1)': theme.spacing(1),
        'spacing(1.5)': theme.spacing(1.5),
        'spacing(2)': theme.spacing(2),
        'spacing(3)': theme.spacing(3),
        'spacing(4)': theme.spacing(4),
      },
    };

    const sxProps = [
      { prop: 'gap', description: 'flex/grid 간격 — 이 화면에서 가장 자주 쓴다', example: 'gap: 0.75' },
      { prop: 'px, py', description: 'padding (가로, 세로)', example: 'px: 1.25, py: 0.875' },
      { prop: 'p', description: 'padding (전체)', example: 'p: 1.5' },
      { prop: 'mt, mb', description: 'margin (위, 아래)', example: 'mb: 4' },
      { prop: 'mx, my', description: 'margin (가로, 세로)', example: 'my: 4' },
    ];

    return (
      <>
        <DocumentTitle
          title="Spacing"
          status="Available"
          note="8px grid, measured against the dashboard source"
          brandName="BeautyMaster"
          systemName="Influencer Dashboard"
          version="2.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Spacing System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            단위는 8px이지만, 정보 밀도가 높은 운영 화면이라 실제로는 2~32px 구간에 몰려 있다.
          </Typography>

          <SectionTitle
            title="실사용 스케일"
            description="count는 대시보드 소스에서 센 사용 횟수다. 큰 여백일수록 적게 쓴다."
          />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: 70 } }>Step</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 70 } }>px</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 70 } }>사용 수</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 130 } }>주로 쓰는 prop</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 200 } }>자리</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Visual</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { SPACING_SCALE.map((row) => (
                  <TableRow key={ row.step }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.step }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.px }px</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.count }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 12 } }>{ row.prop }</TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.where }</TableCell>
                    <TableCell>
                      <Box sx={ { width: row.px, height: 14, backgroundColor: 'accent.main' } } />
                    </TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle
            title="격자를 벗어난 값"
            description="8의 배수가 아니지만 화면에 남아 있는 값들. 없앨 대상이 아니라, 왜 거기 있는지 기록해 둔다."
          />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: 70 } }>Step</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 70 } }>px</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 70 } }>사용 수</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>이유</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { OFF_GRID.map((row) => (
                  <TableRow key={ row.step }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.step }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.px }px</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.count }</TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.why }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle title="토큰 구조" description="theme.spacing 계층" />
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider', mb: 4 } }>
            { Object.entries(tokenStructure).map(([key, value]) => (
              <TreeNode key={ key } keyName={ key } value={ value } defaultOpen />
            )) }
          </Box>

          <SectionTitle title="SX Props" description="이 화면에서 실제로 쓰는 prop만" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: 120 } }>Prop</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>설명</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 200 } }>Example</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { sxProps.map((row) => (
                  <TableRow key={ row.prop }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.prop }</TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.description }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 12 } }>{ row.example }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle title="사용 예시" description="대시보드 코드에서 그대로 가져온 형태" />
          <Box
            component="pre"
            sx={ {
              backgroundColor: 'surface.muted',
              p: 2,
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
              mb: 4,
            } }
          >
{ `// 목록 행 — 세로는 0.875(7px), 가로는 1.25(10px)
<Box sx={{ py: 0.875, px: 1.25, display: 'flex', gap: 0.75 }} />

// 카드 안 요소 간격은 1.5(12px)로 통일
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }} />

// 섹션 사이만 4(32px)로 크게 벌린다
<Box sx={{ mb: 4 }} />

// 반응형은 메인 영역 여백에만 (xs → md)
<Box sx={{ px: { xs: 2, md: 3 } }} />` }
          </Box>

          <SectionTitle
            title="Vibe Coding Prompt"
            description="AI 코딩 도구에 이 간격 체계를 설명할 때 쓰는 문장"
          />
          <Box
            component="pre"
            sx={ {
              backgroundColor: 'grey.900',
              color: 'grey.100',
              p: 2,
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
            } }
          >
{ `/* 이 대시보드의 간격 규칙 */

"운영 화면이라 여백을 크게 주지 마. 행 안쪽은 gap 0.75(6px),
카드 안 요소 사이는 gap 1.5(12px), 섹션 사이만 mb 4(32px)."

"패널 가로 여백은 px 2~3(16~24px). 그보다 크게 벌리면
한 화면에 들어가야 할 목록이 잘린다."

"py 6(48px), py 12(96px) 같은 랜딩 페이지 스케일은 쓰지 않는다."

"세로 여백은 0.25 단위까지 내려가도 된다 — 행 높이는 0.875(7px)가 기준이다."` }
          </Box>
        </PageContainer>
      </>
    );
  },
};
