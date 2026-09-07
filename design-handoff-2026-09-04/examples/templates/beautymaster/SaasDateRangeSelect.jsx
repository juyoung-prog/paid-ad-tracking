import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Popover from '@mui/material/Popover';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { toDateKey } from '../../../data/beautymaster/schema.js';
import SaasRangeCalendar from './SaasRangeCalendar';

/** 자정으로 내린 사본 — 시각이 섞이면 같은 날인데도 프리셋 비교가 어긋난다 */
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, days) => {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
};

/**
 * 프리셋 — 자주 묻는 기간을 버튼 하나로 만든다.
 * 주는 일요일 시작이다(매장이 미국에 있고 화면 전체가 en-US 표기를 쓴다).
 */
const PRESETS = [
  { key: 'all', label: 'All', build: () => ({ from: null, to: null }) },
  { key: 'week', label: 'This week', build: today => ({ from: addDays(today, -today.getDay()), to: startOfDay(today) }) },
  { key: 'month', label: 'This month', build: today => ({ from: new Date(today.getFullYear(), today.getMonth(), 1), to: startOfDay(today) }) },
  { key: '30d', label: 'Last 30 days', build: today => ({ from: addDays(today, -29), to: startOfDay(today) }) },
];

/** 두 범위가 같은 날짜를 가리키는지 — Date 객체 비교는 항상 false라 키로 본다 */
const isSameRange = (a, b) => toDateKey(a?.from) === toDateKey(b?.from) && toDateKey(a?.to) === toDateKey(b?.to);

const fmtDay = date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtDayYear = date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * 트리거에 얹는 기간 문구 — 값만으로 무슨 기간인지 읽혀야 한다.
 * 열린 끝(null)은 From/Until로 말하고, 양끝이 다 열려 있으면 All time이다.
 */
function formatRangeLabel({ from, to }) {
  if (!from && !to) return 'All time';
  if (from && !to) return `From ${fmtDayYear(from)}`;
  if (!from && to) return `Until ${fmtDayYear(to)}`;
  const sameYear = from.getFullYear() === to.getFullYear();
  return `${sameYear ? fmtDay(from) : fmtDayYear(from)} – ${fmtDayYear(to)}`;
}

/**
 * SaasDateRangeSelect component
 *
 * flat-SaaS 시안의 기간(시작~종료) 선택 컨트롤. 프리셋 버튼 + 달력 트리거가
 * 같은 값을 가리킨다 — 프리셋을 누르면 트리거 문구가 따라가고, 달력에서 직접
 * 고르면 프리셋 선택이 풀린다(없는 프리셋을 눌린 채로 두면 화면이 거짓말을 한다).
 *
 * 달력은 팝오버 하나로 뜨고 시작·끝을 연속 두 클릭으로 고른다 — 입력 두 칸이던
 * 시절에는 시작을 고르고 닫고 끝을 다시 열어야 했다(2026-08-28 사장님 지적).
 * 범위가 확정되는 두 번째 클릭에서만 onChange가 불리고 팝오버가 닫힌다.
 *
 * Props:
 * @param {object} value - 현재 기간 { from: Date|null, to: Date|null }. null은 열린 끝(전체) [Required]
 * @param {function} onChange - 변경 핸들러 ({ from, to }) => void [Optional]
 * @param {Date} today - 프리셋·달력 기준일. 테스트 주입점 [Optional, 기본값: new Date()]
 * @param {object} sx - 바깥 Box에 적용할 MUI sx 오버라이드 [Optional]
 *
 * Example usage:
 * <SaasDateRangeSelect value={range} onChange={setRange} />
 */
function SaasDateRangeSelect({ value, onChange, today = new Date(), sx }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const range = value ?? { from: null, to: null };
  const activePreset = PRESETS.find(p => isSameRange(p.build(today), range))?.key ?? null;
  const label = formatRangeLabel(range);
  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, ...sx }}>
      {/* 테마는 flat(shape.borderRadius 0)이라 그룹에 radius를 직접 줘야 한다 —
          빼먹으면 이 그룹만 완전 각짐으로 렌더돼 옆 컨트롤(6px)과 어긋난다(issue11).
          모서리는 그룹과 양끝 버튼이 따로 갖고 있어 세 군데 다 맞춘다. */}
      <ToggleButtonGroup
        size="small"
        value={activePreset}
        exclusive
        onChange={(_, key) => {
          const preset = PRESETS.find(p => p.key === key);
          if (preset) onChange?.(preset.build(today));
        }}
        sx={{
          borderRadius: '6px',
          '& .MuiToggleButtonGroup-firstButton': { borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' },
          '& .MuiToggleButtonGroup-lastButton': { borderTopRightRadius: '6px', borderBottomRightRadius: '6px' },
        }}
      >
        {PRESETS.map(preset => (
          /* 높이 36은 옆 트리거와 같은 값 — 한 줄에 놓이는 컨트롤은 같은 문법을 쓴다 */
          <ToggleButton key={preset.key} value={preset.key} sx={{ height: 36, px: 1.25, py: 0, fontSize: 11 }}>
            {preset.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <ButtonBase
        onClick={e => setAnchorEl(e.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={open || undefined}
        aria-label={`Select date range (${label})`}
        sx={{
          height: 36,
          px: 1.25,
          gap: 0.75,
          // 문구 길이(All time ↔ Jul 22 – Aug 20, 2026)에 따라 옆 컨트롤이 밀리지 않게
          minWidth: 170,
          justifyContent: 'flex-start',
          borderRadius: '6px',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          fontSize: 12,
          fontFamily: 'inherit',
          fontVariantNumeric: 'tabular-nums',
          color: 'text.primary',
          '&:hover': { backgroundColor: 'action.hover' },
          /* SaasStoreSelect와 같은 포커스 문법 — 테두리는 1px 유지, 링 번짐으로만 알린다 */
          '&.Mui-focusVisible': {
            borderColor: 'accent.main',
            boxShadow: theme => `0 0 0 3px ${theme.palette.accent.ring}`,
          },
        }}
      >
        <CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        {label}
      </ButtonBase>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          /* Select 드롭다운과 같은 표면 — 테마 Paper는 각지므로 여기도 6px로 맞춘다 */
          paper: { elevation: 2, sx: { mt: 0.5, borderRadius: '6px', border: '1px solid', borderColor: 'divider' } },
        }}
      >
        <SaasRangeCalendar
          value={range}
          today={today}
          onChange={next => {
            onChange?.(next);
            setAnchorEl(null);
          }}
        />
      </Popover>
    </Box>
  );
}

export default SaasDateRangeSelect;
