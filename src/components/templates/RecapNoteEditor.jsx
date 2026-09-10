import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { t } from '../../data/recapStrings';
import { withLang } from '../../data/schema';

const VERDICTS = ['good', 'mid', 'bad'];

/**
 * RecapNoteEditor 컴포넌트
 *
 * Recap 표의 캠페인 한 줄에 딸린 **부가 입력** — 평가(good/mid/bad), 이유, 오가닉 조회·참여.
 * What worked(장점)·Could improve(아쉬운 점)는 2026-09-10부터 **표 안에서 직접** 고친다 —
 * 지표를 보면서 해석을 쓰도록. 같은 데이터를 두 곳에서 고치지 않게 여기서는 뺐다.
 * 평가·이유는 화면에 나오지 않고 시트 내보내기에만 남는 값이라 이 폼이 유일한 입력 자리다.
 * 자동 제안은 없다(2026-09-08). 비워 두면 비어 있는 채로 둔다.
 *
 * 언어별 칸(LocalizedText) 중 `lang` 하나만 편집한다 — 3단계에서 언어 탭이 이
 * prop을 바꾼다. 저장은 하지 않는다(onChange로 patch만 올린다). 문구는 recapStrings.
 *
 * Props:
 * @param {{ verdict: 'good'|'mid'|'bad'|null, reason: object|null, organicViews: number|null, organicEngagements: number|null }|null} note - 편집 중인 코멘트(장점·아쉬운 점은 표에서 고친다). null이면 빈 폼 [Required]
 * @param {string} campaignLabel - 이 줄이 어느 캠페인인지(단계 이름 + 플랫폼) [Required]
 * @param {function} onChange - (patch) => void. 바뀐 필드만 담은 부분 객체 [Required]
 * @param {string} lang - 편집할 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {boolean} isDisabled - 저장 중 등 잠금 [Optional, 기본값: false]
 * @param {string} hint - 문장 칸 아래 안내 한 줄 [Optional]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapNoteEditor note={draft.notes[row.campaignId]} campaignLabel="Grand Opening · Meta" onChange={(patch) => updateNote(row.campaignId, patch)} />
 */
export function RecapNoteEditor({ note, campaignLabel, onChange, lang = 'en', isDisabled = false, hint, sx }) {
  const verdict = note?.verdict ?? null;

  return (
    <Box sx={sx}>
      <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 1.25 }}>{campaignLabel}</Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
        <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', minWidth: 72 }}>{t('recap.edit.verdict', lang)}</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={verdict}
          onChange={(_, next) => onChange({ verdict: next })}
          disabled={isDisabled}
          aria-label={t('recap.edit.verdict', lang)}
        >
          {VERDICTS.map((v) => (
            <ToggleButton key={v} value={v} sx={{ px: 1.25 }}>{t(`verdict.${v}`, lang)}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr)' }, gap: 1.5, maxWidth: 560 }}>
        {['reason'].map((key) => (
          <TextField
            key={key}
            label={t(`recap.note.${key}`, lang)}
            value={note?.[key]?.[lang] ?? ''}
            onChange={(e) => onChange({ [key]: withLang(note?.[key], lang, e.target.value) })}
            multiline
            minRows={2}
            size="small"
            fullWidth
            disabled={isDisabled}
            slotProps={{ input: { sx: { fontSize: 13 } } }}
          />
        ))}
      </Box>

      {hint && <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75 }}>{hint}</Typography>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, mt: 1.5, maxWidth: 560 }}>
        {[['organicViews', 'recap.edit.organicViews'], ['organicEngagements', 'recap.edit.organicEngagements']].map(([key, labelKey]) => (
          <TextField
            key={key}
            label={t(labelKey, lang)}
            value={note?.[key] ?? ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              onChange({ [key]: raw === '' ? null : Number(raw) });
            }}
            size="small"
            fullWidth
            disabled={isDisabled}
            slotProps={{ htmlInput: { inputMode: 'numeric' }, input: { sx: { fontSize: 13, fontVariantNumeric: 'tabular-nums' } } }}
          />
        ))}
      </Box>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.75 }}>{t('recap.edit.organicHint', lang)}</Typography>
    </Box>
  );
}
