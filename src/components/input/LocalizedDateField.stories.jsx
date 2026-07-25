import { useState } from 'react';
import Box from '@mui/material/Box';
import { LocalizedDateField } from './LocalizedDateField';

export default {
  title: 'Paid Ads Dashboard/Input/LocalizedDateField',
  component: LocalizedDateField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## LocalizedDateField

항상 MM/DD/YYYY로 표시되는 날짜 입력. 네이티브 \`<input type="date">\`는 표시
포맷이 OS/브라우저 로케일을 그대로 상속받아서(en-US가 아니면 다른 언어로
보임), "영어 전용" 요구사항을 조용히 깨뜨린다. 새 의존성(날짜 피커 라이브러리)
없이 마스킹 텍스트 입력으로 해결한다 — 숫자를 타이핑하면 자동으로 '/'가
삽입되고, 8자리(MMDDYYYY)가 다 채워졌을 때만 상위로 ISO 8601 문자열을
전달한다.
        `,
      },
    },
  },
  argTypes: {
    value: { control: 'text', description: 'ISO 8601 date (YYYY-MM-DD) 또는 빈 문자열' },
    error: { control: 'boolean' },
    helperText: { control: 'text' },
    onChange: { action: 'changed' },
  },
};

export const Default = {
  render: (args) => {
    const [value, setValue] = useState(args.value ?? '2026-08-01');
    return (
      <Box sx={{ maxWidth: 240 }}>
        <LocalizedDateField
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
    value: '2026-08-01',
  },
};

export const Empty = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <Box sx={{ maxWidth: 240 }}>
        <LocalizedDateField {...args} value={value} onChange={setValue} />
      </Box>
    );
  },
};

export const WithError = {
  args: {
    value: '2026-08-31',
    error: true,
    helperText: 'End date must be after start date.',
  },
  render: (args) => (
    <Box sx={{ maxWidth: 240 }}>
      <LocalizedDateField {...args} onChange={() => {}} />
    </Box>
  ),
};
