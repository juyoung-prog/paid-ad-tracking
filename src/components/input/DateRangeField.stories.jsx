import { useState } from 'react';
import Box from '@mui/material/Box';
import { DateRangeField } from './DateRangeField';

export default {
  title: 'Paid Ads Dashboard/Input/DateRangeField',
  component: DateRangeField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## DateRangeField

시작일/종료일을 따로 타이핑하던 LocalizedDateField 2개를 캘린더 팝오버
하나로 합쳤다. 클릭 한 번으로 열리고, 시작일을 클릭한 뒤 종료일을 클릭하면
범위가 완성되며 자동으로 닫힌다(시작일보다 이른 날을 클릭하면 그 날짜로
시작일을 다시 잡는다 — 흔한 날짜 범위 선택 관례). 마우스를 올리는 동안엔
시작일부터 커서 아래까지 범위를 미리 보여준다.

LocalizedDateField와 같은 이유로 새 날짜 피커 라이브러리 없이 직접 만들었다
— 이 프로젝트의 "영어 전용 MM/DD/YYYY" 표시 요구사항을 로케일 의존 없이
지키기 위함.
        `,
      },
    },
  },
  argTypes: {
    value: { control: 'object', description: '{ start, end } ISO 8601 date, 미선택이면 빈 문자열' },
    error: { control: 'boolean' },
    helperText: { control: 'text' },
    onChange: { action: 'changed' },
  },
};

export const Default = {
  render: function DefaultStory(args) {
    const [value, setValue] = useState(args.value ?? { start: '2026-08-01', end: '2026-08-31' });
    return (
      <Box sx={{ maxWidth: 280 }}>
        <DateRangeField
          {...args}
          value={value}
          onChange={(next) => {
            setValue(next);
            args.onChange?.(next);
          }}
        />
      </Box>
    );
  },
  args: {
    value: { start: '2026-08-01', end: '2026-08-31' },
  },
};

export const Empty = {
  render: function EmptyStory(args) {
    const [value, setValue] = useState({ start: '', end: '' });
    return (
      <Box sx={{ maxWidth: 280 }}>
        <DateRangeField {...args} value={value} onChange={setValue} />
      </Box>
    );
  },
};

export const WithError = {
  args: {
    value: { start: '2026-08-31', end: '2026-08-01' },
    error: true,
    helperText: 'End date must be after start date.',
  },
  render: (args) => (
    <Box sx={{ maxWidth: 280 }}>
      <DateRangeField {...args} onChange={() => {}} />
    </Box>
  ),
};
