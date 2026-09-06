import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import { t } from '../../data/recapStrings';

/** 표시 순서 — en이 기본이라 맨 앞 */
const LANGS = ['en', 'ko', 'zh-Hant'];
/** 항목 라벨은 각 언어의 자기 이름 — 영어권 상사도 한국어권 팀원도 자기 언어를 찾는다 */
const SELF_LABEL = { en: 'English', ko: '한국어', 'zh-Hant': '繁體中文' };
/** 닫힌 상태의 짧은 표기 — 툴바에서 자리를 덜 차지한다 */
const SHORT_LABEL = { en: 'EN', ko: '한국어', 'zh-Hant': '繁中' };

/**
 * LanguageSwitch 컴포넌트
 *
 * Recap 문서의 언어 선택(en / ko / zh-Hant) 드롭다운. Recap에만 노출한다 —
 * 운영자 화면은 영어 그대로다(01-project-summary 제약). 값은 호출부가 URL(?lang=)과
 * 동기화한다. 닫혀 있을 때는 짧은 표기(EN · 한국어 · 繁中), 열면 각 언어의
 * 자기 이름이 나온다. 한때 토글 버튼 셋이었는데 툴바에 내보내기 메뉴까지
 * 늘어나면서 드롭다운으로 바꿨다(사용자 결정, 2026-09).
 *
 * Props:
 * @param {'en'|'ko'|'zh-Hant'} value - 현재 언어 [Required]
 * @param {function} onChange - (lang) => void [Required]
 * @param {'sm'|'md'} size - 높이 단계 [Optional, 기본값: 'sm']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <LanguageSwitch value={lang} onChange={(next) => setSearchParams({ lang: next })} />
 */
export function LanguageSwitch({ value, onChange, size = 'sm', sx }) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      renderValue={(v) => SHORT_LABEL[v] ?? v}
      startAdornment={<LanguageOutlinedIcon sx={(theme) => ({ fontSize: theme.iconSize.inline, color: 'text.secondary', mr: 0.75 })} />}
      slotProps={{ input: { 'aria-label': t('recap.edit.langTab', value) } }}
      sx={{ minWidth: 104, fontSize: 13, height: size === 'sm' ? 32 : 40, ...sx }}
    >
      {LANGS.map((lang) => (
        <MenuItem key={lang} value={lang} sx={{ fontSize: 13 }}>{SELF_LABEL[lang]}</MenuItem>
      ))}
    </Select>
  );
}
