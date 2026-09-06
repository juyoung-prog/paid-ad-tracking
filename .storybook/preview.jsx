import { useGlobals } from 'storybook/preview-api';
import CssBaseline from '@mui/material/CssBaseline';

import '@fontsource-variable/outfit';
import '@fontsource-variable/inter';
// Carbon 테마 서체 — 앱(main.jsx)과 동일
import '@fontsource-variable/ibm-plex-sans';
// 본문 서체 — 앱(main.jsx)과 동일하게 로드해야 스토리와 실화면 서체가 일치한다 (FONTS.md)
import 'pretendard/dist/web/variable/pretendardvariable.css';
import { themeMeta } from '../src/styles/themes';
import { DesignSystemDecorator, DESIGN_SYSTEM_GLOBAL } from './DesignSystemDecorator';

// Google Fonts 로드 (Material Symbols)
// Outfit Variable은 @fontsource-variable/outfit로 셀프 호스팅한다
// (Google Fonts CSS2 API는 family 이름을 항상 'Outfit'으로 내려줘서
// theme의 '"Outfit Variable"' 참조와 이름이 어긋나기 때문)
const googleFonts = [
  // Material Symbols
  'Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  'Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  'Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
];

googleFonts.forEach((font) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
  document.head.appendChild(link);
});

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  globalTypes: {
    [DESIGN_SYSTEM_GLOBAL]: {
      description: '디자인 시스템 — 앱 레일의 Design 버튼과 같은 전환',
      toolbar: {
        title: 'Design',
        icon: 'paintbrush',
        items: Object.entries(themeMeta).map(([value, meta]) => ({ value, title: meta.name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    [DESIGN_SYSTEM_GLOBAL]: 'default',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    options: {
      /* 순서 = 읽는 순서다. 디자인 언어(Overview·Style) → **이 제품**(Paid Ads
         Dashboard) → 그 아래 범용 라이브러리(Component·Interactive) → 부속.
         예전엔 목록에 'Paid Ads Dashboard'가 아예 없어서, 스토리 31개짜리 본
         제품 섹션이 Test Data·Page 같은 스캐폴드보다도 뒤에 놓였다(목록에 없는
         항목은 전부 뒤로 밀린다). 'Shape'도 Style 하위 목록에서 빠져 있어 같은
         이유로 혼자 맨 끝이었다. */
      storySort: {
        order: [
          'Overview',
          'Style',
          ['Overview', 'Colors', 'Typography', 'Shape', 'Icons', 'Spacing', 'Component Tokens'],
          'Paid Ads Dashboard',
          // 화면 → 화면을 이루는 부품 순. 처음 열어보는 사람은 페이지부터 본다.
          ['Page', 'Section', 'Layout', 'Templates', 'Data Display', 'Input', 'Media', 'Card'],
          'Component',
          [
            '1. Typography',
            '2. Container',
            '3. Card',
            '4. Media',
            '5. Data Display',
            '6. In-page Navigation',
            '7. Input & Control',
            '8. Layout',
            '9. Overlay & Feedback',
            '10. Navigation',
          ],
          'Interactive',
          ['12. Scroll'],
          'Common',
          'Template',
          'Test Data',
        ],
        method: 'alphabetical',
      },
    },
  },
  decorators: [
    (Story) => {
      // Storybook 훅은 데코레이터 함수 본문에서만 부를 수 있다(안쪽 컴포넌트에서
      // 부르면 "preview hooks can only be called inside decorators" 오류).
      const [globals, updateGlobals] = useGlobals();
      return (
        <DesignSystemDecorator
          globalValue={globals[DESIGN_SYSTEM_GLOBAL]}
          onThemeNameChange={(next) => updateGlobals({ [DESIGN_SYSTEM_GLOBAL]: next })}
        >
          <CssBaseline />
          <div style={{ width: '100%', paddingTop: '40px' }}>
            <Story />
          </div>
        </DesignSystemDecorator>
      );
    },
  ],
};

export default preview;
