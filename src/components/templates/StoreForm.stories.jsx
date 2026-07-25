import { useState } from 'react';
import Box from '@mui/material/Box';
import { StoreForm } from './StoreForm';
import { REGION, STORE_STATUS } from '../../data/schema';

const emptyValues = { id: '', name: '', region: REGION.GA, status: STORE_STATUS.PLANNED };

export default {
  title: 'Paid Ads Dashboard/Templates/StoreForm',
  component: StoreForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## StoreForm

매장 추가/수정 폼. 필드가 4개뿐이라 그룹핑 없이 2열로 배치했다.
검증 로직은 갖지 않음 — errors prop으로 외부에서 주입.
        `,
      },
    },
  },
  argTypes: {
    values: { control: 'object', description: '폼 값 객체' },
    isIdLocked: { control: 'boolean', description: '코드 필드 잠금 (수정 모드용)' },
    errors: { control: 'object', description: '필드별 에러 메시지' },
    onChange: { action: 'fieldChanged' },
  },
};

export const Default = {
  render: (args) => {
    const [values, setValues] = useState(emptyValues);
    return (
      <Box sx={{ maxWidth: 480 }}>
        <StoreForm
          {...args}
          values={values}
          onChange={(field, value) => {
            setValues((v) => ({ ...v, [field]: value }));
            args.onChange?.(field, value);
          }}
        />
      </Box>
    );
  },
};

export const EditModeWithError = {
  render: (args) => {
    const [values, setValues] = useState({ id: 'G01', name: 'Georgia - Atlanta', region: REGION.GA, status: STORE_STATUS.ACTIVE });
    return (
      <Box sx={{ maxWidth: 480 }}>
        <StoreForm
          {...args}
          values={values}
          isIdLocked
          errors={{ name: 'Store name is required.' }}
          onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
        />
      </Box>
    );
  },
};
