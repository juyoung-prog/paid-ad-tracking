import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { t } from '../../data/recapStrings';

const EMPTY_TEXT = { en: '', ko: null, 'zh-Hant': null };

/** LocalizedText의 한 언어 칸을 바꾼 새 객체 */
function withLang(text, lang, value) {
  return { ...EMPTY_TEXT, ...(text ?? {}), [lang]: value };
}

/**
 * RecapLearningsEditor 컴포넌트
 *
 * 이벤트 단위의 글 — 보고서 상태(draft/final), 요약 한 단락, "배운 점" 카드
 * 목록(제목 + 본문, 추가·삭제·순서), 다음 제언. 이전 보고서의 Learnings 탭을
 * 그대로 옮긴 구조다.
 *
 * 언어별 칸 중 `lang` 하나만 편집하고 저장은 하지 않는다(onChange로 patch).
 *
 * Props:
 * @param {{ status: 'draft'|'final', summary: object|null, learnings: Array<{ title: object, body: object }>, nextSteps: object|null }} recap - 편집 중인 보고서 [Required]
 * @param {function} onChange - (patch) => void. 바뀐 필드만 담은 부분 객체 [Required]
 * @param {string} lang - 편집할 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {boolean} isDisabled - 저장 중 등 잠금 [Optional, 기본값: false]
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapLearningsEditor recap={draft.recap} onChange={(patch) => setDraft((d) => ({ ...d, recap: { ...d.recap, ...patch } }))} />
 */
export function RecapLearningsEditor({ recap, onChange, lang = 'en', isDisabled = false, sx }) {
  const learnings = recap?.learnings ?? [];

  const updateLearning = (index, key, value) => {
    const next = learnings.map((item, i) => (i === index ? { ...item, [key]: withLang(item[key], lang, value) } : item));
    onChange({ learnings: next });
  };
  const moveLearning = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= learnings.length) return;
    const next = [...learnings];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ learnings: next });
  };

  return (
    <Box sx={sx}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>{t('recap.edit.status', lang)}</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={recap?.status ?? 'draft'}
          onChange={(_, next) => { if (next) onChange({ status: next }); }}
          disabled={isDisabled}
          aria-label={t('recap.edit.status', lang)}
        >
          <ToggleButton value="draft" sx={{ px: 1.25 }}>{t('recap.status.draft', lang)}</ToggleButton>
          <ToggleButton value="final" sx={{ px: 1.25 }}>{t('recap.status.final', lang)}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <TextField
        label={t('recap.edit.summary', lang)}
        helperText={t('recap.edit.summaryHint', lang)}
        value={recap?.summary?.[lang] ?? ''}
        onChange={(e) => onChange({ summary: withLang(recap?.summary, lang, e.target.value) })}
        multiline
        minRows={3}
        size="small"
        fullWidth
        disabled={isDisabled}
        sx={{ mb: 3 }}
        slotProps={{ input: { sx: { fontSize: 13 } } }}
      />

      <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 1 }}>{t('recap.edit.learnings', lang)}</Typography>
      <Box sx={{ display: 'grid', gap: 1.5, mb: 1.5 }}>
        {learnings.map((item, index) => (
          <Box
            key={index}
            sx={(theme) => ({
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 2fr) auto' },
              gap: 1.5,
              alignItems: 'start',
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${theme.shape.radius.control}px`,
            })}
          >
            <TextField
              label={`${index + 1}. ${t('recap.edit.learningTitle', lang)}`}
              value={item.title?.[lang] ?? ''}
              onChange={(e) => updateLearning(index, 'title', e.target.value)}
              size="small"
              fullWidth
              disabled={isDisabled}
              slotProps={{ input: { sx: { fontSize: 13, fontWeight: 600 } } }}
            />
            <TextField
              label={t('recap.edit.learningBody', lang)}
              value={item.body?.[lang] ?? ''}
              onChange={(e) => updateLearning(index, 'body', e.target.value)}
              multiline
              minRows={2}
              size="small"
              fullWidth
              disabled={isDisabled}
              slotProps={{ input: { sx: { fontSize: 13 } } }}
            />
            <Box sx={{ display: 'flex', gap: 0.25, mt: 0.25 }}>
              <Tooltip title={t('recap.edit.moveUp', lang)}>
                <span><IconButton size="small" onClick={() => moveLearning(index, -1)} disabled={isDisabled || index === 0} aria-label={t('recap.edit.moveUp', lang)}><ArrowUpwardIcon fontSize="inherit" /></IconButton></span>
              </Tooltip>
              <Tooltip title={t('recap.edit.moveDown', lang)}>
                <span><IconButton size="small" onClick={() => moveLearning(index, 1)} disabled={isDisabled || index === learnings.length - 1} aria-label={t('recap.edit.moveDown', lang)}><ArrowDownwardIcon fontSize="inherit" /></IconButton></span>
              </Tooltip>
              <Tooltip title={t('recap.edit.removeLearning', lang)}>
                <span><IconButton size="small" onClick={() => onChange({ learnings: learnings.filter((_, i) => i !== index) })} disabled={isDisabled} aria-label={t('recap.edit.removeLearning', lang)}><DeleteOutlineIcon fontSize="inherit" /></IconButton></span>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Box>
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddIcon />}
        disabled={isDisabled}
        onClick={() => onChange({ learnings: [...learnings, { title: { ...EMPTY_TEXT }, body: { ...EMPTY_TEXT } }] })}
        sx={{ mb: 3 }}
      >
        {t('recap.edit.addLearning', lang)}
      </Button>

      <TextField
        label={t('recap.edit.nextSteps', lang)}
        helperText={t('recap.edit.nextStepsHint', lang)}
        value={recap?.nextSteps?.[lang] ?? ''}
        onChange={(e) => onChange({ nextSteps: withLang(recap?.nextSteps, lang, e.target.value) })}
        multiline
        minRows={2}
        size="small"
        fullWidth
        disabled={isDisabled}
        slotProps={{ input: { sx: { fontSize: 13 } } }}
      />
    </Box>
  );
}
