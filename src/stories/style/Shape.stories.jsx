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
  title: 'Style/Shape',
  parameters: {
    layout: 'padded',
  },
};

/* useTheme는 훅이라 render 화살표 함수 안에서 직접 부르면 rules-of-hooks에
   걸린다(기존 Style 스토리들이 이 패턴으로 lint 에러를 갖고 있음) — 정식
   컴포넌트로 분리해 훅 규칙을 지킨다. */
function ShapeDocs() {
  const theme = useTheme();

    const tokenStructure = {
      shape: theme.shape,
    };

    const tokenValues = [
      {
        token: 'shape.borderRadius',
        value: `${theme.shape.borderRadius}px`,
        radius: theme.shape.borderRadius,
        description: '전역 기본 — Flat by default. Button/Card/Paper 같은 구조 표면은 각지게 유지',
      },
      {
        token: 'shape.radius.control',
        value: `${theme.shape.radius.control}px`,
        radius: theme.shape.radius.control,
        description: '상호작용 컨트롤 — 입력·셀렉트·칩·내비 행. MuiOutlinedInput/MuiChip 오버라이드와 같은 값',
      },
      {
        token: 'shape.radius.container',
        value: `${theme.shape.radius.container}px`,
        radius: theme.shape.radius.container,
        description: '분석·참조용 카드형 컨테이너 — Gantt phase 막대 등 (구조 표면인 Card/Paper는 여전히 0)',
      },
      {
        token: 'shape.radius.inlay',
        value: `${theme.shape.radius.inlay}px`,
        radius: theme.shape.radius.inlay,
        description: '컨트롤 안에 들어가는 미세 요소 — 버튼 안 단축키 힌트 키캡 등',
      },
    ];

    return (
      <>
        <DocumentTitle
          title="Shape System"
          status="Available"
          note="Flat-by-default radius with role-based exceptions"
          brandName="Design System"
          systemName="Starter Kit"
          version="1.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Shape System
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            전역 radius는 0(각짐)이고, 역할 단위로만 예외를 둡니다 — 어떤 요소가 왜 둥근지가 토큰 이름에 담깁니다.
          </Typography>

          <SectionTitle title="토큰 구조" description="theme.shape 계층 구조" />
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 4 } }>
            { Object.entries(tokenStructure).map(([key, value]) => (
              <TreeNode key={ key } keyName={ key } value={ value } defaultOpen />
            )) }
          </Box>

          <SectionTitle title="토큰 값" description="역할별 radius의 실제 값" />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600 } }>Token</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Value</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Preview</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>설명</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { tokenValues.map((row) => (
                  <TableRow key={ row.token }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.token }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 13 } }>{ row.value }</TableCell>
                    <TableCell>
                      <Box
                        sx={ {
                          width: 48,
                          height: 28,
                          backgroundColor: 'surface.muted',
                          border: '1px solid',
                          borderColor: 'grey.400',
                          borderRadius: `${row.radius}px`,
                        } }
                      />
                    </TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.description }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle title="사용 예시" description="MUI sx prop에서의 radius 토큰 활용 — 곱셈 함정 주의" />
          <Box
            component="pre"
            sx={ {
              backgroundColor: 'grey.100',
              p: 2,
              fontSize: 12,
              fontFamily: 'monospace',
              overflow: 'auto',
              borderRadius: 1,
              mb: 4,
            } }
          >
{ `// 반드시 px "문자열"로 넘긴다.
// sx의 borderRadius에 숫자를 주면 shape.borderRadius(0)와 곱해져 0px가 된다 —
// 이 곱셈 함정 때문에 화면마다 '4px' 리터럴과 경고 주석이 복사되던 것을
// 토큰으로 모은 것이다.
<Box sx={theme => ({ borderRadius: \`\${theme.shape.radius.control}px\` })} />

// 역할별 선택
<Box sx={theme => ({ borderRadius: \`\${theme.shape.radius.container}px\` })} />  // 차트 막대·참조 카드
<Box sx={theme => ({ borderRadius: \`\${theme.shape.radius.inlay}px\` })} />      // 버튼 안 키캡

// 구조 표면(Card/Paper/Button)은 토큰을 덮지 않는다 — 전역 0(각짐)이 의도다.
// 원형은 radius 역할이 아니므로 그대로 '50%'를 쓴다.
<Box sx={{ borderRadius: '50%' }} />` }
          </Box>

          <SectionTitle
            title="Vibe Coding Prompt"
            description="AI 코딩 도구에서 활용할 수 있는 프롬프트 예시"
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
              borderRadius: 1,
            } }
          >
{ `/* radius 토큰 활용 프롬프트 예시 */

"칩처럼 클릭되는 요소에 shape.radius.control(4px)을 적용해줘.
sx에서는 숫자가 아니라 \\\`\${theme.shape.radius.control}px\\\` 문자열로 넘겨야 해."

"이 분석 카드 컨테이너에 shape.radius.container(6px)를 써줘.
Card/Paper 같은 구조 표면은 전역 0을 유지하고 건드리지 마."

"'6px' 같은 radius 리터럴을 발견하면 역할에 맞는 shape.radius 토큰으로 바꿔줘."` }
          </Box>
        </PageContainer>
      </>
    );
}

export const Docs = {
  render: () => <ShapeDocs />,
};
