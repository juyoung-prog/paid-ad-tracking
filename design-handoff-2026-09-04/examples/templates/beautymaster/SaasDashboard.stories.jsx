import Box from '@mui/material/Box';
import { expect } from 'storybook/test';
import SaasDashboard from './SaasDashboard';
import { MOCK_INFLUENCERS } from '../../../pages/beautymaster/BeautymasterDashboard';

const LAST_SYNCED_AT = new Date('2026-07-27T09:56:00');

export default {
  title: 'BeautyMaster/Page/SaasDashboard',
  component: SaasDashboard,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    influencers: { control: 'object', description: '전체 인플루언서 목록 (Influencer[] typedef)' },
    inviteCounts: { control: 'object', description: '"Number" 탭 초대 인원 데이터 (store→tier→count)' },
    lastSyncedAt: { control: 'date', description: '마지막 시트 동기화 시각' },
    defaultView: {
      control: 'radio',
      options: ['operations', 'analytics', 'workflow'],
      description: '최초 활성 뷰',
    },
    selectedId: { control: 'text', description: '현재 선택된 인플루언서 ID' },
    isLoading: { control: 'boolean', description: '최초 로딩 여부 (목록이 비었을 때만 스켈레톤)' },
    isSyncing: { control: 'boolean', description: '폴링/새로고침 진행 중 — 사이드바 하단 Refresh 표시에 반영' },
    error: { control: false, description: '조회 실패 에러 — 상단 배너로 표시' },
    onSelect: { action: 'selected', description: '인플루언서 행 클릭 핸들러' },
    onRefresh: { action: 'refreshed', description: '헤더 새로고침 핸들러' },
    onOpenSettings: { action: 'settings', description: '헤더 설정 아이콘 클릭 핸들러' },
    onRetry: { action: 'retried', description: '에러 배너 Retry 핸들러' },
    sx: { control: 'object', description: '루트 Box에 적용할 MUI sx 오버라이드' },
    sheetUrl: { control: 'text', description: 'Google Sheet 원본 링크 (헤더 아이콘 + Operations의 Record performance 큐 안내)' },
    defaultStore: { control: 'text', description: '최초 선택 스토어 (\'all\'이면 전체). uncontrolled일 때만 쓰임' },
    selectedStore: { control: 'text', description: '선택된 스토어. 주면 controlled, 안 주면 내부 상태' },
    onStoreChange: { action: 'storechange', description: '스토어 변경 핸들러 (store) => void' },
    storeDocs: { control: 'object', description: 'Workflow 뷰의 store별 문서 링크 맵' },
    influencerTrackingListUrl: { control: 'text', description: 'Workflow 뷰의 스토어 무관 고정 링크' },
  },
  decorators: [
    Story => (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </Box>
    ),
  ],
};

/** Operations — Visit schedule 레일과 목록이 한 화면. 사이드바로 다른 뷰 전환 */
export const Default = {
  args: {
    influencers: MOCK_INFLUENCERS,
    lastSyncedAt: LAST_SYNCED_AT,
    defaultView: 'operations',
  },
};

/** Report(analytics 뷰) — 전환 KPI + 퍼널 + By store/tier 테이블 */
export const Analytics = {
  args: {
    ...Default.args,
    // 시트의 Number 탭 구조 그대로 store → tier → category 3단계.
    // 2단계로 두면 합계가 0이 되어 Responded 단계가 통째로 사라진다.
    inviteCounts: {
      Duluth: {
        tier1: { general: 40, specific: 6, kbeauty: 9 },
        tier2: { general: 25, specific: 4, kbeauty: 5 },
      },
      Atlanta: {
        tier1: { general: 30, specific: 3, kbeauty: 4 },
        tier2: { general: 20, specific: 2, kbeauty: 3 },
      },
    },
    defaultView: 'analytics',
  },
};

/** Workflow — 7단계 참조 문서 */
export const Workflow = {
  args: {
    ...Default.args,
    defaultView: 'workflow',
  },
};

/** 빈 상태 — 시트는 연결됐지만 아직 행이 없을 때 */
export const Empty = {
  args: {
    influencers: [],
    lastSyncedAt: null,
    defaultView: 'operations',
  },
};

