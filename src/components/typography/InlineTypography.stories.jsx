import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { DocumentTitle, PageContainer, SectionTitle } from '../storybookDocumentation';
import Placeholder, { placeholderSvg } from '../../common/ui/Placeholder';
import {
  InlineTypography,
  InlineObject,
  InlineIcon,
  InlineImage,
} from '.';

export default {
  title: 'Component/1. Typography/InlineTypography',
  component: InlineTypography,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## InlineTypography

텍스트 흐름 속에 이미지, 아이콘, 또는 다른 컴포넌트를 자연스럽게 삽입할 수 있는 컴포넌트.

### 용도
- Editorial 스타일의 텍스트-이미지 조합
- 아이콘과 텍스트의 인라인 배치
- 브랜드 로고나 이모지 삽입
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['body1', 'body2', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: '타이포그래피 variant',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
      description: '텍스트 정렬',
    },
  },
};

// 샘플 이미지 URL (placeholderSvg 기반)
const sampleImages = {
  avatar1: placeholderSvg(100, 100),
  avatar2: placeholderSvg(100, 100),
  icon1: placeholderSvg(100, 100),
  landscape: placeholderSvg(200, 100),
};

/** 기본 사용 */
export const Default = {
  render: () => (
    <InlineTypography variant="h4">
      We build <InlineIcon icon={ <StarIcon /> } color="primary.main" size={ 1 } /> amazing products.
    </InlineTypography>
  ),
};

