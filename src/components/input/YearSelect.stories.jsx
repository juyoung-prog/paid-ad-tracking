import { useState } from 'react';
import Box from '@mui/material/Box';
import { YearSelect } from './YearSelect';
import { LanguageSwitch } from './LanguageSwitch';

export default {
  title: 'Paid Ads Dashboard/Input/YearSelect',
  component: YearSelect,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## YearSelect

보고서 목록(Reports)의 **연도 필터** 드롭다운. LanguageSwitch와 같은 높이·테두리·radius·글자라 머리글
오른쪽에 \`[ 2026 ▾ ] [ EN ▾ ]\`처럼 나란히 놓인다(2026-09-08). 색 있는 탭·큰 필터 바·카드는 만들지 않는다.

### 선택지는 데이터가 정한다
연도 목록은 \`schema.js\`의 \`recapEventYears()\` — 실제로 이벤트가 있는 연도만, 최신순. 빈 연도는 없다.
어느 연도를 보일지는 \`resolveRecapYear()\` — URL \`?year=\`이 선택지에 있으면 그것, 아니면 올해, 올해도 없으면
가장 최근 연도. 이벤트의 연도는 시작일의 연도 하나뿐이라 해를 넘기는 이벤트도 한 해에만 나온다.
        `,
      },
    },
  },
  argTypes: {
    value: { control: 'number', description: '현재 연도' },
    years: { control: 'object', description: '선택지(최신순) — recapEventYears()' },
    onChange: { action: 'changed', description: '(year) => void' },
    label: { control: 'text', description: '접근성 이름' },
    size: { control: 'radio', options: ['sm', 'md'], description: '높이 단계' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

function Interactive(args) {
  const [value, setValue] = useState(args.value);
  return <YearSelect {...args} value={value} onChange={(next) => { setValue(next); args.onChange?.(next); }} />;
}

export const Default = {
  args: { value: 2026, years: [2026, 2025, 2024] },
  render: (args) => <Interactive {...args} />,
};

/** 머리글 오른쪽에 언어 선택과 나란히 — 같은 높이·글자 */
export const WithLanguageSwitch = {
  args: { value: 2026, years: [2026, 2025, 2024] },
  render: (args) => (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Interactive {...args} />
      <LanguageSwitch value="en" onChange={() => {}} />
    </Box>
  ),
};

/** 연도가 하나뿐이어도 드롭다운은 같은 자리에 — 목록이 어느 해인지 보여준다 */
export const SingleYear = {
  args: { value: 2026, years: [2026] },
  render: (args) => <Interactive {...args} />,
};
