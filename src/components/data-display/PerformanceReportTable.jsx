import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

function fmtCurrency(value) {
  if (value == null) return '—';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNumber(value) {
  if (value == null) return '—';
  return value.toLocaleString('en-US');
}

function fmtPercent(value) {
  if (value == null) return '—';
  return `${(value * 100).toFixed(2)}%`;
}

function fmtSeconds(value) {
  if (value == null) return '—';
  return `${value.toFixed(2)}s`;
}

// 소재·상호작용 지표. 계산값이 아니라 플랫폼이 준 원본이라 이 컴포넌트는 그대로 그린다.
// 수기 입력 레코드에는 없는 값이라 '—'가 나오는 게 정상이다.
const CREATIVE_COLUMNS = [
  { header: 'Video Plays', get: (r) => fmtNumber(r.videoPlays) },
  { header: 'Held Views', get: (r) => fmtNumber(r.heldViews) },
  { header: 'Avg Watch', get: (r) => fmtSeconds(r.avgWatchSeconds) },
  { header: 'Likes', get: (r) => fmtNumber(r.likes) },
  { header: 'Comments', get: (r) => fmtNumber(r.comments) },
  { header: 'Shares', get: (r) => fmtNumber(r.shares) },
  { header: 'Follows', get: (r) => fmtNumber(r.follows) },
  { header: 'Profile Visits', get: (r) => fmtNumber(r.profileVisits) },
];

/**
 * PerformanceReportTable 컴포넌트
 *
 * 성과 보고서(/reports)의 캠페인별 지표 표. rows는 schema.js의
 * getCampaignMetricsRow()로 미리 계산해서 넘겨야 한다 — 이 컴포넌트는
 * CPM/CTR/CPC를 직접 계산하지 않는다. 가로 폭이 좁아지면 컨테이너 자체가
 * 스크롤되도록 처리해 표가 페이지 레이아웃을 밀어내지 않게 한다
 * (overflow-containment).
 *
 * 뒤쪽 8개 컬럼(Video Plays~Profile Visits)은 계산값이 아니라 플랫폼이 준 원본이다.
 * API로 들어온 레코드에만 있고 수기 입력에는 없어 '—'로 그려진다.
 *
 * Props:
 * @param {Array<ReturnType<typeof import('../../data/schema').getCampaignMetricsRow>>} rows - getCampaignMetricsRow() 결과 배열 [Required]
 * @param {function} onRowClick - 행 클릭 핸들러 (campaignId) => void. 있으면 행이 tabIndex+Enter/Space로 키보드 활성화됨 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <PerformanceReportTable
 *   rows={campaigns.map((c) => getCampaignMetricsRow(c, records.find((r) => r.campaignId === c.id)))}
 *   onRowClick={(campaignId) => navigate(`/dashboard?campaign=${campaignId}`)}
 * />
 */
export function PerformanceReportTable({ rows, onRowClick, sx }) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, ...sx }}>
        No campaigns match the current filters.
      </Typography>
    );
  }

  return (
    <TableContainer sx={{ overflowX: 'auto', ...sx }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Campaign</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Platform</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Spend</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Impressions</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Clicks</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>CPM</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>CTR</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>CPC</TableCell>
            {CREATIVE_COLUMNS.map((col) => (
              <TableCell key={col.header} align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{col.header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.campaignId}
              hover
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row.campaignId) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(row.campaignId);
                      }
                    }
                  : undefined
              }
              sx={{
                cursor: onRowClick ? 'pointer' : 'default',
                ...(onRowClick && {
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
                }),
              }}
            >
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.name}</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{row.platform}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(row.spend)}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNumber(row.impressions)}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtNumber(row.clicks)}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(row.cpm)}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtPercent(row.ctr)}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCurrency(row.cpc)}</TableCell>
              {CREATIVE_COLUMNS.map((col) => (
                <TableCell key={col.header} align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{col.get(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
