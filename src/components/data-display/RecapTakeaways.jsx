import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { t, metricLabel, benchmarkPositionText } from '../../data/recapStrings';

/** 항목 종류별 왼쪽 색점 — 색은 성과 톤(좋음 success, 부족 warning), 나머지는 중립 */
const KIND_DOT = {
  best: 'success.main',
  weakest: 'warning.main',
  platform: 'text.disabled',
  recommendation: 'accent.main',
};

/**
 * 재료(schema.js buildRecapTakeaways 결과) 하나를 문장으로. 숫자는 이미 표에 있으니
 * 여기서는 "무엇이 좋았고 무엇을 바꿀지"만 말한다. 문장 조립은 recapStrings에서.
 */
function sentenceFor(item, platformLabel, lang) {
  const platform = (p) => platformLabel[p] ?? p;
  switch (item.kind) {
    case 'best':
      return t('recap.takeaways.best', lang, {
        platform: platform(item.platform),
        phase: item.phaseName,
        goal: t(`goal.${item.goal}`, lang),
        metric: metricLabel(item.metricKey, lang),
        position: benchmarkPositionText(item.stat, lang),
      });
    case 'weakest':
      return t('recap.takeaways.weakest', lang, {
        platform: platform(item.platform),
        phase: item.phaseName,
        metrics: item.metricKeys.map((k) => metricLabel(k, lang)).join(' · '),
        position: benchmarkPositionText(item.stat, lang),
      });
    case 'platform':
      return t('recap.takeaways.platform', lang, { cheaper: platform(item.cheaper), pricier: platform(item.pricier), pct: item.pct });
    case 'recommendation':
      return item.weakPhaseName
        ? t('recap.takeaways.recommendation', lang, {
          platform: platform(item.platform), phase: item.phaseName, weakPlatform: platform(item.weakPlatform), weakPhase: item.weakPhaseName,
        })
        : t('recap.takeaways.recommendationBestOnly', lang, { platform: platform(item.platform), phase: item.phaseName });
    default:
      return '';
  }
}

/**
 * RecapTakeaways 컴포넌트
 *
 * Recap 머리글과 타임라인 사이의 "핵심 요약" — 표가 증거라면 이 칸은 해석이다.
 * 가장 좋았던 캠페인, 뒤처진 캠페인, 플랫폼 차이, 다음 제언을 최대 4개, 각각
 * 짧은 라벨 + 문장 하나로. 표에 이미 있는 숫자를 반복하지 않고 "비교 가능한
 * 캠페인 중 best of 5" 같은 상대 위치만 붙인다.
 *
 * 계산은 하지 않는다 — items는 schema.js buildRecapTakeaways() 결과(종류·캠페인·
 * 지표·벤치마크)이고, 문장은 recapStrings가 만든다. 근거가 없어 items가 비면
 * "아직 결론을 내릴 수 없다"고만 말한다.
 *
 * Props:
 * @param {Array<{ kind: 'best'|'weakest'|'platform'|'recommendation' }>} items - buildRecapTakeaways() 결과 [Required]
 * @param {Object<string, string>} platformLabel - 플랫폼 값 → 표시명(예: { meta: 'Meta' }) [Optional, 기본값: {}]
 * @param {string} lang - 문구 언어(RECAP_LANG) [Optional, 기본값: 'en']
 * @param {object} sx - 추가 스타일 [Optional]
 *
 * Example usage:
 * <RecapTakeaways items={buildRecapTakeaways(byPlatform)} platformLabel={PLATFORM_LABEL} lang={lang} />
 */
export function RecapTakeaways({ items, platformLabel = {}, lang = 'en', sx }) {
  if (!items || items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5, ...sx }}>
        {t('recap.takeaways.empty', lang)}
      </Typography>
    );
  }
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, px: 2, py: 0.5, ...sx }}>
      {items.map((item, i) => (
        <Box
          component="li"
          key={`${item.kind}-${i}`}
          sx={{
            display: 'grid',
            gridTemplateColumns: '8px minmax(0, 1fr)',
            columnGap: 1.5,
            alignItems: 'start',
            py: 1.25,
            borderBottom: i < items.length - 1 ? '1px solid' : 0,
            borderColor: 'divider',
          }}
        >
          <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: KIND_DOT[item.kind] ?? 'text.disabled', mt: '5px' }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography component="span" sx={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'text.secondary', lineHeight: 1.4 }}>
              {t(`recap.takeaways.label.${item.kind}`, lang)}
            </Typography>
            <Typography component="span" sx={{ display: 'block', fontSize: 13.5, color: 'text.primary', lineHeight: 1.55, mt: 0.25 }}>
              {sentenceFor(item, platformLabel, lang)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
