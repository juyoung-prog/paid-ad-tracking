-- 확인 전용, 데이터 변경 없음.
-- 잔액 동기화가 값을 실제로 채웠는지 눈으로 보려고 한 번 돌린 진단이다
-- (이 환경에선 psql·PostgREST 조회 경로가 둘 다 막혀 있어 마이그레이션의
-- NOTICE가 유일한 통로였다). 원격에 이미 적용됐으므로 파일을 지우면 로컬과
-- 히스토리가 어긋난다 — 재실행해도 안전한 읽기 전용이라 그대로 남긴다.
do $$
declare r record;
begin
  for r in select id, platform, balance_due, invoice_threshold, balance_synced_at
           from ad_accounts order by platform, id loop
    raise notice 'ACCT % (%) due=% threshold=% synced=%',
      r.id, r.platform, r.balance_due, r.invoice_threshold, r.balance_synced_at;
  end loop;
end $$;
