import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { t } from '../../data/recapStrings';

/** 표시 순서 — en이 기본이라 맨 앞 */
const LANGS = ['en', 'ko', 'zh-Hant'];
/** 버튼 라벨은 각 언어의 자기 이름 — 영어권 상사도 한국어권 팀원도 자기 언어를 찾는다 */
const SELF_LABEL = { en: 'EN', ko: '한국어', 'zh-Hant': '繁中' };

/**
 * LanguageSwitch 컴포넌트
 *
 * Recap 문서의 언어 전환(en / ko / zh-Hant). Recap에만 노출한다 — 운영자 화면은
 * 영어 그대로다(01-project-summary 제약). 값은 호출부가 URL(?lang=)과 동기화한다.
 * 버튼 라벨은 각 언어의 자기 이름이고 툴팁(aria-label)은 현재 언어의 문구다.
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
    <ToggleButtonGroup
      exclusive
      size={size === 'sm' ? 'small' : 'medium'}
      value={value}
      onChange={(_, next) => { if (next) onChange(next); }}
      aria-label={t('recap.edit.langTab', value)}
      sx={sx}
    >
      {LANGS.map((lang) => (
        <ToggleButton key={lang} value={lang} aria-label={t(`lang.${lang}`, value)} sx={{ px: 1.25, fontSize: 12 }}>
          {SELF_LABEL[lang]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
