/**
 * Recap 화면 문구 표 — Build Plan Phase 1.
 *
 * 컴포넌트 안에 영어 문자열 리터럴을 두지 않는다. 문장 조립("Top 25% of 12
 * similar campaigns")도 여기서만 한다 — 언어를 늘릴 때 컴포넌트를 열지 않게.
 * 1단계는 en만 채운다. ko / zh-Hant는 3단계에서 채우고, 비어 있으면 en으로
 * 대체한다(localizedText와 같은 규칙).
 *
 * React import 금지 — 데이터 레이어다.
 */
import { RECAP_DEFAULT_LANG } from './schema';

/** @type {Object<string, { en: string, ko?: string|null, 'zh-Hant'?: string|null }>} */
export const RECAP_STRINGS = Object.freeze({
  // 페이지·머리글
  'recap.title': { en: 'Recap' },
  'recap.list.subtitle': { en: 'Post-campaign reports by event. Numbers come from synced data; judgments and lessons are written here.' },
  'recap.list.empty': { en: 'No events yet. Tag campaigns with an Event on the Dashboard to see them here.' },
  'recap.list.column.event': { en: 'Event' },
  'recap.list.column.period': { en: 'Period' },
  'recap.list.column.campaigns': { en: 'Campaigns' },
  'recap.list.column.spend': { en: 'Spend' },
  'recap.list.column.status': { en: 'Report' },
  'recap.status.draft': { en: 'Draft' },
  'recap.status.final': { en: 'Final' },
  'recap.status.none': { en: 'Not started' },
  'recap.detail.back': { en: 'All recaps' },
  'recap.detail.notFound': { en: 'No campaigns are tagged with this event.' },
  'recap.detail.print': { en: 'Print / PDF' },

  // KPI
  'recap.kpi.campaigns': { en: 'Campaigns' },
  'recap.kpi.spend': { en: 'Spend' },
  'recap.kpi.planned': { en: 'Planned' },
  'recap.kpi.ofPlanned': { en: 'of {planned} planned' },
  'recap.kpi.stores': { en: 'Stores' },
  'recap.kpi.period': { en: 'Period' },

  // 머리글 순위 한 줄
  'recap.headline.rank': { en: '#{rank} of {total} comparable events by {metric}' },
  'recap.headline.best': { en: 'Best of {total} comparable events by {metric}' },

  // 섹션
  'recap.section.timeline': { en: 'Timeline' },
  'recap.section.campaigns': { en: '{platform} campaigns' },
  'recap.section.notes': { en: 'Notes' },
  'recap.section.learnings': { en: 'Learnings' },
  'recap.section.nextSteps': { en: 'Next time' },
  'recap.section.notesPlaceholder': { en: 'Judgments, strengths, weaknesses and lessons will be written here (phase 2).' },

  // 표 헤더
  'recap.table.rank': { en: '#' },
  'recap.table.store': { en: 'Store' },
  'recap.table.campaign': { en: 'Campaign' },
  'recap.table.dailyBudget': { en: 'Daily budget' },
  'recap.table.spend': { en: 'Spend' },
  'recap.table.verdict': { en: 'Efficiency' },
  'recap.table.video': { en: 'Video' },
  'recap.table.engagement': { en: 'Engagement' },
  'recap.table.action': { en: 'Action' },
  'recap.table.noData': { en: 'No performance data' },
  'recap.table.empty': { en: 'No campaigns on this platform.' },

  // 지표 이름
  'metric.cpm': { en: 'CPM' },
  'metric.cpc': { en: 'CPC' },
  'metric.cpa': { en: 'CPA' },
  'metric.ctr': { en: 'CTR' },
  'metric.hookRate': { en: 'Hook' },
  'metric.holdRate': { en: 'Hold' },
  'metric.engagementRate': { en: 'Eng. rate' },
  'metric.reach': { en: 'Reach' },
  'metric.impressions': { en: 'Impressions' },
  'metric.videoPlays': { en: 'Plays' },
  'metric.avgWatch': { en: 'Avg' },
  'metric.clicks': { en: 'Clicks' },
  'metric.likes': { en: 'Like' },
  'metric.comments': { en: 'Cmt' },
  'metric.shares': { en: 'Share' },
  'metric.follows': { en: 'Follow' },
  'metric.profileVisits': { en: 'Profile' },
  'metric.conversions': { en: 'Results' },

  // 벤치마크
  'benchmark.vsMedian': { en: 'median {median}' },
  'benchmark.percentile.best': { en: 'best of {n}' },
  'benchmark.percentile.top': { en: 'top {pct}%' },
  'benchmark.percentile.mid': { en: 'mid' },
  'benchmark.percentile.bottom': { en: 'bottom {pct}%' },
  'benchmark.percentile.lowest': { en: 'lowest of {n}' },
  'benchmark.sample': { en: 'of {n} similar' },
  'benchmark.sample.phase': { en: 'vs {n} {phase} campaigns' },
  'benchmark.sample.goal': { en: 'vs {n} {goal} campaigns' },
  'benchmark.notEnough': { en: 'not enough data' },
  'benchmark.tooltip': { en: '{label}: {value}. Median of {n} comparable campaigns: {median}. This campaign ranks in the {position}.' },

  // 판정
  'verdict.good': { en: 'Good' },
  'verdict.mid': { en: 'Fair' },
  'verdict.bad': { en: 'Weak' },
  'verdict.suggested': { en: 'suggested' },
  'verdict.none': { en: '—' },

  // 언어 대체 표시
  'lang.fallback': { en: '(English)' },
});

/**
 * 문구를 꺼내고 {name} 자리를 채운다. 요청 언어가 비어 있으면 en.
 * 키가 없으면 키 자체를 돌려준다 — 조용히 빈 글자가 나오는 것보다 낫다.
 *
 * @param {string} key - RECAP_STRINGS의 키
 * @param {string} [lang=RECAP_DEFAULT_LANG]
 * @param {Object<string, string|number>} [params] - {name} 치환값
 * @returns {string}
 */
export function t(key, lang = RECAP_DEFAULT_LANG, params = {}) {
  const entry = RECAP_STRINGS[key];
  const template = entry ? (entry[lang] || entry[RECAP_DEFAULT_LANG] || key) : key;
  return template.replace(/\{(\w+)\}/g, (_, name) => (params[name] != null ? String(params[name]) : `{${name}}`));
}

/**
 * 지표 키 → 표시 이름. 표와 벤치마크 툴팁이 같은 이름을 쓰게 한다.
 * @param {string} metricKey
 * @param {string} [lang]
 * @returns {string}
 */
export function metricLabel(metricKey, lang = RECAP_DEFAULT_LANG) {
  return t(`metric.${metricKey}`, lang);
}
