import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { t, metricLabel, benchmarkPositionText } from '../../data/recapStrings';

/** 칸 → 보조 색. 결론 글자가 주인공이라 색은 라벨 옆 아이콘에만 */
const COLUMN_TONE = { best: 'success.main', attention: 'warning.main', next: 'accent.main' };

/**
 * 라벨 옆 얇은 선 아이콘(Lucide 기하) — circle-check / circle-alert / arrow-right.
 * 14px, stroke 1.5, fill 없음. 아이콘 라이브러리를 늘리지 않는다.
 */
function ColumnIcon({ kind }) {
  const paths = {
    best: [<circle key="c" cx="12" cy="12" r="10" />, <path key="p" d="m9 12 2 2 4-4" />],
    attention: [<circle key="c" cx="12" cy="12" r="10" />, <path key="l" d="M12 8v4" />, <path key="d" d="M12 16h.01" />],
    next: [<path key="a" d="M5 12h14" />, <path key="b" d="m12 5 7 7-7 7" />],
  }[kind];
  return (
    <Box component="svg" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden sx={{ flexShrink: 0, fill: 'none', color: COLUMN_TONE[kind] }}>
      {paths}
    </Box>
  );
}

/** 문장 조립은 recapStrings에서만 — 여기서는 어느 문구에 어느 재료를 넣을지 고른다 */
function columnsFor(summary, platformLabel, lang) {
  const platform = (p) => platformLabel[p] ?? p;
  const aspect = (a) => t(`aspect.${a}`, lang);
  const best = summary.best
    ? { headline: `${platform(summary.best.platform)} ${summary.best.phaseName}`, evidence: t('recap.exec.best.evidence', lang, { aspect: aspect(summary.best.aspect), metric: metricLabel(summary.best.metricKey, lang), position: benchmarkPositionText(summary.best.stat, lang) }) }
    : null;
  const attention = summary.attention
    ? { headline: `${platform(summary.attention.platform)} ${summary.attention.phaseName}`, evidence: t('recap.exec.attention.evidence', lang, { aspect: aspect(summary.attention.aspect), metric: metricLabel(summary.attention.metricKey, lang), position: benchmarkPositionText(summary.attention.stat, lang) }) }
    : { headline: t('recap.exec.attention.none', lang), evidence: t('recap.exec.attention.noneEvidence', lang) };
  let next = null;
  if (summary.next) {
    const n = summary.next;
    // 근거는 지표 하나만 — "…를 재사용 전에 점검"은 ATTENTION 칸이 이미 말해서 붙이지 않는다
    next = n.kind === 'platform'
      ? { headline: t('recap.exec.next.platform', lang, { cheaper: platform(n.cheaper) }), evidence: t('recap.exec.next.platformEvidence', lang, { pct: n.pct, pricier: platform(n.pricier) }) }
      : { headline: t('recap.exec.next.best', lang, { platform: platform(n.platform), phase: n.phaseName }), evidence: t('recap.exec.next.bestEvidence', lang) };
  }
  return [
    { kind: 'best', ...best },
    { kind: 'attention', ...attention },
    { kind: 'next', ...next },
  ].filter((c) => c.headline);
}

/**
 * RecapTakeaways 컴포넌트
 *
 * 보고서 머리글과 타임라인 사이의 **임원용 핵심 요약** — 세 칸 한 줄: BEST RESULT ·
 * ATTENTION · NEXT MOVE. 각 칸은 작은 라벨 → 큰 결론 한 줄 → 작은 근거 한 줄이라
 * 가운데 줄만 읽어도 "무엇이 이겼고, 무엇을 봐야 하고, 다음에 뭘 할지"가 잡힌다.
 * 표에 있는 숫자를 나열하지 않고 가장 강한 근거 하나만 붙인다.
 *
 * 계산은 하지 않는다 — summary는 schema.js buildRecapExecutiveSummary() 결과이고,
 * 문장은 recapStrings가 만든다. 근거가 없어 best·next가 모두 비면 "아직 결론을
 * 내릴 수 없다"고만 말한다. 색은 라벨 아이콘에만(success / warning / accent).
 *
 * Props:
 * @param {{ best: Object|null, attention: Object|null, next: Object|null }} summary - buildRecapExecutiveSummary() 결과 [Required]
 * @param {Object<string, string>} platformLabel - 플랫폼 값 → 표시명(예: { meta: 'Meta' }) [Optional, 기본값: {}]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapTakeaways summary={buildRecapExecutiveSummary(byPlatform)} platformLabel={PLATFORM_LABEL} lang={lang} />
 */
export function RecapTakeaways({ summary, platformLabel = {}, lang = 'en', sx }) {
  if (!summary || (!summary.best && !summary.next)) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5, ...sx }}>
        {t('recap.takeaways.empty', lang)}
      </Typography>
    );
  }
  const columns = columnsFor(summary, platformLabel, lang);
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: `repeat(${columns.length}, minmax(0, 1fr))` },
        ...sx,
      }}
    >
      {columns.map((col, i) => (
        <Box
          key={col.kind}
          sx={{
            minWidth: 0,
            px: 2.5,
            py: 2.25,
            // 칸 사이는 카드가 아니라 얇은 구분선 하나 — 데스크톱은 세로선, 모바일은 가로선
            borderLeft: { xs: 0, md: i > 0 ? '1px solid' : 0 },
            borderTop: { xs: i > 0 ? '1px solid' : 0, md: 0 },
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
            <ColumnIcon kind={col.kind} />
            <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1 }}>
              {t(`recap.exec.label.${col.kind}`, lang)}
            </Typography>
          </Box>
          <Typography component="p" sx={{ m: 0, fontSize: 16, fontWeight: 600, color: 'text.primary', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
            {col.headline}
          </Typography>
          {col.evidence && (
            <Typography component="p" sx={{ m: 0, mt: 0.5, fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
              {col.evidence}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
