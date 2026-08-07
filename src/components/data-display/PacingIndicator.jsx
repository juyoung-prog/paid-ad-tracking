import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { BUDGET_PACING_THRESHOLD as PACING_THRESHOLD } from '../../data/schema';
import { money, moneyWhole, percent } from '../../utils/format';

function getPacingLabel(diff) {
  if (diff == null) return { text: 'No data', color: 'text.secondary' };
  if (diff > PACING_THRESHOLD) return { text: 'Ahead', color: 'warning.main' };
  if (diff < -PACING_THRESHOLD) return { text: 'Behind', color: 'text.secondary' };
  return { text: 'On track', color: 'success.main' };
}

/**
 * PacingIndicator 컴포넌트
 *
 * 캠페인의 예산 소진 속도를 기간 경과 대비로 시각화한다.
 * 비율(timeElapsedRatio, budgetUsedRatio, avgDailySpend, dailyBudgetRatio)은
 * schema.js의 calcBudgetPacing()에서 계산되어 prop으로 전달되어야 하며, 이
 * 컴포넌트는 날짜 계산을 직접 하지 않는다.
 *
 * budgetDaily가 있는 캠페인은 상단 Pacing 라벨(Ahead/On track/Behind)도
 * dailyBudgetRatio 기준으로 바뀐다 — 기존 경과일/전체기간 비율과 다른 결론을
 * 낼 수 있는데, 상단 라벨과 아래 Daily Avg 줄이 서로 다른 신호로 보이면
 * 혼란스러우므로 하나로 통일한다(generateAlerts()의 알림 판단과도 동일 기준).
 *
 * Props:
 * @param {number|null} timeElapsedRatio - 기간 경과 비율 (0~1) [Required]
 * @param {number|null} budgetUsedRatio - 예산 소진 비율 (0~1) [Required]
 * @param {number|null} avgDailySpend - 오늘까지 일평균 소진액 [Optional]
 * @param {number|null} dailyBudgetRatio - 일평균 소진액 / budgetDaily [Optional]
 * @param {number} budgetPlanned - 계획 예산(총액, 라벨 표시용) [Optional]
 * @param {number|null} budgetDaily - 일일 예산(라벨 표시용, 있으면 Daily Avg 줄 노출) [Optional]
 * @param {number} spend - 실집행 예산 (라벨 표시용) [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * const pacing = calcBudgetPacing(campaign, spend);
 * <PacingIndicator
 *   {...pacing}
 *   budgetPlanned={campaign.budgetPlanned}
 *   budgetDaily={campaign.budgetDaily}
 *   spend={spend}
 * />
 */
export function PacingIndicator({ timeElapsedRatio, budgetUsedRatio, avgDailySpend, dailyBudgetRatio, budgetPlanned, budgetDaily, spend, sx }) {
  const diff = dailyBudgetRatio != null
    ? dailyBudgetRatio - 1
    : timeElapsedRatio != null && budgetUsedRatio != null
      ? budgetUsedRatio - timeElapsedRatio
      : null;
  const pacing = getPacingLabel(diff);

  return (
    <Box sx={sx}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="label" sx={{ color: 'text.primary' }}>
          Budget Pacing
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: pacing.color }}>
          {pacing.text}
        </Typography>
      </Box>

      {/* 계획 예산이 없으면 이 줄을 통째로 그리지 않는다. 예전엔 비율을 '—'로
          찍고 분모가 0인 분수를 그대로 노출했다("— ($514.49 / $0)") — 계산이
          안 된다는 걸 알면서 깨진 식을 보여준 셈이라, 바로 아래 멀쩡히 동작하는
          Daily Avg 줄까지 같이 의심받았다(실사용 리뷰로 발견). 빈 막대도 함께
          사라진다: 0%로 그린 막대는 "아직 안 썼다"로 읽힌다. */}
      {budgetUsedRatio != null && (
      <Box sx={{ mb: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary">Budget Spent</Typography>
          <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', color: pacing.color }}>
            {percent(budgetUsedRatio)}
            {budgetPlanned != null && spend != null && (
              <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
                ({money(spend)} / {moneyWhole(budgetPlanned)})
              </Box>
            )}
          </Typography>
        </Box>
        {/* 막대 라운딩 = inlay(3px) — 6px 높이의 절반이라 풀 필(pill)이 된다.
            각진 0은 Reports의 Budget by Platform 막대와 함께 라운딩 체계에서
            혼자 남은 예외였다(아래 두 막대 + Reports 쪽도 동일 값). */}
        <LinearProgress
          variant="determinate"
          value={budgetUsedRatio != null ? Math.min(budgetUsedRatio, 1) * 100 : 0}
          sx={{
            height: 6,
            borderRadius: (theme) => `${theme.shape.radius.inlay}px`,
            backgroundColor: 'grey.100',
            '& .MuiLinearProgress-bar': { backgroundColor: pacing.color },
          }}
        />
      </Box>
      )}

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary">Time Elapsed</Typography>
          <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
            {percent(timeElapsedRatio)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={timeElapsedRatio != null ? Math.min(timeElapsedRatio, 1) * 100 : 0}
          sx={{
            height: 6,
            borderRadius: (theme) => `${theme.shape.radius.inlay}px`,
            backgroundColor: 'grey.100',
            '& .MuiLinearProgress-bar': { backgroundColor: 'grey.500' },
          }}
        />
      </Box>

      {budgetDaily != null && (
        <Box sx={{ mt: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" color="text.secondary">Daily Avg</Typography>
            <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', color: pacing.color }}>
              {avgDailySpend != null ? `${moneyWhole(avgDailySpend)}/day` : '—'}
              <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
                (budget {moneyWhole(budgetDaily)}/day)
              </Box>
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={dailyBudgetRatio != null ? Math.min(dailyBudgetRatio, 1) * 100 : 0}
            sx={{
              height: 6,
              borderRadius: (theme) => `${theme.shape.radius.inlay}px`,
              backgroundColor: 'grey.100',
              '& .MuiLinearProgress-bar': { backgroundColor: pacing.color },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
