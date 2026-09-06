import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { t } from '../../data/recapStrings';

/** 구간 → 톤·기호. 기호는 "더 좋다/나쁘다"를 말한다(값이 높다/낮다가 아니다) */
const BAND_STYLE = {
  top: { tone: 'success.main', mark: '▲ ' },
  mid: { tone: 'text.secondary', mark: '' },
  bottom: { tone: 'warning.main', mark: '▼ ' },
};

const SIZE = {
  md: { value: 13, caption: 11 },
  sm: { value: 12, caption: 10.5 },
};

/**
 * BenchmarkDelta 컴포넌트
 *
 * 지표 값 한 개와 그 아래 "비슷한 캠페인 대비 어디쯤인가" 한 줄. Recap 표의 비율
 * 지표 셀과 KPI 옆에 쓴다. KpiBar의 delta와 같은 문법 — 기호(▲▼)와 색이 같이
 * 움직이되, 기호는 값의 높낮이가 아니라 **좋고 나쁨**을 말한다(CPM은 낮을수록
 * 좋아서 값이 중앙값보다 낮아도 ▲). 색만으로 구분하지 않는 건 색각 이상 때문.
 *
 * 계산은 하지 않는다 — 중앙값·백분위·구간(band)은 schema.js의 benchmarkStat이
 * 정해서 넘긴다. 이 컴포넌트는 그 결과를 글자로 바꿀 뿐이다. 비교군이 부족하면
 * (peerScope 'none') 값 아래에 "not enough data"만 흐리게 적는다.
 *
 * Props:
 * @param {{ value: number|null, median: number|null, percentile: number|null, sampleSize: number, peerScope: 'phase'|'goal'|'none', band: 'top'|'mid'|'bottom'|null }} stat - schema.js benchmarkStat() 결과 [Required]
 * @param {function} format - 숫자 → 표시 문자열 (utils/format의 money·percent 등). 값과 중앙값에 같이 쓴다 [Required]
 * @param {string} label - 지표 이름(툴팁 문장용, 예: "CPM") [Optional, 기본값: '']
 * @param {string} peerLabel - 비교군 이름(툴팁용, 예: "Grand Opening") [Optional, 기본값: '']
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {'sm'|'md'} size - 글자 크기 단계. 표 셀은 sm [Optional, 기본값: 'md']
 * @param {boolean} hasValue - false면 값 줄을 생략하고 비교 줄만 그린다(값을 옆 칸이 이미 보여줄 때) [Optional, 기본값: true]
 * @param {boolean} hasMedian - false면 "· median $3.59"를 줄에서 빼고 툴팁에만 남긴다 — 표 셀처럼 좁은 자리 [Optional, 기본값: true]
 * @param {function} onClick - 있으면 비교 줄이 버튼이 된다(비교군을 나란히 보는 화면을 여는 용도). 비교군이 없으면 붙지 않는다 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <BenchmarkDelta stat={row.benchmarks.cpm} format={money} label="CPM" peerLabel="Grand Opening" size="sm" />
 */
export function BenchmarkDelta({ stat, format, label = '', peerLabel = '', lang = 'en', size = 'md', hasValue = true, hasMedian = true, onClick, sx }) {
  const sizes = SIZE[size] ?? SIZE.md;
  const value = stat?.value != null ? format(stat.value) : t('verdict.none', lang);
  const isKnown = stat && stat.peerScope !== 'none' && stat.percentile != null;
  const band = isKnown ? (stat.band ?? 'mid') : null;
  const style = band ? BAND_STYLE[band] : null;

  /* 양 끝은 퍼센트가 아니라 말로 — "top 0%"·"bottom 0%"는 읽히지 않는다.
     100은 비교군 전부보다 낫다는 뜻이고 0은 전부보다 못하다는 뜻이다. */
  const positionText = !isKnown
    ? t('benchmark.notEnough', lang)
    : stat.percentile >= 100
      ? t('benchmark.percentile.best', lang, { n: stat.sampleSize + 1 })
      : stat.percentile <= 0
        ? t('benchmark.percentile.lowest', lang, { n: stat.sampleSize + 1 })
        : band === 'top'
          ? t('benchmark.percentile.top', lang, { pct: 100 - stat.percentile })
          : band === 'bottom'
            ? t('benchmark.percentile.bottom', lang, { pct: stat.percentile })
            : t('benchmark.percentile.mid', lang);

  const tooltip = isKnown
    ? t('benchmark.tooltip', lang, {
      label,
      value,
      n: stat.sampleSize,
      median: format(stat.median),
      position: positionText,
    }) + (peerLabel ? ` ${t(stat.peerScope === 'phase' ? 'benchmark.sample.phase' : 'benchmark.sample.goal', lang, { n: stat.sampleSize, phase: peerLabel, goal: peerLabel })}` : '')
    : t('benchmark.notEnough', lang);

  return (
    <Tooltip title={tooltip} placement="top" enterDelay={400}>
      <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, ...sx }}>
        {hasValue && (
          <Typography component="span" sx={{ fontSize: sizes.value, fontWeight: 500, lineHeight: 1.3, fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>
            {value}
          </Typography>
        )}
        <Typography
          component={isKnown && onClick ? 'button' : 'span'}
          type={isKnown && onClick ? 'button' : undefined}
          onClick={isKnown && onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
          sx={{
            fontSize: sizes.caption,
            lineHeight: 1.3,
            fontWeight: isKnown ? 600 : 400,
            whiteSpace: 'nowrap',
            color: style ? style.tone : 'text.disabled',
            fontVariantNumeric: 'tabular-nums',
            /* 버튼일 때 — 글자만 남기고 밑줄 점선으로 "누를 수 있다"를 말한다.
               포커스 링은 앱 공통(accent.ring). */
            ...(isKnown && onClick && {
              background: 'none',
              border: 0,
              p: 0,
              m: 0,
              font: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              textDecoration: 'underline dotted',
              textUnderlineOffset: 3,
              '&:hover': { textDecorationStyle: 'solid' },
              '&:focus-visible': { outline: 'none', boxShadow: (theme) => `0 0 0 3px ${theme.palette.accent.ring}`, borderRadius: 2 },
            }),
          }}
        >
          {style?.mark}{positionText}
          {isKnown && hasMedian && (
            <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
              {' · '}{t('benchmark.vsMedian', lang, { median: format(stat.median) })}
            </Box>
          )}
        </Typography>
      </Box>
    </Tooltip>
  );
}
