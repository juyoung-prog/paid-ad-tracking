import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { CampaignDetailPanel } from './CampaignDetailPanel';
import { PLATFORM, GOAL, TARGET_SCOPE } from '../../data/schema';
import { spreadDailyOverCampaign } from '../../data/paidAdsMockData';

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

/** TikTok은 follows·profileVisits까지 준다 — 전 지표가 세로로 다 보이는지 확인용. */
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

### 바깥으로 나가는 문 세 개
\`View ad\`는 **소비자가 보는 실제 광고 게시물**로 간다 — creativeUrl(수동 입력)이
있으면 그쪽 우선, 없으면 동기화가 채운 adLink(썸네일과 같은 광고에서 뽑은
게시물 주소: Meta는 부스팅 원본 게시물 permalink 또는 미리보기 링크, TikTok은
Spark 광고의 공개 영상 주소 — 업로드 소재 다크 광고는 공개 게시물이 없어 null).
\`Ads Manager\`는 플랫폼 관리 화면(Meta만, 호출부가 adsManagerUrl로 계산해
\`adsManagerHref\`로 넘긴다).
성과가 이상해 보일 때 다음 행동은 "원본을 열어 확인"이라, 이 문이 없으면
표 → 패널까지 와 놓고 다시 Dashboard를 거쳐야 한다. 링크 규칙은 pages 레이어의
것이라 이 컴포넌트는 href를 받기만 한다 — 컴포넌트가 pages를 임포트하면 의존
방향이 뒤집힌다.

\`Billing\`(\`billingHref\`, 호출부가 billingUrl로 계산)는 방향이 다른 세 번째
문이다 — 위 둘이 "광고가 어떻게 나갔나"라면 이건 "얼마가 청구됐나"다.
리포트를 보다 인보이스를 뽑아야 할 때 Ads Manager를 열어도 거기서
Billing & payments → Payment activity를 또 찾아 들어가야 했다. 인보이스는
**계정 단위** 문서라 이 링크만 캠페인이 아니라 계정으로 간다(Meta는 청구 허브에
그 계정이 선택된 상태, TikTok은 광고주 결제 화면까지).

### 폭이 고정이다
패널 폭은 \`560\`(좁은 화면에선 전체 폭). 예전엔 지정이 없어 내용물이 폭을
정했는데, 그러면 액션 줄이 캠페인마다 다른 지점에서 접혀 같은 패널의 버튼
배치가 열 때마다 달라졌다. 560은 문 네 개가 한 줄에 들어가는 폭이다 —
라벨을 늘리거나 버튼을 더하면 이 값도 같이 봐야 한다(\`Payment activity\`를
\`Billing\`으로 줄인 이유이기도 하다).

### 전 지표를 세로로 한눈에
표에도 같은 값이 있지만(전 컬럼 노출 + 가로 스크롤 — Meta 광고 관리자와 같은
문법), 이 패널은 **한 캠페인만** 놓고 읽는 자리다. 값이 없는 항목은
\`PlatformMetricList\`가 알아서 숨긴다.

### 이 캠페인만의 Daily spend
\`dailyRows\`(PerformanceDaily[], 호출부가 캠페인으로 걸러 넘김)가 있으면 날짜당
한 행짜리 일별 지출 표를 그린다. Reports 본문의 Daily spend 표는 **필터에 걸린
캠페인들의 합**이라, 같은 플랫폼에서 기간이 겹치는 캠페인이 있으면 하나를 집어
볼 방법이 없었다(실사용 요청) — 캠페인 단위 일별은 캠페인 상세의 질문이므로 이
패널이 맡는다. 표의 Total과 위 Spend 줄(누적 스냅샷)은 같은 값이어야 정상이고,
어긋나면 backfill 미완/플랫폼 사후 정정의 신호라 둘 다 보이게 둔다. 비면
섹션째 안 그린다 — 수동 등록 캠페인은 일별이 영영 없어 상시 문구는 소음이다.
        `,
      },
    },
  },
};

/* 시나리오 기준일(8/7)까지의 일별 합성 — 누적 spend를 균등 분배하므로
   표의 Total이 위 Spend 줄(632.98)과 정확히 같아야 정상이다. */
const DAILY_ROWS = spreadDailyOverCampaign(CAMPAIGN, PERFORMANCE, '2026-08-07');

function Harness({ campaign, performance, dailyRows, adsManagerHref, billingHref }) {
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
          dailyRows={dailyRows}
          accountLabel="TikTok Unified"
          adsManagerHref={adsManagerHref}
          billingHref={billingHref}
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
 * - `Reach · Plays · Comments · Shares · Follows · Visits`까지 전 지표가 보인다
 * - `Avg Watch`는 `1.01s` — TikTok이 준 소수를 그대로 쓴다
 * - **Daily spend 표** — 날짜당 한 행(7/6~8/7), 표 안 스크롤(stickyHeader),
 *   Total이 위 Spend 줄($632.98)과 같은 값이다. Reports의 Daily spend 표는
 *   필터 집합의 합이라 캠페인 하나만 가르는 건 이 패널의 몫이다
 */
export const WithPerformance = {
  render: () => <Harness campaign={CAMPAIGN} performance={PERFORMANCE} dailyRows={DAILY_ROWS} />,
};

/**
 * 일별 데이터가 없는 캠페인 — 수동 등록이거나 아직 backfill 전이다.
 *
 * 확인 포인트: Daily spend 섹션이 **제목까지 통째로 없다.** 수동 등록 캠페인은
 * 일별 데이터가 영영 없어서, 상시 빈 상태 문구는 안내가 아니라 소음이 된다
 * (Reports 본문 표가 빈 상태를 문구로 말하는 것과 반대인 이유 — 거기는 동기화
 * 전의 일시적 상태라 "고장 아님"을 말할 필요가 있다).
 */
export const NoDailyData = {
  render: () => <Harness campaign={CAMPAIGN} performance={PERFORMANCE} dailyRows={[]} />,
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
 * 외부 링크가 셋 다 있는 캠페인.
 *
 * 확인 포인트:
 * - `View ad` — creativeUrl(수동, 우선) 또는 adLink(동기화)가 있을 때 나타난다
 * - `Ads Manager` — adsManagerHref가 넘어왔을 때만(Meta 캠페인) 나타난다
 * - `Billing` — billingHref가 넘어왔을 때만. 계정의 청구 내역
 *   (Meta: Billing & payments → Payment activity)으로 간다 — 인보이스를 뽑는 자리다
 * - 전부 새 탭(target=_blank)이고, 없는 링크는 빈 버튼 대신 아예 안 그린다
 * - **문 네 개가 한 줄**에 들어간다(패널 폭 560 고정). 라벨을 늘리면 접힌다
 */
export const WithExternalLinks = {
  render: () => (
    <Harness
      campaign={{ ...CAMPAIGN, id: 'c-3', platform: PLATFORM.META, creativeUrl: '', adLink: 'https://www.facebook.com/1234567890/posts/9876543210' }}
      performance={PERFORMANCE}
      adsManagerHref="https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=123&selected_campaign_ids=456"
      billingHref="https://business.facebook.com/billing_hub/payment_activity?asset_id=123"
    />
  ),
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
