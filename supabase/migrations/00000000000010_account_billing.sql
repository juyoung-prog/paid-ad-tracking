-- 광고 계정의 청구 상태. 지금까지 이 앱의 모든 알림은 캠페인 단위였는데,
-- "인보이스가 곧 나온다 / 선불 잔액이 떨어진다"는 **계정**에 붙는 개념이라
-- 캠페인 지출을 아무리 더해도 나오지 않는다:
--
--  * Meta는 문턱(billing threshold)에 도달할 때마다 청구하고 누적을 0으로
--    되돌린다. 우리는 그 리셋 시점을 볼 수 없어서 "이번 청구 이후 얼마"를
--    계산할 방법이 없다. 대신 Graph API의 act_{id}.balance가 바로 그
--    "미납액"이라 읽어오기만 하면 된다(실측: $0.00 / $85.81 / $387.52).
--  * TikTok은 선불 잔액이라 balance 하나면 끝인데, /advertiser/info/가
--    별도 권한(Ad Account Information)을 요구해 아직 못 읽는다. 컬럼은 지금
--    만들어 두고 권한이 열리면 같은 자리에 채운다.
--
-- 금액은 화폐 최소 단위가 아니라 사람이 읽는 단위(USD)로 저장한다 —
-- 플랫폼마다 단위가 달라서(Meta는 센트) 경계에서 한 번만 변환하고 안쪽은
-- 한 가지 단위로만 다룬다.
alter table ad_accounts
  add column balance_due numeric(12, 2),          -- Meta: 미납액. TikTok: 사용하지 않음
  add column balance_available numeric(12, 2),    -- TikTok: 남은 선불 잔액. Meta: 사용하지 않음
  add column balance_synced_at timestamptz,
  -- Meta 청구 문턱. 플랫폼이 API로 알려주지 않아 사람이 지정한다(계정마다 다를
  -- 수 있다). null이면 문턱 기반 알림을 하지 않는다 — 모르는 값을 기본값으로
  -- 지어내면 "곧 청구됩니다"가 근거 없는 경고가 된다.
  add column invoice_threshold numeric(12, 2);

comment on column ad_accounts.balance_due is 'Meta 미납액(다음 인보이스에 청구될 금액). act_{id}.balance를 USD로 변환해 저장';
comment on column ad_accounts.balance_available is 'TikTok 선불 잔액 중 남은 금액';
comment on column ad_accounts.invoice_threshold is 'Meta 청구 문턱. 사람이 입력한다(API 미제공). null이면 문턱 알림 없음';
