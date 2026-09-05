import { useEffect } from 'react';

import { themeMeta } from '../src/styles/themes';
import { DesignSystemProvider } from '../src/styles/themes/DesignSystemProvider';
import { applyDesignSystemAttribute } from '../src/styles/themes/designSystemContext';

/** 툴바 글로벌 키 — preview.jsx의 globalTypes와 같은 이름 */
export const DESIGN_SYSTEM_GLOBAL = 'designSystem';

/**
 * 디자인 시스템(Default / Carbon)을 툴바 글로벌로 둔다. preview.jsx의 데코레이터가
 * 글로벌을 읽어(useGlobals는 데코레이터 함수 안에서만 부를 수 있다) 이 컴포넌트에
 * 넘기고, 이 컴포넌트는 DesignSystemProvider를 **제어 모드**로 감싼다. 그래서
 * 스토리 안의 레일 Design 버튼을 눌러도 같은 글로벌이 바뀐다 — 툴바와 화면 속
 * 버튼이 한 상태를 본다.
 *
 * Props:
 * @param {string} globalValue - 툴바 글로벌의 현재 값. 레지스트리에 없으면 default로 본다 [Optional]
 * @param {function} onThemeNameChange - 화면 속 전환 버튼이 부를 콜백. 글로벌을 갱신한다 [Required]
 * @param {node} children - 스토리 트리 [Required]
 */
export function DesignSystemDecorator({ globalValue, onThemeNameChange, children }) {
  const themeName = themeMeta[globalValue] ? globalValue : 'default';
  useEffect(() => {
    applyDesignSystemAttribute(themeName);
  }, [themeName]);
  return (
    <DesignSystemProvider themeName={ themeName } onThemeNameChange={ onThemeNameChange }>
      { children }
    </DesignSystemProvider>
  );
}
