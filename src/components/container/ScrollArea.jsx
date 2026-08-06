import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

/**
 * 가장자리 그림자 폭(px). 16px·알파 0.12로 시작했다가 올렸다 — 렌더는 되고
 * 있었지만 화면에서 있는지 없는지 분간이 안 돼서, 마지막 컬럼이 잘려 있는데도
 * 여전히 표가 끝난 것처럼 보였다(실화면 리뷰). 신호는 보여야 신호다.
 * 내용 위에 얹히므로 더 넓히면 숫자를 가린다 — 여기가 상한선이다.
 */
const EDGE_WIDTH = 24;

/**
 * 가장자리 그림자. 색이 아니라 검정 알파의 그라디언트라 어떤 배경 위에서도
 * "내용이 이 방향으로 이어진다"로만 읽힌다.
 */
const EDGE_GRADIENT = {
  start: 'linear-gradient(to right, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0))',
  end: 'linear-gradient(to left, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0))',
};

/**
 * ScrollArea 컴포넌트
 *
 * 가로로 넘치는 내용을 스크롤시키되, **더 볼 게 남았다는 사실 자체를 보이게**
 * 하는 컨테이너. 브라우저 기본 overflow는 스크롤바가 나타나기 전까지 아무 신호도
 * 주지 않아서(특히 macOS 오버레이 스크롤바), 표가 딱 맞게 끝난 것처럼 보이는
 * 문제가 있다 — 조금만 넘칠수록 오히려 더 완결돼 보인다.
 *
 * 동작 방식:
 * 1. 내부 뷰포트의 scrollLeft / scrollWidth를 읽어 양끝에 남은 내용이 있는지 판정
 * 2. 남은 방향에만 그림자를 띄운다 (양끝에 닿으면 사라짐)
 * 3. 그림자는 내용 위에 얹히고 클릭을 가로채지 않는다 (pointerEvents: none)
 *
 * 상태로 두는 값은 "그림자를 켤지 말지"라는 불리언 두 개뿐이다 — 스크롤 좌표
 * 자체를 상태로 올리면 스크롤 프레임마다 리렌더가 돈다. 전환도 opacity만 쓴다.
 *
 * startOffset은 좌측 그림자를 컨테이너 왼쪽 끝이 아니라 그 안쪽에 그리기 위한
 * 값이다 — 표의 고정(sticky) 열처럼 스크롤해도 제자리에 있는 요소가 앞을
 * 덮고 있으면, 그림자는 그 요소의 오른쪽 경계에 붙어야 "여기서부터 움직인다"로
 * 읽힌다.
 *
 * maxHeight를 주면 세로로도 이 영역 안에서 스크롤한다. 안에 든 표의 헤더를
 * position:sticky로 고정하려면 이 값이 필요하다 — sticky는 가장 가까운 스크롤
 * 컨테이너를 기준으로 붙는데, 가로 overflow가 있는 순간 이 컴포넌트가 그 기준이
 * 되어버려서 페이지 기준으로 고정하려던 헤더가 그냥 같이 밀려 올라간다. 세로
 * 스크롤까지 여기서 받으면 헤더는 이 영역의 위쪽에 정확히 고정된다.
 *
 * Props:
 * @param {ReactNode} children - 스크롤될 내용 [Required]
 * @param {string} label - 스크롤 영역의 접근성 이름. 주면 role="region" + 키보드 포커스가 붙는다(WCAG 2.1.1: 스크롤 영역은 키보드로도 조작 가능해야 함) [Optional]
 * @param {number} startOffset - 좌측 그림자를 그릴 x 위치(px). 고정 열 폭 등 [Optional, 기본값: 0]
 * @param {number|string} maxHeight - 세로 최대 높이. 주면 세로 스크롤도 이 영역이 받는다 [Optional]
 * @param {object} sx - 추가 스타일 오버라이드 [Optional]
 *
 * Example usage:
 * <ScrollArea label="Performance table" startOffset={360} maxHeight={640}>
 *   <Table sx={{ minWidth: 1800 }}>...</Table>
 * </ScrollArea>
 */
export function ScrollArea({ children, label, startOffset = 0, maxHeight, sx }) {
  const viewportRef = useRef(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const syncEdges = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    // 소수점 폭(줌·스케일)에서 1px 미만 잔여로 그림자가 깜빡이지 않게 여유를 둔다.
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const next = { start: el.scrollLeft > 1, end: el.scrollLeft < maxScrollLeft - 1 };
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    // ResizeObserver는 관찰을 시작할 때 콜백을 한 번 준다 — 초기 계산을 effect
    // 본문에서 동기 setState로 하지 않기 위해 그 콜백에 맡긴다.
    // 뷰포트(창 크기)와 내용(컬럼 구성 변화) 양쪽을 봐야 판정이 낡지 않는다.
    const observer = new ResizeObserver(syncEdges);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [syncEdges]);

  const edgeSx = (side) => (theme) => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
    ...(side === 'start' ? { left: startOffset } : { right: 0 }),
    background: EDGE_GRADIENT[side],
    opacity: edges[side] ? 1 : 0,
    pointerEvents: 'none',
    transition: theme.transitions.create('opacity', {
      duration: theme.transitions.duration.shortest,
    }),
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  });

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <Box
        ref={viewportRef}
        onScroll={syncEdges}
        role={label ? 'region' : undefined}
        aria-label={label}
        tabIndex={label ? 0 : undefined}
        sx={{ overflowX: 'auto', maxHeight, overflowY: maxHeight ? 'auto' : undefined }}
      >
        {children}
      </Box>
      <Box aria-hidden sx={edgeSx('start')} />
      <Box aria-hidden sx={edgeSx('end')} />
    </Box>
  );
}
