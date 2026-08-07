import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * 화면의 "보고 있는 것"(탭·필터)을 URL 쿼리와 양방향으로 묶는다.
 *
 * ## 무엇이 문제였나
 *
 * 탭·필터는 이미 localStorage(`paidAdsDashboard:lastView:v1`)에 저장돼서 **새로
 * 고침에는 살아남았다.** 하지만 URL에는 아무것도 없어서 두 가지가 안 됐다:
 *
 * 1. **뒤로가기가 필터를 되돌리지 않는다.** 사용자가 필터를 잘못 걸고 브라우저
 *    뒤로가기를 누르면, 필터가 풀리는 게 아니라 **페이지를 떠난다.** 되돌리기의
 *    가장 보편적인 관용구가 이 화면에서만 다르게 동작했다.
 * 2. **뷰를 공유할 수 없다.** localStorage는 이 브라우저 안에만 있어서
 *    "G10 Opening 성과 화면"을 동료에게 링크로 보낼 방법이 없었다. 대신
 *    "Reports 가서 Event를 G10으로 바꾸고 기간을 8월로…"를 말로 설명해야 했다.
 *
 * ## 우선순위
 *
 * URL > localStorage > 기본값. URL에 값이 있으면 그게 진실이다(누가 보낸 링크를
 * 열었다는 뜻). 없으면 마지막으로 보던 화면을 복원한다(기존 동작 유지).
 *
 * ## 히스토리 항목을 언제 쌓나
 *
 * 최초 동기화는 `replace`다 — 페이지에 들어오자마자 "빈 URL"과 "복원된 URL"
 * 두 개가 쌓이면, 뒤로가기 한 번이 아무것도 안 하는 것처럼 보인다. 그 뒤의
 * 사용자 조작만 `push`해서 뒤로가기가 조작 단위로 되감기게 한다.
 *
 * @param {Object<string, string>} view - 평평한 문자열 맵. 빈 문자열은 URL에서 생략된다
 * @param {function} applyView - URL이 바뀌었을 때(뒤로가기 등) 화면 상태를 되돌리는 함수. `(view) => void`
 * @param {object} options
 * @param {string} [options.storageKey] - localStorage 폴백 키. 없으면 URL만 쓴다. 저장 형태는 view와 같은 평평한 맵이라, 호출부는 useState 초기화에서 그대로 읽으면 된다
 * @param {string[]} [options.keepParams] - 이 훅이 건드리지 않고 보존할 다른 쿼리 키(예: 딥링크 `campaign`)
 *
 * Example usage:
 * useViewUrlSync(
 *   { tab, platform, event: campaignGroup, from: dateRange.start, to: dateRange.end },
 *   (next) => { setTab(next.tab || 'now'); setDateRange({ start: next.from, end: next.to }); },
 *   { storageKey: VIEW_STORAGE_KEY, keepParams: ['campaign'] },
 * );
 */
export function useViewUrlSync(view, applyView, { storageKey, keepParams = [] } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // 콜백을 ref에 담는다 — 호출부가 매 렌더 새 함수를 넘겨도 effect가 다시 돌지
  // 않게 한다. 이 effect들은 서로를 트리거할 수 있어서 의존성이 늘어나면 루프가
  // 생긴다.
  const applyRef = useRef(applyView);
  applyRef.current = applyView;

  const isFirstSync = useRef(true);

  const keys = Object.keys(view);
  // 값 자체를 의존성으로 쓴다 — view 객체는 매 렌더 새로 만들어지므로 참조를
  // 의존성에 넣으면 무한 루프가 된다.
  const viewSignature = keys.map((k) => `${k}=${view[k] ?? ''}`).join('&');
  const urlSignature = searchParams.toString();

  /* 두 effect가 서로의 최신 값을 **의존성 없이** 읽게 한다.
     의존성으로 넣으면 한쪽이 바뀔 때 다른 쪽도 같이 도는데, 그러면 뒤로가기가
     깨진다: URL이 되감기면 "URL → 화면" effect가 상태를 되돌리지만, 같은 렌더에
     "화면 → URL" effect도 함께 돌면서 **아직 반영되지 않은 옛 view**를 URL에
     다시 밀어 넣어 방금의 되감기를 취소해 버린다. 각 effect는 자기 트리거에만
     반응하고, 상대 값은 ref로 읽는다. */
  const viewRef = useRef(view);
  viewRef.current = view;
  const paramsRef = useRef(searchParams);
  paramsRef.current = searchParams;

  // ── URL → 화면 ─────────────────────────────────────────────
  // 뒤로/앞으로가기와 "링크로 들어옴"을 모두 처리한다.
  useEffect(() => {
    const current = paramsRef.current;
    const hasAnyViewParam = keys.some((key) => current.has(key));

    if (isFirstSync.current && !hasAnyViewParam) {
      // 링크가 아니라 그냥 들어온 경우 — 화면은 이미 localStorage에서 복원돼
      // 있으므로 여기서 덮어쓰지 않는다. 아래 "화면 → URL" effect가 그 상태를
      // URL에 적는다.
      return;
    }

    const fromUrl = {};
    keys.forEach((key) => { fromUrl[key] = current.get(key) ?? ''; });

    const differs = keys.some((key) => (viewRef.current[key] ?? '') !== fromUrl[key]);
    if (differs) applyRef.current(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSignature]);

  // ── 화면 → URL ─────────────────────────────────────────────
  // 사용자가 컨트롤을 조작했을 때만 돈다(viewSignature 변화). URL이 바뀌었다는
  // 이유로는 돌지 않는다 — 위 주석의 뒤로가기 문제 때문이다.
  useEffect(() => {
    const current = paramsRef.current;

    /* 링크로 들어온 첫 렌더에서는 쓰지 않는다. 이때 화면 상태는 아직
       localStorage에서 복원된 옛 값이고, 위 effect가 URL 값으로 덮어쓰는 중이다.
       여기서 옛 값을 URL에 밀어 넣으면 둘이 서로를 덮어쓰며 진동한다
       (시뮬레이션으로 재현: 링크 진입 시 무한 루프). URL이 진실이므로 양보한다. */
    if (isFirstSync.current && keys.some((key) => current.has(key))) {
      isFirstSync.current = false;
      return;
    }

    const next = new URLSearchParams();
    keys.forEach((key) => {
      const value = viewRef.current[key];
      if (value) next.set(key, String(value));
    });
    keepParams.forEach((key) => {
      const value = current.get(key);
      if (value) next.set(key, value);
    });

    if (next.toString() === current.toString()) {
      isFirstSync.current = false;
      return;
    }
    setSearchParams(next, { replace: isFirstSync.current });
    isFirstSync.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewSignature]);

  // ── localStorage 폴백 ──────────────────────────────────────
  // URL이 1급이지만 저장도 계속한다 — 링크 없이 다시 들어왔을 때 마지막 화면을
  // 복원하는 기존 동작을 잃지 않기 위해서다.
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(view));
    } catch {
      // localStorage 사용 불가(사생활 모드 등) — 조용히 무시한다. URL이 있으므로
      // 이 실패로 잃는 건 "다음 방문 시 복원"뿐이다.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewSignature, storageKey]);
}
