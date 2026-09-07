import Box from '@mui/material/Box';
import { expect, userEvent, waitFor } from 'storybook/test';
import SaasStoreSelect from './SaasStoreSelect';
import { SAAS_FONT } from './SaasShell';
import { ALL_STORES } from '../../../data/beautymaster/schema.js';

const STORES = ['BF1', 'BF2', 'BF3', 'BF4', 'BF5', 'G02', 'G09', 'G10'];

export default {
  title: 'BeautyMaster/Atom/SaasStoreSelect',
  component: SaasStoreSelect,
  tags: ['autodocs'],
  argTypes: {
    stores: { control: 'object', description: '선택 가능한 스토어 목록. 비면 아무것도 렌더하지 않는다' },
    value: { control: 'select', options: [ALL_STORES, ...STORES], description: "선택된 스토어 ('all'이면 전체)" },
    onChange: { action: 'storeChanged', description: '변경 핸들러 (store) => void' },
    sx: { control: 'object', description: 'Select에 적용할 MUI sx 오버라이드' },
  },
  decorators: [
    Story => (
      <Box sx={{ p: 3, fontFamily: SAAS_FONT }}>
        <Story />
      </Box>
    ),
  ],
};

/** 기본 — 전체 스토어 */
export const Default = {
  args: { stores: STORES, value: ALL_STORES },
};

/** 특정 스토어 선택 — Operations/Analytics/Workflow 세 뷰가 이 값을 공유한다 */
export const StoreSelected = {
  args: { stores: STORES, value: 'G10' },
};

/** 스토어가 없으면 컨트롤 자체를 숨긴다 (빈 드롭다운을 노출하지 않는다) */
export const NoStores = {
  args: { stores: [], value: ALL_STORES },
};

/**
 * 컨트롤 규격 — 이 컴포넌트 자체의 계약이다.
 *
 * Operations·Analytics·Workflow 세 뷰가 같은 컨트롤을 쓴다. 뷰 스토리에서만
 * 검사하면 이 컴포넌트를 다른 곳에 놓았을 때 규격이 조용히 어긋난다.
 *
 * 포커스는 굵기를 바꾸지 않는다 — 1px 그대로 두고 색과 외곽 링으로만 알린다.
 * 굵어지면 레이아웃이 1px 흔들리고, 선택과 포커스가 같은 신호로 보인다.
 */
export const MatchesControlSystem = {
  args: { stores: STORES, value: ALL_STORES },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('.MuiOutlinedInput-root');
    const outline = root.querySelector('.MuiOutlinedInput-notchedOutline');

    // 닫힘 — 회색 1px
    await expect(getComputedStyle(outline).borderWidth).toBe('1px');
    await expect(getComputedStyle(root).boxShadow).toBe('none');
    const restingWidth = getComputedStyle(outline).borderWidth;

    await userEvent.click(canvasElement.querySelector('.MuiSelect-select'));
    await waitFor(async () => {
      await expect(root.classList.contains('Mui-focused')).toBe(true);
    });

    // 열림 — 굵기는 그대로, 색만 액센트로. 링은 테두리보다 약하게.
    await expect(getComputedStyle(outline).borderWidth).toBe(restingWidth);
    await expect(getComputedStyle(outline).borderColor).toBe('rgb(0, 0, 178)');
    const shadow = getComputedStyle(root).boxShadow;
    await expect(shadow).toContain('rgba(0, 0, 178');
    await expect(Number(shadow.match(/rgba\(0, 0, 178, ([\d.]+)\)/)[1])).toBeLessThan(0.15);
  },
};

/**
 * "All stores"(필터 해제)와 매장 목록을 나눈다.
 *
 * <Divider>를 자식으로 넣지 않는다 — Select는 모든 자식을 복제하며 role="option"과
 * 클릭 핸들러를 붙여서, 구분선이 스크린리더에 선택 가능한 빈 항목으로 읽힌다.
 * 첫 매장 항목의 위쪽 선으로 대신한다.
 */
export const MenuSeparatesClearFromPick = {
  args: { stores: STORES, value: ALL_STORES },
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector('.MuiSelect-select'));

    const listbox = await waitFor(() => {
      const el = document.querySelector('[role="listbox"]');
      if (!el) throw new Error('menu not open');
      return el;
    });

    const items = [...listbox.children];
    await expect(items[0].textContent.trim()).toBe('All stores');
    await expect(items.length).toBe(STORES.length + 1);

    // 목록에 옵션 아닌 항목이 섞이지 않는다
    for (const item of items) {
      await expect(item.getAttribute('role')).toBe('option');
    }

    // 구분은 첫 매장 항목의 위쪽 선 하나로만
    await expect(getComputedStyle(items[1]).borderTopWidth).toBe('1px');
    for (const item of [items[0], ...items.slice(2)]) {
      await expect(getComputedStyle(item).borderTopWidth).toBe('0px');
    }
  },
};
