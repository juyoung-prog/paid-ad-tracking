-- Paid Ads Tracking Dashboard — 동기화 제약 + 스케줄
--
-- 목적 두 가지.
--   1. Edge Function의 upsert가 실제로 동작하도록 conflict 대상 제약을 만든다.
--      Postgres의 ON CONFLICT는 unique 제약/인덱스가 있는 컬럼 조합만 받는다 —
--      초기 스키마에는 일반 인덱스만 있어서 sync-campaigns / sync-performance의
--      upsert가 런타임에 "there is no unique or exclusion constraint matching
--      the ON CONFLICT specification"으로 실패한다.
--   2. 05-api-integration.md 6단계(동기화 스케줄)의 "자동" 부분을 pg_cron으로 켠다.

-- ============================================================
-- 1. upsert conflict 대상
-- ============================================================

-- sync-campaigns: onConflict 'external_campaign_id'
-- 수동 등록 캠페인은 external_campaign_id가 null인데, Postgres의 unique는 null끼리
-- 충돌시키지 않으므로(기본 NULLS DISTINCT) 수동 캠페인은 몇 개든 공존한다.
alter table campaigns
  add constraint campaigns_external_campaign_id_key unique (external_campaign_id);

-- sync-performance: onConflict 'campaign_id,recorded_at,source'
--
-- source를 키에 포함하는 이유: 같은 날 수동 입력(manual)과 API 수집(api)이 함께
-- 존재할 수 있고, (campaign_id, recorded_at)만으로 잡으면 자동 동기화가 사용자가
-- 직접 넣은 값을 덮어써 버린다. 사용자 입력은 API보다 나중에 정정된 값일 수 있으므로
-- 지우면 안 된다 — 두 행을 남기고 읽는 쪽에서 우선순위를 정한다.
alter table performance_records
  add constraint performance_records_campaign_date_source_key
  unique (campaign_id, recorded_at, source);

-- 읽는 쪽 편의: 캠페인별 최신 스냅샷 1건을 뽑는 뷰.
-- sync-performance는 "그 시점까지의 누적값"을 그날 날짜로 찍는 스냅샷 모델이라
-- 프론트가 필요한 건 보통 캠페인당 최신 1건이다. manual을 api보다 우선한다.
create view performance_records_latest with (security_invoker = true) as
  select distinct on (campaign_id) *
  from performance_records
  order by campaign_id, recorded_at desc, (source = 'manual') desc;

-- ============================================================
-- 2. 자동 동기화 스케줄 (pg_cron + pg_net)
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Edge Function 호출에 필요한 프로젝트 URL과 service_role 키는 마이그레이션에
-- 하드코딩하지 않는다(레포에 커밋되므로). Vault에 넣고 런타임에 읽는다.
-- 프로젝트 생성 후 SQL Editor에서 아래 두 줄을 1회 실행할 것:
--
--   select vault.create_secret('https://{project-ref}.supabase.co', 'project_url');
--   select vault.create_secret('{service_role_key}', 'service_role_key');
--
-- 두 시크릿이 없으면 아래 함수는 조용히 실패하지 않고 예외를 던진다 —
-- cron.job_run_details에 에러가 남아야 "동기화가 안 되고 있다"를 알아챌 수 있다.
create or replace function public.invoke_sync_function(fn_name text)
returns void
language plpgsql
security definer
set search_path = public, extensions, net, vault
as $$
declare
  base_url text;
  service_key text;
begin
  select decrypted_secret into base_url
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key
    from vault.decrypted_secrets where name = 'service_role_key';

  if base_url is null or service_key is null then
    raise exception
      'vault에 project_url / service_role_key 시크릿이 없습니다 — 00000000000002 마이그레이션 주석의 vault.create_secret 두 줄을 실행하세요.';
  end if;

  perform net.http_post(
    url := base_url || '/functions/v1/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

-- security definer 함수라 일반 사용자에게는 실행 권한을 주지 않는다.
-- cron.schedule은 postgres 롤로 돌기 때문에 이 revoke의 영향을 받지 않는다.
revoke execute on function public.invoke_sync_function(text) from public, anon, authenticated;

-- pg_cron의 스케줄 시각은 UTC 기준이다. 매장이 조지아/플로리다(US Eastern)이므로
-- 09:00 UTC ≈ 04:00~05:00 ET — 전날 지표가 플랫폼에서 확정된 뒤, 사용자가 대시보드를
-- 열기 전에 끝나 있는 시간대다.
select cron.schedule(
  'sync-campaigns-daily',
  '0 9 * * *',
  $$select public.invoke_sync_function('sync-campaigns')$$
);

-- 캠페인 목록이 먼저 들어와야 성과를 붙일 대상이 생기므로 30분 뒤에 실행한다.
select cron.schedule(
  'sync-performance-daily',
  '30 9 * * *',
  $$select public.invoke_sync_function('sync-performance')$$
);
