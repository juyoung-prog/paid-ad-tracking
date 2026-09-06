import Stack from '@mui/material/Stack';
import { RecapStatusBadge } from './RecapStatusBadge';

export default {
  title: 'Paid Ads Dashboard/Data Display/RecapStatusBadge',
  component: RecapStatusBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## RecapStatusBadge

보고서 상태(Not started / Draft / Ready) 배지. Recap 목록의 Report 열과 상세 머리글이
같은 것을 쓴다. 1px 경계선 + 11px 글자만 — 채운 배경은 없다(목록에서 행마다 반복되는
요소라 표보다 배지가 먼저 읽히면 안 된다). 색은 Ready에만 success.
        `,
      },
    },
  },
  argTypes: {
    status: { control: 'select', options: ['draft', 'final', null], description: '보고서 상태 — null이면 시작 전' },
    lang: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '문구 언어' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

export const Default = {
  args: { status: 'draft' },
};

/** 세 상태 */
export const AllStates = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <RecapStatusBadge status={null} />
      <RecapStatusBadge status="draft" />
      <RecapStatusBadge status="final" />
    </Stack>
  ),
};
