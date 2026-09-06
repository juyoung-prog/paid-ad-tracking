/**
 * Recap 화면 문구 표 — Build Plan Phase 1.
 *
 * 컴포넌트 안에 영어 문자열 리터럴을 두지 않는다. 문장 조립("Top 25% of 12
 * similar campaigns")도 여기서만 한다 — 언어를 늘릴 때 컴포넌트를 열지 않게.
 * en · ko · zh-Hant 세 언어를 채운다(3단계, 2026-09-06). 비어 있는 키는 en으로 대체한다
 * (localizedText와 같은 규칙).
 *
 * React import 금지 — 데이터 레이어다.
 */
import { RECAP_DEFAULT_LANG } from './schema';

/** @type {Object<string, { en: string, ko?: string|null, 'zh-Hant'?: string|null }>} */
export const RECAP_STRINGS = Object.freeze({
  // 페이지·머리글
  'recap.title': { en: 'Recap', ko: 'Recap', 'zh-Hant': 'Recap' },
  'recap.list.subtitle': { en: 'Post-campaign reports by event. Numbers come from synced data; judgments and lessons are written here.', ko: '이벤트별 캠페인 결과 보고서입니다. 숫자는 동기화 데이터에서 자동으로 오고, 판단과 배운 점은 여기서 씁니다.', 'zh-Hant': '依活動整理的行銷成效報告。數字來自同步資料，判斷與心得在此撰寫。' },
  'recap.list.empty': { en: 'No events yet. Tag campaigns with an Event on the Dashboard to see them here.', ko: '아직 이벤트가 없습니다. Dashboard에서 캠페인에 Event를 태그하면 여기에 나타납니다.', 'zh-Hant': '尚無活動。請在 Dashboard 為廣告加上 Event 標籤後即會顯示於此。' },
  'recap.list.column.event': { en: 'Event', ko: '이벤트', 'zh-Hant': '活動' },
  'recap.list.column.period': { en: 'Period', ko: '기간', 'zh-Hant': '期間' },
  'recap.list.column.campaigns': { en: 'Campaigns', ko: '캠페인', 'zh-Hant': '廣告' },
  'recap.list.column.spend': { en: 'Spend', ko: '지출', 'zh-Hant': '花費' },
  'recap.list.column.status': { en: 'Report', ko: '보고서', 'zh-Hant': '報告' },
  'recap.status.draft': { en: 'Draft', ko: '작성 중', 'zh-Hant': '草稿' },
  'recap.status.final': { en: 'Final', ko: '확정', 'zh-Hant': '定稿' },
  'recap.status.none': { en: 'Not started', ko: '시작 전', 'zh-Hant': '尚未開始' },
  'recap.detail.back': { en: 'All recaps', ko: '전체 보고서', 'zh-Hant': '所有報告' },
  'recap.detail.notFound': { en: 'No campaigns are tagged with this event.', ko: '이 이벤트로 태그된 캠페인이 없습니다.', 'zh-Hant': '沒有標記為此活動的廣告。' },
  'recap.detail.print': { en: 'Print / PDF', ko: '인쇄 / PDF', 'zh-Hant': '列印 / PDF' },

  // KPI
  'recap.kpi.campaigns': { en: 'Campaigns', ko: '캠페인', 'zh-Hant': '廣告' },
  'recap.kpi.spend': { en: 'Spend', ko: '지출', 'zh-Hant': '花費' },
  'recap.kpi.planned': { en: 'Planned', ko: '계획', 'zh-Hant': '預算' },
  'recap.kpi.ofPlanned': { en: 'of {planned} planned', ko: '계획 {planned} 중', 'zh-Hant': '預算 {planned}' },
  'recap.kpi.stores': { en: 'Stores', ko: '매장', 'zh-Hant': '門市' },
  'recap.kpi.period': { en: 'Period', ko: '기간', 'zh-Hant': '期間' },

  // 머리글 순위 한 줄
  'recap.headline.rank': { en: '#{rank} of {total} comparable events by {metric}', ko: '비교 가능한 이벤트 {total}개 중 {metric} {rank}위', 'zh-Hant': '{total} 個可比活動中 {metric} 排名第 {rank}' },
  'recap.headline.best': { en: 'Best of {total} comparable events by {metric}', ko: '비교 가능한 이벤트 {total}개 중 {metric} 1위', 'zh-Hant': '{total} 個可比活動中 {metric} 排名第一' },

  // 섹션
  'recap.section.timeline': { en: 'Timeline', ko: '타임라인', 'zh-Hant': '時間軸' },
  'recap.section.campaigns': { en: '{platform} campaigns', ko: '{platform} 캠페인', 'zh-Hant': '{platform} 廣告' },
  'recap.section.notes': { en: 'Notes', ko: '코멘트', 'zh-Hant': '評語' },
  'recap.section.learnings': { en: 'Learnings', ko: '배운 점', 'zh-Hant': '學到的事' },
  'recap.section.nextSteps': { en: 'Next time', ko: '다음에는', 'zh-Hant': '下次' },
  'recap.section.notesPlaceholder': { en: 'Judgments, strengths, weaknesses and lessons will be written here (phase 2).', ko: '판정, 장점, 아쉬운 점, 배운 점은 여기에 적습니다(2단계).', 'zh-Hant': '判斷、優點、不足與心得將在此撰寫（第二階段）。' },
  'recap.note.strength': { en: 'Strength', ko: '장점', 'zh-Hant': '優點' },
  'recap.note.weakness': { en: 'Weakness', ko: '아쉬운 점', 'zh-Hant': '不足' },
  'recap.note.reason': { en: 'Why', ko: '이유', 'zh-Hant': '原因' },
  'recap.scope.phases': { en: '{n} phases', ko: '{n}개 단계', 'zh-Hant': '{n} 個階段' },
  'recap.scope.phase': { en: '1 phase', ko: '1개 단계', 'zh-Hant': '1 個階段' },
  'recap.scope.campaigns': { en: '{n} campaigns', ko: '캠페인 {n}개', 'zh-Hant': '{n} 支廣告' },
  'recap.scope.campaign': { en: '1 campaign', ko: '캠페인 1개', 'zh-Hant': '1 支廣告' },
  'recap.scope.lessons': { en: '{n} lessons', ko: '{n}개 항목', 'zh-Hant': '{n} 項' },
  'recap.scope.lesson': { en: '1 lesson', ko: '1개 항목', 'zh-Hant': '1 項' },

  // 표 헤더
  'recap.table.rank': { en: '#', ko: '#', 'zh-Hant': '#' },
  'recap.table.store': { en: 'Store', ko: '매장', 'zh-Hant': '門市' },
  'recap.table.campaign': { en: 'Campaign', ko: '캠페인', 'zh-Hant': '廣告' },
  'recap.table.dailyBudget': { en: 'Daily budget', ko: '일예산', 'zh-Hant': '每日預算' },
  'recap.table.spend': { en: 'Spend', ko: '지출', 'zh-Hant': '花費' },
  'recap.table.verdict': { en: 'Efficiency', ko: '예산 효율', 'zh-Hant': '預算效率' },
  'recap.table.video': { en: 'Video', ko: '영상 반응', 'zh-Hant': '影片反應' },
  'recap.table.engagement': { en: 'Engagement', ko: '참여 반응', 'zh-Hant': '互動反應' },
  'recap.table.action': { en: 'Action', ko: '행동', 'zh-Hant': '行動' },
  'recap.table.noData': { en: 'No performance data', ko: '성과 데이터 없음', 'zh-Hant': '無成效資料' },
  'recap.table.empty': { en: 'No campaigns on this platform.', ko: '이 플랫폼에는 캠페인이 없습니다.', 'zh-Hant': '此平台沒有廣告。' },

  // 지표 이름
  'metric.cpm': { en: 'CPM', ko: 'CPM', 'zh-Hant': 'CPM' },
  'metric.cpc': { en: 'CPC', ko: 'CPC', 'zh-Hant': 'CPC' },
  'metric.cpa': { en: 'CPA', ko: 'CPA', 'zh-Hant': 'CPA' },
  'metric.ctr': { en: 'CTR', ko: 'CTR', 'zh-Hant': 'CTR' },
  'metric.hookRate': { en: 'Hook', ko: 'Hook', 'zh-Hant': 'Hook' },
  'metric.holdRate': { en: 'Hold', ko: 'Hold', 'zh-Hant': 'Hold' },
  'metric.engagementRate': { en: 'Eng. rate', ko: '참여율', 'zh-Hant': '互動率' },
  'metric.reach': { en: 'Reach', ko: '도달', 'zh-Hant': '觸及' },
  'metric.impressions': { en: 'Impressions', ko: '노출', 'zh-Hant': '曝光' },
  'metric.videoPlays': { en: 'Plays', ko: '조회', 'zh-Hant': '觀看' },
  'metric.avgWatch': { en: 'Avg', ko: '평균', 'zh-Hant': '平均' },
  'metric.clicks': { en: 'Clicks', ko: '클릭', 'zh-Hant': '點擊' },
  'metric.likes': { en: 'Like', ko: '좋아요', 'zh-Hant': '讚' },
  'metric.comments': { en: 'Cmt', ko: '댓글', 'zh-Hant': '留言' },
  'metric.shares': { en: 'Share', ko: '공유', 'zh-Hant': '分享' },
  'metric.follows': { en: 'Follow', ko: '팔로우', 'zh-Hant': '追蹤' },
  'metric.profileVisits': { en: 'Profile', ko: '프로필', 'zh-Hant': '個人檔案' },
  'metric.conversions': { en: 'Results', ko: '결과', 'zh-Hant': '成果' },

  // 벤치마크
  'benchmark.vsMedian': { en: 'median {median}', ko: '중앙값 {median}', 'zh-Hant': '中位數 {median}' },
  'benchmark.percentile.best': { en: 'best of {n}', ko: '{n}개 중 최고', 'zh-Hant': '{n} 個中最佳' },
  'benchmark.percentile.top': { en: 'top {pct}%', ko: '상위 {pct}%', 'zh-Hant': '前 {pct}%' },
  'benchmark.percentile.mid': { en: 'mid', ko: '중간', 'zh-Hant': '中段' },
  'benchmark.percentile.bottom': { en: 'bottom {pct}%', ko: '하위 {pct}%', 'zh-Hant': '後 {pct}%' },
  'benchmark.percentile.lowest': { en: 'lowest of {n}', ko: '{n}개 중 최저', 'zh-Hant': '{n} 個中最低' },
  'benchmark.sample': { en: 'of {n} similar', ko: '유사 캠페인 {n}개 기준', 'zh-Hant': '相似廣告 {n} 支' },
  'benchmark.sample.phase': { en: 'vs {n} {phase} campaigns', ko: '{phase} 캠페인 {n}개 기준', 'zh-Hant': '對比 {n} 支 {phase} 廣告' },
  'benchmark.sample.goal': { en: 'vs {n} {goal} campaigns', ko: '{goal} 캠페인 {n}개 기준', 'zh-Hant': '對比 {n} 支 {goal} 廣告' },
  'benchmark.notEnough': { en: 'not enough data', ko: '비교 데이터 부족', 'zh-Hant': '資料不足' },
  'benchmark.tooltip': { en: '{label}: {value}. Median of {n} comparable campaigns: {median}. This campaign ranks in the {position}.', ko: '{label}: {value}. 비교 가능한 캠페인 {n}개의 중앙값: {median}. 이 캠페인은 {position}에 해당합니다.', 'zh-Hant': '{label}：{value}。{n} 支可比廣告的中位數：{median}。此廣告位於{position}。' },

  // 판정
  'verdict.good': { en: 'Good', ko: '좋음', 'zh-Hant': '良好' },
  'verdict.mid': { en: 'Fair', ko: '보통', 'zh-Hant': '普通' },
  'verdict.bad': { en: 'Weak', ko: '아쉬움', 'zh-Hant': '不足' },
  'verdict.suggested': { en: 'suggested', ko: '제안값', 'zh-Hant': '建議值' },
  'verdict.none': { en: '—', ko: '—', 'zh-Hant': '—' },

  // 편집(2단계)
  'recap.edit.start': { en: 'Edit', ko: '편집', 'zh-Hant': '編輯' },
  'recap.edit.save': { en: 'Save', ko: '저장', 'zh-Hant': '儲存' },
  'recap.edit.saving': { en: 'Saving…', ko: '저장 중…', 'zh-Hant': '儲存中…' },
  'recap.edit.cancel': { en: 'Cancel', ko: '취소', 'zh-Hant': '取消' },
  'recap.edit.saved': { en: 'Recap saved.', ko: '보고서를 저장했습니다.', 'zh-Hant': '報告已儲存。' },
  'recap.edit.failed': { en: "Couldn't save the recap.", ko: '보고서를 저장하지 못했습니다.', 'zh-Hant': '無法儲存報告。' },
  'recap.edit.signIn': { en: 'Sign in to edit', ko: '로그인 후 편집', 'zh-Hant': '登入後編輯' },
  'recap.edit.signInHint': { en: 'Reading is open to anyone with the link. Writing needs your account.', ko: '읽기는 링크만 있으면 누구나 가능합니다. 쓰기는 계정이 필요합니다.', 'zh-Hant': '有連結即可閱讀，撰寫需要帳號。' },
  'recap.edit.status': { en: 'Report status', ko: '보고서 상태', 'zh-Hant': '報告狀態' },
  'recap.edit.summary': { en: 'Summary', ko: '요약', 'zh-Hant': '摘要' },
  'recap.edit.summaryHint': { en: 'One paragraph under the headline — what this event did and what carried it.', ko: '제목 아래 한 단락 — 이 이벤트가 무엇을 했고 무엇이 성과를 끌었는지.', 'zh-Hant': '標題下的一段話——這次活動做了什麼、成效由什麼帶動。' },
  'recap.edit.learnings': { en: 'Learnings', ko: '배운 점', 'zh-Hant': '學到的事' },
  'recap.edit.learningTitle': { en: 'Lesson title', ko: '항목 제목', 'zh-Hant': '項目標題' },
  'recap.edit.learningBody': { en: 'What happened and why it matters', ko: '무슨 일이 있었고 왜 중요한지', 'zh-Hant': '發生了什麼、為何重要' },
  'recap.edit.addLearning': { en: 'Add lesson', ko: '항목 추가', 'zh-Hant': '新增項目' },
  'recap.edit.removeLearning': { en: 'Remove lesson', ko: '항목 삭제', 'zh-Hant': '刪除項目' },
  'recap.edit.moveUp': { en: 'Move up', ko: '위로', 'zh-Hant': '上移' },
  'recap.edit.moveDown': { en: 'Move down', ko: '아래로', 'zh-Hant': '下移' },
  'recap.edit.nextSteps': { en: 'Next time', ko: '다음에는', 'zh-Hant': '下次' },
  'recap.edit.nextStepsHint': { en: 'If we ran a similar campaign again, what would we keep and what would we change?', ko: '비슷한 캠페인을 다시 한다면 무엇을 유지하고 무엇을 바꿀까요?', 'zh-Hant': '若再做類似的廣告，什麼該保留、什麼該改變？' },
  'recap.edit.verdict': { en: 'Efficiency', ko: '예산 효율', 'zh-Hant': '預算效率' },
  'recap.edit.useSuggestion': { en: 'Use suggestion', ko: '제안값 사용', 'zh-Hant': '採用建議值' },
  'recap.edit.noSuggestion': { en: 'No suggestion — not enough comparable campaigns.', ko: '제안 없음 — 비교 가능한 캠페인이 부족합니다.', 'zh-Hant': '無建議——可比廣告不足。' },
  'recap.edit.organicViews': { en: 'Organic views (account total)', ko: '오가닉 조회수(계정 전체)', 'zh-Hant': '自然觀看數（帳號全部）' },
  'recap.edit.organicEngagements': { en: 'Organic engagements (account total)', ko: '오가닉 참여(계정 전체)', 'zh-Hant': '自然互動數（帳號全部）' },
  'recap.edit.organicHint': { en: 'Optional. Not available from the ads API — copy from the platform insights.', ko: '선택 사항. 광고 API에 없는 값이라 플랫폼 인사이트에서 옮겨 적습니다.', 'zh-Hant': '選填。廣告 API 沒有此數值，請自平台洞察報告抄錄。' },
  'recap.edit.langTab': { en: 'Language', ko: '언어', 'zh-Hant': '語言' },
  'recap.detail.excel': { en: 'Excel', ko: 'Excel', 'zh-Hant': 'Excel' },
  'recap.detail.excelFailed': { en: "Couldn't build the Excel file.", ko: 'Excel 파일을 만들지 못했습니다.', 'zh-Hant': '無法產生 Excel 檔案。' },
  'recap.edit.aiDraft': { en: 'AI draft', ko: 'AI 초안', 'zh-Hant': 'AI 草稿' },
  'recap.edit.aiDraftHint': { en: 'Fills empty comments and lessons from the numbers. You edit before saving.', ko: '숫자를 보고 비어 있는 코멘트와 배운 점의 초안을 채웁니다. 저장 전에 다듬으세요.', 'zh-Hant': '依數字填入空白的評語與心得草稿，儲存前請修改。' },
  'recap.edit.aiTranslate': { en: 'Translate', ko: '번역', 'zh-Hant': '翻譯' },
  'recap.edit.aiTranslateHint': { en: 'Fills the other languages from English where they are empty.', ko: '영어 문장을 바탕으로 비어 있는 다른 언어 칸을 채웁니다.', 'zh-Hant': '依英文內容填入其他語言的空白欄位。' },
  'recap.edit.aiWorking': { en: 'Working…', ko: '작업 중…', 'zh-Hant': '處理中…' },
  'recap.edit.aiDone': { en: 'Draft added — review before saving.', ko: '초안을 채웠습니다. 저장 전에 확인하세요.', 'zh-Hant': '已填入草稿，儲存前請確認。' },
  'recap.edit.aiFailed': { en: "The AI draft didn't come back.", ko: 'AI 초안을 받지 못했습니다.', 'zh-Hant': '未能取得 AI 草稿。' },

  // 언어 대체 표시
  'lang.fallback': { en: '(English)', ko: '(영어)', 'zh-Hant': '（英文）' },
  'lang.en': { en: 'English', ko: '영어', 'zh-Hant': '英文' },
  'lang.ko': { en: 'Korean', ko: '한국어', 'zh-Hant': '韓文' },
  'lang.zh-Hant': { en: 'Traditional Chinese', ko: '번체중문', 'zh-Hant': '繁體中文' },
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
