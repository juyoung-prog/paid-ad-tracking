import Box from '@mui/material/Box';
import { LastUpdatedBar } from './LastUpdatedBar';

export default {
  title: 'Paid Ads Dashboard/Layout/LastUpdatedBar',
  component: LastUpdatedBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## LastUpdatedBar

**현재 쓰는 화면이 없다** — Dashboard 헤더의 'Last synced'가 유일한 사용처였는데,
헤더 동기화 UI가 레일 하단 유틸리티 블록으로 이동하면서(레퍼런스 구조) 고아가 됐다.
범용 컴포넌트라 유지한다.

캠페인/성과 데이터가 마지막으로 입력·수정된 시각을 표시한다.
Influencer Tracking Dashboard의 SyncStatusBar(실시간 자동 동기화)와 달리
이 프로젝트는 수동 입력 기반이라 새로고침 버튼 없이 타임스탬프만 표시한다.
        `,
      },
    },
  },
  argTypes: {
    lastUpdatedAt: { control: 'text', description: 'ISO 8601 datetime, 없으면 "기록 없음" 표시' },
    label: { control: 'text', description: '라벨 텍스트' },
  },
};

/**
 * LastUpdatedBar 기본 사용 예시
 */
export const Default = {
  args: {
    lastUpdatedAt: '2026-07-20T09:32:00Z',
  },
};

/**
 * 기록이 없는 상태
 */
export const NoRecord = {
  args: {
    lastUpdatedAt: null,
  },
};

/**
 * 라벨 커스터마이즈
 */
export const CustomLabel = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <LastUpdatedBar lastUpdatedAt="2026-07-20T09:32:00Z" label="캠페인 최근 수정" />
      <LastUpdatedBar lastUpdatedAt="2026-07-03T11:05:00Z" label="성과 최근 입력" />
    </Box>
  ),
};
