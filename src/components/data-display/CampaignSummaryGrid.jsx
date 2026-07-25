import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

/**
 * StatCard — CampaignSummaryGrid의 개별 항목
 * @param {string} label
 * @param {string|number} value
 * @param {string} sub
 * @param {boolean} accent
 */
function StatCard({ label, value, sub, accent = false }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        p: 2.5,
        height: '100%',
      }}
    >
      {/* KpiBar 등 앱 전체의 "작은 라벨" 표기와 같은 테마 overline variant를
          쓴다 — 이전엔 caption + fontSize 11 수동 지정이라 letter-spacing·
          weight가 다른 라벨들과 미묘하게 어긋나 있었다. */}
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: 'block', mb: 1, lineHeight: 1 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: accent ? 'primary.main' : 'text.primary',
        }}
      >
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}

/**
 * CampaignSummaryGrid 컴포넌트
 *
 * /reports 페이지 상단에 쓰이는 요약 스탯 카드 그리드.
 * Influencer Tracking Dashboard의 CampaignSummaryGrid(StatCard 패턴)를
 * 도메인 특정 필드 대신 범용 items 배열로 일반화했다.
 *
 * Props:
 * @param {Array<{ label: string, value: string|number, sub?: string, accent?: boolean }>} items - 스탯 항목 배열 [Required]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <CampaignSummaryGrid
 *   items={[
 *     { label: '총 캠페인', value: 11 },
 *     { label: '총 집행 예산', value: '$2,580', accent: true },
 *     { label: '평균 CTR', value: '1.2%', sub: '전체 캠페인 평균' },
 *   ]}
 * />
 */
export function CampaignSummaryGrid({ items, sx }) {
  return (
    <Grid container spacing={2} sx={sx}>
      {items.map((item) => (
        <Grid key={item.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label={item.label} value={item.value} sub={item.sub} accent={item.accent} />
        </Grid>
      ))}
    </Grid>
  );
}
