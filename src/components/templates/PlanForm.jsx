import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DateRangeField } from '../input/DateRangeField';
import { PLATFORM, planItemTotal, planTotal } from '../../data/schema';

const PLATFORM_OPTIONS = [
  { value: PLATFORM.META, label: 'Meta' },
  { value: PLATFORM.TIKTOK, label: 'TikTok' },
];

/** 새 단계의 기본값. 플랫폼만 정해두고 나머지는 사람이 채운다. */
const emptyItem = () => ({ label: '', platform: PLATFORM.META, startDate: '', endDate: '', budgetDaily: '' });

function FieldLabel({ children }) {
  return (
    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
      {children}
    </Typography>
  );
}

/** 금액 표기 — 계획 금액은 소수점이 의미 없어 정수로 반올림해 보여준다. */
function fmtMoney(amount) {
  return amount == null ? '—' : `$${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * PlanForm 컴포넌트
 *
 * 집행 **전에** 세우는 이벤트 계획 입력 폼. 캠페인 등록 폼이 아니다 — 이 앱은
 * 캠페인을 만들지 않는다(원본이 항상 Meta/TikTok에 있고, 여기서 만들면 성과가
 * 영원히 안 붙는 반쪽짜리가 된다). 계획은 그것과 별개로, 돈을 쓰기 전에 짜두고
 * 나중에 실제 집행과 대조하기 위한 문서다.
 *
 * **이름이 대조 키다.** plans.name = campaigns.campaignGroup이라, 이름이 실제
 * 이벤트와 같아야 나중에 "계획 vs 실제"가 붙는다. 그래서 이름 칸은 기존 이벤트
 * 목록에서 고르되 **새 이름도 칠 수 있는**(freeSolo) 형태다 — 이미 집행한
 * 이벤트에 사후 계획을 붙이는 경우와, 아직 없는 이벤트를 미리 계획하는 경우가
 * 둘 다 실제로 있기 때문이다.
 *
 * 총액은 입력받지 않는다. 일일 예산 × 기간으로 계산해서 읽기 전용으로 보여준다 —
 * 두 값을 다 입력받으면 서로 어긋났을 때 어느 쪽이 맞는지 알 수 없고, 광고
 * 관리자에서 실제로 설정하는 값도 일일 예산이다(캠페인 폼의 Planned Budget과
 * 같은 규칙).
 *
 * Props:
 * @param {{name: string, notes: string, items: Array<{label: string, platform: string, startDate: string, endDate: string, budgetDaily: string|number}>}} values - 폼 값 [Required]
 * @param {function} onChange - 최상위 필드 변경 (field, value) => void [Required]
 * @param {function} onItemsChange - 단계 목록 전체 변경 (items) => void [Required]
 * @param {string[]} eventOptions - 이름 칸의 추천 목록(기존 이벤트 이름) [Optional, 기본값: []]
 * @param {object} errors - 필드별 오류 메시지 { name, items: [{label, dates, budgetDaily}] } [Optional, 기본값: {}]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <PlanForm values={values} onChange={handleChange} onItemsChange={setItems} eventOptions={eventNames} />
 */
export function PlanForm({ values, onChange, onItemsChange, eventOptions = [], errors = {}, sx }) {
  const items = values.items ?? [];
  const itemErrors = errors.items ?? [];

  const updateItem = (index, field, value) => {
    onItemsChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  // 계산은 schema.js가 한다 — 화면이 자기만의 계산을 들고 있으면 Reports의
  // 대조 뷰와 숫자가 갈릴 수 있다.
  const total = planTotal({ items: items.map((i) => ({ ...i, budgetDaily: Number(i.budgetDaily) })) });

  return (
    <Box sx={sx}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <FieldLabel>Event</FieldLabel>
          {/* freeSolo — 기존 이벤트를 고를 수도, 아직 없는 이름을 칠 수도 있다.
              이 값이 실제 캠페인의 Event와 같아야 대조가 붙으므로 helperText로
              그 사실을 말한다(안 그러면 "왜 실제가 안 뜨지"가 된다). */}
          <Autocomplete
            freeSolo
            options={eventOptions}
            value={values.name ?? ''}
            onInputChange={(_, next) => onChange('name', next)}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="e.g. G10 Opening"
                error={Boolean(errors.name)}
                helperText={errors.name || 'Must match the campaign Event name for actuals to line up'}
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <FieldLabel>Notes (optional)</FieldLabel>
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={values.notes ?? ''}
            onChange={(e) => onChange('notes', e.target.value)}
            slotProps={{ htmlInput: { 'aria-label': 'Notes' } }}
          />
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Phases
            </Typography>
            {/* 합계는 입력이 아니라 결과다 — 항목을 고칠 때마다 여기서 바로
                확인되어야 "얼마짜리 계획인지"를 따로 계산하지 않는다. */}
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Planned total <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{fmtMoney(total)}</Box>
            </Typography>
          </Box>

          {items.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No phases yet. Add one to start planning the budget.
            </Typography>
          )}

          {items.map((item, index) => {
            const rowError = itemErrors[index] ?? {};
            const rowTotal = planItemTotal({ ...item, budgetDaily: Number(item.budgetDaily) });
            return (
              <Grid
                container
                spacing={1}
                key={index}
                sx={{ mb: 1.5, alignItems: 'flex-start' }}
              >
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Phase (e.g. Coming Soon)"
                    value={item.label}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                    error={Boolean(rowError.label)}
                    helperText={rowError.label}
                    slotProps={{ htmlInput: { 'aria-label': `Phase ${index + 1} name` } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <Select
                    fullWidth
                    size="small"
                    value={item.platform}
                    onChange={(e) => updateItem(index, 'platform', e.target.value)}
                    slotProps={{ input: { 'aria-label': `Phase ${index + 1} platform` } }}
                  >
                    {PLATFORM_OPTIONS.map((p) => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <DateRangeField
                    value={{ start: item.startDate ?? '', end: item.endDate ?? '' }}
                    onChange={({ start, end }) => {
                      onItemsChange(items.map((it, i) => (i === index ? { ...it, startDate: start, endDate: end } : it)));
                    }}
                    error={Boolean(rowError.dates)}
                    helperText={rowError.dates}
                    label={`Phase ${index + 1} dates`}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="$/day"
                    value={item.budgetDaily}
                    onChange={(e) => updateItem(index, 'budgetDaily', e.target.value)}
                    error={Boolean(rowError.budgetDaily)}
                    helperText={rowError.budgetDaily}
                    slotProps={{ htmlInput: { 'aria-label': `Phase ${index + 1} daily budget`, inputMode: 'decimal' } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  {/* 이 줄이 얼마짜리인지 그 자리에서 말한다. 입력이 아니라
                      계산 결과라 읽기 전용 텍스트로 둔다. */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 40 }}>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', flex: 1 }}>
                      {fmtMoney(rowTotal)}
                    </Typography>
                    <Tooltip title="Remove phase">
                      <IconButton
                        size="small"
                        onClick={() => onItemsChange(items.filter((_, i) => i !== index))}
                        aria-label={`Remove phase ${index + 1}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            );
          })}

          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => onItemsChange([...items, emptyItem()])}
            sx={{ boxShadow: 'none' }}
          >
            Add phase
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
