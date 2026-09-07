import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { ScrollArea } from '../container/ScrollArea';
import { t, metricLabel } from '../../data/recapStrings';
import { money, percent, dateRange, EMPTY } from '../../utils/format';

const fmtPercent = (v) => percent(v, { digits: 2 });
const MONEY_KEYS = new Set(['cpm', 'cpc', 'cpa', 'cpe']);

/**
 * PeerCompareDialog 컴포넌트
 *
 * 캠페인 하나와 그 비교군을 **나란히** 놓는 대화상자. Recap 표의 벤치마크는
 * 중앙값 하나만 말하는데, "BF4 Grand Opening보다 나았나"처럼 개별 캠페인과
 * 맞대고 싶을 때 벤치마크 글자를 눌러 연다. 첫 행이 주인공(강조), 나머지가
 * 비교군이고, 지표 열 머리를 누르면 그 열로 정렬된다 — 비용 지표(CPM·CPC·CPA)는
 * 낮은 값이 위로 온다.
 *
 * 계산은 하지 않는다 — rows는 schema.js buildPeerComparison() 결과(주인공 +
 * 비교군, 지표 값 포함)다. 이 컴포넌트는 정렬 방향을 바꾸는 것만 한다(정렬 자체는
 * 이미 계산된 값의 순서 바꾸기라 표 안에서 한다).
 *
 * Props:
 * @param {boolean} isOpen - 열림 여부 [Required]
 * @param {function} onClose - 닫기 () => void [Required]
 * @param {Array<Object>} rows - buildPeerComparison().rows — 첫 행이 주인공(isSubject) [Required]
 * @param {'phase'|'goal'|'none'} scope - 비교군을 어떤 기준으로 잡았나 [Required]
 * @param {string[]} metricKeys - 열로 보여줄 지표 키(BENCHMARK_METRICS의 key) [Required]
 * @param {string} initialMetricKey - 처음 정렬 기준 [Optional, 기본값: metricKeys[0]]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 *
 * Example usage:
 * <PeerCompareDialog isOpen onClose={close} rows={comparison.rows} scope={comparison.scope} metricKeys={['cpm', 'hookRate', 'holdRate']} initialMetricKey="hookRate" />
 */
export function PeerCompareDialog({ isOpen, onClose, rows, scope, metricKeys, initialMetricKey, lang = 'en' }) {
  const [sortKey, setSortKey] = useState(initialMetricKey ?? metricKeys[0]);
  const subject = rows.find((r) => r.isSubject) ?? rows[0];
  const lowerIsBetter = MONEY_KEYS.has(sortKey);

  const peers = rows.filter((r) => !r.isSubject).slice().sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return lowerIsBetter ? av - bv : bv - av;
  });
  const ordered = subject ? [subject, ...peers] : peers;

  const scopeText = scope === 'phase'
    ? t('recap.compare.scope.phase', lang, { phase: subject?.phaseName ?? '' })
    : scope === 'goal'
      ? t('recap.compare.scope.goal', lang, { goal: subject?.goal ?? '' })
      : t('recap.compare.scope.none', lang);

  const format = (key, v) => (v == null ? EMPTY : MONEY_KEYS.has(key) ? money(v) : fmtPercent(v));

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {t('recap.compare.title', lang)}
        <Typography component="span" variant="body2" sx={{ display: 'block', fontWeight: 400, color: 'text.secondary', mt: 0.5 }}>
          {scopeText}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 0, pb: 0 }}>
        <Typography variant="caption" sx={{ display: 'block', px: 3, pb: 1, color: 'text.secondary' }}>{t('recap.compare.hint', lang)}</Typography>
        <ScrollArea label={t('recap.compare.title', lang)} startOffset={0}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3 }}>{t('recap.compare.event', lang)}</TableCell>
                <TableCell>{t('recap.table.campaign', lang)}</TableCell>
                <TableCell>{t('recap.compare.period', lang)}</TableCell>
                <TableCell align="right">{t('recap.table.spend', lang)}</TableCell>
                {metricKeys.map((key) => (
                  <TableCell key={key} align="right" sortDirection={sortKey === key ? (MONEY_KEYS.has(key) ? 'asc' : 'desc') : false}>
                    <TableSortLabel
                      active={sortKey === key}
                      direction={MONEY_KEYS.has(key) ? 'asc' : 'desc'}
                      onClick={() => setSortKey(key)}
                    >
                      {metricLabel(key, lang)}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ordered.map((r) => (
                <TableRow
                  key={r.campaignId}
                  sx={r.isSubject ? { backgroundColor: 'accent.tint', '& td': { fontWeight: 600 } } : undefined}
                >
                  <TableCell sx={{ pl: 3, whiteSpace: 'nowrap' }}>{r.eventName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }} title={r.name}>{r.phaseName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{dateRange(r.startDate, r.endDate)}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{money(r.spend)}</TableCell>
                  {metricKeys.map((key) => (
                    <TableCell key={key} align="right" sx={{ fontVariantNumeric: 'tabular-nums', ...(sortKey === key && { color: 'text.primary' }) }}>
                      {format(key, r[key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('recap.compare.close', lang)}</Button>
      </DialogActions>
    </Dialog>
  );
}
