import Box from '@mui/material/Box';
import { PlatformMetricList } from './PlatformMetricList';

export default {
  title: 'Paid Ads Dashboard/Data Display/PlatformMetricList',
  component: PlatformMetricList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## PlatformMetricList

플랫폼 API가 수집한 성과 지표를 읽기 전용으로 보여준다. 사용자가 값을 넣는
PerformanceForm과 짝을 이루는 반대편이라 입력 필드가 아니라 라벨/값 목록으로 그린다.

값이 없는 항목은 '—'로 채우지 않고 숨긴다 — 수기 등록 캠페인이나 Meta처럼 해당
지표가 없는 플랫폼에서는 빈 줄만 늘어서서 "아직 안 왔다"인지 "원래 없다"인지
구분이 안 되기 때문이다. 하나도 없으면 아무것도 그리지 않는다.
        `,
      },
    },
  },
  argTypes: {
    metrics: { control: 'object', description: '성과 레코드. 표시할 8개 지표를 읽는다' },
    title: { control: 'text', description: '목록 위 라벨' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/** TikTok에서 실제로 수집되는 형태 — 8개 지표가 모두 있는 경우. */
export const Default = {
  args: {
    metrics: {
      videoPlays: 325147,
      heldViews: 624,
      avgWatchSeconds: 1.15,
      likes: 650,
      comments: 0,
      shares: 171,
      follows: 17,
      profileVisits: 934,
    },
  },
  render: (args) => (
    <Box sx={ { maxWidth: 420 } }>
      <PlatformMetricList { ...args } />
    </Box>
  ),
};

/**
 * Meta는 캠페인 레벨에 팔로우/프로필 방문 지표가 없다. 없는 항목은 빈 줄로
 * 남지 않고 목록에서 빠진다.
 */
export const PartialMetrics = {
  args: {
    metrics: {
      videoPlays: 88120,
      heldViews: 1240,
      avgWatchSeconds: 3.4,
      likes: 310,
      comments: 12,
      shares: 44,
      follows: null,
      profileVisits: null,
    },
  },
  render: (args) => (
    <Box sx={ { maxWidth: 420 } }>
      <PlatformMetricList { ...args } />
    </Box>
  ),
};

/**
 * 수기로 등록한 캠페인처럼 플랫폼 지표가 하나도 없으면 컴포넌트가 아무것도
 * 그리지 않는다(null 반환) — 아래 영역이 비어 보이는 게 정상이다.
 */
export const NoMetrics = {
  args: {
    metrics: { impressions: 1000, spend: 50 },
  },
  render: (args) => (
    <Box sx={ { maxWidth: 420 } }>
      <PlatformMetricList { ...args } />
    </Box>
  ),
};
