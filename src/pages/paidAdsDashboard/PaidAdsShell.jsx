import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import { PaidAdsRail, RAIL_WIDTH } from './PaidAdsRail';

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
export function PaidAdsShell() {
  return (
    <Box
      sx={ {
        display: 'flex',
        height: '100dvh',
        // 펼친 레일이 본문 위에 겹치도록 기준점을 잡고, z-index를 셸 안으로 가둔다
        position: 'relative',
        isolation: 'isolate',
        backgroundColor: 'background.default',
      } }
    >
      {/* 레일 자리 확보 — 레일이 펼쳐져도 본문이 밀리지 않게 흐름에 폭만 남긴다 */}
      <Box aria-hidden sx={ { width: RAIL_WIDTH, flexShrink: 0 } } />

      <PaidAdsRail />

      <Box
        component="main"
        sx={ { flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' } }
      >
        <Outlet />
      </Box>
    </Box>
  );
}
