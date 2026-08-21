import Box from '@mui/material/Box';
import { CampaignTable } from './CampaignTable';
import { getEffectiveStatus, calcBudgetPacing } from '../../data/schema';
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
- 맨 좌측: 소재 썸네일(CampaignThumbnail) — thumbnailUrl 없으면 중립색 이니셜로 자동 대체, 항상 뭔가 보임
- 좌측: 캠페인명(Hero, bold) + (creativeUrl 있으면) 외부 링크 아이콘("View Ad"), 그 아래 메타 줄은 **칩이 아니라 평문 + 가운뎃점**으로 이어진다 — 플랫폼 · 타겟 · (형제 있거나 campaignGroup 입력됐으면) "{그룹명} (+N)" · (있으면) 중복 타겟팅(warning 색). 예전엔 전부 outlined 칩이라 한 행에 테두리가 5~6개씩 생겨 캠페인명보다 테두리가 먼저 읽혔다
- 우측: 고긴급 알림이 있으면 알림 텍스트 2줄(여러 개면 Tooltip에 전부), 없으면 상태 표시(8px 점 + 라벨) + 기간·예산
- \`isStatusRedundant\`가 true면 상태 표시를 생략한다 — 감싼 그룹 헤더가 이미 상태를 말하는 경우(\`LIVE (4)\` 아래 모든 행이 Active)
- onRowClick이 있으면 행이 Tab으로 포커스 가능하고 Enter/Space로 활성화됨

### 표기 규칙
금액·날짜는 \`src/utils/format.js\`에서만 정한다. 예산은 \`moneyWhole\`(정수 —
사람이 정수 달러로 정하고 일수를 곱한 값이라 센트가 없다), 집행은 \`money\`
(항상 2자리 — 플랫폼이 센트로 청구한 실측값). 예전엔 옵션 없는
\`toLocaleString\`이라 같은 열에 \`$2,261.5\`와 \`$514.49\`가 나란히 찍혔다.
기간은 \`dateRangeWithDays\` — \`Jul 10 – Aug 31 (53 days)\` 꼴로, 같은 해면
연도를 생략하고 진행 일수(양끝 포함)를 함께 보여준다.

### 상태 표시가 왜 칩이 아닌가
예전엔 채도 높은 초록 filled Chip이었다. 행마다 반복되니 **화면에서 가장 강한
시각 요소가 상태 칩**이 됐는데, This Period 탭에서는 바로 위 \`LIVE (4)\` 헤더가
이미 같은 말을 하고 있어 대부분 중복이었다. 반대로 정작 판단이 필요한 페이스
문구는 회색 평문이었다. 색이 담은 의미는 유지하되 면적을 줄이고
(8px 점 + 라벨), 중복인 자리에서는 아예 뺀다.
        `,
      },
    },
  },
  argTypes: {
    rows: { control: 'object', description: '미리 조인된 캠페인 행 배열' },
    isStatusRedundant: { control: 'boolean', description: '감싼 헤더가 이미 상태를 말하면 true' },
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
      paceRatio: calcBudgetPacing(c, spendFor(c.id), today).dailyBudgetRatio,
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
 * 예산 페이스 — 상태줄 맨 끝에 "지금 속도가 맞나"를 붙인다.
 *
 * 이 표시가 없던 시절엔 행이 `07.10–08.31 · $20/day · $514.49 spent`까지만
 * 말했다. 괜찮은지 알려면 사용자가 기간 일수를 세고, 경과일을 곱하고, 실제
 * 지출과 비교해야 했다 — 숫자는 다 화면에 있는데 관계만 사람 머리에 떠넘긴
 * 형태였고, 행마다 반복되니 실제로는 아무도 하지 않았다.
 *
 * 임계(15%)를 넘으면 budget_pacing 알림이 따로 뜬다. 여기서 중요한 건
 * **정상일 때도 말한다**는 점이다 — "알림이 없다"와 "확인해 봤더니 괜찮다"는
 * 사용자에게 전혀 다른 정보다.
 *
 * 확인 포인트: ±10% 안이면 편차 숫자 없이 `on pace`, 초과면 warning 색 + 굵게,
 * 미달이면 회색(판단 재료일 뿐 급하지 않다). 일일 예산이 없거나 기간이 하루라
 * 계산 근거가 없으면 아예 안 붙는다(모르면서 아는 척하지 않는다).
 */
export const BudgetPace = {
  render: (args) => (
    <Box>
      <CampaignTable
        rows={[
          ['pace-over', 'G10_Now Open_0706~0831', 'meta', 1.34, 20, 1180],
          ['pace-on', 'G10_1_Month Deals_0710~0831', 'tiktok', 1.03, 20, 514.49],
          ['pace-under', 'G10_Coming Soon_0617~0707', 'meta', 0.66, 20, 320],
          // 일일 예산이 없는 캠페인 — 페이스를 계산할 근거가 없어 표시하지 않는다
          ['pace-none', 'AllStores_RaffleReceipt_0625-0731', 'meta', null, null, 355.27],
        ].map(([id, name, platform, paceRatio, budgetDaily, spend]) => ({
          id,
          name,
          platform,
          targetScope: 'single_store',
          targetStoreIds: ['G10'],
          startDate: '2026-07-06',
          endDate: '2026-08-31',
          budgetPlanned: 0,
          budgetDaily,
          spend,
          paceRatio,
          status: 'active',
          thumbnailUrl: null,
          creativeUrl: null,
        }))}
        onRowClick={args.onRowClick}
      />
    </Box>
  ),
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

/**
 * 그룹 헤더가 이미 상태를 말하는 자리 — Dashboard의 This Period 탭이 쓰는 형태다.
 *
 * 위아래를 비교해서 보라. 같은 4행인데 위(기본값)는 `Active` 표시가 행마다
 * 반복되고, 아래(`isStatusRedundant`)는 헤더가 한 번만 말한다. 예전에는 이
 * 반복이 채도 높은 초록 filled Chip이라 **화면에서 가장 강한 요소가 중복
 * 정보**였다 — 정작 판단이 필요한 페이스 문구("22% under budget pace")보다
 * 훨씬 세게 보였다.
 *
 * 확인 포인트:
 * - 아래 표에는 상태 점·라벨이 없고, 기간·예산 줄이 곧바로 우측 상단에 붙는가
 * - 페이스 문구가 주변 회색 숫자보다 진한가(색이 아니라 굵기로도 구분)
 * - 상태가 섞인 그룹(Action Required·Other Campaigns)에서는 이 prop을 켜면
 *   안 된다 — 그 경우 헤더가 상태를 대변하지 못한다
 */
export const StatusRedundantUnderGroupHeader = {
  name: 'Status Redundant (under a group header)',
  render: (args) => {
    const liveRows = [
      {
        id: 'camp-30',
        name: 'G10_Now Open_0706~0831',
        platform: 'meta',
        targetScope: 'all_stores',
        targetStoreIds: [],
        startDate: '2026-07-06',
        endDate: '2026-08-31',
        budgetPlanned: 0,
        budgetDaily: 25,
        spend: 514.49,
        paceRatio: 0.78,
        status: 'active',
      },
      {
        id: 'camp-31',
        name: 'G10_1 Month Deals_0710~0831',
        platform: 'tiktok',
        targetScope: 'all_stores',
        targetStoreIds: [],
        startDate: '2026-07-10',
        endDate: '2026-08-31',
        budgetPlanned: 900,
        budgetDaily: 20,
        spend: 2261.5,
        paceRatio: 1.34,
        status: 'active',
      },
    ];
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ typography: 'label', color: 'text.primary', mb: 0.5 }}>Default — status shown ({liveRows.length})</Box>
          <CampaignTable rows={liveRows} onRowClick={args.onRowClick} />
        </Box>
        <Box>
          <Box sx={{ typography: 'label', color: 'text.primary', mb: 0.5 }}>Live ({liveRows.length})</Box>
          <CampaignTable rows={liveRows} isStatusRedundant onRowClick={args.onRowClick} />
        </Box>
      </Box>
    );
  },
};

export const Empty = {
  args: { rows: [] },
};
