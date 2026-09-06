import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { calcHookRate, calcHoldRate, calcCPM, calcCTR, calcCPC, calcCPA } from '../../data/schema';
import { count, percent, seconds, money } from '../../utils/format';

// 표기는 utils/format.js에서만 정한다 (PerformanceReportTable과 같은 규칙).
const fmtNumber = count;
const fmtSeconds = seconds;
const fmtPercent = (value) => percent(value, { digits: 2 });

/**
 * 표시할 지표와 순서. 영상 지표(재생 → 완전 시청 → 평균 시청)를 먼저,
 * 상호작용(좋아요/댓글/공유)을 다음, 획득(팔로우/프로필 방문)을 마지막에 둔다 —
 * "얼마나 봤나 → 얼마나 반응했나 → 얼마나 남았나" 순서로 읽히게.
 */
/** 폼 상태는 문자열일 수 있다("771.2") — 빈 값은 null, 나머지는 숫자로 */
const toNumber = (value) => (value === '' || value == null ? null : Number(value));

/**
 * 핵심 지표 — 동기화 캠페인처럼 입력 폼이 없는 자리에서만 붙인다(hasCoreMetrics).
 * 입력 폼이 있으면 같은 값이 폼 필드에 이미 있어 중복이다. 단가·비율은 schema의
 * 계산 함수로 — 컴포넌트가 지표를 직접 만들지 않는다(design-system.md).
 */
const CORE_FIELDS = [
  { key: 'spend', label: 'Spend', group: 'delivery', format: money, derive: (m) => toNumber(m.spend) },
  { key: 'impressions', label: 'Impressions', group: 'delivery', format: fmtNumber, derive: (m) => toNumber(m.impressions) },
  { key: 'reach', label: 'Reach', group: 'delivery', format: fmtNumber, derive: (m) => toNumber(m.reach) },
  { key: 'clicks', label: 'Clicks', group: 'traffic', format: fmtNumber, derive: (m) => toNumber(m.clicks) },
  { key: 'ctr', label: 'CTR', group: 'traffic', format: fmtPercent, derive: (m) => calcCTR(toNumber(m.clicks), toNumber(m.impressions)) },
  { key: 'cpm', label: 'CPM', group: 'delivery', format: money, derive: (m) => calcCPM(toNumber(m.spend), toNumber(m.impressions)) },
  { key: 'cpc', label: 'CPC', group: 'traffic', format: money, derive: (m) => calcCPC(toNumber(m.spend), toNumber(m.clicks)) },
  { key: 'engagements', label: 'Engagements', group: 'traffic', format: fmtNumber, derive: (m) => toNumber(m.engagements) },
  { key: 'conversions', label: 'Conversions', group: 'traffic', format: fmtNumber, derive: (m) => toNumber(m.conversions) },
  { key: 'cpa', label: 'CPA', group: 'traffic', format: money, derive: (m) => calcCPA(toNumber(m.spend), toNumber(m.conversions)) },
];

/**
 * 지표 그룹 — 한 열로 열여덟 줄이 같은 무게로 늘어서면 훑을 데가 없다.
 * 전달(돈이 어디까지 갔나) → 트래픽·반응(무엇을 했나) → 영상·소셜(소재가
 * 어땠나) 순. 그룹 사이는 14px, 라벨은 작은 흐린 대문자 — 카드가 아니다.
 *
 * 값은 **전부 같은 무게**다. 한때 Spend·CPM·Hook Rate·Hold Rate만 600으로
 * 올렸는데, "무엇이 중요한가"는 캠페인 목표마다 다르다(Traffic 캠페인의 주인공은
 * CTR이지 Hook Rate가 아니다) — 컴포넌트가 그걸 미리 정하면 나머지 열네 줄이
 * 부차적으로 보인다. 굵기는 의미가 생길 때(임계 초과 같은 실제 상태) 쓴다.
 */