/** 문서 및 데모 */
export const Documentation = {
  render: () => (
    <>
      <DocumentTitle
        title="InlineTypography"
        status="Available"
        note="Insert images/icons inline with text"
        brandName="Typography"
        systemName="Starter Kit"
        version="1.0"
      />
      <PageContainer>
        <Typography variant="h4" sx={ { fontWeight: 700, mb: 1 } }>
          InlineTypography
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={ { mb: 4 } }>
          텍스트 흐름 속에 이미지, 아이콘, 또는 다른 컴포넌트를 자연스럽게 삽입할 수 있는 컴포넌트입니다.
          Compound component 패턴으로 InlineObject, InlineIcon, InlineImage와 함께 사용합니다.
        </Typography>

        <SectionTitle title="Sub Components" description="InlineTypography와 함께 사용하는 하위 컴포넌트들입니다." />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={ { fontWeight: 600 } }>Component</TableCell>
                <TableCell sx={ { fontWeight: 600 } }>Description</TableCell>
                <TableCell sx={ { fontWeight: 600 } }>Use Case</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>InlineObject</TableCell>
                <TableCell>범용 인라인 요소 래퍼</TableCell>
                <TableCell>커스텀 컴포넌트, 복잡한 요소</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>InlineIcon</TableCell>
                <TableCell>MUI 아이콘 전용 래퍼</TableCell>
                <TableCell>아이콘 삽입</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={ { fontFamily: 'monospace' } }>InlineImage</TableCell>
                <TableCell>이미지 전용 래퍼</TableCell>
                <TableCell>이미지, 아바타 삽입</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <SectionTitle title="With Icons" description="MUI 아이콘을 텍스트와 함께 배치합니다." />
        <Stack spacing={ 3 }>
          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <InlineTypography variant="h4">
              We <InlineIcon icon={ <FavoriteIcon /> } color="error.main" /> building
              <InlineIcon icon={ <AutoAwesomeIcon /> } color="warning.main" /> products.
            </InlineTypography>
          </Box>

          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <InlineTypography variant="h3">
              Launch your ideas <InlineIcon icon={ <RocketLaunchIcon /> } color="primary.main" size={ 1.2 } /> today.
            </InlineTypography>
          </Box>

          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <InlineTypography variant="body1">
              This feature received <InlineIcon icon={ <StarIcon /> } color="warning.main" />
              <InlineIcon icon={ <StarIcon /> } color="warning.main" />
              <InlineIcon icon={ <StarIcon /> } color="warning.main" />
              <InlineIcon icon={ <StarIcon /> } color="warning.main" />
              <InlineIcon icon={ <StarIcon /> } color="warning.main" /> 5-star rating from our users.
            </InlineTypography>
          </Box>
        </Stack>

        <SectionTitle title="With Images" description="이미지를 텍스트와 함께 배치합니다." />
        <Stack spacing={ 3 }>
          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <InlineTypography variant="h4">
              Meet our team:
              <InlineImage src={ sampleImages.avatar1 } alt="Team member 1" size={ 1.5 } circle hover />
              <InlineImage src={ sampleImages.avatar2 } alt="Team member 2" size={ 1.5 } circle hover />
              and more talented people.
            </InlineTypography>
          </Box>

          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <InlineTypography variant="h3">
              Explore the
              <InlineImage src={ sampleImages.landscape } alt="Mountains" size="3em" rounded sx={ { mx: '0.3em' } } />
              world with us.
            </InlineTypography>
          </Box>
        </Stack>

        <SectionTitle title="With Custom Objects" description="InlineObject로 커스텀 요소를 삽입합니다." />
        <Stack spacing={ 3 }>
          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <InlineTypography variant="h4">
              Powered by
              <InlineObject size={ 1.5 } spacing={ 0.3 }>
                <Box
                  component="span"
                  sx={ {
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.6em',
                  } }
                >
                  AI
                </Box>
              </InlineObject>
              technology.
            </InlineTypography>
          </Box>

          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <InlineTypography variant="h4">
              Status:
              <InlineObject size={ 0.8 } rounded spacing={ 0.3 }>
                <Box
                  component="span"
                  sx={ {
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'success.main',
                    borderRadius: '50%',
                    display: 'block',
                  } }
                />
              </InlineObject>
              Online
            </InlineTypography>
          </Box>
        </Stack>

        <SectionTitle title="Vertical Alignment" description="수직 정렬 옵션입니다." />
        <Stack spacing={ 3 }>
          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <Typography variant="subtitle2" sx={ { mb: 1, color: 'text.secondary' } }>
              align=&quot;middle&quot; (기본)
            </Typography>
            <InlineTypography variant="h4">
              Text with <InlineIcon icon={ <StarIcon /> } color="primary.main" align="middle" /> icon aligned to middle.
            </InlineTypography>
          </Box>

          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <Typography variant="subtitle2" sx={ { mb: 1, color: 'text.secondary' } }>
              align=&quot;baseline&quot;
            </Typography>
            <InlineTypography variant="h4">
              Text with <InlineIcon icon={ <StarIcon /> } color="primary.main" align="baseline" /> icon aligned to baseline.
            </InlineTypography>
          </Box>

          <Box sx={ { p: 3, border: '1px solid', borderColor: 'divider' } }>
            <Typography variant="subtitle2" sx={ { mb: 1, color: 'text.secondary' } }>
              align=&quot;top&quot;
            </Typography>
            <InlineTypography variant="h4">
              Text with <InlineIcon icon={ <StarIcon /> } color="primary.main" align="top" /> icon aligned to top.
            </InlineTypography>
          </Box>
        </Stack>

        <SectionTitle title="Hover Effects" description="hover 효과를 적용한 인라인 이미지입니다." />
        <Box sx={ { p: 4, border: '1px solid', borderColor: 'divider' } }>
          <InlineTypography variant="h3">
            Connect with
            <InlineImage src={ sampleImages.avatar1 } alt="User 1" size={ 2 } circle hover />
            <InlineImage src={ sampleImages.avatar2 } alt="User 2" size={ 2 } circle hover />
            on our platform.
          </InlineTypography>
          <Typography variant="caption" color="text.secondary" sx={ { mt: 1, display: 'block' } }>
            (이미지에 마우스를 올려보세요)
          </Typography>
        </Box>

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
          {`// 아이콘과 함께
<InlineTypography variant="h4">
  We <InlineIcon icon={<FavoriteIcon />} color="error.main" /> building products.
</InlineTypography>

// 이미지와 함께
<InlineTypography variant="h3">
  Meet our team:
  <InlineImage src="avatar.jpg" alt="Member" size={1.5} circle hover />
</InlineTypography>

// 커스텀 요소
<InlineTypography variant="h4">
  Powered by
  <InlineObject size={1.5}>
    <CustomBadge>AI</CustomBadge>
  </InlineObject>
  technology.
</InlineTypography>`}
        </Box>
      </PageContainer>
    </>
  ),
};
