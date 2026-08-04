import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function fmtNumber(value) {
  return value.toLocaleString('en-US');
}

function fmtSeconds(value) {
  return `${value.toFixed(2)}s`;
}

/**
 * 표시할 지표와 순서. 영상 지표(재생 → 완전 시청 → 평균 시청)를 먼저,
 * 상호작용(좋아요/댓글/공유)을 다음, 획득(팔로우/프로필 방문)을 마지막에 둔다 —
 * "얼마나 봤나 → 얼마나 반응했나 → 얼마나 남았나" 순서로 읽히게.
 */
const FIELDS = [
  { key: 'videoPlays', label: 'Video Plays', format: fmtNumber },
  { key: 'heldViews', label: 'Held Views', format: fmtNumber },
  { key: 'avgWatchSeconds', label: 'Avg Watch', format: fmtSeconds },
  { key: 'likes', label: 'Likes', format: fmtNumber },
  { key: 'comments', label: 'Comments', format: fmtNumber },
  { key: 'shares', label: 'Shares', format: fmtNumber },
  { key: 'follows', label: 'Follows', format: fmtNumber },
  { key: 'profileVisits', label: 'Profile Visits', format: fmtNumber },
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
 * @param {object} metrics - 성과 레코드. videoPlays/heldViews/avgWatchSeconds/likes/comments/shares/follows/profileVisits를 읽는다 [Required]
 * @param {string} title - 목록 위 라벨 [Optional, 기본값: 'Platform Metrics']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <PlatformMetricList metrics={ performanceRecord } />
 */
export function PlatformMetricList({ metrics, title = 'Platform Metrics', sx }) {
  const rows = FIELDS
    .filter((field) => metrics?.[field.key] != null)
    .map((field) => ({ label: field.label, value: field.format(metrics[field.key]) }));

  if (rows.length === 0) return null;

  return (
    <Box sx={ sx }>
      <Typography
        variant="overline"
        sx={ { display: 'block', mb: 1, fontWeight: 700, color: 'text.primary', letterSpacing: '0.08em' } }
      >
        { title }
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={ { display: 'block', mb: 1.5 } }>
        플랫폼에서 자동 수집된 값입니다. 직접 수정할 수 없습니다.
      </Typography>

      <Stack
        component="dl"
        spacing={ 0 }
        sx={ { m: 0, borderTop: 1, borderColor: 'divider' } }
      >
        { rows.map((row) => (
          <Box
            key={ row.label }
            sx={ {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 2,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider',
            } }
          >
            <Typography component="dt" variant="body2" color="text.secondary">
              { row.label }
            </Typography>
            <Typography
              component="dd"
              variant="body2"
              sx={ { m: 0, fontWeight: 600, fontVariantNumeric: 'tabular-nums' } }
            >
              { row.value }
            </Typography>
          </Box>
        )) }
      </Stack>
    </Box>
  );
}
