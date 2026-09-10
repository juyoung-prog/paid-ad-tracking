import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { BenchmarkArrow } from './BenchmarkArrow';
import { t, benchmarkPositionText } from '../../data/recapStrings';

/** 구간 → 톤·기호 방향. 기호는 "더 좋다/나쁘다"를 말한다(값이 높다/낮다가 아니다). mid는 기호 없음 */
const BAND_STYLE = {
  top: { tone: 'success.main', hoverTone: 'success.dark', direction: 'up' },
  mid: { tone: 'text.secondary', hoverTone: 'text.primary', direction: null },
  bottom: { tone: 'warning.main', hoverTone: 'warning.dark', direction: 'down' },
};

/* 셀 안 위계: 라벨(호출부) → **값**(가장 강하게) → 비교 줄(보조). 값은 sm에서도
   13px/600이다 — 표에서 12px/500이면 옆의 원본 지표(Reach·Plays)와 무게가 같아져
   "무엇이 판단 근거인가"가 안 보였다(경영진용 보고서 리뷰, 2026-09). */
const SIZE = {
  md: { value: 14, valueWeight: 600, caption: 11, printValue: '8.5pt', printCaption: '7pt' },
  sm: { value: 13, valueWeight: 600, caption: 10.5, printValue: '7.5pt', printCaption: '6.5pt' },
};
/* 값의 무게는 지표의 역할이 정한다(2026-09-07): 목표의 대표 KPI가 가장 강하고, 진단 지표(Hook·Hold·CTR·참여율)는
   세미볼드, 나머지 비용 지표(대표가 아닌 CPM·CPC·CPE)는 보조라 보통 굵기. 순위 글자는 그대로 */
const EMPHASIS = {
  primary: { weight: 700, color: 'text.primary' },
  diagnostic: { weight: 600, color: 'text.primary' },
  supporting: { weight: 400, color: 'text.primary' },
};

/**
 * BenchmarkDelta 컴포넌트
 *
 * 지표 값 한 개와 그 아래 "비슷한 캠페인 대비 어디쯤인가" 한 줄. Recap 표의 비율
 * 지표 셀과 KPI 옆에 쓴다. 기호(↗↘ 모양의 얇은 선 화살표)와 색이 같이 움직이되,
 * 기호는 값의 높낮이가 아니라 **좋고 나쁨**을 말한다(CPM은 낮을수록 좋아서 값이
 * 중앙값보다 낮아도 ↗). mid는 기호 없이 회색 글자. 색만으로 구분하지 않는 건 색각
 * 이상 때문. 위계는 값(굵게) → 비교 글자(보조) → 화살표(신호)다.
 *
 * 계산은 하지 않는다 — 중앙값·백분위·구간(band)은 schema.js의 benchmarkStat이
 * 정해서 넘긴다. 이 컴포넌트는 그 결과를 글자로 바꿀 뿐이다. 비교군이 부족하면
 * (peerScope 'none') 값 아래에 "vs past —"만 흐리게 적는다 — 값 자체가 없다는 뜻이 아니라 과거 비교가 없다는 뜻(툴팁 "Not enough comparison data").
 *
 * Props:
 * @param {{ value: number|null, median: number|null, percentile: number|null, sampleSize: number, peerScope: 'phase'|'goal'|'none', band: 'top'|'mid'|'bottom'|null }} stat - schema.js benchmarkStat() 결과 [Required]
 * @param {function} format - 숫자 → 표시 문자열 (utils/format의 money·percent 등). 값과 중앙값에 같이 쓴다 [Required]
 * @param {string} label - 지표 이름(툴팁 문장용, 예: "CPM") [Optional, 기본값: '']
 * @param {string} peerLabel - 비교군 이름(툴팁용, 예: "Grand Opening") [Optional, 기본값: '']
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {'sm'|'md'} size - 글자 크기 단계. 표 셀은 sm [Optional, 기본값: 'md']
 * @param {'primary'|'diagnostic'|'supporting'} emphasis - 값의 무게: 목표의 대표 KPI(700) / 진단 지표(600) / 보조 비용 지표(400). 없으면 size 기본 무게 [Optional]
 * @param {boolean} hasValue - false면 값 줄을 생략하고 비교 줄만 그린다(값을 옆 칸이 이미 보여줄 때) [Optional, 기본값: true]
 * @param {boolean} hasMedian - false면 "· median $3.59"를 줄에서 빼고 툴팁에만 남긴다 — 표 셀처럼 좁은 자리 [Optional, 기본값: true]
 * @param {function} onClick - 있으면 비교 줄이 버튼이 된다(비교군을 나란히 보는 화면을 여는 용도). 비교군이 없으면 붙지 않는다 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <BenchmarkDelta stat={row.benchmarks.cpm} format={money} label="CPM" peerLabel="Grand Opening" size="sm" />
 */
