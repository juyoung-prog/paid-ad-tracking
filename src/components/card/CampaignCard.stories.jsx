import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { CampaignCard } from './CampaignCard';
import { getEffectiveStatus, TARGET_SCOPE, PLATFORM } from '../../data/schema';
import { mockCampaigns, mockAdAccounts } from '../../data/paidAdsMockData';

const today = new Date('2026-07-20');
const accountLabel = (accountId) => mockAdAccounts.find((a) => a.id === accountId)?.label.replace(/^Meta - |^TikTok - /, '') ?? accountId;

export default {
  title: 'Paid Ads Dashboard/Card/CampaignCard',
  component: CampaignCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## CampaignCard

캠페인 현황 대시보드 카드 그리드에 쓰이는 요약 카드. CustomCard 위에 구성했다.

### 기능
- 캠페인명 + 상태 칩 (진행중/예정/종료/조기종료/보관)
- 플랫폼·계정·타겟 매장 칩
- 기간·예산(계획/집행)을 tabular-nums로 표시
- 고긴급 알림이 있을 때만 하단에 뱃지 노출 — 성과 지표는 표시하지 않음(Drawer 몫)
        `,
      },
    },
  },
  argTypes: {
    name: { control: 'text', description: '캠페인명' },
    platform: { control: 'select', options: [PLATFORM.META, PLATFORM.TIKTOK], description: '플랫폼' },
    accountLabel: { control: 'text', description: '계정 표시명' },
    targetScope: {
      control: 'select',
      options: [TARGET_SCOPE.SINGLE_STORE, TARGET_SCOPE.MULTI_STORE, TARGET_SCOPE.ALL_STORES],
      description: '타겟 범위',
    },
    targetStoreIds: { control: 'object', description: '타겟 매장 코드 배열' },
    startDate: { control: 'text', description: 'ISO 8601 date' },
    endDate: { control: 'text', description: 'ISO 8601 date' },
    budgetPlanned: { control: { type: 'number' }, description: '계획 예산(USD)' },
    spend: { control: { type: 'number' }, description: '실집행 예산(USD)' },
    status: {
      control: 'select',
      options: ['planned', 'active', 'ended', 'ended_early', 'archived'],
      description: 'effectiveStatus 계산값',
    },
    alertBadge: { control: 'object', description: '{ text, severity } 형태의 고긴급 알림 뱃지' },
    onClick: { action: 'clicked' },
  },
};

/**
 * CampaignCard 기본 사용 예시. status가 planned라 클릭 안내가
 * "Edit campaign details"로 뜬다(아직 시작 전이라 보고할 성과가 없음).
 */
export const Default = {
  args: {
    name: 'Morrow Grand Opening Awareness',
    platform: PLATFORM.META,
    accountLabel: 'Georgia',
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: ['G11'],
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    budgetPlanned: 1500,
    status: 'planned',
    onClick: () => {},
  },
  render: (args) => (
    <Box sx={{ maxWidth: 400 }}>
      <CampaignCard {...args} />
    </Box>
  ),
};

/**
 * 고긴급 알림 뱃지가 붙은 카드. status가 active라 클릭 안내가
 * "Update performance"로 뜬다.
 */
export const WithAlert = {
  args: {
    name: 'Ending Soon Campaign',
    platform: PLATFORM.META,
    accountLabel: 'Georgia',
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: ['G02'],
    startDate: '2026-07-05',
    endDate: '2026-07-23',
    budgetPlanned: 900,
    spend: 850,
    status: 'active',
    alertBadge: { text: 'D-3 종료 임박', severity: 'warning' },
    onClick: () => {},
  },
  render: (args) => (
    <Box sx={{ maxWidth: 400 }}>
      <CampaignCard {...args} />
    </Box>
  ),
};

/**
 * 저긴급 중복 타겟팅 칩 — overlapNote에 구체적 충돌 캠페인명을 담아 넘기면
 * 마우스를 올렸을 때 Tooltip으로 보인다 (F8: 이전엔 라벨만 있고 설명이 없었음)
 */
export const WithOverlapNote = {
  args: {
    name: 'Georgia Traffic Push B',
    platform: PLATFORM.META,
    accountLabel: 'Georgia',
    targetScope: TARGET_SCOPE.SINGLE_STORE,
    targetStoreIds: ['G01'],
    startDate: '2026-07-20',
    endDate: '2026-08-10',
    budgetPlanned: 700,
    status: 'active',
    overlapNote: 'Georgia Traffic Push B — overlaps with Georgia Traffic Push A (same store and goal, overlapping dates)',
  },
  render: (args) => (
    <Box sx={{ maxWidth: 400 }}>
      <CampaignCard {...args} />
    </Box>
  ),
};

/**
 * mockCampaigns 전체를 그리드로 — 상태·목표·매장 범위별 실제 데이터 조합
 */
export const Grid_ = {
  name: 'Grid (Mock Data)',
  render: () => (
    <Grid container spacing={2}>
      {mockCampaigns.map((c) => (
        <Grid key={c.id} size={{ xs: 12, md: 6 }}>
          <CampaignCard
            name={c.name}
            platform={c.platform}
            accountLabel={accountLabel(c.accountId)}
            targetScope={c.targetScope}
            targetStoreIds={c.targetStoreIds}
            startDate={c.startDate}
            endDate={c.endDate}
            budgetPlanned={c.budgetPlanned}
            status={getEffectiveStatus(c, today)}
          />
        </Grid>
      ))}
    </Grid>
  ),
};
