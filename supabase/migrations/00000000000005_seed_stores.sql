-- 매장 마스터 데이터. 지금까지 src/data/paidAdsMockData.js에만 있어서 DB에는 한 건도
-- 없었고, 그래서 캠페인의 target_store_ids를 채울 수 없었다.
--
-- owner_id는 auth.uid()로 못 채운다 — 마이그레이션은 postgres 역할로 돌아 uid가 null이다.
-- 1인 운영 전제(02-ux-flow.md)에 맞춰 가장 먼저 만들어진 사용자에게 귀속시킨다.
-- 사용자가 아직 없는 새 프로젝트에서는 조인 결과가 비어 아무것도 넣지 않고 넘어간다.
--
-- on conflict do nothing이라 여러 번 돌려도 안전하고, 사용자가 화면에서 고친 이름·상태를
-- 되돌리지 않는다.
insert into stores (id, owner_id, name, short_code, region, status)
select
  v.id,
  owner.id,
  v.name,
  v.short_code,
  v.region::region,
  'active'::store_status
from (
  values
    ('G01', 'Camp Creek',      'BC',  'GA'),
    ('G02', 'Duluth',          'BD',  'GA'),
    ('G03', 'Greenbriar',      'BG',  'GA'),
    ('G04', 'Morrow',          'BJ',  'GA'),
    ('G05', 'Headland',        'BM',  'GA'),
    ('G06', 'Old National',    'BO',  'GA'),
    ('G07', 'Riverdale',       'BR',  'GA'),
    ('G08', 'Douglasville',    'BV',  'GA'),
    ('G09', 'Columbus',        'BMC', 'GA'),
    ('G10', 'Union City',      'BU',  'GA'),
    -- 플로리다 매장은 사내 약어 코드가 없다(schema.js의 shortCode가 optional인 이유).
    ('BF1', 'Orlando',          null, 'FL'),
    ('BF2', 'Miami Garden',     null, 'FL'),
    ('BF3', 'Florida Mall',     null, 'FL'),
    ('BF4', 'Tamarac',          null, 'FL'),
    ('BF5', 'West Palm Beach',  null, 'FL')
) as v(id, name, short_code, region)
cross join (select id from auth.users order by created_at limit 1) as owner
on conflict (id) do nothing;
