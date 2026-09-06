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
import { QuotedContainer } from '.';

export default {
  title: 'Component/1. Typography/QuotedContainer',
  component: QuotedContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## QuotedContainer

인용 부호를 텍스트의 시작/끝 위치에 스마트하게 배치하는 컴포넌트.

### 용도
- 인용문을 시각적으로 강조
- Editorial 스타일의 큰 인용 부호 장식
- 인용 부호는 format_quote 아이콘 하나로 고정, 크기(quoteSize)와 색상(quoteColor)만 조절
        `,
      },
    },
  },
  argTypes: {
    children: {
      control: { type: 'text' },
      description: '인용할 텍스트',
    },
    quoteSize: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
      description: '인용 부호 크기',
    },
    quoteColor: {
      control: { type: 'select' },
      options: ['text.disabled', 'text.secondary', 'primary.main', 'secondary.main', '#000000', '#666666'],
      description: '인용 부호 색상',
    },
    position: {
      control: { type: 'select' },
      options: ['outside', 'inside', 'overlay'],
      description: '인용 부호 위치',
    },
    animated: {
      control: { type: 'boolean' },
      description: '등장 애니메이션',
    },
    author: {
      control: { type: 'text' },
      description: '인용 출처/저자',
    },
    variant: {
      control: { type: 'select' },
      options: ['h3', 'h4', 'h5', 'h6', 'body1', 'body2'],
      description: '타이포그래피 variant',
    },
    align: {
      control: { type: 'select' },
      options: ['left', 'center', 'right'],
      description: '텍스트 정렬',
    },
  },
};

const sampleQuotes = {
  short: 'Design is not just what it looks like. Design is how it works.',
  medium: 'The details are not the details. They make the design. A design is not complete until the user finds it obvious.',
  long: 'Good design is as little design as possible. Less, but better, because it concentrates on the essential aspects, and the products are not burdened with non-essentials. Back to purity, back to simplicity.',
  korean: '디자인은 단순히 어떻게 보이고 느껴지는가가 아닙니다. 디자인은 어떻게 작동하는가입니다.',
};

/** 기본 사용 */
export const Default = {
  args: {
    children: sampleQuotes.short,
    quoteSize: 'lg',
    quoteColor: 'text.disabled',
    position: 'outside',
    animated: false,
    author: 'Steve Jobs',
    variant: 'h4',
    align: 'left',
  },
};

/** 문서 및 데모 */
export const Documentation = {
  render: () => (
    <>
      <DocumentTitle
        title="QuotedContainer"
        status="Available"
        note="Place quote marks around text"
        brandName="Typography"
        systemName="Starter Kit"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
          QuotedContainer
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
          인용 부호를 텍스트의 시작/끝 위치에 스마트하게 배치하는 컴포넌트입니다.
          대형 장식적 인용 부호로 인용문을 시각적으로 강조합니다.
        </Typography>

        <SectionTitle title="Props" description="QuotedContainer 컴포넌트의 Props 목록입니다." />
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
                <TableCell sx={ { fontFamily: 'monospace' } }>children</TableCell>
                <TableCell>string</TableCell>
                <TableCell>-</TableCell>
                <TableCell>인용할 텍스트 (필수)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>quoteSize</TableCell>
                <TableCell>&apos;sm&apos; | &apos;md&apos; | &apos;lg&apos; | &apos;xl&apos;</TableCell>
                <TableCell>&apos;lg&apos;</TableCell>
                <TableCell>인용 부호 크기</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>quoteColor</TableCell>
                <TableCell>string</TableCell>
                <TableCell>&apos;text.disabled&apos;</TableCell>
                <TableCell>인용 부호 색상</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>position</TableCell>
                <TableCell>&apos;outside&apos; | &apos;inside&apos; | &apos;overlay&apos;</TableCell>
                <TableCell>&apos;outside&apos;</TableCell>
                <TableCell>인용 부호 위치</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>animated</TableCell>
                <TableCell>boolean</TableCell>
                <TableCell>false</TableCell>
                <TableCell>등장 애니메이션</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>author</TableCell>
                <TableCell>string</TableCell>
                <TableCell>-</TableCell>
                <TableCell>인용 출처/저자</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>variant</TableCell>
                <TableCell>string</TableCell>
                <TableCell>&apos;h4&apos;</TableCell>
                <TableCell>타이포그래피 variant</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>align</TableCell>
                <TableCell>&apos;left&apos; | &apos;center&apos; | &apos;right&apos;</TableCell>
                <TableCell>&apos;left&apos;</TableCell>
                <TableCell>텍스트 정렬</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="Quote Size" description="네 가지 인용 부호 크기입니다." />
        <Stack spacing={ 4 }>
          <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
            <Typography variant="caption" sx={ { mb: 2, display: 'block', color: 'text.secondary' } }>
              Small (sm)
            </Typography>
            <QuotedContainer quoteSize="sm" author="Steve Jobs">
              { sampleQuotes.short }
            </QuotedContainer>
          </Box>
          <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
            <Typography variant="caption" sx={ { mb: 2, display: 'block', color: 'text.secondary' } }>
              Medium (md)
            </Typography>
            <QuotedContainer quoteSize="md" author="Steve Jobs">
              { sampleQuotes.short }
            </QuotedContainer>
          </Box>
          <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
            <Typography variant="caption" sx={ { mb: 2, display: 'block', color: 'text.secondary' } }>
              Large (lg) - Default
            </Typography>
            <QuotedContainer quoteSize="lg" author="Steve Jobs">
              { sampleQuotes.short }
            </QuotedContainer>
          </Box>
          <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
            <Typography variant="caption" sx={ { mb: 2, display: 'block', color: 'text.secondary' } }>
              Extra Large (xl)
            </Typography>
            <QuotedContainer quoteSize="xl" author="Steve Jobs">
              { sampleQuotes.short }
            </QuotedContainer>
          </Box>
        </Stack>

        <SectionTitle title="Position Variants" description="세 가지 인용 부호 위치 옵션입니다." />
        <Stack spacing={ 5 }>
          <Box>
            <Typography variant="subtitle2" sx={ { mb: 1, color: 'text.secondary' } }>
              Outside (기본) - 첫 글자 좌상단, 마지막 글자 우하단
            </Typography>
            <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
              <QuotedContainer position="outside" author="Steve Jobs">
                { sampleQuotes.short }
              </QuotedContainer>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={ { mb: 1, color: 'text.secondary' } }>
              Inside - 더 작은 아이콘, 텍스트에 밀착
            </Typography>
            <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
              <QuotedContainer position="inside" author="Steve Jobs">
                { sampleQuotes.short }
              </QuotedContainer>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={ { mb: 1, color: 'text.secondary' } }>
              Overlay - 텍스트 뒤에 배경 장식
            </Typography>
            <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
              <QuotedContainer position="overlay" author="Dieter Rams">
                { sampleQuotes.medium }
              </QuotedContainer>
            </Box>
          </Box>
        </Stack>
      </PageContainer>
    </>
  ),
};
