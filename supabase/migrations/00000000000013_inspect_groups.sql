-- 확인 전용, 데이터 변경 없음. Event 드롭다운이 무엇으로 채워지는지 집계한다
-- (이 환경에선 psql·PostgREST 조회가 막혀 있어 마이그레이션 NOTICE가 유일한 통로).
-- 재실행해도 안전한 읽기 전용이라 히스토리에 남겨 둔다.
do $$
declare total int; posts int; singles int; real_groups int;
begin
  select count(distinct coalesce(campaign_group, name)) into total from campaigns;
  select count(*) into posts from (
    select distinct coalesce(campaign_group, name) g from campaigns
  ) t where g ~* '^(instagram )?post';
  select count(*) into singles from (
    select coalesce(campaign_group, name) g, count(*) c from campaigns group by 1
  ) t where c = 1;
  select count(*) into real_groups from (
    select coalesce(campaign_group, name) g, count(*) c from campaigns group by 1
  ) t where c > 1;
  raise notice 'EVENT_OPTIONS total=% posts=% singles=% grouped=%', total, posts, singles, real_groups;
end $$;
