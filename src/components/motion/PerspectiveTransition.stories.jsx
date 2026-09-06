import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Placeholder from '../../common/ui/Placeholder';
import PerspectiveTransition from './PerspectiveTransition';

/** key를 변경하여 컴포넌트를 리마운트 → 애니메이션 재생 */
function useReplay() {
  const [key, setKey] = useState(0);
  const replay = useCallback(() => setKey((k) => k + 1), []);
  return { key, replay };
}

function ReplayButton({ onClick }) {
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={ onClick }
      sx={ { mb: 2, textTransform: 'none' } }
    >
      Replay
    </Button>
  );
}

export default {
  title: 'Interactive/14. Motion/PerspectiveTransition',
  component: PerspectiveTransition,
  tags: ['autodocs'],
  argTypes: {
    rotateFrom: {
      control: { type: 'range', min: 0, max: 180, step: 5 },
      description: '초기 회전 각도 (deg)',
    },
    perspective: {
      control: { type: 'range', min: 200, max: 2000, step: 100 },
      description: '원근감 거리 (px)',
    },
    transformOrigin: {
      control: 'select',
      options: ['bottom center', 'top center', 'center center', 'left center', 'right center'],
      description: '회전 축 기준점',
    },
    duration: {
      control: { type: 'range', min: 200, max: 2000, step: 100 },
      description: '전환 시간 (ms)',
    },
    delay: {
      control: { type: 'range', min: 0, max: 1000, step: 50 },
      description: '전환 지연 (ms)',
    },
    isIn: {
      control: 'boolean',
      description: '표시 여부',
    },
    easing: {
      control: 'text',
      description: 'CSS 이징 함수',
    },
    isTriggerOnView: {
      control: 'boolean',
      description: '뷰포트 진입 시 자동 트리거 여부',
    },
    threshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'IntersectionObserver 감지 비율',
    },
  },
};

export const Default = {
  args: {
    isIn: true,
    rotateFrom: 60,
    perspective: 800,
    transformOrigin: 'bottom center',
    duration: 600,
    delay: 0,
  },
  render: (args) => {
    const { key, replay } = useReplay();
    return (
      <Box sx={ { p: 4, maxWidth: 400 } }>
        <ReplayButton onClick={ replay } />
        <PerspectiveTransition key={ key } { ...args }>
          <Placeholder.Box label="Content" height={ 240 } />
        </PerspectiveTransition>
      </Box>
    );
  },
};

export const TriggerOnView = {
  render: () => (
    <Box>
      <Placeholder.Box label="Scroll Down" height="100vh" sx={ { backgroundColor: 'grey.50' } } />

      { Array.from({ length: 4 }, (_, i) => (
        <Box key={ i } sx={ { maxWidth: 500, mx: 'auto', mb: 6 } }>
          <PerspectiveTransition isTriggerOnView delay={ i * 100 }>
            <Placeholder.Box label={ `Card ${i + 1}` } height={ 200 } />
          </PerspectiveTransition>
        </Box>
      )) }

      <Placeholder.Box label="End" height="50vh" sx={ { backgroundColor: 'grey.50' } } />
    </Box>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const DeepTilt = {
  render: () => {
    const { key, replay } = useReplay();
    return (
      <Box sx={ { p: 4, maxWidth: 400 } }>
        <ReplayButton onClick={ replay } />
        <PerspectiveTransition key={ key } rotateFrom={ 90 } perspective={ 500 } duration={ 1000 }>
          <Placeholder.Box label="Deep Tilt (-90°)" height={ 300 } />
        </PerspectiveTransition>
      </Box>
    );
  },
};

export const TopOrigin = {
  render: () => {
    const { key, replay } = useReplay();
    return (
      <Box sx={ { p: 4, maxWidth: 400 } }>
        <ReplayButton onClick={ replay } />
        <PerspectiveTransition key={ key } rotateFrom={ 60 } transformOrigin="top center">
          <Placeholder.Box label="Top Origin (앞으로 넘어짐)" height={ 240 } />
        </PerspectiveTransition>
      </Box>
    );
  },
};
