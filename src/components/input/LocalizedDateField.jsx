import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';

/**
 * ISO 8601 date('YYYY-MM-DD')를 화면 표시용 'MM/DD/YYYY'로 바꾼다.
 * @param {string} iso
 * @returns {string}
 */
function isoToDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${m}/${d}/${y}`;
}

/**
 * 타이핑 중인 숫자열(최대 8자리, MMDDYYYY)에 '/'를 자동 삽입한다.
 * @param {string} digits
 * @returns {string}
 */
function digitsToMasked(digits) {
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  return digits;
}

/**
 * 8자리(MMDDYYYY)가 다 채워졌을 때만 ISO 문자열로 변환, 아니면 null.
 * @param {string} digits
 * @returns {string|null}
 */
function digitsToIso(digits) {
  if (digits.length !== 8) return null;
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * LocalizedDateField 컴포넌트
 *
 * 항상 영어/미국 형식(MM/DD/YYYY)으로 표시되는 날짜 입력. 네이티브
 * `<input type="date">`를 쓰지 않는다 — 표시 포맷이 OS/브라우저 로케일을
 * 그대로 상속받아서, 로케일이 en-US가 아닌 환경에서는 이 프로젝트의
 * "영어 전용" 요구사항이 조용히 깨진다. 새 의존성(날짜 피커 라이브러리) 없이
 * 마스킹 텍스트 입력으로 해결한다 — 대신 네이티브 캘린더 팝업은 없다.
 *
 * 내부적으로는 계속 ISO 8601('YYYY-MM-DD') 문자열을 주고받는다 — 이 프로젝트의
 * 다른 모든 날짜 필드(Campaign.startDate 등)와 포맷이 동일하게 유지된다.
 *
 * Props:
 * @param {string} value - ISO 8601 date ('YYYY-MM-DD') 또는 빈 문자열 [Required]
 * @param {function} onChange - 완성된 날짜만 전달 (isoDate) => void. 입력 중에는 호출 안 함 [Required]
 * @param {boolean} error - 에러 상태 [Optional]
 * @param {string} helperText - 에러/도움말 텍스트 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <LocalizedDateField value={campaign.startDate} onChange={(iso) => onChange('startDate', iso)} />
 */
export function LocalizedDateField({ value, onChange, error, helperText, sx }) {
  const [display, setDisplay] = useState(isoToDisplay(value));

  // 외부에서 value가 바뀌면(폼 리셋 등) 표시값도 다시 맞춘다.
  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  const handleChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
    setDisplay(digitsToMasked(digits));

    if (digits.length === 0) {
      onChange('');
      return;
    }
    const iso = digitsToIso(digits);
    if (iso) onChange(iso);
  };

  return (
    <TextField
      fullWidth
      size="small"
      placeholder="MM/DD/YYYY"
      value={display}
      onChange={handleChange}
      error={error}
      helperText={helperText}
      inputProps={{ inputMode: 'numeric', maxLength: 10 }}
      sx={sx}
    />
  );
}
