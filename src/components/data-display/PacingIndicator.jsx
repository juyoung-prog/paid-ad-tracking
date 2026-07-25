import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { BUDGET_PACING_THRESHOLD as PACING_THRESHOLD } from '../../data/schema';

function pct(ratio) {
  if (ratio == null) return '—';
  return `${Math.round(ratio * 100)}%`;
}

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
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Budget Pacing
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: pacing.color }}>
          {pacing.text}
        </Typography>
      </Box>

      <Box sx={{ mb: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary">Budget Spent</Typography>
          <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', color: pacing.color }}>
            {pct(budgetUsedRatio)}
            {budgetPlanned != null && spend != null && (
              <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
                (${spend.toLocaleString('en-US')} / ${budgetPlanned.toLocaleString('en-US')})
              </Box>
            )}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={budgetUsedRatio != null ? Math.min(budgetUsedRatio, 1) * 100 : 0}
          sx={{
            height: 6,
            borderRadius: 0,
            backgroundColor: 'grey.100',
            '& .MuiLinearProgress-bar': { backgroundColor: pacing.color },
          }}
        />
      </Box>

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary">Time Elapsed</Typography>
          <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>
            {pct(timeElapsedRatio)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={timeElapsedRatio != null ? Math.min(timeElapsedRatio, 1) * 100 : 0}
          sx={{
            height: 6,
            borderRadius: 0,
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
              {avgDailySpend != null ? `$${Math.round(avgDailySpend).toLocaleString('en-US')}/day` : '—'}
              <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
                (budget ${budgetDaily.toLocaleString('en-US')}/day)
              </Box>
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={dailyBudgetRatio != null ? Math.min(dailyBudgetRatio, 1) * 100 : 0}
            sx={{
              height: 6,
              borderRadius: 0,
              backgroundColor: 'grey.100',
              '& .MuiLinearProgress-bar': { backgroundColor: pacing.color },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
