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

이메일/비밀번호 로그인 화면. 모든 테이블의 RLS가 \`owner_id = auth.uid()\`라
세션 없이는 데이터가 한 건도 보이지 않는다 — 쿼리가 에러 없이 빈 배열을
돌려주기 때문에 "데이터가 없다"와 "로그인이 안 됐다"가 화면에서 구분되지
않는다. 그래서 App이 세션을 먼저 판정하고, 없으면 이 화면을 그린다.

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
