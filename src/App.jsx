import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { defaultTheme as theme } from './styles/themes';
import { useSupabaseSession } from './lib/useSupabaseSession';
import { LoginPage } from './pages/paidAdsDashboard/LoginPage';
import { PaidAdsShell } from './pages/paidAdsDashboard/PaidAdsShell';
import { DashboardPage } from './pages/paidAdsDashboard/DashboardPage';
import { StoresPage } from './pages/paidAdsDashboard/StoresPage';
import { ReportsPage } from './pages/paidAdsDashboard/ReportsPage';
import { SettingsPage } from './pages/paidAdsDashboard/SettingsPage';

function App() {
  const { session, isLoading } = useSupabaseSession();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 세션 복원이 끝나기 전에 라우트를 그리지 않는다 — 이미 로그인된 사용자에게
          로그인 폼이 한 번 깜빡이고, 그 사이 데이터 조회가 RLS에 막혀 빈 화면이 스친다. */}
      {isLoading ? (
        <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : !session ? (
        <LoginPage />
      ) : (
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
      )}
    </ThemeProvider>
  );
}

export default App;
