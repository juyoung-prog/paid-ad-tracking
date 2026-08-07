-- 이벤트 계획. **캠페인과 섞지 않는다** — 이게 이 테이블의 존재 이유이자 제약이다.
--
-- 한때 앱에서 캠페인을 직접 만들 수 있었는데, 그렇게 만든 캠페인은
-- external_campaign_id가 없어 성과 동기화가 영원히 안 붙었고(sync-performance가
-- `.not('external_campaign_id','is',null)`로 거른다) 나중에 진짜 캠페인이
-- 동기화되면 중복이 됐다. "캠페인처럼 생겼는데 데이터가 안 붙는 객체"는 없는
-- 것보다 나쁘다는 판단으로 생성 기능을 걷어냈다.
--
-- 계획은 그 문제를 피하는 형태여야 한다: 집행 전에 세우는 별개의 문서이고,
-- 캠페인 목록에 절대 나타나지 않으며, 실제 집행과는 **이름으로 대조**만 한다.
-- 대조 키는 plans.name = campaigns.campaign_group — 앱 전체가 이미 쓰는 묶음
-- 키라 새 매칭 규칙을 만들지 않는다.
create table plans (
  id uuid primary key default gen_random_uuid(),
  -- default auth.uid() — 다른 테이블과 같은 규칙이다. 클라이언트가 소유자를
  -- 주장하는 경로를 만들지 않는다(00000000000016에서 뒤늦게 붙였고, 새로 세팅할
  -- 때 같은 실수가 반복되지 않도록 여기에도 적어둔다).
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  -- 이벤트 이름. campaigns.campaign_group과 같은 값을 쓴다(대조 키).
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- 계획의 한 줄 = "어느 단계를, 어느 플랫폼에서, 언제, 하루 얼마로".
--
-- 총액을 따로 저장하지 않는다 — 일일 예산 × 기간으로 언제나 구할 수 있고,
-- 두 값을 다 저장하면 서로 어긋났을 때 어느 쪽이 맞는지 알 수 없다
-- (같은 이유로 성과 쪽도 ctr/cpm 같은 파생값을 저장하지 않는다).
create table plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  -- 단계 이름(예: "Coming Soon"). 실제 캠페인 이름과 같을 필요는 없다 —
  -- 대조는 이벤트 단위로 하고, 이 라벨은 사람이 계획을 읽기 위한 것이다.
  label text not null,
  platform platform not null,
  start_date date not null,
  end_date date not null,
  budget_daily numeric(12, 2) not null check (budget_daily > 0),
  sort_order int not null default 0,
  constraint plan_items_dates_valid check (end_date >= start_date)
);

alter table plans enable row level security;
alter table plan_items enable row level security;

create policy "select own plans" on plans for select using (owner_id = auth.uid());
create policy "insert own plans" on plans for insert with check (owner_id = auth.uid());
create policy "update own plans" on plans for update using (owner_id = auth.uid());
create policy "delete own plans" on plans for delete using (owner_id = auth.uid());

-- plan_items는 부모 plan의 소유자를 따른다(performance_records가 campaigns를
-- 따르는 것과 동일한 패턴).
create policy "select own plan_items" on plan_items for select
  using (exists (select 1 from plans p where p.id = plan_id and p.owner_id = auth.uid()));
create policy "insert own plan_items" on plan_items for insert
  with check (exists (select 1 from plans p where p.id = plan_id and p.owner_id = auth.uid()));
create policy "update own plan_items" on plan_items for update
  using (exists (select 1 from plans p where p.id = plan_id and p.owner_id = auth.uid()));
create policy "delete own plan_items" on plan_items for delete
  using (exists (select 1 from plans p where p.id = plan_id and p.owner_id = auth.uid()));

create index plan_items_plan_id_idx on plan_items(plan_id);
