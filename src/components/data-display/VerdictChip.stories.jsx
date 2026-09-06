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

### 채운 칩과 점선 칩
사람이 고른 판정은 옅은 틴트를 채운 칩, 벤치마크가 **제안한** 판정(\`isSuggested\`)은
점선 테두리만 있는 칩이다 — 아직 사람이 확인하지 않은 값이라는 뜻이고, 2단계에서
사람이 고르면 채운 칩으로 바뀐다. 판정이 없으면 "—".

### 색
상태색 success(good)·warning(bad)만 쓴다. error는 "고장"의 색이라 성과 판정에
쓰지 않는다. mid는 중립(text.secondary + surface.muted). 배경 틴트는 hex가 아니라
테마 상태색에서 alpha로 만든다.

판정을 고르는 계산(백분위 → good/mid/bad)은 \`schema.js\`의 \`suggestVerdict\`가 한다.
        `,
      },
    },
  },
  argTypes: {
    verdict: { control: 'select', options: ['good', 'mid', 'bad', null], description: '판정' },
    isSuggested: { control: 'boolean', description: '벤치마크가 제안한 값이면 점선 테두리 + 툴팁' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    size: { control: 'radio', options: ['sm', 'md'], description: '높이 단계 — 표 셀은 sm' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

export const Default = {
  args: { verdict: 'good', isSuggested: false, size: 'md' },
};

/** 세 판정 × 확정/제안 + 없음 */
export const AllVerdicts = {
  render: () => (
    <Stack spacing={2}>
      {[false, true].map((isSuggested) => (
        <Stack key={String(isSuggested)} direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ width: 80 }}>{isSuggested ? 'suggested' : 'confirmed'}</Typography>
          <VerdictChip verdict="good" isSuggested={isSuggested} />
          <VerdictChip verdict="mid" isSuggested={isSuggested} />
          <VerdictChip verdict="bad" isSuggested={isSuggested} />
        </Stack>
      ))}
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
      <VerdictChip verdict="mid" size="sm" isSuggested />
      <VerdictChip verdict="bad" size="sm" />
    </Box>
  ),
};
