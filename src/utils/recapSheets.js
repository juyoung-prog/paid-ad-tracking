/**
 * Recap → Google Sheets (Build Plan Phase 6, 2026-09 결정: Excel 대신 Google Sheets).
 *
 * 브라우저에서 Google 계정 없이 시트를 직접 만들 수는 없다(Sheets API는 OAuth
 * 동의가 필요). 그래서 **표를 탭 구분 텍스트로 클립보드에 복사하고 새 시트를
 * 연다** — 새 시트에서 붙여 넣으면 셀에 그대로 들어간다. 이전 보고서의 Excel
 * 시트 구성(플랫폼별 표 + Learnings)을 세로로 이어 붙인 형태다.
 *
 * Google OAuth를 붙여 시트를 자동 생성하는 것은 Google Cloud 프로젝트·동의 화면
 * 설정이 선행돼야 해서 별도 단계로 남긴다.
 *
 * React import 금지 — 순수 유틸.
 */
import { localizedText, BENCHMARK_METRICS } from '../data/schema';
import { t, metricLabel, benchmarkPositionText } from '../data/recapStrings';

const GOOGLE_SHEETS_NEW_URL = 'https://sheets.new';

/** 비율 지표를 시트용 숫자로 — % 기호 대신 소수점 두 자리 백분율 */
const asPercent = (v) => (v == null ? '' : String(Math.round(v * 10000) / 100));
const asMoney = (v) => (v == null ? '' : String(Math.round(v * 100) / 100));
const asText = (v) => (v == null ? '' : String(v).replace(/[\t\r\n]+/g, ' '));

/** 벤치마크 한 칸 — "top 25% (median 3.59)" */
function benchmarkText(stat, isMoney, lang) {
  if (!stat || stat.peerScope === 'none' || stat.percentile == null) return t('benchmark.notEnough', lang);
  const median = isMoney ? asMoney(stat.median) : `${asPercent(stat.median)}%`;
  return `${benchmarkPositionText(stat, lang)} (${t('benchmark.vsMedian', lang, { median })})`;
}

/**
 * 시트에 붙여 넣을 탭 구분 텍스트를 만든다.
 *
 * @param {{ eventName: string, byPlatform: Object<string, Array<Object>>, platformLabel: Object<string, string>, recap: object|null, headline: object|null, lang: string }} input
 * @returns {string}
 */
export function buildRecapSheetText({ eventName, byPlatform, platformLabel, recap, headline, lang = 'en' }) {
  const lines = [];
  const push = (cells) => lines.push(cells.map(asText).join('\t'));

  push([eventName]);
  if (headline) {
    push([t(headline.rank === 1 ? 'recap.headline.best' : 'recap.headline.rank', lang, { rank: headline.rank, total: headline.total, metric: metricLabel(headline.metricKey, lang) })]);
  }
  if (recap?.summary) push([localizedText(recap.summary, lang).value]);
  push([]);

  Object.entries(byPlatform).forEach(([platform, rows]) => {
    push([t('recap.section.campaigns', lang, { platform: platformLabel[platform] ?? platform })]);
    push([
      t('recap.table.rank', lang), t('recap.table.store', lang), t('recap.table.campaign', lang), 'Campaign name', 'Start', 'End',
      t('recap.table.dailyBudget', lang), t('recap.table.spend', lang), t('recap.table.verdict', lang),
      metricLabel('reach', lang), metricLabel('impressions', lang), metricLabel('videoPlays', lang), metricLabel('clicks', lang),
      metricLabel('likes', lang), metricLabel('comments', lang), metricLabel('shares', lang), metricLabel('conversions', lang),
      ...BENCHMARK_METRICS.flatMap((m) => [metricLabel(m.key, lang), `${metricLabel(m.key, lang)} vs peers`]),
      t('recap.note.strength', lang), t('recap.note.weakness', lang), t('recap.note.reason', lang),
    ]);
    rows.forEach((r) => {
      const verdict = r.note?.verdict ?? r.suggestedVerdict ?? null;
      push([
        r.rank, r.storeCode, r.phaseName, r.name, r.startDate, r.endDate,
        asMoney(r.dailyBudget), asMoney(r.spend),
        verdict ? `${t(`verdict.${verdict}`, lang)}${r.note?.verdict ? '' : ` (${t('verdict.suggested', lang)})`}` : '',
        r.reach, r.impressions, r.videoPlays, r.clicks, r.likes, r.comments, r.shares, r.conversions,
        ...BENCHMARK_METRICS.flatMap((m) => {
          const isMoney = ['cpm', 'cpc', 'cpa'].includes(m.key);
          return [isMoney ? asMoney(r[m.key]) : asPercent(r[m.key]), benchmarkText(r.benchmarks?.[m.key], isMoney, lang)];
        }),
        localizedText(r.note?.strength, lang).value, localizedText(r.note?.weakness, lang).value, localizedText(r.note?.reason, lang).value,
      ]);
    });
    push([]);
  });

  if (recap && ((recap.learnings ?? []).length > 0 || recap.nextSteps)) {
    push([t('recap.section.learnings', lang)]);
    (recap.learnings ?? []).forEach((item, i) => {
      push([`${i + 1}. ${localizedText(item.title, lang).value}`, localizedText(item.body, lang).value]);
    });
    if (recap.nextSteps) push([t('recap.section.nextSteps', lang), localizedText(recap.nextSteps, lang).value]);
  }
  return lines.join('\n');
}

/**
 * 표를 클립보드에 복사하고 새 Google 시트를 연다. 복사에 실패하면(권한 거부 등)
 * false를 돌려주고 시트는 열지 않는다 — 빈 시트만 열리면 무엇을 해야 할지 알 수 없다.
 *
 * @param {Parameters<typeof buildRecapSheetText>[0]} input
 * @returns {Promise<boolean>}
 */
export async function copyRecapForGoogleSheets(input) {
  const text = buildRecapSheetText(input);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return false;
  }
  window.open(GOOGLE_SHEETS_NEW_URL, '_blank', 'noopener');
  return true;
}
