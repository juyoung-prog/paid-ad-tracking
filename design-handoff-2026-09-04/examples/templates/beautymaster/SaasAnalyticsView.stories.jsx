import { useState } from 'react';
import Box from '@mui/material/Box';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import SaasAnalyticsView from './SaasAnalyticsView';
import { SAAS_FONT } from './SaasShell';
import { MOCK_INFLUENCERS } from '../../../pages/beautymaster/BeautymasterDashboard';
import { ALL_STORES, deriveStores } from '../../../data/beautymaster/schema.js';

const STORES = deriveStores(MOCK_INFLUENCERS);


/* 시트의 Number 탭 구조 그대로 store → tier → category 3단계.
   2단계로 두면 sumInviteCountsTotal이 0을 내고 Responded 단계가 통째로 사라진다. */
const INVITE_COUNTS = {
  G10: {
    tier1: { general: 40, specific: 6, kbeauty: 9 },
    tier2: { general: 25, specific: 4, kbeauty: 5 },
  },
  Atlanta: {
    tier1: { general: 30, specific: 3, kbeauty: 4 },
    tier2: { general: 20, specific: 2, kbeauty: 3 },
  },
};

export default {
  title: 'BeautyMaster/Section/SaasAnalyticsView',
  component: SaasAnalyticsView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    influencers: { control: 'object', description: '전체 인플루언서 목록' },
    inviteCounts: { control: 'object', description: '초대 인원 (store→tier→category→count). 선택된 스토어로 함께 좁혀진다' },
    stores: { control: 'object', description: '스토어 선택 옵션. 없으면 influencers에서 파생' },
    selectedStore: { control: 'select', options: [ALL_STORES, ...STORES], description: '선택된 스토어 — 세 뷰가 공유' },
    onStoreChange: { action: 'storeChanged', description: '스토어 변경 핸들러' },
    onSelect: { action: 'selected', description: 'Performance 순위 행 클릭 핸들러 (influencer) => void — 페이지가 Drawer를 연다' },
    sheetUrl: { control: 'text', description: 'Google Sheet 원본 링크 — Performance 첫 사용 안내(Opinion 전무 상태)의 Open sheet 링크' },
    programs: { control: 'object', description: 'Grand Opening 프로그램 목록 — 2개 이상이면 결산 블록에 매장 선택 칩이 생긴다' },
  },
  args: {
    influencers: MOCK_INFLUENCERS,
    stores: STORES,
    selectedStore: ALL_STORES,
    onStoreChange: fn(),
  },
  decorators: [
    Story => (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: SAAS_FONT }}>
        <Story />
      </Box>
    ),
  ],
};

/** 기본 — Campaign summary → Conversion funnel → Breakdown → Performance → Store */
export const Default = {};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_LABEL_RE = /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/;

/**
 * 열린 달력을 목표 연·월까지 넘긴다 — 첫 화면 달이 실제 오늘(또는 이미 고른 값)에
 * 따라 달라서 클릭 수를 하드코딩할 수 없다. 헤더를 읽어 방향을 정한다.
 */
const gotoCalendarMonth = async (year, monthIdx) => {
  for (let i = 0; i < 36; i++) {
    const [monthName, y] = screen.getByText(MONTH_LABEL_RE).textContent.split(' ');
    const current = Number(y) * 12 + MONTH_NAMES.indexOf(monthName);
    const target = year * 12 + monthIdx;
    if (current === target) return;
    await userEvent.click(screen.getByRole('button', { name: current > target ? 'Previous month' : 'Next month' }));
  }
  throw new Error('calendar month not reached');
};

/**
 * 기간을 걸면 리포트 전체가 기간 코호트(방문일 기준)로 다시 계산된다.
 *
 * mock 방문일은 6/20·6/28 + 7월 7건 — 7/1~7/14를 고르면 코호트가 7명이 된다.
 * 초대 인원(Number 탭)에는 날짜가 없으므로 기간이 걸리는 동안 퍼널에서 빠지고
 * 첫 줄이 Invited → Tracked로 바뀐다 — 기간 코호트 위에 캠페인 전체 초대 수를
 * 얹으면 "% of invited"가 거짓말이 되기 때문이다.
 * 방문이 없는 기간은 데이터 없음과 구분해 말하고, All 프리셋으로 바로 돌아온다.
 */
export const PeriodScopesReport = {
  args: { inviteCounts: INVITE_COUNTS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 기간 전 — 초대 데이터가 있으니 퍼널 첫 줄은 Invited다
    const labelOf = key => canvasElement
      .querySelector(`[data-funnel-step="${key}"] [data-funnel-label]`);
    await expect(labelOf('invited').textContent).toBe('Invited');

    await userEvent.click(canvas.getByRole('button', { name: /Select date range/ }));
    await gotoCalendarMonth(2026, 6);
    await userEvent.click(screen.getByRole('button', { name: 'July 1, 2026' }));
    await userEvent.click(screen.getByRole('button', { name: 'July 14, 2026' }));

    await waitFor(async () => {
      // 코호트 7명 — Agreement 카드의 모수가 따라온다
      await expect(canvasElement.querySelector('[data-summary-kpis]').textContent).toContain('of 7');
      // 초대가 빠져 첫 줄이 Tracked로, 값은 기간 내 추적 수로
      await expect(labelOf('invited').textContent).toBe('Tracked');
      await expect(canvasElement
        .querySelector('[data-funnel-step="invited"] [data-funnel-value]').textContent).toBe('7');
    });

    // 방문이 없는 기간(7/20~7/25) — 데이터 없음과 구분되는 빈 상태
    await userEvent.click(canvas.getByRole('button', { name: /Select date range/ }));
    await gotoCalendarMonth(2026, 6);
    await userEvent.click(screen.getByRole('button', { name: 'July 20, 2026' }));
    await userEvent.click(screen.getByRole('button', { name: 'July 25, 2026' }));
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-report-period-empty]')).toBeTruthy();
    });

    // All 프리셋으로 복귀 — 리포트가 돌아오고 Invited도 되살아난다
    await userEvent.click(canvas.getByRole('button', { name: 'All' }));
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-summary-kpis]')).toBeTruthy();
      await expect(labelOf('invited').textContent).toBe('Invited');
    });
  },
};

/**
 * 방문일 없는 행은 어떤 기간에도 들 수 없다 — 조용히 빼면 All과 기간의 차이가
 * 어디서 오는지 알 수 없으므로, 기간이 걸려 있는 동안 그 수를 화면이 직접 밝힌다.
 */
export const UndatedRowsAreCalledOut = {
  args: {
    influencers: [
      { ...MOCK_INFLUENCERS[0], scheduledTime: null, hasScheduledTimeOfDay: false },
      ...MOCK_INFLUENCERS.slice(1),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvasElement.querySelector('[data-report-range-note]')).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: /Select date range/ }));
    await gotoCalendarMonth(2026, 6);
    await userEvent.click(screen.getByRole('button', { name: 'July 1, 2026' }));
    await userEvent.click(screen.getByRole('button', { name: 'July 31, 2026' }));

    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-report-range-note]').textContent)
        .toBe('1 with no visit date is outside any period — shown only in All');
    });
  },
};

/** 초대 인원 연결 — 퍼널에 Invited/Responded 단계가 반영된다 */
export const WithInviteCounts = {
  args: { inviteCounts: INVITE_COUNTS },
};

/**
 * 퍼널 코호트 필터 — 플랫폼/티어/카테고리 칩은 퍼널 카드에만 적용된다.
 *
 * 정직성 규칙이 축마다 다르다: Number 탭이 tier × category 축만 갖고 있어서
 * 티어·카테고리 필터는 Invited까지 같이 좁혀지고, 플랫폼 필터는 초대를 뺀 채
 * 첫 줄이 Tracked로 바뀐다(기간 필터가 이미 쓰는 규칙). Summary 카드는
 * 필터와 무관하게 페이지 전체 기준을 유지한다.
 */
