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

/** 간격 시스템 문서 */
export const Docs = {
  render: () => {
    const theme = useTheme();

    // 토큰 구조 (트리 뷰용)
    const tokenStructure = {
      spacing: {
        unit: 8,
        'spacing(0.5)': theme.spacing(0.5),
        'spacing(1)': theme.spacing(1),
        'spacing(1.5)': theme.spacing(1.5),
        'spacing(2)': theme.spacing(2),
        'spacing(3)': theme.spacing(3),
        'spacing(4)': theme.spacing(4),
        'spacing(5)': theme.spacing(5),
        'spacing(6)': theme.spacing(6),
        'spacing(8)': theme.spacing(8),
        'spacing(10)': theme.spacing(10),
        'spacing(12)': theme.spacing(12),
      },
    };

    // 토큰 값 (테이블용)
    const tokenValues = [
      { token: 0, multiplier: '0x', px: 0, usage: '없음' },
      { token: 0.5, multiplier: '0.5x', px: 4, usage: '표 셀 위아래 — 행 높이를 정하는 값' },
      { token: 0.75, multiplier: '0.75x', px: 6, usage: '행 안쪽, 아이콘과 글자 사이 (운영 화면 주력)' },
      { token: 0.875, multiplier: '0.875x', px: 7, usage: '목록 행 높이(py) — 패널 세로 여백' },
      { token: 1, multiplier: '1x', px: 8, usage: '인라인 요소 간격' },
      { token: 1.25, multiplier: '1.25x', px: 10, usage: '캠페인 목록 행 위아래' },
      { token: 1.5, multiplier: '1.5x', px: 12, usage: '카드 안 요소 사이 · 섹션 제목과 내용 사이' },
      { token: 2, multiplier: '2x', px: 16, usage: '패널 가로 여백 · 카드 안쪽 패딩' },
      { token: 3, multiplier: '3x', px: 24, usage: '섹션 사이 (드로어·리포트 카드)' },
      { token: 4, multiplier: '4x', px: 32, usage: '섹션 간격' },
      { token: 5, multiplier: '5x', px: 40, usage: '큰 섹션 간격' },
      { token: 6, multiplier: '6x', px: 48, usage: '페이지 패딩' },
      { token: 8, multiplier: '8x', px: 64, usage: '대형 섹션 마진' },
      { token: 10, multiplier: '10x', px: 80, usage: '페이지 섹션 구분' },
      { token: 12, multiplier: '12x', px: 96, usage: '히어로 섹션 패딩 (마케팅 페이지용 — 이 대시보드에는 없다)' },
    ];

    /* 운영 화면의 주력은 **작은 단계**다(0.5~3). 6·8·10·12는 히어로가 있는
       마케팅 페이지의 값이고, 하루에 여러 번 훑는 대시보드에서 그 여백을 쓰면
       한 화면에 들어오는 행 수가 절반이 된다. 아래 표에서 위쪽 절반만 쓴다고
       보면 된다. */

    // sx props 가이드
    const sxProps = [
      { prop: 'm', description: 'margin (전체)', example: 'm: 2' },
      { prop: 'mt, mr, mb, ml', description: 'margin (top, right, bottom, left)', example: 'mt: 2' },
      { prop: 'mx, my', description: 'margin (horizontal, vertical)', example: 'mx: "auto"' },
      { prop: 'p', description: 'padding (전체)', example: 'p: 2' },
      { prop: 'pt, pr, pb, pl', description: 'padding (top, right, bottom, left)', example: 'pb: 3' },
      { prop: 'px, py', description: 'padding (horizontal, vertical)', example: 'px: 4' },
      { prop: 'gap', description: 'flex/grid gap', example: 'gap: 2' },
    ];

    return (
      <>
        <DocumentTitle
          title="Spacing"
          status="Available"
          note="8px grid spacing system"
          brandName="Design System"
          systemName="Starter Kit"
          version="1.0"
        />
        <PageContainer>
          {/* 제목 + 1줄 개요 */}
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Spacing System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            8px 그리드 기반의 일관된 간격 시스템입니다.
          </Typography>

          {/* 토큰 구조 (트리 뷰) */}
          <SectionTitle title="토큰 구조" description="theme.spacing 계층 구조" />
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 4 } }>
            { Object.entries(tokenStructure).map(([key, value]) => (
              <TreeNode key={ key } keyName={ key } value={ value } defaultOpen />
            )) }
          </Box>

          {/* 토큰 값 (테이블) */}
          <SectionTitle title="토큰 값" description="Spacing scale과 픽셀 값" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600 } }>Token</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Multiplier</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Value</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Visual</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>용도</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { tokenValues.map((row) => (
                  <TableRow key={ row.token }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.token }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.multiplier }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.px }px</TableCell>
                    <TableCell>
                      <Box sx={ { display: 'flex', alignItems: 'center', gap: 1 } }>
                        <Box
                          sx={ {
                            width: Math.min(row.px, 80),
                            height: 16,
                            backgroundColor: 'chart.barEmphasis',
                            minWidth: row.px > 0 ? 2 : 0,
                          } }
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.usage }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          {/* SX Props 가이드 */}
          <SectionTitle title="SX Props" description="spacing에 사용 가능한 sx prop" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600 } }>Prop</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>설명</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Example</TableCell>
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

          {/* 사용 예시 */}
          <SectionTitle title="사용 예시" description="MUI sx prop에서의 spacing 활용" />
          <Box
            component="pre"
            sx={ {
              backgroundColor: 'surface.muted',
              p: 2,
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
              borderRadius: 1,
              mb: 4,
            } }
          >
{ `// 기본 spacing 사용
<Box sx={{ m: 2, p: 3 }}>  {/* margin: 16px, padding: 24px */}
  Content
</Box>

// 방향별 spacing
<Box sx={{ mt: 2, mb: 4, px: 3 }}>
  {/* marginTop: 16px, marginBottom: 32px, paddingX: 24px */}
</Box>

// 반응형 spacing
<Box sx={{
  p: { xs: 2, sm: 3, md: 4 },  {/* 16px → 24px → 32px */}
  my: { xs: 3, md: 6 }         {/* 24px → 48px */}
}}>
  Responsive content
</Box>

// Flex gap
<Box sx={{ display: 'flex', gap: 2 }}>  {/* gap: 16px */}
  <Item /><Item /><Item />
</Box>

// Stack spacing
<Stack direction="row" spacing={2}>  {/* gap: 16px */}
  <Item /><Item />
</Stack>` }
          </Box>

          {/* Vibe Coding Prompt */}
          <SectionTitle
            title="Vibe Coding Prompt"
            description="AI 코딩 도구에서 활용할 수 있는 프롬프트 예시"
          />
          <Box
            component="pre"
            sx={ {
              backgroundColor: 'grey.900',
              color: 'surface.muted',
              p: 2,
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
              borderRadius: 1,
            } }
          >
{ `/* Spacing 토큰 활용 프롬프트 예시 */

"p: 3 (24px)을 사용해서 카드 내부 패딩을 설정하고,
gap: 2 (16px)로 카드 내 요소들 간격을 만들어줘."

"모바일에서는 p: 2 (16px), 데스크탑에서는 p: 4 (32px)로
반응형 패딩을 적용해줘."

"my: 6 (48px)으로 섹션 간 수직 간격을 만들고,
섹션 내부는 gap: 3 (24px)으로 설정해줘."

"버튼들 사이에 gap: 1 (8px)을 적용하고,
버튼 그룹과 다른 요소 사이는 mt: 4 (32px)로 해줘."

"히어로 섹션에 py: 12 (96px)를 적용하고,
내부 콘텐츠는 px: { xs: 2, md: 6 }으로 반응형 처리해줘."` }
          </Box>
        </PageContainer>
      </>
    );
  },
};
