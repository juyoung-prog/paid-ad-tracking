import Box from '@mui/material/Box';
import { expect, fn, userEvent, within } from 'storybook/test';
import SaasRangeCalendar from './SaasRangeCalendar';
import { SAAS_FONT } from './SaasShell';

/** 첫 화면 달과 오늘 표시가 날짜에 따라 흔들리지 않도록 고정한다 */
const TODAY = new Date(2026, 7, 20); // 2026-08-20 (목)

const D = (y, m, d) => new Date(y, m - 1, d);

export default {
  title: 'BeautyMaster/Atom/SaasRangeCalendar',
  component: SaasRangeCalendar,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'object', description: '현재 기간 { from, to }. null은 열린 끝' },
    onChange: { action: 'rangeChanged', description: '범위 확정 핸들러 ({ from, to }) => void. 두 번째 클릭에서만 불린다' },
    today: { control: 'date', description: '오늘 표시·첫 화면 달 기준일. 테스트 주입점' },
    sx: { control: 'object', description: '바깥 Box에 적용할 MUI sx 오버라이드' },
  },
  args: {
    value: { from: null, to: null },
    today: TODAY,
    onChange: fn(),
  },
  decorators: [
    Story => (
      <Box
        sx={{
          p: 3,
          fontFamily: SAAS_FONT,
          // 실제로는 팝오버 안에서 뜬다 — 같은 표면(divider 보더 + 6px)에 얹어 확인한다
          '& > div': { border: '1px solid', borderColor: 'divider', borderRadius: '6px', width: 'fit-content' },
        }}
      >
        <Story />
      </Box>
    ),
  ],
};

/** 기본 — 값이 비어 있으면 오늘이 든 달을 편다. 오늘은 accent 색으로 표시된다 */
export const Default = {};

/** 확정된 범위 — 양끝은 accent로 채우고 사이는 옅은 띠로 잇는다 */
export const WithRange = {
  args: { value: { from: D(2026, 8, 3), to: D(2026, 8, 12) } },
};

/**
 * 두 클릭으로 범위 하나 — 첫 클릭은 시작점만 잡고(아무것도 안 내보냄),
 * 두 번째 클릭에서 onChange가 한 번 불린다. 끝을 앞에 찍으면 순서를 맞춘다.
 */
export const SelectsRangeInTwoClicks = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'August 10, 2026' }));
    await expect(args.onChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole('button', { name: 'August 4, 2026' }));
    const emitted = args.onChange.mock.calls.at(-1)[0];
    await expect(emitted.from.getDate()).toBe(4);
    await expect(emitted.to.getDate()).toBe(10);
  },
};

/**
 * 달을 넘겨도 고르던 시작점은 살아 있다 — 7월 28일을 찍고 8월로 넘겨
 * 3일을 찍으면 한 범위로 확정된다. 달 이동이 선택을 버리면 월말~월초
 * 기간(가장 흔한 교차 범위)을 고를 방법이 없다.
 */
export const KeepsDraftAcrossMonths = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(canvas.getByRole('button', { name: 'July 28, 2026' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next month' }));
    await userEvent.click(canvas.getByRole('button', { name: 'August 3, 2026' }));

    const emitted = args.onChange.mock.calls.at(-1)[0];
    await expect(emitted.from.getMonth()).toBe(6);
    await expect(emitted.from.getDate()).toBe(28);
    await expect(emitted.to.getMonth()).toBe(7);
    await expect(emitted.to.getDate()).toBe(3);
  },
};

/** 같은 날을 두 번 찍으면 하루짜리 범위다 — "그날 하루만"도 유효한 기간이다 */
export const SingleDayRange = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const day = canvas.getByRole('button', { name: 'August 20, 2026' });

    await userEvent.click(day);
    await userEvent.click(day);
    const emitted = args.onChange.mock.calls.at(-1)[0];
    await expect(emitted.from.getDate()).toBe(20);
    await expect(emitted.to.getDate()).toBe(20);
  },
};
