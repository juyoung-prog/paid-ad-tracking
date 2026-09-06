import { useState } from 'react';
import Button from '@mui/material/Button';
import { SignInDialog } from './SignInDialog';

export default {
  title: 'Paid Ads Dashboard/Templates/SignInDialog',
  component: SignInDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## SignInDialog

이메일/비밀번호 로그인 **대화상자**. 앱 전체 로그인 게이트는 꺼져 있지만(링크만으로
읽는다) 쓰기는 RLS가 owner를 요구하므로, 쓰기가 필요한 자리(Recap 편집)에서만 연다.
LoginPage와 같은 로직이고 회원가입은 없다.

Storybook에는 Supabase가 없어 제출하면 네트워크 오류 문구가 뜬다 — 폼 자체만 확인한다.
        `,
      },
    },
  },
  argTypes: {
    isOpen: { control: 'boolean', description: '열림 여부' },
    onClose: { action: 'closed', description: '닫기' },
    onSignedIn: { action: 'signedIn', description: '로그인 성공 후' },
    title: { control: 'text', description: '제목' },
    description: { control: 'text', description: '제목 아래 안내 한 줄' },
  },
};

export const Default = {
  args: { isOpen: true, title: 'Sign in to edit', description: 'Reading is open to anyone with the link. Writing needs your account.' },
};

/** 버튼으로 열고 닫기 */
export const Triggered = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button variant="outlined" size="small" onClick={() => setIsOpen(true)}>Edit</Button>
        <SignInDialog {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} onSignedIn={() => setIsOpen(false)} />
      </>
    );
  },
  args: { title: 'Sign in to edit', description: 'Reading is open to anyone with the link. Writing needs your account.' },
};
