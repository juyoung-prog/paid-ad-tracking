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

/**
 * PerformanceReportTable 컴포넌트
 *
 * 성과 보고서(/reports)의 캠페인별 지표 표. rows는 schema.js의
 * getCampaignMetricsRow()로 미리 계산해서 넘겨야 한다 — 이 컴포넌트는
 * CPM/CTR/CPC를 직접 계산하지 않는다. 가로 폭이 좁아지면 컨테이너 자체가
 * 스크롤되도록 처리해 표가 페이지 레이아웃을 밀어내지 않게 한다
 * (overflow-containment).
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