export const FunnelCohortFilters = {
  args: { inviteCounts: INVITE_COUNTS },
  play: async ({ canvasElement }) => {
    const stepOf = (key, part) => canvasElement
      .querySelector(`[data-funnel-step="${key}"] [data-funnel-${part}]`);
    const chip = selector => canvasElement.querySelector(selector);

    // 필터 전 — 초대 데이터가 있으니 첫 줄은 Invited, 값은 전 티어 합
    const invitedTotal = Object.values(INVITE_COUNTS)
      .flatMap(tiers => Object.values(tiers))
      .flatMap(cats => Object.values(cats))
      .reduce((s, n) => s + n, 0);
    await expect(stepOf('invited', 'label').textContent).toBe('Invited');
    await expect(stepOf('invited', 'value').textContent).toBe(String(invitedTotal));

    // Tier 1 — Invited가 tier1 초대 합으로, Responded가 tier1 추적 수로 좁혀진다
    const tier1Invited = Object.values(INVITE_COUNTS)
      .flatMap(tiers => Object.values(tiers.tier1 || {}))
      .reduce((s, n) => s + n, 0);
    const tier1Tracked = MOCK_INFLUENCERS.filter(i => i.tier === 'tier1').length;
    await userEvent.click(chip('[data-funnel-tier="tier1"]'));
    await waitFor(async () => {
      await expect(stepOf('invited', 'label').textContent).toBe('Invited');
      await expect(stepOf('invited', 'value').textContent).toBe(String(tier1Invited));
      await expect(stepOf('responded', 'value').textContent).toBe(String(tier1Tracked));
    });

    // Summary 카드는 필터를 따라가지 않는다 — 모수가 페이지 전체 그대로
    await expect(canvasElement.querySelector('[data-summary-kpis]').textContent)
      .toContain(`of ${MOCK_INFLUENCERS.length}`);

    // + TikTok — 초대는 플랫폼별 기록이 없으므로 첫 줄이 Tracked(코호트 수)로
    const tier1Tiktok = MOCK_INFLUENCERS
      .filter(i => i.tier === 'tier1' && i.platform.toLowerCase().includes('tiktok')).length;
    await userEvent.click(chip('[data-funnel-platform="TikTok"]'));
    await waitFor(async () => {
      await expect(stepOf('invited', 'label').textContent).toBe('Tracked');
      await expect(stepOf('invited', 'value').textContent).toBe(String(tier1Tiktok));
      await expect(canvasElement.querySelector('[data-funnel-platform-note]')).toBeTruthy();
    });

    // 플랫폼을 All로 되돌리면 Invited가 되살아난다 — 티어 코호트는 유지
    await userEvent.click(chip('[data-funnel-platform="all"]'));
    await waitFor(async () => {
      await expect(stepOf('invited', 'label').textContent).toBe('Invited');
      await expect(stepOf('invited', 'value').textContent).toBe(String(tier1Invited));
    });
  },
};

/**
 * 스토어 한정 — influencers와 inviteCounts를 **함께** 좁힌다.
 * 한쪽만 좁히면 퍼널의 Invited 단계가 목록과 어긋난다.
 */
export const StoreScoped = {
  args: { selectedStore: 'G10', inviteCounts: INVITE_COUNTS },
};

/** 데이터가 없어도 스토어 Select는 남는다 — 다른 스토어로 옮겨갈 수 있어야 하므로 */
export const Empty = {
  args: { influencers: [], stores: STORES },
};

/**
 * Bars와 Table은 같은 배열(buildFunnelRows)에서 나온다.
 *
 * 예전에는 Table이 Breakdown 테이블 스키마를 재사용해 attendRate/uploadRate를
 * 1로 하드코딩했고, 그 결과 모든 행이 100%로 나오면서 라벨도 raw 필드명(creditSent…)이
 * 그대로 노출됐다. 두 뷰가 갈라지지 않는지 토글해서 단계별로 대조한다.
 */
export const BarsAndTableAgree = {
  args: { inviteCounts: INVITE_COUNTS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // DOM 구조 대신 data 속성으로 잡는다 — 구조를 바꿀 때마다 테스트가 조용히 빗나간다
    const readBars = () => Object.fromEntries(
      [...canvasElement.querySelectorAll('[data-funnel-step]')].map(r => [
        r.getAttribute('data-funnel-step'),
        {
          label: r.querySelector('[data-funnel-label]').textContent.trim(),
          value: r.querySelector('[data-funnel-value]').textContent.trim().split(' ')[0],
        },
      ]),
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Bars' }));
    const bars = await waitFor(() => {
      const b = readBars();
      if (Object.keys(b).length === 0) throw new Error('no bars');
      return b;
    });

    await userEvent.click(canvas.getByRole('button', { name: 'Table' }));
    // 첫 <table>이 아니라 퍼널 행으로 앵커한다 — 맨 위에 G10 결산 표가 생겼다
    const table = await waitFor(() => {
      const t = canvasElement.querySelector('tbody tr[data-funnel-step]')?.closest('table');
      if (!t) throw new Error('no funnel table');
      return t;
    });

    // 컬럼은 퍼널 스키마 — Breakdown의 Visit rate / Upload rate가 아니다
    const head = [...table.querySelectorAll('thead th')].map(c => c.textContent.trim());
    await expect(head).toEqual(['Stage', 'Count', '% of invited', '% of previous']);

    const rows = Object.fromEntries(
      [...table.querySelectorAll('tbody tr[data-funnel-step]')].map(r => [
        r.getAttribute('data-funnel-step'),
        {
          label: r.children[0].textContent.replace('not measured', '').trim(),
          value: r.children[1].textContent.trim(),
        },
      ]),
    );

    // 단계 구성 · 라벨 · 값이 완전히 같아야 한다
    await expect(Object.keys(rows)).toEqual(Object.keys(bars));
    await expect(rows).toEqual(bars);

    // 모든 행이 100%로 나오던 회귀를 막는다 — 비율이 실제로 갈라져야 한다
    const ofInvited = [...table.querySelectorAll('tbody tr')].map(r => r.children[2].textContent.trim());
    await expect(new Set(ofInvited).size).toBeGreaterThan(1);

    // raw 필드명이 새어나오지 않는다
    for (const bad of ['creditSent', 'creditUsed', 'attended']) {
      await expect(table.textContent).not.toContain(bad);
    }
  },
};

/**
 * 단일 스토어에서는 Store 브레이크다운을 감춘다 — 행이 하나뿐이라 비교할 게 없다.
 */
/** 오늘 기준 n일 전 — D+14 기록 상태는 시간 파생이라 고정 날짜로는 스토리가 썩는다 */
const daysAgo = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(13, 0, 0, 0);
  return d;
};

const perfInf = (id, name, overrides) => ({
  ...MOCK_INFLUENCERS[0],
  id,
  fullName: name,
  agreement: true, attend: true, collaboShared: true, creditShared: true, creditUsed: true,
  tier: 'tier1', creditType: '$100 Credit',
  uploadDate: daysAgo(20), recordDate: daysAgo(6),
  alertFlags: [],
  views: null, likes: null, shares: null, saves: null, comments: null, reposts: null,
  opinion: null,
  ...overrides,
});

/**
 * Performance 리포트 — 재섭외 결정에 맞춘 산출물.
 *
 * - 순위는 **총 반응 수(Engagements = 질 × 도달)** — ER 정렬은 872뷰 소형 계정을
 *   1위에 앉히고 최대 도달자를 꼴찌권으로 밀었다(2026-08-03 A안 채택). ER은 참고 컬럼.
 * - 지표 6종(views~reposts) 전부 컬럼으로 — 시트에 적은 그대로, 빈 지표는 "—"
 * - 숫자와 사장님 평가가 어긋나는 행(상위인데 DON'T / 하위인데 USE)에 review 배지
 * - 조회수만 없는 기록도 순위에 든다(반응 절대량은 아니까) — ER만 "—"
 * - 행을 누르면 onSelect가 불린다 — 페이지가 Drawer를 열어 상세(기록 시점 포함)를 보여준다
 */
