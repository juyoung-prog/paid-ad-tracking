import Box from '@mui/material/Box';
import { PlatformMetricList } from './PlatformMetricList';

export default {
  title: 'Paid Ads Dashboard/Data Display/PlatformMetricList',
  component: PlatformMetricList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## PlatformMetricList

플랫폼 API가 수집한 성과 지표를 읽기 전용으로 보여준다. 사용자가 값을 넣는
PerformanceForm과 짝을 이루는 반대편이라 입력 필드가 아니라 라벨/값 목록으로 그린다.

값이 없는 항목은 '—'로 채우지 않고 숨긴다 — 수기 등록 캠페인이나 Meta처럼 해당
지표가 없는 플랫폼에서는 빈 줄만 늘어서서 "아직 안 왔다"인지 "원래 없다"인지
구분이 안 되기 때문이다. 하나도 없으면 아무것도 그리지 않는다.

### 세 그룹
한 열에 열여덟 줄이 같은 무게로 늘어서면 훑을 데가 없어서 **Delivery**(돈이 어디까지
갔나) → **Traffic & Engagement**(무엇을 했나) → **Video & Social**(소재가 어땠나)로
나눈다. 작은 흐린 대문자 라벨과 14px 간격만 쓰고 카드는 만들지 않는다. 값은 지표
전부 같은 무게(500)다 — 무엇이 중요한지는 캠페인 목표마다 달라서(Traffic이면 CTR)
컴포넌트가 미리 정하지 않는다.

Delivery·Traffic 그룹은 \`hasCoreMetrics\`를 켰을 때만 나온다. 옆에 입력 폼이 있는
자리(직접 등록 캠페인)에서는 같은 값이 폼 필드에 이미 있어 중복이기 때문이다.

Hook Rate / Hold Rate는 저장된 값이 아니라 schema.js의 calcHookRate/calcHoldRate로
계산한 파생 지표다 — Meta 광고 관리자와 같은 정의(hook rate = 훅시청 ÷ video plays,
hold rate = 완주 ÷ 훅시청). 훅시청의 기준이 플랫폼마다 달라(Meta 3초 / TikTok 2초 재생)
목록 위에 \`Metric definitions vary by platform.\` 한 줄 + ⓘ를 두고, 전문은 그
툴팁에 넣는다 — 설명 세 줄이 지표보다 먼저 읽히면 안 되지만, 같은 이름의 숫자를
그대로 비교하면 틀리기 때문에 신호 자체는 남긴다.
        `,
      },
    },
  },
  argTypes: {
    metrics: { control: 'object', description: '성과 레코드. 영상·소셜 10개 + (hasCoreMetrics면) 핵심 10개를 읽는다' },
    title: { control: 'text', description: '목록 위 소제목(13px 600 문장형)' },
    hasCoreMetrics: { control: 'boolean', description: 'Spend·Impressions·Reach·CPM·Clicks·CTR·CPC·Engagements·Conversions·CPA를 앞에 붙인다 — 입력 폼이 없는 동기화 캠페인 드로어 전용' },
    sx: { control: 'object', description: '추가 스타일' },
  },
};

/**
 * TikTok에서 실제로 수집되는 형태 — 영상·소셜 지표가 모두 있는 경우.
 *
 * `hasCoreMetrics`가 꺼져 있어 `VIDEO & SOCIAL` 그룹 하나만 나온다(핵심 지표는
 * 입력 폼이 옆에 있는 자리라 중복이므로 안 붙인다). 세 그룹이 다 보이는 모습은
 * 아래 `SyncedCampaign` 스토리에서 확인한다.
 */
export const Default = {
  args: {
    metrics: {
      // Hook Rate는 videoPlays(hookViews ÷ videoPlays), Hold Rate는 hookViews(heldViews ÷ hookViews)가 있어야 계산된다.
      impressions: 327786,
      hookViews: 22723,
      videoPlays: 325147,
      heldViews: 624,
      avgWatchSeconds: 1.15,
      likes: 650,
      comments: 0,
      shares: 171,
      follows: 17,
      profileVisits: 934,
    },
  },
  render: (args) => (
    <Box sx={ { maxWidth: 420 } }>
      <PlatformMetricList { ...args } />
    </Box>
  ),
};

/**
 * Meta는 캠페인 레벨에 팔로우/프로필 방문 지표가 없다. 없는 항목은 빈 줄로
 * 남지 않고 목록에서 빠진다.
 */
export const PartialMetrics = {
  args: {
    metrics: {
      impressions: 240500,
      hookViews: 18400,
      videoPlays: 88120,
      heldViews: 1240,
      avgWatchSeconds: 3.4,
      likes: 310,
      saves: 48,
      comments: 12,
      shares: 44,
      follows: null,
      profileVisits: null,
    },
  },
  render: (args) => (
    <Box sx={ { maxWidth: 420 } }>
      <PlatformMetricList { ...args } />
    </Box>
  ),
};

/**
 * 수기로 등록한 캠페인처럼 플랫폼 지표가 하나도 없으면 컴포넌트가 아무것도
 * 그리지 않는다(null 반환) — 아래 영역이 비어 보이는 게 정상이다.
 */
export const NoMetrics = {
  args: {
    metrics: { impressions: 1000, spend: 50 },
  },
  render: (args) => (
    <Box sx={ { maxWidth: 420 } }>
      <PlatformMetricList { ...args } />
    </Box>
  ),
};

/**
 * 동기화 캠페인 드로어가 쓰는 형태 — `hasCoreMetrics`로 핵심 지표까지 붙어
 * **세 그룹이 다 보이는** 유일한 스토리다. 폼이 없는 자리라 Spend·Clicks 같은
 * 값도 여기서만 읽을 수 있다(폼이 있으면 같은 값이 필드에 이미 있어 중복이다).
 *
 * 확인 포인트:
 * - `DELIVERY` / `TRAFFIC & ENGAGEMENT` / `VIDEO & SOCIAL` 세 그룹으로 갈리는가
 * - 그룹 라벨은 11px 흐린 대문자로, 위의 소제목("Platform metrics")보다 한 단 아래인가
 * - CPM·CTR·CPC·CPA는 저장된 값이 아니라 **계산값**이다(schema의 calc 함수) —
 *   Spend÷Impressions×1000 = $2.41처럼 맞아떨어지는지
 * - 지표 값이 **전부 같은 굵기(500)**인가 — 한때 Spend·CPM·Hook/Hold Rate만
 *   600이었는데, 무엇이 중요한지는 캠페인 목표마다 달라서 컴포넌트가 미리 정하지 않는다
 * - "Collected automatically…" 캡션이 **없다** — 바로 위 "Synced from … Ads Manager"가
 *   같은 말을 하므로 이 모드에서는 생략한다
 */
export const SyncedCampaign = {
  args: {
    hasCoreMetrics: true,
    metrics: {
      spend: 1119.3,
      impressions: 464425,
      reach: 163290,
      clicks: 0,
      engagements: 564,
      conversions: 0,
      videoPlays: 295857,
      hookViews: 68370,
      heldViews: 2414,
      avgWatchSeconds: 1.42,
      likes: 490,
      comments: 1,
      shares: 73,
      follows: 183,
      profileVisits: 230,
    },
  },
  render: (args) => (
    <Box sx={ { maxWidth: 420 } }>
      <PlatformMetricList { ...args } />
    </Box>
  ),
};
