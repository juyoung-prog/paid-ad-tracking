import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { GOAL } from '../../data/schema';

function SectionLabel({ children }) {
  return (
    <Typography
      variant="overline"
      sx={{ display: 'block', mt: 2, mb: 1, letterSpacing: '0.08em', color: 'text.secondary' }}
    >
      {children}
    </Typography>
  );
}

function FieldLabel({ children }) {
  return (
    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
      {children}
    </Typography>
  );
}

function NumberField({ label, field, value, onChange, error }) {
  return (
    // 2열 고정 — 이 폼은 항상 440px 고정폭 Drawer 안에서만 쓰인다. md:3(4열)을 쓰면
    // 뷰포트가 넓은 데스크탑에서 Grid가 "화면"을 기준으로 4열을 적용해버려서
    // Drawer의 실제 가용폭(440px)에는 안 맞고 숫자가 잘린다(Drawer는 컨테이너
    // 쿼리가 아니라 뷰포트 브레이크포인트를 그대로 상속받기 때문).
    <Grid size={{ xs: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      <TextField
        fullWidth
        size="small"
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(field, e.target.value === '' ? null : Number(e.target.value))}
        error={Boolean(error)}
        helperText={error}
        // FieldLabel은 시각적 캡션일 뿐 <label for=...>가 아니라서, 이게
        // 없으면 스크린리더가 이 입력창을 이름 없이 읽는다(접근성 리뷰로
        // 발견 — CampaignForm/PerformanceForm의 모든 필드에 공통된 문제).
        slotProps={{ htmlInput: { 'aria-label': label } }}
      />
    </Grid>
  );
}

/**
 * PerformanceForm 컴포넌트
 *
 * 캠페인 성과 지표 입력 폼. Tier 1(공통 필수)·Tier 2(영상 지표)는 항상 노출하고,
 * Tier 3(참여, goal=engagement)·Tier 4(전환, goal=conversion|store_visit)는
 * goal에 따라 조건부로 노출한다.
 *
 * CLS(레이아웃 시프트) 주의사항: goal은 이 폼 내부에서 바뀌지 않는 고정 prop이다
 * (캠페인 생성 시 이미 확정된 값). 즉 조건부 필드는 마운트 시점에 한 번 결정되고
 * 이후 사용자 입력 중에 나타났다 사라지지 않으므로, 별도의 자리 예약(min-height 등)
 * 없이도 실제 레이아웃 시프트가 발생하지 않는다.
 *
 * Props:
 * @param {string} goal - Campaign.goal 값, 조건부 필드 노출 기준 [Required]
 * @param {object} values - 폼 값 { impressions, reach, clicks, spend, hookViews, heldViews, engagements, conversions } [Required]
 * @param {function} onChange - 필드 변경 핸들러 (field, value) => void [Required]
 * @param {object} errors - 필드별 에러 메시지 { field: message } [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <PerformanceForm
 *   goal={campaign.goal}
 *   values={values}
 *   onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
 * />
 */
export function PerformanceForm({ goal, values, onChange, errors = {}, sx }) {
  const showEngagement = goal === GOAL.ENGAGEMENT;
  const showConversion = goal === GOAL.CONVERSION || goal === GOAL.STORE_VISIT;

  return (
    <Box sx={sx}>
      <SectionLabel>Core Metrics</SectionLabel>
      <Grid container spacing={2}>
        <NumberField label="Impressions" field="impressions" value={values.impressions} onChange={onChange} error={errors.impressions} />
        <NumberField label="Reach" field="reach" value={values.reach} onChange={onChange} error={errors.reach} />
        <NumberField label="Clicks" field="clicks" value={values.clicks} onChange={onChange} error={errors.clicks} />
        <NumberField label="Spend (USD)" field="spend" value={values.spend} onChange={onChange} error={errors.spend} />
      </Grid>

      <SectionLabel>Video Metrics</SectionLabel>
      <Grid container spacing={2}>
        <NumberField label="Hook Views (3s/2s)" field="hookViews" value={values.hookViews} onChange={onChange} error={errors.hookViews} />
        <NumberField label="Held Views" field="heldViews" value={values.heldViews} onChange={onChange} error={errors.heldViews} />
      </Grid>

      {showEngagement && (
        <>
          <SectionLabel>Engagement Metrics</SectionLabel>
          <Grid container spacing={2}>
            <NumberField label="Engagements (likes+comments+shares+saves)" field="engagements" value={values.engagements} onChange={onChange} error={errors.engagements} />
          </Grid>
        </>
      )}

      {showConversion && (
        <>
          <SectionLabel>Conversion Metrics</SectionLabel>
          <Grid container spacing={2}>
            <NumberField label="Conversions / Results" field="conversions" value={values.conversions} onChange={onChange} error={errors.conversions} />
          </Grid>
        </>
      )}
    </Box>
  );
}
