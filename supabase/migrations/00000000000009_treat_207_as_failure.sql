-- 207(부분 실패)을 성공으로 기록하던 문제.
--
-- sync-campaigns/sync-performance는 플랫폼 조회가 하나라도 실패하면 207을 돌려주도록
-- 바꿨는데, check_sync_runs()의 판정이 `status_code between 200 and 299`라서 207이
-- 성공으로 들어갔다. 그러면 재시도도 안 되고 설정 화면의 실패 경고도 안 뜬다 —
-- 조용한 실패를 잡으려고 만든 장치가 정작 조용한 실패를 통과시키고 있었다.
--
-- 예: Meta 토큰이 만료되면 함수는 207 + errors:["Meta insights 조회 실패 — ..."]를
-- 돌려주는데, 이대로면 sync_runs에 success로 남아 아무도 모른다.
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
    -- 207은 2xx지만 부분 실패다. 성공으로 세면 안 된다.
    elsif resp.status_code between 200 and 299 and resp.status_code <> 207 then
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
