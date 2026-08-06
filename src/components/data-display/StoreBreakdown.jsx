import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

/**
 * StoreBreakdown 컴포넌트
 *
 * 매장별로 걸려 있는 캠페인 수를 나열하는 목록. 예산은 분배하지 않는다 —
 * all_stores 캠페인은 모든 매장에 "걸려 있는 캠페인"으로만 표시되고 금액은
 * 캠페인 단위로만 집계된다 (매장 귀속 규칙).
 *
 * rows는 schema.js의 getStoreBreakdown(stores, campaigns)으로 미리 계산해서
 * 넘겨야 한다 — 이 컴포넌트는 조인 로직을 갖지 않는다.
 *
 * onRowClick은 같은 storeId를 다시 클릭하면 해제(toggle)하는 방식으로 호출부에서
 * 구현하는 게 일반적인데(예: 대시보드의 store 필터), 그 상태가 이 목록 어디에도
 * 안 보이면 사용자가 "다시 눌러서 해제"를 발견하지 못한다 — selectedStoreId를
 * 넘기면 해당 행을 강조 표시해서 지금 필터링 중인 매장이 뭔지, 그리고 그 행을
 * 다시 누르면 풀린다는 걸 시각적으로 알 수 있게 한다. onRowClick이 있으면
 * CampaignTable·StoreTable과 동일하게 행 끝에 › 를 붙여 클릭 가능함을 미리
 * 신호한다(이게 없으면 같은 앱 안에서 "› = 클릭 가능" 규칙이 이 목록에서만 깨짐).
 *
 * Props:
 * @param {Array<{ storeId: string, storeName: string, campaigns: Array<{id: string}> }>} rows - getStoreBreakdown() 결과 [Required]
 * @param {function} onRowClick - 행 클릭 핸들러 (storeId) => void. 있으면 행이 tabIndex+Enter/Space로 키보드 활성화됨 [Optional]
 * @param {string} selectedStoreId - 현재 필터링 중인 매장 id. 일치하는 행을 강조 표시 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <StoreBreakdown
 *   rows={getStoreBreakdown(mockStores, mockCampaigns)}
 *   onRowClick={(storeId) => setFilterStore((v) => (v === storeId ? '' : storeId))}
 *   selectedStoreId={filterStore}
 * />
 */
export function StoreBreakdown({ rows, onRowClick, selectedStoreId, sx }) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, ...sx }}>
        No stores to display.
      </Typography>
    );
  }

  return (
    <TableContainer sx={sx}>
      {/* tableLayout:fixed — 기본(auto) 레이아웃은 각 열을 내용 너비에 맞춰
          늘리기 때문에, 좁은 사이드바 안에서 열이 4개(코드·이름·개수·›)가 되자
          테이블 전체 너비가 TableContainer보다 커져서 오른쪽(›)이 스크롤 밖으로
          밀려나 안 보이는 문제가 있었다. fixed로 각 열 너비를 고정하고, 남는
          공간은 매장명 열이 전부 가져가게 해서(overflow ellipsis와 함께) 항상
          컨테이너 안에 다 들어오게 한다. */}
      <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
        <TableBody>
          {rows.map((row) => {
            const isSelected = row.storeId === selectedStoreId;
            return (
            <TableRow
              key={row.storeId}
              hover={Boolean(onRowClick)}
              tabIndex={onRowClick ? 0 : undefined}
              aria-selected={onRowClick ? isSelected : undefined}
              onClick={onRowClick ? () => onRowClick(row.storeId) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(row.storeId);
                      }
                    }
                  : undefined
              }
              sx={{
                cursor: onRowClick ? 'pointer' : 'default',
                height: 40,
                ...(isSelected && { backgroundColor: 'action.selected' }),
                ...(onRowClick && {
                  '&:focus-visible': {
                    outline: '1px solid',
                    outlineColor: 'accent.main',
                    outlineOffset: -1,
                    boxShadow: (theme) => `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                  },
                }),
              }}
            >
              <TableCell sx={{ width: 36, fontFamily: 'monospace', fontSize: 12, fontWeight: 600, py: 0.5 }}>
                {row.storeId}
              </TableCell>
              {/* width 지정 없음 — tableLayout:fixed에서 나머지 열(코드·개수·›)이
                  고정폭을 가져간 나머지 공간을 이 열이 전부 받는다. 한 줄로 고정 —
                  두 줄로 넘어가면 옆 TableRow의 height:40이 더 이상 실제 행 높이를
                  보장하지 못해서(내용이 늘어나면 행도 같이 늘어난다), 긴 매장명이
                  섞인 목록에서만 리듬이 깨진다. */}
              <TableCell
                sx={{
                  fontSize: 13,
                  color: 'text.secondary',
                  py: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.storeName}
              </TableCell>
              <TableCell align="right" sx={{ width: 28, fontVariantNumeric: 'tabular-nums', fontWeight: 600, py: 0.5 }}>
                {row.campaigns.length}
              </TableCell>
              {/* CampaignTable·StoreTable과 같은 클릭 가능 신호(›) — 이게 없으면
                  똑같이 클릭되는 행인데 다른 목록과 달리 아무 표시가 없어서
                  "이 목록도 클릭되는지" 시그니파이어가 빠져 있었다(Donald Norman
                  리뷰: 이 앱 안에서 "› = 클릭 가능"이라는 학습된 규칙이 여기서만
                  깨짐). */}
              {onRowClick && (
                <TableCell sx={{ p: 0, width: 20 }}>
                  <ChevronRightIcon sx={{ color: 'text.disabled', display: 'block' }} fontSize="small" />
                </TableCell>
              )}
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