export const PerformanceReportRanksByEngagements = {
  args: {
    onSelect: fn(),
    influencers: [
      // ER 14.0% — 최상위인데 DON'T → review
      perfInf('er-top', 'Ava Torres', { tier: 'tier2', creditType: '$20 Credit_Tier2', views: 10000, likes: 900, shares: 100, saves: 300, comments: 100, reposts: 0, opinion: "DON'T" }),
      // ER 6.5% — 상위 절반 + USE → 정상
      perfInf('er-mid1', 'Bella Kim', { views: 20000, likes: 1000, shares: 50, saves: 150, comments: 100, reposts: 0, opinion: 'USE' }),
      // ER 5.0% — D+28 늦은 기록
      perfInf('er-mid2', 'Cara Lopez', { views: 15000, likes: 600, shares: 30, saves: 60, comments: 60, reposts: 0, opinion: 'MAYBE', uploadDate: daysAgo(30), recordDate: daysAgo(2) }),
      // ER 2.0% — 하위 절반인데 USE → review
      perfInf('er-low', 'Dana Park', { tier: 'tier2', creditType: '$20 Credit_Tier2', views: 8000, likes: 100, shares: 10, saves: 20, comments: 30, reposts: 0, opinion: 'USE' }),
      // 조회수만 없는 기록 — 반응 절대량(500)으로는 순위에 들고 ER만 "—"
      perfInf('er-noviews', 'Emma Cho', { likes: 500 }),
      // 업로드만 되고 아직 기록 전 — 분모(uploads)에만 잡힌다
      perfInf('er-pending', 'Fay Jung', { uploadDate: daysAgo(5), recordDate: null }),
    ],
  },
  play: async ({ args, canvasElement }) => {
    const section = canvasElement.querySelector('[data-perf-section]');
    await expect(section).toBeTruthy();

    // 분모가 제목에 있다 — 기록 5건, 업로드 6건
    await expect(section.textContent).toContain('recorded 5 of 6 uploads');

    // 총 반응 수 내림차순 — 1,400 > 1,300 > 750 > 500(조회수 없음) > 160
    const order = [...section.querySelectorAll('[data-perf-rank-row]')].map(r => r.getAttribute('data-perf-rank-row'));
    await expect(order).toEqual(['er-top', 'er-mid1', 'er-mid2', 'er-noviews', 'er-low']);
    // 순위 번호가 붙는다 — "T2에서 3등인 애" 같은 대화가 가능해진다
    await expect(section.querySelector('[data-perf-rank-row="er-top"] [data-perf-rank]').textContent.trim()).toBe('1');
    // 조회수 없는 기록도 반응 절대량으로 순위에 든다 — ER만 "—"로 남는다
    const noViewsRow = section.querySelector('[data-perf-rank-row="er-noviews"]');
    await expect(noViewsRow.querySelector('[data-perf-engagements]').textContent.trim()).toBe('500');

    // 평가↔숫자 어긋남에만 review 배지
    await expect(section.querySelector('[data-perf-rank-row="er-top"] [data-perf-review]').getAttribute('data-perf-review')).toBe('high-eng-dont');
    await expect(section.querySelector('[data-perf-rank-row="er-low"] [data-perf-review]').getAttribute('data-perf-review')).toBe('low-eng-use');
    await expect(section.querySelector('[data-perf-rank-row="er-mid1"] [data-perf-review]')).toBeNull();

    // 행 클릭 → onSelect(influencer) — 페이지가 이걸 받아 Drawer를 연다
    await userEvent.click(section.querySelector('[data-perf-rank-row="er-top"]'));
    await waitFor(async () => {
      await expect(args.onSelect).toHaveBeenCalled();
    });
    await expect(args.onSelect.mock.calls.at(-1)[0].id).toBe('er-top');

    // 분모(업로드) 대비 기록 수는 계속 제목이 말한다 — er-noviews가 순위에 들어도 5건
    await expect(section.querySelectorAll('[data-perf-rank-row]').length).toBe(5);

  },
};

/**
 * Opinion 추천 + 티어 코호트.
 *
 * - Opinion이 빈 행에만 "→ USE/MAYBE/DON'T" 제안(코호트 engagements 사분위 기반, 회색 제안 톤).
 *   공식은 항상 시트의 Opinion — 대시보드는 쓰지 않는다.
 * - dropped(섭외 포기)는 ER이 좋아도 추천하지 않는다 — 노쇼 이력자를 숫자만 보고
 *   재섭외 추천하면 안 된다.
 * - 티어 칩을 고르면 순위·추천이 그 코호트 안에서 다시 계산된다 — 전체 2등이
 *   T2에서는 1등이다.
 */
const suggInf = (id, name, tier, likes, overrides) => perfInf(id, name, {
  tier,
  creditType: tier === 'tier2' ? '$20 Credit_Tier2' : '$100 Credit',
  views: 10000, likes, shares: 0, saves: 0, comments: 0, reposts: 0,
  ...overrides,
});

export const PerformanceSuggestsOpinionPerTier = {
  args: {
    influencers: [
      suggInf('s1', 'Gia Han', 'tier1', 1300),                                    // 13% — 상위 1/4 → USE 제안
      suggInf('s2', 'Hana Lee', 'tier2', 1200),                                   // 12% — 전체 2등, T2 1등
      suggInf('s3', 'Iris Moon', 'tier1', 1000, { opinion: 'USE' }),              // 값 있으면 제안 없음
      suggInf('s4', 'Jade Suh', 'tier2', 800),                                    // 중간 → MAYBE 제안
      suggInf('s5', 'Kai Rin', 'tier1', 600),                                     // 중간 → MAYBE 제안
      suggInf('s6', 'Lia Seo', 'tier2', 500, { opinion: 'MAYBE' }),
      suggInf('s7', 'Mina Oh', 'tier1', 300),                                     // 하위 1/4 → DON'T 제안
      suggInf('s8', 'Nari Ku', 'tier2', 200, { contactStatus: 'dropped' }),       // dropped — 제안 금지
    ],
  },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-perf-section]');
    const suggestedOf = id => section.querySelector(`[data-perf-rank-row="${id}"] [data-perf-suggested]`)?.getAttribute('data-perf-suggested') ?? null;
    const rankOf = id => section.querySelector(`[data-perf-rank-row="${id}"] [data-perf-rank]`)?.textContent.trim();

    // 사분위별 제안 — 상위 USE / 중간 MAYBE / 하위 DON'T
    await expect(suggestedOf('s1')).toBe('USE');
    await expect(suggestedOf('s5')).toBe('MAYBE');
    await expect(suggestedOf('s7')).toBe("DON'T");
    // 값이 있는 행과 dropped 행에는 제안이 없다
    await expect(suggestedOf('s3')).toBeNull();
    await expect(suggestedOf('s8')).toBeNull();
    // 제안이 표시 전용임을 밝히는 안내 문장
    await expect(section.textContent).toContain('source of truth');

    // 티어 칩 — T2 코호트로 좁히면 순위가 코호트 안에서 다시 매겨진다
    await expect(rankOf('s2')).toBe('2');
    await userEvent.click(section.querySelector('[data-perf-tier="tier2"]'));
    await waitFor(async () => {
      const order = [...section.querySelectorAll('[data-perf-rank-row]')].map(r => r.getAttribute('data-perf-rank-row'));
      await expect(order).toEqual(['s2', 's4', 's6', 's8']);
    });
    await expect(rankOf('s2')).toBe('1');
    // 코호트(4명, 1/4=1명) 기준으로 제안도 재계산 — s2가 T2의 상위 1/4
    await expect(suggestedOf('s2')).toBe('USE');
    await expect(suggestedOf('s8')).toBeNull();
  },
};

/**
 * 반응 절대량 정렬은 대박 크리에이터를 특례 없이 구한다.
 *
 * ER 정렬 시절에는 60K뷰·반응 1,200건이 ER 2%라는 이유로 꼴찌 + DON'T였고,
 * 그걸 "도달 가드"라는 예외 규칙으로 때웠다. engagements 정렬로 바꾸자
 * 예외 없이 자연스럽게 1위가 된다 — 규칙이 줄었는데 결과가 맞아졌다.
 *
 * Opinion이 하나도 없는 첫 사용 상태에서는 안내가 실행 경로(Open sheet)까지 준다.
 */
