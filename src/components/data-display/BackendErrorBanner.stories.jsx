import Box from '@mui/material/Box';
import { BackendErrorBanner } from './BackendErrorBanner';
import { describeBackendError } from '../../utils/backendError';

export default {
  title: 'Paid Ads Dashboard/Data Display/BackendErrorBanner',
  component: BackendErrorBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## BackendErrorBanner

백엔드 오류를 **행동 가능한** 형태로 보여주는 배너. Dashboard·Reports·Stores 세
화면이 공유한다.

### 무엇을 고쳤나
세 화면이 각자 \`Alert\`를 쓰면서 DB 원문을 그대로 찍고 있었다. 사용자가 실제로
본 문구:

> Something went wrong talking to the backend — data shown may be incomplete or
> stale. (new row violates row-level security policy for table "plans")

이 문장으로 사용자가 할 수 있는 게 아무것도 없다. 무엇을 잘못했는지도, 다시
시도하면 되는지도, 로그인이 풀린 건지도 알 수 없고, 내부 테이블명과 보안 정책
구조까지 노출된다.

### 세 가지를 나눠서 말한다
- **무슨 일인지** — \`utils/backendError.js\`가 코드·메시지 패턴으로 만든 사람 문장
- **이제 뭘 할지** — \`recovery\` 값에 맞는 버튼(재시도 / 다시 로그인 / 없음)
- **원문** — 접힌 \`Details\`. 버리지 않는다. 개발자와 사용자는 다른 것이 필요하고,
  지원 요청 때 복사해 보낼 수 있어야 한다

### 재시도 버튼을 늘 그리지 않는 이유
입력이 틀려서 난 오류(중복 이름 등)에 \`Retry\`를 주면, **같은 입력으로 같은 실패를
반복하게 만드는 거짓 어포던스**다.
        `,
      },
    },
  },
};

/**
 * RLS 위반 — 이 앱에서 실제로 발생했던 오류다. PostgREST가 코드 없이 문장으로만
 * 주기 때문에 메시지 패턴으로 잡는다.
 *
 * 확인 포인트: 재시도가 아니라 **Sign in** 버튼이 나온다(세션 만료가 첫 의심).
 */
export const PermissionDenied = {
  args: {
    error: describeBackendError({
      message: 'new row violates row-level security policy for table "plans"',
    }),
    onSignIn: () => {},
    onRetry: () => {},
  },
};

/**
 * 네트워크 실패 — 다시 시도하면 될 수 있으므로 **Retry**가 나온다.
 */
export const NetworkFailure = {
  args: {
    error: describeBackendError({ message: 'TypeError: fetch failed' }),
    onRetry: () => {},
    onSignIn: () => {},
  },
};

/**
 * 중복 이름(23505) — 입력을 고쳐야 하는 오류라 **버튼이 없다.** 여기에 Retry를
 * 달면 같은 입력으로 같은 실패를 반복하게 된다.
 */
export const DuplicateName = {
  args: {
    error: describeBackendError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "plans_owner_id_name_key"',
      details: 'Key (owner_id, name)=(…, G10 Opening) already exists.',
    }),
    onRetry: () => {},
  },
};

/**
 * 규칙에 안 걸리는 오류 — 호출부가 넘긴 맥락 문장(fallback)을 쓴다.
 * 원문은 Details에 그대로 남는다.
 */
export const UnknownError = {
  args: {
    error: describeBackendError(
      { code: 'PGRST301', message: 'something unexpected happened' },
      "Couldn't load your data. Try again.",
    ),
    onRetry: () => {},
  },
};

/**
 * error가 null이면 아무것도 그리지 않는다 — 호출부에서 조건부 렌더를 따로 쓰지
 * 않아도 되게 한다.
 */
export const NoError = {
  render: () => (
    <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
      error가 null이라 배너가 렌더되지 않는다 (아래 빈 공간이 정상).
      <BackendErrorBanner error={null} />
    </Box>
  ),
};
