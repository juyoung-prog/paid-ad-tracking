import { NavLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/reports', label: 'Reports' },
  { to: '/stores', label: 'Stores' },
  { to: '/settings', label: 'Settings' },
];

/**
 * PaidAdsNav
 *
 * DashboardPage/StoresPage/ReportsPage 세 페이지가 공유하는 최소 내비게이션.
 * 이 프로젝트 전용이라 컴포넌트 라이브러리(src/components/navigation/)가
 * 아니라 페이지 폴더에 둔다 — GNB처럼 범용 재사용을 목표로 하지 않는다.
 *
 * Props:
 * @param {object} sx - 추가 스타일 [Optional]
 */
export function PaidAdsNav({ sx }) {
  return (
    <Box sx={{ display: 'flex', gap: 2.5, ...sx }}>
      {LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <Typography
              variant="body2"
              sx={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'primary.main' : 'text.secondary' }}
            >
              {link.label}
            </Typography>
          )}
        </NavLink>
      ))}
    </Box>
  );
}
