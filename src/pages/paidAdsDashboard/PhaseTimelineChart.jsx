import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { toLocalISODate } from './paidAdsPageUtils';
import { phaseDisplayName } from '../../components/data-display/recapRowView';
import { moneyWhole, dateMed, rangeDays } from '../../utils/format';

/**
 * phase 막대 옆에 붙이는 예산 문자열. 일일 예산과 총 예산을 둘 다 말한다 —
 * "하루 얼마씩 쓰는 캠페인인가"와 "이 단계에 총 얼마가 걸려 있나"는 서로 다른
 * 질문이고, 예산을 결정할 때 둘 다 필요하다. 값이 없는 쪽은 통째로 생략한다
 * (0을 "$0"으로 찍으면 "0으로 계획했다"로 읽힌다 — 동기화 캠페인은 계획 예산
 * 개념이 없어 0으로 저장된다).
 *
 * @param {{ totalDaily: number|null, totalBudget: number }} phase
 * @returns {string} 예: "$120/day · $3,600 planned" — 둘 다 없으면 빈 문자열
 */
function formatPhaseBudget(phase) {
  const parts = [];
  // 계획 예산이라 정수 표기 (utils/format.js의 moneyWhole 규칙)
  if (phase.totalDaily) parts.push(`${moneyWhole(phase.totalDaily)}/day`);
  // "planned"를 붙인다 — 옆에 실지출("… spent")이 오면 단위 없는 금액 둘이
  // 나란히 서서 어느 쪽이 계획인지 읽을 수 없었다.
  if (phase.totalBudget > 0) parts.push(`${moneyWhole(phase.totalBudget)} planned`);
  return parts.join(' · ');
}

