/**
 * Theme System
 *
 * 테마를 관리하는 유틸리티를 제공합니다.
 * 각 테마는 MUI createTheme 규격을 따릅니다.
 */

import defaultTheme from './default.js';
import carbonTheme from './carbon.js';

/**
 * 사용 가능한 테마 목록.
 *
 * 두 테마는 **같은 토큰 키**를 가진다(accent·surface·shape.radius·layout·
 * iconSize·customShadows·typography.display/title/label/shellFontFamily).
 * 컴포넌트는 키만 읽으므로 어느 쪽을 꽂아도 참조가 깨지지 않는다 — 새 토큰을
 * 한쪽에만 추가하면 다른 쪽에서 undefined가 되니 둘 다 채운다.
 */
export const themes = {
  default: defaultTheme,
  carbon: carbonTheme,
};

/** 테마 메타데이터 — 전환 버튼 라벨과 Storybook 툴바가 읽는다 */
export const themeMeta = {
  default: {
    name: 'Default',
    description: '프로젝트 기본 테마 — flat, Brand Blue, Inter',
    mode: 'light',
  },
  carbon: {
    name: 'Carbon',
    description: 'IBM Carbon Design System(White 테마)을 MUI 토큰으로 옮긴 테마 — IBM Plex Sans, Blue 60',
    mode: 'light',
  },
};

/**
 * 테마 이름으로 테마 객체 가져오기
 *
 * @param {string} themeName - 테마 이름
 * @returns {object} MUI 테마 객체
 */
export const getTheme = (themeName) => {
  return themes[themeName] || themes.default;
};

/**
 * 테마 이름 목록 가져오기
 *
 * @returns {string[]} 테마 이름 배열
 */
export const getThemeNames = () => Object.keys(themes);

export { defaultTheme, carbonTheme };
export default themes;
