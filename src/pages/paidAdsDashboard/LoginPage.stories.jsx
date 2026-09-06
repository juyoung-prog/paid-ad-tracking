import { LoginPage } from './LoginPage';

export default {
  title: 'Paid Ads Dashboard/Page/LoginPage',
  component: LoginPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## LoginPage

이메일/비밀번호 로그인 화면. **현재 App은 이 화면으로 라우팅하지 않는다** —
로그인 게이트를 껐고(App.jsx, 2026-08-20), 마이그레이션 19가 select를 anon
역할에 열어 둬서 세션 없이도 대시보드가 데이터를 읽는다. 쓰기(insert/update/
delete)는 여전히 owner 정책이라 로그인이 필요하므로, 게이트를 되살릴 때를 위해
화면과 이 스토리를 남겨 둔다.

회원가입 폼은 두지 않는다 — 1인 운영 기준이고 사용자는 Supabase 대시보드에서
미리 만든다. 폼을 열어두면 누구나 계정을 만들 수 있게 된다.

스토리북에서 로그인 버튼을 눌러도 Supabase 세션이 없어 인증은 실패한다.
이 스토리는 폼의 배치·라벨·에러 표시 위치를 확인하는 용도다.
        `,
      },
    },
  },
};

export const Default = {};