const GROUPS = [
  { key: 'delivery', label: 'Delivery' },
  { key: 'traffic', label: 'Traffic & Engagement' },
  { key: 'video', label: 'Video & Social' },
];

const HOOK_RATE_NOTE = 'Hook Rate is defined differently per platform — Meta counts a 3-second play, TikTok a 2-second play, each divided by video plays as in its Ads Manager. Avoid comparing the two directly.';

const FIELDS = [
  { key: 'videoPlays', label: 'Video Plays', group: 'video', format: fmtNumber },
  // 파생 지표. 원본 필드가 아니라 계산값이므로 derive로 뽑는다 —
  // 계산 자체는 schema.js의 순수 함수를 재사용해 표와 같은 값이 나오게 한다.
  {
    key: 'hookRate',
    label: 'Hook Rate',
    group: 'video',
    format: fmtPercent,
    derive: (m) => calcHookRate(m.hookViews ?? null, m.videoPlays ?? null),
  },
  {
    key: 'holdRate',
    label: 'Hold Rate',
    group: 'video',
    format: fmtPercent,
    derive: (m) => calcHoldRate(m.heldViews ?? null, m.hookViews ?? null),
  },
  { key: 'heldViews', label: 'Held Views', group: 'video', format: fmtNumber },
  { key: 'avgWatchSeconds', label: 'Avg Watch', group: 'video', format: fmtSeconds },
  { key: 'likes', label: 'Likes', group: 'video', format: fmtNumber },
  { key: 'comments', label: 'Comments', group: 'video', format: fmtNumber },
  { key: 'shares', label: 'Shares', group: 'video', format: fmtNumber },
  { key: 'follows', label: 'Follows', group: 'video', format: fmtNumber },
  { key: 'profileVisits', label: 'Profile Visits', group: 'video', format: fmtNumber },
];

/**
 * PlatformMetricList 컴포넌트
 *
 * 플랫폼 API가 수집한 성과 지표를 읽기 전용으로 보여준다. 사용자가 값을 넣는
 * PerformanceForm과 짝을 이루는 반대편 — 여긴 사람이 고칠 수 없는 값이라
 * 입력 필드가 아니라 라벨/값 목록으로 그린다.
 *
 * 값이 없는 항목은 '—'로 채우지 않고 아예 숨긴다. 수기 등록 캠페인이나 Meta처럼
 * 해당 지표가 없는 플랫폼에서는 대부분이 빈칸이 되는데, 빈 줄이 8개 늘어서 있으면
 * "데이터가 아직 안 왔다"인지 "이 플랫폼엔 원래 없다"인지 구분이 안 된다.
 * 하나도 없으면 컴포넌트 자체가 아무것도 그리지 않는다(null 반환).
 *
 * 좁은 Drawer 안에 들어가므로 KpiBar(가로 배치)나 CampaignSummaryGrid(h3 스탯 카드,
 * 뷰포트 기준 4컬럼)를 재사용하지 않고 세로 2단 목록으로 그린다.
 *
 * Props:
 * @param {object} metrics - 성과 레코드. videoPlays/heldViews/avgWatchSeconds/likes/comments/shares/follows/profileVisits(+hasCoreMetrics면 spend/impressions/reach/clicks/engagements/conversions)를 읽는다. 세 그룹(Delivery / Traffic & Engagement / Video & Social)으로 나눠 그린다 [Required]
 * @param {string} title - 목록 위 소제목(13px 600 문장형 — 위의 PERFORMANCE 라벨보다 한 단 아래) [Optional, 기본값: 'Platform metrics']
 * @param {boolean} hasCoreMetrics - 핵심 지표(Spend·Impressions·Reach·Clicks·CTR·CPM·CPC·Engagements·Conversions·CPA)를 목록 맨 앞에 붙인다. 입력 폼이 없는 동기화 캠페인 드로어에서만 켠다 — 폼이 있으면 같은 값이 필드에 이미 있다 [Optional, 기본값: false]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <PlatformMetricList metrics={ performanceRecord } />
 */
