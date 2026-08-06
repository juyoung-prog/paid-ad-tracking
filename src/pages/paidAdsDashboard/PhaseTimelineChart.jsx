import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { shortDate } from './paidAdsPageUtils';

/**
 * phase 막대에 붙이는 예산 문자열. 일일 예산과 총 예산을 둘 다 말한다 —
 * "하루 얼마씩 쓰는 캠페인인가"와 "이 단계에 총 얼마가 걸려 있나"는 서로 다른
 * 질문이고, 예산을 결정할 때 둘 다 필요하다. 값이 없는 쪽은 통째로 생략한다
 * (0을 "$0"으로 찍으면 "0으로 계획했다"로 읽힌다 — 동기화 캠페인은 계획 예산
 * 개념이 없어 0으로 저장된다).
 *
 * @param {{ totalDaily: number|null, totalBudget: number }} phase
 * @returns {string} 예: "$120/day · $3,600" — 둘 다 없으면 빈 문자열
 */
/**
 * 이름 앞의 타입 접두사를 떼는 패턴 — `Instagram post: <캡션>`의 `Instagram post`.
 *
 * 이 계정 이름의 절반 이상(170건 중 98건)이 `타입: 내용` 꼴이다. 게시물 부스팅을
 * 캠페인으로 만들 때 Meta가 캡션 앞부분을 잘라 이름으로 쓰기 때문인데, 그래서
 * 이름 안에 이모지·줄바꿈·말줄임표가 그대로 들어온다.
 *
 * 이걸 데이터에서 걷어내려던 두 안(타임라인에서 제외 / 겹치는 phase에 흡수)은
 * 실측으로 폐기했다 — 부스팅 게시물이 전체 지출의 24.1%($24,747)를 차지해서
 * 빼면 차트 합계가 헤더 KPI와 어긋나고, "다른 phase에 완전히 포함"되는 건 93건
 * 중 1건뿐이라 흡수 규칙은 성립하지 않는다. 문제는 이것들이 **거기 있는 것**이
 * 아니라 계획 캠페인과 **똑같아 보이는 것**이었다. 그래서 표시 계층에서 굵기만
 * 나눈다 — 정보는 하나도 안 지우고, Meta가 준 이름도 그대로 둔다(DB에서 고치면
 * Ads Manager에서 같은 캠페인을 못 찾는다).
 *
 * 접두사를 24자로 제한하는 이유: 콜론이 타입 구분이 아니라 문장 부호로 쓰인
 * 이름("Come see us at the mall: this weekend")에서 절반이 굵어지는 걸 막는다.
 * 실데이터의 최장 접두사는 14자('Instagram post')다.
 *
 * 뒷부분을 `.` 대신 `[\s\S]`로 받는 이유: 캡션에 줄바꿈이 그대로 들어온 이름이
 * 19건 있는데("🍁🍁 Hey, Bm customers 🍁🍁\n🤩Don't..."), `.`은 개행을 못 먹어서
 * 그 19건만 조용히 분리에 실패했다(실측으로 발견). 접두사 쪽은 반대로 개행을
 * 막는다 — 개행을 넘어간 덩어리는 타입 이름일 수 없다.
 */
const NAME_PREFIX_PATTERN = /^([^:\n]{1,24}):\s*([\s\S]+)$/;

/**
 * 이름을 `타입 접두사`와 `나머지`로 나눈다. 접두사가 없으면 이름 전체를 접두사로
 * 돌려준다 — 호출부가 "접두사는 굵게"만 지키면 두 경우가 같은 코드로 처리된다.
 *
 * @param {string} name - 캠페인 이름
 * @returns {{prefix: string, rest: string}}
 */
function splitNamePrefix(name) {
  const match = (name ?? '').match(NAME_PREFIX_PATTERN);
  return match ? { prefix: match[1], rest: match[2] } : { prefix: name ?? '', rest: '' };
}

/** 축 눈금 라벨이 겹치지 않는 최소 간격(타임라인 폭 대비 %) */
const MIN_TICK_GAP_PCT = 4;

/** 막대 높이. 이름이 막대 밖으로 나가면서 안에는 숫자 한 줄만 남아 낮아졌다. */
const BAR_HEIGHT = 24;

