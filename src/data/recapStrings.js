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
  'recap.table.goal': { en: 'Goal', ko: '목표', 'zh-Hant': '目標' },
  'recap.table.primaryKpi': { en: 'Primary KPI', ko: '대표 KPI', 'zh-Hant': '主要 KPI' },
  'recap.table.primaryKpiTitle': { en: 'Primary KPI', ko: '대표 KPI', 'zh-Hant': '主要 KPI' },
  'recap.table.primaryKpiBody': { en: 'The actual main result for the campaign goal — reported, not judged.', ko: '캠페인 목표의 실제 대표 결과 — 판단하지 않고 그대로 보여줍니다.', 'zh-Hant': '廣告目標的實際主要結果——只呈現，不評價。' },
  'recap.table.primaryKpiGoals': { en: 'Awareness → CPM · Traffic → CPC · Engagement → Cost/eng · Conversion / Store visit → CPA', ko: '인지 → CPM · 트래픽 → CPC · 참여 → Cost/eng · 전환 / 매장 방문 → CPA', 'zh-Hant': '認知 → CPM · 流量 → CPC · 互動 → Cost/eng · 轉換 / 到店 → CPA' },
  'recap.table.primaryKpiSeparate': { en: 'Target and historical comparisons are shown in their own columns. There is no overall campaign grade.', ko: '목표치 비교와 과거 비교는 각자 열에 있습니다. 종합 등급은 없습니다.', 'zh-Hant': '目標比較與歷史比較各有其欄位。沒有整體評分。' },
  'recap.table.primaryKpiValueHint': { en: '{metric} = spend ÷ {basis} for this campaign only.', ko: '{metric} = 이 캠페인의 지출 ÷ {basis}.', 'zh-Hant': '{metric} = 此廣告的花費 ÷ {basis}。' },
  'recap.table.primaryKpiBasis.cpm': { en: 'impressions × 1,000', ko: '노출 × 1,000', 'zh-Hant': '曝光 × 1,000' },
  'recap.table.primaryKpiBasis.cpc': { en: 'clicks', ko: '클릭', 'zh-Hant': '點擊' },
  'recap.table.primaryKpiBasis.cpe': { en: '(likes + comments + shares)', ko: '(좋아요 + 댓글 + 공유)', 'zh-Hant': '（按讚 + 留言 + 分享）' },
  'recap.table.primaryKpiBasis.cpa': { en: 'results', ko: '결과', 'zh-Hant': '成果' },
  'recap.table.vsTarget': { en: 'vs target', ko: '목표 대비', 'zh-Hant': '對比目標' },
  'recap.table.vsTargetHint': { en: 'Comparison against a KPI target explicitly configured for this campaign. Nothing is substituted when no target is set.', ko: '이 캠페인에 직접 설정된 KPI 목표치와의 비교. 목표치가 없으면 다른 값으로 대신하지 않습니다.', 'zh-Hant': '與此廣告明確設定的 KPI 目標比較。未設定時不以其他值替代。' },
  'recap.table.targetNotSet': { en: 'Not set — no KPI target was configured for this campaign. Nothing is substituted for it.', ko: '설정 안 됨 — 이 캠페인에 KPI 목표치가 없습니다. 다른 값으로 대신하지 않습니다.', 'zh-Hant': '未設定——此廣告沒有 KPI 目標，不以其他值替代。' },
  'recap.table.vsPast': { en: 'vs past', ko: '과거 대비', 'zh-Hant': '對比過往' },
  'recap.table.vsPastHint': { en: 'Where this campaign\'s Primary KPI ranks among comparable past campaigns on the same platform and goal (other events, at least 3). Context only — it is not a grade.', ko: '이 캠페인의 대표 KPI가 같은 플랫폼·목표의 과거 비교 캠페인(다른 이벤트, 3개 이상) 사이에서 몇 번째인지. 맥락일 뿐 등급이 아닙니다.', 'zh-Hant': '此廣告的主要 KPI 在同平台、同目標的過往可比廣告（其他活動，至少 3 支）中的排名。僅供參考，不是評分。' },
  'recap.table.actionResponse': { en: 'Action response', ko: '행동 반응', 'zh-Hant': '行動反應' },
  'recap.table.videoResponse': { en: 'Video response', ko: '영상 반응', 'zh-Hant': '影片反應' },
  'recap.table.engagementResponse': { en: 'Engagement response', ko: '참여 반응', 'zh-Hant': '互動反應' },
  'recap.table.targetBetter': { en: '↓ {pct}% vs target {target}', ko: '목표 {target} 대비 {pct}% 낮음', 'zh-Hant': '較目標 {target} 低 {pct}%' },
  'recap.table.targetWorse': { en: '↑ {pct}% vs target {target}', ko: '목표 {target} 대비 {pct}% 높음', 'zh-Hant': '較目標 {target} 高 {pct}%' },
  'recap.table.targetOn': { en: 'on target {target}', ko: '목표 {target} 수준', 'zh-Hant': '符合目標 {target}' },
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

  // 핵심 요약(Key takeaways) — 숫자를 해석한 문장. 재료는 schema.js buildRecapTakeaways
  'recap.takeaways.title': { en: 'Key takeaways', ko: '핵심 요약', 'zh-Hant': '重點摘要' },
  'recap.takeaways.empty': { en: 'Not enough comparable campaigns yet to draw conclusions — the tables below still show what ran.', ko: '결론을 내릴 만큼 비교 가능한 캠페인이 아직 없습니다. 아래 표에서 집행 내용은 볼 수 있습니다.', 'zh-Hant': '可比廣告尚不足以得出結論——下方表格仍可查看投放內容。' },
  'recap.exec.label.best': { en: 'Best result', ko: '가장 좋았던 결과', 'zh-Hant': '最佳結果' },
  'recap.exec.label.attention': { en: 'Attention', ko: '주의', 'zh-Hant': '注意' },
  'recap.exec.label.next': { en: 'Next move', ko: '다음 행동', 'zh-Hant': '下一步' },
  'recap.exec.best.evidence': { en: 'Strongest {aspect} · {metric} {position}', ko: '{aspect} 최고 · {metric} {position}', 'zh-Hant': '{aspect}最佳 · {metric} {position}' },
  'recap.exec.attention.evidence': { en: 'Weakest {aspect} · {metric} {position}', ko: '{aspect} 최저 · {metric} {position}', 'zh-Hant': '{aspect}最弱 · {metric} {position}' },
  'recap.exec.attention.none': { en: 'No weak spots flagged', ko: '뒤처진 캠페인 없음', 'zh-Hant': '未發現落後項目' },
  'recap.exec.attention.noneEvidence': { en: 'No campaign ranked in the bottom band', ko: '하위 구간에 든 캠페인이 없습니다', 'zh-Hant': '沒有廣告落入後段' },
  'recap.exec.next.platform': { en: 'Prioritize {cheaper} for reach', ko: '도달은 {cheaper}에 우선 배분', 'zh-Hant': '觸及優先投放 {cheaper}' },
  'recap.exec.next.platformEvidence': { en: '{pct}% lower CPM than {pricier}', ko: '{pricier}보다 CPM {pct}% 낮음', 'zh-Hant': 'CPM 較 {pricier} 低 {pct}%' },
  'recap.exec.next.best': { en: 'Shift launch budget toward {platform} {phase}', ko: '출시 예산을 {platform} {phase}에 더 배분', 'zh-Hant': '開幕預算多投向 {platform} {phase}' },
  'recap.exec.next.bestEvidence': { en: 'Most efficient spend in this event', ko: '이번 이벤트에서 지출 대비 가장 효율적', 'zh-Hant': '本次活動花費效率最高' },
  'recap.takeaways.label.best': { en: 'Best performer', ko: '가장 좋았던 캠페인', 'zh-Hant': '表現最佳' },
  'recap.takeaways.label.weakest': { en: 'Needs improvement', ko: '개선이 필요한 캠페인', 'zh-Hant': '待改善' },
  'recap.takeaways.label.platform': { en: 'Platform difference', ko: '플랫폼 차이', 'zh-Hant': '平台差異' },
  'recap.takeaways.label.recommendation': { en: 'Recommendation', ko: '다음 제언', 'zh-Hant': '建議' },
  'recap.takeaways.best': { en: '{platform} {phase} — {metric} {value} · {position}', ko: '{platform} {phase} — {metric} {value} · {position}', 'zh-Hant': '{platform} {phase} — {metric} {value} · {position}' },
  'recap.takeaways.weakest': { en: '{platform} {phase} — {metric} {value} · {position}', ko: '{platform} {phase} — {metric} {value} · {position}', 'zh-Hant': '{platform} {phase} — {metric} {value} · {position}' },
  'recap.takeaways.platform': { en: '{cheaper} CPM {pct}% lower than {pricier}', ko: '{cheaper} CPM이 {pricier}보다 {pct}% 낮음', 'zh-Hant': '{cheaper} CPM 較 {pricier} 低 {pct}%' },
  'recap.takeaways.recommendation': { en: 'Shift more launch-period budget toward {platform} {phase}, less toward {weakPlatform} {weakPhase}', ko: '출시 기간 예산을 {platform} {phase}에 더, {weakPlatform} {weakPhase}에는 덜 배분', 'zh-Hant': '開幕期預算多投向 {platform} {phase}，減少 {weakPlatform} {weakPhase}' },
  'recap.takeaways.recommendationBestOnly': { en: 'Shift more launch-period budget toward {platform} {phase}', ko: '출시 기간 예산을 {platform} {phase}에 더 배분', 'zh-Hant': '開幕期預算多投向 {platform} {phase}' },
  // 캠페인 해석(Notes 자동 생성) — 근거 수준 표시 + 지표가 말하는 것(aspect)
  'insight.autoHint': { en: 'Generated from this campaign\'s metrics and comparable past campaigns. Nothing here is a claim about creative, targeting or messaging — the data does not contain that.', ko: '이 캠페인의 지표와 비교 가능한 과거 캠페인에서 만든 문장입니다. 소재·타겟·메시지에 대한 주장은 없습니다 — 데이터에 그 정보가 없습니다.', 'zh-Hant': '由此廣告的指標與可比過往廣告產生。此處不涉及素材、受眾或訊息的判斷——資料中沒有這些資訊。' },
  'recap.edit.insightHint': { en: 'Leave a field empty to keep the data-based note that the page shows; anything you write here replaces it.', ko: '칸을 비워 두면 화면에 데이터 기반 해석이 그대로 보입니다. 여기에 쓴 글이 그것을 대체합니다.', 'zh-Hant': '欄位留空時，頁面會顯示以資料為基礎的解讀；在此撰寫的內容會取代它。' },
  'aspect.reach': { en: 'reach efficiency', ko: '도달 효율', 'zh-Hant': '觸及效率' },
  'aspect.click': { en: 'click efficiency', ko: '클릭 효율', 'zh-Hant': '點擊效率' },
  'aspect.result': { en: 'result efficiency', ko: '결과 효율', 'zh-Hant': '成果效率' },
  'aspect.hook': { en: 'early attention (hook)', ko: '초반 주목(Hook)', 'zh-Hant': '前段注意力（Hook）' },
  'aspect.hold': { en: 'watch-through (hold)', ko: '끝까지 시청(Hold)', 'zh-Hant': '完整觀看（Hold）' },
  'aspect.engagement': { en: 'engagement', ko: '참여', 'zh-Hant': '互動' },
  'insight.field.strength': { en: 'What worked', ko: '잘된 것', 'zh-Hant': '做得好的' },
  'insight.field.weakness': { en: 'Could improve', ko: '개선할 것', 'zh-Hant': '可改進的' },
  'insight.field.reason': { en: 'Why', ko: '이유', 'zh-Hant': '原因' },
  'insight.field.recommendation': { en: 'Next action', ko: '다음 행동', 'zh-Hant': '下一步' },
  'cell.worked.best': { en: '{metric} ranked best among {n} {scope}.', ko: '{metric}이(가) {scope} {n}개 중 최고였습니다.', 'zh-Hant': '{metric} 在 {n} 支{scope}中排名最佳。' },
  'cell.worked.top': { en: '{metric} was in the top {pct}% of {scope}.', ko: '{metric}이(가) {scope} 중 상위 {pct}%였습니다.', 'zh-Hant': '{metric} 位於{scope}的前 {pct}%。' },
  'cell.improve.lowest': { en: '{metric} ranked lowest among {n} {scope}.', ko: '{metric}이(가) {scope} {n}개 중 최저였습니다.', 'zh-Hant': '{metric} 在 {n} 支{scope}中排名最低。' },
  'cell.improve.bottom': { en: '{metric} was in the bottom {pct}% of {scope}.', ko: '{metric}이(가) {scope} 중 하위 {pct}%였습니다.', 'zh-Hant': '{metric} 位於{scope}的後 {pct}%。' },
  'cell.improve.overspend': { en: 'Spent {pct}% more than planned for this campaign.', ko: '이 캠페인의 계획보다 {pct}% 더 지출했습니다.', 'zh-Hant': '此廣告花費超出計畫 {pct}%。' },
  'cell.scope.phase': { en: 'comparable {platform} {phase} campaigns', ko: '비교 가능한 {platform} {phase} 캠페인', 'zh-Hant': '可比的 {platform} {phase} 廣告' },
  'cell.scope.goal': { en: 'comparable {platform} {goal} campaigns', ko: '비교 가능한 {platform} {goal} 캠페인', 'zh-Hant': '可比的 {platform} {goal} 廣告' },
  'cell.why.reachNotAction': { en: 'Reach was efficient while clicks lagged; the data does not show why.', ko: '도달은 효율적이었지만 클릭은 뒤처졌습니다. 데이터로는 이유를 알 수 없습니다.', 'zh-Hant': '觸及有效率但點擊落後；資料無法說明原因。' },
  'cell.why.actionNotReach': { en: 'Reach cost more, but those reached clicked at a stronger rate; the data does not show why.', ko: '도달 비용은 높았지만 도달한 사람은 더 잘 클릭했습니다. 데이터로는 이유를 알 수 없습니다.', 'zh-Hant': '觸及成本較高，但觸及者點擊率較強；資料無法說明原因。' },
  'cell.why.hookNotHold': { en: 'Early attention was strong but viewers dropped off; the data does not show why.', ko: '초반 주목은 강했지만 시청자가 이탈했습니다. 데이터로는 이유를 알 수 없습니다.', 'zh-Hant': '前段注意力強但觀眾流失；資料無法說明原因。' },
  'cell.why.holdNotHook': { en: 'Fewer viewers stayed past the opening, but those who did watched through; the data does not show why.', ko: '초반을 넘긴 시청자는 적었지만 남은 사람은 끝까지 봤습니다. 데이터로는 이유를 알 수 없습니다.', 'zh-Hant': '越過開頭的觀眾較少，但留下的人看完了；資料無法說明原因。' },
  'cell.why.allStrong': { en: 'Ahead on every comparable metric; the data does not show which factor drove it.', ko: '비교 가능한 모든 지표에서 앞섰습니다. 어떤 요인 때문인지는 데이터로 알 수 없습니다.', 'zh-Hant': '所有可比指標皆領先；資料無法說明主因。' },
  'cell.why.allWeak': { en: 'Behind on every comparable metric; the data does not show which factor drove it.', ko: '비교 가능한 모든 지표에서 뒤처졌습니다. 어떤 요인 때문인지는 데이터로 알 수 없습니다.', 'zh-Hant': '所有可比指標皆落後；資料無法說明主因。' },
  'cell.why.unknown': { en: 'Not enough evidence to determine why.', ko: '이유를 판단할 근거가 부족합니다.', 'zh-Hant': '證據不足以判斷原因。' },
  'cell.next.keepAndTest': { en: 'Test another version that keeps the {keep} result and compare {test}.', ko: '{keep} 결과를 유지한 다른 버전을 시험하고 {test}을(를) 비교합니다.', 'zh-Hant': '測試保留{keep}成果的另一版本，並比較{test}。' },
  'cell.next.keepAndBudget': { en: 'Repeat the format within budget, planning for the {pct}% overspend.', ko: '{pct}% 초과 지출을 감안해 예산 안에서 같은 형식을 반복합니다.', 'zh-Hant': '在預算內重複此形式，並將 {pct}% 超支納入規劃。' },
  'cell.next.repeat': { en: 'Repeat the campaign format and confirm whether {metric} holds.', ko: '같은 캠페인 형식을 반복하고 {metric}이(가) 유지되는지 확인합니다.', 'zh-Hant': '重複此廣告形式，並確認 {metric} 是否維持。' },
  'cell.next.improve': { en: 'Investigate {aspect} first; use this {metric} as the baseline to beat.', ko: '{aspect}부터 살피고, 이번 {metric}을(를) 넘어야 할 기준으로 삼습니다.', 'zh-Hant': '先檢視{aspect}；以此次 {metric} 作為要超越的基準。' },
  'cell.next.budget': { en: 'Recheck budget pacing; this run went {pct}% over plan.', ko: '예산 속도를 다시 점검합니다. 이번 집행은 계획보다 {pct}% 넘었습니다.', 'zh-Hant': '重新檢查預算速度；本次超出計畫 {pct}%。' },
  'cell.next.collect': { en: 'Collect more performance data before drawing conclusions.', ko: '결론을 내기 전에 성과 데이터를 더 모읍니다.', 'zh-Hant': '在下結論前先蒐集更多成效資料。' },
  'cell.none': { en: 'No clear signal among comparable campaigns.', ko: '비교 캠페인 사이에서 뚜렷한 신호가 없습니다.', 'zh-Hant': '在可比廣告中沒有明顯訊號。' },
  'insight.writtenHint': { en: 'Written by a person in Edit.', ko: 'Edit에서 사람이 쓴 글입니다.', 'zh-Hant': '由人員在編輯中撰寫。' },
  'aspectShort.reach': { en: 'reach', ko: '도달', 'zh-Hant': '觸及' },
  'aspectShort.click': { en: 'click rate', ko: '클릭', 'zh-Hant': '點擊' },
  'aspectShort.result': { en: 'results', ko: '결과', 'zh-Hant': '成果' },
  'aspectShort.hook': { en: 'hook', ko: 'Hook', 'zh-Hant': 'Hook' },
  'aspectShort.hold': { en: 'hold', ko: 'Hold', 'zh-Hant': 'Hold' },
  'aspectShort.engagement': { en: 'engagement', ko: '참여', 'zh-Hant': '互動' },
  // 이벤트 단위 패턴(Learnings 자동 생성) — 여러 캠페인이 같은 방향일 때만
  'pattern.auto': { en: 'Patterns from this event\'s data', ko: '이번 이벤트 데이터에서 본 패턴', 'zh-Hant': '本次活動資料中的模式' },
  'pattern.autoHint': { en: 'Only patterns supported by more than one campaign are listed. Nothing here infers creative or messaging strategy from campaign names.', ko: '캠페인 여러 개가 뒷받침하는 패턴만 적습니다. 캠페인 이름에서 소재나 메시지 전략을 추정하지 않습니다.', 'zh-Hant': '僅列出多支廣告共同支持的模式。不會從廣告名稱推測素材或訊息策略。' },
  'pattern.empty': { en: 'No repeated pattern across campaigns yet — the campaign-level notes above stand on their own.', ko: '아직 캠페인들에 걸쳐 반복되는 패턴이 없습니다 — 위의 캠페인별 해석이 전부입니다.', 'zh-Hant': '尚無跨廣告的重複模式——以上各廣告的解讀即為全部。' },
  'pattern.consistentStrong.title': { en: '{aspect} was consistently strong', ko: '{aspect}이(가) 일관되게 강했습니다', 'zh-Hant': '{aspect}持續強勁' },
  'pattern.consistentStrong.body': { en: '{count} of {total} campaigns with a benchmark ranked in the top band on {metric} among comparable campaigns.', ko: '벤치마크가 있는 캠페인 {total}개 중 {count}개가 비교군 대비 {metric} 상위 구간이었습니다.', 'zh-Hant': '在 {total} 支有基準的廣告中，{count} 支的 {metric} 位於可比廣告的前段。' },
  'pattern.consistentWeak.title': { en: '{aspect} was consistently weak', ko: '{aspect}이(가) 일관되게 약했습니다', 'zh-Hant': '{aspect}持續偏弱' },
  'pattern.consistentWeak.body': { en: '{count} of {total} campaigns with a benchmark ranked in the bottom band on {metric} among comparable campaigns.', ko: '벤치마크가 있는 캠페인 {total}개 중 {count}개가 비교군 대비 {metric} 하위 구간이었습니다.', 'zh-Hant': '在 {total} 支有基準的廣告中，{count} 支的 {metric} 位於可比廣告的後段。' },
  'pattern.phaseClicks.title': { en: '{bestPhase} campaigns generated stronger click efficiency than {worstPhase} campaigns in this event', ko: '이번 이벤트에서 {bestPhase} 캠페인이 {worstPhase}보다 클릭 효율이 높았습니다', 'zh-Hant': '本次活動中，{bestPhase} 廣告的點擊效率高於 {worstPhase}' },
  'pattern.phaseClicks.body': { en: 'CTR was at least 1.5× higher for {bestPhase} than for {worstPhase} on {platforms}. This describes the measured pattern; it does not say which message or creative drove it.', ko: '{platforms}에서 {bestPhase}의 CTR이 {worstPhase}의 1.5배 이상이었습니다. 측정된 패턴만 말하는 것이며 어떤 메시지나 소재 때문인지는 알 수 없습니다.', 'zh-Hant': '在 {platforms} 上，{bestPhase} 的 CTR 至少是 {worstPhase} 的 1.5 倍。這只描述測得的模式，未說明是哪種訊息或素材所致。' },
  'pattern.platformSplit.title': { en: 'For this event, {reachPlatform} delivered cheaper reach while {clickPlatform} delivered stronger click efficiency', ko: '이번 이벤트에서는 {reachPlatform}의 도달이 더 저렴했고 {clickPlatform}의 클릭 효율이 더 높았습니다', 'zh-Hant': '本次活動中，{reachPlatform} 的觸及較便宜，而 {clickPlatform} 的點擊效率較高' },
  'pattern.platformSplit.body': { en: 'Event-level CPM and CTR, aggregated per platform, differed by at least 15%. This is one event\'s result, not a rule about the platforms.', ko: '플랫폼별로 합산한 이벤트 단위 CPM과 CTR이 15% 이상 차이 났습니다. 이번 이벤트의 결과일 뿐, 플랫폼에 대한 일반 법칙이 아닙니다.', 'zh-Hant': '依平台彙總的活動 CPM 與 CTR 相差至少 15%。這是單一活動的結果，並非平台通則。' },
  'pattern.platformBoth.title': { en: 'For this event, {platform} led on both reach cost and click efficiency', ko: '이번 이벤트에서는 {platform}이(가) 도달 비용과 클릭 효율 모두 앞섰습니다', 'zh-Hant': '本次活動中，{platform} 在觸及成本與點擊效率上皆領先' },
  'pattern.platformBoth.body': { en: 'Event-level CPM was lower and CTR higher than on {other} by at least 15% each. This is one event\'s result, not a rule about the platforms.', ko: '이벤트 단위 CPM은 {other}보다 낮고 CTR은 높았으며 각각 15% 이상 차이입니다. 이번 이벤트의 결과일 뿐, 플랫폼에 대한 일반 법칙이 아닙니다.', 'zh-Hant': '活動層級 CPM 低於 {other}、CTR 高於 {other}，各相差至少 15%。這是單一活動的結果，並非平台通則。' },
  'pattern.next.shiftToPhase': { en: 'In similar future events, use the higher CTR observed in the {phase} phase here as a starting point for phase budget allocation, then validate whether the difference holds as campaigns run.', ko: '비슷한 다음 이벤트에서는 이번 {phase} 단계의 더 높은 CTR을 단계별 예산 배분의 출발점으로 삼고, 캠페인이 진행되는 동안 그 차이가 유지되는지 확인하세요.', 'zh-Hant': '在類似的未來活動中，以本次 {phase} 階段較高的 CTR 作為階段預算分配的起點，並在投放期間驗證差異是否持續。' },
  'pattern.next.splitByPlatform': { en: 'For similar future events, use the CPM and CTR differences observed in this event ({reachPlatform} lower CPM, {clickPlatform} higher CTR) as a starting point for budget allocation, then validate performance as campaigns run.', ko: '비슷한 다음 이벤트에서는 이번 이벤트에서 관측된 CPM·CTR 차이({reachPlatform} CPM 낮음, {clickPlatform} CTR 높음)를 예산 배분의 출발점으로 삼고, 캠페인이 진행되는 동안 성과를 확인하세요.', 'zh-Hant': '在類似的未來活動中，以本次觀測到的 CPM 與 CTR 差異（{reachPlatform} CPM 較低、{clickPlatform} CTR 較高）作為預算分配的起點，並在投放期間驗證成效。' },
  'pattern.next.leanOnPlatform': { en: 'For similar future events, use this event\'s result — {platform} led on both CPM and CTR — as a starting point for budget allocation, then validate the split as campaigns run rather than treating it as a fixed rule.', ko: '비슷한 다음 이벤트에서는 이번 결과({platform}가 CPM·CTR 모두 앞섬)를 예산 배분의 출발점으로 삼되, 고정 규칙으로 두지 말고 캠페인이 진행되는 동안 배분을 확인하세요.', 'zh-Hant': '在類似的未來活動中，以本次結果（{platform} 在 CPM 與 CTR 皆領先）作為預算分配的起點，並在投放期間驗證分配，而非視為固定規則。' },
  'learn.hint': { en: 'Patterns are based only on comparable campaign performance — at least two campaigns pointing the same way. Creative or messaging causes are not inferred from campaign names.', ko: '패턴은 비교 가능한 캠페인 성과에서만 나옵니다 — 캠페인 2개 이상이 같은 방향일 때. 캠페인 이름에서 소재·메시지 원인을 추정하지 않습니다.', 'zh-Hant': '模式僅來自可比廣告的成效——至少兩支廣告指向同一方向。不會從廣告名稱推測素材或訊息原因。' },
  'learn.status.strong': { en: 'Strong', ko: '강함', 'zh-Hant': '強' },
  'learn.status.weak': { en: 'Weak', ko: '약함', 'zh-Hant': '弱' },
  'learn.status.mixed': { en: 'Mixed', ko: '엇갈림', 'zh-Hant': '不一' },
  'learn.status.insufficient': { en: 'Insufficient data', ko: '데이터 부족', 'zh-Hant': '資料不足' },
  'learn.aspect.reach': { en: 'Reach efficiency', ko: '도달 효율', 'zh-Hant': '觸及效率' },
  'learn.aspect.click': { en: 'Click efficiency', ko: '클릭 효율', 'zh-Hant': '點擊效率' },
  'learn.aspect.result': { en: 'Result efficiency', ko: '결과 효율', 'zh-Hant': '成果效率' },
  'learn.aspect.hook': { en: 'Early attention', ko: '초반 주목', 'zh-Hant': '前段注意力' },
  'learn.aspect.hold': { en: 'Watch-through', ko: '끝까지 시청', 'zh-Hant': '完整觀看' },
  'learn.aspect.engagement': { en: 'Engagement', ko: '참여', 'zh-Hant': '互動' },
  'play.aspectTitle.reach': { en: 'Reach efficiency', ko: '도달 효율', 'zh-Hant': '觸及效率' },
  'play.aspectTitle.click': { en: 'Click efficiency', ko: '클릭 효율', 'zh-Hant': '點擊效率' },
  'play.aspectTitle.result': { en: 'Result efficiency', ko: '결과 효율', 'zh-Hant': '成果效率' },
  'play.aspectTitle.hook': { en: 'Early attention', ko: '초반 주목', 'zh-Hant': '前段注意力' },
  'play.aspectTitle.hold': { en: 'Watch-through performance', ko: '끝까지 시청 성과', 'zh-Hant': '完整觀看表現' },
  'play.aspectTitle.engagement': { en: 'Engagement performance', ko: '참여 성과', 'zh-Hant': '互動表現' },
  'learn.evidence.top': { en: '{count} of {total} · top {metric} band', ko: '{total}개 중 {count}개 · {metric} 상위', 'zh-Hant': '{total} 支中 {count} 支 · {metric} 前段' },
  'learn.evidence.bottom': { en: '{count} of {total} · bottom {metric} band', ko: '{total}개 중 {count}개 · {metric} 하위', 'zh-Hant': '{total} 支中 {count} 支 · {metric} 後段' },
  'learn.evidence.mixed': { en: '{count} top · {countBottom} bottom of {total} · {metric}', ko: '{total}개 중 상위 {count} · 하위 {countBottom} · {metric}', 'zh-Hant': '{total} 支中前段 {count} · 後段 {countBottom} · {metric}' },
  'learn.phase.title': { en: 'Clicks by phase', ko: '단계별 클릭', 'zh-Hant': '各階段點擊' },
  'learn.phase.evidence': { en: '{bestPhase} ≥ 1.5× CTR of {worstPhase} · {platforms}', ko: '{bestPhase} CTR이 {worstPhase}의 1.5배 이상 · {platforms}', 'zh-Hant': '{bestPhase} CTR ≥ {worstPhase} 的 1.5 倍 · {platforms}' },
  'learn.platform.title': { en: 'Platform split', ko: '플랫폼 차이', 'zh-Hant': '平台差異' },
  'learn.platform.splitEvidence': { en: '{reachPlatform} lower CPM · {clickPlatform} higher CTR', ko: '{reachPlatform} CPM 낮음 · {clickPlatform} CTR 높음', 'zh-Hant': '{reachPlatform} CPM 較低 · {clickPlatform} CTR 較高' },
  'learn.platform.bothEvidence': { en: '{platform} lower CPM and higher CTR than {other}', ko: '{platform}가 {other}보다 CPM 낮고 CTR 높음', 'zh-Hant': '{platform} 的 CPM 較 {other} 低且 CTR 較高' },
  'learn.platform.leads': { en: '{platform} leads', ko: '{platform} 우세', 'zh-Hant': '{platform} 領先' },
  'learn.empty': { en: 'No repeated pattern across campaigns yet.', ko: '아직 캠페인들에 걸쳐 반복되는 패턴이 없습니다.', 'zh-Hant': '尚無跨廣告的重複模式。' },
  'learn.action.title': { en: 'Recommended action', ko: '권장 행동', 'zh-Hant': '建議行動' },
  'learn.action.splitByPlatform': { en: 'Prioritize {reachPlatform} for reach; use {clickPlatform} selectively for clicks.', ko: '도달은 {reachPlatform} 우선, 클릭은 {clickPlatform}을 선택적으로.', 'zh-Hant': '觸及以 {reachPlatform} 為主；點擊視情況使用 {clickPlatform}。' },
  'learn.action.splitByPlatform.why': { en: '{reachPlatform} delivered lower CPM while {clickPlatform} produced stronger CTR in this event.', ko: '이번 이벤트에서 {reachPlatform}는 CPM이 낮았고 {clickPlatform}은 CTR이 높았습니다.', 'zh-Hant': '本次活動中 {reachPlatform} 的 CPM 較低，而 {clickPlatform} 的 CTR 較高。' },
  'learn.action.leanOnPlatform': { en: 'Weight budget toward {platform}; validate as campaigns run.', ko: '{platform}에 예산을 더 두고 집행 중 검증.', 'zh-Hant': '預算偏向 {platform}，並在投放期間驗證。' },
  'learn.action.leanOnPlatform.why': { en: '{platform} led on both CPM and CTR in this event.', ko: '이번 이벤트에서 {platform}가 CPM·CTR 모두 앞섰습니다.', 'zh-Hant': '本次活動中 {platform} 在 CPM 與 CTR 皆領先。' },
  'learn.action.shiftToPhase': { en: 'Weight phase budget toward {phase}; validate as campaigns run.', ko: '단계 예산을 {phase}에 더 두고 집행 중 검증.', 'zh-Hant': '階段預算偏向 {phase}，並在投放期間驗證。' },
  'learn.action.shiftToPhase.why': { en: '{phase} had at least 1.5× the CTR of {worstPhase} in this event.', ko: '이번 이벤트에서 {phase}의 CTR이 {worstPhase}의 1.5배 이상이었습니다.', 'zh-Hant': '本次活動中 {phase} 的 CTR 至少是 {worstPhase} 的 1.5 倍。' },
  'play.status.keep': { en: 'Keep', ko: '유지', 'zh-Hant': '維持' },
  'play.status.useSelectively': { en: 'Use selectively', ko: '선택적으로', 'zh-Hant': '選擇性使用' },
  'play.status.improve': { en: 'Improve', ko: '개선', 'zh-Hant': '改善' },
  'play.status.validate': { en: 'Validate', ko: '검증', 'zh-Hant': '驗證' },
  'play.keep.platformReach': { en: '{platform} for reach', ko: '도달은 {platform}', 'zh-Hant': '觸及用 {platform}' },
  'play.keep.platformReach.why': { en: 'Lower CPM in this event', ko: '이번 이벤트에서 CPM이 더 낮았음', 'zh-Hant': '本次活動 CPM 較低' },
  'play.keep.platformBoth': { en: '{platform} for reach and clicks', ko: '도달과 클릭은 {platform}', 'zh-Hant': '觸及與點擊用 {platform}' },
  'play.keep.platformBoth.why': { en: 'Lower CPM and higher CTR in this event', ko: '이번 이벤트에서 CPM이 낮고 CTR이 높았음', 'zh-Hant': '本次活動 CPM 較低且 CTR 較高' },
  'play.keep.phase': { en: '{phase} phase for clicks', ko: '클릭은 {phase} 단계', 'zh-Hant': '點擊用 {phase} 階段' },
  'play.keep.phase.why': { en: 'At least 1.5× the CTR of {worstPhase} in this event', ko: '이번 이벤트에서 {worstPhase}의 1.5배 이상 CTR', 'zh-Hant': '本次活動 CTR 至少是 {worstPhase} 的 1.5 倍' },
  'play.keep.strong': { en: 'Current approach to {aspectLower}', ko: '지금의 {aspect} 방식', 'zh-Hant': '目前的{aspect}做法' },
  'play.keep.strong.why': { en: '{metric} was in the top band in {count} of {total} campaigns', ko: '캠페인 {total}개 중 {count}개에서 {metric} 상위', 'zh-Hant': '{total} 支中 {count} 支 {metric} 位於前段' },
  'play.use.platformClicks': { en: '{platform} for click-focused campaigns', ko: '클릭이 목적인 캠페인은 {platform}', 'zh-Hant': '以點擊為目標的廣告用 {platform}' },
  'play.use.platformClicks.why': { en: 'Stronger CTR in this event', ko: '이번 이벤트에서 CTR이 더 높았음', 'zh-Hant': '本次活動 CTR 較高' },
  'play.use.platformOther': { en: '{platform} as a secondary channel', ko: '{platform}은 보조 채널로', 'zh-Hant': '{platform} 作為次要管道' },
  'play.use.platformOther.why': { en: 'Higher CPM and lower CTR in this event', ko: '이번 이벤트에서 CPM이 높고 CTR이 낮았음', 'zh-Hant': '本次活動 CPM 較高且 CTR 較低' },
  'play.use.phase': { en: '{phase} phase where clicks matter', ko: '클릭이 중요할 때 {phase} 단계', 'zh-Hant': '重視點擊時用 {phase} 階段' },
  'play.use.phase.why': { en: 'At least 1.5× the CTR of {worstPhase} in this event', ko: '이번 이벤트에서 {worstPhase}의 1.5배 이상 CTR', 'zh-Hant': '本次活動 CTR 至少是 {worstPhase} 的 1.5 倍' },
  'play.improve.weak': { en: '{aspectTitle}', ko: '{aspectTitle}', 'zh-Hant': '{aspectTitle}' },
  'play.improve.weak.why': { en: '{metric} performance was consistently weaker', ko: '{metric} 성과가 일관되게 약했음', 'zh-Hant': '{metric} 表現一貫較弱' },
  'play.validate.mixed': { en: '{aspect} during the campaign', ko: '집행 중 {aspect}', 'zh-Hant': '投放期間的{aspect}' },
  'play.validate.mixed.why': { en: 'Mixed across campaigns ({count} top · {countBottom} bottom)', ko: '캠페인마다 엇갈림(상위 {count} · 하위 {countBottom})', 'zh-Hant': '各廣告不一（前段 {count} · 後段 {countBottom}）' },
  'play.validate.uncovered': { en: '{aspect} during the campaign', ko: '집행 중 {aspect}', 'zh-Hant': '投放期間的{aspect}' },
  'play.validate.uncovered.why': { en: 'Check performance while campaigns are running', ko: '캠페인이 도는 동안 성과를 확인', 'zh-Hant': '在廣告投放期間檢查成效' },
  'play.next.title': { en: 'Next event', ko: '다음 이벤트', 'zh-Hant': '下次活動' },
  'play.next.split': { en: 'Start with {reachPlatform}-heavy reach allocation and use {clickPlatform} selectively where clicks matter.', ko: '{reachPlatform} 중심으로 도달 예산을 배분하고, 클릭이 중요한 곳에만 {clickPlatform}을 선택적으로 쓴다.', 'zh-Hant': '以 {reachPlatform} 為主分配觸及預算，在重視點擊處選擇性使用 {clickPlatform}。' },
  'play.next.lean': { en: 'Start with {platform}-heavy allocation and use {other} selectively.', ko: '{platform} 중심으로 예산을 배분하고 {other}은 선택적으로 쓴다.', 'zh-Hant': '以 {platform} 為主分配預算，選擇性使用 {other}。' },
  'play.next.leanSolo': { en: 'Start with {platform}-heavy allocation.', ko: '{platform} 중심으로 예산을 배분한다.', 'zh-Hant': '以 {platform} 為主分配預算。' },
  'play.next.phase': { en: 'Weight budget toward the {phase} phase where clicks matter.', ko: '클릭이 중요하면 {phase} 단계에 예산을 싣는다.', 'zh-Hant': '重視點擊時，將預算偏向 {phase} 階段。' },
  'play.next.validate': { en: 'Validate CPM, CTR{aspects} as campaigns run before shifting more budget.', ko: '예산을 더 옮기기 전에 집행 중 CPM, CTR{aspects}을 검증한다.', 'zh-Hant': '在移動更多預算前，於投放期間驗證 CPM、CTR{aspects}。' },
  'play.next.and': { en: ', and ', ko: ', ', 'zh-Hant': '及' },
  'play.empty': { en: 'Not enough repeated evidence for a playbook yet.', ko: '아직 플레이북을 낼 만큼 반복된 근거가 없습니다.', 'zh-Hant': '尚無足夠的重複證據可形成行動方案。' },
  'learn.action.empty': { en: 'Not enough evidence for a recommendation yet.', ko: '아직 권장 행동을 낼 근거가 부족합니다.', 'zh-Hant': '證據尚不足以提出建議。' },
  'pattern.next.empty': { en: 'Not enough evidence for a reliable recommendation yet.', ko: '아직 신뢰할 만한 제언을 낼 근거가 부족합니다.', 'zh-Hant': '證據尚不足以提出可靠建議。' },
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
