/**
 * Recap → Excel 내보내기 (Build Plan Phase 6).
 *
 * 이전 보고서(beauty-master-dashboard)의 Excel 구성을 따른다 — 플랫폼별 시트 +
 * Notes + Learnings. 숫자는 이미 계산된 RecapCampaignRow를 그대로 적고, 문장은
 * 요청 언어(비어 있으면 en)로 적는다.
 *
 * exceljs는 번들이 커서 동적 import — 버튼을 누를 때만 내려받는다.
 * React import 금지 — 순수 유틸.
 */
import { localizedText, BENCHMARK_METRICS } from '../data/schema';
import { t, metricLabel } from '../data/recapStrings';

/** 비율 지표를 사람이 읽는 숫자로 — 시트에서는 % 기호 대신 소수점 두 자리 백분율 */
const asPercent = (v) => (v == null ? null : Math.round(v * 10000) / 100);
const asMoney = (v) => (v == null ? null : Math.round(v * 100) / 100);

/** 벤치마크 한 칸 — "top 25% (median 3.59)" */
function benchmarkText(stat, isMoney, lang) {
  if (!stat || stat.peerScope === 'none' || stat.percentile == null) return t('benchmark.notEnough', lang);
  const median = isMoney ? asMoney(stat.median) : `${asPercent(stat.median)}%`;
  const position = stat.percentile >= 100
    ? t('benchmark.percentile.best', lang, { n: stat.sampleSize + 1 })
    : stat.percentile <= 0
      ? t('benchmark.percentile.lowest', lang, { n: stat.sampleSize + 1 })
      : stat.band === 'top'
        ? t('benchmark.percentile.top', lang, { pct: 100 - stat.percentile })
        : stat.band === 'bottom'
          ? t('benchmark.percentile.bottom', lang, { pct: stat.percentile })
          : t('benchmark.percentile.mid', lang);
  return `${position} (${t('benchmark.vsMedian', lang, { median })})`;
}

/**
 * 브라우저에서 .xlsx를 만들어 내려받게 한다.
 *
 * @param {{ eventName: string, byPlatform: Object<string, Array<Object>>, platformLabel: Object<string, string>, recap: object|null, headline: object|null, lang: string }} input
 * @returns {Promise<void>}
 */
export async function exportRecapToExcel({ eventName, byPlatform, platformLabel, recap, headline, lang = 'en' }) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Paid Ads Dashboard';
  workbook.created = new Date();

  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  const styleHeader = (row) => {
    row.font = { bold: true };
    row.eachCell((cell) => { cell.fill = headerFill; });
  };

  Object.entries(byPlatform).forEach(([platform, rows]) => {
    const sheet = workbook.addWorksheet(platformLabel[platform] ?? platform);
    const metricColumns = BENCHMARK_METRICS.flatMap((m) => [
      { header: metricLabel(m.key, lang), key: m.key, width: 12 },
      { header: `${metricLabel(m.key, lang)} vs peers`, key: `${m.key}_bench`, width: 26 },
    ]);
    sheet.columns = [
      { header: t('recap.table.rank', lang), key: 'rank', width: 5 },
      { header: t('recap.table.store', lang), key: 'store', width: 8 },
      { header: t('recap.table.campaign', lang), key: 'phase', width: 22 },
      { header: 'Campaign name', key: 'name', width: 34 },
      { header: 'Start', key: 'startDate', width: 12 },
      { header: 'End', key: 'endDate', width: 12 },
      { header: t('recap.table.dailyBudget', lang), key: 'dailyBudget', width: 12 },
      { header: t('recap.table.spend', lang), key: 'spend', width: 12 },
      { header: t('recap.table.verdict', lang), key: 'verdict', width: 12 },
      { header: metricLabel('reach', lang), key: 'reach', width: 12 },
      { header: metricLabel('impressions', lang), key: 'impressions', width: 12 },
      { header: metricLabel('videoPlays', lang), key: 'videoPlays', width: 12 },
      { header: metricLabel('clicks', lang), key: 'clicks', width: 10 },
      { header: metricLabel('likes', lang), key: 'likes', width: 10 },
      { header: metricLabel('comments', lang), key: 'comments', width: 10 },
      { header: metricLabel('shares', lang), key: 'shares', width: 10 },
      { header: metricLabel('conversions', lang), key: 'conversions', width: 10 },
      ...metricColumns,
      { header: t('recap.note.strength', lang), key: 'strength', width: 40 },
      { header: t('recap.note.weakness', lang), key: 'weakness', width: 40 },
      { header: t('recap.note.reason', lang), key: 'reason', width: 40 },
    ];
    rows.forEach((r) => {
      const verdict = r.note?.verdict ?? r.suggestedVerdict ?? null;
      const record = {
        rank: r.rank,
        store: r.storeCode,
        phase: r.phaseName,
        name: r.name,
        startDate: r.startDate,
        endDate: r.endDate,
        dailyBudget: asMoney(r.dailyBudget),
        spend: asMoney(r.spend),
        verdict: verdict ? `${t(`verdict.${verdict}`, lang)}${r.note?.verdict ? '' : ` (${t('verdict.suggested', lang)})`}` : null,
        reach: r.reach,
        impressions: r.impressions,
        videoPlays: r.videoPlays,
        clicks: r.clicks,
        likes: r.likes,
        comments: r.comments,
        shares: r.shares,
        conversions: r.conversions,
        strength: localizedText(r.note?.strength, lang).value || null,
        weakness: localizedText(r.note?.weakness, lang).value || null,
        reason: localizedText(r.note?.reason, lang).value || null,
      };
      BENCHMARK_METRICS.forEach((m) => {
        const isMoney = ['cpm', 'cpc', 'cpa'].includes(m.key);
        record[m.key] = isMoney ? asMoney(r[m.key]) : asPercent(r[m.key]);
        record[`${m.key}_bench`] = benchmarkText(r.benchmarks?.[m.key], isMoney, lang);
      });
      sheet.addRow(record);
    });
    styleHeader(sheet.getRow(1));
    sheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 1 }];
  });

  const learningsSheet = workbook.addWorksheet(t('recap.section.learnings', lang));
  learningsSheet.columns = [
    { header: 'Section', key: 'section', width: 18 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Text', key: 'text', width: 90 },
  ];
  learningsSheet.addRow({ section: 'Event', title: eventName, text: headline ? t(headline.rank === 1 ? 'recap.headline.best' : 'recap.headline.rank', lang, { rank: headline.rank, total: headline.total, metric: metricLabel(headline.metricKey, lang) }) : '' });
  if (recap?.summary) learningsSheet.addRow({ section: t('recap.edit.summary', lang), title: '', text: localizedText(recap.summary, lang).value });
  (recap?.learnings ?? []).forEach((item, i) => {
    learningsSheet.addRow({ section: `${t('recap.section.learnings', lang)} ${i + 1}`, title: localizedText(item.title, lang).value, text: localizedText(item.body, lang).value });
  });
  if (recap?.nextSteps) learningsSheet.addRow({ section: t('recap.section.nextSteps', lang), title: '', text: localizedText(recap.nextSteps, lang).value });
  styleHeader(learningsSheet.getRow(1));
  learningsSheet.eachRow((row) => { row.alignment = { wrapText: true, vertical: 'top' }; });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${eventName.replace(/[^\w.-]+/g, '_')}_recap_${lang}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
