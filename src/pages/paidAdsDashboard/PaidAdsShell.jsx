import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import { PaidAdsRail, RAIL_WIDTH } from './PaidAdsRail';
import { paidAdsFontSx } from './paidAdsPageUtils';


/**
 * PaidAdsShell
 *
 * DashboardPage/StoresPage/ReportsPage/SettingsPage가 공유하는 글로벌 앱 셸.
 * 페이지마다 타이틀+네비를 각자 그리지 않고 여기서 한 번만 그린 뒤
 * <Outlet />으로 각 페이지 콘텐츠만 갈아끼운다. 페이지별 헤더 내용
 * (KpiBar, 알림 벨, 액션 버튼 등)은 이 셸이 아니라 각 페이지 콘텐츠 상단의
 * 보조 툴바에 있다 — 저건 페이지마다 다르므로 글로벌 셸의 책임이 아니다.
 *
 * 예전에는 AppShell(상단 GNB + 가로 네비)을 썼는데, 좌측 아이콘 레일로 바꿨다.
 * 세로 내비는 항목이 늘어도 가로폭을 먹지 않고, 본문 상단 전체를 페이지 툴바가
 * 쓸 수 있다(예전엔 GNB 56px 아래에 툴바가 또 붙어 헤더가 두 겹이었다).
 *
 * 스크롤은 이 셸의 main이 소유한다 — 문서 전체를 스크롤시키면 레일이 같이
 * 밀려 올라간다. main만 스크롤하면 레일은 항상 제자리에 있고, 각 페이지의
 * sticky 툴바는 이 컨테이너 기준(top:0)으로 붙는다.
 */
/**
 * 인쇄(브라우저 인쇄 = PDF) 규칙 — Recap 보고서를 그대로 넘기기 위한 것.
 * 레일·버튼(data-print="hide")을 숨기고, 스크롤 컨테이너를 풀어 문서 전체가
 * 종이에 흐르게 하며, 섹션 카드는 페이지 경계에서 잘리지 않게 한다. 다른
 * 페이지에도 해가 없어서 셸 레벨에 둔다.
 */
const PRINT_STYLES = {
  '@media print': {
    'html, body': { height: 'auto', overflow: 'visible', backgroundColor: '#fff' },
    '[data-print="hide"]': { display: 'none !important' },
    // sx가 만든 클래스가 뒤에 오므로 !important 없이는 지지 않는다
    '[data-print="shell"]': { display: 'block !important', height: 'auto !important' },
    '[data-print="main"]': { overflow: 'visible !important', height: 'auto !important' },
    '[data-print="card"], [data-print="section"]': { breakInside: 'avoid', pageBreakInside: 'avoid' },
    // 가로 스크롤 영역은 그림자·스크롤바 없이 있는 그대로 — 표가 잘리면 축소 인쇄가 맞다
    '[data-print="main"] *': { boxShadow: 'none !important' },
  },
};

export function PaidAdsShell() {
  return (
    <Box
      data-print="shell"
      sx={ theme => ({
        display: 'flex',
        height: '100dvh',
        // 펼친 레일이 본문 위에 겹치도록 기준점을 잡고, z-index를 셸 안으로 가둔다
        position: 'relative',
        isolation: 'isolate',
        backgroundColor: 'background.default',
        ...paidAdsFontSx(theme),
      }) }
    >
      <GlobalStyles styles={ PRINT_STYLES } />

      {/* 레일 자리 확보 — 레일이 펼쳐져도 본문이 밀리지 않게 흐름에 폭만 남긴다 */}
      <Box aria-hidden data-print="hide" sx={ { width: RAIL_WIDTH, flexShrink: 0 } } />

      <Box data-print="hide" sx={ { display: 'contents' } }>
        <PaidAdsRail />
      </Box>

      <Box
        component="main"
        data-print="main"
        sx={ { flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' } }
      >
        <Outlet />
      </Box>
    </Box>
  );
}
