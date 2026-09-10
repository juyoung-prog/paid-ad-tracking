import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { t } from '../../data/recapStrings';
import { money, moneyWhole, dateMed } from '../../utils/format';
import { phaseDisplayName } from './recapRowView';

/**
 * 인쇄용 타임라인(Gantt) — 화면 타임라인(PhaseTimelineChart)과 **같은 그림**이되 세로 Letter의
 * 좁은 폭에 맞춰 치수를 다시 잡은 것이다. transform: scale()로 화면 차트를 줄이지 않는다 —
 * 줄이면 글자가 6pt 아래로 내려가 읽히지 않고 격자가 뭉갠다. 대신 열 비율·눈금 밀도·글자 크기를
 * 인쇄용으로 따로 정한다. 표로 바꾸지 않는 이유는 표가 답하지 못하는 질문이 있기 때문이다 —
 * 어느 캠페인이 겹쳤나, 얼마나 오래 갔나는 막대의 위치와 길이가 답한다.
 */

const MS_PER_DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM-DD' -> 1970-01-01 기준 일수(UTC 기준이라 DST·타임존과 무관) */
const dayOf = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
};
const isoOf = (day) => new Date(day * MS_PER_DAY).toISOString().slice(0, 10);

/** 왼쪽 정보 열 : 막대 축 = 40 : 60. 이름·플랫폼·예산 세 줄이 들어가는 최소치이면서 축에 절반 이상을 남긴다 */
const GRID_TEMPLATE = '40% 60%';
/**
 * 눈금 밀도 — 인쇄 축은 약 436px(726px 내용 폭의 60%)이라 주 단위(11개)는 라벨이 붙는다.
 * 후보는 "달의 1일과 15일 + 기간 양 끝"이고, 앞 눈금과 이 간격(축 폭의 %)보다 가까우면 버린다.
 * 12% ≈ 52px — 7pt "Aug 15"(≈28px)에 숨 쉴 틈을 더한 값.
 */
const MIN_TICK_GAP_PCT = 12;
/** 이보다 좁은 월 구간에는 월 라벨을 적지 않는다(다음 달 라벨과 겹친다) */
const MIN_MONTH_LABEL_PCT = 11;
/** 이보다 좁은 막대는 양 끝 날짜를 따로 못 적어 한 줄로 합친다 */
const MIN_TWO_LABEL_PCT = 30;

const BAR_HEIGHT = 4;
const DOT_SIZE = 6;

const PT = { name: '9pt', meta: '7.5pt', month: '8pt', tick: '7pt', date: '7pt' };

/** 축 양 끝에 붙은 라벨이 잘리지 않게 정렬 기준을 바꾼다 */
const edgeAwareShift = (pct) => {
  if (pct < 8) return 'none';
  if (pct > 92) return 'translateX(-100%)';
  return 'translateX(-50%)';
};

/** 막대 옆 예산 문구 — 값이 없는 쪽은 통째로 뺀다(0을 "$0"으로 찍으면 "0으로 계획했다"로 읽힌다) */
function budgetLine(phase, spent, lang) {
  return [
    phase.totalDaily ? t('recap.table.perDay', lang, { amount: moneyWhole(phase.totalDaily) }) : null,
    phase.totalBudget > 0 ? t('recap.table.planned', lang, { amount: moneyWhole(phase.totalBudget) }) : null,
    spent != null ? t('recap.table.spent', lang, { amount: money(spent) }) : null,
  ].filter(Boolean).join(' · ');
}

/**
 * RecapPrintTimeline 컴포넌트
 *
 * 인쇄본(Letter 세로)의 타임라인 — 왼쪽은 캠페인 정보(이름 / 플랫폼 / 예산·지출), 오른쪽은
 * 실제 날짜에 비례하는 가로 막대다. 월 라벨(Jun 2026 …)은 자기 구간 위에, 날짜 눈금은 달의
 * 1일·15일과 기간 양 끝에서 겹치지 않는 것만 남긴다. 막대 양 끝에는 점과 시작·종료일이 붙어
 * "언제 시작해 언제 끝났고 어디가 겹쳤나"를 눈으로 읽게 한다.
 *
 * 계산은 하지 않는다 — phases는 paidAdsPageUtils buildPhaseTimeline()의 결과 그대로다.
 * 색은 흑백 출력에서 살아남는 중립 회색 하나뿐이다(화면의 파랑 강조는 인쇄에서 쓰지 않는다).
 *
 * Props:
 * @param {Array<{key: string, name: string, platformLabel: string, startDate: string, endDate: string, totalDaily: number|null, totalBudget: number}>} phases - buildPhaseTimeline() 결과 [Required]
 * @param {Object} phaseSpend - phase.key → 지출 합 [Optional, 기본값: {}]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 *
 * Example usage:
 * <RecapPrintTimeline phases={phases} phaseSpend={spendByPhaseKey} />
 */
