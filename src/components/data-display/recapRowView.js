import { t, metricLabel } from '../../data/recapStrings';
import { GOAL_HEADLINE_METRICS, phaseNameOf } from '../../data/schema';
import { money, count, countCompact, percent, seconds } from '../../utils/format';

/**
 * Recap 캠페인 한 줄의 **표기 규칙** — 목표별 지표 구성, 해석 문장, 부르는 이름이 한 곳에 있다.
 * 보고서 화면(RecapCampaignTable)과 타임라인(PhaseTimelineChart)이 이것을 쓰고, **인쇄도 같은
 * 컴포넌트가 그대로 인쇄되므로** 규칙은 한 벌뿐이다. 한때 인쇄 전용 보고서 컴포넌트를 따로 뒀는데
 * (2026-09-10) 같은 보고서가 두 벌이 되어 시간이 지나면 갈라질 구조라 지웠다 — 인쇄는 매체이지
 * 다른 제품이 아니다.
 *
 * 계산은 여기서도 하지 않는다 — 순위·벤치마크·해석 재료는 schema.js buildRecapRows()가
 * 이미 끝냈고, 이 모듈은 그 값을 "어느 자리에 어떤 문구로 놓을지"만 정한다.
 */

/** 대표 KPI 값 표기 — 비용 지표는 돈, 나머지는 비율. 계산이 아니라 표기다 */
export const kpiFormat = (metricKey) => (['cpm', 'cpc', 'cpa', 'cpe'].includes(metricKey) ? money : (v) => percent(v, { digits: 2 }));
export const fmtPercent = (v) => percent(v, { digits: 2 });

/** 캠페인 목표 — 캠페인 데이터의 goal(드로어와 같은 원천). 없거나 모르는 값이면 표시하지 않는다 */
export const GOAL_KEYS = ['awareness', 'traffic', 'engagement', 'conversion', 'store_visit'];
/** 목표 표시명. 모르는 값이면 null — 호출부가 "—"를 놓는다 */
export const goalText = (goal, lang) => (GOAL_KEYS.includes(goal) ? t(`goalLabel.${goal}`, lang) : null);

/**
 * 목표별 Engagement / Action 대표 두 지표(순위 포함). 목표가 강조를 정한다(2026-09-08):
 * 인지 = 참여율·CTR · 트래픽 = CTR·CPC · 참여 = 참여율·Cost/eng · 전환/매장 방문 = CPA·CTR.
 * 그 아래 보조 줄은 목표와 무관하게 참여 내역(ENGAGEMENT_BREAKDOWN_KEYS)이다 — 2026-09-11까지는 목표별 수량
 * (클릭 수·CPC, 좋아요·공유, 결과 수·CPC)이었는데, 그러면 댓글은 어느 목표에서도 안 보이고 좋아요·공유도 참여 목표에서만
 * 보여서 "참여가 실제로 몇 건이었나"를 보고서에서 답할 수 없었다(인플루언서 시트는 Like·Cmt·Share·Save·Repost를 다 적는다).
 * 모든 원본 값은 행(row)에 그대로 있다.
 */
export const ENGAGEMENT_ACTION_LAYOUT = {
  awareness: { primary: ['engagementRate', 'ctr'] },
  traffic: { primary: ['ctr', 'cpc'] },
  engagement: { primary: ['engagementRate', 'cpe'] },
  conversion: { primary: ['cpa', 'ctr'] },
  store_visit: { primary: ['cpa', 'ctr'] },
};
export const engagementLayout = (goal) => ENGAGEMENT_ACTION_LAYOUT[goal] ?? ENGAGEMENT_ACTION_LAYOUT.awareness;

/**
 * 참여 내역 줄의 항목 — 광고 API가 캠페인 단위로 주는 것 전부. Like·Cmt·Share는 양 플랫폼 공통, Follow·Profile은
 * TikTok만(Meta는 null이라 빠진다). Save·Repost는 여기 없다 — TikTok 광고 API가 캠페인 레벨 saves를 거부했고
 * (sync-performance 주석), Repost는 광고 API에 없는 지표라 수집 자체가 안 된다.
 */
