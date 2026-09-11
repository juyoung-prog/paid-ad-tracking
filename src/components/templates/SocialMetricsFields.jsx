import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { socialMetricKeysFor } from '../../data/schema';

/**
 * SocialMetricsFields 컴포넌트
 *
 * 참여 내역 일곱 가지(Likes · Comments · Shares · Follows · Profile Visits · Saves · Reposts)의 숫자 입력
 * 그리드. 어느 칸을 보일지는 **플랫폼이 정한다**(schema.js SOCIAL_METRIC_KEYS) — Meta는 Follows·Visits가
 * 없고 TikTok은 Reposts가 없다(인스타그램 개념). 플랫폼을 모르면 일곱 칸 전부.
 *
 * 두 곳이 같은 컴포넌트를 쓴다(2026-09-11): 수기 캠페인의 PerformanceForm(Social Metrics 섹션)과
 * 동기화 캠페인 드로어(API가 채운 값을 사람이 고치는 자리). 후자에서는 사람이 고친 칸을 `manualFields`로
 * 받아 라벨 옆에 "edited"를 붙인다 — 동기화가 그 칸은 덮지 않는다는 뜻이고, 어느 숫자가 API 것이고
 * 어느 숫자가 사람 것인지 표에서 구분되어야 한다.
 *
 * 2열 고정: 이 그리드는 440px 고정폭 Drawer 안에서만 쓰인다(PerformanceForm NumberField와 같은 이유).
 * 값이 없는 칸은 null — 저장도 null이라 화면 목록에서 빠진다.
 *
 * Props:
 * @param {string} platform - Campaign.platform. 어느 칸을 보일지 정한다. 없으면 일곱 칸 전부 [Optional]
 * @param {object} values - 폼 값 { likes, comments, shares, follows, profileVisits, saves, reposts } [Required]
 * @param {function} onChange - 필드 변경 핸들러 (field, value) => void. value는 number|null [Required]
 * @param {string[]} manualFields - 사람이 고친 칸의 key 목록(예: ['saves']). 해당 라벨 옆에 "edited" [Optional, 기본값: []]
 * @param {object} errors - 필드별 에러 메시지 { field: message } [Optional]
 * @param {boolean} isDisabled - 저장 중 등 입력 잠금 [Optional, 기본값: false]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <SocialMetricsFields platform="tiktok" values={values} onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))} />
 */
export function SocialMetricsFields({ platform, values, onChange, manualFields = [], errors = {}, isDisabled = false, sx }) {
  return (
    <Grid container spacing={2} sx={sx}>
      {socialMetricKeysFor(platform).map((metric) => {
        const isEdited = manualFields.includes(metric.key);
        return (
          <Grid key={metric.key} size={{ xs: 6 }}>
            {/* 라벨은 시각적 캡션이고 접근성 이름은 입력의 aria-label이 진다(PerformanceForm과 같은 문법) */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{metric.label}</Typography>
              {isEdited && (
                <Typography variant="caption" sx={{ color: 'accent.main', fontWeight: 600 }}>edited</Typography>
              )}
            </Box>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={values?.[metric.key] ?? ''}
              onChange={(e) => onChange(metric.key, e.target.value === '' ? null : Number(e.target.value))}
              error={Boolean(errors[metric.key])}
              helperText={errors[metric.key]}
              disabled={isDisabled}
              slotProps={{ htmlInput: { 'aria-label': metric.label, min: 0 } }}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
