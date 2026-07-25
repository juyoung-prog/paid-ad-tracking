import { Outlet } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import { AppShell } from '../../components/layout/AppShell';
import { PaidAdsNav } from './PaidAdsNav';

/**
 * PaidAdsShell
 *
 * DashboardPage/StoresPage/ReportsPage가 공유하는 글로벌 앱 셸.
 * 기존에는 페이지마다 타이틀+네비를 각자 그렸는데(중복), 여기서 한 번만
 * 그리고 <Outlet />으로 각 페이지 콘텐츠만 갈아끼운다. 페이지별 헤더 내용
 * (KpiBar, 알림 벨, 액션 버튼 등)은 이 셸이 아니라 각 페이지 콘텐츠 상단의
 * 보조 툴바로 옮겼다 — 저건 페이지마다 다르므로 글로벌 셸의 책임이 아니다.
 *
 * AppShell/GNB가 이미 반응형(모바일 햄버거+드로어)을 처리하므로 여기서
 * 별도 처리를 하지 않는다.
 */
export function PaidAdsShell() {
  return (
    <AppShell
      logo={(
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Paid Ads Dashboard
        </Typography>
      )}
      headerCollapsible={<PaidAdsNav />}
      headerHeight={56}
    >
      <Outlet />
    </AppShell>
  );
}
