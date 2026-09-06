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
import { Title } from '.';

export default {
  title: 'Component/1. Typography/Title',
  component: Title,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## Title

섹션/아이템의 계층적 타이틀 시스템을 제공하는 컴포넌트.

### 용도
- 페이지 섹션의 제목 표시
- Overline + Title + Subtitle 조합으로 정보 계층 구성
- 다양한 레이아웃 옵션으로 유연한 배치
        `,
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: '메인 타이틀 텍스트',
    },
    overline: {
      control: 'text',
      description: '상단 작은 레이블',
    },
    subtitle: {
      control: 'text',
      description: '하단 서브타이틀',
    },
    level: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4'],
      description: '시맨틱 HTML 레벨',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: '텍스트 정렬',
    },
    layout: {
      control: 'select',
      options: ['stack', 'inline', 'split'],
      description: '레이아웃 방식',
    },
    divider: {
      control: 'boolean',
      description: '하단 구분선 표시',
    },
    dividerStyle: {
      control: 'select',
      options: ['line', 'dot', 'gradient'],
      description: '구분선 스타일',
    },
  },
};

/** 기본 사용 */
export const Default = {
  args: {
    title: 'Section Title',
    overline: 'Category',
    subtitle: 'A brief description of this section that provides context.',
    level: 'h2',
    align: 'left',
    layout: 'stack',
    divider: false,
  },
};

/** 문서 및 데모 */
export const Documentation = {
  render: () => (
    <>
      <DocumentTitle
        title="Title"
        status="Available"
        note="Hierarchical title system for sections and items"
        brandName="Typography"
        systemName="Starter Kit"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
          Title Component
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
          Overline, 메인 타이틀, 서브타이틀의 조합으로 명확한 정보 계층을 구성합니다.
        </Typography>

        <SectionTitle title="Props" description="Title 컴포넌트의 Props 목록입니다." />
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
                <TableCell sx={ { fontFamily: 'monospace' } }>title</TableCell>
                <TableCell>string</TableCell>
                <TableCell>-</TableCell>
                <TableCell>메인 타이틀 텍스트 (필수)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>overline</TableCell>
                <TableCell>string</TableCell>
                <TableCell>-</TableCell>
                <TableCell>상단 작은 레이블</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>subtitle</TableCell>
                <TableCell>string</TableCell>
                <TableCell>-</TableCell>
                <TableCell>하단 서브타이틀</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>level</TableCell>
                <TableCell>&apos;h1&apos; | &apos;h2&apos; | &apos;h3&apos; | &apos;h4&apos;</TableCell>
                <TableCell>&apos;h2&apos;</TableCell>
                <TableCell>시맨틱 HTML 레벨</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>align</TableCell>
                <TableCell>&apos;left&apos; | &apos;center&apos; | &apos;right&apos;</TableCell>
                <TableCell>&apos;left&apos;</TableCell>
                <TableCell>텍스트 정렬</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>layout</TableCell>
                <TableCell>&apos;stack&apos; | &apos;inline&apos; | &apos;split&apos;</TableCell>
                <TableCell>&apos;stack&apos;</TableCell>
                <TableCell>레이아웃 방식</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>divider</TableCell>
                <TableCell>boolean</TableCell>
                <TableCell>false</TableCell>
                <TableCell>하단 구분선 표시</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>dividerStyle</TableCell>
                <TableCell>&apos;line&apos; | &apos;dot&apos; | &apos;gradient&apos;</TableCell>
                <TableCell>&apos;line&apos;</TableCell>
                <TableCell>구분선 스타일</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="Layout Variants" description="세 가지 레이아웃 옵션을 제공합니다." />
        <Stack spacing={ 6 }>
          <Box>
            <Typography variant="subtitle2" sx={ { mb: 2, color: 'text.secondary' } }>
              Stack (기본) - 수직 배치
            </Typography>
            <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
              <Title
                title="Our Services"
                overline="What We Do"
                subtitle="We provide comprehensive solutions for your business needs."
                layout="stack"
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={ { mb: 2, color: 'text.secondary' } }>
              Inline - Overline과 Title 가로 배치
            </Typography>
            <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
              <Title
                title="Our Services"
                overline="01"
                subtitle="We provide comprehensive solutions for your business needs."
                layout="inline"
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={ { mb: 2, color: 'text.secondary' } }>
              Split - Title과 Subtitle 양쪽 분리
            </Typography>
            <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
              <Title
                title="Our Services"
                overline="What We Do"
                subtitle="We provide comprehensive solutions for your business needs."
                layout="split"
              />
            </Box>
          </Box>
        </Stack>

        <SectionTitle title="Heading Levels" description="시맨틱 HTML 레벨에 따른 크기 변화입니다." />
        <Stack spacing={ 4 }>
          <Title title="Heading Level 1" level="h1" />
          <Title title="Heading Level 2" level="h2" />
          <Title title="Heading Level 3" level="h3" />
          <Title title="Heading Level 4" level="h4" />
        </Stack>

        <SectionTitle title="Divider Styles" description="세 가지 구분선 스타일을 제공합니다." />
        <Stack spacing={ 6 }>
          <Box>
            <Title
              title="Line Divider"
              subtitle="기본 라인 스타일"
              divider
              dividerStyle="line"
            />
          </Box>
          <Box>
            <Title
              title="Dot Divider"
              subtitle="점 3개로 구성된 장식적 스타일"
              divider
              dividerStyle="dot"
            />
          </Box>
          <Box>
            <Title
              title="Gradient Divider"
              subtitle="가운데가 진하고 양 끝이 투명한 그라데이션"
              divider
              dividerStyle="gradient"
            />
          </Box>
        </Stack>

        <SectionTitle title="Alignment" description="텍스트 정렬 옵션입니다." />
        <Stack spacing={ 6 }>
          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <Title
              title="Left Aligned"
              overline="Alignment"
              subtitle="기본 좌측 정렬입니다."
              align="left"
              divider
              dividerStyle="gradient"
            />
          </Box>
          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <Title
              title="Center Aligned"
              overline="Alignment"
              subtitle="중앙 정렬입니다."
              align="center"
              divider
              dividerStyle="gradient"
            />
          </Box>
          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <Title
              title="Right Aligned"
              overline="Alignment"
              subtitle="우측 정렬입니다."
              align="right"
              divider
              dividerStyle="gradient"
            />
          </Box>
        </Stack>
      </PageContainer>
    </>
  ),
};
