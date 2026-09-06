-- ============================================================
-- Recap — 캠페인 종료 후 결과 보고 (02-ux-flow 시나리오 7, Build Plan Phase 5)
--
-- 이벤트 하나에 보고서 하나(event_recaps), 그 안의 캠페인마다 판정·코멘트 하나
-- (recap_campaign_notes). 숫자는 저장하지 않는다 — 지표·벤치마크·순위는 화면이
-- campaigns/performance_records에서 매번 계산한다(Alert와 같은 원칙). 여기엔
-- **사람이 쓴 것**만 남는다: 판정, 장점·아쉬운 점·이유, 배운 점, 다음 제언.
--
-- 언어별 문장은 jsonb `{ "en": "...", "ko": null, "zh-Hant": null }` 한 칸이다
-- (LocalizedText). 영어는 필수, 나머지는 3단계에서 채운다. 언어마다 컬럼을 두면
-- 언어를 늘릴 때마다 마이그레이션이 필요하고, 언어별 행으로 나누면 한 캠페인의
-- 코멘트가 세 행으로 흩어져 화면이 매번 다시 모아야 한다.
--
-- 읽기는 anon 공개(Reports와 같이 링크만으로 상사가 읽는다), 쓰기는 owner만.
-- ============================================================

create table event_recaps (
  id uuid primary key default gen_random_uuid(),
  -- default auth.uid() — 클라이언트가 소유자를 주장하는 경로를 만들지 않는다(plans와 같은 규칙)
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  -- 이벤트 이름. campaigns.campaign_group과 같은 값(대조 키) — plans.name과 같은 규칙
  event_name text not null,
  status text not null default 'draft' check (status in ('draft', 'final')),
  -- LocalizedText: { en: text, ko: text|null, "zh-Hant": text|null }
  summary jsonb,
  -- [{ title: LocalizedText, body: LocalizedText }, ...] — "배운 점" 카드 목록, 순서 = 배열 순서
  learnings jsonb not null default '[]'::jsonb,
  next_steps jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, event_name)
);

create table recap_campaign_notes (
  id uuid primary key default gen_random_uuid(),
  recap_id uuid not null references event_recaps(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  -- 예산 효율 판정. null이면 화면이 벤치마크 백분위로 제안한 값을 점선 칩으로 보여준다
  verdict text check (verdict in ('good', 'mid', 'bad')),
  strength jsonb,
  weakness jsonb,
  reason jsonb,
  -- 계정 전체(오가닉) 조회·참여 — 광고 API에 없어 사람이 적는다(선택)
  organic_views bigint check (organic_views is null or organic_views >= 0),
  organic_engagements bigint check (organic_engagements is null or organic_engagements >= 0),
  updated_at timestamptz not null default now(),
  unique (recap_id, campaign_id)
);

create index recap_campaign_notes_recap_id_idx on recap_campaign_notes(recap_id);

alter table event_recaps enable row level security;
alter table recap_campaign_notes enable row level security;

-- 쓰기는 owner만
create policy "insert own event_recaps" on event_recaps for insert with check (owner_id = auth.uid());
create policy "update own event_recaps" on event_recaps for update using (owner_id = auth.uid());
create policy "delete own event_recaps" on event_recaps for delete using (owner_id = auth.uid());

-- notes는 부모 recap의 소유자를 따른다(plan_items가 plans를 따르는 것과 같은 패턴)
create policy "insert own recap_campaign_notes" on recap_campaign_notes for insert
  with check (exists (select 1 from event_recaps r where r.id = recap_id and r.owner_id = auth.uid()));
create policy "update own recap_campaign_notes" on recap_campaign_notes for update
  using (exists (select 1 from event_recaps r where r.id = recap_id and r.owner_id = auth.uid()));
create policy "delete own recap_campaign_notes" on recap_campaign_notes for delete
  using (exists (select 1 from event_recaps r where r.id = recap_id and r.owner_id = auth.uid()));

-- 읽기는 로그인 여부와 무관하게 공개 — 00000000000019(anon read)와 같은 이유.
-- 로그인 게이트를 되살리면 이 두 정책을 owner 조건으로 좁힌다.
create policy "read event_recaps" on event_recaps for select using (true);
create policy "read recap_campaign_notes" on recap_campaign_notes for select using (true);
