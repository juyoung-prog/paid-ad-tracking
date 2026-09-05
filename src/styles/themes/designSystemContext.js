import { createContext, useContext } from 'react';

import { themes } from './index.js';

/**
 * 디자인 시스템 전환의 비(非)컴포넌트 부분 — 컨텍스트·저장 키·훅.
 * Provider 컴포넌트(DesignSystemProvider.jsx)와 파일을 나눈 이유는 Fast Refresh
 * 규칙(컴포넌트 파일은 컴포넌트만 내보낸다)이다. 설계 배경은 Provider 주석 참고.
 */
export const DESIGN_SYSTEM_STORAGE_KEY = 'paidAds:designSystem:v1';
export const DEFAULT_DESIGN_SYSTEM = 'default';

/** 저장된 값이 레지스트리에 없으면(테마가 사라졌거나 손상) 기본으로 돌아간다. */
export function loadDesignSystem() {
  if (typeof window === 'undefined') return DEFAULT_DESIGN_SYSTEM;
  try {
    const stored = window.localStorage.getItem(DESIGN_SYSTEM_STORAGE_KEY);
    return stored && themes[stored] ? stored : DEFAULT_DESIGN_SYSTEM;
  } catch {
    return DEFAULT_DESIGN_SYSTEM;
  }
}

export function saveDesignSystem(name) {
  try {
    window.localStorage.setItem(DESIGN_SYSTEM_STORAGE_KEY, name);
  } catch {
    /* 저장 실패는 조용히 — 이번 세션 안에서는 state가 이미 맞다 */
  }
}

/**
 * `<html data-design-system="…">`. 셸 루트가 아니라 documentElement인 이유:
 * Drawer·Menu·Tooltip은 포털로 body 끝에 렌더돼 셸 밖이다. 테마는 컨텍스트라
 * 포털을 따라가지만, CSS 선택자로 갈라야 하는 드문 경우는 루트 속성이 있어야 한다.
 * Storybook 데코레이터도 같은 속성을 찍어야 해서 따로 내보낸다.
 */
export function applyDesignSystemAttribute(name) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.designSystem = name;
}

/**
 * Provider 밖에서 useDesignSystem을 부르면(테마만 꽂은 스토리 등) 전환 버튼이
 * 기본 이름을 보여주고 클릭은 아무 일도 하지 않는다 — 컨트롤이 사라지면 스토리가
 * 실화면과 다른 레일을 보여주게 된다(PaidAdsRail의 Refresh 행과 같은 원칙).
 */
export const DesignSystemContext = createContext({
  themeName: DEFAULT_DESIGN_SYSTEM,
  setThemeName: () => {},
});

/**
 * 현재 디자인 시스템 이름과 전환 함수.
 *
 * Example usage:
 * const { themeName, setThemeName } = useDesignSystem();
 * setThemeName(themeName === 'carbon' ? 'default' : 'carbon');
 */
export function useDesignSystem() {
  return useContext(DesignSystemContext);
}
