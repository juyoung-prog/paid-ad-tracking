-- 참여 내역에 저장(save)·리포스트(repost)를 더한다 — 인플루언서 시트가 적는 일곱 가지
-- (Like · Comment · Share · Follow · Visit · Save · Repost)를 유료 광고 보고서도 같은 자리에서
-- 답하기 위해서다(2026-09-11). 드로어·Performance·Reports가 같은 컬럼을 읽는다.
--
-- 값이 채워지는 범위는 플랫폼 API가 정한다(05-api-integration.md 매핑 표):
--   saves   — Meta는 actions 중 onsite_conversion.post_save(게시물 저장). TikTok 광고 API는
--             캠페인 레벨 saves/bookmark/total_save를 거부해 null.
--   reposts — 두 광고 API 모두 캠페인 레벨 리포스트 지표가 없어 API 동기화로는 항상 null.
--             컬럼을 두는 이유는 수기 레코드(source='manual')가 적을 자리이고, 화면 세 곳이
--             한 필드 목록을 보게 하기 위해서다. 화면은 null을 '—'로 그린다.
alter table performance_records add column saves bigint;
alter table performance_records add column reposts bigint;

comment on column performance_records.saves is '게시물 저장 수. Meta: actions.onsite_conversion.post_save, TikTok: 캠페인 레벨 미제공(null)';
comment on column performance_records.reposts is '리포스트 수. 두 광고 API 모두 캠페인 레벨 미제공 — 수기 입력 전용';

-- performance_records_latest는 select *를 생성 시점에 고정하므로 컬럼을 더하면 다시 만든다(마이그레이션 7 주석).
drop view if exists performance_records_latest;

create view performance_records_latest with (security_invoker = true) as
  select distinct on (campaign_id) *
  from performance_records
  order by campaign_id, recorded_at desc, (source = 'manual') desc;

comment on view performance_records_latest is
  '캠페인당 최신 성과 1건. 같은 날 api/manual이 겹치면 manual을 우선한다 — 자동 동기화가 사용자가 손으로 넣은 값을 가리지 않게 하기 위함. performance_records에 컬럼을 추가하면 이 뷰를 반드시 다시 만들 것(select *는 생성 시점에 고정된다).';
