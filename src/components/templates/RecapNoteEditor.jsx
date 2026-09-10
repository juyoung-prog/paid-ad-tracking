import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { t } from '../../data/recapStrings';
import { withLang } from '../../data/schema';

/**
 * RecapNoteEditor 컴포넌트
 *
 * Recap 캠페인 한 줄의 **수기 입력** — 이유(Reason), 오가닉 조회·참여. 표의 캠페인 칸에 있는 작은 버튼으로 여는
 * 팝오버 안에 들어간다(2026-09-10) — 한 캠페인의 편집 자리는 그 줄 하나다.
 * What worked(장점)·Could improve(아쉬운 점)는 표 안에서 직접 고치므로 여기 없다(같은 값을 두 곳에서 고치지 않는다).
 * 평가(Good/Fair/Weak) 토글도 뺐다 — 등급은 제품에서 없앤 개념이고, 저장된 값과 시트 열은 그대로 남는다.
 * 여기 값들은 화면에 나오지 않는다: 이유는 시트 내보내기와 AI 초안이 쓰고, 오가닉은 아직 읽는 곳이 없다(수기 보관용).
 *
 * 언어별 칸(LocalizedText) 중 `lang` 하나만 편집한다 — 3단계에서 언어 탭이 이
 * prop을 바꾼다. 저장은 하지 않는다(onChange로 patch만 올린다). 문구는 recapStrings.
 *
 * Props:
 * @param {{ reason: object|null, organicViews: number|null, organicEngagements: number|null }|null} note - 편집 중인 코멘트(장점·아쉬운 점은 표에서, 평가는 더 이상 편집하지 않는다). null이면 빈 폼 [Required]
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
  return (
    <Box sx={sx}>
      <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 1.25 }}>{campaignLabel}</Typography>

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
