-- 동기화 실행 기록 + 실패 시 자동 재시도.
--
-- 왜 필요한가: cron은 하루 1회라 한 번 실패하면 그날 데이터가 통째로 비는데,
-- 지금은 실패해도 아무 흔적이 남지 않는다. 실제로 엣지 게이트웨이가 산발적으로
-- "JWT issued at future"(500)를 돌려주는 것을 세 번 관측했다 — 같은 키로 바로
-- 다시 부르면 성공한다. 이런 일시 실패를 사람이 눈치채기 전에 스스로 복구해야 한다.
--
-- 왜 호출 지점에서 재시도하지 않는가: pg_net의 http_post는 요청을 큐에 넣고 즉시
-- 반환한다(비동기). 호출한 트랜잭션은 응답을 볼 수 없다. 그래서 요청 id를 남겨두고,
-- 별도 잡이 나중에 net._http_response를 확인해 실패면 다시 부른다.

create table sync_runs (
  id bigserial primary key,
  fn_name text not null,
  request_id bigint,                  -- net.http_post가 돌려주는 요청 id
  attempt int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  status_code int,
  response text,
  started_at timestamptz not null default now(),
  checked_at timestamptz
);

create index sync_runs_pending_idx on sync_runs (status, started_at) where status = 'pending';

alter table sync_runs enable row level security;

-- 토큰 같은 비밀값이 들어가지 않는 실행 기록이라 로그인 사용자에게 읽기를 연다
-- (설정 화면이 "마지막 동기화가 언제 성공했는지"를 보여줄 수 있게). 쓰기는 서버 전용.
create policy "select sync_runs" on sync_runs for select to authenticated using (true);

-- ============================================================

/** 최대 재시도 횟수. 일시 오류는 대개 한 번만 다시 불러도 지나간다. */
create or replace function public.sync_max_attempts()
returns int language sql immutable as $$ select 3 $$;

-- 기존 invoke_sync_function을 대체한다. 요청 id를 sync_runs에 남기는 것이 추가됐다.
create or replace function public.invoke_sync_function(fn_name text, attempt int default 1)
returns bigint
language plpgsql
security definer
set search_path = public, extensions, net, vault
as $$
declare
  base_url text;
  service_key text;
  req_id bigint;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'service_role_key';
  if base_url is null or service_key is null then
    raise exception 'vault에 project_url / service_role_key 시크릿이 없습니다 — supabase-integration 문서의 6단계 참조';
  end if;

  select net.http_post(
    url := base_url || '/functions/v1/' || fn_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || service_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) into req_id;

  insert into sync_runs (fn_name, request_id, attempt) values (fn_name, req_id, attempt);
  return req_id;
end;
$$;

revoke execute on function public.invoke_sync_function(text, int) from public, anon, authenticated;

-- ============================================================

/**
 * 아직 결과를 안 본 실행들의 응답을 확인하고, 실패면 다시 부른다.
 * pg_cron이 주기적으로 호출한다.
 *
 * net._http_response는 pg_net이 일정 시간 뒤 지우므로, 응답 행을 못 찾은 채
 * 오래된 pending은 실패로 확정한다(영원히 pending으로 남지 않게).
 */
create or replace function public.check_sync_runs()
returns void
language plpgsql
security definer
set search_path = public, extensions, net, vault
as $$
declare
  run record;
  resp record;
begin
  for run in
    select * from sync_runs
    where status = 'pending'
      and started_at < now() - interval '1 minute'  -- 아직 응답이 안 왔을 수 있으니 잠시 기다린다
    order by id
  loop
    select status_code, content into resp
    from net._http_response where id = run.request_id;

    if not found then
      -- 응답이 아직 없다. pg_net이 응답을 지울 만큼 오래된 건이면 실패로 본다.
      if run.started_at < now() - interval '30 minutes' then
        update sync_runs
        set status = 'failed', response = '응답을 확인하지 못했습니다(시간 초과)', checked_at = now()
        where id = run.id;
      else
        continue;
      end if;
    elsif resp.status_code between 200 and 299 then
      update sync_runs
      set status = 'success', status_code = resp.status_code, response = left(resp.content, 2000), checked_at = now()
      where id = run.id;
      continue;
    else
      update sync_runs
      set status = 'failed', status_code = resp.status_code, response = left(resp.content, 2000), checked_at = now()
      where id = run.id;
    end if;

    -- 여기까지 왔으면 실패다. 남은 횟수가 있으면 다시 부른다.
    if run.attempt < public.sync_max_attempts() then
      raise notice 'sync 재시도: % (attempt %)', run.fn_name, run.attempt + 1;
      perform public.invoke_sync_function(run.fn_name, run.attempt + 1);
    else
      raise warning 'sync 최종 실패: % (attempt %)', run.fn_name, run.attempt;
    end if;
  end loop;
end;
$$;

revoke execute on function public.check_sync_runs() from public, anon, authenticated;

-- ============================================================

-- 5분마다 결과를 확인한다. 일 1회 동기화에서 최대 3번까지 시도하므로
-- 늦어도 15분 안에는 성공하거나 실패로 확정된다.
select cron.schedule('check-sync-runs', '*/5 * * * *', $$select public.check_sync_runs()$$);

-- 기존 두 잡은 인자 하나짜리 시그니처를 부르고 있었다. attempt 기본값이 있어
-- 그대로 동작하지만, 명시적으로 다시 등록해 의도를 분명히 한다.
select cron.schedule('sync-campaigns-daily', '0 9 * * *', $$select public.invoke_sync_function('sync-campaigns', 1)$$);
select cron.schedule('sync-performance-daily', '30 9 * * *', $$select public.invoke_sync_function('sync-performance', 1)$$);

comment on table sync_runs is '동기화 실행 기록. check_sync_runs()가 결과를 채우고 실패 시 재시도한다. 화면에서 마지막 성공 시각을 보여주는 데 쓴다.';
