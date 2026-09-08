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
  'recap.title': { en: 'Reports', ko: '보고서', 'zh-Hant': '報告' },
  'recap.list.subtitle': { en: 'Post-campaign reports by event. Numbers come from synced data; judgments and lessons are written here.', ko: '이벤트별 캠페인 결과 보고서입니다. 숫자는 동기화 데이터에서 자동으로 오고, 판단과 배운 점은 여기서 씁니다.', 'zh-Hant': '依活動整理的行銷成效報告。數字來自同步資料，判斷與心得在此撰寫。' },
  'recap.list.empty': { en: 'No events yet. Tag campaigns with an Event on the Dashboard to see them here.', ko: '아직 이벤트가 없습니다. Dashboard에서 캠페인에 Event를 태그하면 여기에 나타납니다.', 'zh-Hant': '尚無活動。請在 Dashboard 為廣告加上 Event 標籤後即會顯示於此。' },
  'recap.list.year': { en: 'Year', ko: '연도', 'zh-Hant': '年度' },
  'recap.list.column.event': { en: 'Event', ko: '이벤트', 'zh-Hant': '活動' },
  'recap.list.column.period': { en: 'Period', ko: '기간', 'zh-Hant': '期間' },
  'recap.list.column.campaigns': { en: 'Campaigns', ko: '캠페인', 'zh-Hant': '廣告' },
  'recap.list.column.spend': { en: 'Spend', ko: '지출', 'zh-Hant': '花費' },
  'recap.list.column.status': { en: 'Status', ko: '상태', 'zh-Hant': '狀態' },
  'recap.status.draft': { en: 'Draft', ko: '작성 중', 'zh-Hant': '草稿' },
  'recap.status.final': { en: 'Ready', ko: '완료', 'zh-Hant': '完成' },
  'recap.status.none': { en: 'Not started', ko: '시작 전', 'zh-Hant': '尚未開始' },
  'recap.detail.back': { en: 'All reports', ko: '전체 보고서', 'zh-Hant': '所有報告' },
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
  'recap.section.nextSteps': { en: 'Recommended action', ko: '권장 행동', 'zh-Hant': '建議行動' },
  'recap.section.notesPlaceholder': { en: 'No notes yet. Press Edit to add a verdict, strengths, weaknesses and the reason for each campaign.', ko: '아직 코멘트가 없습니다. Edit를 눌러 캠페인별 판정·장점·아쉬운 점·이유를 적으세요.', 'zh-Hant': '尚無評語。按下「編輯」為每支廣告填寫評定、優點、不足與原因。' },
  'recap.note.strength': { en: 'Strength', ko: '장점', 'zh-Hant': '優點' },
  'recap.note.weakness': { en: 'Weakness', ko: '아쉬운 점', 'zh-Hant': '不足' },
  'recap.note.reason': { en: 'Reason', ko: '이유', 'zh-Hant': '原因' },
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
  'recap.table.goal': { en: 'Goal', ko: '목표', 'zh-Hant': '目標' },
  'recap.table.primaryKpi': { en: 'Primary KPI', ko: '대표 KPI', 'zh-Hant': '主要 KPI' },
  'recap.table.primaryKpiTitle': { en: 'Primary KPI', ko: '대표 KPI', 'zh-Hant': '主要 KPI' },
  'recap.table.primaryKpiBody': { en: 'The actual main result for the campaign goal — reported, not judged.', ko: '캠페인 목표의 실제 대표 결과 — 판단하지 않고 그대로 보여줍니다.', 'zh-Hant': '廣告目標的實際主要結果——只呈現，不評價。' },
  'recap.table.primaryKpiGoals': { en: 'Awareness → CPM · Traffic → CPC · Engagement → Cost/eng · Conversion / Store visit → CPA', ko: '인지 → CPM · 트래픽 → CPC · 참여 → Cost/eng · 전환 / 매장 방문 → CPA', 'zh-Hant': '認知 → CPM · 流量 → CPC · 互動 → Cost/eng · 轉換 / 到店 → CPA' },
  'recap.table.primaryKpiSeparate': { en: 'The historical comparison underneath is context only — where this KPI ranks among comparable past campaigns. There is no overall campaign grade.', ko: '아래 과거 비교는 맥락일 뿐입니다 — 이 KPI가 비슷한 과거 캠페인 사이에서 몇 번째인지. 종합 등급은 없습니다.', 'zh-Hant': '下方的歷史比較僅供參考——此 KPI 在可比過往廣告中的排名。沒有整體評分。' },
  'recap.table.primaryKpiValueHint': { en: '{metric} = spend ÷ {basis} for this campaign only.', ko: '{metric} = 이 캠페인의 지출 ÷ {basis}.', 'zh-Hant': '{metric} = 此廣告的花費 ÷ {basis}。' },
  'recap.table.primaryKpiBasis.cpm': { en: 'impressions × 1,000', ko: '노출 × 1,000', 'zh-Hant': '曝光 × 1,000' },
  'recap.table.primaryKpiBasis.cpc': { en: 'clicks', ko: '클릭', 'zh-Hant': '點擊' },
  'recap.table.primaryKpiBasis.cpe': { en: '(likes + comments + shares)', ko: '(좋아요 + 댓글 + 공유)', 'zh-Hant': '（按讚 + 留言 + 分享）' },
  'recap.table.primaryKpiBasis.cpa': { en: 'results', ko: '결과', 'zh-Hant': '成果' },
  'recap.table.actionResponse': { en: 'Action response', ko: '행동 반응', 'zh-Hant': '行動反應' },
  'recap.table.budgetSpend': { en: 'Budget / Spend', ko: '예산 / 지출', 'zh-Hant': '預算 / 花費' },
  'recap.table.spent': { en: '{amount} spent', ko: '{amount} 지출', 'zh-Hant': '已花費 {amount}' },
  'recap.table.perDay': { en: '{amount}/day', ko: '{amount}/일', 'zh-Hant': '{amount}/天' },
  'recap.table.videoResponse': { en: 'Video response', ko: '영상 반응', 'zh-Hant': '影片反應' },
  'recap.table.engagementAction': { en: 'Engagement / Action', ko: '참여 / 행동', 'zh-Hant': '互動 / 行動' },
  'recap.table.countClicks': { en: '{n} clicks', ko: '클릭 {n}', 'zh-Hant': '{n} 次點擊' },
  'recap.table.countLikes': { en: '{n} likes', ko: '좋아요 {n}', 'zh-Hant': '{n} 個讚' },
  'recap.table.countShares': { en: '{n} shares', ko: '공유 {n}', 'zh-Hant': '{n} 次分享' },
  'recap.table.countResults': { en: '{n} results', ko: '결과 {n}', 'zh-Hant': '{n} 個成果' },
  'recap.table.avgWatch': { en: 'Avg {s}', ko: '평균 {s}', 'zh-Hant': '平均 {s}' },
  'recap.table.video': { en: 'Video', ko: '영상 반응', 'zh-Hant': '影片反應' },
  'recap.table.engagement': { en: 'Engagement', ko: '참여 반응', 'zh-Hant': '互動反應' },
  'recap.table.action': { en: 'Action', ko: '행동', 'zh-Hant': '行動' },
  'recap.table.noComparison': { en: 'Not enough comparison data — fewer than 3 comparable past campaigns on this platform with this goal. The value shown is this campaign\'s own result.', ko: '비교 데이터 부족 — 같은 플랫폼·같은 목표의 과거 비교 캠페인이 3개 미만입니다. 표시된 값은 이 캠페인 자체의 결과입니다.', 'zh-Hant': '比較資料不足——同平台、同目標的可比過往廣告少於 3 支。顯示的值為此廣告本身的結果。' },
  'recap.table.over': { en: 'Over {pct}%', ko: '{pct}% 초과', 'zh-Hant': '超出 {pct}%' },
  'recap.table.under': { en: 'Under {pct}%', ko: '{pct}% 미달', 'zh-Hant': '不足 {pct}%' },
  'recap.table.noData': { en: 'No performance data', ko: '성과 데이터 없음', 'zh-Hant': '無成效資料' },
  'recap.table.empty': { en: 'No campaigns on this platform.', ko: '이 플랫폼에는 캠페인이 없습니다.', 'zh-Hant': '此平台沒有廣告。' },

  // 지표 이름
  'metric.cpm': { en: 'CPM', ko: 'CPM', 'zh-Hant': 'CPM' },
  'metric.cpc': { en: 'CPC', ko: 'CPC', 'zh-Hant': 'CPC' },
  'metric.cpa': { en: 'CPA', ko: 'CPA', 'zh-Hant': 'CPA' },
  'metric.cpe': { en: 'Cost/eng', ko: '참여당 비용', 'zh-Hant': '互動成本' },
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
  'benchmark.notEnough': { en: 'vs past —', ko: '과거 대비 —', 'zh-Hant': '對比過往 —' },
  'benchmark.tooltip': { en: '{label}: {value}. Median of {n} comparable campaigns: {median}. This campaign ranks in the {position}.', ko: '{label}: {value}. 비교 가능한 캠페인 {n}개의 중앙값: {median}. 이 캠페인은 {position}에 해당합니다.', 'zh-Hant': '{label}：{value}。{n} 支可比廣告的中位數：{median}。此廣告位於{position}。' },

  // 캠페인 해석(Notes 자동 생성) — 근거 수준 표시 + 지표가 말하는 것(aspect)
  'insight.autoHint': { en: 'Generated from this campaign\'s metrics and comparable past campaigns. Nothing here is a claim about creative, targeting or messaging — the data does not contain that.', ko: '이 캠페인의 지표와 비교 가능한 과거 캠페인에서 만든 문장입니다. 소재·타겟·메시지에 대한 주장은 없습니다 — 데이터에 그 정보가 없습니다.', 'zh-Hant': '由此廣告的指標與可比過往廣告產生。此處不涉及素材、受眾或訊息的判斷——資料中沒有這些資訊。' },
  'recap.edit.insightHint': { en: 'Leave a field empty to keep the data-based note that the page shows; anything you write here replaces it.', ko: '칸을 비워 두면 화면에 데이터 기반 해석이 그대로 보입니다. 여기에 쓴 글이 그것을 대체합니다.', 'zh-Hant': '欄位留空時，頁面會顯示以資料為基礎的解讀；在此撰寫的內容會取代它。' },
  'insight.field.strength': { en: 'What worked', ko: '잘된 것', 'zh-Hant': '做得好的' },
  'insight.field.weakness': { en: 'Could improve', ko: '개선할 것', 'zh-Hant': '可改進的' },
  'cell.worked.reach': { en: 'Reach efficiency stood out against comparable campaigns.', ko: '도달 효율이 비교 캠페인 대비 두드러졌습니다.', 'zh-Hant': '觸及效率相較可比廣告表現突出。' },
  'cell.worked.hook': { en: 'Early video attention stood out against comparable campaigns.', ko: '영상 초반 주목이 비교 캠페인 대비 두드러졌습니다.', 'zh-Hant': '影片前段注意力相較可比廣告表現突出。' },
  'cell.worked.hold': { en: 'Watch-through stood out against comparable campaigns.', ko: '끝까지 시청이 비교 캠페인 대비 두드러졌습니다.', 'zh-Hant': '完整觀看相較可比廣告表現突出。' },
  'cell.worked.click': { en: 'Click response stood out against comparable campaigns.', ko: '클릭 반응이 비교 캠페인 대비 두드러졌습니다.', 'zh-Hant': '點擊反應相較可比廣告表現突出。' },
  'cell.worked.cpc': { en: 'Cost per click stood out against comparable campaigns.', ko: '클릭당 비용이 비교 캠페인 대비 두드러졌습니다.', 'zh-Hant': '每次點擊成本相較可比廣告表現突出。' },
  'cell.worked.engagement': { en: 'Engagement response stood out against comparable campaigns.', ko: '참여 반응이 비교 캠페인 대비 두드러졌습니다.', 'zh-Hant': '互動反應相較可比廣告表現突出。' },
  'cell.worked.cpe': { en: 'Engagement efficiency stood out against comparable campaigns.', ko: '참여 효율이 비교 캠페인 대비 두드러졌습니다.', 'zh-Hant': '互動效率相較可比廣告表現突出。' },
  'cell.worked.result': { en: 'Result efficiency stood out against comparable campaigns.', ko: '결과 효율이 비교 캠페인 대비 두드러졌습니다.', 'zh-Hant': '成果效率相較可比廣告表現突出。' },
  'cell.improve.reach': { en: 'Reach efficiency was the clearest opportunity.', ko: '도달 효율이 가장 분명한 개선 여지였습니다.', 'zh-Hant': '觸及效率是最明顯的改善空間。' },
  'cell.improve.hook': { en: 'Early video attention was the clearest opportunity.', ko: '영상 초반 주목이 가장 분명한 개선 여지였습니다.', 'zh-Hant': '影片前段注意力是最明顯的改善空間。' },
  'cell.improve.hold': { en: 'Watch-through was the clearest opportunity.', ko: '끝까지 시청이 가장 분명한 개선 여지였습니다.', 'zh-Hant': '完整觀看是最明顯的改善空間。' },
  'cell.improve.click': { en: 'Click response was the clearest opportunity.', ko: '클릭 반응이 가장 분명한 개선 여지였습니다.', 'zh-Hant': '點擊反應是最明顯的改善空間。' },
  'cell.improve.cpc': { en: 'Cost per click was the clearest opportunity.', ko: '클릭당 비용이 가장 분명한 개선 여지였습니다.', 'zh-Hant': '每次點擊成本是最明顯的改善空間。' },
  'cell.improve.engagement': { en: 'Engagement response was the clearest opportunity.', ko: '참여 반응이 가장 분명한 개선 여지였습니다.', 'zh-Hant': '互動反應是最明顯的改善空間。' },
  'cell.improve.cpe': { en: 'Engagement efficiency was the clearest opportunity.', ko: '참여 효율이 가장 분명한 개선 여지였습니다.', 'zh-Hant': '互動效率是最明顯的改善空間。' },
  'cell.improve.result': { en: 'Result efficiency was the clearest opportunity.', ko: '결과 효율이 가장 분명한 개선 여지였습니다.', 'zh-Hant': '成果效率是最明顯的改善空間。' },
  'cell.improve.overspend': { en: 'Spend ran {pct}% over plan.', ko: '지출이 계획보다 {pct}% 넘었습니다.', 'zh-Hant': '花費超出計畫 {pct}%。' },
  'insight.writtenHint': { en: 'Written by a person in Edit.', ko: 'Edit에서 사람이 쓴 글입니다.', 'zh-Hant': '由人員在編輯中撰寫。' },
  'aspectShort.reach': { en: 'reach', ko: '도달', 'zh-Hant': '觸及' },
  'aspectShort.click': { en: 'click rate', ko: '클릭', 'zh-Hant': '點擊' },
  'aspectShort.result': { en: 'results', ko: '결과', 'zh-Hant': '成果' },
  'aspectShort.hook': { en: 'hook', ko: 'Hook', 'zh-Hant': 'Hook' },
  'aspectShort.hold': { en: 'hold', ko: 'Hold', 'zh-Hant': 'Hold' },
  'aspectShort.engagement': { en: 'engagement', ko: '참여', 'zh-Hant': '互動' },
  // 이벤트 단위 패턴(Learnings 자동 생성) — 여러 캠페인이 같은 방향일 때만
  'goalLabel.awareness': { en: 'Awareness', ko: '인지', 'zh-Hant': '認知' },
  'goalLabel.traffic': { en: 'Traffic', ko: '트래픽', 'zh-Hant': '流量' },
  'goalLabel.engagement': { en: 'Engagement', ko: '참여', 'zh-Hant': '互動' },
  'goalLabel.conversion': { en: 'Conversion', ko: '전환', 'zh-Hant': '轉換' },
  'goalLabel.store_visit': { en: 'Store visit', ko: '매장 방문', 'zh-Hant': '到店' },
  'goal.awareness': { en: 'awareness', ko: '인지', 'zh-Hant': '認知' },
  'goal.traffic': { en: 'traffic', ko: '트래픽', 'zh-Hant': '流量' },
  'goal.engagement': { en: 'engagement', ko: '참여', 'zh-Hant': '互動' },
  'goal.conversion': { en: 'conversion', ko: '전환', 'zh-Hant': '轉換' },
  'goal.store_visit': { en: 'store-visit', ko: '매장 방문', 'zh-Hant': '到店' },

  // 판정
  'verdict.good': { en: 'Good', ko: '좋음', 'zh-Hant': '良好' },
  'verdict.mid': { en: 'Fair', ko: '보통', 'zh-Hant': '普通' },
  'verdict.bad': { en: 'Weak', ko: '아쉬움', 'zh-Hant': '不足' },
  'verdict.none': { en: '—', ko: '—', 'zh-Hant': '—' },

  // 편집(2단계)
  'recap.edit.start': { en: 'Edit', ko: '편집', 'zh-Hant': '編輯' },
  'recap.edit.save': { en: 'Save', ko: '저장', 'zh-Hant': '儲存' },
  'recap.edit.saving': { en: 'Saving…', ko: '저장 중…', 'zh-Hant': '儲存中…' },
  'recap.edit.cancel': { en: 'Cancel', ko: '취소', 'zh-Hant': '取消' },
  'recap.edit.saved': { en: 'Report saved.', ko: '보고서를 저장했습니다.', 'zh-Hant': '報告已儲存。' },
  'recap.edit.failed': { en: "Couldn't save the report.", ko: '보고서를 저장하지 못했습니다.', 'zh-Hant': '無法儲存報告。' },
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
  'recap.edit.organicViews': { en: 'Organic views (account total)', ko: '오가닉 조회수(계정 전체)', 'zh-Hant': '自然觀看數（帳號全部）' },
  'recap.edit.organicEngagements': { en: 'Organic engagements (account total)', ko: '오가닉 참여(계정 전체)', 'zh-Hant': '自然互動數（帳號全部）' },
  'recap.edit.organicHint': { en: 'Optional. Not available from the ads API — copy from the platform insights.', ko: '선택 사항. 광고 API에 없는 값이라 플랫폼 인사이트에서 옮겨 적습니다.', 'zh-Hant': '選填。廣告 API 沒有此數值，請自平台洞察報告抄錄。' },
  'recap.edit.langTab': { en: 'Language', ko: '언어', 'zh-Hant': '語言' },
  'recap.export': { en: 'Export', ko: '내보내기', 'zh-Hant': '匯出' },
  'recap.export.sheets': { en: 'Google Sheets', ko: 'Google Sheets', 'zh-Hant': 'Google Sheets' },
  'recap.export.sheetsHint': { en: 'Copies the tables, then opens a new sheet — paste with Ctrl+V / ⌘V', ko: '표를 복사한 뒤 새 시트를 엽니다 — Ctrl+V / ⌘V로 붙여 넣으세요', 'zh-Hant': '複製表格並開啟新試算表——以 Ctrl+V / ⌘V 貼上' },
  'recap.export.sheetsDone': { en: 'Copied. Paste into the new sheet (Ctrl+V / ⌘V).', ko: '복사했습니다. 새 시트에 붙여 넣으세요(Ctrl+V / ⌘V).', 'zh-Hant': '已複製。請在新試算表中貼上（Ctrl+V / ⌘V）。' },
  'recap.export.sheetsFailed': { en: "Couldn't copy to the clipboard. Allow clipboard access and try again.", ko: '클립보드에 복사하지 못했습니다. 클립보드 권한을 허용하고 다시 시도하세요.', 'zh-Hant': '無法複製到剪貼簿。請允許剪貼簿權限後再試。' },
  'recap.export.pdf': { en: 'PDF (print)', ko: 'PDF (인쇄)', 'zh-Hant': 'PDF（列印）' },
  'recap.export.pdfHint': { en: 'Opens the browser print dialog — choose "Save as PDF"', ko: '브라우저 인쇄 창을 엽니다 — "PDF로 저장"을 고르세요', 'zh-Hant': '開啟瀏覽器列印視窗——選擇「儲存為 PDF」' },
  'recap.compare.title': { en: 'Compare with similar campaigns', ko: '비슷한 캠페인과 비교', 'zh-Hant': '與相似廣告比較' },
  'recap.compare.hint': { en: 'Click a metric column to sort. The highlighted row is this campaign.', ko: '지표 열을 누르면 정렬됩니다. 강조된 줄이 이 캠페인입니다.', 'zh-Hant': '點選指標欄位可排序。第一列為本廣告。' },
  'recap.compare.scope.phase': { en: 'Same platform, same goal and same phase ({phase}), other events', ko: '같은 플랫폼 · 같은 단계({phase}) · 다른 이벤트', 'zh-Hant': '同平台、同階段（{phase}）、其他活動' },
  'recap.compare.scope.goal': { en: 'Same platform and same goal ({goal}), other events', ko: '같은 플랫폼 · 같은 목표({goal}) · 다른 이벤트', 'zh-Hant': '同平台、同目標（{goal}）、其他活動' },
  'recap.compare.scope.none': { en: 'Not enough comparable campaigns.', ko: '비교할 캠페인이 부족합니다.', 'zh-Hant': '可比廣告不足。' },
  'recap.compare.group': { en: 'Comparison group', ko: '비교군', 'zh-Hant': '比較組' },
  'recap.compare.groupText': { en: '{platform} · {goal} · {n} comparable campaigns across other events', ko: '{platform} · {goal} · 다른 이벤트의 비교 캠페인 {n}개', 'zh-Hant': '{platform} · {goal} · 其他活動的可比廣告 {n} 支' },
  'recap.compare.groupTextPhase': { en: '{platform} · {goal} · {phase} phase · {n} comparable campaigns across other events', ko: '{platform} · {goal} · {phase} 단계 · 다른 이벤트의 비교 캠페인 {n}개', 'zh-Hant': '{platform} · {goal} · {phase} 階段 · 其他活動的可比廣告 {n} 支' },
  'recap.compare.primary': { en: 'Primary KPI', ko: '대표 KPI', 'zh-Hant': '主要 KPI' },
  'recap.compare.selected': { en: 'Selected metric', ko: '선택한 지표', 'zh-Hant': '所選指標' },
  'recap.compare.lowerBetter': { en: 'lower is better', ko: '낮을수록 좋음', 'zh-Hant': '越低越好' },
  'recap.compare.higherBetter': { en: 'higher is better', ko: '높을수록 좋음', 'zh-Hant': '越高越好' },
  'recap.compare.current': { en: 'Current campaign', ko: '이 캠페인', 'zh-Hant': '目前廣告' },
  'recap.compare.rank': { en: '#{rank} of {total}', ko: '{total}개 중 {rank}위', 'zh-Hant': '{total} 支中第 {rank}' },
  'recap.compare.currentLabel': { en: 'Current', ko: '현재', 'zh-Hant': '目前' },
  'recap.compare.event': { en: 'Event', ko: '이벤트', 'zh-Hant': '活動' },
  'recap.compare.period': { en: 'Period', ko: '기간', 'zh-Hant': '期間' },
  'recap.compare.close': { en: 'Close', ko: '닫기', 'zh-Hant': '關閉' },
  'recap.compare.open': { en: 'Compare', ko: '비교 보기', 'zh-Hant': '比較' },
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

