/**
 * 엔트리 포인트 예시 — 폰트 로딩 위치를 보여주기 위한 파일.
 *
 * 새 프로젝트에 이 파일을 그대로 덮어쓰지 말고, 아래 두 줄의 폰트 import만
 * 기존 엔트리 포인트 최상단에 옮겨 넣으세요. (`./App.jsx`, `./index.css`는
 * 원본 프로젝트의 파일이라 이 번들에 없습니다.)
 *
 * 자세한 설치 방법은 FONTS.md 참조.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// ↓ 이 두 줄이 핵심. 테마는 폰트 이름만 지정하므로 여기서 실제 서체를 로드한다.
import 'pretendard/dist/web/variable/pretendardvariable.css';
import '@fontsource-variable/outfit';

import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
