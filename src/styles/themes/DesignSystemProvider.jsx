import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';

import { getTheme, themes } from './index.js';
import {
  DesignSystemContext,
  applyDesignSystemAttribute,
  loadDesignSystem,
  saveDesignSystem,
} from './designSystemContext';

/**
 * DesignSystemProvider — Default(프로젝트 기본) ↔ Carbon(IBM Carbon) 전환.
 *
 * 두 시스템은 **MUI 테마 객체 두 벌**이다. 컴포넌트 코드는 토큰(accent·surface·
 * text·shape.radius·layout…)만 읽고 값을 모르므로, 전환은 ThemeProvider에 다른
 * 테마를 꽂는 것으로 끝난다. `@carbon/react` 같은 두 번째 컴포넌트 라이브러리는
 * 들이지 않는다 — 화면마다 두 벌을 만들면 전환 버튼의 의미가 없다.
 *
 * 선택은 localStorage에 남긴다(탭·필터 뷰와 같은 원칙 — 새로고침에 살아남아야
 * "내가 고른 것"으로 느껴진다). URL에는 넣지 않는다 — 디자인 시스템은 공유할
 * 뷰 상태가 아니라 보는 사람의 취향이다.
 *
 * Props:
 * @param {string} themeName - 외부에서 제어할 때의 테마 이름. 주면 내부 state·localStorage를 쓰지 않는다(Storybook 툴바용) [Optional]
 * @param {function} onThemeNameChange - 제어 모드에서 전환 버튼이 부를 콜백 [Optional]
 * @param {node} children - 감쌀 트리 [Required]
 *
 * Example usage:
 * <DesignSystemProvider><App /></DesignSystemProvider>
 * <DesignSystemProvider themeName="carbon" onThemeNameChange={setName}>…</DesignSystemProvider>
 */
export function DesignSystemProvider({ themeName: controlledName, onThemeNameChange, children }) {
  const [ownName, setOwnName] = useState(loadDesignSystem);
  const isControlled = controlledName !== undefined;
  const themeName = isControlled ? controlledName : ownName;

  const setThemeName = useCallback((next) => {
    if (!themes[next]) return;
    if (isControlled) {
      onThemeNameChange?.(next);
      return;
    }
    setOwnName(next);
    saveDesignSystem(next);
  }, [isControlled, onThemeNameChange]);

  useEffect(() => {
    applyDesignSystemAttribute(themeName);
  }, [themeName]);

  const value = useMemo(() => ({ themeName, setThemeName }), [themeName, setThemeName]);

  return (
    <DesignSystemContext.Provider value={ value }>
      <ThemeProvider theme={ getTheme(themeName) }>
        { children }
      </ThemeProvider>
    </DesignSystemContext.Provider>
  );
}