export const PerformanceBigReachWinsByEngagements = {
  args: {
    sheetUrl: 'https://docs.google.com/spreadsheets/d/example/edit',
    influencers: [
      suggInf('rg-a', 'Aria Bell', 'tier1', 600, { views: 5000 }),
      suggInf('rg-b', 'Bree Cho', 'tier1', 99, { views: 900 }),
      suggInf('rg-c', 'Cleo Dean', 'tier1', 72, { views: 800 }),
      suggInf('rg-d', 'Demi Eun', 'tier1', 56, { views: 700 }),
      suggInf('rg-e', 'Elle Fox', 'tier1', 42, { views: 600 }),
      suggInf('rg-f', 'Faye Gu', 'tier1', 30, { views: 500 }),
      // 반응 9건 — 하위 사분위, DON'T
      suggInf('rg-g', 'Gwen Ha', 'tier1', 9, { views: 400 }),
      // 반응 1,200건 최다 — ER은 2%로 꼴찌지만 순위는 1위, 제안도 USE
      suggInf('rg-h', 'Hope Lin', 'tier1', 1200, { views: 60000, platform: 'Tiktok' }),
    ],
  },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-perf-section]');
    const suggestedEl = id => section.querySelector(`[data-perf-rank-row="${id}"] [data-perf-suggested]`);

    // 반응 최다(1,200건)가 예외 규칙 없이 1위 + USE — ER 2%는 참고 컬럼으로만 남는다
    const hopeRank = section.querySelector('[data-perf-rank-row="rg-h"] [data-perf-rank]');
    await expect(hopeRank.textContent.trim()).toBe('1');
    await expect(suggestedEl('rg-h').getAttribute('data-perf-suggested')).toBe('USE');
    // 반응 9건은 하위 사분위 — DON'T
    await expect(suggestedEl('rg-g').getAttribute('data-perf-suggested')).toBe("DON'T");

    // 시트 원본 "Tiktok"이 공식 표기로 정규화된다 — 그룹 표와 같은 이름
    const hopeRow = section.querySelector('[data-perf-rank-row="rg-h"]');
    await expect(hopeRow.textContent).toContain('TikTok');
    await expect(hopeRow.textContent.includes('Tiktok')).toBe(false);

    // Opinion이 전무한 첫 사용 상태 — 안내 + 시트로 가는 실행 경로
    await expect(section.textContent).toContain('No opinions recorded yet');
    const link = [...section.querySelectorAll('a')].find(a => a.textContent.includes('Open sheet'));
    await expect(link).toBeTruthy();
    await expect(link.getAttribute('href')).toContain('docs.google.com');
  },
};

/**
 * 100명이어도 다 펼치지 않는다 — 기본은 상위 10명 + View more.
 *
 * 처음에는 Top 10 + Bottom 5 + 중간에 "⋯ N more" 행이었는데, 표가 끊겨 보여서
 * 폐기했다(2026-08-03 사장님 판단: "10명만 보여주고 밑에 view more가 더 깔끔").
 * 버튼이 숨은 인원 수를 말하고, 펼친 뒤에는 View less로 돌아온다.
 */
export const PerformanceListShowsTopTenThenViewMore = {
  args: {
    influencers: Array.from({ length: 20 }, (_, k) => perfInf(`p-${String(k).padStart(2, '0')}`, `Person ${String(k).padStart(2, '0')}`, {
      views: 10000, likes: 2000 - k * 90, shares: 0, saves: 0, comments: 0, reposts: 0, opinion: 'MAYBE',
    })),
  },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-perf-section]');
    const rows = () => [...section.querySelectorAll('[data-perf-rank-row]')];
    const ranks = () => rows().map(r => r.querySelector('[data-perf-rank]').textContent.trim());

    // 기본: 상위 10명만, 순위는 1~10
    await expect(rows().length).toBe(10);
    await expect(ranks()[0]).toBe('1');
    await expect(ranks()[9]).toBe('10');

    // 버튼이 숨은 인원 수를 말한다
    const button = section.querySelector('[data-perf-viewmore]');
    await expect(button).toBeTruthy();
    await expect(button.textContent).toContain('View more (10)');

    // 펼치면 전부, 라벨은 View less로
    await userEvent.click(button);
    await waitFor(async () => {
      await expect(rows().length).toBe(20);
    });
    await expect(section.querySelector('[data-perf-viewmore]').textContent).toContain('View less');
  },
};

/** 기록이 0건이면 표 대신 문장 — 빈 표는 "데이터가 이상하다"로 읽힌다 */
export const PerformanceEmptyStateSpeaks = {
  args: {
    influencers: [perfInf('er-pending', 'Fay Jung', { uploadDate: daysAgo(5), recordDate: null })],
  },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-perf-section]');
    await expect(section.textContent).toContain('recorded 0 of 1 uploads');
    await expect(section.textContent).toContain('No performance records yet');
    await expect(section.querySelector('[data-perf-rank-row]')).toBeNull();
  },
};

/** 방문했는데 콘텐츠가 없는 건을 만든다 — 유예(7일)를 넘긴 미이행 */
const unfulfilledInf = (id, name, tier, daysAgoVisited, overrides) => ({
  ...MOCK_INFLUENCERS[0],
  id,
  fullName: name,
  tier,
  scheduledTime: daysAgo(daysAgoVisited),
  hasScheduledTimeOfDay: true,
  agreement: true, attend: true,
  collaboShared: false, creditShared: false, creditUsed: false,
  uploadDate: null, recordDate: null,
  contactReason: null, contactStatus: null,
  alertFlags: [],
  ...overrides,
});

/**
 * 미이행 손실 — 퍼널의 attended→uploaded 낙차를 금액으로 옮긴 블록.
 *
 * 여기까지 오기 전에는 리포트에 upload rate(비율)뿐이었다. 비율은 "85%면 잘 되고
 * 있네"로 읽히고 금액은 "이거 회수해야겠네"로 읽힌다 — 같은 사실인데 뒤엣것만
 * 행동으로 이어진다. 게다가 90일이 지나면 경보가 꺼져서 Operations 화면만으로는
 * 이 손실의 총량을 알 방법이 아예 없었다(세는 일은 리포트가 맡는다).
 *
 * dropped도 센다 — 포기했다는 건 회수를 단념했다는 뜻이지 지출이 없던 일이 됐다는
 * 뜻이 아니다. 대신 Status 컬럼이 아직 손댈 수 있는 건과 접은 건을 가른다.
 */
export const UnfulfilledCountsTheLoss = {
  args: {
    onSelect: fn(),
    influencers: [
      unfulfilledInf('uf-t1', 'Nora Bell', 'tier1', 20),
      // 90일 초과 — 경보가 꺼진 건. 이게 여기 안 잡히면 구멍이 그대로다
      unfulfilledInf('uf-t1-stale', 'Gone Quiet', 'tier1', 200),
      // 포기한 건도 지출은 이미 나갔다
      unfulfilledInf('uf-t2-dropped', 'Iris Kang', 'tier2', 60, {
        contactReason: 'no-show', contactStatus: 'dropped', lastContactDate: daysAgo(30),
      }),
      // 유예 안 — 아직 미이행이 아니다. 이게 섞이면 금액이 부풀려진다
      unfulfilledInf('uf-grace', 'Too Soon', 'tier1', 2),
      // 업로드까지 끝난 건 — 손실이 아니다
      perfInf('uf-done', 'All Good', { views: 1000, likes: 50 }),
    ],
  },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-unfulfilled-section]');
    await expect(section).toBeTruthy();

    // T1 2건 × $8.58 + T2 1건 × $2.65 = $19.81. 유예 안·업로드 완료는 빠진다.
    // 금액의 정체는 이미 건네준 기프트백이다 — 보상 크레딧은 아직 안 나갔으므로
    // 제목이 "unrecovered credit"처럼 읽히면 안 된다
    await expect(section.textContent).toContain('3 visits with no content — $19.81 in gift bags');
    await expect(section.textContent).toContain('Tier 1 2 × $8.58 = $17.16');
    await expect(section.textContent).toContain('Tier 2 1 × $2.65 = $2.65');

    const ids = [...section.querySelectorAll('[data-unfulfilled-row]')]
      .map(r => r.getAttribute('data-unfulfilled-row'));
    await expect(ids).toEqual(['uf-t1', 'uf-t1-stale', 'uf-t2-dropped']);   // 금액 큰 순, 같으면 최근 순

    // 아직 손댈 수 있는 건과 접은 건을 가른다 — 명단이 행동으로 이어지려면 필요하다.
    // 드롭은 사유까지 — "Dropped"만 있으면 노쇼로 접힌 건지 알 수 없다
    const statusOf = id => section.querySelector(`[data-unfulfilled-row="${id}"] td:last-child`).textContent.trim();
    await expect(statusOf('uf-t1')).toBe('Follow-up open');
    await expect(statusOf('uf-t1-stale')).toBe('Alert stopped (90+ days)');
    await expect(statusOf('uf-t2-dropped')).toBe('Dropped · No upload');
  },
};

