import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { PageContainer } from '../layout/PageContainer';
import { SectionContainer } from './SectionContainer';
import { DocumentTitle, SectionTitle } from '../storybookDocumentation';
import Placeholder from '../../common/ui/Placeholder';

export default {
  title: 'Component/2. Container/SectionContainer',
  component: SectionContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    children: {
      control: false,
      description: '섹션 내부 콘텐츠',
    },
    maxWidth: {
      control: 'text',
      description: '나머지 props와 함께 Box로 전달되는 MUI system prop — 섹션 자체의 최대 너비를 제한한다',
    },
    sx: {
      control: 'object',
      description: '추가 스타일. 기본 상하 여백(py: xs 4 / md 6)과 width: 100% 뒤에 병합되므로 덮어쓸 수 있다',
    },
  },
};

/**
 * ## 기본 사용법
 * 
 * SectionContainer는 페이지 내의 각 섹션을 구분하는 컨테이너입니다.
 * - 100% 너비로 확장되며 상하 여백(py) 제공
 * - section 태그로 시맨틱 마크업 적용
 * - 반응형 여백: 모바일(xs) py:4, 데스크탑(md) py:6
 */
export const Default = {
  render: () => (
    <Box>
      <DocumentTitle
        title="SectionContainer"
        status="Ready"
        note="페이지 내 섹션을 구분하고 일관된 상하 여백을 제공하는 컨테이너"
        brandName="Layout"
        systemName="Container"
        version="1.0"
      />

      <Box sx={{ py: 4 }}>
        <SectionTitle title="기본 사용법" />
        <SectionContainer sx={{ bgcolor: 'grey.50', border: '2px dashed', borderColor: 'secondary.main' }}>
          <PageContainer>
            <Typography variant="h6" gutterBottom color="secondary">
              SectionContainer
            </Typography>
            <Typography color="text.secondary">
              섹션 컨테이너는 100% 너비로 확장되며, 상하 여백이 자동으로 적용됩니다.
              내부에 PageContainer를 사용하여 콘텐츠 너비를 제한할 수 있습니다.
            </Typography>
          </PageContainer>
        </SectionContainer>
      </Box>
    </Box>
  ),
};

/**
 * ## 여러 섹션 쌓기
 * 
 * SectionContainer를 연속으로 배치하여 섹션을 구분합니다.
 */
export const StackingSections = {
  render: () => (
    <Box sx={{ py: 4 }}>
      <SectionTitle title="여러 섹션 쌓기" />
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, mb: 2 }}>
        SectionContainer를 연속으로 배치하면 자연스러운 섹션 구분이 가능합니다.
      </Typography>
      
      <SectionContainer sx={{ bgcolor: 'grey.50' }}>
        <PageContainer>
          <Typography variant="h5" gutterBottom>섹션 1: Hero</Typography>
          <Typography>첫 번째 섹션 콘텐츠입니다. 배경색으로 구분됩니다.</Typography>
        </PageContainer>
      </SectionContainer>

      <SectionContainer sx={{ bgcolor: 'white' }}>
        <PageContainer>
          <Typography variant="h5" gutterBottom>섹션 2: Features</Typography>
          <Typography>두 번째 섹션 콘텐츠입니다. 흰색 배경입니다.</Typography>
        </PageContainer>
      </SectionContainer>

      <SectionContainer sx={{ bgcolor: 'grey.100' }}>
        <PageContainer>
          <Typography variant="h5" gutterBottom>섹션 3: Testimonials</Typography>
          <Typography>세 번째 섹션 콘텐츠입니다. 회색 배경입니다.</Typography>
        </PageContainer>
      </SectionContainer>
    </Box>
  ),
};

/**
 * ## 반응형 여백
 * 
 * 기본 상하 여백은 반응형으로 적용됩니다.
 */
export const ResponsiveSpacing = {
  render: () => (
    <Box sx={{ py: 4, bgcolor: 'grey.50' }}>
      <SectionTitle title="기본 여백 (py)" />
      <PageContainer>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" paragraph>
            SectionContainer의 상하 여백은 반응형으로 적용됩니다:
          </Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="subtitle2" color="primary">모바일 (xs)</Typography>
              <Typography variant="h4" sx={{ fontFamily: 'monospace' }}>py: 4</Typography>
              <Typography variant="caption" color="text.secondary">= 32px</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="primary">데스크탑 (md+)</Typography>
              <Typography variant="h4" sx={{ fontFamily: 'monospace' }}>py: 6</Typography>
              <Typography variant="caption" color="text.secondary">= 48px</Typography>
            </Box>
          </Box>
        </Paper>
      </PageContainer>
    </Box>
  ),
};

/**
 * ## Props 문서
 */
export const Props = {
  render: () => (
    <Box sx={{ py: 4 }}>
      <SectionTitle title="Props" />
      <PageContainer>
        <Paper sx={{ p: 3 }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { p: 1.5, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'left' } }}>
            <thead>
              <tr>
                <th><Typography variant="subtitle2">Prop</Typography></th>
                <th><Typography variant="subtitle2">타입</Typography></th>
                <th><Typography variant="subtitle2">기본값</Typography></th>
                <th><Typography variant="subtitle2">설명</Typography></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>children</Typography></td>
                <td><Typography variant="body2" color="text.secondary">node</Typography></td>
                <td><Typography variant="body2" color="text.secondary">-</Typography></td>
                <td><Typography variant="body2">섹션 내부 콘텐츠</Typography></td>
              </tr>
              <tr>
                <td><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>sx</Typography></td>
                <td><Typography variant="body2" color="text.secondary">object</Typography></td>
                <td><Typography variant="body2" color="text.secondary">-</Typography></td>
                <td><Typography variant="body2">추가 스타일 (bgcolor, border 등)</Typography></td>
              </tr>
            </tbody>
          </Box>
        </Paper>
      </PageContainer>
    </Box>
  ),
};

/**
 * ## PageContainer와 조합 사용
 * 
 * SectionContainer와 PageContainer를 함께 사용하는 일반적인 패턴입니다.
 */
export const CombinedUsage = {
  render: () => (
    <Box>
      <SectionTitle title="조합 사용 예시" />
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, mb: 2 }}>
        SectionContainer가 전체 너비 배경을, PageContainer가 콘텐츠 너비 제한을 담당합니다.
      </Typography>

      <SectionContainer sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <PageContainer>
          <Typography variant="h3" gutterBottom>Hero Section</Typography>
          <Typography variant="h6" sx={{ opacity: 0.8 }}>
            SectionContainer가 전체 너비 배경색을 제공하고,
            PageContainer가 내부 콘텐츠 너비를 제한합니다.
          </Typography>
        </PageContainer>
      </SectionContainer>

      <SectionContainer>
        <PageContainer>
          <Typography variant="h4" gutterBottom>Features</Typography>
          <Box sx={ { display: 'flex', gap: 3, flexWrap: 'wrap' } }>
            { [1, 2, 3].map((i) => (
              <Placeholder.Box key={ i } label={ `Feature ${i}` } height={ 100 } sx={ { flex: '1 1 200px' } } />
            )) }
          </Box>
        </PageContainer>
      </SectionContainer>

      <SectionContainer sx={{ bgcolor: 'grey.900', color: 'white' }}>
        <PageContainer>
          <Typography variant="body2" align="center">
            © 2024 Footer Section - 전체 너비 배경에 중앙 정렬 콘텐츠
          </Typography>
        </PageContainer>
      </SectionContainer>
    </Box>
  ),
};

