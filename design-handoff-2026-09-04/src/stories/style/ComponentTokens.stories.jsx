import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Divider from '@mui/material/Divider';
import { DocumentTitle, PageContainer, SectionTitle } from '../../components/storybookDocumentation';

import { componentTokenMap, tokenCategories, componentList } from '../../data/componentTokenMap';

export default {
  title: 'Style/Component Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## 컴포넌트별 토큰 사용

BeautyMaster 대시보드가 실제로 화면에 그리는 MUI 컴포넌트만 담는다.
적힌 토큰은 모두 소스에서 확인한 값이다 — 쓰지 않는 컴포넌트는 넣지 않는다.

### 목적
- 이 화면이 어떤 컴포넌트를 어떤 토큰으로 그리는지 한눈에 보기
- 토큰을 바꿀 때 어디가 흔들리는지 파악
- 테마가 이미 잡아둔 규칙(themeOverride)을 화면에서 중복해 쓰지 않기
        `,
      },
    },
  },
};

/** Docs - 컴포넌트 토큰 문서 */
export const Docs = {
  render: () => {
    const categories = ['palette', 'typography', 'spacing', 'shape'];

    const categoryDescriptions = {
      palette: '색 — 대부분 accent · surface · text 세 갈래로 끝난다',
      typography: '글자 크기·굵기 — variant가 아니라 sx의 px 스케일',
      spacing: '여백 — 8px 단위, 운영 화면이라 0.25 단계까지 쓴다',
      shape: '모서리·높이 — 표면은 각지게, 폼·카드만 예외',
    };

    const matrix = componentList.map((name) => {
      const component = componentTokenMap[name];
      return {
        name,
        counts: categories.map((cat) => component?.tokens[cat]?.items.length || 0),
        total: Object.values(component?.tokens || {}).reduce(
          (sum, cat) => sum + (cat.items?.length || 0), 0
        ),
      };
    });

    const overrides = componentList
      .map((name) => ({ name, override: componentTokenMap[name]?.themeOverride }))
      .filter((row) => row.override);

    return (
      <>
        <DocumentTitle
          title="Component Tokens"
          status="Available"
          note="Which theme tokens each component actually consumes on screen"
          brandName="BeautyMaster"
          systemName="Influencer Dashboard"
          version="2.0"
        />
        <PageContainer>
          <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
            Component Token Usage
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
            대시보드가 쓰는 컴포넌트는 아래 { componentList.length }개다 — 각각이 어떤 토큰을 먹는지 적는다.
          </Typography>

          <SectionTitle title="Token Categories" description="이 문서에서 쓰는 네 갈래" />
          <TableContainer sx={ { mb: 6 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: '15%' } }>Category</TableCell>
                  <TableCell sx={ { fontWeight: 600, width: '15%' } }>Name</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>설명</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { categories.map((cat) => (
                  <TableRow key={ cat }>
                    <TableCell sx={ { fontFamily: 'monospace', fontSize: 12 } }>{ cat }</TableCell>
                    <TableCell sx={ { fontWeight: 600 } }>{ tokenCategories[cat]?.name }</TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>
                      { categoryDescriptions[cat] }
                    </TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle title="Usage Matrix" description="컴포넌트 × 토큰 갈래 (숫자는 이 화면에서 쓰는 토큰 수)" />
          <TableContainer sx={ { mb: 3 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: '20%' } }>Component</TableCell>
                  { categories.map((cat) => (
                    <TableCell key={ cat } align="center" sx={ { fontWeight: 600, fontSize: 11 } }>
                      { tokenCategories[cat]?.name }
                    </TableCell>
                  )) }
                  <TableCell align="center" sx={ { fontWeight: 600 } }>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { matrix.map((row) => (
                  <TableRow key={ row.name }>
                    <TableCell sx={ { fontWeight: 600 } }>{ row.name }</TableCell>
                    { row.counts.map((count, idx) => (
                      <TableCell key={ categories[idx] } align="center">
                        { count > 0 ? (
                          <Box
                            sx={ {
                              display: 'inline-block',
                              minWidth: 24,
                              py: 0.25,
                              px: 0.75,
                              backgroundColor: count >= 4 ? 'accent.tint' : 'surface.muted',
                              color: count >= 4 ? 'accent.main' : 'text.primary',
                              fontSize: 12,
                              fontWeight: 600,
                            } }
                          >
                            { count }
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">-</Typography>
                        ) }
                      </TableCell>
                    )) }
                    <TableCell align="center" sx={ { fontWeight: 600 } }>{ row.total }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={ { display: 'flex', gap: 3, mb: 6 } }>
            <Box sx={ { display: 'flex', alignItems: 'center', gap: 1 } }>
              <Box sx={ { width: 24, height: 20, backgroundColor: 'accent.tint' } } />
              <Typography variant="caption">4개 이상</Typography>
            </Box>
            <Box sx={ { display: 'flex', alignItems: 'center', gap: 1 } }>
              <Box sx={ { width: 24, height: 20, backgroundColor: 'surface.muted' } } />
              <Typography variant="caption">1~3개</Typography>
            </Box>
          </Box>

          <SectionTitle
            title="테마가 이미 잡아둔 규칙"
            description="src/styles/themes/default.js의 components. 화면 코드에서 다시 쓰지 않아도 된다."
          />
          <TableContainer sx={ { mb: 6 } }>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={ { fontWeight: 600, width: '20%' } }>Component</TableCell>
                  <TableCell sx={ { fontWeight: 600 } }>Theme Override</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { overrides.map((row) => (
                  <TableRow key={ row.name }>
                    <TableCell sx={ { fontWeight: 600 } }>{ row.name }</TableCell>
                    <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>{ row.override }</TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>

          <SectionTitle title="Component Details" description="컴포넌트별 토큰과 그 역할" />

          { componentList.map((name) => {
            const component = componentTokenMap[name];
            if (!component) return null;

            return (
              <Box key={ name } sx={ { mb: 4 } }>
                <Typography variant="h6" sx={ { fontWeight: 600, mb: 0.5 } }>
                  { component.name }
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={ { mb: 0.5 } }>
                  { component.description }
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={ { display: 'block', mb: 2 } }>
                  쓰이는 곳: { component.where }
                  { component.themeOverride ? ` · 테마 오버라이드: ${ component.themeOverride }` : '' }
                </Typography>

                <TableContainer sx={ { mb: 2 } }>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={ { fontWeight: 600, width: '14%' } }>Category</TableCell>
                        <TableCell sx={ { fontWeight: 600, width: '36%' } }>Token</TableCell>
                        <TableCell sx={ { fontWeight: 600 } }>Role</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      { Object.entries(component.tokens).flatMap(([category, data]) =>
                        data.items.map((item, idx) => (
                          <TableRow key={ `${ category }-${ item.token }` }>
                            { idx === 0 ? (
                              <TableCell
                                rowSpan={ data.items.length }
                                sx={ { fontWeight: 600, verticalAlign: 'top', fontSize: 13 } }
                              >
                                { tokenCategories[category]?.name }
                              </TableCell>
                            ) : null }
                            <TableCell sx={ { fontFamily: 'monospace', fontSize: 12 } }>
                              { item.token }
                            </TableCell>
                            <TableCell sx={ { color: 'text.secondary', fontSize: 13 } }>
                              { item.role }
                            </TableCell>
                          </TableRow>
                        ))
                      ) }
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider />
              </Box>
            );
          }) }
        </PageContainer>
      </>
    );
  },
};
