import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Placeholder from '../../common/ui/Placeholder';
import { PageContainer } from './PageContainer';
import { DocumentTitle, SectionTitle } from '../storybookDocumentation';

export default {
  title: 'Component/8. Layout/PageContainer',
  component: PageContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    children: {
      control: false,
      description: '컨테이너 내부 콘텐츠',
    },
    maxWidth: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', false],
      description: 'MUI Container의 최대 너비 브레이크포인트. false면 너비를 제한하지 않는다',
    },
    disableGutters: {
      control: 'boolean',
      description: 'Container가 기본으로 주는 반응형 좌우 패딩을 끈다',
    },
    sx: {
      control: 'object',
      description: '추가 스타일. Container의 기본 동작 위에 병합된다',
    },
  },
};

/**
 * ## 기본 사용법
 * 
 * PageContainer는 페이지의 메인 콘텐츠를 감싸는 컨테이너입니다.
 * - MUI Container 기반으로, 중앙 정렬 및 반응형 패딩 제공
 * - maxWidth 옵션으로 최대 너비 설정 가능
 * - 기본값: xl (1536px)
 */
export const Default = {
  render: () => (
    <Box>
      <DocumentTitle
        title="PageContainer"
        status="Ready"
        note="페이지 콘텐츠를 중앙에 배치하고 좌우 패딩을 적용하는 컨테이너"
        brandName="Layout"
        systemName="Container"
        version="1.0"
      />
      
      <Box sx={ { py: 4 } }>
        <SectionTitle title="기본 사용법" />
        <PageContainer>
          <Placeholder.Box label="PageContainer (maxWidth=&quot;xl&quot;)" height={ 120 } />
          <Box sx={ { mt: 1 } }>
            <Typography color="text.secondary" variant="body2">
              콘텐츠가 화면 중앙에 정렬되며, 최대 너비 1536px까지 확장됩니다.
              좌우에 반응형 패딩이 자동으로 적용됩니다.
            </Typography>
          </Box>
        </PageContainer>
      </Box>
    </Box>
  ),
};

/**
 * ## maxWidth 옵션
 * 
 * 다양한 maxWidth 값에 따른 컨테이너 너비 비교
 */
export const MaxWidthOptions = {
  name: 'maxWidth 옵션',
  render: () => (
    <Box sx={ { py: 4, bgcolor: 'grey.100' } }>
      <SectionTitle title="maxWidth 옵션 비교" />
      
      <Box sx={ { mb: 2 } }>
        <Typography variant="caption" sx={ { px: 2 } }>maxWidth="sm" (600px)</Typography>
        <PageContainer maxWidth="sm">
          <Placeholder.Box label="sm — 작은 폼이나 로그인 페이지에 적합" height={ 64 } />
        </PageContainer>
      </Box>

      <Box sx={ { mb: 2 } }>
        <Typography variant="caption" sx={ { px: 2 } }>maxWidth="md" (900px)</Typography>
        <PageContainer maxWidth="md">
          <Placeholder.Box label="md — 글 읽기 편한 너비, 블로그나 문서 페이지에 적합" height={ 64 } />
        </PageContainer>
      </Box>

      <Box sx={ { mb: 2 } }>
        <Typography variant="caption" sx={ { px: 2 } }>maxWidth="lg" (1200px)</Typography>
        <PageContainer maxWidth="lg">
          <Placeholder.Box label="lg — 대시보드나 테이블이 있는 페이지에 적합" height={ 64 } />
        </PageContainer>
      </Box>

      <Box>
        <Typography variant="caption" sx={ { px: 2 } }>maxWidth="xl" (1536px) - 기본값</Typography>
        <PageContainer maxWidth="xl">
          <Placeholder.Box label="xl — 넓은 콘텐츠, 갤러리나 대형 그리드에 적합" height={ 64 } />
        </PageContainer>
      </Box>
    </Box>
  ),
};

/**
 * ## Props 문서
 */
export const Props = {
  name: 'Props',
  render: () => (
    <Box sx={ { py: 4 } }>
      <SectionTitle title="Props" />
      <PageContainer>
        <Paper sx={ { p: 3 } }>
          <Box component="table" sx={ { width: '100%', borderCollapse: 'collapse', '& td, & th': { p: 1.5, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'left' } } }>
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
                <td><Typography variant="body2" sx={ { fontFamily: 'monospace' } }>children</Typography></td>
                <td><Typography variant="body2" color="text.secondary">node</Typography></td>
                <td><Typography variant="body2" color="text.secondary">-</Typography></td>
                <td><Typography variant="body2">컨테이너 내부 콘텐츠</Typography></td>
              </tr>
              <tr>
                <td><Typography variant="body2" sx={ { fontFamily: 'monospace' } }>maxWidth</Typography></td>
                <td><Typography variant="body2" color="text.secondary">xs | sm | md | lg | xl | false</Typography></td>
                <td><Typography variant="body2" color="text.secondary">'xl'</Typography></td>
                <td><Typography variant="body2">최대 너비 설정</Typography></td>
              </tr>
              <tr>
                <td><Typography variant="body2" sx={ { fontFamily: 'monospace' } }>disableGutters</Typography></td>
                <td><Typography variant="body2" color="text.secondary">boolean</Typography></td>
                <td><Typography variant="body2" color="text.secondary">false</Typography></td>
                <td><Typography variant="body2">좌우 패딩 비활성화</Typography></td>
              </tr>
              <tr>
                <td><Typography variant="body2" sx={ { fontFamily: 'monospace' } }>sx</Typography></td>
                <td><Typography variant="body2" color="text.secondary">object</Typography></td>
                <td><Typography variant="body2" color="text.secondary">-</Typography></td>
                <td><Typography variant="body2">추가 스타일</Typography></td>
              </tr>
            </tbody>
          </Box>
        </Paper>
      </PageContainer>
    </Box>
  ),
};

