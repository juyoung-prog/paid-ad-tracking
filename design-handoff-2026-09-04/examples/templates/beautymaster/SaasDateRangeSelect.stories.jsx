import Box from '@mui/material/Box';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import SaasDateRangeSelect from './SaasDateRangeSelect';
import { SAAS_FONT } from './SaasShell';

/** 프리셋은 "오늘"에서 계산된다 — 스토리가 날짜에 따라 흔들리지 않도록 고정한다 */
const TODAY = new Date(2026, 7, 20); // 2026-08-20 (목)

const D = (y, m, d) => new Date(y, m - 1, d);

export default {
  title: 'BeautyMaster/Atom/SaasDateRangeSelect',
  component: SaasDateRangeSelect,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'object', description: '현재 기간 { from, to }. null은 열린 끝(전체)' },
    onChange: { action: 'rangeChanged', description: '변경 핸들러 ({ from, to }) => void' },
    today: { control: 'date', description: '프리셋·달력 기준일. 테스트 주입점' },
    sx: { control: 'object', description: '바깥 Box에 적용할 MUI sx 오버라이드' },
  },
  args: {
    value: { from: null, to: null },
    today: TODAY,
    onChange: fn(),
  },
  decorators: [
    Story => (
      <Box sx={{ p: 3, fontFamily: SAAS_FONT }}>
        <Story />
      </Box>
    ),
  ],
};

/** 기본 — 전체 기간. 양끝이 열려 있으면 All 프리셋이 눌리고 트리거는 All time이다 */
export const Default = {};

/** 이번 달 — 프리셋이 계산한 값이 트리거 문구에 그대로 보인다 */
export const ThisMonth = {
  args: { value: { from: D(2026, 8, 1), to: D(2026, 8, 20) } },
};

/**
 * 직접 고른 기간 — 어떤 프리셋과도 맞지 않으면 프리셋 선택이 풀린다.
 * 맞지 않는 프리셋을 눌린 채로 두면 화면이 거짓말을 한다.
 */
export const CustomRange = {
  args: { value: { from: D(2026, 6, 20), to: D(2026, 7, 14) } },
};

/** 한쪽 끝만 — 시작일만 있으면 그 뒤 전부가 대상이라 From으로 읽는다 */
export const OpenEnded = {
  args: { value: { from: D(2026, 7, 1), to: null } },
};

/**
 * 프리셋은 기준일에서 계산된다.
 *
 * This week는 일요일 시작이다(매장이 미국에 있고 화면 전체가 en-US 표기를 쓴다).
 * 2026-08-20은 목요일이므로 8/16(일)~8/20이 나와야 한다.
 */
export const PresetEmitsRange = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'This week' }));
    const week = args.onChange.mock.calls.at(-1)[0];
    await expect(week.from.getDate()).toBe(16);
    await expect(week.to.getDate()).toBe(20);

    await userEvent.click(canvas.getByRole('button', { name: 'This month' }));
    const month = args.onChange.mock.calls.at(-1)[0];
    await expect(month.from.getDate()).toBe(1);
    await expect(month.from.getMonth()).toBe(7);

    await userEvent.click(canvas.getByRole('button', { name: 'Last 30 days' }));
    const last30 = args.onChange.mock.calls.at(-1)[0];
    await expect(last30.from.getMonth()).toBe(6); // 7월 22일
    await expect(last30.from.getDate()).toBe(22);
  },
};

/**
 * 기간을 한 번 열어 두 클릭으로 고른다.
 *
 * 입력 두 칸이던 시절에는 시작을 고르고 닫고 끝을 다시 열어야 했다
 * (2026-08-28 사장님 지적). 이제 달력 하나에서 1일 → 10일을 연속으로 찍으면
 * 그때 onChange가 한 번 불리고 팝오버가 닫힌다.
 */
export const PicksRangeInOneOpen = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /Select date range/ }));
    // 팝오버는 포털로 뜨므로 canvas 밖(screen)에서 찾는다
    await userEvent.click(await screen.findByRole('button', { name: 'August 1, 2026' }));
    // 첫 클릭은 시작점만 잡는다 — 아직 아무것도 내보내지 않는다
    await expect(args.onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'August 10, 2026' }));
    const emitted = args.onChange.mock.calls.at(-1)[0];
    await expect(emitted.from.getDate()).toBe(1);
    await expect(emitted.to.getDate()).toBe(10);

    // 범위가 확정됐으니 팝오버는 닫힌다
    await waitFor(async () => {
      await expect(screen.queryByRole('button', { name: 'August 10, 2026' })).toBeNull();
    });
  },
};

/**
 * 끝을 시작보다 앞에 찍어도 막지 않는다 — 순서만 맞춰 내보낸다.
 * 순서를 강제하면 "20일부터 거꾸로 골라야지"라는 손을 틀리게 만든다.
 */
export const KeepsRangeOrdered = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /Select date range/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'August 20, 2026' }));
    await userEvent.click(screen.getByRole('button', { name: 'August 14, 2026' }));

    const emitted = args.onChange.mock.calls.at(-1)[0];
    await expect(emitted.from.getDate()).toBe(14);
    await expect(emitted.to.getDate()).toBe(20);
  },
};

/**
 * 프리셋 그룹과 달력 트리거는 같은 컨트롤 문법(radius 6px · 높이 36px)이다.
 *
 * 테마가 flat(shape.borderRadius 0)이라 오버라이드를 빼먹으면 그 컨트롤만
 * 완전 각짐으로 렌더돼 한 줄의 컨트롤 중 혼자 튄다(issue11, 2026-08-28).
 * 모서리는 그룹이 아니라 양끝 버튼이 실제로 그리므로 버튼의 계산값을 실측한다.
 */
export const MatchesControlSurface = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole('button', { name: 'All' });
    const last = canvas.getByRole('button', { name: 'Last 30 days' });
    const trigger = canvas.getByRole('button', { name: /Select date range/ });

    await expect(getComputedStyle(first).borderTopLeftRadius).toBe('6px');
    await expect(getComputedStyle(first).borderBottomLeftRadius).toBe('6px');
    await expect(getComputedStyle(last).borderTopRightRadius).toBe('6px');
    await expect(getComputedStyle(last).borderBottomRightRadius).toBe('6px');
    await expect(getComputedStyle(trigger).borderTopLeftRadius).toBe('6px');
    // 한 줄에 놓이는 컨트롤은 높이도 같아야 한다 — 트리거(36px)와 실측 비교
    await expect(first.getBoundingClientRect().height).toBe(trigger.getBoundingClientRect().height);
  },
};
