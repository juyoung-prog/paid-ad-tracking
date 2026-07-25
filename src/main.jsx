import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 테마의 headingFontFamily가 "Outfit Variable"을 요청하지만, 이 import가
// 없으면 실제 폰트 파일이 로드되지 않아 브라우저가 조용히 스택 끝(sans-serif,
// OS 기본 서체)으로 폴백한다 — Storybook(.storybook/preview.jsx)에는 이미
// 있었는데 실제 앱 진입점에는 빠져 있었다.
import '@fontsource-variable/outfit'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
