import Box from '@mui/material/Box';
import Placeholder from '../../common/ui/Placeholder';
import { ScrollScaleContainer } from './ScrollScaleContainer';

export default {
  title: 'Interactive/12. Scroll/ScrollScaleContainer',
  component: ScrollScaleContainer,
  tags: ['autodocs'],
  argTypes: {
    scaleFrom: {
      control: { type: 'range', min: 0.5, max: 1, step: 0.05 },
      description: '최소 스케일 (뷰포트 밖)',
    },
    scaleTo: {
      control: { type: 'range', min: 0.8, max: 1.2, step: 0.05 },
      description: '최대 스케일 (뷰포트 완전 노출)',
    },
    transformOrigin: {
      control: 'text',
      description: '스케일 기준점',
    },
    offset: {
      control: 'object',
      description: 'Framer Motion useScroll offset 배열. 스크롤 진행도 0→1의 시작·끝 지점을 정한다 (기본값: [\'start end\', \'center center\'])',
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    scaleFrom: 0.85,
    scaleTo: 1,
  },
  render: (args) => (
    <Box>
      <Placeholder.Box label="Scroll Down" height="100vh" sx={ { backgroundColor: 'grey.50' } } />

      <ScrollScaleContainer { ...args }>
        <Placeholder.Box label="Scaling Content" height={ 400 } />
      </ScrollScaleContainer>

      <Placeholder.Box label="End of Section" height="100vh" sx={ { backgroundColor: 'grey.50' } } />
    </Box>
  ),
};

export const MultipleItems = {
  render: () => (
    <Box>
      <Placeholder.Box label="Scroll Down" height="50vh" sx={ { backgroundColor: 'grey.50' } } />

      { Array.from({ length: 5 }, (_, i) => (
        <ScrollScaleContainer key={ i } scaleFrom={ 0.8 } sx={ { mb: 4 } }>
          <Placeholder.Box label={ `Item ${i + 1}` } height={ 300 } />
        </ScrollScaleContainer>
      )) }

      <Placeholder.Box label="End of Section" height="50vh" sx={ { backgroundColor: 'grey.50' } } />
    </Box>
  ),
};

export const DeepScale = {
  render: () => (
    <Box>
      <Placeholder.Box label="Scroll Down" height="100vh" sx={ { backgroundColor: 'grey.50' } } />

      <ScrollScaleContainer scaleFrom={ 0.6 } offset={ ['start end', 'end start'] }>
        <Placeholder.Box label="Deep Scale (0.6 → 1)" height={ 500 } />
      </ScrollScaleContainer>

      <Placeholder.Box label="End of Section" height="100vh" sx={ { backgroundColor: 'grey.50' } } />
    </Box>
  ),
};