/** 이름 줄 높이 — 막대는 이 아래에 놓인다. */
const NAME_HEIGHT = 20;

/**
 * 타임라인 양 끝에 붙은 라벨이 차트 밖으로 잘리지 않도록 정렬 기준을 바꾼다.
 * 감싸는 Box의 여백은 고정인데 라벨 길이는 가변이라, 끝에 가까우면 안쪽으로 눕힌다.
 *
 * @param {number} pct - 왼쪽에서의 위치(%)
 * @returns {string} CSS transform 값
 */
function edgeAwareShift(pct) {
  if (pct < 12) return 'none';
  if (pct > 88) return 'translateX(-100%)';
  return 'translateX(-50%)';
}

function formatPhaseBudget(phase) {
  const parts = [];
  if (phase.totalDaily) parts.push(`$${phase.totalDaily.toLocaleString('en-US')}/day`);
  if (phase.totalBudget > 0) parts.push(`$${phase.totalBudget.toLocaleString('en-US')}`);
  return parts.join(' · ');
}

/**
 * PhaseTimelineChart 컴포넌트
 *
 * Event(캠페인 그룹)를 구성하는 phase들을 실제 기간에 맞춰 가로 막대로 배치하는
 * 타임라인(Gantt). 새 차트 라이브러리 없이 순수 % 위치 계산만으로 그린다 —
 * 이 화면의 다른 막대들(PacingIndicator·Budget by Platform)이 쓰는 접근과 같다.
 *
 * Plan 탭과 Performance 탭이 **같은 컴포넌트를 공유한다.** 예전엔 Performance가
 * 별도의 "지표별 비교 막대"(이름 | 막대 | 값)를 그려서, 같은 Event를 골라도 탭에
 * 따라 완전히 다른 그림이 나왔다(실사용 피드백). 같은 데이터를 두 가지 시각
 * 문법으로 말하면 둘을 머릿속에서 다시 맞춰야 한다 — 시간 축 하나로 통일하고,
 * 탭별로 다른 정보는 막대 라벨 뒤에 덧붙인다(barSuffix).
 *
 * 각 phase의 시작일에는 수직 점선을 긋고, 그 날짜를 **축 눈금으로** 적는다.
 * 예전엔 점선 위에 phase 이름을 단 라벨을 띄웠는데, 바로 아래 막대가 같은
 * 이름을 다시 말하고 있어서 정보량이 0이었다(게다가 길어서 잘렸고, 회색 배경
 * + 라운딩 때문에 누를 수 있는 Chip처럼 보였다 — 거짓 어포던스). 라벨을 걷고
 * 날짜만 축으로 내리면 같은 자리에서 "언제"라는 새 정보가 생긴다. 축이 양 끝
 * 두 개뿐일 때 중간 막대의 시점을 눈대중으로 재야 했던 것도 같이 풀린다.
 *
 * 이름은 막대 **밖 위**에 둔다. 막대 안에 넣으면 좁은 막대에서 잘려서 "이게
 * 무슨 단계인지" 자체를 잃는다("Instagram post: CO…"). 밖으로 빼면 폭과 무관하게
 * 항상 온전하고, 굵기가 다른 두 단(이름 / 숫자)으로 갈려 한 줄에 몰린 긴
 * 문자열보다 훨씬 빨리 읽힌다. 대신 막대 높이를 줄여(24px) 늘어난 줄을 상쇄한다.
 *
 * 접근성: 시각 전용 구성(절대위치 + %)이라 표/목록 같은 의미 구조가 없다.
 * 스크린리더에 억지 구조를 씌우기보다 이 블록을 aria-hidden으로 숨기고, 같은
 * 데이터를 담은 표(Plan 탭의 Budget Breakdown, Performance 탭의 goal별 표)로
 * 보낸다.
 *
 * Props:
 * @param {Array<{key: string, name: string, platformLabel: string, startDate: string, endDate: string, totalDaily: number|null, totalBudget: number, fillAlpha: number}>} phases - buildPhaseTimeline()이 만든 phase 배열 [Required] (key는 정규화된 묶음 키, name은 표시용 원본 이름, platformLabel은 이 막대가 덮는 플랫폼)
 * @param {function} barSuffix - 막대 라벨 끝에 덧붙일 문자열을 돌려주는 함수 (phase) => string|null [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <PhaseTimelineChart phases={phases} />
 * <PhaseTimelineChart phases={phases} barSuffix={(p) => `Spend $${spendByPhase[p.name]}`} />
 */