/**
 * 쿠폰이 실제로 나갔는지를 행마다 밝힌다.
 *
 * 쿠폰(보상 크레딧)은 콘텐츠를 받은 뒤에 보내는 것이라, 이 표의 사람들은 대개
 * "Not sent"다. 그래서 더 밝혀야 한다 — 그 대개가 아닌 행, 즉 쿠폰까지 나갔는데
 * 콘텐츠가 없는 행이 섞여 있으면 그건 성격이 다른 손실이다.
 *
 * "사용 안 함"과 "아직 안 적음"을 가르는 게 요점이다. 시트의 credit used 칸은 비어
 * 있는 행이 많은데 빈 칸을 "미사용"으로 읽으면 화면이 없는 정보를 지어낸다
 * (퍼널의 funnelMeasured와 같은 규칙).
 */
export const UnfulfilledShowsCouponState = {
  args: {
    influencers: [
      // 평범한 미이행 — 쿠폰은 애초에 안 나갔다
      unfulfilledInf('cp-notsent', 'Never Paid', 'tier1', 30),
      // 쿠폰까지 나갔는데 콘텐츠가 없다 — 기프트백에 더해 크레딧까지 나간 행
      unfulfilledInf('cp-used', 'Took The Coupon', 'tier1', 40, {
        creditShared: true, creditUsed: true, hasCreditUsedValue: true,
      }),
      // 나갔지만 안 썼다 — 회수 여지가 남아 있다
      unfulfilledInf('cp-unused', 'Has It Unused', 'tier2', 50, {
        creditShared: true, creditUsed: false, hasCreditUsedValue: true,
      }),
      // 나갔는데 사용 여부를 아직 안 적었다 — 미사용이 아니라 미측정이다
      unfulfilledInf('cp-unknown', 'Not Recorded', 'tier2', 60, {
        creditShared: true, creditUsed: false, hasCreditUsedValue: false,
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-unfulfilled-section]');
    const couponOf = id => section
      .querySelector(`[data-unfulfilled-row="${id}"] [data-unfulfilled-coupon]`).textContent.trim();

    await expect(couponOf('cp-notsent')).toBe('Not sent');
    await expect(couponOf('cp-used')).toBe('Sent · used');
    await expect(couponOf('cp-unused')).toBe('Sent · unused');
    // 빈 칸을 "미사용"으로 단정하지 않는다
    await expect(couponOf('cp-unknown')).toBe('Sent · not recorded');
    await expect(couponOf('cp-unknown')).not.toBe(couponOf('cp-unused'));
  },
};

/**
 * 손실이 0이면 섹션을 숨기지 않고 그렇다고 말한다.
 *
 * 없는 섹션은 "집계는 하고 있나?"를 남긴다. 손실 0은 이 리포트에서 가장 좋은 소식이라
 * 적을 값어치가 있다.
 */
export const UnfulfilledZeroStateSpeaks = {
  args: {
    influencers: [perfInf('uf-ok', 'All Good', { views: 1000, likes: 50 })],
  },
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-unfulfilled-section]');
    await expect(section.textContent).toContain('No missing content — every visit delivered');
    await expect(section.textContent).toContain('Nothing outstanding in this view');
    await expect(section.querySelector('[data-unfulfilled-row]')).toBeNull();
  },
};

/**
 * Campaign Summary는 모수에서 출발한다.
 *
 * 예전 첫 타일은 "Tracked"였는데, 그 수는 옆의 어느 비율의 밑도 아니었다 —
 * 두 비율이 "of agreement"에서 출발하는데 정작 그 분모가 화면에 없었다.
 * Agreement를 앞에 세우면 세 타일이 한 줄로 이어진다: 동의 N of 전체 →
 * 그중 방문 몇 % → 그중 업로드 몇 %. 표기는 Operations의 KPI 스트립과 같다.
 */
export const SummaryStartsFromAgreement = {
  args: {
    influencers: [
      unfulfilledInf('sm-1', 'Came No Content', 'tier1', 30),
      unfulfilledInf('sm-2', 'Also Came', 'tier1', 40),
      // 동의는 했지만 아직 방문 전 — 모수에는 들어가고 방문 수에는 안 들어간다
      unfulfilledInf('sm-3', 'Not Yet', 'tier2', 1, { attend: false }),
      // 동의 자체가 없다 — 모수 밖이지만 전체(of N)에는 들어간다
      unfulfilledInf('sm-4', 'No Agreement', 'tier2', 10, { agreement: false, attend: false }),
    ],
  },
  play: async ({ canvasElement }) => {
    const kpis = canvasElement.querySelector('[data-summary-kpis]');
    await expect(kpis).toBeTruthy();

    // 4명 추적 중 3명이 동의 → 모수는 3, 전체는 "of 4"로 남는다
    const text = kpis.textContent;
    await expect(text).toContain('Agreement');
    await expect(text).toContain('3');
    await expect(text).toContain('of 4');
    /* "Tracked"는 이 줄에서 사라진다 — 어느 비율의 밑도 아닌 수였다.
       (퍼널 첫 단계는 초대 데이터가 없을 때 여전히 Tracked라, 단언을 이 줄로 좁힌다) */
    await expect(text).not.toContain('Tracked');

    // 방문율의 분모가 앞 타일에 선 값과 같다 — 동의 3명 중 2명 방문 = 67%
    await expect(text).toContain('Visit rate (of agreement)');
    await expect(text).toContain('67%');
  },
};

/**
 * 크레딧 사용은 비율이 아니라 원시 분수로 쓴다.
 *
 * 시트의 Credit Used 칸은 비어 있는 행이 많다(실데이터 발급 114건 중 19건만 기록).
 * 발급 수로 나눠 비율을 내면 미기록이 전부 미사용으로 계산돼 "발급한 크레딧을 아무도
 * 안 쓴다"는 없는 결론이 나온다. "4건 중 1건 확인"은 그 자체로 참이고, 남은 수를
 * 미사용이라고 주장하지도 않는다. 표기·분모 모두 Operations 스트립과 같다.
 */
export const CreditUsedIsARawFraction = {
  args: {
    influencers: [
      // 발급 4건, 그중 사용이 확인된 건 1건
      perfInf('cu-1', 'Used It', { creditShared: true, creditUsed: true, hasCreditUsedValue: true }),
      perfInf('cu-2', 'Did Not Use', { creditShared: true, creditUsed: false, hasCreditUsedValue: true }),
      perfInf('cu-3', 'Blank A', { creditShared: true, creditUsed: false, hasCreditUsedValue: false }),
      perfInf('cu-4', 'Blank B', { creditShared: true, creditUsed: false, hasCreditUsedValue: false }),
    ],
  },
  play: async ({ canvasElement }) => {
    /* 셀 단위로 본다 — 스트립 전체 문자열로 보면 옆 셀의 "100%"가 "0%"를 품는 식으로
       엉뚱하게 걸린다(이 스토리를 처음 썼을 때 실제로 그렇게 실패했다) */
    const kpis = canvasElement.querySelector('[data-summary-kpis]');
    const cell = [...kpis.children].map(c => c.textContent.trim()).find(t => t.startsWith('Credit used'));

    await expect(cell).toBeTruthy();
    // 분모는 발급 수 — 전체(4명)가 아니라 크레딧이 나간 수다
    await expect(cell).toContain('1');
    await expect(cell).toContain('of 4');
    // 비율을 내지 않는다 — 미기록 2건이 미사용으로 계산되는 것을 막는다
    await expect(cell).not.toContain('%');
  },
};

/**
 * 크레딧을 누가 썼는지는 Breakdown 표의 한 컬럼이 답한다.
 *
 * "티어별로 몇 개 썼나", "쓴 사람이 인스타냐 틱톡이냐, 어느 카테고리냐"는 결국
 * 같은 질문을 축만 바꿔 묻는 것이라, 표를 새로 만들지 않고 이미 Platform·Category·Tier
 * 세 축으로 나뉘어 있는 Breakdown에 컬럼 하나를 더한다(Store 표도 같은 컴포넌트라 함께 얻는다).
 *
 * 표기는 KPI 스트립과 같은 원시 분수다 — 비율을 내면 시트의 빈 Credit Used 칸이
 * 전부 미사용으로 계산된다. 발급이 0인 그룹은 나눌 것이 없어 "—".
 */