export function RecapPrintTimeline({ phases, phaseSpend = {}, lang = 'en' }) {
  if (!phases || phases.length === 0) return null;

  const startDay = dayOf(phases.reduce((min, p) => (p.startDate < min ? p.startDate : min), phases[0].startDate));
  const endDay = dayOf(phases.reduce((max, p) => (p.endDate > max ? p.endDate : max), phases[0].endDate));
  const spanDays = Math.max(endDay - startDay, 1);
  /* 축은 데이터보다 조금 넓다 — 끝점 원과 날짜 라벨이 셀 가장자리에 붙지 않게(전체의 4%, 최소 이틀) */
  const pad = Math.max(2, Math.round(spanDays * 0.04));
  const axisStart = startDay - pad;
  const axisSpan = spanDays + pad * 2;
  const pct = (day) => ((day - axisStart) / axisSpan) * 100;
  const pctOf = (iso) => pct(dayOf(iso));

  /* 눈금 후보 — 기간 양 끝 + 각 달의 1일·15일. 가까운 것부터 버려 세로 폭에서도 라벨이 겹치지 않는다.
     양 끝은 축의 범위를 말하므로 항상 남긴다. */
  const candidates = new Set([startDay, endDay]);
  {
    const first = new Date(startDay * MS_PER_DAY);
    let y = first.getUTCFullYear();
    let m = first.getUTCMonth();
    while (Date.UTC(y, m, 1) / MS_PER_DAY <= endDay) {
      [1, 15].forEach((d) => {
        const day = Math.round(Date.UTC(y, m, d) / MS_PER_DAY);
        if (day > startDay && day < endDay) candidates.add(day);
      });
      m += 1;
      if (m === 12) { m = 0; y += 1; }
    }
  }
  const sorted = [...candidates].sort((a, b) => a - b);
  const ticks = [];
  sorted.forEach((day) => {
    if (day === endDay) return;
    if (ticks.length === 0 || pct(day) - pct(ticks[ticks.length - 1]) >= MIN_TICK_GAP_PCT) ticks.push(day);
  });
  // 마지막 눈금이 끝과 너무 가까우면 그것을 버린다 — 끝 날짜 라벨이 먼저다
  if (ticks.length > 0 && pct(endDay) - pct(ticks[ticks.length - 1]) < MIN_TICK_GAP_PCT) ticks.pop();
  ticks.push(endDay);

  /* 월 구간 — 라벨은 각 달의 시작(첫 달은 기간 시작)에, 경계선은 1일에. 좁은 구간은 라벨을 건너뛴다 */
  const months = [];
  {
    const first = new Date(startDay * MS_PER_DAY);
    let y = first.getUTCFullYear();
    let m = first.getUTCMonth();
    while (Date.UTC(y, m, 1) / MS_PER_DAY <= endDay) {
      const monthStartDay = Math.round(Date.UTC(y, m, 1) / MS_PER_DAY);
      const nextStartDay = Math.round(Date.UTC(y, m + 1, 1) / MS_PER_DAY);
      const labelDay = Math.max(monthStartDay, startDay);
      months.push({
        key: `${y}-${m}`,
        label: `${MONTHS[m]} ${y}`,
        labelDay,
        boundaryDay: monthStartDay > startDay ? monthStartDay : null,
        showLabel: pct(Math.min(nextStartDay, endDay)) - pct(labelDay) >= MIN_MONTH_LABEL_PCT,
      });
      m += 1;
      if (m === 12) { m = 0; y += 1; }
    }
  }
  const monthStarts = months.map((mo) => mo.boundaryDay).filter((d) => d != null);

  const gridLines = (
    <>
      {ticks.map((day) => (
        <Box key={`t-${day}`} aria-hidden sx={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(day)}%`, borderLeft: '0.5pt solid', borderColor: 'chart.grid' }} />
      ))}
      {monthStarts.map((day) => (
        <Box key={`m-${day}`} aria-hidden sx={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(day)}%`, borderLeft: '0.5pt solid', borderColor: 'chart.gridStrong' }} />
      ))}
    </>
  );

  return (
    <Box sx={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      {/* 축 머리 — 월 라벨(위)과 날짜 눈금(아래). 왼쪽 칸은 열 이름 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: GRID_TEMPLATE, borderBottom: '0.5pt solid', borderColor: 'divider' }}>
        <Typography component="div" sx={{ fontSize: PT.tick, fontWeight: 600, color: 'text.secondary', alignSelf: 'end', pb: '3pt', pr: '6pt' }}>
          {t('recap.table.campaign', lang)}
        </Typography>
        <Box aria-hidden sx={{ position: 'relative', height: '30pt', borderLeft: '0.5pt solid', borderColor: 'divider' }}>
          {months.map((mo) => mo.showLabel && (
            <Typography
              key={mo.key}
              component="div"
              sx={{ position: 'absolute', top: '2pt', left: `${pct(mo.labelDay)}%`, pl: '3pt', fontSize: PT.month, fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}
            >
              {mo.label}
            </Typography>
          ))}
          {ticks.map((day) => (
            <Typography
              key={day}
              component="div"
              sx={{
                position: 'absolute',
                bottom: '3pt',
                left: `${pct(day)}%`,
                transform: edgeAwareShift(pct(day)),
                fontSize: PT.tick,
                color: 'text.secondary',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {dateMed(isoOf(day))}
            </Typography>
          ))}
        </Box>
      </Box>

      {phases.map((phase, index) => {
        const startPct = pctOf(phase.startDate);
        const endPct = pctOf(phase.endDate);
        const width = Math.max(endPct - startPct, 0);
        const details = budgetLine(phase, phaseSpend[phase.key], lang);
        const dateLabelSx = {
          position: 'absolute',
          top: `calc(50% + ${DOT_SIZE / 2 + 2}px)`,
          fontSize: PT.date,
          color: 'text.secondary',
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
        };
        return (
          <Box
            key={phase.key}
            sx={{
              display: 'grid',
              gridTemplateColumns: GRID_TEMPLATE,
              breakInside: 'avoid',
              pageBreakInside: 'avoid',
              borderBottom: index === phases.length - 1 ? 0 : '0.5pt solid',
              borderColor: 'divider',
            }}
          >
            {/* 이름 / 플랫폼 / 예산·지출 — 숫자는 전부 이 칸이 말하고 막대 안에는 글자가 없다 */}
            <Box sx={{ py: '5pt', pr: '8pt', minWidth: 0 }}>
              <Typography component="div" sx={{ fontSize: PT.name, fontWeight: 600, lineHeight: 1.3, color: 'text.primary', overflowWrap: 'anywhere' }}>
                {phaseDisplayName(phase.name)}
              </Typography>
              <Typography component="div" sx={{ fontSize: PT.meta, lineHeight: 1.4, color: 'text.secondary' }}>
                {phase.platformLabel || '—'}
              </Typography>
              {details && (
                <Typography component="div" sx={{ fontSize: PT.meta, lineHeight: 1.4, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                  {details}
                </Typography>
              )}
            </Box>

            {/* 막대 — 얇은 중립 회색 + 양 끝 점, 라벨은 막대 밖(아래) */}
            <Box aria-hidden sx={{ position: 'relative', minHeight: '34pt', borderLeft: '0.5pt solid', borderColor: 'divider' }}>
              {gridLines}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: `${startPct}%`,
                  width: `${width}%`,
                  height: BAR_HEIGHT,
                  transform: `translateY(-${BAR_HEIGHT * 1.5}px)`,
                  borderRadius: `${BAR_HEIGHT / 2}px`,
                  backgroundColor: 'chart.bar',
                  printColorAdjust: 'exact',
                  WebkitPrintColorAdjust: 'exact',
                }}
              />
              {[startPct, endPct].map((x, i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: `${x}%`,
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                    transform: `translate(-50%, calc(-50% - ${BAR_HEIGHT}px))`,
                    borderRadius: '50%',
                    backgroundColor: 'background.paper',
                    border: '1.5px solid',
                    borderColor: 'chart.bar',
                    boxSizing: 'border-box',
                    printColorAdjust: 'exact',
                    WebkitPrintColorAdjust: 'exact',
                  }}
                />
              ))}
              {width < MIN_TWO_LABEL_PCT ? (
                <Typography component="div" sx={{ ...dateLabelSx, left: `${(startPct + endPct) / 2}%`, transform: edgeAwareShift((startPct + endPct) / 2) }}>
                  {phase.startDate === phase.endDate ? dateMed(phase.startDate) : `${dateMed(phase.startDate)} – ${dateMed(phase.endDate)}`}
                </Typography>
              ) : (
                <>
                  <Typography component="div" sx={{ ...dateLabelSx, left: `${startPct}%`, transform: 'translateX(-3px)' }}>{dateMed(phase.startDate)}</Typography>
                  <Typography component="div" sx={{ ...dateLabelSx, left: `${endPct}%`, transform: 'translateX(calc(-100% + 3px))' }}>{dateMed(phase.endDate)}</Typography>
                </>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