export const ENGAGEMENT_BREAKDOWN_KEYS = ['likes', 'comments', 'shares', 'follows', 'profileVisits'];

/** 값의 무게는 지표의 역할이 정한다: 목표의 대표 KPI(700) > 나머지 대표 자리(600) */
export const emphasisOf = (row, metricKey) => ((GOAL_HEADLINE_METRICS[row.goal] ?? [])[0] === metricKey ? 'primary' : 'diagnostic');

/** 성과 데이터가 하나라도 있는 줄인가 — 없으면 지표 칸 대신 "No performance data" */
export const hasRowData = (row) => row.spend != null || row.impressions != null;

/** 해석 열(What worked · Could improve) — 순서·문구 키·사람이 쓴 note 필드가 한 줄에 */
export const INSIGHT_COLUMNS = [
  { key: 'worked', field: 'strength', noteField: 'strength' },
  { key: 'improve', field: 'weakness', noteField: 'weakness' },
];

/**
 * 사람이 쓴 note가 실제 내용인지 — "ㅇㅇ"·"○○"·"TBD"·"N/A"·"-" 같은 자리표시자는 없는 것으로 본다(2026-09-08).
 * 글자·숫자가 하나도 없거나(자모·기호만), 흔한 임시 표기면 자동 문장으로 넘긴다.
 */
