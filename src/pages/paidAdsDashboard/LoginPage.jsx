import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

import { supabase } from '../../lib/supabase';
import { PAID_ADS_FONT_SX } from './paidAdsPageUtils';

/**
 * LoginPage
 *
 * 이메일/비밀번호 로그인 화면. 모든 테이블의 RLS가 `owner_id = auth.uid()`라
 * 세션 없이는 데이터가 한 건도 보이지 않으므로, 앱 진입 전에 이 화면을 거친다.
 *
 * 회원가입은 두지 않는다 — 1인 운영 기준이고 사용자는 Supabase 대시보드에서
 * 미리 만든다(02-ux-flow.md). 가입 폼을 열어두면 누구나 계정을 만들 수 있게 된다.
 *
 * Props: 없음 (로그인 성공은 onAuthStateChange로 전파되므로 콜백이 필요 없다)
 *
 * Example usage:
 * <LoginPage />
 */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    // 성공 시엔 상태를 건드리지 않는다 — onAuthStateChange가 App을 다시 그리면서
    // 이 컴포넌트가 언마운트되므로, 여기서 setState하면 unmounted 경고가 난다.
    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={ {
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        backgroundColor: 'surface.sunken',
        // 로그인은 셸 밖(인증 전)에 렌더돼서 셸의 서체 규칙을 못 받는다 —
        // 사용자가 처음 보는 화면이라 여기만 다른 서체면 첫인상부터 어긋난다.
        ...PAID_ADS_FONT_SX,
      } }
    >
      <Paper
        component="form"
        onSubmit={ handleSubmit }
        elevation={ 0 }
        sx={ { width: '100%', maxWidth: 400, p: 4, border: 1, borderColor: 'divider' } }
      >
        <Stack spacing={ 3 }>
          <Box>
            <Typography variant="h5" component="h1">Paid Ads Tracking</Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to continue.
            </Typography>
          </Box>

          { errorMessage && <Alert severity="error">{ errorMessage }</Alert> }

          <TextField
            label="Email"
            type="email"
            value={ email }
            onChange={ (e) => setEmail(e.target.value) }
            autoComplete="email"
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={ password }
            onChange={ (e) => setPassword(e.target.value) }
            autoComplete="current-password"
            required
            fullWidth
          />

          {/* 버튼 높이는 32(small) / 40(default) 두 단계뿐이다. large(48)는 앱에서
              여기 한 곳만 쓰던 세 번째 단계라 없앴다 — 폼 제출 버튼은 default,
              툴바·표 안은 small이라는 규칙으로 정리한다. */}
          <Button type="submit" variant="contained" disabled={ isSubmitting } fullWidth sx={ { boxShadow: 'none' } }>
            { isSubmitting ? 'Signing in…' : 'Sign in' }
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
