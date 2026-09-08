import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';

/**
 * 가장자리 페이드 폭(px). 한때 24px·알파 0.2까지 올렸는데(16px·0.12가 안 보인다는 리뷰), 그 띠가 표 오른쪽을
 * 회색으로 무겁게 덮어 마지막 열의 숫자를 흐렸다(실사용 지적, 2026-09-08). 신호는 "더 있다"는 가벼운 단서면
 * 충분하다 — 20px·0.08의 중립 페이드로 낮춘다. 오른쪽 끝까지 스크롤하면 완전히 사라지고, 왼쪽에서 떨어지면
 * 같은 무게로 왼쪽에도 나온다(아래 syncEdges).
 */
const EDGE_WIDTH = 20;
/** 아래 그림자 높이 — 표 행(약 33px)의 3분의 1. 행을 칠하지 않고 표가 흐려지는 것으로 읽힌다 */
const BOTTOM_EDGE_HEIGHT = 10;

/**
 * 가장자리 그림자. 색이 아니라 검정 알파의 그라디언트라 어떤 배경 위에서도
 * "내용이 이 방향으로 이어진다"로만 읽힌다.
 */
const EDGE_GRADIENT = {
  start: 'linear-gradient(to right, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
  end: 'linear-gradient(to left, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0))',
  /* 아래 그림자만 옅고 얕다(0.2/24px → 0.08/10px). 좌우 그림자는 세로 띠라
     가장자리 페이드로 읽히지만, 아래 그림자는 표의 **마지막 행 위에 가로로**
     깔려서 "이 행이 선택됐다"로 읽혔다(실사용 지적). 신호는 남기되 행을 칠하지
     않는 두께·농도로 낮춘다 — 없애면 21일짜리 표가 열 줄에서 끝난 것처럼
     보이던 문제(i-9)가 돌아온다. */
  bottom: 'linear-gradient(to top, rgba(17, 24, 39, 0.08), rgba(17, 24, 39, 0))',
};
/**
 * edgeStrength='subtle' — 좌우 페이드를 한 단 더 옅고 좁게(0.05/16px). 보고서 표(Recap)처럼
 * 화면에 거의 다 들어와서 몇 px만 넘치는 자리. 신호는 남기되 표의 나머지 경계선과 같은 무게로.
 */
