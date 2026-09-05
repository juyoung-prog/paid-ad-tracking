import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

import { DesignSystemProvider } from './styles/themes/DesignSystemProvider';
import { PaidAdsShell } from './pages/paidAdsDashboard/PaidAdsShell';
import { DashboardPage } from './pages/paidAdsDashboard/DashboardPage';
import { StoresPage } from './pages/paidAdsDashboard/StoresPage';
import { ReportsPage } from './pages/paidAdsDashboard/ReportsPage';
import { SettingsPage } from './pages/paidAdsDashboard/SettingsPage';

function App() {
  /* 로그인 게이트는 당분간 끈다(사용자 결정, 2026-08-20) — 링크로 접속하면 바로
     대시보드가 열려야 한다. 데이터 조회는 anon 읽기 정책(마이그레이션 19)이 담당.
     LoginPage.jsx와 useSupabaseSession은 되살릴 때를 위해 남겨둔다. */
  /* 테마는 DesignSystemProvider가 꽂는다 — 레일의 Design 버튼으로 Default ↔
     Carbon을 오가고, 선택은 localStorage에 남는다. */
  return (
    <DesignSystemProvider>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route element={<PaidAdsShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </DesignSystemProvider>
  );
}

export default App;