const MS_PER_DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM-DD' -> 1970-01-01 기준 일수. UTC로 계산해 DST·타임존과 무관하다. */
function dayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** 일수 -> 'YYYY-MM-DD' */
function isoOf(day) {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** 축 눈금 후보 간격(일). 작은 것부터 시도해 눈금 수가 상한 안에 드는 첫 값을 쓴다. */
const TICK_STEP_CANDIDATES = [1, 2, 7, 14, 28];
/** 눈금 하나가 차지해야 하는 최소 폭(px) — 11px 라벨 "Aug 26"(≈38px) + 숨 쉴 틈 */
const MIN_TICK_SPACING_PX = 60;
/** 축 폭을 아직 모를 때(첫 렌더)의 눈금 수 상한 */
const FALLBACK_MAX_TICKS = 12;
/** 이보다 좁은 월 구간에는 월 라벨을 적지 않는다(라벨이 다음 달 라벨과 겹친다) */
const MIN_MONTH_LABEL_PCT = 7;
/** 이보다 좁은 막대는 양 끝 날짜를 따로 못 적어 한 줄로 합친다 */
const MIN_TWO_LABEL_PCT = 12;

/** 막대 두께와 끝점 지름 — 얇은 막대, 작은 끝점, 라벨은 막대 밖 */
const BAR_HEIGHT = 6;
const DOT_SIZE = 8;

/** hover 강조가 잡을 클래스 — 행에 마우스가 올라가면 막대·끝점·날짜가 accent로 */
const BAR_CLASS = 'ptc-bar';
const DOT_CLASS = 'ptc-dot';
const DATE_CLASS = 'ptc-date';

/**
 * 타임라인 양 끝에 붙은 라벨이 차트 밖으로 잘리지 않도록 정렬 기준을 바꾼다.
 *
 * @param {number} pct - 왼쪽에서의 위치(%)
 * @returns {string} CSS transform 값
 */
function edgeAwareShift(pct) {
  if (pct < 10) return 'none';
  if (pct > 90) return 'translateX(-100%)';
  return 'translateX(-50%)';
}

/**
 * 컬럼 폭 — 세 열이 한 그리드를 이룬다. 왼쪽 두 열(이름 320px · 플랫폼/예산
 * 300px)은 **고정폭**이고, 남는 폭은 전부 타임라인이 가진다.
 *
 * 한때 비율(fr)로 나눴는데(1.6:1.6:6.8), 비율은 화면이 넓어질수록 텍스트 열까지
 * 같이 늘려서 넓은 모니터에서 왼쪽 두 열이 700px 넘게 먹었다 — 글자는 더 길어질
 * 게 없는데 시간 축만 손해였다(실사용 지적). 텍스트 열은 내용이 들어가는 폭이면
 * 충분하고(예산 줄 `$25/day · $4,400 planned · $3,168.00 spent`가 300px에 든다),
 * 화면이 넓어지며 생기는 여유는 막대가 길어지는 데 써야 한다. 이름은 넘치면
 * 말줄임(전체는 title).
 */
const GRID_TEMPLATE = '320px 300px minmax(360px, 1fr)';
/**
 * 인쇄(Letter 세로, 내용 폭 ≈726px)의 열 비율 — 정보 40% : 축 60%. 화면과 **같은 세 열**이고 순서·내용도 같다;
 * 종이가 좁아 폭만 비율로 다시 잡는다. 화면 차트를 scale()로 줄이지 않는 이유는 글자가 6pt 아래로 내려가기 때문이다.
 */
const PRINT_GRID_TEMPLATE = '23% 17% 60%';
/** 화면·인쇄 공통 격자 정의 — 머리글 행과 본문 행이 같은 것을 쓴다 */
const GRID_SX = { display: 'grid', gridTemplateColumns: GRID_TEMPLATE, '@media print': { gridTemplateColumns: PRINT_GRID_TEMPLATE } };
/**
 * 인쇄 눈금 — 종이의 축은 약 436px이라 주 단위(열한 개)는 라벨이 붙는다. 후보는 각 달의 **1일·15일**과 기간 양 끝이고,
 * 앞 눈금과 이 간격(축 폭의 %)보다 가까우면 버린다. 12% ≈ 52px — 7pt "Aug 15"(≈28px)에 숨 쉴 틈을 더한 값.
 * 막대 위치는 눈금과 무관하게 **실제 날짜**를 쓴다(같은 pct 계산).
 */
const PRINT_MIN_TICK_GAP_PCT = 12;
/** 인쇄에서 월 라벨을 적을 최소 구간(8pt "Jun 2026" ≈ 46px) */
const PRINT_MIN_MONTH_LABEL_PCT = 11;

/**
 * 타임라인 격자 — 주 눈금은 거의 안 보이는 선, 월 경계만 divider 단계.
 * 헤더가 아니라 **각 행 안에** 그린다. 행마다 그리면 "한 행의 배경"으로 읽혀
 * 막대와 같은 층에 놓이고, 행 경계선과도 자연스럽게 끊긴다.
 */
function TimelineGrid({ ticks, printTicks, monthStarts, pct }) {
  return (
    <>
      {ticks.map((day) => (
        <Box
          key={`t-${day}`}
          aria-hidden
          sx={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(day)}%`, borderLeft: '1px solid', borderColor: 'chart.grid', '@media print': { display: 'none' } }}
        />
      ))}
      {/* 인쇄용 눈금선 — 같은 축, 같은 계산. 종이에서 라벨이 붙지 않을 만큼만 남긴 것 */}
      {printTicks.map((day) => (
        <Box
          key={`pt-${day}`}
          aria-hidden
          sx={{ display: 'none', '@media print': { display: 'block', position: 'absolute', top: 0, bottom: 0, left: `${pct(day)}%`, borderLeft: '0.5pt solid', borderColor: 'chart.grid' } }}
        />
      ))}
      {monthStarts.map((day) => (
        <Box
          key={`m-${day}`}
          aria-hidden
          sx={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(day)}%`, borderLeft: '1px solid', borderColor: 'chart.gridStrong' }}
        />
      ))}
    </>
  );
}