export function BenchmarkDelta({ stat, format, label = '', peerLabel = '', lang = 'en', size = 'md', emphasis, hasValue = true, hasMedian = true, onClick, sx }) {
  const sizes = SIZE[size] ?? SIZE.md;
  const valueStyle = EMPHASIS[emphasis] ?? { weight: sizes.valueWeight, color: 'text.primary' };
  const value = stat?.value != null ? format(stat.value) : t('verdict.none', lang);
  const isKnown = stat && stat.peerScope !== 'none' && stat.percentile != null;
  const band = isKnown ? (stat.band ?? 'mid') : null;
  const style = band ? BAND_STYLE[band] : null;

  const positionText = benchmarkPositionText(stat, lang);

  const tooltip = isKnown
    ? t('benchmark.tooltip', lang, {
      label,
      value,
      n: stat.sampleSize,
      median: format(stat.median),
      position: positionText,
    }) + (peerLabel ? ` ${t(stat.peerScope === 'phase' ? 'benchmark.sample.phase' : 'benchmark.sample.goal', lang, { n: stat.sampleSize, phase: peerLabel, goal: peerLabel })}` : '')
    : t('recap.table.noComparison', lang);

  return (
    <Tooltip title={tooltip} placement="top" enterDelay={400}>
      <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, ...sx }}>
        {hasValue && (
          <Typography component="span" sx={{ fontSize: sizes.value, fontWeight: valueStyle.weight, lineHeight: 1.3, fontVariantNumeric: 'tabular-nums', color: valueStyle.color, '@media print': { fontSize: sizes.printValue } }}>
            {value}
          </Typography>
        )}
        <Typography
          component={isKnown && onClick ? 'button' : 'span'}
          type={isKnown && onClick ? 'button' : undefined}
          onClick={isKnown && onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: sizes.caption,
            // 인쇄에서도 같은 문장, 크기만 종이 단위로(같은 컴포넌트가 두 매체를 그린다)
            '@media print': { fontSize: sizes.printCaption },
            lineHeight: 1.3,
            // 비교 글자는 값보다 한 단 아래 — 굵게 하지 않는다(값이 먼저 읽혀야 한다)
            fontWeight: isKnown ? 500 : 400,
            whiteSpace: 'nowrap',
            color: style ? style.tone : 'text.disabled',
            fontVariantNumeric: 'tabular-nums',
            /* 버튼일 때 — 링크처럼 보이지 않게 밑줄 없이 글자만. hover에서만 밑줄이 나와
               "비교군을 볼 수 있다"를 알린다. 포커스 링은 앱 공통(accent.ring). */
            ...(isKnown && onClick && {
              background: 'none',
              border: 0,
              p: 0,
              m: 0,
              // font 축약형은 위의 fontSize·fontWeight를 덮어써 셀 글자(13px/400)로 커졌다 — 글꼴만 물려받는다
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              // hover: 밑줄 + 같은 계열의 한 단 진한 색 — "눌러서 비교군을 볼 수 있다"
              '&:hover': { textDecoration: 'underline', textUnderlineOffset: 3, color: style?.hoverTone ?? 'text.primary' },
              '&:focus-visible': { outline: 'none', boxShadow: (theme) => `0 0 0 3px ${theme.palette.accent.ring}`, borderRadius: 2 },
            }),
          }}
        >
          {style?.direction && <BenchmarkArrow direction={style.direction} size={Math.round(sizes.caption + 1)} />}
          {positionText}
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
