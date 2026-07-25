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
- 좌측: 캠페인명(Hero, bold) + (creativeUrl 있으면) 외부 링크 아이콘("View Ad") + 플랫폼·타겟 칩 + 같은 플랫폼 안의 형제 캠페인(campaignGroupKey 동일) 있으면 "+N more in group" 관계 칩 + (있으면) 저긴급 중복 타겟팅 칩
- 우측: 고긴급 알림이 있으면 알림 칩+텍스트(있으면 여러 개 다 Tooltip에), 없으면 캠페인 상태 칩 + 기간·예산
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
 * "{campaignGroup} (+N)" 칩으로 표시된다.
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