export const BreakdownShowsCreditUsedPerGroup = {
  args: {
    influencers: [
      // T1 / Instagram / kbeauty — 발급 2, 사용 1
      perfInf('bc-1', 'Ig One', { tier: 'tier1', platform: 'Instagram', category: 'kbeauty', creditShared: true, creditUsed: true, hasCreditUsedValue: true }),
      perfInf('bc-2', 'Ig Two', { tier: 'tier1', platform: 'Instagram', category: 'kbeauty', creditShared: true, creditUsed: false, hasCreditUsedValue: false }),
      // T2 / TikTok / general — 발급 1, 사용 1
      perfInf('bc-3', 'Tt One', { tier: 'tier2', platform: 'TikTok', category: 'general', creditShared: true, creditUsed: true, hasCreditUsedValue: true }),
      // T2 / TikTok / general — 크레딧 미발급. 그룹 분모에는 안 들어간다
      perfInf('bc-4', 'Tt Two', { tier: 'tier2', platform: 'TikTok', category: 'general', creditShared: false, creditUsed: false, hasCreditUsedValue: false }),
    ],
  },
  play: async ({ canvasElement }) => {
    /** 표의 첫 컬럼 헤더로 어느 축인지 고른 뒤, 행 라벨 → Credit used 셀을 읽는다.
        G10 결산 표도 첫 헤더가 "Tier"라 Credit used 셀의 존재로 Breakdown 표만 고른다 */
    const creditOf = (axis, label) => {
      const table = [...canvasElement.querySelectorAll('table')]
        .find(t => t.querySelector('thead th')?.textContent.trim() === axis
          && t.querySelector('[data-breakdown-credit]'));
      const row = [...table.querySelectorAll('tbody tr')]
        .find(r => r.children[0].textContent.trim() === label);
      return row?.querySelector('[data-breakdown-credit]')?.textContent.trim();
    };

    // 티어별 — 사장님 질문 그대로 "T1은 몇 개, T2는 몇 개"
    await expect(creditOf('Tier', 'Tier 1')).toBe('1 of 2');
    await expect(creditOf('Tier', 'Tier 2')).toBe('1 of 1');

    // 그 사람들이 인스타냐 틱톡이냐
    await expect(creditOf('Platform', 'Instagram')).toBe('1 of 2');
    await expect(creditOf('Platform', 'TikTok')).toBe('1 of 1');

    // 어느 카테고리냐
    await expect(creditOf('Category', 'kbeauty')).toBe('1 of 2');
    // 미발급 1명은 분모에서 빠진다 — 발급된 1건만 분모다
    await expect(creditOf('Category', 'general')).toBe('1 of 1');
  },
};

export const SingleStoreHidesStoreTable = {
  args: { selectedStore: STORES[0] },
  play: async ({ canvasElement }) => {
    const headers = [...canvasElement.querySelectorAll('table thead th:first-child')]
      .map(c => c.textContent.trim());
    await expect(headers).not.toContain('Store');
    await expect(headers.length).toBeGreaterThan(0);
  },
};

/**
 * Stage drop-off는 Table의 "% of previous"와 같은 값이어야 한다.
 *
 * 막대는 각 단계에 몇 명 남았는지만 보여줘서 어디서 새는지가 안 보인다.
 * 옆에 붙인 이탈 표가 다른 계산을 쓰면 같은 화면에서 두 숫자가 갈라진다 —
 * 두 뷰를 오가며 대조한다.
 */
export const DropOffMatchesTable = {
  args: { inviteCounts: INVITE_COUNTS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Bars' }));
    const drop = await waitFor(() => {
      const rows = [...canvasElement.querySelectorAll('[data-dropoff-step]')];
      if (rows.length === 0) throw new Error('no drop-off rows');
      return Object.fromEntries(rows.map(r => [
        r.getAttribute('data-dropoff-step'),
        r.children[1].textContent.trim(),
      ]));
    });

    await userEvent.click(canvas.getByRole('button', { name: 'Table' }));
    // 첫 <table>이 아니라 퍼널 행으로 앵커한다 — 맨 위에 G10 결산 표가 생겼다
    const table = await waitFor(() => {
      const t = canvasElement.querySelector('tbody tr[data-funnel-step]')?.closest('table');
      if (!t) throw new Error('no funnel table');
      return t;
    });
    const ofPrevious = Object.fromEntries(
      [...table.querySelectorAll('tbody tr[data-funnel-step]')]
        .map(r => [r.getAttribute('data-funnel-step'), r.children[3].textContent.trim()])
        .filter(([, v]) => v !== '—'),
    );

    // 미측정 구간은 양쪽 모두 수치를 내지 않는다 — 계산된 구간만 대조한다
    const measured = Object.fromEntries(Object.entries(drop).filter(([, v]) => v !== 'not measured'));
    await expect(measured).toEqual(ofPrevious);
    for (const [key, v] of Object.entries(drop)) {
      if (v === 'not measured') await expect(ofPrevious[key]).toBeUndefined();
    }

    // 가장 크게 빠진 구간 하나만 강조된다 — 여러 개면 강조가 아니다
    await userEvent.click(canvas.getByRole('button', { name: 'Bars' }));
    const emphasised = await waitFor(() => {
      const all = [...canvasElement.querySelectorAll('[data-dropoff-delta]')];
      if (all.length === 0) throw new Error('no deltas');
      return all.filter(e => getComputedStyle(e).fontWeight === '600');
    });
    await expect(emphasised.length).toBe(1);
  },
};

/**
 * 미측정 단계는 계산하지 않는다.
 *
 * 시트의 credit used 열이 비어 있으면 creditUsed가 전부 false로 파싱된다.
 * 그걸 0으로 계산하면 "발급분 전량 미사용"이라는 없는 사실이 만들어진다.
 * 값이 하나라도 들어오면(hasCreditUsedValue) 자동으로 정상 계산으로 돌아간다.
 */
export const UnmeasuredStageShowsNoPercent = {
  args: {
    inviteCounts: INVITE_COUNTS,
    // 목업은 hasCreditUsedValue가 전부 false — 아직 아무도 적지 않은 상태
    influencers: MOCK_INFLUENCERS.map(i => ({ ...i, hasCreditUsedValue: false })),
  },
  play: async ({ canvasElement }) => {
    const row = await waitFor(() => {
      const r = canvasElement.querySelector('[data-funnel-step="creditUsed"]');
      if (!r) throw new Error('creditUsed row missing');
      return r;
    });

    // 수와 비율 모두 "—" — 0으로 단정하지 않는다
    await expect(row.querySelector('[data-funnel-value]').textContent.trim()).toBe('—');
    await expect(row.textContent).toContain('not measured');

    // drop-off에서도 0% / -N 같은 수치를 넣지 않는다
    const drop = canvasElement.querySelector('[data-dropoff-step="creditUsed"]');
    await expect(drop).toBeTruthy();
    await expect(drop.textContent).toContain('not measured');
    await expect(drop.querySelector('[data-dropoff-delta]').textContent.trim()).toBe('');
  },
};

/**
 * Bars의 모든 행은 트랙 길이와 숫자 컬럼 위치가 같아야 한다.
 *
 * "not measured" 배지를 같은 flex 행에 조건부로 넣었더니 그 행만 항목이 하나 더
 * 생겨서 트랙(flex:1)이 줄고 숫자가 왼쪽으로 밀렸다. 배지 자리를 항상 잡아둔다.
 */
export const BarRowsShareOneGrid = {
  args: {
    inviteCounts: INVITE_COUNTS,
    influencers: MOCK_INFLUENCERS.map(i => ({ ...i, hasCreditUsedValue: false })),
  },
  play: async ({ canvasElement }) => {
    const rows = await waitFor(() => {
      const r = [...canvasElement.querySelectorAll('[data-funnel-step]')];
      if (r.length < 2) throw new Error('bars not rendered');
      return r;
    });
    const tracks = rows.map(r => Math.round(r.children[1].getBoundingClientRect().width));
    const values = rows.map(r => Math.round(r.querySelector('[data-funnel-value]').getBoundingClientRect().x));
    await expect(new Set(tracks).size).toBe(1);
    await expect(new Set(values).size).toBe(1);
  },
};

