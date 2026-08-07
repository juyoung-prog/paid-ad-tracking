import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { RECOVERY } from '../../utils/backendError';

/**
 * BackendErrorBanner 컴포넌트
 *
 * 백엔드 오류를 **행동 가능한** 형태로 보여주는 배너. Dashboard·Reports·Stores
 * 세 화면이 공유한다.
 *
 * ## 왜 컴포넌트로 뺐나
 *
 * 세 화면이 각자 `Alert`를 쓰면서 전부 이렇게 찍고 있었다:
 *
 *   Something went wrong talking to the backend — data shown may be
 *   incomplete or stale. (new row violates row-level security policy for
 *   table "plans")
 *
 * 오류 화면이 해야 할 일은 셋이다 — **무슨 일인지, 왜인지, 이제 뭘 할지.**
 * 원문 DB 메시지는 그 셋 중 어느 것도 답하지 못하면서 자리를 다 차지했고,
 * 내부 테이블명과 보안 정책 구조까지 노출했다. 게다가 문구가 세 파일에
 * 복사돼 있어서 한 곳을 고쳐도 나머지 둘은 그대로였다.
 *
 * 이제 문장은 `utils/backendError.js`가 만들고, 이 컴포넌트는 그 결과에 맞는
 * **복구 수단**을 고른다. 원문은 버리지 않고 접힌 `Details`에 넣는다 — 개발자와
 * 사용자는 다른 것이 필요하고, 지원 요청 때는 원문을 복사해 보낼 수 있어야 한다.
 *
 * ## 재시도 버튼을 늘 그리지 않는 이유
 *
 * 입력이 틀려서 난 오류(중복 이름 등)에 `Retry`를 주면, 같은 입력으로 같은
 * 실패를 반복하게 만드는 거짓 어포던스다. `recovery` 값에 따라 재시도·로그인·
 * 없음을 나눠 그린다.
 *
 * Props:
 * @param {{message: string, recovery: string, detail: string|null}|null} error - describeBackendError()의 결과. null이면 아무것도 그리지 않는다 [Required]
 * @param {function} onRetry - 재시도 핸들러. recovery가 'retry'일 때만 버튼이 나온다 [Optional]
 * @param {function} onSignIn - 다시 로그인 핸들러. recovery가 'sign_in'일 때만 버튼이 나온다 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <BackendErrorBanner error={error} onRetry={refresh} sx={{ mb: 2 }} />
 */
export function BackendErrorBanner({ error, onRetry, onSignIn, sx }) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  if (!error) return null;

  // 문자열로 들어와도 죽지 않게 한다 — 스토어를 다 고쳤지만, 이 컴포넌트가
  // 옛 형태 하나 때문에 화면 전체를 크래시시키면 오류 배너로서 최악이다.
  const described = typeof error === 'string'
    ? { message: error, recovery: RECOVERY.RETRY, detail: null }
    : error;

  const action = (() => {
    if (described.recovery === RECOVERY.SIGN_IN && onSignIn) {
      return <Button color="inherit" size="small" onClick={onSignIn}>Sign in</Button>;
    }
    if (described.recovery === RECOVERY.RETRY && onRetry) {
      return <Button color="inherit" size="small" onClick={onRetry}>Retry</Button>;
    }
    return undefined;
  })();

  return (
    <Alert severity="error" action={action} sx={sx}>
      {described.message}
      {described.detail && (
        <Box sx={{ mt: 0.5 }}>
          {/* 원문은 기본으로 접는다. 펼치면 지원 요청에 붙일 수 있는 형태로
              그대로 보여준다(코드 + message + details + hint). */}
          <Link
            component="button"
            type="button"
            variant="caption"
            underline="always"
            color="inherit"
            onClick={() => setIsDetailOpen((open) => !open)}
            aria-expanded={isDetailOpen}
          >
            {isDetailOpen ? 'Hide details' : 'Details'}
          </Link>
          <Collapse in={isDetailOpen}>
            <Typography
              variant="caption"
              component="pre"
              sx={{
                mt: 0.5,
                mb: 0,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                opacity: 0.8,
              }}
            >
              {described.detail}
            </Typography>
          </Collapse>
        </Box>
      )}
    </Alert>
  );
}