/**
 * PhaseTimelineChart 컴포넌트
 *
 * Event(캠페인 그룹)를 구성하는 phase들을 실제 기간에 맞춰 얇은 가로 막대로
 * 배치하는 타임라인(Gantt). 새 차트 라이브러리 없이 순수 % 위치 계산만으로
 * 그린다 — 이 화면의 다른 막대들(PacingIndicator·Budget by Platform)이 쓰는
 * 접근과 같다.
 *
 * Plan 탭과 Performance 탭이 **같은 컴포넌트를 공유한다.** 예전엔 Performance가
 * 별도의 "지표별 비교 막대"를 그려서, 같은 Event를 골라도 탭에 따라 완전히 다른
 * 그림이 나왔다(실사용 피드백). 같은 데이터를 두 가지 시각 문법으로 말하면 둘을
 * 머릿속에서 다시 맞춰야 한다 — 시간 축 하나로 통일하고, 탭별로 다른 정보는
 * 플랫폼/예산 열 뒤에 덧붙인다(barSuffix).
 *
 * ## 표 + 막대 (2026-09 리디자인, ref/re1.png)
 *
 * 왼쪽 두 열은 표다 — Campaign(이름 + 기간·일수), Platform / Budget(/ Spend).
 * 오른쪽이 시간 축인데, 막대 **안에는 아무 글자도 없다.** 예전엔 24px 막대 안에
 * 기간·예산·지출을 한 줄로 욱여넣어서 좁은 막대에서는 첫 글자만 남았고, 이름은
 * 막대 위에 떠 있어 행마다 높이가 달랐다. 이제 숫자는 전부 왼쪽 열이 말하고,
 * 막대는 "언제부터 언제까지"만 말한다. 막대 양 끝 아래에 시작·종료일을 작게
 * 적는다 — 축 눈금이 주 단위라 정확한 날짜는 막대가 스스로 밝혀야 한다.
 *
 * 막대는 기본이 **중립 회색**이고 파랑은 강조된 phase 하나에만 쓴다(오늘 진행
 * 중이거나 emphasizedKey로 지목된 것). 전에는 막대마다 primary(#0000FF) 테두리
 * + 시간 순 채도 램프였는데, 램프는 "무엇이 강조인가"를 말하지 못하면서
 * 화면에서 가장 시끄러운 요소였다. 축 위에는 월 라벨과 주 단위 눈금, 그 아래로
 * 옅은 세로 격자가 행을 관통한다 — 막대가 어느 주에 걸치는지 눈으로 재지 않아도
 * 된다.
 *
 * 예전의 마일스톤 점선(각 phase 시작일)은 뺐다 — 격자 + 막대 끝 날짜가 같은
 * 정보를 더 조용히 준다.
 *
 * 접근성: 왼쪽 두 열은 평문이라 그대로 읽힌다. 막대·격자·축 라벨은 시각
 * 전용(절대위치 + %)이라 aria-hidden으로 숨기고, 기간은 이름 아래 텍스트가
 * 말한다. 같은 데이터의 표(Plan 탭 Budget Breakdown, Performance 탭 goal별 표)도
 * 바로 아래 있다.
 *
 * Props:
 * @param {Array<{key: string, name: string, platformLabel: string, startDate: string, endDate: string, totalDaily: number|null, totalBudget: number}>} phases - buildPhaseTimeline()이 만든 phase 배열 [Required] (key는 정규화된 묶음 키, name은 표시용 원본 이름, platformLabel은 이 막대가 덮는 플랫폼)
 * @param {function} barSuffix - 플랫폼/예산 열 끝에 덧붙일 문자열을 돌려주는 함수 (phase) => string|null [Optional]
 * @param {Date|string} today - 기준일. 이 날짜에 진행 중인 phase의 막대가 강조(파랑)된다 [Optional]
 * @param {string} emphasizedKey - 강조할 phase의 key. today보다 우선한다 [Optional]
 * @param {function} onPhaseClick - 행 클릭 핸들러 (phase) => void. 주면 행이 눌리는 객체가 된다(커서·hover 배경·키보드 활성화). 안 주면 예전처럼 읽기 전용 표 — 계획 타임라인(buildPlanPhases)처럼 행 뒤에 캠페인이 없는 경우가 그렇다 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <PhaseTimelineChart phases={phases} today={today} />
 * <PhaseTimelineChart phases={phases} barSuffix={(p) => `Spend $${spendByPhase[p.name]}`} />
 */
