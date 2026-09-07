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
const format = (key, v) => (v == null ? EMPTY : MONEY_KEYS.has(key) ? money(v) : fmtPercent(v));

/** 머리글 한 줄 — 작은 라벨 + 값. "Comparison group / Primary KPI / Current campaign" */
function HeaderLine({ label, children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '132px minmax(0, 1fr)', columnGap: 1.5, alignItems: 'baseline' }}>
      <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
      <Typography component="span" sx={{ fontSize: 13, color: 'text.primary', minWidth: 0 }}>{children}</Typography>
    </Box>
  );
}

/**
 * PeerCompareDialog 컴포넌트
 *
 * 캠페인 하나와 그 비교군을 **나란히** 놓는 대화상자 — 표의 "best of 12" 글자를 누르면
 * 열려서 그 순위의 근거를 보여준다. 머리글에 비교군(플랫폼 · 목표 · 단계 · N개, 다른 이벤트),
 * 목표의 대표 KPI(방향 · 이 캠페인 값 · #순위/N), 누른 지표가 대표 KPI와 다르면 그 줄도 적는다.
 * 대표 KPI 열은 머리·값이 한 단 강하고, 모든 행이 비어 있는 지표 열은 그리지 않는다.
 * 주인공 행은 accent 틴트 + 이름 옆 "Current" 라벨 — 정렬을 바꿔도 첫 줄에 고정하지 않는다.
 *
 * 계산은 하지 않는다 — comparison은 schema.js buildPeerComparison() 결과(비교군·순위 포함)라
 * 표의 순위와 같은 비교군·같은 값에서 나온다. 이 컴포넌트는 정렬 방향을 바꾸는 것만 한다.
 *
 * Props:
 * @param {boolean} isOpen - 열림 여부 [Required]
 * @param {function} onClose - 닫기 () => void [Required]
 * @param {Array<Object>} rows - buildPeerComparison().rows — isSubject 행이 주인공 [Required]
 * @param {'phase'|'goal'|'none'} scope - 비교군을 어떤 기준으로 잡았나 [Required]
 * @param {string[]} metricKeys - 열 후보 지표 키(BENCHMARK_METRICS의 key). 모든 행이 빈 열은 자동으로 뺀다 [Required]
 * @param {string} initialMetricKey - 처음 정렬 기준(누른 지표). 없으면 대표 KPI [Optional]
 * @param {string} primaryMetricKey - 목표의 대표 KPI(buildPeerComparison().primaryMetricKey) [Optional]
 * @param {{ rank: number, total: number, value: number, lowerIsBetter: boolean }|null} primary - 대표 KPI에서 주인공 순위 [Optional]
 * @param {{ rank: number, total: number, value: number, lowerIsBetter: boolean }|null} selected - 누른 지표가 대표 KPI와 다를 때 그 순위 [Optional]
 * @param {string} platform - 주인공 플랫폼 값 [Optional]
 * @param {string} goal - 주인공 목표 값 [Optional]
 * @param {string} phaseName - 주인공 단계 이름(scope 'phase'일 때 머리글에) [Optional]
 * @param {number} peerCount - 비교군 수 [Optional, 기본값: rows 중 비주인공 수]
 * @param {Object<string, string>} platformLabel - 플랫폼 값 → 표시명 [Optional, 기본값: {}]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 *
 * Example usage:
 * <PeerCompareDialog isOpen onClose={close} {...comparison} metricKeys={BENCHMARK_METRICS.map((m) => m.key)} initialMetricKey="hookRate" platformLabel={PLATFORM_LABEL} />
 */