export function PlatformMetricList({ metrics, title = 'Platform metrics', hasCoreMetrics = false, sx }) {
  const rows = [...(hasCoreMetrics ? CORE_FIELDS : []), ...FIELDS].reduce((acc, field) => {
    const raw = field.derive ? field.derive(metrics ?? {}) : metrics?.[field.key];
    if (raw != null) acc.push({ label: field.label, value: field.format(raw), group: field.group });
    return acc;
  }, []);

  if (rows.length === 0) return null;

  const hasHookRate = rows.some((row) => row.label === 'Hook Rate');
  const groups = GROUPS.map((g) => ({ ...g, rows: rows.filter((r) => r.group === g.key) })).filter((g) => g.rows.length > 0);

  return (
    <Box sx={ sx }>
      {/* 소제목 — 위의 PERFORMANCE(label 토큰, 대문자)와 경쟁하지 않게 13px 문장형.
          그 아래 그룹 라벨(11px 대문자 흐림)이 다시 한 단 아래다. */}
      <Typography
        component="h4"
        sx={ { fontSize: 13, fontWeight: 600, lineHeight: 1.4, m: 0, mb: 0.5, color: 'text.primary' } }
      >
        { title }
      </Typography>
      {/* "수집된 값, 여기서 못 고침"은 옆에 입력 폼이 있을 때만 필요한 말이다 —
          동기화 캠페인(hasCoreMetrics)은 바로 위 "Synced from … Ads Manager"가
          이미 같은 말을 한다. */}
      { !hasCoreMetrics && (
        <Typography variant="caption" color="text.secondary" sx={ { display: 'block', mb: 1 } }>
          Collected automatically from the platform. Not editable here.
        </Typography>
      ) }

      {/* Hook Rate의 기준이 플랫폼마다 다르다는 걸 숨기면 같은 이름의 숫자를
          그대로 비교하게 되고 그 비교는 틀린다. 예전엔 설명 전문이 세 줄로 깔려
          있었는데 지표보다 먼저 읽혔다 — 한 줄 + ⓘ로 접고, 전문은 hover/탭 툴팁. */}
      { hasHookRate && (
        <Box sx={ { display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.25 } }>
          <Typography variant="caption" color="text.secondary">
            Metric definitions vary by platform.
          </Typography>
          <Tooltip title={ HOOK_RATE_NOTE } arrow enterTouchDelay={ 0 }>
            <InfoOutlinedIcon
              tabIndex={ 0 }
              aria-label="Platform metric definitions"
              sx={ (theme) => ({ fontSize: theme.iconSize.inline, color: 'text.secondary', cursor: 'help', outline: 'none' }) }
            />
          </Tooltip>
        </Box>
      ) }
      { groups.map((group, index) => (
        <Box key={ group.key } sx={ { mt: index === 0 ? 0 : 1.75 } }>
          <Typography
            component="div"
            sx={ { fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.5 } }
          >
            { group.label }
          </Typography>
          <Stack
            component="dl"
            spacing={ 0 }
            sx={ { m: 0, borderTop: 1, borderColor: 'divider' } }
          >
            { group.rows.map((row) => (
              <Box
                key={ row.label }
                sx={ {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 2,
                  // 행 30px — Campaign Details의 입력 밀도와 맞춘다(예전 7px 위아래는 폼보다 성글었다)
                  py: 0.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                } }
              >
                <Typography component="dt" variant="body2" color="text.secondary">
                  { row.label }
                </Typography>
                {/* 값은 라벨(흐린 회색 400)보다 한 단 진하다 — 색과 500 굵기로 갈리고,
                    지표끼리는 전부 같은 무게다(위 GROUPS 주석). */}
                <Typography
                  component="dd"
                  variant="body2"
                  sx={ { m: 0, color: 'text.primary', fontWeight: 500, fontVariantNumeric: 'tabular-nums' } }
                >
                  { row.value }
                </Typography>
              </Box>
            )) }
          </Stack>
        </Box>
      )) }
    </Box>
  );
}