export function PhaseTimelineChart({ phases, barSuffix, today, emphasizedKey, onPhaseClick, sx }) {
  /* 축의 실제 폭(px). 눈금 간격은 %가 아니라 픽셀로 정해야 한다 — 같은 75일짜리
     축이 Performance 탭(전폭)에서는 주 단위가 맞고 Plan 탭(1120px 안)에서는
     2주 단위여야 라벨이 안 겹친다. 첫 렌더에는 0이라 상한 상수로 대신한다. */
  const axisRef = useRef(null);
  const [axisWidth, setAxisWidth] = useState(0);
  const measure = useCallback(() => {
    if (axisRef.current) setAxisWidth(axisRef.current.clientWidth);
  }, []);
  useEffect(() => {
    const el = axisRef.current;
    if (!el) return undefined;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  if (phases.length === 0) return null;

  const todayIso = today instanceof Date ? toLocalISODate(today) : today ?? null;

  const timelineStart = phases.reduce((min, p) => (p.startDate < min ? p.startDate : min), phases[0].startDate);
  const timelineEnd = phases.reduce((max, p) => (p.endDate > max ? p.endDate : max), phases[0].endDate);
  const startDay = dayOf(timelineStart);
  const endDay = dayOf(timelineEnd);
  const spanDays = Math.max(endDay - startDay, 1);

  /* 축은 데이터보다 조금 넓다 — 끝점 원과 날짜 라벨이 셀 가장자리에 붙지 않게.
     양쪽 여유는 전체 기간의 3%(최소 이틀). */
  const pad = Math.max(2, Math.round(spanDays * 0.03));
  const axisStart = startDay - pad;
  const axisSpan = spanDays + pad * 2;
  const pct = (day) => ((day - axisStart) / axisSpan) * 100;
  const pctOf = (iso) => pct(dayOf(iso));

  /* 눈금 — 첫 phase 시작일부터 일정 간격. 간격은 눈금 하나가 MIN_TICK_SPACING_PX
     이상을 갖는 가장 촘촘한 값(1·2·7·14·28일). 타임라인 끝 날짜는 항상 눈금이다 —
     축의 범위는 눈금이 말해야 한다. 마지막 정규 눈금이 끝과 너무 가까우면(한 칸의
     85% 미만) 라벨이 끝 라벨과 겹치므로 그 눈금을 끝 눈금으로 대체한다. */
  const maxTicks = axisWidth > 0 ? Math.max(2, Math.floor(axisWidth / MIN_TICK_SPACING_PX)) : FALLBACK_MAX_TICKS;
  const step = TICK_STEP_CANDIDATES.find((s) => Math.ceil(spanDays / s) + 1 <= maxTicks) ?? TICK_STEP_CANDIDATES.at(-1);
  const ticks = [];
  for (let day = startDay; day <= endDay; day += step) ticks.push(day);
  if (endDay - ticks[ticks.length - 1] >= step * 0.85) ticks.push(endDay);
  else ticks[ticks.length - 1] = endDay;

  /* 인쇄 눈금 — 화면과 같은 축(pct) 위에서 후보만 달리 고른다: 각 달의 1일·15일 + 기간 양 끝 중
     앞 눈금과 PRINT_MIN_TICK_GAP_PCT 이상 떨어진 것. 종이 축이 좁아 주 단위 라벨이 붙기 때문이다. */
  const printTicks = [];
  {
    const candidates = new Set([startDay, endDay]);
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
    [...candidates].sort((a, b) => a - b).forEach((day) => {
      if (day === endDay) return;
      if (printTicks.length === 0 || pct(day) - pct(printTicks[printTicks.length - 1]) >= PRINT_MIN_TICK_GAP_PCT) printTicks.push(day);
    });
    // 마지막 눈금이 끝과 너무 가까우면 그것을 버린다 — 끝 날짜가 먼저다
    if (printTicks.length > 0 && pct(endDay) - pct(printTicks[printTicks.length - 1]) < PRINT_MIN_TICK_GAP_PCT) printTicks.pop();
    printTicks.push(endDay);
  }

  /* 월 구간 — 라벨은 각 달의 시작(첫 달은 타임라인 시작)에, 경계선은 1일에.
     첫 달의 1일은 축 밖이라 선을 긋지 않는다. 너무 좁은 구간은 라벨을 건너뛴다. */
  const months = [];
  {
    const first = new Date(startDay * MS_PER_DAY);
    let y = first.getUTCFullYear();
    let m = first.getUTCMonth();
    while (Date.UTC(y, m, 1) / MS_PER_DAY <= endDay) {
      const monthStartDay = Math.round(Date.UTC(y, m, 1) / MS_PER_DAY);
      const nextStartDay = Math.round(Date.UTC(y, m + 1, 1) / MS_PER_DAY);
      const labelDay = Math.max(monthStartDay, startDay);
      const widthPct = pct(Math.min(nextStartDay, endDay)) - pct(labelDay);
      months.push({
        key: `${y}-${m}`,
        label: `${MONTHS[m]} ${y}`,
        labelDay,
        boundaryDay: monthStartDay > startDay ? monthStartDay : null,
        showLabel: widthPct >= MIN_MONTH_LABEL_PCT,
        // 종이에서는 라벨이 더 크게 먹으므로 기준이 한 단 높다(같은 규칙, 다른 치수)
        showLabelPrint: widthPct >= PRINT_MIN_MONTH_LABEL_PCT,
      });
      m += 1;
      if (m === 12) { m = 0; y += 1; }
    }
  }
  const monthStarts = months.map((mo) => mo.boundaryDay).filter((d) => d != null);

  const isEmphasized = (p) => {
    if (emphasizedKey != null) return p.key === emphasizedKey;
    return Boolean(todayIso && p.startDate <= todayIso && todayIso <= p.endDate);
  };

  const headCellSx = {
    px: 2,
    pt: 1.5,
    pb: 1,
    fontSize: 12,
    color: 'text.secondary',
    alignSelf: 'end',
    '@media print': { px: '4pt', pt: '3pt', pb: '2pt', fontSize: '7pt' },
  };

  return (
    /* 좁은 화면에서는 표처럼 가로 스크롤 — 열을 접거나 막대를 숨기지 않는다 */
    <Box sx={{ overflowX: 'auto', '@media print': { overflow: 'visible' }, ...sx }}>
      <Box sx={{ minWidth: 740, '@media print': { minWidth: 0 } }}>
        {/* 헤더 행 — 열 이름 둘 + 축(월 라벨 / 주 눈금) */}
        <Box
          sx={{
            ...GRID_SX,
            // 헤더와 첫 행 사이 숨 쉴 틈(5px) — 열 이름이 첫 행 글자에 붙어 보였다
            pb: 0.625,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography component="div" sx={headCellSx}>Campaign</Typography>
          {/* 실지출(barSuffix)이 붙는 Performance 탭에서만 "Spend"를 말한다 —
              Plan 탭은 이 열에 계획 예산뿐이라 헤더가 없는 값을 약속하면 안 된다. */}
          <Typography component="div" sx={headCellSx}>{barSuffix ? 'Platform / Budget / Spend' : 'Platform / Budget'}</Typography>
          <Box ref={axisRef} aria-hidden sx={{ position: 'relative', height: 56, borderLeft: '1px solid', borderColor: 'divider', '@media print': { height: '30pt' } }}>
            {months.map((mo) => (mo.showLabel || mo.showLabelPrint) && (
              <Typography
                key={mo.key}
                component="div"
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: `${pct(mo.labelDay)}%`,
                  pl: 1,
                  // 월 라벨은 주 눈금(11px 흐림)보다 확실히 위 단계 — 크기로 가른다
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  ...(mo.showLabel ? {} : { display: 'none' }),
                  '@media print': { top: '2pt', pl: '3pt', fontSize: '8pt', display: mo.showLabelPrint ? 'block' : 'none' },
                }}
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
                  bottom: 8,
                  left: `${pct(day)}%`,
                  transform: edgeAwareShift(pct(day)),
                  fontSize: 11,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums',
                  '@media print': { display: 'none' },
                }}
              >
                {dateMed(isoOf(day))}
              </Typography>
            ))}
            {printTicks.map((day) => (
              <Typography
                key={`p-${day}`}
                component="div"
                sx={{
                  display: 'none',
                  '@media print': {
                    display: 'block',
                    position: 'absolute',
                    bottom: '3pt',
                    left: `${pct(day)}%`,
                    transform: edgeAwareShift(pct(day)),
                    fontSize: '7pt',
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  },
                }}
              >
                {dateMed(isoOf(day))}
              </Typography>
            ))}
          </Box>
        </Box>

        {phases.map((p, index) => {
          const startPct = pctOf(p.startDate);
          const endPct = pctOf(p.endDate);
          const width = Math.max(endPct - startPct, 0);
          const emphasized = isEmphasized(p);
          const barColor = emphasized ? 'chart.barEmphasis' : 'chart.bar';
          /* 첫 줄은 부르는 이름. `타입: 캡션` 꼴(부스팅 게시물)은 캡션이 이름이다 —
             타입("Instagram post")은 같은 무리 전부가 공유하므로 구분에 쓸모가
             없다. 그 외에는 코드·기간을 벗긴 이름이다. 원본 전체는 title(hover)
             로만 남긴다 — 한때 둘째 줄 끝에도 붙였는데, 잘려서 "G10_Coming Soon_…"
             까지만 보이는 조각은 정보가 아니라 소음이었다. 모든 행이 같은 규칙:
             첫 줄 표시 이름, 둘째 줄 기간·일수. */
          const primaryName = phaseDisplayName(p.name);
          const details = [formatPhaseBudget(p), barSuffix?.(p)].filter(Boolean).join(' · ');
          const isLast = index === phases.length - 1;
          /* 인쇄에서는 폭이 좁아 예산 줄을 말줄임 대신 접는다 — 종이에서는 "…"가 정보를 영영 지운다 */
          const metaSx = {
            fontSize: 11,
            lineHeight: 1.6,
            color: 'text.secondary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontVariantNumeric: 'tabular-nums',
            '@media print': { fontSize: '7pt', lineHeight: 1.35, whiteSpace: 'normal', overflow: 'visible' },
          };
          const dateLabelSx = {
            position: 'absolute',
            top: `calc(50% + ${DOT_SIZE / 2 + 3}px)`,
            fontSize: 11,
            // 강조 막대여도 끝 날짜는 조용히 — 파랑 막대가 이미 말한다. hover에서만 진해진다.
            color: 'text.secondary',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            '@media print': { fontSize: '7pt' },
          };
          return (
            <Box
              key={p.key}
              data-phase-key={p.key}
              onClick={onPhaseClick ? () => onPhaseClick(p) : undefined}
              onKeyDown={
                onPhaseClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onPhaseClick(p);
                      }
                    }
                  : undefined
              }
              role={onPhaseClick ? 'button' : undefined}
              tabIndex={onPhaseClick ? 0 : undefined}
              /* 행 전체가 하나의 버튼이다 — 막대만 누르게 하면 좁은 막대(하루짜리
                 phase)는 과녁이 몇 px밖에 안 된다. 왼쪽 두 열이 평문이라
                 스크린리더는 이름·기간을 그대로 읽는다(막대 쪽은 aria-hidden). */
              sx={(theme) => ({
                ...GRID_SX,
                borderBottom: isLast ? 0 : '1px solid',
                borderColor: 'divider',
                cursor: onPhaseClick ? 'pointer' : 'default',
                ...(onPhaseClick && {
                  // 포커스는 앱 공통 문법(1px accent 테두리 + 옅은 ring)
                  '&:focus-visible': {
                    outline: '1px solid',
                    outlineColor: theme.palette.accent.main,
                    outlineOffset: -1,
                    boxShadow: `inset 0 0 0 3px ${theme.palette.accent.ring}`,
                  },
                }),
                /* hover — 이 행의 막대만 accent로. 파랑은 강조·hover에만 쓴다.
                   마우스 있는 기기에서만: 터치에서는 탭 뒤 hover가 눌어붙는다. */
                '@media (hover: hover)': {
                  ...(onPhaseClick && { '&:hover': { backgroundColor: theme.palette.action.hover } }),
                  [`&:hover .${BAR_CLASS}`]: { backgroundColor: theme.palette.chart.barEmphasis },
                  [`&:hover .${DOT_CLASS}`]: { borderColor: theme.palette.chart.barEmphasis },
                  [`&:hover .${DATE_CLASS}`]: { color: theme.palette.text.primary },
                },
              })}
            >
              {/* 이름 — 첫 줄은 세미볼드 표시 이름, 둘째 줄은 기간·일수. 모든 행이
                  같은 두 줄이라 훑을 때 리듬이 안 깨진다. 원본 전체 이름은 이 칸의
                  title(hover)로 남는다. */}
              <Box sx={{ px: 2, py: 1.5, minWidth: 0, '@media print': { px: '4pt', py: '3pt' } }}>
                {/* 긴 이름은 말줄임 — 열 폭은 고정이라 타임라인을 잠식하지 않는다.
                    전체 원본 이름은 hover 툴팁(CampaignTable 행과 같은 문법). */}
                <Tooltip title={p.name} enterDelay={400} placement="top-start">
                  <Typography
                    component="div"
                    sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', '@media print': { fontSize: '8.5pt', lineHeight: 1.3 } }}
                  >
                    {primaryName}
                  </Typography>
                </Tooltip>
                <Typography component="div" sx={metaSx}>
                  {dateMed(p.startDate)} – {dateMed(p.endDate)} · {rangeDays(p.startDate, p.endDate)}
                </Typography>
              </Box>

              {/* 플랫폼 · 계획 예산 · (Performance 탭) 실지출 — 막대 안에 있던
                  숫자가 전부 여기로 왔다. 막대 폭과 무관하게 항상 온전히 읽히고,
                  "planned"/"spent"가 계획과 실적을 가른다. */}
              <Box sx={{ px: 2, py: 1.5, minWidth: 0, '@media print': { px: '4pt', py: '3pt' } }}>
                <Typography component="div" sx={{ fontSize: 13, lineHeight: 1.5, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', '@media print': { fontSize: '7.5pt', lineHeight: 1.3 } }}>
                  {p.platformLabel || '—'}
                </Typography>
                <Typography component="div" title={details || undefined} sx={metaSx}>
                  {details || ' '}
                </Typography>
              </Box>

              {/* 막대 — 얇은 트랙 + 양 끝 원. 라벨은 막대 밖(아래). */}
              <Box aria-hidden sx={{ position: 'relative', minHeight: 64, borderLeft: '1px solid', borderColor: 'divider', '@media print': { minHeight: '22pt' } }}>
                <TimelineGrid ticks={ticks} printTicks={printTicks} monthStarts={monthStarts} pct={pct} />
                <Box
                  className={BAR_CLASS}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: `${startPct}%`,
                    width: `${width}%`,
                    height: BAR_HEIGHT,
                    transform: `translateY(-${BAR_HEIGHT * 1.5}px)`,
                    borderRadius: `${BAR_HEIGHT / 2}px`,
                    backgroundColor: barColor,
                    /* 종이에서는 강조 파랑이 회색으로 뭉개져 뜻을 잃으므로 막대는 전부 중립 회색이다.
                       그리고 **면이 아니라 선으로** 그린다 — 브라우저 인쇄의 "배경 그래픽"은 기본이 꺼짐이라
                       배경색 막대는 통째로 사라진다(막대가 이 차트의 데이터다). 테두리는 항상 인쇄된다. */
                    '@media print': {
                      backgroundColor: 'transparent',
                      height: 0,
                      borderTop: `${BAR_HEIGHT - 2}px solid`,
                      borderColor: 'chart.bar',
                      borderRadius: 0,
                    },
                  }}
                />
                {[startPct, endPct].map((x, i) => (
                  <Box
                    key={i}
                    className={DOT_CLASS}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: `${x}%`,
                      width: DOT_SIZE,
                      height: DOT_SIZE,
                      transform: `translate(-50%, calc(-50% - ${BAR_HEIGHT}px))`,
                      borderRadius: '50%',
                      backgroundColor: 'background.paper',
                      border: '2px solid',
                      borderColor: barColor,
                      boxSizing: 'border-box',
                      // 끝점도 선으로만 — 흰 채움은 배경 그래픽이 꺼지면 안 그려지지만 테두리 원은 남는다
                      '@media print': { width: DOT_SIZE - 2, height: DOT_SIZE - 2, border: '1.5px solid', borderColor: 'chart.bar', backgroundColor: 'transparent' },
                    }}
                  />
                ))}
                {width < MIN_TWO_LABEL_PCT ? (
                  <Typography component="div" className={DATE_CLASS} sx={{ ...dateLabelSx, left: `${startPct}%`, transform: edgeAwareShift(startPct) }}>
                    {p.startDate === p.endDate ? dateMed(p.startDate) : `${dateMed(p.startDate)} – ${dateMed(p.endDate)}`}
                  </Typography>
                ) : (
                  <>
                    <Typography component="div" className={DATE_CLASS} sx={{ ...dateLabelSx, left: `${startPct}%`, transform: 'translateX(-4px)' }}>
                      {dateMed(p.startDate)}
                    </Typography>
                    <Typography component="div" className={DATE_CLASS} sx={{ ...dateLabelSx, left: `${endPct}%`, transform: 'translateX(calc(-100% + 4px))' }}>
                      {dateMed(p.endDate)}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
