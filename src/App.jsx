import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { defaultTheme as theme } from './styles/themes';
import { PaidAdsShell } from './pages/paidAdsDashboard/PaidAdsShell';
import { DashboardPage } from './pages/paidAdsDashboard/DashboardPage';
import { StoresPage } from './pages/paidAdsDashboard/StoresPage';
import { ReportsPage } from './pages/paidAdsDashboard/ReportsPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route element={<PaidAdsShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