export function PhaseTimelineChart({ phases, barSuffix, sx }) {
  const theme = useTheme();
  if (phases.length === 0) return null;

  const timelineStart = phases.reduce((min, p) => (p.startDate < min ? p.startDate : min), phases[0].startDate);
  const timelineEnd = phases.reduce((max, p) => (p.endDate > max ? p.endDate : max), phases[0].endDate);
  const timelineRangeMs = new Date(timelineEnd) - new Date(timelineStart) || 1;
  const timelinePct = (iso) => ((new Date(iso) - new Date(timelineStart)) / timelineRangeMs) * 100;

  /* 마일스톤 = 각 phase의 시작일(실사용 확인 완료 — 종료일 기준은 이벤트마다
     의미가 달라 일반화하기 어렵고, 시작일은 "다음 단계로 넘어가는 시점"이라는
     뜻이 항상 동일하다). 같은 날 시작하는 phase가 여러 개면 점선 하나로 합친다.

     타임라인 양 끝과 겹치는 점선은 긋지 않는다 — 첫 phase의 시작일은 곧 축의
     원점이라 그 자리의 세로 점선이 "구간 경계"가 아니라 차트의 왼쪽 테두리(혹은
     y축)처럼 읽힌다. 이 차트에는 y축이 없으므로 없는 축을 암시하게 된다. 날짜
     자체는 축 눈금이 그대로 말한다. */
  const milestoneDates = [...new Set(phases.map((p) => p.startDate))]
    .filter((date) => date !== timelineStart && date !== timelineEnd)
    .sort();

  /* 축 눈금 = 타임라인 양 끝 + 마일스톤 날짜. 날짜가 서로 너무 가까우면 라벨이
     겹치므로 최소 간격 미만은 버린다 — 양 끝은 축의 범위를 말하므로 예외 없이
     남기고, 중간 눈금만 앞 눈금과 끝 눈금 양쪽으로 간격을 확인한다. */
  const axisTicks = [...new Set([timelineStart, ...milestoneDates, timelineEnd])]
    .sort()
    .reduce((kept, date) => {
      const pct = timelinePct(date);
      if (kept.length === 0) return [{ date, pct }];
      if (date === timelineEnd) return [...kept, { date, pct }];
      const tooCloseToPrev = pct - kept[kept.length - 1].pct < MIN_TICK_GAP_PCT;
      const tooCloseToEnd = 100 - pct < MIN_TICK_GAP_PCT;
      return tooCloseToPrev || tooCloseToEnd ? kept : [...kept, { date, pct }];
    }, []);

  return (
    /* 바깥 Box(px)는 실제 여백을 만들고, 안쪽 Box(position:relative)는 패딩 없이
       그 안에서만 %로 위치를 계산한다 — absolute 자식의 left:%는 가장 가까운
       position:relative 조상의 "패딩을 포함한" 박스 기준으로 계산돼서, 같은 Box에
       padding과 absolute 자식을 같이 두면 padding이 % 계산에 반영되지 않는다
       (실제로 확인한 버그 — 마일스톤 라벨이 padding을 줬는데도 화면 밖으로
       잘렸었다). 두 겹으로 나눠야 바깥 padding이 안쪽 %기준 폭 자체를 줄인다. */
    <Box aria-hidden="true" sx={{ px: 12, pt: 2, pb: 3, ...sx }}>
      {/* 막대 영역과 축을 형제로 나눈다 — 마일스톤 점선을 top:0/bottom:0으로
          "막대 영역 전체"에 정확히 걸기 위해서다. 예전처럼 축까지 한 relative
          안에 두면 점선 끝을 픽셀로 빼줘야 하고, 축 여백을 건드릴 때마다 어긋난다.
          두 Box의 폭이 같으므로 %기준은 그대로 공유된다. */}
      <Box sx={{ position: 'relative' }}>
        {/* 마일스톤 — 점선만 긋는다. 날짜는 아래 축이 말한다. */}
        {milestoneDates.map((date) => (
          <Box
            key={date}
            sx={{
              position: 'absolute',
              left: `${timelinePct(date)}%`,
              top: 0,
              bottom: 0,
              borderLeft: '2px dashed',
              borderColor: 'divider',
            }}
          />
        ))}

        {phases.map((p) => {
          const left = timelinePct(p.startDate);
          const width = Math.max(timelinePct(p.endDate) - left, 1.5);
          /* 플랫폼 표기는 이름과 한 덩어리다 — 둘 다 "이 막대가 무엇인가"를
             말하고, 막대 안의 숫자들은 전부 이 플랫폼(들) 기준이다. */
          const { prefix, rest } = splitNamePrefix(p.name);
          const heading = [p.name, p.platformLabel].filter(Boolean).join(' · ');
          const barText = [
            `${shortDate(p.startDate)}–${shortDate(p.endDate)}`,
            formatPhaseBudget(p),
            barSuffix?.(p),
          ].filter(Boolean).join(' · ');
          return (
            <Box key={p.key} sx={{ position: 'relative', height: NAME_HEIGHT + BAR_HEIGHT, mb: 1 }}>
              {/* 이름은 막대 왼쪽 끝에 맞춘다. 막대가 오른쪽 끝에서 시작하면
                  이름이 차트 밖으로 나가므로 그때만 막대 오른쪽 끝 기준으로
                  눕힌다(축 눈금과 같은 규칙). 잘림 방지가 목적이라 폭 제한과
                  말줄임은 두지 않는다 — 넘치면 바깥 여백(px:12)으로 흐른다. */}
              {/* body2(14px) + 굵기로 막대 안 caption(12px)과 두 단을 만든다 —
                  한 줄에 몰려 한 굵기로 흐르던 예전 라벨이 안 읽혔던 이유가
                  위계 부재였다. NAME_HEIGHT(20)는 body2의 줄높이와 맞춘 값.

                  줄 안에서 다시 굵기를 나눈다: 굵은 건 "이게 무엇인가"(타입
                  접두사, 없으면 이름 전체), 보통 굵기는 "그중 어느 것인가"(캡션
                  조각)와 플랫폼이다. 부스팅 게시물끼리 굵은 접두사를 공유하므로
                  세지 않아도 한 무리로 묶여 보인다. */}
              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: left > 60 ? `${left + width}%` : `${left}%`,
                  transform: left > 60 ? 'translateX(-100%)' : 'none',
                  whiteSpace: 'nowrap',
                  fontWeight: 400,
                  color: 'text.primary',
                }}
              >
                <Box component="span" sx={{ fontWeight: 600 }}>{prefix}</Box>
                {rest && ` · ${rest}`}
                {p.platformLabel && ` · ${p.platformLabel}`}
              </Typography>
              <Box
                // 막대가 좁으면 숫자가 잘린다 — 전체 문자열을 title로 남긴다.
                title={`${heading} · ${barText}`}
                sx={{
                  position: 'absolute',
                  top: NAME_HEIGHT,
                  left: `${left}%`,
                  width: `${width}%`,
                  height: BAR_HEIGHT,
                  bgcolor: alpha(theme.palette.primary.main, p.fillAlpha),
                  border: '1px solid',
                  borderColor: 'primary.main',
                  // 차트형 컨테이너(하나의 분석 단위로 스캔되는 phase 막대) 역할
                  borderRadius: `${theme.shape.radius.container}px`,
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  overflow: 'hidden',
                }}
              >
                <Typography variant="caption" noWrap sx={{ color: 'text.primary' }}>
                  {barText}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* 축 — 양 끝 + 마일스톤 날짜. 절대위치라 눈금이 실제 시점 위에 선다
          (space-between으로 늘어놓으면 위치가 데이터와 무관해진다). */}
      <Box sx={{ position: 'relative', height: 28, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        {axisTicks.map((tick) => (
          <Typography
            key={tick.date}
            variant="caption"
            color="text.secondary"
            sx={{
              position: 'absolute',
              top: 8,
              left: `${tick.pct}%`,
              transform: edgeAwareShift(tick.pct),
              whiteSpace: 'nowrap',
            }}
          >
            {shortDate(tick.date)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
