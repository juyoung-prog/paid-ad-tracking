import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 테마의 headingFontFamily가 "Outfit Variable"을 요청하지만, 이 import가
// 없으면 실제 폰트 파일이 로드되지 않아 브라우저가 조용히 스택 끝(sans-serif,
// OS 기본 서체)으로 폴백한다 — Storybook(.storybook/preview.jsx)에는 이미
// 있었는데 실제 앱 진입점에는 빠져 있었다.
import '@fontsource-variable/outfit'
// 본문 서체 — 테마 fontFamily 첫 항목이 "Pretendard Variable"인데 이 import가
// 없으면 시스템 폰트(-apple-system 등)로 폴백한다 (FONTS.md, 2026-09 핸드오프로 발견).
import 'pretendard/dist/web/variable/pretendardvariable.css'
// Paid Ads 화면은 influencer tracking dashboard와 같은 서체를 쓴다 —
// 레퍼런스의 SaasShell이 셸 루트에 Inter를 걸고 그 안의 모든 텍스트 요소에
// 상속을 강제하므로(PaidAdsShell도 동일), 그 폰트 파일이 실제로 필요하다.
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
