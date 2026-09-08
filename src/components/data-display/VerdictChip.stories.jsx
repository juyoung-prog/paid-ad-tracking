import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { VerdictChip } from './VerdictChip';

export default {
  title: 'Paid Ads Dashboard/Data Display/VerdictChip',
  component: VerdictChip,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## VerdictChip

예산 효율 판정(good / mid / bad) 한 칸 — 이전 보고서의 좋음/보통/아쉬움 칸이다
(Build Plan Phase 2).

### 모양은 하나
옅은 틴트 배경 + 같은 색 글자(500) + 아주 옅은 실선 테두리, 세로 4~5px · 가로 7~8px,
radius.control — 점선 칩은 표 안에서 시끄러워 뺐다(2026-09). 평가가 없으면 "—".

### 색
상태색 success(good)·warning(bad)만 쓴다. error는 "고장"의 색이라 성과 판정에
쓰지 않는다. mid는 중립(text.secondary + surface.muted). 배경 틴트는 hex가 아니라
테마 상태색에서 alpha로 만든다.

표의 **Overall performance** 열이 쓴다 — 등급은 \`schema.js\`의 \`buildOverallPerformance\`(목표 가중, 과거 비교군 구간,
고정 문턱 없음)이고 사람이 Edit에서 고른 값이 우선한다. 라벨은 STRONG / AVERAGE / WEAK(대문자·자간).
        `,
      },
    },
  },
  argTypes: {
    verdict: { control: 'select', options: ['good', 'mid', 'bad', null], description: '사람이 고른 평가' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    size: { control: 'radio', options: ['sm', 'md'], description: '높이 단계 — 표 셀은 sm' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

export const Default = {
  args: { verdict: 'good', size: 'md' },
};

/** 세 평가 + 없음 */
export const AllVerdicts = {
  render: () => (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="caption" color="text.secondary" sx={{ width: 80 }}>verdict</Typography>
        <VerdictChip verdict="good" />
        <VerdictChip verdict="mid" />
        <VerdictChip verdict="bad" />
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="caption" color="text.secondary" sx={{ width: 80 }}>none</Typography>
        <VerdictChip verdict={null} />
      </Stack>
    </Stack>
  ),
};

/** 표 셀 크기 */
export const Small = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <VerdictChip verdict="good" size="sm" />
      <VerdictChip verdict="mid" size="sm" />
      <VerdictChip verdict="bad" size="sm" />
    </Box>
  ),
};