/** 최초 로딩 — 데이터가 아직 없을 때만 스켈레톤. 폴링 중에는 직전 목록을 유지한다 */
export const Loading = {
  args: {
    influencers: [],
    lastSyncedAt: null,
    defaultView: 'operations',
    isLoading: true,
  },
};

/** 조회 실패 — 목록을 지우지 않고 상단 배너로만 알리고 Retry를 제공한다 */
export const LoadError = {
  args: {
    ...Default.args,
    error: new Error('Google Sheets returned 403 (check sharing settings)'),
  },
};

/** 폴링 진행 중 — 목록은 그대로 두고 사이드바 Refresh만 진행 상태로 바뀐다 */
export const Syncing = {
  args: { ...Default.args, isSyncing: true },
};

/**
 * 셸 안의 모든 글자가 한 서체로 나와야 한다.
 *
 * MUI의 여러 컴포넌트(Avatar, ToggleButton, AccordionSummary…)는 각자 fontFamily를
 * 들고 있고, 폼 요소(button/input)는 아예 상속을 안 해 UA 기본 Arial이 나온다.
 * 실제로 Workflow의 Accordion 안 글자가 Arial, Operations의 아바타가 Pretendard로
 * 나오고 있었다 — 눈으로는 잘 안 보이지만 시스템은 갈라진 상태였다.
 *
 * 클래스를 나열해 막는 방식이라 새 컴포넌트가 들어오면 다시 뚫린다. 이 테스트가
 * 그때 잡는다.
 */
export const SingleTypeface = {
  args: { ...Default.args },
  play: async ({ canvasElement }) => {
    const seen = new Map();
    for (const el of canvasElement.querySelectorAll('*')) {
      if (el.children.length || !el.textContent.trim()) continue;
      const family = getComputedStyle(el).fontFamily.split(',')[0].replace(/"/g, '').trim();
      if (!seen.has(family)) seen.set(family, `<${el.tagName}> "${el.textContent.trim().slice(0, 24)}"`);
    }
    const families = [...seen.keys()];
    await expect(families.length).toBeGreaterThan(0);
    // 실패하면 어느 요소가 튀는지 메시지에 남는다
    await expect(JSON.stringify([...seen])).toBe(JSON.stringify([[families[0], seen.get(families[0])]]));
    await expect(families[0]).toBe('Inter Variable');
  },
};

/**
 * 셸까지 포함해 액센트가 하나인지 본다.
 *
 * Operations 쪽 AccentBlueIsOneValue는 뷰만 렌더해서 사이드바가 범위 밖이다.
 * 내비 활성 배경은 예전에 alpha(primary.main, 0.08)이라 순수 파랑이었고,
 * 같은 화면의 탭 밑줄(#0000B2)과 값이 갈렸다. 조립된 화면에서 다시 확인한다.
 */
export const AccentBlueIsOneValueAcrossShell = {
  args: { ...Default.args },
  play: async ({ canvasElement }) => {
    const isBlue = c => {
      const m = (c.match(/[\d.]+/g) || []).map(Number);
      return m.length >= 3 && m[2] > 100 && m[2] > m[0] + 60 && m[2] > m[1] + 60;
    };

    const nav = canvasElement.querySelector('nav [aria-current="page"]');
    await expect(nav).toBeTruthy();
    // 활성 내비는 액센트 틴트 + 액센트 글자
    await expect(getComputedStyle(nav).backgroundColor).toMatch(/rgba\(0, 0, 178, 0\.\d+\)/);
    await expect(getComputedStyle(nav).color).toBe('rgb(0, 0, 178)');

    const bases = new Set();
    for (const el of canvasElement.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      for (const prop of ['color', 'backgroundColor', 'borderColor', 'borderBottomColor', 'borderLeftColor']) {
        if (isBlue(cs[prop])) bases.add((cs[prop].match(/[\d.]+/g) || []).slice(0, 3).join(','));
      }
    }
    await expect([...bases]).toEqual(['0,0,178']);
  },
};
