import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const STATUS_META = {
  active: { label: 'Active', color: 'success.main', variant: 'filled' },
  planned: { label: 'Planned', color: 'grey.500', variant: 'outlined' },
  closed: { label: 'Closed', color: 'grey.400', variant: 'outlined' },
};

const REGION_LABEL = { GA: 'Georgia', FL: 'Florida' };

/**
 * StoreTable 컴포넌트
 *
 * 매장 관리(/stores) 페이지의 매장 목록 테이블. 코드/이름/지역/상태를 보여준다.
 * StoreBreakdown(대시보드 좌측 패널의 캠페인 수 요약)과는 목적이 달라
 * 별도 컴포넌트로 분리했다 — 여긴 매장 자체의 마스터 데이터가 관심사다.
 *
 * store.shortCode가 있는 매장이 하나라도 있으면 Legacy Code 컬럼을 추가로 보여준다
 * (사내 다른 시스템이 쓰는 매장 약어 코드 — 조지아 매장만 있고 플로리다/신규 매장엔
 * 없을 수 있어 없는 행은 "—"로 표시). 하나도 없으면 컬럼 자체를 렌더링하지 않는다.
 *
 * Props:
 * @param {Store[]} stores - 매장 목록 [Required]
 * @param {Object<string, number>} campaignCounts - storeId별 캠페인 수 { [storeId]: count }. 있을 때만 Campaigns 컬럼 노출 — schema.js의 getStoreBreakdown()로 계산해서 넘긴다(이 컴포넌트는 조인 로직을 갖지 않는다) [Optional]
 * @param {function} onRowClick - 행 클릭 핸들러 (storeId) => void. 있으면 행이 tabIndex+Enter/Space로 키보드 활성화되고 우측에 chevron이 표시된다(CampaignTable과 동일 패턴) [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <StoreTable stores={stores} campaignCounts={{ G01: 5, G02: 3 }} onRowClick={(id) => openEditStore(id)} />
 */
export function StoreTable({ stores, campaignCounts, onRowClick, sx }) {
  if (stores.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, ...sx }}>
        No stores yet.
      </Typography>
    );
  }

  const hasShortCodes = stores.some((s) => s.shortCode);

  return (
    <TableContainer sx={sx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            {hasShortCodes && <TableCell sx={{ fontWeight: 600 }}>Legacy Code</TableCell>}
            <TableCell sx={{ fontWeight: 600 }}>Region</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            {campaignCounts && <TableCell sx={{ fontWeight: 600 }} align="right">Campaigns</TableCell>}
            {onRowClick && <TableCell sx={{ width: 32 }} />}
          </TableRow>
        </TableHead>
        <TableBody>
          {stores.map((store) => {
            const statusMeta = STATUS_META[store.status] ?? STATUS_META.active;
            return (
              <TableRow
                key={store.id}
                hover
                onClick={onRowClick ? () => onRowClick(store.id) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick(store.id);
                        }
                      }
                    : undefined
                }
                // role="button"을 얹지 않는다 — TableRow(실제 <tr>)에 role을
                // 덮어쓰면 테이블 안에서 이 행이 갖던 기본 row 역할이 사라져서
                // 스크린리더의 테이블 탐색(행/열 안내, "다음 행" 명령)이 깨진다
                // (접근성 리뷰로 발견 — CampaignTable은 <div> 기반이라 같은
                // role="button" 패턴이 문제없지만, 여긴 진짜 테이블이라 다르다).
                // tabIndex+onKeyDown만으로도 키보드 조작은 그대로 된다.
                tabIndex={onRowClick ? 0 : undefined}
                sx={
                  onRowClick
                    ? {
                        cursor: 'pointer',
                        '&:focus-visible': {
                          outline: '1px solid',
                          outlineColor: 'accent.main',
                          outlineOffset: -1,
                          boxShadow: (theme) => `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                        },
                      }
                    : undefined
                }
              >
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{store.id}</TableCell>
                <TableCell>{store.name}</TableCell>
                {hasShortCodes && (
                  <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{store.shortCode ?? '—'}</TableCell>
                )}
                <TableCell>{REGION_LABEL[store.region] ?? store.region}</TableCell>
                <TableCell>
                  <Chip
                    label={statusMeta.label}
                    size="small"
                    variant={statusMeta.variant}
                    sx={{
                      ...(statusMeta.variant === 'filled'
                        ? { backgroundColor: statusMeta.color, color: 'common.white' }
                        : { borderColor: statusMeta.color, color: statusMeta.color }),
                    }}
                  />
                </TableCell>
                {campaignCounts && (
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {campaignCounts[store.id] ?? 0}
                  </TableCell>
                )}
                {onRowClick && (
                  <TableCell sx={{ p: 0 }}>
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