/**
 * 표본이 작은 행은 퍼센트 옆에 원시 분수를 적는다.
 * "100%"가 2명 중 2명인지 20명 중 20명인지 구분되지 않으면 오해가 생긴다.
 */
export const SmallSamplesShowRawCounts = {
  args: { inviteCounts: INVITE_COUNTS },
  play: async ({ canvasElement }) => {
    const tables = await waitFor(() => {
      const t = [...canvasElement.querySelectorAll('table')];
      if (t.length === 0) throw new Error('no tables');
      return t;
    });
    let sawSmall = false;
    for (const table of tables) {
      /* Breakdown 계열(Visit rate 컬럼)만 본다 — Performance 표는 컬럼 스키마가 달라서
         "children[1]=Count, children[2]=비율" 가정이 성립하지 않는다 */
      const headers = [...table.querySelectorAll('th')].map(th => th.textContent.trim());
      if (!headers.includes('Visit rate')) continue;
      for (const tr of table.querySelectorAll('tbody tr')) {
        const count = Number(tr.children[1].textContent.trim());
        if (Number.isNaN(count)) continue;
        const visitCell = tr.children[2].textContent.trim();
        if (count > 0 && count < 10) {
          await expect(visitCell).toMatch(/\(\d+\/\d+\)/);
          sawSmall = true;
        } else if (count >= 10) {
          await expect(visitCell).not.toMatch(/\(\d+\/\d+\)/);
        }
      }
    }
    await expect(sawSmall).toBe(true);
  },
};

/**
 * Breakdown은 표가 정확히 3개다 — 빈 칸이 남지 않아야 한다.
 *
 * 2열로 두면 세 번째 표가 혼자 다음 줄로 내려가 옆이 비고,
 * auto-fit으로 두면 넓은 화면에서 트랙이 5개까지 생겨 빈 트랙이 남는다.
 * md부터 3열로 고정한다.
 */
export const BreakdownFillsItsRow = {
  play: async ({ canvasElement }) => {
    const grid = await waitFor(() => {
      const el = [...canvasElement.querySelectorAll('div')]
        .find(d => getComputedStyle(d).display === 'grid' && d.querySelectorAll('table').length === 3);
      if (!el) throw new Error('breakdown grid not found');
      return el;
    });

    const tracks = getComputedStyle(grid).gridTemplateColumns.split(' ');
    await expect(tracks.length).toBe(3);

    // 표 3개가 모두 같은 줄에 있어야 한다 — 하나가 내려가면 옆이 빈다
    const tops = new Set([...grid.children].map(c => Math.round(c.getBoundingClientRect().top)));
    await expect(tops.size).toBe(1);

    // 트랙 폭이 균등해야 한다 (minmax(0, 1fr))
    const widths = new Set(tracks.map(t => Math.round(parseFloat(t))));
    await expect(widths.size).toBe(1);
  },
};

/**
 * G10_Grand Opening Influencer 결산 블록 — 리포트 맨 위에서 프로그램 전체를 답한다.
 *
 * mock 기준 기대값: 기간 Jul 8 – Sep 7, 2026 (62일). T1 목표 30 · 초대 55 · 방문 4 ·
 * 노쇼 2, T2 목표 70 · 초대 34 · 방문 1 · 노쇼 2. 확정 지출 = 기프트백(4×$8.58 +
 * 1×$2.65 = $36.97) + 사용 확인 크레딧($220) = $256.97. 성과 우수 2명(Opinion USE) —
 * 최고는 engagements가 더 큰 Na Eunji고, 명단 표(StrongPerformerTable)에 프로필·
 * 이메일·게시물 링크까지 실린다(회장님 보고용 — 없는 값은 링크를 지어내지 않는다).
 */
export const GrandOpeningProgramSummary = {
  args: { inviteCounts: INVITE_COUNTS, selectedStore: 'G10' },
  play: async ({ canvasElement }) => {
    const section = await waitFor(() => {
      const el = canvasElement.querySelector('[data-program-section]');
      if (!el) throw new Error('G10 section not found');
      return el;
    });

    await expect(section.textContent).toContain('G10_Grand Opening Influencer');
    await expect(section.querySelector('[data-program-period]').textContent)
      .toContain('Jul 8 – Sep 7, 2026 · 62 days');

    // 티어 비교 — 목표 / 초대 / 방문이 한 행에 나란히 있어야 한다(요청의 핵심)
    const rowText = label => section.querySelector(`[data-program-tier-row="${label}"]`).textContent;
    await expect(rowText('Tier 1')).toContain('30');
    await expect(rowText('Tier 1')).toContain('55');
    await expect(rowText('Tier 2')).toContain('70');
    await expect(rowText('Tier 2')).toContain('34');
    await expect(rowText('Total')).toContain('100');

    // 확정 지출 = 기프트백 + 사용 확인 크레딧. 발급액을 지출로 부풀리지 않는다
    await expect(section.querySelector('[data-program-kpis]').textContent).toContain('$256.97');

    // 비디오 업로드 수 — KPI(방문 5명 중 4명 업로드)와 티어 표 컬럼 양쪽에 실린다
    await expect(section.querySelector('[data-program-kpis]').textContent).toContain('Uploaded');
    await expect(section.textContent).toContain('Uploaded');

    // 시트 제출용 Apps Script 다운로드 — 회장님 보고 탭을 만드는 스크립트
    const script = section.querySelector('[data-program-script]');
    await expect(script.getAttribute('href')).toBe('/grand-opening-report.gs');
    await expect(script.getAttribute('download')).toBe('grand-opening-report.gs');

    // 성과 우수 — Performance와 같은 판정(Opinion USE), 명단 표로 직접 실린다
    await expect(section.querySelector('[data-program-perf]').textContent).toContain('2 strong performers');
    await expect(section.querySelector('[data-program-perf]').textContent).toContain('Na Eunji');

    /* 명단은 연락처·링크까지 — 회장님 보고용(2026-09-01 사장님: "숫자 띡 넣지 말고
       누구인지, 성과·링크·이메일 다 적으라"). 링크는 새 탭 프로필/게시물, 이메일은 mailto. */
    const topRow = id => section.querySelector(`[data-program-top-row="${id}"]`);
    const soyeon = topRow('Processing_1');
    await expect(soyeon.querySelector('a[href="https://tiktok.com/@park.soyeon"]')).toBeTruthy();
    await expect(soyeon.querySelector('a[href="mailto:park.soyeon@naver.com"]')).toBeTruthy();
    await expect(soyeon.querySelector('a[href="https://tiktok.com/@example/video/1"]').textContent).toContain('View post');
    // 값이 없는 칸은 링크를 지어내지 않는다 — Na Eunji는 시트에 프로필·이메일이 없다
    const eunji = topRow('Done_1');
    await expect(eunji.querySelector('a[href^="mailto:"]')).toBeNull();
    await expect(eunji.querySelector('a[target="_blank"]').getAttribute('href')).toBe('https://tiktok.com/@example2/video/1');
  },
};

/**
 * 결산 블록은 기간 필터를 타지 않는다 — 목표 대비 달성률의 모수는 프로그램 전체다.
 * 기간을 걸어 아래 섹션들이 코호트로 다시 계산돼도(Agreement 카드가 'of 3'으로)
 * 결산의 방문 수·티어 표는 그대로여야 한다. 부분 기간 방문 수를 전체 목표와
 * 비교하면 거짓 비율이 되기 때문이고, 각주가 그 고정 규칙을 직접 말한다.
 */
export const GrandOpeningIgnoresPeriodFilter = {
  args: { inviteCounts: INVITE_COUNTS, selectedStore: 'G10' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const visitedKpi = () => canvasElement.querySelector('[data-program-kpis]').textContent;

    await expect(visitedKpi()).toContain('of 100');

    await userEvent.click(canvas.getByRole('button', { name: /Select date range/ }));
    await gotoCalendarMonth(2026, 6);
    await userEvent.click(screen.getByRole('button', { name: 'July 9, 2026' }));
    await userEvent.click(screen.getByRole('button', { name: 'July 14, 2026' }));

    await waitFor(async () => {
      // 아래 섹션들은 기간 코호트(3명)로 좁혀지고
      await expect(canvasElement.querySelector('[data-summary-kpis]').textContent).toContain('of 3');
      // 결산 블록은 프로그램 전체 그대로다
      await expect(visitedKpi()).toContain('of 100');
      await expect(canvasElement.querySelector('[data-program-tier-row="Tier 1"]').textContent).toContain('30');
      // 고정 규칙 문구는 화면 문단이 아니라 기간 줄의 title 툴팁에 있다(회장님 보고용 —
      // 설명 텍스트를 화면에 쌓지 않는다, issue13)
      await expect(canvasElement.querySelector('[data-program-period]').getAttribute('title'))
        .toContain('does not change this block');
    });
  },
};