export const isPlaceholder = (text) => {
  const s = String(text ?? '').trim();
  if (!s) return true;
  if (/^(tbd|n\/?a|todo|none|null|-+|—)$/i.test(s)) return true;
  // 한글 자모(ㅇㅁㄴ…)·기호·공백만 남으면 내용 없음
  return s.replace(/[ㄱ-ㆎ○◯●•·.,;:!?\-–—_/\\()[\]{}'"\s]/g, '').length === 0;
};

/**
 * 해석 문장 — schema buildCampaignInsight()의 재료(어느 지표가 비교군에서 상위/하위였나)를 **해석** 한 문장으로.
 * 후보 지표는 목표가 정한다(schema GOAL_INSIGHT_METRICS) — 표가 그 목표에서 실제로 그리는 지표와 같은 목록이라,
 * 오른쪽 문장의 근거를 왼쪽 칸에서 눈으로 좇을 수 있다. 목표와 무관하거나 화면에 없는 지표는 문장이 되지 않는다.
 * 지표와 순위는 왼쪽 칸이 이미 보여주므로 여기서 숫자를 되풀이하지 않는다(2026-09-08).
 * 원인(Reason)은 표에서 다루지 않는다 — 사람이 Edit에서 쓴 이유는 편집 폼과 시트 내보내기에 남는다.
 */
export function insightSentence(field, item, lang) {
  if (!item) return null;
  // 지표 종류가 문구를 고른다 — 같은 "참여"라도 참여율은 반응, 참여당 비용은 효율
  const aspectKey = (aspect, metricKey) => (metricKey === 'cpe' ? 'cpe' : metricKey === 'cpc' ? 'cpc' : aspect);
  if (field === 'strength') return item.kind === 'ranked' && item.stat ? t(`cell.worked.${aspectKey(item.aspect, item.metricKey)}`, lang) : null;
  if (field === 'weakness') {
    if (item.kind === 'overspend') return t('cell.improve.overspend', lang, { pct: item.pct });
    return item.kind === 'ranked' && item.stat ? t(`cell.improve.${aspectKey(item.aspect, item.metricKey)}`, lang) : null;
  }
  return null;
}

/**
 * 해석 두 칸의 최종 내용 — 사람이 쓴 note(자리표시자 제외)가 우선, 없으면 재료에서 한 문장, 그것도 없으면 null.
 * raw는 편집 칸에 그대로 넣을 원문(자리표시자 포함)이고, auto는 자동 문장(툴팁용)이다.
 */
export function insightCellsOf(row, lang) {
  const hasData = hasRowData(row);
  return INSIGHT_COLUMNS.map((col) => {
    const raw = col.noteField ? (row.note?.[col.noteField]?.[lang] ?? '') : '';
    const written = raw.trim();
    const auto = hasData ? insightSentence(col.field, row.insight?.[col.field] ?? null, lang) : null;
    if (written && !isPlaceholder(written)) return { ...col, raw, text: written, auto, isWritten: true };
    return { ...col, raw, text: auto, auto, isWritten: false };
  });
}

/** 대표 KPI 한 자리 — 값(schema budgetEfficiency)과 같은 지표의 과거 비교 재료 */
export function primaryKpiOf(row) {
  const kpi = row.budgetEfficiency ?? null;
  const metricKey = kpi?.metricKey ?? (GOAL_HEADLINE_METRICS[row.goal] ?? [])[0] ?? null;
  const stat = metricKey ? row.benchmarks?.[metricKey] ?? null : null;
  return { kpi, metricKey, stat, hasComparison: Boolean(stat && stat.peerScope !== 'none' && stat.percentile != null) };
}

/** 참여 내역 줄 — "Like 508 · Cmt 10 · Share 601" (TikTok은 "· Follow 12 · Profile 40"까지). 값이 없는 항목은 뺀다 */
export function engagementBreakdownText(row, lang) {
  return ENGAGEMENT_BREAKDOWN_KEYS
    .map((key) => (row[key] == null ? null : `${metricLabel(key, lang)} ${count(row[key])}`))
    .filter(Boolean)
    .join(' · ');
}

/** 영상 칸의 보조 줄 — "Reach 163K · Plays 296K · Avg 2s" */
export function videoSecondaryText(row, lang) {
  return [
    row.reach != null ? `${metricLabel('reach', lang)} ${countCompact(row.reach)}` : null,
    row.videoPlays != null ? `${metricLabel('videoPlays', lang)} ${countCompact(row.videoPlays)}` : null,
    row.avgWatchSeconds != null ? t('recap.table.avgWatch', lang, { s: seconds(row.avgWatchSeconds) }) : null,
  ].filter(Boolean).join(' · ');
}

/** 매장 표기 — 여러 곳이면 "G10 +2"(전체 목록은 title로) */
export function storeTextOf(row) {
  const stores = String(row.storeCode ?? '').split(/,\s*/).filter(Boolean);
  return { stores, storeText: stores.length > 1 ? `${stores[0]} +${stores.length - 1}` : stores[0] ?? null };
}

/**
 * 이름 앞의 타입 접두사를 떼는 패턴 — `Instagram post: <캡션>`의 `Instagram post`.
 *
 * 이 계정 이름의 절반 이상이 `타입: 내용` 꼴이다(게시물 부스팅을 캠페인으로 만들 때 Meta가 캡션
 * 앞부분을 잘라 이름으로 쓴다). 접두사를 24자로 제한하는 이유는 콜론이 문장 부호로 쓰인 이름
 * ("Come see us at the mall: this weekend")에서 절반이 잘리는 걸 막기 위해서다(실데이터 최장 접두사 14자).
 * 뒷부분을 `[\s\S]`로 받는 이유는 캡션에 줄바꿈이 그대로 들어온 이름이 있기 때문이다.
 */
const NAME_PREFIX_PATTERN = /^([^:\n]{1,24}):\s*([\s\S]+)$/;

/**
 * 타임라인에 적는 **부르는 이름** — `G10_Coming Soon_0617~0707` → `Coming Soon`,
 * `Instagram post: COMING SOON …` → `COMING SOON …`. 화면 타임라인(PhaseTimelineChart)과
 * 인쇄 타임라인이 같은 규칙을 써야 같은 캠페인이 두 곳에서 다른 이름으로 보이지 않는다.
 * 코드·기간을 벗기는 규칙 자체는 schema.js phaseNameOf(벤치마크의 "같은 단계" 판정과 같은 규칙)다.
 */
export function phaseDisplayName(name) {
  const match = (name ?? '').match(NAME_PREFIX_PATTERN);
  const rest = match ? match[2] : '';
  return phaseNameOf(rest || name || '');
}
