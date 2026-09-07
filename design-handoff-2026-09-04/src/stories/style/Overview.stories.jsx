import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
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
  title: 'Style/Overview',
  parameters: {
    layout: 'padded',
  },
};

/** Docs - 테마 구조 탐색기 (첫 번째 스토리) */
export const Docs = {
  render: function ThemeOverviewDocs() {
    const theme = useTheme();

    // 대시보드가 실제로 참조하는 가지만 편다. MUI가 내부적으로만 쓰는
    // shadows 25단·transitions 같은 값은 트리에서 뺀다 — 넣어도 고를 일이 없다.
    const themeStructure = {
      palette: {
        primary: theme.palette.primary,
        secondary: theme.palette.secondary,
        accent: theme.palette.accent,
        surface: theme.palette.surface,
        text: theme.palette.text,
        background: theme.palette.background,
        action: theme.palette.action,
        error: theme.palette.error,
        warning: theme.palette.warning,
        success: theme.palette.success,
        divider: theme.palette.divider,
      },
      typography: {
        fontFamily: theme.typography.fontFamily,
        headingFontFamily: theme.typography.headingFontFamily,
        fontSize: theme.typography.fontSize,
        fontWeightRegular: theme.typography.fontWeightRegular,
        fontWeightMedium: theme.typography.fontWeightMedium,
        fontWeightBold: theme.typography.fontWeightBold,
        h4: theme.typography.h4,
        h5: theme.typography.h5,
        h6: theme.typography.h6,
        body1: theme.typography.body1,
        body2: theme.typography.body2,
        caption: theme.typography.caption,
        overline: theme.typography.overline,
      },
      spacing: {
        unit: 8,
        'spacing(0.75)': theme.spacing(0.75),
        'spacing(1)': theme.spacing(1),
        'spacing(1.5)': theme.spacing(1.5),
        'spacing(2)': theme.spacing(2),
        'spacing(3)': theme.spacing(3),
        'spacing(4)': theme.spacing(4),
      },
      shape: theme.shape,
      customShadows: theme.customShadows,
      breakpoints: {
        values: theme.breakpoints.values,
      },
    };

    return (
      <>
        <DocumentTitle
          title="Theme Overview"
          status="Available"
          note="The branches of the theme this dashboard actually reads"
          brandName="BeautyMaster"
          systemName="Influencer Dashboard"
          version="2.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Theme Structure
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={ { mb: 3 } }>
            클릭하여 펼치기/접기 | <code>src/styles/themes/default.js</code>
          </Typography>

          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider' } }>
            <Box sx={ { fontFamily: 'monospace' } }>
              { Object.entries(themeStructure).map(([key, value]) => (
                <TreeNode
                  key={ key }
                  keyName={ key }
                  value={ value }
                  depth={ 0 }
                  defaultOpen={ false }
                />
              )) }
            </Box>
          </Box>

          <Divider sx={ { my: 3 } } />

          <SectionTitle
            title="이 테마가 MUI 기본값과 다른 점"
            description="아래 다섯 가지가 화면 인상을 좌우한다"
          />
          <TableContainer sx={ { mb: 4 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: 180 } }>항목</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: 220 } }>이 프로젝트</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>MUI 기본값과의 차이</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { [
                  ['모서리', `shape.borderRadius: ${ theme.shape.borderRadius }`, '표면은 각지게. 둥근 모서리는 Input·Chip(4px), 카드형 컨테이너(6px)처럼 역할 단위로만 예외를 둔다'],
                  ['액센트', 'palette.accent', 'MUI에 없는 가지. 활성·선택·포커스를 primary가 아닌 이 한 값으로 통일한다'],
                  ['면 위계', 'palette.surface', 'background가 둘 다 흰색이라 "한 단 낮은 면"을 이름으로 고정했다'],
                  ['그림자', 'customShadows (blur만, offset 0)', 'MUI의 25단 elevation은 쓰지 않는다. 화면에 남은 그림자는 포커스 링과 좌측 패널 경계뿐'],
                  ['폰트', 'Pretendard + Outfit (self-host)', 'Roboto 제거. 헤딩만 Outfit, 본문은 Pretendard'],
                ].map(([item, ours, diff]) => (
                  <TableRow key={ item }>
                    <TableCell sx={ { fontWeight: 600, fontSize: 13 } }>{ item }</TableCell>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 12 } }>{ ours }</TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ diff }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body2" color="text.secondary">
            이 구조는 피그마의 Local Variables 패널과 같은 역할이다.
            각 카테고리(palette, typography 등)가 Variable Collection이고, 그 안의 값이 개별 Variable이다.
            색·글자·간격의 상세와 실제 사용처는 Style의 각 문서에서 다룬다.
          </Typography>
        </PageContainer>
      </>
    );
  },
};