/**
 * 벤치마크 위치 문구 — "best of 5" · "top 25%" · "mid" · "bottom 9%" · "lowest of 4".
 * BenchmarkDelta 셀, Google Sheets 내보내기, 핵심 요약 문장이 같은 말을 쓰게 한 곳에 둔다.
 * 양 끝(백분위 100/0)은 퍼센트가 아니라 말로 — "top 0%"는 읽히지 않는다.
 *
 * @param {{ percentile: number|null, band: string|null, sampleSize: number, peerScope: string }} stat - schema.js benchmarkStat() 결과
 * @param {string} [lang]
 * @returns {string} 비교군이 없으면 "not enough data"
 */
export function benchmarkPositionText(stat, lang = RECAP_DEFAULT_LANG) {
  if (!stat || stat.peerScope === 'none' || stat.percentile == null) return t('benchmark.notEnough', lang);
  if (stat.percentile >= 100) return t('benchmark.percentile.best', lang, { n: stat.sampleSize + 1 });
  if (stat.percentile <= 0) return t('benchmark.percentile.lowest', lang, { n: stat.sampleSize + 1 });
  if (stat.band === 'top') return t('benchmark.percentile.top', lang, { pct: 100 - stat.percentile });
  if (stat.band === 'bottom') return t('benchmark.percentile.bottom', lang, { pct: stat.percentile });
  return t('benchmark.percentile.mid', lang);
}
