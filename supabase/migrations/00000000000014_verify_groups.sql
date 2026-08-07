-- 확인 전용, 데이터 변경 없음. 그룹 규칙 수정 후 Event 옵션이 몇 개인지 집계한다.
-- 원격에 이미 적용됐고 재실행해도 안전한 읽기 전용이라 파일을 남긴다
-- (지우면 로컬/원격 마이그레이션 히스토리가 어긋난다).
do $$
declare v_opts int; v_posts int;
begin
  select count(*) into v_opts from (
    select coalesce(campaign_group, name) g, count(*) c from campaigns group by 1
  ) t where t.c > 1 or exists (select 1 from campaigns x where x.campaign_group = t.g);
  select count(*) into v_posts from campaigns
   where campaign_group is not null and campaign_group ~* '^(instagram )?post';
  raise notice 'AFTER opts=% postGroups=%', v_opts, v_posts;
end $$;
