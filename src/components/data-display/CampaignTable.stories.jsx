import Box from '@mui/material/Box';
import { CampaignTable } from './CampaignTable';
import { getEffectiveStatus } from '../../data/schema';
import { mockCampaigns, mockPerformanceRecords } from '../../data/paidAdsMockData';

const thumbnailFor = (campaignId) => mockCampaigns.find((c) => c.id === campaignId)?.thumbnailUrl ?? null;
const creativeUrlFor = (campaignId) => mockCampaigns.find((c) => c.id === campaignId)?.creativeUrl ?? null;

const today = new Date('2026-07-20');
const spendFor = (campaignId) => mockPerformanceRecords.find((p) => p.campaignId === campaignId)?.spend;

export default {
  title: 'Paid Ads Dashboard/Data Display/CampaignTable',
  component: CampaignTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## CampaignTable

Dashboard 캠페인 목록. 실제 Influencer Tracking Dashboard 레퍼런스(아바타 없는
2줄 리스트: 이름+메타 좌측 / 상태 2줄 우측)를 기준으로 맞췄다 — 이 프로젝트의
1순위 목표는 "같은 회사 툴군처럼 보이는 것"이라, 한때 적용했던 Fiori/Carbon
dense table 패턴보다 레퍼런스 일치를 우선한다.

### 기능
- 맨 좌측: 소재 썸네일(CampaignThumbnail) — thumbnailUrl 없으면 플랫폼색 이니셜로 자동 대체, 항상 뭔가 보임
- 좌측: 캠페인명(Hero, bold) + (creativeUrl 있으면) 외부 링크 아이콘("View Ad"), 그 아래 메타 줄은 **칩이 아니라 평문 + 가운뎃점**으로 이어진다 — 플랫폼 · 타겟 · (형제 있거나 campaignGroup 입력됐으면) "{그룹명} (+N)" · (있으면) 중복 타겟팅(warning 색). 예전엔 전부 outlined 칩이라 한 행에 테두리가 5~6개씩 생겨 캠페인명보다 테두리가 먼저 읽혔다
- 우측: 고긴급 알림이 있으면 알림 텍스트 2줄(여러 개면 Tooltip에 전부), 없으면 캠페인 상태 칩 + 기간·예산 — 칩은 이제 "상태"에만 남는다(StoreTable과 동일 기준)
- onRowClick이 있으면 행이 Tab으로 포커스 가능하고 Enter/Space로 활성화됨
        `,
      },
    },
  },
  argTypes: {
    rows: { control: 'object', description: '미리 조인된 캠페인 행 배열' },
    onRowClick: { action: 'rowClicked' },
  },
};

/**
 * mockCampaigns 전체 — 실제 Dashboard에서 쓰는 것과 동일한 형태로 조인
 */
export const Default = {
  render: (args) => {
    const rows = mockCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform,
      targetScope: c.targetScope,
      targetStoreIds: c.targetStoreIds,
      startDate: c.startDate,
      endDate: c.endDate,
      budgetPlanned: c.budgetPlanned,
      budgetDaily: c.budgetDaily,
      spend: spendFor(c.id),
      status: getEffectiveStatus(c, today),
      thumbnailUrl: c.thumbnailUrl,
      creativeUrl: c.creativeUrl,
    }));
    return (
      <Box>
        <CampaignTable rows={rows} onRowClick={args.onRowClick} />
      </Box>
    );
  },
};

/**
 * 동기화로 들어온 캠페인 — 계획 예산이라는 개념 자체가 없어 budgetPlanned가
 * 0으로 저장된다. 이때 상태줄이 "$0 · $2,261.5 spent"가 아니라 spend만
 * 보여줘야 한다("예산 0으로 계획했는데 초과 집행"으로 읽히는 문제, 실데이터
 * 스크린샷 리뷰로 발견). 예산·spend 둘 다 없으면 기간만 남는다 — 이 분기는
 * 실데이터에만 있고 mockCampaigns에는 없어서 스토리로 커버리지를 만들어둔다.
 */
export const SyncedWithoutBudget = {
  render: (args) => (
    <Box>
      <CampaignTable
        rows={[
          {
            id: 'sync-01',
            name: 'BF4_1MonthDeals_0417~0531',
            platform: 'meta',
            targetScope: 'single_store',
            targetStoreIds: ['BF4'],
            startDate: '2026-04-17',
            endDate: '2026-07-29',
            budgetPlanned: 0,
            spend: 2261.5,
            status: 'active',
            thumbnailUrl: null,
            creativeUrl: null,
          },
          {
            id: 'sync-02',
            name: 'G10_Grand Opening_0706~0801',
            platform: 'tiktok',
            targetScope: 'single_store',
            targetStoreIds: ['G10'],
            startDate: '2026-07-06',
            endDate: '2026-08-01',
            budgetPlanned: 0,
            status: 'active',
            thumbnailUrl: null,
            creativeUrl: null,
          },
        ]}
        onRowClick={args.onRowClick}
      />
    </Box>
  ),
};

/**
 * 고긴급 알림·저긴급 중복 타겟팅이 섞인 행 — 각각 ⚠ / ⇄ 아이콘에
 * 마우스를 올리면 Tooltip으로 구체적인 문구가 보인다.
 */
export const WithAlerts = {
  render: (args) => (
    <Box>
      <CampaignTable
        rows={[
          {
            id: 'camp-01',
            name: 'Summer Sale Traffic',
            platform: 'meta',
            targetScope: 'multi_store',
            targetStoreIds: ['BF1', 'BF2', 'BF3'],
            startDate: '2026-07-01',
            endDate: '2026-07-31',
            budgetPlanned: 2000,
            spend: 1800,
            status: 'active',
            thumbnailUrl: thumbnailFor('camp-02'),
            creativeUrl: creativeUrlFor('camp-02'),
            alertBadges: [
              { text: 'Summer Sale Traffic — budget is pacing ahead of schedule (90% spent / 66% elapsed)', severity: 'warning' },
              { text: 'D-2 — Summer Sale Traffic is ending soon', severity: 'warning' },
            ],
          },
          {
            id: 'camp-02',
            name: 'Georgia Traffic Push B',
            platform: 'meta',
            targetScope: 'single_store',
            targetStoreIds: ['G01'],
            startDate: '2026-07-20',
            endDate: '2026-08-10',
            budgetPlanned: 700,
            status: 'active',
            overlapNote: 'Georgia Traffic Push B — overlaps with Georgia Traffic Push A (same store and goal, overlapping dates)',
            thumbnailUrl: thumbnailFor('camp-10'),
            creativeUrl: creativeUrlFor('camp-10'),
          },
          {
            id: 'camp-03',
            name: 'Holiday Conversion FL',
            platform: 'meta',
            targetScope: 'multi_store',
            targetStoreIds: ['BF4', 'BF5'],
            startDate: '2026-06-15',
            endDate: '2026-07-05',
            budgetPlanned: 1200,
            status: 'ended',
            alertBadges: [{ text: 'Holiday Conversion FL — ended but performance data hasn\'t been entered', severity: 'error' }],
            thumbnailUrl: thumbnailFor('camp-05'),
            creativeUrl: creativeUrlFor('camp-05'),
          },
        ]}
        onRowClick={args.onRowClick}
      />
    </Box>
  ),
};

/**
 * 같은 플랫폼 안에서 이름만 다른 형제(단계) 캠페인 — 그랜드 오프닝처럼 하나의
 * 이니셔티브를 Coming Soon/Now Open/Grand Opening 등 여러 단계로 나눠 등록한
 * 경우. 각 단계가 리스트에서 구분되는 이름을 가지므로 name 매칭만으로는 그룹이
 * 안 되고, campaignGroup(전부 "BF4 Grand Opening")으로 묶어야 한다 —
 * 메타 줄에 "{campaignGroup} (+N)" 평문으로 표시된다(Tooltip에 형제 이름 목록).
 */
export const WithSamePlatformGroup = {
  render: (args) => (
    <Box>
      <CampaignTable
        rows={[
          {
            id: 'camp-20',
            name: 'BF4 Grand Opening — Coming Soon',
            campaignGroup: 'BF4 Grand Opening',
            platform: 'meta',
            targetScope: 'single_store',
            targetStoreIds: ['BF4'],
            startDate: '2026-07-01',
            endDate: '2026-07-19',
            budgetPlanned: 500,
            status: 'ended',
          },
          {
            id: 'camp-21',
            name: 'BF4 Grand Opening — Now Open',
            campaignGroup: 'BF4 Grand Opening',
            platform: 'meta',
            targetScope: 'single_store',
            targetStoreIds: ['BF4'],
            startDate: '2026-07-20',
            endDate: '2026-07-26',
            budgetPlanned: 500,
            status: 'active',
          },
          {
            id: 'camp-22',
            name: 'BF4 Grand Opening — Grand Opening',
            campaignGroup: 'BF4 Grand Opening',
            platform: 'meta',
            targetScope: 'single_store',
            targetStoreIds: ['BF4'],
            startDate: '2026-07-20',
            endDate: '2026-07-27',
            budgetPlanned: 500,
            status: 'active',
          },
          {
            id: 'camp-23',
            name: 'BF4 Grand Opening — 1 Month Deals',
            campaignGroup: 'BF4 Grand Opening',
            platform: 'meta',
            targetScope: 'single_store',
            targetStoreIds: ['BF4'],
            startDate: '2026-07-28',
            endDate: '2026-08-27',
            budgetPlanned: 500,
            status: 'planned',
          },
        ]}
        onRowClick={args.onRowClick}
      />
    </Box>
  ),
};

export const Empty = {
  args: { rows: [] },
};
