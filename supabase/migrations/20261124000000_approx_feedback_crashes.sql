-- ============================================================
-- SheSync — 24 Nov 2026
--   1. cycles.approximate  ("I don't remember exactly")
--   2. answer_feedback     (👍/👎 on YourGoGirl answers, anonymous)
--   3. crash_reports       (self-hosted crash reports, anonymous)
--
-- Safe to run more than once. The app keeps working before this runs:
-- it simply leaves out the new column and keeps reports queued.
--
-- The two report tables hold no user id, device id, name or email.
-- The app (anon / authenticated keys) can only INSERT; reading is for
-- the project owner in the Supabase dashboard (service role / SQL editor).
-- ============================================================

-- 1. Approximate period dates ─────────────────────────────────
alter table public.cycles add column if not exists approximate boolean not null default false;

-- 2. Answer feedback ──────────────────────────────────────────
create table if not exists public.answer_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  intent_id text not null check (char_length(intent_id) between 1 and 80),
  rating text not null check (rating in ('up', 'down')),
  reason text check (reason in ('not_answered', 'too_long', 'not_for_me', 'language', 'wrong')),
  lang text check (lang in ('en', 'hinglish', 'hi')),
  question text check (char_length(question) <= 300),
  app_version text check (char_length(app_version) <= 40),
  platform text check (platform in ('ios', 'android', 'web'))
);
alter table public.answer_feedback enable row level security;
drop policy if exists "answer_feedback: app can add" on public.answer_feedback;
create policy "answer_feedback: app can add" on public.answer_feedback
  for insert to anon, authenticated with check (true);
revoke select, update, delete on public.answer_feedback from anon, authenticated;
grant insert on public.answer_feedback to anon, authenticated;
create index if not exists answer_feedback_intent_idx on public.answer_feedback (intent_id, created_at desc);

-- 3. Crash reports ────────────────────────────────────────────
create table if not exists public.crash_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  signature text not null check (char_length(signature) between 1 and 200),
  name text check (char_length(name) <= 120),
  message text check (char_length(message) <= 1000),
  stack text check (char_length(stack) <= 8000),
  source text not null check (source in ('boundary', 'global', 'promise', 'manual')),
  fatal boolean not null default false,
  route text check (char_length(route) <= 200),
  app_version text check (char_length(app_version) <= 40),
  runtime_version text check (char_length(runtime_version) <= 80),
  update_id text check (char_length(update_id) <= 80),
  platform text check (platform in ('ios', 'android', 'web')),
  os_version text check (char_length(os_version) <= 40)
);
alter table public.crash_reports enable row level security;
drop policy if exists "crash_reports: app can add" on public.crash_reports;
create policy "crash_reports: app can add" on public.crash_reports
  for insert to anon, authenticated with check (true);
revoke select, update, delete on public.crash_reports from anon, authenticated;
grant insert on public.crash_reports to anon, authenticated;
create index if not exists crash_reports_signature_idx on public.crash_reports (signature, created_at desc);

-- Owner-only summaries (no grants to anon/authenticated) ─────
-- Which answers people find unhelpful: the gaps to fill first.
create or replace view public.answer_feedback_summary as
select
  intent_id,
  count(*) filter (where rating = 'up') as helpful,
  count(*) filter (where rating = 'down') as not_helpful,
  round(100.0 * count(*) filter (where rating = 'down') / greatest(count(*), 1)) as not_helpful_pct,
  count(*) filter (where reason = 'not_answered') as did_not_answer,
  max(created_at) as last_rated
from public.answer_feedback
group by intent_id
order by not_helpful desc, not_helpful_pct desc;

-- The most frequent crashes in the last 30 days.
create or replace view public.crash_summary as
select
  signature,
  count(*) as reports,
  count(*) filter (where fatal) as fatal_reports,
  array_agg(distinct app_version) as app_versions,
  array_agg(distinct platform) as platforms,
  max(created_at) as last_seen
from public.crash_reports
where created_at > now() - interval '30 days'
group by signature
order by reports desc;

revoke all on public.answer_feedback_summary from anon, authenticated;
revoke all on public.crash_summary from anon, authenticated;
