-- 프론트엔드 데이터 모델(src/data/schema.js)과 DB 스키마의 어긋남을 맞춘다.
--
-- 초기 스키마를 만든 뒤 프론트가 독립적으로 발전하면서 세 필드가 DB에 없는 채로 남았다.
-- 이 상태로 Supabase에 붙이면 저장은 성공한 것처럼 보이는데 해당 값만 조용히 사라진다 —
-- 화면에서는 입력했던 값이 새로고침 후 비어 있는 형태로 나타난다.
--
-- 사용 현황(연동 시점 기준): campaignGroup 54곳, budgetDaily 35곳, shortCode 14곳.

-- 매장 약어 코드. 조지아 매장에만 있고 플로리다·신규 매장엔 없을 수 있어 nullable.
alter table stores add column short_code text;

-- 여러 캠페인을 하나의 마케팅 이니셔티브로 묶는 태그(예: "BF4 Grand Opening").
-- null이면 campaignGroupKey()가 name을 그대로 그룹 키로 쓴다.
alter table campaigns add column campaign_group text;

-- 일일 예산. 있으면 calcBudgetPacing()의 신호가 "경과일 비율" 대신
-- "일평균 소진액 vs 이 값"으로 바뀌므로 없으면 페이싱 판정이 달라진다.
alter table campaigns add column budget_daily numeric(12, 2);

-- 참고: campaigns.event_tag / campaigns.tags / performance_records.result_url /
-- performance_records.reported_at은 반대로 DB에만 있고 프론트가 쓰지 않는다.
-- 지우지 않고 둔다 — 나중에 쓸 수 있고, 컬럼 삭제는 되돌릴 수 없다.