/**
 * 결산 블록은 스토어 셀렉터를 따라간다 (2026-08-31 사장님: BF5를 보는데 G10 결산이
 * 떠 있으면 안 된다 — 결산은 그 매장 리포트의 일부다). All·프로그램 없는 매장에서는
 * 블록이 없고, 프로그램 있는 매장을 고르면 그 매장 결산이 나온다. 별도 선택 UI는
 * 두지 않는다 — 매장을 고르는 컨트롤이 화면에 이미 있다.
 */
const StoreControlled = args => {
  const [store, setStore] = useState(args.selectedStore ?? ALL_STORES);
  return <SaasAnalyticsView {...args} selectedStore={store} onStoreChange={setStore} />;
};

export const GrandOpeningFollowsStoreSelect = {
  args: {
    influencers: [
      ...MOCK_INFLUENCERS,
      { ...MOCK_INFLUENCERS[0], id: 'g2-1', fullName: 'Ava Stone', store: 'G02', attend: true },
      { ...MOCK_INFLUENCERS[2], id: 'g2-2', fullName: 'Mia Reyes', store: 'G02' },
      { ...MOCK_INFLUENCERS[2], id: 'bf5-1', fullName: 'Lia Cole', store: 'BF5' },
    ],
    stores: ['G10', 'G02', 'BF5'],
    programs: [
      {
        store: 'G10', purpose: 'grand opening', label: 'Grand Opening',
        title: 'G10_Grand Opening Influencer',
        startKey: '2026-07-08', endKey: '2026-09-07',
        goalByTier: { tier1: 30, tier2: 70 },
      },
      {
        store: 'G02', purpose: 'grand opening', label: 'Grand Opening',
        title: 'G02_Grand Opening Influencer',
        startKey: '2026-10-01', endKey: '2026-11-30',
        goalByTier: { tier1: 20, tier2: 40 },
      },
    ],
  },
  render: args => <StoreControlled {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pickStore = async name => {
      await userEvent.click(canvas.getByRole('combobox'));
      await userEvent.click(await screen.findByRole('option', { name }));
    };

    // All — 결산 블록 없음 (어느 매장 결산인지 정해지지 않았다)
    await expect(canvasElement.querySelector('[data-program-section]')).toBeNull();

    // G10 선택 — G10 결산이 나온다
    await pickStore('G10');
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-program-section="G10"]').textContent)
        .toContain('G10_Grand Opening Influencer');
    });

    // G02 선택 — 그 매장 결산(제목·목표 Total 60·기간)으로 바뀐다
    await pickStore('G02');
    await waitFor(async () => {
      const active = canvasElement.querySelector('[data-program-section="G02"]');
      await expect(active).toBeTruthy();
      await expect(active.textContent).toContain('G02_Grand Opening Influencer');
      await expect(active.querySelector('[data-program-tier-row="Total"]').textContent).toContain('60');
      await expect(active.querySelector('[data-program-period]').textContent).toContain('Oct 1 – Nov 30, 2026');
    });

    // BF5 선택 — 프로그램이 없는 매장이라 결산 블록이 없다
    await pickStore('BF5');
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-program-section]')).toBeNull();
    });
  },
};

/**
 * 기프트백 착오 보정 — 매장이 다른 티어의 백을 건넨 방문(giftBagTierOverrides)은
 * 그 사람 티어 단가가 아니라 **실제로 나간 백**의 단가로 센다. 비용 리포트는
 * 지급했어야 할 것이 아니라 지급한 것을 센다. 백은 시트에 열이 없어 이 상수가
 * 유일한 보정 경로다(크레딧 착오는 시트 type 열을 고치면 자동 반영이라 여기 없음).
 * mock: T2 방문자 Na Eunji 1명 → T2 gift가 $2.65 대신 $8.58, 각주가 이유를 밝힌다.
 */
export const GrandOpeningGiftBagOverride = {
  args: {
    selectedStore: 'G10',
    programs: [
      {
        store: 'G10', purpose: 'grand opening', label: 'Grand Opening',
        title: 'G10_Grand Opening Influencer',
        startKey: '2026-07-08', endKey: '2026-09-07',
        goalByTier: { tier1: 30, tier2: 70 },
        giftBagTierOverrides: { 'na eunji': 'tier1' },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const section = await waitFor(() => {
      const el = canvasElement.querySelector('[data-program-section]');
      if (!el) throw new Error('program section not found');
      return el;
    });

    // T2 방문 1건이 T1 백($8.58)으로 계산된다 — 사람 티어 단가($2.65)가 아니라
    await expect(section.querySelector('[data-program-tier-row="Tier 2"]').textContent).toContain('$8.58');
    // 왜 단가×수와 합계가 다른지는 Gift bags 헤더 툴팁이 말한다(issue13 — 표 아래 문단 벽 철거)
    await expect(section.querySelector('[data-program-gift-mix]').getAttribute('title'))
      .toContain("1 visit received the other tier's bag by store mistake");
  },
};

/**
 * 같은 매장에 프로그램이 여럿이면(정체성 = store × purpose) 결산 블록 제목 우측
 * 칩으로 고른다 (2026-08-31 사장님: Grand Opening 다음에 Monthly·이벤트 모집이 온다 —
 * 매장 선택만으로는 결산을 특정할 수 없다). 행 소속은 시트 Purpose 열이 정하고
 * (대소문자·공백 무시), Purpose가 빈 행은 어느 결산에도 못 들며 그 수를 화면이 밝힌다.
 */
export const ProgramChipsPickWithinStore = {
  args: {
    selectedStore: 'G10',
    influencers: [
      ...MOCK_INFLUENCERS,
      // Monthly 모집 행 — Purpose 표기가 대문자여도 잡힌다
      { ...MOCK_INFLUENCERS[1], id: 'm-1', fullName: 'Mina Kwon', purpose: 'Monthly' },
      { ...MOCK_INFLUENCERS[2], id: 'm-2', fullName: 'Sora Bae', purpose: 'monthly' },
      // Purpose 빈 행 — 어느 결산에도 못 든다
      { ...MOCK_INFLUENCERS[2], id: 'u-1', fullName: 'Hana Seo', purpose: '' },
    ],
    programs: [
      {
        store: 'G10', purpose: 'grand opening', label: 'Grand Opening',
        title: 'G10_Grand Opening Influencer',
        startKey: '2026-07-08', endKey: '2026-09-07',
        goalByTier: { tier1: 30, tier2: 70 },
      },
      {
        store: 'G10', purpose: 'monthly', label: 'Monthly',
        title: 'G10_Monthly Influencer',
        startKey: '2026-10-01', endKey: '2026-10-31',
        goalByTier: { tier1: 5, tier2: 15 },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const section = await waitFor(() => {
      const el = canvasElement.querySelector('[data-program-section]');
      if (!el) throw new Error('program section not found');
      return el;
    });

    // 기본은 첫 프로그램 + 프로그램 수만큼 칩
    await expect(section.textContent).toContain('G10_Grand Opening Influencer');
    await expect(section.querySelectorAll('[data-program-chip]').length).toBe(2);
    // Purpose 빈 행 1건이 밝혀진다 — 조용히 빠지면 결산이 왜 모자란지 알 수 없다
    await expect(section.querySelector('[data-program-unassigned]').textContent)
      .toContain('1 row for this store has no Purpose value');

    // Monthly 칩 — 제목·목표가 그 프로그램으로 바뀐다
    await userEvent.click(section.querySelector('[data-program-chip="monthly"]'));
    await waitFor(async () => {
      const active = canvasElement.querySelector('[data-program-purpose="monthly"]');
      await expect(active).toBeTruthy();
      await expect(active.textContent).toContain('G10_Monthly Influencer');
      // 목표 5+15=20 — Visited KPI의 분모가 따라온다
      await expect(active.querySelector('[data-program-kpis]').textContent).toContain('of 20');
    });
  },
};
