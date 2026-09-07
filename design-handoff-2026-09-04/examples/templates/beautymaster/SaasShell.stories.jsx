import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import SaasShell from './SaasShell';

/** 셸 자체를 보여주기 위한 최소 본문 — 실제 뷰 대신 자리만 채운다 */
function BodyStub() {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        본문 영역 — 사이드바를 펼쳐도 이 영역의 폭·위치는 변하지 않는다
      </Typography>
    </Box>
  );
}

export default {
  title: 'BeautyMaster/Page/SaasShell',
  component: SaasShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    activeNav: {
      control: 'radio',
      options: ['operations', 'analytics', 'workflow'],
      description: '활성 네비 키',
    },
    lastSyncedAt: { control: 'date', description: '마지막 동기화 시각 — 사이드바 하단에 펼침 시 표시' },
    isSyncing: { control: 'boolean', description: '시트 조회 진행 중 — 캡션이 "Syncing…"으로 바뀌고 Refresh 아이콘이 회전한다' },
    sheetUrl: { control: 'text', description: 'Google Sheet 원본 링크. 비면 해당 줄을 숨긴다' },
    onNavigate: { action: 'navigated', description: '네비 항목 클릭 핸들러 (key) => void' },
    onRefresh: { action: 'refreshed', description: 'Refresh 클릭 핸들러' },
    onOpenSettings: { action: 'settingsOpened', description: 'Settings 클릭 핸들러' },
    children: { control: false, description: '본문 뷰' },
    sx: { control: 'object', description: '루트 Box에 적용할 MUI sx 오버라이드' },
  },
  args: {
    // action argType은 스파이가 아니라서 play에서 호출을 단언할 수 없다 — fn()으로 준다
    onNavigate: fn(),
    onRefresh: fn(),
    onOpenSettings: fn(),
    activeNav: 'operations',
    lastSyncedAt: new Date('2026-07-27T15:39:00'),
    isSyncing: false,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/EXAMPLE/edit',
    children: <BodyStub />,
  },
  decorators: [
    Story => (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </Box>
    ),
  ],
};

/**
 * 기본 — 접힌 아이콘 레일(56px). 라벨은 숨고 아이콘만 보인다.
 * 레일에 마우스를 올리면 248px로 펼쳐진다(직접 hover해서 확인).
 */
export const Collapsed = {};

/**
 * 펼침 — 라벨이 나타나고, 펼침이 본문 위 오버레이라 본문 폭·위치는 그대로다.
 *
 * 확장은 `&:hover, &:focus-within` 한 규칙으로 걸려 있는데, CSS `:hover`는
 * 실제 포인터 위치로만 발동해 합성 이벤트로는 재현되지 않는다. 그래서 자동 검증은
 * 같은 규칙의 `:focus-within` 쪽(키보드 진입)으로 한다 — 펼침 결과는 동일하다.
 */
export const Expanded = {
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('nav');
    const main = canvasElement.querySelector('main');
    const collapsedWidth = nav.getBoundingClientRect().width;
    const mainBefore = main.getBoundingClientRect();

    nav.querySelector('button').focus();

    await waitFor(async () => {
      await expect(nav.getBoundingClientRect().width).toBeGreaterThan(collapsedWidth);
    });

    // 본문은 밀리지 않아야 한다 — 오버레이 방식의 핵심 조건
    const mainAfter = main.getBoundingClientRect();
    await expect(Math.round(mainAfter.x)).toBe(Math.round(mainBefore.x));
    await expect(Math.round(mainAfter.width)).toBe(Math.round(mainBefore.width));

    const canvas = within(canvasElement);
    await expect(canvas.getByText('Operations')).toBeVisible();
  },
};

/**
 * 접힘/펼침은 하나의 헤더가 폭과 제목 표시만 바꾸는 것이다.
 *
 * 로고는 두 상태에서 같은 자리에 그대로 있고, 그 아래 네비 아이콘의 x·y도 정확히
 * 같아야 한다. 헤더가 커지거나 로고가 접힘 전용으로 따로 렌더되면 아이콘이 밀리는데,
 * 그러면 hover할 때 사이드바 구조 자체가 바뀌는 것처럼 보인다.
 *
 * (CSS :hover는 합성 이벤트로 못 켜므로 같은 규칙 블록에 걸린 :focus-within으로 편다.)
 */
