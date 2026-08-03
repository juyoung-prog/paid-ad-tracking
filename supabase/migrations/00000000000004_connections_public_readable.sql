-- 프론트(/settings)가 "연결됨/안 됨"을 표시할 수 있게 connections_public을 읽히게 만든다.
--
-- 기존 정의는 security_invoker = true였는데, connections 테이블은 RLS가 켜져 있고
-- 정책이 하나도 없다(서버 전용 테이블). invoker 권한으로 읽으면 authenticated 롤은
-- 정책에 걸려 항상 0건을 받는다 — 연결이 실제로 있어도 화면엔 "연결 안 됨"으로 보인다.
--
-- security_invoker = false(정의자 권한)로 바꾸고, 대신 뷰 안에서 owner_id를 직접
-- 걸러 남의 행이 새지 않게 한다. access_token/refresh_token은 여전히 select 목록에
-- 없으므로 프론트로 나가지 않는다.
create or replace view connections_public with (security_invoker = false) as
  select id, owner_id, platform, account_id, expires_at, connected_at
  from connections
  where owner_id = auth.uid();

-- 로그인한 사용자에게만 준다. anon에는 주지 않는다 —
-- auth.uid()가 null이라 어차피 0건이지만, 권한 자체를 열어둘 이유가 없다.
revoke all on connections_public from anon;
grant select on connections_public to authenticated;
