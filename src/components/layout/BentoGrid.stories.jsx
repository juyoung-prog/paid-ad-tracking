import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DocumentTitle, PageContainer, SectionTitle } from '../storybookDocumentation';
import { BentoGrid, BentoItem } from './BentoGrid';
import { BENTO_PRESETS } from './bentoPresets';
import Placeholder from '../../common/ui/Placeholder';

export default {
  title: 'Component/8. Layout/BentoGrid',
  component: BentoGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## BentoGrid

Apple 스타일의 벤토 박스 그리드 레이아웃.

### 용도
- 대시보드 위젯 레이아웃
- 포트폴리오/갤러리
- Feature 소개 섹션
        `,
      },
    },
  },
  argTypes: {
    columns: {
      control: { type: 'range', min: 2, max: 6 },
      description: '열 개수',
    },
    gap: {
      control: { type: 'range', min: 0, max: 6 },
      description: '셀 간 간격',
    },
    rowHeight: {
      control: 'text',
      description: '기본 행 높이',
    },
  },
};

/** 기본 사용 */
export const Default = {
  args: {
    columns: 4,
    gap: 2,
    rowHeight: '150px',
  },
  render: (args) => (
    <BentoGrid { ...args }>
      <BentoItem colSpan={ 2 } rowSpan={ 2 }>
        <Placeholder.Box label="Featured" height="100%" />
      </BentoItem>
      <BentoItem>
        <Placeholder.Box label="Item 2" height="100%" />
      </BentoItem>
      <BentoItem>
        <Placeholder.Box label="Item 3" height="100%" />
      </BentoItem>
      <BentoItem colSpan={ 2 }>
        <Placeholder.Box label="Wide" height="100%" />
      </BentoItem>
    </BentoGrid>
  ),
};

/** 문서 및 데모 */
export const Documentation = {
  render: () => (
    <>
      <DocumentTitle
        title="BentoGrid"
        status="Available"
        note="Apple-style bento box layout"
        brandName="Layout"
        systemName="Starter Kit"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
          BentoGrid
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
          CSS Grid를 활용한 Apple 스타일의 벤토 박스 레이아웃입니다.
          다양한 크기의 셀을 유연하게 배치할 수 있습니다.
        </Typography>

        <SectionTitle title="Props - BentoGrid" description="BentoGrid 컴포넌트의 Props입니다." />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={ { fontWeight: 600 } }>Prop</TableCell>
                <TableCell sx={ { fontWeight: 600 } }>Type</TableCell>
                <TableCell sx={ { fontWeight: 600 } }>Default</TableCell>
                <TableCell sx={ { fontWeight: 600 } }>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>columns</TableCell>
                <TableCell>number</TableCell>
                <TableCell>4</TableCell>
                <TableCell>기본 열 개수</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>gap</TableCell>
                <TableCell>number | string</TableCell>
                <TableCell>2</TableCell>
                <TableCell>셀 간 간격</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>rowHeight</TableCell>
                <TableCell>number | string</TableCell>
                <TableCell>&apos;200px&apos;</TableCell>
                <TableCell>기본 행 높이</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>isAutoRows</TableCell>
                <TableCell>boolean</TableCell>
                <TableCell>false</TableCell>
                <TableCell>자동 행 높이 여부</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="Props - BentoItem" description="BentoItem 컴포넌트의 Props입니다." />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={ { fontWeight: 600 } }>Prop</TableCell>
                <TableCell sx={ { fontWeight: 600 } }>Type</TableCell>
                <TableCell sx={ { fontWeight: 600 } }>Default</TableCell>
                <TableCell sx={ { fontWeight: 600 } }>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>colSpan</TableCell>
                <TableCell>number | object</TableCell>
                <TableCell>1</TableCell>
                <TableCell>열 span (1-4)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>rowSpan</TableCell>
                <TableCell>number | object</TableCell>
                <TableCell>1</TableCell>
                <TableCell>행 span (1-3)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>background</TableCell>
                <TableCell>string</TableCell>
                <TableCell>-</TableCell>
                <TableCell>배경색</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>isContained</TableCell>
                <TableCell>boolean</TableCell>
                <TableCell>true</TableCell>
                <TableCell>overflow hidden 적용</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="Featured Layout" description="대표 콘텐츠를 강조하는 레이아웃입니다." />
        <BentoGrid columns={ 4 } gap={ 2 } rowHeight="150px">
          <BentoItem colSpan={ 2 } rowSpan={ 2 }>
            <Placeholder.Media index={ 0 } sx={ { height: '100%', width: '100%' } } />
          </BentoItem>
          <BentoItem>
            <Placeholder.Box label="Quick Stats" height="100%" />
          </BentoItem>
          <BentoItem>
            <Placeholder.Box label="Updates" height="100%" />
          </BentoItem>
          <BentoItem>
            <Placeholder.Box label="Settings" height="100%" />
          </BentoItem>
          <BentoItem>
            <Placeholder.Box label="Profile" height="100%" />
          </BentoItem>
        </BentoGrid>

        <SectionTitle title="Dashboard Layout" description="대시보드 스타일 레이아웃입니다." />
        <BentoGrid columns={ 4 } gap={ 2 } rowHeight="120px">
          <BentoItem colSpan={ 3 }>
            <Placeholder.Box label="Header Banner" height="100%" />
          </BentoItem>
          <BentoItem rowSpan={ 2 }>
            <Placeholder.Box label="Activity" height="100%" />
          </BentoItem>
          <BentoItem>
            <Placeholder.Box label="Growth" height="100%" />
          </BentoItem>
          <BentoItem>
            <Placeholder.Box label="Users" height="100%" />
          </BentoItem>
          <BentoItem>
            <Placeholder.Box label="Tasks" height="100%" />
          </BentoItem>
        </BentoGrid>

        <SectionTitle title="Gallery Layout" description="포트폴리오/갤러리 스타일입니다." />
        <BentoGrid columns={ 3 } gap={ 1 } rowHeight="180px">
          <BentoItem colSpan={ 2 } rowSpan={ 2 }>
            <Placeholder.Media index={ 0 } sx={ { height: '100%', width: '100%' } } />
          </BentoItem>
          <BentoItem>
            <Placeholder.Media index={ 1 } sx={ { height: '100%', width: '100%' } } />
          </BentoItem>
          <BentoItem>
            <Placeholder.Media index={ 2 } sx={ { height: '100%', width: '100%' } } />
          </BentoItem>
          <BentoItem>
            <Placeholder.Media index={ 3 } sx={ { height: '100%', width: '100%' } } />
          </BentoItem>
          <BentoItem colSpan={ 2 }>
            <Placeholder.Media index={ 4 } sx={ { height: '100%', width: '100%' } } />
          </BentoItem>
        </BentoGrid>

        <SectionTitle title="Preset Layouts" description="자주 사용되는 프리셋 레이아웃입니다." />
        <Stack spacing={ 4 }>
          <Box>
            <Typography variant="subtitle2" sx={ { mb: 1, color: 'text.secondary' } }>
              BENTO_PRESETS.featured
            </Typography>
            <BentoGrid columns={ 3 } gap={ 2 } rowHeight="100px">
              { BENTO_PRESETS.featured.map((preset, i) => (
                <BentoItem key={ i } colSpan={ preset.colSpan } rowSpan={ preset.rowSpan }>
                  <Placeholder.Box label={ `${preset.colSpan}×${preset.rowSpan}` } height="100%" />
                </BentoItem>
              )) }
            </BentoGrid>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={ { mb: 1, color: 'text.secondary' } }>
              BENTO_PRESETS.hero
            </Typography>
            <BentoGrid columns={ 4 } gap={ 2 } rowHeight="100px">
              { BENTO_PRESETS.hero.map((preset, i) => (
                <BentoItem key={ i } colSpan={ preset.colSpan } rowSpan={ preset.rowSpan }>
                  <Placeholder.Box label={ `${preset.colSpan}×${preset.rowSpan}` } height="100%" />
                </BentoItem>
              )) }
            </BentoGrid>
          </Box>
        </Stack>

        <SectionTitle title="Usage Example" description="코드 사용 예시입니다." />
        <Box
          component="pre"
          sx={ {
            backgroundColor: 'grey.100',
            p: 3,
            fontSize: 13,
            fontFamily: 'monospace',
            overflow: 'auto',
            lineHeight: 1.6,
          } }
        >
          { `// 기본 벤토 그리드
<BentoGrid columns={4} gap={2}>
  <BentoItem colSpan={2} rowSpan={2}>
    <FeaturedCard />
  </BentoItem>
  <BentoItem>
    <SmallCard />
  </BentoItem>
  <BentoItem>
    <SmallCard />
  </BentoItem>
  <BentoItem colSpan={2}>
    <WideCard />
  </BentoItem>
</BentoGrid>

// 프리셋 사용
import { BENTO_PRESETS } from './bentoPresets';

<BentoGrid columns={3}>
  {items.map((item, i) => (
    <BentoItem
      key={i}
      colSpan={BENTO_PRESETS.featured[i]?.colSpan || 1}
      rowSpan={BENTO_PRESETS.featured[i]?.rowSpan || 1}
    >
      <Card {...item} />
    </BentoItem>
  ))}
</BentoGrid>` }
        </Box>
      </PageContainer>
    </>
  ),
};
