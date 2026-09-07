import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { toDateKey } from '../../../data/beautymaster/schema.js';

/** 자정으로 내린 사본 — 시각이 섞이면 같은 날인데도 비교가 어긋난다 */
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** 요일 머리글 — 일요일 시작(매장이 미국에 있고 화면 전체가 en-US 표기를 쓴다) */
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * SaasRangeCalendar component
 *
 * 달력 한 판에서 기간(시작~끝)을 연속 두 클릭으로 고르는 범위 선택 달력.
 * 첫 클릭이 시작점을 잡고(달력은 열린 채), 두 번째 클릭에서 범위가 확정돼
 * onChange가 한 번 불린다 — 끝을 시작보다 앞에 찍으면 순서를 맞춰 내보낸다.
 * 고르는 중에는 시작점~마우스 위치가 미리 칠해져 어디까지 고르는지 보인다.
 *
 * 날짜는 전부 new Date(y, m, d)로 만들어 로컬 자정이다 — 문자열 파싱이 없어
 * new Date('2026-08-20')의 UTC 하루 밀림이 아예 생길 수 없다.
 * 값이 밖에서 바뀌면(프리셋 등) 고르다 만 시작점은 무효로 버린다.
 *
 * Props:
 * @param {object} value - 현재 기간 { from: Date|null, to: Date|null } [Required]
 * @param {function} onChange - 범위 확정 핸들러 ({ from, to }) => void. 두 번째 클릭에서만 불린다 [Optional]
 * @param {Date} today - 오늘 표시·첫 화면 달 기준일. 테스트 주입점 [Optional, 기본값: new Date()]
 * @param {object} sx - 바깥 Box에 적용할 MUI sx 오버라이드 [Optional]
 *
 * Example usage:
 * <SaasRangeCalendar value={range} onChange={setRange} />
 */
function SaasRangeCalendar({ value, onChange, today = new Date(), sx }) {
  const range = value ?? { from: null, to: null };
  const anchor = range.from ?? range.to ?? today;
  const [viewMonth, setViewMonth] = useState(startOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 1)));
  const [draftFrom, setDraftFrom] = useState(null);
  const [hovered, setHovered] = useState(null);

  /* 밖에서 값이 바뀌면(프리셋 클릭 등) 고르다 만 시작점은 이미 옛 맥락이다 */
  const valueKey = `${toDateKey(range.from)}~${toDateKey(range.to)}`;
  useEffect(() => {
    setDraftFrom(null);
    setHovered(null);
  }, [valueKey]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = new Date(year, month, 1).getDay();

  /* 칠할 범위 — 고르는 중엔 시작점~마우스 위치, 아니면 확정된 값(양끝이 다 있을 때만) */
  const spanPair = draftFrom
    ? [draftFrom, hovered ?? draftFrom]
    : range.from && range.to ? [range.from, range.to] : null;
  const [spanStart, spanEnd] = spanPair
    ? [...spanPair].sort((a, b) => a - b).map(d => startOfDay(d).getTime())
    : [null, null];

  /* 진하게 채울 끝점 — 고르는 중엔 시작점 하나, 아니면 확정된 양끝 */
  const endTimes = new Set(
    (draftFrom ? [draftFrom] : [range.from, range.to].filter(Boolean)).map(d => startOfDay(d).getTime()),
  );

  const pick = date => {
    if (!draftFrom) {
      setDraftFrom(date);
      return;
    }
    // 끝을 시작보다 앞에 찍어도 막지 않는다 — 순서만 맞춰 내보낸다
    const [from, to] = draftFrom <= date ? [draftFrom, date] : [date, draftFrom];
    setDraftFrom(null);
    setHovered(null);
    onChange?.({ from, to });
  };

  return (
    <Box sx={{ p: 1.5, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <IconButton
          size="small"
          aria-label="Previous month"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
        >
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton
          size="small"
          aria-label="Next month"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
        >
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* 셀 사이 gap을 두지 않는다 — 범위 띠가 점선처럼 끊겨 보인다 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 32px)' }}>
        {WEEKDAYS.map((day, i) => (
          <Typography
            key={`${day}-${i}`}
            aria-hidden
            sx={{ fontSize: 10, color: 'text.disabled', textAlign: 'center', lineHeight: '24px' }}
          >
            {day}
          </Typography>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <Box key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(year, month, i + 1);
          const time = date.getTime();
          const isEnd = endTimes.has(time);
          const inSpan = spanStart !== null && time >= spanStart && time <= spanEnd;
          const isToday = time === startOfDay(today).getTime();
          return (
            <ButtonBase
              key={time}
              aria-label={date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              aria-pressed={isEnd}
              onClick={() => pick(date)}
              onMouseEnter={() => setHovered(date)}
              onMouseLeave={() => setHovered(h => (h?.getTime() === time ? null : h))}
              sx={{
                height: 32,
                fontSize: 12,
                fontFamily: 'inherit',
                fontVariantNumeric: 'tabular-nums',
                /* 끝점만 둥글다 — 사이 띠는 각져야 한 덩어리로 이어져 보인다 */
                borderRadius: isEnd ? '6px' : 0,
                ...(inSpan && !isEnd && { backgroundColor: 'accent.tint' }),
                ...(isEnd
                  ? { backgroundColor: 'accent.main', color: 'common.white' }
                  : { '&:hover': { backgroundColor: 'action.hover' } }),
                ...(isToday && !isEnd && { fontWeight: 700, color: 'accent.main' }),
              }}
            >
              {i + 1}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

export default SaasRangeCalendar;
