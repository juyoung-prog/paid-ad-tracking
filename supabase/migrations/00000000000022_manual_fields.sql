-- 사람이 고친 참여 칸의 표시(2026-09-11). Campaigns 드로어에서 동기화 캠페인의 참여 내역
-- (likes · comments · shares · follows · profile_visits · saves · reposts)을 직접 고칠 수 있는데,
-- 다음 동기화가 API 값으로 덮어쓰면 고친 값이 소리 없이 사라진다. 어느 칸을 사람이 고쳤는지
-- 행에 적어 두고, sync-performance는 그 칸을 건드리지 않고 직전 값을 물려준다.
-- 값은 DB 컬럼 이름(snake_case)이다. 빈 배열 = 전부 API 값.
alter table performance_records add column manual_fields text[] not null default '{}';

comment on column performance_records.manual_fields is '사람이 드로어에서 고친 참여 칸의 컬럼 이름 목록. sync-performance는 이 칸들을 API 값으로 덮지 않고 직전 행의 값을 이월한다';

-- performance_records_latest는 select *를 생성 시점에 고정하므로 컬럼을 더하면 다시 만든다(마이그레이션 7 주석).
drop view if exists performance_records_latest;

create view performance_records_latest with (security_invoker = true) as
  select distinct on (campaign_id) *
  from performance_records
  order by campaign_id, recorded_at desc, (source = 'manual') desc;

comment on view performance_records_latest is
  '캠페인당 최신 성과 1건. 같은 날 api/manual이 겹치면 manual을 우선한다 — 자동 동기화가 사용자가 손으로 넣은 값을 가리지 않게 하기 위함. performance_records에 컬럼을 추가하면 이 뷰를 반드시 다시 만들 것(select *는 생성 시점에 고정된다).';
