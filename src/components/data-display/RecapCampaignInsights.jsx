import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { t, metricLabel, benchmarkPositionText } from '../../data/recapStrings';

const FIELDS = ['strength', 'weakness', 'reason'];

/** 근거 수준 → 글자색. 해석(inferred)은 보조색으로 한 단 내려 "확정 아님"을 보인다 */
const LEVEL_COLOR = {
  observed: 'text.secondary',
  compared: 'text.secondary',
  inferred: 'text.secondary',
  unknown: 'text.disabled',
};

/** 재료(schema.js buildCampaignInsight) 한 칸 → 문장. 문장 조립은 recapStrings에서만 */
function sentenceFor(field, item, row, platformLabel, lang) {
  if (!item) return null;
  const platform = platformLabel[row.platform] ?? row.platform;
  const scope = item.scope === 'phase'
    ? t('insight.scope.phase', lang, { platform, phase: row.phaseName })
    : t('insight.scope.goal', lang, { platform, goal: t(`goal.${row.goal}`, lang) });
  if (field === 'reason') {
    switch (item.kind) {
      case 'noData': return t('insight.noData', lang);
      case 'noPeers': return t('insight.noPeers', lang);
      case 'singleSignal': return t(item.isStrong ? 'insight.reason.singleSignalStrong' : 'insight.reason.singleSignalWeak', lang, { aspect: t(`aspect.${item.aspect}`, lang) });
      default: return t(`insight.reason.${item.kind}`, lang);
    }
  }
  if (item.kind === 'overspend') return t('insight.weakness.overspend', lang, { pct: item.pct });
  return t(field === 'strength' ? 'insight.strength.ranked' : 'insight.weakness.ranked', lang, {
    aspect: t(`aspect.${item.aspect}`, lang),
    metric: metricLabel(item.metricKey, lang),
    position: benchmarkPositionText(item.stat, lang),
    n: item.n,
    scope,
  });
}

/**
 * RecapCampaignInsights 컴포넌트
 *
 * Recap의 Notes 카드 본문 — 캠페인마다 Strength · Weakness · Why 세 칸. 각 칸은
 * **사람이 쓴 글이 있으면 그것**, 없으면 데이터에서 만든 문장(schema.js
 * buildCampaignInsight)을 근거 수준 표시(observed / compared / inferred / unknown)와
 * 함께 보여준다. 데이터 문장은 원인을 지어내지 않는다 — 소재·타겟·메시지에 대한
 * 정보가 데이터에 없기 때문이고, 해석(inferred)은 "~일 수 있다"로만 말한다.
 *
 * 표에 있는 숫자를 반복하지 않고 "비교군 중 어디"만 근거로 붙인다. 계산은 없다 —
 * rows는 페이지가 buildRecapRows + buildCampaignInsight로 만든 결과다.
 *
 * Props:
 * @param {Array<{ campaignId: string, phaseName: string, platform: string, goal: string, note: object|null, insight: { hasData: boolean, strength: object|null, weakness: object|null, reason: object } }>} rows - 캠페인 행 + 해석 재료 [Required]
 * @param {Object<string, string>} platformLabel - 플랫폼 값 → 표시명 [Optional, 기본값: {}]
 * @param {function} localize - LocalizedText → { value, isFallback } (schema.js localizedText를 lang에 묶어 넘긴다) [Required]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapCampaignInsights rows={rowsWithInsight} platformLabel={PLATFORM_LABEL} localize={(text) => localizedText(text, lang)} lang={lang} />
 */
export function RecapCampaignInsights({ rows, platformLabel = {}, localize, lang = 'en', sx }) {
  return (
    <Box sx={sx}>
      {rows.map((r, i) => (
        <Box key={r.campaignId} sx={{ px: 2, py: 1.5, borderBottom: i < rows.length - 1 ? '1px solid' : 0, borderColor: 'divider' }}>
          <Typography component="h3" sx={{ fontSize: 13, fontWeight: 600, m: 0, mb: 0.75 }}>
            {r.phaseName}
            <Box component="span" sx={{ ml: 1, fontWeight: 400, color: 'text.secondary' }}>{platformLabel[r.platform] ?? r.platform}</Box>
          </Typography>
          {!r.insight?.hasData && !FIELDS.some((f) => localize(r.note?.[f]).value) ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('insight.noData', lang)}</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              {FIELDS.map((field) => {
                const written = localize(r.note?.[field]);
                const item = r.insight?.[field] ?? null;
                const auto = written.value ? null : sentenceFor(field, item, r, platformLabel, lang);
                const level = written.value ? 'written' : (item?.level ?? 'unknown');
                return (
                  <Box key={field}>
                    <Typography component="span" sx={{ display: 'block', fontSize: 11, color: 'text.secondary', mb: 0.25 }}>
                      {t(`recap.note.${field}`, lang)}
                      {(written.value || auto) && (
                        <Tooltip title={written.value ? '' : t('insight.autoHint', lang)} placement="top">
                          <Box component="span" sx={{ ml: 0.75, color: LEVEL_COLOR[level] ?? 'text.disabled', fontWeight: 400 }}>
                            · {t(written.value ? 'insight.written' : `insight.level.${level}`, lang)}
                          </Box>
                        </Tooltip>
                      )}
                    </Typography>
                    {written.value ? (
                      <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                        {written.value}
                        {written.isFallback && <Box component="span" sx={{ ml: 0.75, fontSize: 11, color: 'text.secondary' }}>{t('lang.fallback', lang)}</Box>}
                      </Typography>
                    ) : auto ? (
                      <Typography variant="body2" sx={{ color: level === 'unknown' ? 'text.secondary' : 'text.primary', lineHeight: 1.6 }}>{auto}</Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>{t('verdict.none', lang)}</Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