export function PeerCompareDialog({ isOpen, onClose, rows, scope, metricKeys, initialMetricKey, primaryMetricKey, primary = null, selected = null, platform, goal, phaseName, peerCount, platformLabel = {}, lang = 'en' }) {
  const [sortKey, setSortKey] = useState(initialMetricKey ?? primaryMetricKey ?? metricKeys[0]);
  const subject = rows.find((r) => r.isSubject) ?? rows[0];
  const isLowerBetter = (key) => MONEY_KEYS.has(key);

  // 모든 행이 비어 있는 지표 열은 그리지 않는다 — 빈 "—" 열로 가로 폭을 쓰지 않는다
  const shownKeys = metricKeys.filter((key) => rows.some((r) => r[key] != null));
  const effectiveSort = shownKeys.includes(sortKey) ? sortKey : (shownKeys[0] ?? sortKey);

  // 주인공도 같이 정렬한다 — 강조 배경과 "Current" 라벨로 찾는다
  const ordered = rows.slice().sort((a, b) => {
    const av = a[effectiveSort]; const bv = b[effectiveSort];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return isLowerBetter(effectiveSort) ? av - bv : bv - av;
  });

  const n = peerCount ?? rows.filter((r) => !r.isSubject).length;
  const platformName = platformLabel[platform ?? subject?.platform] ?? platform ?? subject?.platform ?? '';
  const goalName = t(`goalLabel.${goal ?? subject?.goal}`, lang);
  const groupText = scope === 'none'
    ? t('recap.compare.scope.none', lang)
    : scope === 'phase'
      ? t('recap.compare.groupTextPhase', lang, { platform: platformName, goal: goalName, phase: phaseName ?? subject?.phaseName ?? '', n })
      : t('recap.compare.groupText', lang, { platform: platformName, goal: goalName, n });
  const direction = (key) => (isLowerBetter(key) ? '↓' : '↑');
  const kpiLine = (key, info) => `${metricLabel(key, lang)} ${direction(key)} · ${t(isLowerBetter(key) ? 'recap.compare.lowerBetter' : 'recap.compare.higherBetter', lang)}${info ? ` · ${format(key, info.value)} · ${t('recap.compare.rank', lang, { rank: info.rank, total: info.total })}` : ''}`;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{t('recap.compare.title', lang)}</DialogTitle>
      <DialogContent sx={{ px: 0, pb: 0 }}>
        {/* 머리글 — 비교군 · 대표 KPI · 이 캠페인의 순위를 한 줄씩. 문장 대신 라벨 → 값 */}
        <Box sx={{ display: 'grid', rowGap: 0.5, px: 3, pb: 1.5 }}>
          <HeaderLine label={t('recap.compare.group', lang)}>{groupText}</HeaderLine>
          {primaryMetricKey && scope !== 'none' && (
            <HeaderLine label={t('recap.compare.primary', lang)}>{kpiLine(primaryMetricKey, null)}</HeaderLine>
          )}
          {primary && (
            <HeaderLine label={t('recap.compare.current', lang)}>
              <Box component="span" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{format(primaryMetricKey, primary.value)} · {t('recap.compare.rank', lang, { rank: primary.rank, total: primary.total })}</Box>
            </HeaderLine>
          )}
          {selected && initialMetricKey && (
            <HeaderLine label={t('recap.compare.selected', lang)}>{kpiLine(initialMetricKey, selected)}</HeaderLine>
          )}
        </Box>
        <Typography variant="caption" sx={{ display: 'block', px: 3, pb: 1, color: 'text.secondary' }}>{t('recap.compare.hint', lang)}</Typography>
        <ScrollArea label={t('recap.compare.title', lang)} startOffset={0}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3 }}>{t('recap.compare.event', lang)}</TableCell>
                <TableCell>{t('recap.table.campaign', lang)}</TableCell>
                <TableCell>{t('recap.compare.period', lang)}</TableCell>
                <TableCell align="right">{t('recap.table.spend', lang)}</TableCell>
                {shownKeys.map((key) => (
                  <TableCell key={key} align="right" sortDirection={effectiveSort === key ? (isLowerBetter(key) ? 'asc' : 'desc') : false} sx={key === primaryMetricKey ? { fontWeight: 700, color: 'text.primary' } : undefined}>
                    <TableSortLabel active={effectiveSort === key} direction={isLowerBetter(key) ? 'asc' : 'desc'} onClick={() => setSortKey(key)}>
                      {metricLabel(key, lang)}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ordered.map((r) => (
                <TableRow key={r.campaignId} sx={r.isSubject ? { backgroundColor: 'accent.tint', '& td': { fontWeight: 600 } } : undefined}>
                  <TableCell sx={{ pl: 3, whiteSpace: 'nowrap' }}>{r.eventName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }} title={r.name}>
                    {r.phaseName}
                    {r.isSubject && (
                      /* 작은 중립 라벨 — 색 배지가 아니다. "표에서 누른 그 캠페인" */
                      <Box component="span" sx={(theme) => ({ ml: 1, px: 0.625, py: 0.125, fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', border: '1px solid', borderColor: 'divider', borderRadius: `${theme.shape.radius.inlay}px`, verticalAlign: 'middle' })}>
                        {t('recap.compare.currentLabel', lang)}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{dateRange(r.startDate, r.endDate)}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{money(r.spend)}</TableCell>
                  {shownKeys.map((key) => (
                    <TableCell key={key} align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: key === primaryMetricKey || effectiveSort === key ? 'text.primary' : 'text.secondary', ...(key === primaryMetricKey && !r.isSubject && { fontWeight: 500 }) }}>
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