const SUBTLE_EDGE_WIDTH = 16;
const SUBTLE_EDGE_GRADIENT = {
  start: 'linear-gradient(to right, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0))',
  end: 'linear-gradient(to left, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0))',
  bottom: EDGE_GRADIENT.bottom,
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
 * 세로로 넘칠 때는 **아래쪽에만** 그림자를 띄운다. 이 신호가 없으면 가로와
 * 똑같은 함정이 세로로 재발한다 — Daily spend 표(43일)가 열한 줄에서 끝난
 * 것처럼 보였다(실사용 신고 i-9: "07/10까지밖에 안 나와"). 위쪽 그림자는 일부러
 * 없다: "위로 돌아갈 내용"은 이미 스크롤을 시작한 사람에게만 생기는 상태라
 * 발견 신호가 아니고, sticky 헤더가 z-index로 떠 있어서 그 위에 그림자를
 * 얹으려면 헤더보다 높이 올려 헤더를 덮는 수밖에 없다.
 * 아래 그림자는 sticky 헤더보다 위에 그린다(zIndex) — 표의 sticky 셀들이
 * 자체 z-index를 갖고 있어 기본 겹침으로는 그림자가 그 뒤에 숨는다.
 *
 * Props:
 * @param {ReactNode} children - 스크롤될 내용 [Required]
 * @param {string} label - 스크롤 영역의 접근성 이름. 주면 role="region" + 키보드 포커스가 붙는다(WCAG 2.1.1: 스크롤 영역은 키보드로도 조작 가능해야 함) [Optional]
 * @param {number} startOffset - 좌측 그림자를 그릴 x 위치(px). 고정 열 폭 등 [Optional, 기본값: 0]
 * @param {number|string} maxHeight - 세로 최대 높이. 주면 세로 스크롤도 이 영역이 받는다 [Optional]
 * @param {'strong'|'subtle'} edgeStrength - 좌우 페이드의 무게. 'strong'(기본)은 0.08/20px — 운영 표(Performance). 'subtle'은 0.05/16px — 거의 다 들어오는 보고서 표(Recap). 둘 다 셀 내용을 가리지 않는 가벼운 단서다(2026-09-08) [Optional, 기본값: 'strong']
 * @param {'fade'|'scrollbar'} scrollHint - 세로 스크롤이 남았다는 신호를 무엇으로 줄지. 'fade'(기본)는 아래 그라데이션, 'scrollbar'는 항상 보이는 얇은 스크롤바 — 표의 마지막 행 위에 페이드가 깔려 그 행이 선택된 것처럼 읽히는 자리(CampaignDetailPanel의 Daily spend)에서 쓴다. 좌우 페이드는 두 모드 모두 그대로다 [Optional, 기본값: 'fade']
 * @param {object} sx - 추가 스타일 오버라이드 [Optional]
 *
 * Example usage:
 * <ScrollArea label="Performance table" startOffset={360} maxHeight={640}>
 *   <Table sx={{ minWidth: 1800 }}>...</Table>
 * </ScrollArea>
 */
export function ScrollArea({ children, label, startOffset = 0, maxHeight, scrollHint = 'fade', edgeStrength = 'strong', sx }) {
  const isSubtle = edgeStrength === 'subtle';
  const gradient = isSubtle ? SUBTLE_EDGE_GRADIENT : EDGE_GRADIENT;
  const edgeWidth = isSubtle ? SUBTLE_EDGE_WIDTH : EDGE_WIDTH;
  const viewportRef = useRef(null);
  const [edges, setEdges] = useState({ start: false, end: false, bottom: false });

  const syncEdges = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    // 소수점 폭(줌·스케일)에서 1px 미만 잔여로 그림자가 깜빡이지 않게 여유를 둔다.
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const next = {
      start: el.scrollLeft > 1,
      end: el.scrollLeft < maxScrollLeft - 1,
      bottom: el.scrollTop < maxScrollTop - 1,
    };
    setEdges((prev) => (
      prev.start === next.start && prev.end === next.end && prev.bottom === next.bottom ? prev : next
    ));
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
    ...(side === 'bottom'
      ? // 세로 그림자 — MUI stickyHeader 셀이 z-index 2로 떠 있어 그보다 위에
        // 그린다. 가로 그림자는 sticky 고정 열 **뒤**로 숨는 게 맞아서(고정 열
        // 위에 그림자가 지나가면 안 움직이는 열이 움직이는 것처럼 읽힘) 기본
        // 겹침을 유지한다 — 같은 이유의 반대 방향 결정이다.
        { left: 0, right: 0, bottom: 0, height: BOTTOM_EDGE_HEIGHT, zIndex: 3 }
      : { top: 0, bottom: 0, width: edgeWidth, ...(side === 'start' ? { left: startOffset } : { right: 0 }) }),
    background: gradient[side],
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
        sx={(theme) => ({
          overflowX: 'auto',
          maxHeight,
          overflowY: maxHeight ? 'auto' : undefined,
          /* scrollHint='scrollbar' — 아래 페이드 대신 **항상 보이는 얇은 스크롤바**로
             "더 있다"를 말한다. 페이드는 표의 마지막 행 위에 가로로 깔려서 그 행이
             선택된 것처럼 읽혔다(실사용 지적). 기본값(overlay 스크롤바)은 마우스를
             올려야 나타나서 신호가 되지 못하므로 여기서 직접 그린다. */
          ...(scrollHint === 'scrollbar' && {
            scrollbarWidth: 'thin',
            scrollbarColor: `${theme.palette.grey[300]} transparent`,
            '&::-webkit-scrollbar': { width: 8, height: 8 },
            '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[300],
              borderRadius: 4,
              border: '2px solid transparent',
              backgroundClip: 'content-box',
            },
          }),
        })}
      >
        {children}
      </Box>
      <Box aria-hidden sx={edgeSx('start')} />
      <Box aria-hidden sx={edgeSx('end')} />
      {maxHeight != null && scrollHint === 'fade' && <Box aria-hidden sx={edgeSx('bottom')} />}
    </Box>
  );
}
