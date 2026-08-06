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
 * 마일스톤(수직 점선 + 라벨)은 각 phase의 시작일을 자동으로 표시한다.
 *
 * 접근성: 시각 전용 구성(절대위치 + %)이라 표/목록 같은 의미 구조가 없다.
 * 스크린리더에 억지 구조를 씌우기보다 이 블록을 aria-hidden으로 숨기고, 같은
 * 데이터를 담은 표(Plan 탭의 Budget Breakdown, Performance 탭의 goal별 표)로
 * 보낸다.
 *
 * Props:
 * @param {Array<{name: string, startDate: string, endDate: string, totalDaily: number|null, totalBudget: number, fillAlpha: number}>} phases - buildPhaseTimeline()이 만든 phase 배열 [Required]
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
     뜻이 항상 동일하다). 같은 날 시작하는 phase가 여러 개면 마커 하나에 이름을
     같이 묶어 표시한다(같은 x 위치에 마커가 겹치지 않도록). */
  const milestoneMap = new Map();
  phases.forEach((p) => {
    if (!milestoneMap.has(p.startDate)) milestoneMap.set(p.startDate, []);
    milestoneMap.get(p.startDate).push(p.name);
  });
  const milestones = [...milestoneMap.entries()].map(([date, names]) => ({ date, label: names.join(', ') }));

  return (
    /* 바깥 Box(px)는 실제 여백을 만들고, 안쪽 Box(position:relative)는 패딩 없이
       그 안에서만 %로 위치를 계산한다 — absolute 자식의 left:%는 가장 가까운
       position:relative 조상의 "패딩을 포함한" 박스 기준으로 계산돼서, 같은 Box에
       padding과 absolute 자식을 같이 두면 padding이 % 계산에 반영되지 않는다
       (실제로 확인한 버그 — 마일스톤 라벨이 padding을 줬는데도 화면 밖으로
       잘렸었다). 두 겹으로 나눠야 바깥 padding이 안쪽 %기준 폭 자체를 줄인다. */
    <Box aria-hidden="true" sx={{ px: 12, pt: 9, pb: 3, ...sx }}>
      <Box sx={{ position: 'relative' }}>
        {/* 마일스톤 — top을 인덱스 짝/홀로 번갈아 배치(stagger)하는 이유:
            phase 시작일이 며칠 안 되게 가까우면(예: 7/16과 7/20) 라벨 두 개가
            겹쳐 보이는 문제가 실제로 있었다. */}
        {milestones.map((m, i) => {
          const pct = timelinePct(m.date);
          const text = `${m.label} (${shortDate(m.date)})`;
          /* 라벨은 점선 기준 가운데 정렬이 기본이다. 그런데 타임라인 양 끝의
             마일스톤은 라벨 절반이 차트 바깥으로 나가 잘렸다 — 감싸는 Box의
             여백(px:12 = 96px)은 고정인데 라벨 길이는 가변이기 때문이다.
             끝에 가까우면 정렬 기준을 바꿔 안쪽으로 눕힌다. */
          const labelShift = pct < 12
            ? 'none'
            : pct > 88
              ? 'translateX(-100%)'
              : 'translateX(-50%)';
          return (
            <Box
              key={m.date}
              sx={{
                position: 'absolute',
                left: `${pct}%`,
                top: 24,
                bottom: 24,
                borderLeft: '2px dashed',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="caption"
                // 정렬을 바꿔도 이름이 여럿 붙으면 여전히 길다. 폭을 캡으로 막고
                // 넘치면 말줄임 — 전체 문자열은 title로 남긴다(차트는 aria-hidden
                // 이고 정확한 값은 아래 표가 갖는다).
                title={text}
                sx={{
                  position: 'absolute',
                  top: i % 2 === 0 ? -28 : -52,
                  left: 0,
                  transform: labelShift,
                  display: 'block',
                  maxWidth: 240,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  bgcolor: 'surface.muted',
                  color: 'text.secondary',
                  fontWeight: 600,
                  px: 1,
                  py: 0.25,
                  // 마일스톤 라벨은 Chip/Badge 역할 → control radius.
                  borderRadius: `${theme.shape.radius.control}px`,
                }}
              >
                {text}
              </Typography>
            </Box>
          );
        })}

        {/* pt:3(margin 아님)은 마일스톤 라벨(가까운 stagger 단계, top:-28)과
            겹치지 않기 위한 여백 — margin-top을 쓰면 이 Box가 부모와 마진이
            겹쳐서(margin collapsing) 여백이 안쪽이 아니라 부모 전체를 밀어버린다
            (그러면 마일스톤도 같이 내려가 간격이 그대로인 버그 — 실측으로 발견). */}
        <Box sx={{ pt: 3 }}>
          {phases.map((p) => {
            const left = timelinePct(p.startDate);
            const width = Math.max(timelinePct(p.endDate) - left, 1.5);
            const budget = formatPhaseBudget(p);
            const suffix = barSuffix?.(p);
            const label = [
              `${p.name} · ${shortDate(p.startDate)}–${shortDate(p.endDate)}`,
              budget,
              suffix,
            ].filter(Boolean).join(' · ');
            return (
              <Box key={p.name} sx={{ position: 'relative', height: 36, mb: 1 }}>
                <Box
                  // 막대가 좁으면 라벨이 잘린다 — 전체 문자열을 title로 남긴다.
                  title={label}
                  sx={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    height: '100%',
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
                  <Typography variant="caption" noWrap sx={{ color: 'text.primary', fontWeight: 600 }}>
                    {label}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">{shortDate(timelineStart)}</Typography>
          <Typography variant="caption" color="text.secondary">{shortDate(timelineEnd)}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
