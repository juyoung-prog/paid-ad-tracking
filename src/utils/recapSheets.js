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
      t('recap.table.dailyBudget', lang), t('recap.table.spend', lang), t('recap.edit.verdict', lang),
      metricLabel('reach', lang), metricLabel('impressions', lang), metricLabel('videoPlays', lang), metricLabel('clicks', lang),
      metricLabel('likes', lang), metricLabel('comments', lang), metricLabel('shares', lang), metricLabel('follows', lang), metricLabel('profileVisits', lang), metricLabel('saves', lang), metricLabel('reposts', lang), metricLabel('conversions', lang),
      ...BENCHMARK_METRICS.flatMap((m) => [metricLabel(m.key, lang), `${metricLabel(m.key, lang)} vs peers`]),
      t('recap.note.strength', lang), t('recap.note.weakness', lang), t('recap.note.reason', lang),
    ]);
    rows.forEach((r) => {
      // 사람이 Edit에서 고른 평가만 — 자동 등급은 없다(2026-09-08 제품 결정)
      const verdict = r.note?.verdict ?? null;
      push([
        r.rank, r.storeCode, r.phaseName, r.name, r.startDate, r.endDate,
        asMoney(r.dailyBudget), asMoney(r.spend),
        verdict ? t(`verdict.${verdict}`, lang) : '',
        r.reach, r.impressions, r.videoPlays, r.clicks, r.likes, r.comments, r.shares, r.follows, r.profileVisits, r.saves, r.reposts, r.conversions,
        ...BENCHMARK_METRICS.flatMap((m) => {
          const isMoney = ['cpm', 'cpc', 'cpa', 'cpe'].includes(m.key);
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

/** Apps Script 템플릿 파일 이름 — public/에 있고, 자리표시자(__SUPABASE_URL__ 등)는 그 파일 CONFIG.SUPABASE와 같은 문자열이어야 한다 */
const RECAP_SCRIPT_FILENAME = 'recap-report.gs';

/**
 * Apps Script 템플릿에 대시보드의 Supabase 주소·공개 읽기 키를 채운다. 순수 문자열 처리 — 테스트 가능.
 * 키는 화면이 이미 쓰는 anon 키(공개)라 새로 노출되는 것은 없다.
 *
 * @param {string} template - public/recap-report.gs 원문
 * @param {{ url: string, anonKey: string }} env
 * @returns {string}
 */
export function fillRecapScript(template, { url, anonKey }) {
  return template.replace('__SUPABASE_URL__', url ?? '').replace('__SUPABASE_ANON_KEY__', anonKey ?? '');
}

/**
 * 제목 옆 링크 — 템플릿을 받아 CONFIG를 채운 뒤 파일로 내려준다. 시트에서 붙여 넣기만 하면 되도록.
 * 실패하면 false(호출부가 스낵바로 알린다).
 *
 * @returns {Promise<boolean>}
 */
export async function downloadRecapScript() {
  try {
    // BASE_URL은 배포 경로 — 함수 안에서 읽어 node(테스트)에서 import만 할 때는 평가되지 않게 한다
    const res = await fetch(`${import.meta.env.BASE_URL}${RECAP_SCRIPT_FILENAME}`);
    if (!res.ok) return false;
    const filled = fillRecapScript(await res.text(), { url: import.meta.env.VITE_SUPABASE_URL, anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY });
    const blobUrl = URL.createObjectURL(new Blob([filled], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = RECAP_SCRIPT_FILENAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch {
    return false;
  }
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
