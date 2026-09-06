import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { LanguageSwitch } from './LanguageSwitch';
import { t } from '../../data/recapStrings';

export default {
  title: 'Paid Ads Dashboard/Input/LanguageSwitch',
  component: LanguageSwitch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## LanguageSwitch

Recap 문서의 언어 전환(en / ko / zh-Hant) — Build Plan Phase 6. Recap에만 노출하고
운영자 화면은 영어 그대로다. 버튼 라벨은 각 언어의 자기 이름(EN · 한국어 · 繁中).
값은 호출부가 URL \`?lang=\`과 동기화한다.
        `,
      },
    },
  },
  argTypes: {
    value: { control: 'select', options: ['en', 'ko', 'zh-Hant'], description: '현재 언어' },
    onChange: { action: 'changed', description: '(lang) => void' },
    size: { control: 'radio', options: ['sm', 'md'], description: '높이 단계' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

export const Default = {
  args: { value: 'en' },
};

/** 전환하면 아래 문구가 그 언어의 문자열 표에서 나온다 */
export const Interactive = {
  render: (args) => {
    const [lang, setLang] = useState('en');
    return (
      <Stack spacing={2} alignItems="center">
        <LanguageSwitch {...args} value={lang} onChange={(next) => { args.onChange?.(next); setLang(next); }} />
        <Typography variant="body2">{t('recap.list.subtitle', lang)}</Typography>
      </Stack>
    );
  },
};
