import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { t, benchmarkPositionText } from '../../data/recapStrings';

/** 구간 → 톤·기호 방향. 기호는 "더 좋다/나쁘다"를 말한다(값이 높다/낮다가 아니다). mid는 기호 없음 */
const BAND_STYLE = {
  top: { tone: 'success.main', direction: 'up' },
  mid: { tone: 'text.secondary', direction: null },
  bottom: { tone: 'warning.main', direction: 'down' },
};

/**
 * 비교군 대비 위치 기호 — Lucide arrow-up-right / arrow-down-right 기하를 svg로 그린다
 * (stroke 1.5, 둥근 끝, fill 없음). 글자 ▲▼는 면으로 채운 삼각형이라 주식 시세판처럼
 * 무거웠다. 시간 추세(trending)가 아니라 **상대 위치**라 대각 화살표다. 색은
 * currentColor — 옆 글자와 같은 톤(success/warning)을 따른다.
 */
function BandArrow({ direction, size }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      sx={{ flexShrink: 0, mr: '3px', fill: 'none' }}
    >
      {direction === 'up' ? (
        <>
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </>
      ) : (
        <>
          <path d="m7 7 10 10" />
          <path d="M17 7v10" />
        </>
      )}
    </Box>
  );
}

/* 셀 안 위계: 라벨(호출부) → **값**(가장 강하게) → 비교 줄(보조). 값은 sm에서도
   13px/600이다 — 표에서 12px/500이면 옆의 원본 지표(Reach·Plays)와 무게가 같아져
   "무엇이 판단 근거인가"가 안 보였다(경영진용 보고서 리뷰, 2026-09). */
const SIZE = {
  md: { value: 14, valueWeight: 600, caption: 11 },
  sm: { value: 13, valueWeight: 600, caption: 10.5 },
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

  const positionText = benchmarkPositionText(stat, lang);

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
          <Typography component="span" sx={{ fontSize: sizes.value, fontWeight: sizes.valueWeight, lineHeight: 1.3, fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>
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
              font: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              '&:hover': { textDecoration: 'underline', textUnderlineOffset: 3 },
              '&:focus-visible': { outline: 'none', boxShadow: (theme) => `0 0 0 3px ${theme.palette.accent.ring}`, borderRadius: 2 },
            }),
          }}
        >
          {style?.direction && <BandArrow direction={style.direction} size={Math.round(sizes.caption + 1)} />}
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
