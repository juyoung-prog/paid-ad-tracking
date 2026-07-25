-- Paid Ads Tracking Dashboard — Initial Schema
-- 02-ux-flow.md 데이터 모델을 그대로 반영. kmtmuwyzumjpkfbtqpbz(paid ad dashboard) 프로젝트에
-- mcp__supabase__apply_migration으로 적용 완료. 단일 사용자 기준(auth.uid() 소유)으로 가정했다 —
-- 02-ux-flow.md "대상 사용자: 1인 운영, 향후 팀원 합류 예정"에 따라 team 확장 시 별도
-- 마이그레이션으로 owner_id를 team_id로 승격하는 걸 전제로 한다.

-- ============================================================
-- Enums
-- ============================================================
create type platform as enum ('meta', 'tiktok');
create type region as enum ('GA', 'FL', 'ALL');
create type store_status as enum ('active', 'planned', 'closed');
create type target_scope as enum ('single_store', 'multi_store', 'all_stores');
create type campaign_goal as enum ('awareness', 'traffic', 'engagement', 'conversion', 'store_visit');
create type manual_status as enum ('ended_early', 'archived');
create type performance_source as enum ('manual', 'api');

-- ============================================================
-- Store
-- ============================================================
create table stores (
  id text primary key, -- 매장 코드, 예: "G01", "BF1"
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  region region not null,
  status store_status not null default 'active',
  created_at timestamptz not null default now()
);

alter table stores enable row level security;
create policy "select own stores" on stores for select using (owner_id = auth.uid());
create policy "insert own stores" on stores for insert with check (owner_id = auth.uid());
create policy "update own stores" on stores for update using (owner_id = auth.uid());

-- ============================================================
-- AdAccount
-- ============================================================
create table ad_accounts (
  id text primary key, -- 슬러그, 예: "meta-ga", "tiktok-unified"
  owner_id uuid not null references auth.users(id) default auth.uid(),
  platform platform not null,
  region region not null,
  label text not null,
  external_account_id text -- Meta ad_account_id / TikTok advertiser_id (API 연동 시 채워짐)
);

alter table ad_accounts enable row level security;
create policy "select own ad_accounts" on ad_accounts for select using (owner_id = auth.uid());
create policy "insert own ad_accounts" on ad_accounts for insert with check (owner_id = auth.uid());
create policy "update own ad_accounts" on ad_accounts for update using (owner_id = auth.uid());

-- ============================================================
-- Campaign
-- ============================================================
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  name text not null check (char_length(name) between 1 and 100),
  platform platform not null,
  account_id text not null references ad_accounts(id),
  target_scope target_scope not null,
  target_store_ids text[] not null default '{}',
  event_tag text,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  budget_planned numeric(12, 2) not null,
  goal campaign_goal not null,
  manual_status manual_status,
  tags text[] not null default '{}',
  creative_url text,
  thumbnail_url text,
  external_campaign_id text, -- null이면 API로 안 들어온 수동 등록 캠페인
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table campaigns enable row level security;
create policy "select own campaigns" on campaigns for select using (owner_id = auth.uid());
create policy "insert own campaigns" on campaigns for insert with check (owner_id = auth.uid());
create policy "update own campaigns" on campaigns for update using (owner_id = auth.uid());
create policy "delete own campaigns" on campaigns for delete using (owner_id = auth.uid());

create index campaigns_owner_id_idx on campaigns(owner_id);
create index campaigns_account_id_idx on campaigns(account_id);

-- ============================================================
-- PerformanceRecord
-- ============================================================
create table performance_records (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  recorded_at date not null,
  impressions bigint,
  reach bigint,
  clicks bigint,
  spend numeric(12, 2) not null,
  hook_views bigint,
  held_views bigint,
  engagements bigint,
  conversions bigint,
  result_url text,
  reported_at date, -- null이면 미보고 → missing_performance 알림 트리거
  source performance_source not null default 'manual'
);

alter table performance_records enable row level security;
create policy "select own performance_records" on performance_records
  for select using (exists (select 1 from campaigns c where c.id = campaign_id and c.owner_id = auth.uid()));
create policy "insert own performance_records" on performance_records
  for insert with check (exists (select 1 from campaigns c where c.id = campaign_id and c.owner_id = auth.uid()));
create policy "update own performance_records" on performance_records
  for update using (exists (select 1 from campaigns c where c.id = campaign_id and c.owner_id = auth.uid()));

create index performance_records_campaign_id_idx on performance_records(campaign_id);

-- Alert는 별도 테이블 없음 — campaigns/performance_records를 읽어 매번 재계산한다
-- (schema.js generateAlerts(), 02-ux-flow.md/04-data-bridge.md 원칙 그대로).

-- ============================================================
-- Connection — OAuth 연결 상태. 서버(Edge Function/service_role) 전용.
-- 절대 anon/authenticated 롤에 access_token/refresh_token을 직접 노출하지 않는다 —
-- 프론트는 이 테이블을 뷰(connections_public, 아래)를 통해서만 읽는다.
-- ============================================================
create table connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  platform platform not null,
  account_id text not null references ad_accounts(id),
  access_token text not null, -- pgsodium/vault로 암호화 저장 권장 (appendix-auth-design.md에서 구체화)
  refresh_token text,
  expires_at timestamptz,
  connected_at timestamptz not null default now(),
  unique (owner_id, account_id)
);

alter table connections enable row level security;
-- 기본 정책 없음 — service_role만 이 테이블에 접근 (RLS는 service_role을 우회하지만,
-- 명시적으로 authenticated/anon용 정책을 하나도 만들지 않아 "명시 정책 외 DENY" 원칙을 지킨다).

-- 프론트가 "연결됨/안 됨" 상태만 안전하게 읽을 수 있도록 토큰을 제외한 뷰만 노출
create view connections_public with (security_invoker = true) as
  select id, owner_id, platform, account_id, expires_at, connected_at
  from connections;
-- connections_public은 기본 테이블의 RLS를 상속하지 않으므로, 별도 정책이 필요하면
-- appendix-rls-policies.md에서 구체화 (현재는 서버 전용 조회로 가정).
