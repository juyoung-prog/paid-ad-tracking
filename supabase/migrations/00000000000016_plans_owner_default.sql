-- plans.owner_id에 default auth.uid()를 붙인다.
--
-- 빠뜨린 탓에 계획 저장이 전부 RLS로 막혔다("new row violates row-level security
-- policy for table plans"). 프론트는 owner_id를 보내지 않는다 — 다른 테이블이
-- 전부 이 기본값에 의존하고 있어서(stores/campaigns/ad_accounts), 클라이언트가
-- 소유자를 지정하는 경로를 만들지 않는 게 이 스키마의 규칙이다. 저장할 때
-- 소유자를 클라이언트가 주장하게 두면 정책이 그 값을 다시 검증해야 하고,
-- 검증을 빠뜨리는 순간 남의 행을 만들 수 있게 된다.
alter table plans alter column owner_id set default auth.uid();
