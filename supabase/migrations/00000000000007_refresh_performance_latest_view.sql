-- performance_records_latest 뷰를 새 컬럼까지 포함하도록 다시 만든다.
--
-- 원래 정의가 `select distinct on (campaign_id) *` 였는데, Postgres는 뷰를 만드는
-- 시점에 *를 그때의 컬럼 목록으로 확정해 저장한다. 그래서 마이그레이션 6에서
-- alter table로 지표 8개를 추가했는데도 뷰는 예전 14개 컬럼만 계속 내보냈다.
-- 프론트는 이 뷰를 읽으므로 DB에는 값이 들어와 있는데 화면에는 전부 '—'로 나왔다.
-- 에러가 아니라 조용한 누락이라 화면을 열어보기 전에는 알기 어렵다.
--
-- create or replace view는 컬럼을 뒤에 추가하는 것만 허용하므로(기존 컬럼의 이름·타입·
-- 순서를 바꿀 수 없다) 안전하게 drop 후 다시 만든다. 뷰라서 데이터 손실은 없다.
--
-- 앞으로 performance_records에 컬럼을 추가하면 이 뷰도 같이 다시 만들어야 한다.
drop view if exists performance_records_latest;

create view performance_records_latest with (security_invoker = true) as
  select distinct on (campaign_id) *
  from performance_records
  order by campaign_id, recorded_at desc, (source = 'manual') desc;

comment on view performance_records_latest is
  '캠페인당 최신 성과 1건. 같은 날 api/manual이 겹치면 manual을 우선한다 — 자동 동기화가 사용자가 손으로 넣은 값을 가리지 않게 하기 위함. performance_records에 컬럼을 추가하면 이 뷰를 반드시 다시 만들 것(select *는 생성 시점에 고정된다).';