/** 테이블 뷰 - 주요 토큰 요약 */
export const TableView = {
  name: 'Table View',
  render: function ThemeTableView() {
    const theme = useTheme();

    const tables = [
      {
        title: 'palette',
        description: '화면에 나가는 색',
        data: [
          { key: 'accent.main', value: theme.palette.accent.main },
          { key: 'accent.tint', value: theme.palette.accent.tint },
          { key: 'accent.ring', value: theme.palette.accent.ring },
          { key: 'surface.sunken', value: theme.palette.surface.sunken },
          { key: 'surface.muted', value: theme.palette.surface.muted },
          { key: 'text.primary', value: theme.palette.text.primary },
          { key: 'text.secondary', value: theme.palette.text.secondary },
          { key: 'divider', value: theme.palette.divider },
          { key: 'warning.main', value: theme.palette.warning.main },
          { key: 'success.main', value: theme.palette.success.main },
          { key: 'error.main', value: theme.palette.error.main },
          { key: 'primary.main', value: theme.palette.primary.main },
        ],
      },
      {
        title: 'typography',
        description: '테마 variant. 대시보드 본문은 sx의 px 스케일을 쓴다 (Style/Typography 참고)',
        data: [
          { key: 'fontSize', value: theme.typography.fontSize },
          { key: 'h4.fontSize', value: theme.typography.h4.fontSize },
          { key: 'h5.fontSize', value: theme.typography.h5.fontSize },
          { key: 'h6.fontSize', value: theme.typography.h6.fontSize },
          { key: 'body1.fontSize', value: theme.typography.body1.fontSize },
          { key: 'body2.fontSize', value: theme.typography.body2.fontSize },
          { key: 'caption.fontSize', value: theme.typography.caption.fontSize },
        ],
      },
      {
        title: 'spacing',
        description: '실제로 자주 쓰는 단계 (8px 단위)',
        data: [
          { key: 'spacing(0.75)', value: theme.spacing(0.75) },
          { key: 'spacing(1)', value: theme.spacing(1) },
          { key: 'spacing(1.5)', value: theme.spacing(1.5) },
          { key: 'spacing(2)', value: theme.spacing(2) },
          { key: 'spacing(3)', value: theme.spacing(3) },
          { key: 'spacing(4)', value: theme.spacing(4) },
        ],
      },
      {
        title: 'shape',
        description: '전역은 각지게, 둥근 값은 역할별 예외',
        data: [
          { key: 'borderRadius', value: `${ theme.shape.borderRadius }px` },
          { key: 'Input · Chip', value: '4px' },
          { key: '카드형 컨테이너', value: '6px' },
        ],
      },
      {
        title: 'customShadows',
        description: 'offset 없이 blur만. theme.customShadows로 접근한다',
        data: Object.entries(theme.customShadows || {}).map(([key, value]) => ({
          key,
          value,
        })),
      },
      {
        title: 'breakpoints',
        description: '대시보드는 xs · md 두 분기만 실제로 쓴다',
        data: Object.entries(theme.breakpoints.values).map(([key, value]) => ({
          key,
          value: `${ value }px`,
        })),
      },
    ];

    return (
      <>
        <DocumentTitle
          title="Token Tables"
          status="Available"
          note="Summary tables of the tokens in use"
          brandName="BeautyMaster"
          systemName="Influencer Dashboard"
          version="2.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Token Tables
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={ { mb: 4 } }>
            주요 토큰을 테이블 형태로 확인한다.
          </Typography>

          { tables.map((table) => (
            <Box key={ table.title } sx={ { mb: 4 } }>
              <Typography variant="h6" sx={ { fontWeight: 600, mb: 0.5 } }>
                { table.title }
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={ { display: 'block', mb: 1 } }>
                { table.description }
              </Typography>

              <Box sx={ { border: '1px solid', borderColor: 'divider', overflow: 'hidden' } }>
                <Box
                  component="table"
                  sx={ {
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  } }
                >
                  <Box component="thead" sx={ { backgroundColor: 'surface.sunken' } }>
                    <Box component="tr">
                      <Box component="th" sx={ { p: 1.5, textAlign: 'left', fontWeight: 600 } }>Key</Box>
                      <Box component="th" sx={ { p: 1.5, textAlign: 'left', fontWeight: 600 } }>Value</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    { table.data.map((row) => {
                      const isColor = typeof row.value === 'string' && (
                        row.value.startsWith('#') ||
                        row.value.startsWith('rgb')
                      );
                      return (
                        <Box
                          component="tr"
                          key={ row.key }
                          sx={ {
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { backgroundColor: 'action.hover' },
                          } }
                        >
                          <Box component="td" sx={ { p: 1.5, color: 'accent.main' } }>
                            { row.key }
                          </Box>
                          <Box component="td" sx={ { p: 1.5, display: 'flex', alignItems: 'center', gap: 1 } }>
                            { isColor && (
                              <Box
                                sx={ {
                                  width: 16,
                                  height: 16,
                                  backgroundColor: row.value,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                } }
                              />
                            ) }
                            <span>{ row.value }</span>
                          </Box>
                        </Box>
                      );
                    }) }
                  </Box>
                </Box>
              </Box>
            </Box>
          )) }
        </PageContainer>
      </>
    );
  },
};
