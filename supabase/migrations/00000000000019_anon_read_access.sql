-- ============================================================
-- anon 읽기 정책 — 로그인 게이트를 당분간 끄기로 하면서(App.jsx, 2026-08-20)
-- 링크만으로 대시보드가 데이터를 읽을 수 있어야 한다.
--
-- 읽기(select)만 연다. insert/update/delete는 기존 owner 정책 그대로라
-- 로그인 없이는 여전히 막힌다 — 공개 링크 + 번들에 든 anon key 조합으로
-- 아무나 데이터를 고치는 일은 없어야 하기 때문.
-- 로그인 게이트를 되살리면 이 정책들을 drop해서 원상 복구한다.
-- ============================================================

create policy "anon read stores" on stores
  for select to anon using (true);

create policy "anon read ad_accounts" on ad_accounts
  for select to anon using (true);

create policy "anon read campaigns" on campaigns
  for select to anon using (true);

create policy "anon read performance_records" on performance_records
  for select to anon using (true);

create policy "anon read performance_daily" on performance_daily
  for select to anon using (true);

create policy "anon read plans" on plans
  for select to anon using (true);

create policy "anon read plan_items" on plan_items
  for select to anon using (true);

create policy "anon read sync_runs" on sync_runs
  for select to anon using (true);
