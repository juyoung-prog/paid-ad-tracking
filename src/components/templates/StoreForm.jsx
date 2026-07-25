import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { REGION, STORE_STATUS } from '../../data/schema';

const REGION_OPTIONS = [
  { value: REGION.GA, label: 'Georgia' },
  { value: REGION.FL, label: 'Florida' },
];

const STATUS_OPTIONS = [
  { value: STORE_STATUS.ACTIVE, label: 'Active' },
  { value: STORE_STATUS.PLANNED, label: 'Planned' },
  { value: STORE_STATUS.CLOSED, label: 'Closed' },
];

// 순전히 시각적인 캡션이다 — <label htmlFor>도 TextField/Select의 label prop도
// 아니라서 입력창과 프로그램적으로 연결되지 않는다. CampaignForm/PerformanceForm과
// 같은 이유로 이 폼의 모든 TextField/Select에도 slotProps aria-label을 준다
// (접근성 리뷰로 발견 — 이 파일만 그 수정에서 빠져 있었다).
function FieldLabel({ children }) {
  return (
    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
      {children}
    </Typography>
  );
}

/**
 * StoreForm 컴포넌트
 *
 * 매장 추가/수정 폼. 필드 4개(코드/이름/지역/상태)라 그룹핑 없이 2열로만 배치한다.
 * 검증 로직은 갖지 않는다 — errors prop으로 외부에서 주입.
 *
 * Props:
 * @param {object} values - 폼 값 { id, name, region, status } [Required]
 * @param {function} onChange - 필드 변경 핸들러 (field, value) => void [Required]
 * @param {boolean} isIdLocked - 코드 필드 잠금 (수정 모드에서 PK 변경 방지용) [Optional, 기본값: false]
 * @param {object} errors - 필드별 에러 메시지 { field: message } [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <StoreForm
 *   values={values}
 *   onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
 * />
 */
export function StoreForm({ values, onChange, isIdLocked = false, errors = {}, sx }) {
  return (
    <Box sx={sx}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldLabel>Store Code</FieldLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="G11"
            value={values.id ?? ''}
            onChange={(e) => onChange('id', e.target.value)}
            disabled={isIdLocked}
            error={Boolean(errors.id)}
            helperText={errors.id}
            slotProps={{ htmlInput: { 'aria-label': 'Store Code' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldLabel>Store Name</FieldLabel>
          <TextField
            fullWidth
            size="small"
            placeholder="Georgia - Savannah"
            value={values.name ?? ''}
            onChange={(e) => onChange('name', e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            slotProps={{ htmlInput: { 'aria-label': 'Store Name' } }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldLabel>Region</FieldLabel>
          <Select
            fullWidth
            size="small"
            value={values.region ?? ''}
            onChange={(e) => onChange('region', e.target.value)}
            slotProps={{ input: { 'aria-label': 'Region' } }}
          >
            {REGION_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FieldLabel>Status</FieldLabel>
          <Select
            fullWidth
            size="small"
            value={values.status ?? ''}
            onChange={(e) => onChange('status', e.target.value)}
            slotProps={{ input: { 'aria-label': 'Status' } }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </Grid>
      </Grid>
    </Box>
  );
}
