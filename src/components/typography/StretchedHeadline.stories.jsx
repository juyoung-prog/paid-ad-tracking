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
import { StretchedHeadline, StretchedHeadlineMultiline } from '.';

export default {
  title: 'Component/1. Typography/StretchedHeadline',
  component: StretchedHeadline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## StretchedHeadline

단어 간격을 동적으로 늘려 컨테이너 전체 너비를 채우는 히어로 타이포그래피 컴포넌트.

### 용도
- 히어로 섹션의 임팩트 있는 헤드라인
- 풀 너비 타이포그래피 디자인
- 스크롤 트리거 애니메이션
        `,
      },
    },
  },
  argTypes: {
    text: {
      control: 'text',
      description: '표시할 텍스트',
    },
    fillWidth: {
      control: 'boolean',
      description: '전체 너비 채우기',
    },
    minWordSpacing: {
      control: { type: 'number', min: 0, max: 5, step: 0.1 },
      description: 'fillWidth가 false일 때만 적용되는 word-spacing 값 (em)',
    },
    variant: {
      control: 'select',
      options: ['static', 'animated'],
      description: '애니메이션 variant',
    },
    textTransform: {
      control: 'select',
      options: ['none', 'uppercase', 'lowercase'],
      description: '텍스트 변환',
    },
  },
};

/** 기본 사용 */
export const Default = {
  args: {
    text: 'DESIGN SYSTEM',
    fillWidth: true,
    variant: 'static',
    textTransform: 'uppercase',
  },
};

/** 문서 및 데모 */
export const Documentation = {
  render: () => (
    <>
      <DocumentTitle
        title="StretchedHeadline"
        status="Available"
        note="Hero typography that fills container width"
        brandName="Typography"
        systemName="Starter Kit"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
          StretchedHeadline
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
          단어 간격을 동적으로 늘려 컨테이너 전체 너비를 채우는 히어로 타이포그래피 컴포넌트입니다.
          각 단어를 개별 span으로 분리하고 flexbox의 space-between으로 배치합니다.
        </Typography>

        <SectionTitle title="Props" description="StretchedHeadline 컴포넌트의 Props 목록입니다." />
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
                <TableCell sx={ { fontFamily: 'monospace' } }>text</TableCell>
                <TableCell>string</TableCell>
                <TableCell>-</TableCell>
                <TableCell>표시할 텍스트 (필수)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>fillWidth</TableCell>
                <TableCell>boolean</TableCell>
                <TableCell>true</TableCell>
                <TableCell>전체 너비 채우기 (space-between)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>variant</TableCell>
                <TableCell>&apos;static&apos; | &apos;animated&apos;</TableCell>
                <TableCell>&apos;static&apos;</TableCell>
                <TableCell>애니메이션 variant</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>fontSize</TableCell>
                <TableCell>string | number</TableCell>
                <TableCell>clamp(2rem, 8vw, 6rem)</TableCell>
                <TableCell>폰트 크기</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>fontWeight</TableCell>
                <TableCell>number</TableCell>
                <TableCell>900</TableCell>
                <TableCell>폰트 굵기</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>textTransform</TableCell>
                <TableCell>&apos;none&apos; | &apos;uppercase&apos; | &apos;lowercase&apos;</TableCell>
                <TableCell>&apos;uppercase&apos;</TableCell>
                <TableCell>텍스트 변환</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="Fill Width Mode" description="fillWidth={true}일 때 단어가 전체 너비에 균등 배치됩니다." />
        <Stack spacing={ 4 }>
          <Box sx={ { p: 4, backgroundColor: 'grey.50' } }>
            <StretchedHeadline text="DESIGN SYSTEM" />
          </Box>
          <Box sx={ { p: 4, backgroundColor: 'grey.900', color: 'white' } }>
            <StretchedHeadline text="WE CREATE EXPERIENCES" sx={ { color: 'white' } } />
          </Box>
          <Box sx={ { p: 4, backgroundColor: 'primary.main', color: 'white' } }>
            <StretchedHeadline text="BOLD TYPOGRAPHY" sx={ { color: 'white' } } />
          </Box>
        </Stack>

        <SectionTitle title="Word Spacing Mode" description="fillWidth={false}일 때 word-spacing으로 간격을 조절합니다." />
        <Stack spacing={ 4 }>
          <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
            <StretchedHeadline
              text="Hello World"
              fillWidth={ false }
              minWordSpacing={ 0.5 }
              textTransform="none"
            />
          </Box>
          <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
            <StretchedHeadline
              text="Creative Studio"
              fillWidth={ false }
              minWordSpacing={ 2 }
              textTransform="none"
            />
          </Box>
        </Stack>

        <SectionTitle title="Multiline Headlines" description="StretchedHeadlineMultiline으로 여러 줄을 배치합니다." />
        <Stack spacing={ 4 }>
          <Box sx={ { p: 4, backgroundColor: 'grey.50' } }>
            <StretchedHeadlineMultiline
              lines={ ['WE CREATE', 'DIGITAL', 'EXPERIENCES'] }
              gap={ 0 }
            />
          </Box>
          <Box sx={ { p: 4, backgroundColor: 'grey.900' } }>
            <StretchedHeadlineMultiline
              lines={ ['INNOVATION', 'MEETS', 'DESIGN'] }
              gap={ 1 }
              headlineProps={ { sx: { color: 'white' } } }
            />
          </Box>
        </Stack>

        <SectionTitle title="Font Size Variations" description="다양한 폰트 크기 옵션입니다." />
        <Stack spacing={ 3 }>
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider' } }>
            <StretchedHeadline text="SMALL SIZE" fontSize="1.5rem" />
          </Box>
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider' } }>
            <StretchedHeadline text="MEDIUM SIZE" fontSize="3rem" />
          </Box>
          <Box sx={ { p: 2, border: '1px solid', borderColor: 'divider' } }>
            <StretchedHeadline text="LARGE SIZE" fontSize="5rem" />
          </Box>
        </Stack>

        <SectionTitle title="Animated Variant" description="스크롤하여 애니메이션을 확인하세요." />
        <Box sx={ { height: 100 } } />
        <Stack spacing={ 6 }>
          <Box sx={ { p: 6, backgroundColor: 'grey.900' } }>
            <StretchedHeadline
              text="SCROLL TRIGGERED"
              variant="animated"
              sx={ { color: 'white' } }
            />
          </Box>
          <Box sx={ { p: 6, backgroundColor: 'primary.main' } }>
            <StretchedHeadlineMultiline
              lines={ ['FUTURE', 'OF', 'DESIGN'] }
              gap={ 0 }
              headlineProps={ {
                variant: 'animated',
                sx: { color: 'white' },
              } }
            />
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
          {`// 기본 사용
<StretchedHeadline text="DESIGN SYSTEM" />

// 여러 줄
<StretchedHeadlineMultiline
  lines={['WE CREATE', 'DIGITAL', 'EXPERIENCES']}
  gap={0}
/>

// 애니메이션
<StretchedHeadline
  text="SCROLL TRIGGERED"
  variant="animated"
/>`}
        </Box>
      </PageContainer>
    </>
  ),
};
