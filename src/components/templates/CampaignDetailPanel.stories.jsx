import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { CampaignDetailPanel } from './CampaignDetailPanel';
import { PLATFORM, GOAL, TARGET_SCOPE } from '../../data/schema';

const TODAY = new Date('2026-08-07');

const CAMPAIGN = {
  id: 'c-1',
  name: 'G10_Now Open_0706~0831',
  campaignGroup: 'G10 Opening',
  platform: PLATFORM.TIKTOK,
  accountId: 'tiktok-unified',
  targetScope: TARGET_SCOPE.ALL_STORES,
  targetStoreIds: [],
  startDate: '2026-07-06',
  endDate: '2026-08-31',
  budgetPlanned: 0,
  budgetDaily: 25,
  goal: GOAL.AWARENESS,
  thumbnailUrl: null,
  creativeUrl: '',
};

/** TikTok은 follows·profileVisits까지 준다 — 표에서 뺀 지표가 여기 다 보이는지 확인용. */
const PERFORMANCE = {
  id: 'p-1',
  campaignId: 'c-1',
  impressions: 221893,
  reach: 48723,
  clicks: 0,
  spend: 632.98,
  videoPlays: 219708,
  hookViews: 10163,
  heldViews: 393,
  avgWatchSeconds: 1.01,
  likes: 181,
  comments: 4,
  shares: 12,
  follows: 26,
  profileVisits: 118,
  engagements: null,
  conversions: null,
};

export default {
  title: 'Paid Ads Dashboard/Templates/CampaignDetailPanel',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## CampaignDetailPanel

Reports에서 캠페인 한 건을 **그 자리에서** 펼쳐 보는 읽기 전용 패널.

### 왜 Dashboard로 보내지 않나
예전엔 Reports 표의 행을 클릭하면 \`/dashboard?campaign={id}\`로 **이동**해서 편집
드로어가 열렸다. Reports는 비교하는 화면이다 — 중앙값도, goal별 분리도,
Meta/TikTok 짝 배치도 전부 행끼리 훑어 비교하라고 만든 장치다. 한 행을 확인하려고
다른 페이지로 끌려가면 그 맥락이 통째로 날아간다.

필터는 URL에 있어 살아남지만 **스크롤 위치와 페이지 번호는 안 살아난다.** Traffic
표는 115건 = 8페이지인데, 7페이지에서 한 건 보고 돌아오면 1페이지다.

### 왜 편집 드로어를 그대로 안 쓰나
Reports에서 하는 일은 읽기지 고치기가 아니다. 그리고 편집 드로어의 \`Save & Next\`는
**Dashboard의 필터된 목록** 순서로 다음 캠페인에 가는데, Reports에서 열면 "다음"이
무엇인지부터 모호해진다. 저장 핸들러·미저장 변경 가드·삭제 확인이 전부
DashboardPage 상태에 얽혀 있기도 하다.

여기서는 읽기만 한다. 고칠 게 있으면 \`Edit on Dashboard\`로 간다 — 당하는 이동이
아니라 고르는 이동이 된다.

### 표에서 뺀 지표가 여기 있다
\`Reach · Plays · Comments · Shares · Follows · Visits\`는 표 폭을 위해 뺐고, 전부 이
패널의 \`PlatformMetricList\`에 있다. 값이 없는 항목은 그 컴포넌트가 알아서 숨긴다.
        `,
      },
    },
  },
};

function Harness({ campaign, performance }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Box sx={{ minWidth: 320 }}>
      <Button variant="outlined" onClick={() => setIsOpen(true)} sx={{ boxShadow: 'none' }}>
        Open detail
      </Button>
      {isOpen && (
        <CampaignDetailPanel
          campaign={campaign}
          performance={performance}
          accountLabel="TikTok Unified"
          today={TODAY}
          onClose={() => setIsOpen(false)}
          onEdit={() => {}}
        />
      )}
    </Box>
  );
}

/**
 * 성과가 있는 TikTok 캠페인.
 *
 * 확인 포인트:
 * - 예산은 정수(`$25/day`), 집행은 2자리(`$632.98`) — utils/format.js 규칙
 * - 계획 예산이 0으로 저장돼 있어도 일일예산×기간으로 복원된 값이 뜬다
 *   (effectiveBudgetPlanned, $25 × 57일 = $1,425)
 * - Budget Pacing 블록이 나온다
 * - 표에서 뺀 `Reach · Plays · Comments · Shares · Follows · Visits`가 모두 보인다
 * - `Avg Watch`는 `1.01s` — TikTok이 준 소수를 그대로 쓴다
 */
export const WithPerformance = {
  render: () => <Harness campaign={CAMPAIGN} performance={PERFORMANCE} />,
};

/**
 * 성과 레코드가 없는 캠페인 — 동기화가 아직 안 붙었거나 집행 전이다.
 *
 * 확인 포인트: 지표 목록과 페이싱 블록이 **통째로 사라지고**, 대신 왜 비었는지
 * 한 줄로 말한다. 빈 표를 그려두면 "0"과 "아직 없음"이 구분되지 않는다.
 */
export const NoPerformance = {
  render: () => <Harness campaign={CAMPAIGN} performance={undefined} />,
};

/**
 * Meta 캠페인 — `follows`·`profileVisits`가 구조적으로 없다(캠페인 레벨 대응 지표
 * 없음). 그 두 줄이 빠진 채 나머지만 나오는지 본다.
 */
export const MetaCampaign = {
  render: () => (
    <Harness
      campaign={{ ...CAMPAIGN, id: 'c-2', platform: PLATFORM.META, name: 'G10_Now Open_0706 ~0831', budgetDaily: 40 }}
      performance={{ ...PERFORMANCE, campaignId: 'c-2', follows: null, profileVisits: null, avgWatchSeconds: 2 }}
    />
  ),
};
