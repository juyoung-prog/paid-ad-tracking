-- 일별 성과 테이블 — Reports의 날짜 필터가 실제로 지표를 자를 수 있게 하는 시계열 축.
--
-- 왜 performance_records에 넣지 않나: 그 테이블은 "그 시점까지의 누적값" 스냅샷
-- 모델이고(00000000000002 주석 참고), 프론트의 getReportSummary는 배열의 모든
-- 행을 합산한다 — 일별 행을 같은 곳에 섞으면 누적+일별이 다중 합산되어 조용히
-- 틀린다. 그래서 별도 테이블, 프론트에서도 별도 배열(performanceDaily)로 간다.
--
-- 컬럼은 **가산 가능한 Tier 1만** 둔다: spend / impressions / clicks.
--  - reach는 넣지 않는다 — 일별 reach의 합 ≠ 기간 reach(같은 사람이 여러 날
--    보이면 중복). 저장하는 순간 "기간 reach"라는 거짓 숫자를 만들 수 있게 된다.
--  - Tier 2~4(영상·상호작용·전환)도 넣지 않는다 — 기간 필터의 목적(기간 spend·
--    CPM·CTR)에 불필요하고, 그 지표들의 기간 뷰는 누적 스냅샷이 계속 담당한다.
--
-- source 컬럼이 없다 — 일별은 sync-performance(API) 전용이다. 수동 등록 캠페인은
-- 일별 데이터가 없고, 프론트가 누적 spend로 fallback + 그 사실을 표기한다.
create table performance_daily (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  date date not null,
  spend numeric(12, 2) not null default 0,
  impressions bigint,
  clicks bigint,
  -- sync-performance upsert의 onConflict 대상. 같은 날을 다시 받으면(사후 정정
  -- 반영을 위해 최근 7일을 매일 재수집한다) 덮어쓴다.
  unique (campaign_id, date)
);

comment on table performance_daily is
  '캠페인×날짜 단위 일별 성과(API 전용). 가산 가능한 지표만 저장 — reach는 비가산이라 제외. 누적 스냅샷은 performance_records가 계속 담당한다.';

alter table performance_daily enable row level security;

-- performance_records와 같은 패턴 — owner_id를 저장하지 않고 부모 캠페인을 통해
-- 소유를 파생한다. delete 정책은 일부러 없다(on delete cascade가 담당).
create policy "select own performance_daily" on performance_daily
  for select using (exists (select 1 from campaigns c where c.id = campaign_id and c.owner_id = auth.uid()));
create policy "insert own performance_daily" on performance_daily
  for insert with check (exists (select 1 from campaigns c where c.id = campaign_id and c.owner_id = auth.uid()));
create policy "update own performance_daily" on performance_daily
  for update using (exists (select 1 from campaigns c where c.id = campaign_id and c.owner_id = auth.uid()));

create index performance_daily_campaign_id_idx on performance_daily(campaign_id);

-- sync-performance가 "이미 일별 데이터가 있는 캠페인"을 판정할 때 쓴다.
-- 행 전체를 select해서 세면 PostgREST의 max-rows(기본 1000)에 걸려 조용히
-- 잘린다 — 일별 테이블은 캠페인×날짜라 금방 수천 행이 된다. distinct 캠페인
-- id는 캠페인 수만큼(수백 행)이라 안전하다.
create or replace function public.performance_daily_campaign_ids()
returns setof uuid
language sql
security invoker
set search_path = public
as $$
  select distinct campaign_id from performance_daily;
$$;