export const HeaderStaysPut = {
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('nav');
    const box = el => { const r = el.getBoundingClientRect(); return `${r.x.toFixed(1)},${r.y.toFixed(1)}`; };
    const snap = () => ({
      logo: box(nav.querySelector('img')),
      icons: [...nav.querySelectorAll('svg')].slice(0, 3).map(box).join(' | '),
    });

    const logo = nav.querySelector('img');
    await expect(logo).toBeVisible();             // 접힘 상태에서도 상단이 비지 않는다
    const before = snap();

    nav.querySelector('button').focus();
    await waitFor(async () => {
      await expect(nav.getBoundingClientRect().width).toBeGreaterThan(200);
    });

    const after = snap();
    await expect(after.logo).toBe(before.logo);
    await expect(after.icons).toBe(before.icons);

    // 제목은 펼쳤을 때만 보이고, 네비 라벨과 같은 x에서 시작한다
    const t = [...nav.querySelectorAll('.saas-nav-label')].find(e => e.textContent.startsWith('Influencer'));
    // opacity는 150ms 페이드라 폭 전환이 끝나도 아직 오르는 중일 수 있다
    await waitFor(async () => {
      await expect(getComputedStyle(t).opacity).toBe('1');
    });
    await expect(t.scrollWidth).toBeLessThanOrEqual(t.clientWidth + 1);   // 잘리지 않는다
    const labelX = [...nav.querySelectorAll('.saas-nav-label')]
      .find(e => e.textContent === 'Operations').getBoundingClientRect().x;
    await expect(Math.round(t.getBoundingClientRect().x)).toBe(Math.round(labelX));
  },
};

/** 네비 항목 클릭 — onNavigate로 키가 올라간다 */
export const NavigateByClick = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    // 라벨은 Report지만 올라가는 키는 analytics다(내부 식별자는 그대로)
    await userEvent.click(canvas.getByText('Report'));
    await expect(args.onNavigate).toHaveBeenCalledWith('analytics');
  },
};

/** 시트 링크가 없으면 Open Google Sheet 줄을 숨긴다 */
export const NoSheetUrl = {
  args: { sheetUrl: '' },
};

/** 아직 한 번도 동기화되지 않은 상태 */
export const NotSynced = {
  args: { lastSyncedAt: null },
};

/** Report(analytics) 활성 */
export const AnalyticsActive = {
  args: { activeNav: 'analytics' },
};

/**
 * 동기화 중 — Refresh를 눌렀을 때의 상태.
 * 하단 캡션이 "Last synced …" 대신 "Syncing…"이 되고, Refresh 아이콘이 회전하며
 * 버튼이 비활성화된다. 이 표시가 없으면 눌렸는지 알 수 없다
 * (목록이 이미 있으면 스켈레톤도 뜨지 않으므로).
 * 라벨은 "Refresh" 그대로 둔다 — 캡션과 같은 문구를 두 줄 겹쳐 쓰지 않기 위해.
 */
export const Syncing = {
  args: { isSyncing: true },
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('nav');
    nav.querySelector('button').focus();

    await waitFor(async () => {
      const caption = nav.querySelector('.saas-nav-sync');
      await expect(caption).toHaveTextContent('Syncing…');
    });

    const refresh = [...nav.querySelectorAll('button')].find(b => /Refresh/.test(b.textContent));
    await expect(refresh).toBeDisabled();
  },
};

/**
 * 사이드바는 모든 폭에서 보인다.
 *
 * 예전에는 md 미만에서 display:none이었다. 뷰 전환 수단이 이것뿐이라 폰에서는
 * Operations에 갇혀 Analytics·Workflow·Settings·Refresh에 전혀 닿을 수 없었다.
 *
 * 펼침은 마우스가 있는 기기에서만 한다 — 터치에서는 탭한 뒤 :hover와
 * :focus-within이 남아 레일이 펼쳐진 채 고정되고, 390px 화면에서 264px면
 * 화면의 68%를 가린다. (hover: hover) 미디어 쿼리는 이 러너에서 흉내낼 수
 * 없어서, 터치 동작은 실제 터치 뷰포트로 확인했다 — 여기서는 "숨기지 않는다"와
 * "여섯 컨트롤이 모두 있다"를 지킨다.
 */
export const NavIsReachableAtEveryWidth = {
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('nav');
    await expect(nav).toBeTruthy();
    await expect(getComputedStyle(nav).display).not.toBe('none');

    // 뷰 3개 + 유틸리티 3개가 모두 조작 가능해야 한다
    const labels = [...nav.querySelectorAll('button, a')]
      .map(e => e.textContent.trim())
      .filter(Boolean);
    for (const want of ['Operations', 'Report', 'Workflow', 'Refresh', 'Open Google Sheet', 'Settings']) {
      await expect(labels).toContain(want);
    }

    // 흐름에 자리를 차지하는 spacer도 함께 살아 있어야 본문이 레일 아래로 숨지 않는다
    const spacer = canvasElement.querySelector('[aria-hidden]');
    await expect(spacer).toBeTruthy();
    await expect(getComputedStyle(spacer).display).not.toBe('none');
  },
};
