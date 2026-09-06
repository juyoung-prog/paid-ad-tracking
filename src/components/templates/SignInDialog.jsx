import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { supabase } from '../../lib/supabase';

/**
 * SignInDialog 컴포넌트
 *
 * 이메일/비밀번호 로그인을 **대화상자**로 띄운다. 앱 전체의 로그인 게이트는 꺼져
 * 있지만(App.jsx — 링크만으로 읽는다) 쓰기는 RLS가 owner를 요구하므로, 쓰기가
 * 필요한 자리(Recap 편집)에서만 이 대화상자를 연다. 성공은 onAuthStateChange로
 * 전파되므로 호출부는 세션 훅(useSupabaseSession)으로 알게 된다 — 그래도
 * 닫기는 여기서 해줘야 해서 onSignedIn을 부른다.
 *
 * 회원가입은 두지 않는다(LoginPage와 같은 이유 — 1인 운영, 계정은 Supabase
 * 대시보드에서 만든다).
 *
 * Props:
 * @param {boolean} isOpen - 열림 여부 [Required]
 * @param {function} onClose - 닫기 핸들러 () => void [Required]
 * @param {function} onSignedIn - 로그인 성공 후 () => void. 대개 onClose와 같다 [Optional]
 * @param {string} title - 제목 [Optional, 기본값: 'Sign in']
 * @param {string} description - 제목 아래 안내 한 줄 [Optional]
 *
 * Example usage:
 * <SignInDialog isOpen={isOpen} onClose={() => setIsOpen(false)} onSignedIn={() => setIsOpen(false)} description="Writing needs your account." />
 */
export function SignInDialog({ isOpen, onClose, onSignedIn, title = 'Sign in', description }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setPassword('');
    onSignedIn?.();
  };

  return (
    <Dialog open={isOpen} onClose={isSubmitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
