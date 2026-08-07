/**
 * Supabase/Postgres 오류를 사람이 행동할 수 있는 문장으로 바꾼다.
 *
 * ## 왜 필요한가
 *
 * 예전엔 스토어가 `error.message`를 그대로 저장하고 화면이 괄호 안에 찍었다.
 * 사용자가 실제로 본 문구:
 *
 *   Something went wrong talking to the backend — data shown may be
 *   incomplete or stale. (new row violates row-level security policy for
 *   table "plans")
 *
 * 이 문장으로 사용자가 할 수 있는 게 아무것도 없다. 무엇을 잘못했는지도,
 * 다시 시도하면 되는지도, 로그인이 풀린 건지도 알 수 없다. 게다가 내부
 * 테이블명과 보안 정책 구조가 그대로 노출된다.
 *
 * 오류 화면의 일은 세 가지다 — **무슨 일이 일어났는지, 왜인지, 이제 뭘 해야
 * 하는지.** 원문은 그 셋 중 어느 것도 답하지 않으면서 세 자리를 다 차지하고
 * 있었다.
 *
 * ## 원문을 버리지는 않는다
 *
 * 개발자와 사용자는 다른 것이 필요하다. 사람 문장을 앞에 두고 원문은
 * `detail`로 넘겨서, 화면이 접힌 `Details`에 담게 한다 — 지원 요청 때
 * 복사해 보낼 수 있어야 한다.
 */

/** 복구 행동 종류. 화면이 이 값을 보고 알맞은 버튼을 그린다. */
export const RECOVERY = {
  /** 다시 시도하면 될 수 있다 (네트워크·일시 오류) */
  RETRY: 'retry',
  /** 인증이 풀렸다 — 다시 로그인해야 한다 */
  SIGN_IN: 'sign_in',
  /** 사용자가 입력을 고쳐야 한다 — 재시도는 의미 없다 */
  FIX_INPUT: 'fix_input',
  /** 우리가 할 수 있는 게 없다 (서버 장애 등) */
  NONE: 'none',
};

/**
 * Postgres 오류 코드 → 사람 문장.
 * 여기 없는 코드는 아래 메시지 패턴 매칭으로 넘어간다.
 * (코드 참고: https://www.postgresql.org/docs/current/errcodes-appendix.html)
 */
const BY_CODE = {
  /** unique_violation — 같은 이름이 이미 있다 */
  '23505': () => ({
    message: 'That name is already used. Open the existing one, or pick a different name.',
    recovery: RECOVERY.FIX_INPUT,
  }),
  /** foreign_key_violation — 참조 대상이 사라졌다 */
  '23503': () => ({
    message: 'This is linked to something that no longer exists. Refresh and try again.',
    recovery: RECOVERY.RETRY,
  }),
  /** not_null_violation */
  '23502': () => ({
    message: 'A required field is empty.',
    recovery: RECOVERY.FIX_INPUT,
  }),
  /**
   * insufficient_privilege — RLS 정책에 막혔다.
   *
   * 실무에서 이게 뜨는 경우는 거의 둘 중 하나다: (a) 세션이 만료돼 auth.uid()가
   * null이라 owner_id 기본값·정책이 통과하지 못함, (b) 남의 데이터를 건드림.
   * 사용자 입장에서 둘 다 "다시 로그인해 보라"가 첫 수순이다.
   */
  '42501': () => ({
    message: "You don't have permission to save this. Your session may have expired — try signing in again.",
    recovery: RECOVERY.SIGN_IN,
  }),
  /** undefined_table / undefined_column — 배포 불일치. 사용자가 할 게 없다 */
  '42P01': () => ({
    message: 'The app is out of sync with the database. This needs a fix on our side.',
    recovery: RECOVERY.NONE,
  }),
  '42703': () => ({
    message: 'The app is out of sync with the database. This needs a fix on our side.',
    recovery: RECOVERY.NONE,
  }),
};

/**
 * 코드가 없을 때 쓰는 메시지 패턴. PostgREST는 RLS 위반을 코드 없이
 * 문장으로만 주는 경우가 있어(예: `new row violates row-level security
 * policy for table "plans"`) 코드 매칭만으로는 놓친다.
 */
const BY_MESSAGE = [
  {
    test: /row-level security/i,
    result: {
      message: "You don't have permission to save this. Your session may have expired — try signing in again.",
      recovery: RECOVERY.SIGN_IN,
    },
  },
  {
    test: /jwt|token|not authenticated|invalid claim/i,
    result: {
      message: 'Your session has expired. Sign in again to continue.',
      recovery: RECOVERY.SIGN_IN,
    },
  },
  {
    test: /fetch failed|network|timeout|ECONNRESET/i,
    result: {
      message: "Couldn't reach the server. Check your connection and try again.",
      recovery: RECOVERY.RETRY,
    },
  },
  {
    test: /duplicate key/i,
    result: {
      message: 'That name is already used. Open the existing one, or pick a different name.',
      recovery: RECOVERY.FIX_INPUT,
    },
  },
];

/**
 * 오류를 화면이 그릴 수 있는 형태로 바꾼다.
 *
 * @param {object|Error|string|null} error - Supabase 오류 객체(`{ code, message, details }`), Error, 또는 문자열
 * @param {string} [fallback] - 아무 규칙에도 안 걸릴 때 쓸 문장. 호출부의 맥락을 담는다 (예: '계획을 저장하지 못했습니다')
 * @returns {{message: string, recovery: string, detail: string|null}|null} error가 없으면 null
 *
 * Example usage:
 * const described = describeBackendError(res.error, "Couldn't save the plan.");
 * setError(described);
 */
export function describeBackendError(error, fallback = 'Something went wrong. Try again.') {
  if (!error) return null;

  const raw = typeof error === 'string' ? error : (error.message ?? String(error));
  const code = typeof error === 'object' && error !== null ? error.code : undefined;

  // 원문은 지원 요청용으로 항상 보존한다. details/hint까지 붙여야 실제로
  // 진단에 쓸 수 있다 — message만으로는 어느 컬럼인지 모르는 경우가 많다.
  const detailParts = [raw];
  if (typeof error === 'object' && error !== null) {
    if (error.details) detailParts.push(error.details);
    if (error.hint) detailParts.push(error.hint);
    if (code) detailParts.unshift(`[${code}]`);
  }
  const detail = detailParts.filter(Boolean).join(' ');

  const byCode = code != null ? BY_CODE[String(code)] : undefined;
  if (byCode) return { ...byCode(), detail };

  const byMessage = BY_MESSAGE.find((rule) => rule.test.test(raw));
  if (byMessage) return { ...byMessage.result, detail };

  return { message: fallback, recovery: RECOVERY.RETRY, detail };
}
