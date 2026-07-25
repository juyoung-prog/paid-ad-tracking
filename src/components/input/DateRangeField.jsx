import { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIso(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function isoToDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

// 6주(42칸) 고정 그리드 — 월마다 주 수가 달라 칸 수가 들쭉날쭉해지는 것보다
// 항상 같은 높이가 레이아웃이 안정적이다(달 넘길 때 팝오버 크기가 안 흔들림).
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    cells.push({
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      iso: toIso(date.getFullYear(), date.getMonth(), date.getDate()),
    });
  }
  return cells;
}

/**
 * DateRangeField 컴포넌트
 *
 * 시작일/종료일을 각각 따로 타이핑하던 것(LocalizedDateField 2개)을 캘린더
 * 팝오버 하나로 합쳤다 — 클릭 한 번으로 팝오버를 열고, 시작일을 클릭한 뒤
 * 종료일을 클릭하면 자동으로 닫힌다(시작일보다 이른 날을 클릭하면 그 날짜를
 * 새 시작일로 다시 잡는다, 흔한 날짜 범위 선택 관례). 마우스를 올리는 동안엔
 * 시작일부터 커서 아래까지 범위를 미리 보여준다.
 *
 * 내부적으로 여전히 ISO 8601('YYYY-MM-DD') 문자열을 주고받는다 — 이 프로젝트의
 * 다른 날짜 필드와 포맷이 같다. 새 날짜 피커 라이브러리를 추가하지 않고
 * 직접 만들었다(LocalizedDateField와 같은 이유 — 이 프로젝트의 "영어 전용
 * MM/DD/YYYY" 표시 요구사항을 로케일 의존 없이 지키기 위함).
 *
 * Props:
 * 한 번 범위를 고르면 캘린더를 다시 열어도 날짜를 클릭하는 것만 가능하고
 * 빈 상태로 되돌아갈 방법이 없었다 — 실무자 리뷰로 발견한 실제 막다른 길
 * (gulf of execution). 값이 있을 때만 캘린더 아이콘 왼쪽에 × 지우기 버튼을
 * 보여줘서 한 번의 클릭으로 완전히 빈 상태로 되돌릴 수 있게 한다.
 *
 * @param {{ start: string, end: string }} value - 시작/종료일 (ISO 8601, 미선택이면 '') [Required]
 * @param {function} onChange - 범위 변경 핸들러 ({ start, end }) => void [Required]
 * @param {boolean} error - 에러 상태 [Optional]
 * @param {string} helperText - 에러/도움말 텍스트 [Optional]
 * @param {string} label - 접근성용 라벨. 호출부가 이 필드 위에 별도 캡션(Typography)을
 *   시각적으로만 얹는 경우가 많아서(CampaignForm의 FieldLabel 패턴), 스크린리더가
 *   읽을 수 있는 이름이 없었다 — aria-label로 내부 TextField에 직접 연결한다
 *   [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <DateRangeField
 *   value={{ start: values.startDate, end: values.endDate }}
 *   onChange={({ start, end }) => { onChange('startDate', start); onChange('endDate', end); }}
 *   label="Campaign Dates"
 * />
 */
export function DateRangeField({ value, onChange, error, helperText, label, sx }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [hoverIso, setHoverIso] = useState(null);
  const initial = value.start ? new Date(value.start) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const displayText =
    value.start && value.end
      ? `${isoToDisplay(value.start)} – ${isoToDisplay(value.end)}`
      : value.start
        ? `${isoToDisplay(value.start)} – …`
        : '';

  function goToMonth(delta) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  function handleDayClick(iso) {
    const hasStart = Boolean(value.start);
    const hasEnd = Boolean(value.end);
    if (!hasStart || hasEnd) {
      onChange({ start: iso, end: '' });
      return;
    }
    if (iso < value.start) {
      onChange({ start: iso, end: '' });
      return;
    }
    onChange({ start: value.start, end: iso });
    setAnchorEl(null);
  }

  const isSelectingEnd = Boolean(value.start) && !value.end;
  const previewEnd = isSelectingEnd ? hoverIso : null;
  const rangeEndForHighlight = value.end || previewEnd;
  const [lo, hi] =
    value.start && rangeEndForHighlight && rangeEndForHighlight < value.start
      ? [rangeEndForHighlight, value.start]
      : [value.start, rangeEndForHighlight];

  const cells = buildMonthGrid(viewYear, viewMonth);

  return (
    <>
      {/* 캘린더 아이콘 — 이 필드는 겉보기엔 일반 텍스트 인풋과 똑같은데 실제로는
          클릭하면 팝오버가 열리는 버튼이다(타이핑 입력이 아님). 아이콘 없이는
          "직접 타이핑해야 하나?" 오해를 살 수 있어(Donald Norman 리뷰: 시그니파이어
          부재), Platform 드롭다운의 ▾ 화살표처럼 상호작용 방식을 미리 알려준다. */}
      <TextField
        fullWidth
        size="small"
        placeholder="Select dates"
        value={displayText}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        error={error}
        helperText={helperText}
        slotProps={{
          // htmlInput(네이티브 <input> 자체)에 aria-label을 줘야 스크린리더가
          // 확실히 읽는다 — TextField 루트에 얹으면 내부 래퍼 div로 갈 수 있어
          // 명시적으로 이 슬롯을 쓴다.
          htmlInput: { 'aria-label': label },
          input: {
            readOnly: true,
            sx: { cursor: 'pointer' },
            endAdornment: (
              <InputAdornment position="end">
                {value.start && (
                  <IconButton
                    size="small"
                    aria-label="Clear dates"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnchorEl(null);
                      onChange({ start: '', end: '' });
                    }}
                    sx={{ p: 0.25, mr: 0.25 }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
                <CalendarTodayOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={sx}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <IconButton size="small" onClick={() => goToMonth(-1)} aria-label="Previous month">
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {MONTH_LABELS[viewMonth]} {viewYear}
            </Typography>
            <IconButton size="small" onClick={() => goToMonth(1)} aria-label="Next month">
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25, mb: 0.5 }}>
            {WEEKDAY_LABELS.map((label, i) => (
              <Typography key={i} variant="caption" align="center" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {label}
              </Typography>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }} onMouseLeave={() => setHoverIso(null)}>
            {cells.map((cell) => {
              const isEndpoint = cell.iso === value.start || cell.iso === value.end;
              const inRange = lo && hi && cell.iso >= lo && cell.iso <= hi;
              return (
                <Box
                  key={cell.iso}
                  component="button"
                  type="button"
                  onClick={() => handleDayClick(cell.iso)}
                  onMouseEnter={() => setHoverIso(cell.iso)}
                  sx={{
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    height: 32,
                    borderRadius: isEndpoint ? '50%' : 0,
                    backgroundColor: isEndpoint
                      ? 'primary.main'
                      : inRange
                        ? (theme) => alpha(theme.palette.primary.main, 0.12)
                        : 'transparent',
                    color: isEndpoint ? 'primary.contrastText' : cell.inMonth ? 'text.primary' : 'text.disabled',
                    fontWeight: isEndpoint ? 700 : 400,
                    '&:hover': { backgroundColor: isEndpoint ? 'primary.dark' : 'action.hover' },
                  }}
                >
                  {cell.day}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
