import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

/**
 * YearSelect 컴포넌트
 *
 * 보고서 목록의 연도 필터 드롭다운. LanguageSwitch와 같은 높이·테두리·radius·글자(size small, 32px, 13px)라
 * 머리글 오른쪽에 나란히 놓인다 — 색 있는 탭이나 큰 필터 바를 만들지 않는다(2026-09-08). 선택지는 호출부가
 * 준다(schema recapEventYears — 실제로 이벤트가 있는 연도만, 최신순). 값은 호출부가 URL(?year=)과 동기화한다.
 *
 * Props:
 * @param {number} value - 현재 연도 [Required]
 * @param {number[]} years - 선택지(최신순) [Required]
 * @param {function} onChange - (year: number) => void [Required]
 * @param {string} label - 접근성 이름 [Optional, 기본값: 'Year']
 * @param {'sm'|'md'} size - 높이 단계 [Optional, 기본값: 'sm']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <YearSelect value={year} years={years} onChange={(next) => setSearchParams({ year: String(next) })} />
 */
export function YearSelect({ value, years, onChange, label = 'Year', size = 'sm', sx }) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      size="small"
      startAdornment={<CalendarTodayOutlinedIcon sx={(theme) => ({ fontSize: theme.iconSize.inline, color: 'text.secondary', mr: 0.75 })} />}
      slotProps={{ input: { 'aria-label': label } }}
      sx={{ minWidth: 96, fontSize: 13, height: size === 'sm' ? 32 : 40, fontVariantNumeric: 'tabular-nums', ...sx }}
    >
      {years.map((y) => (
        <MenuItem key={y} value={y} sx={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{y}</MenuItem>
      ))}
    </Select>
  );
}
