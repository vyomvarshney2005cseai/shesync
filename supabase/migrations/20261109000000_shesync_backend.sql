-- ============================================================
-- SheSync backend (Supabase / Postgres)
--
-- Every table is owned by one user and protected by Row Level Security:
-- a signed-in user can read and write only her own rows. Deleting the
-- auth user (or calling delete_my_account()) removes all her data.
--
-- Safe to run more than once, and on a project that already has the older
-- `profiles` / `cycles` tables: everything uses IF NOT EXISTS.
-- ============================================================


-- ─── Shared: updated_at trigger ─────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── profiles: one row per user ─────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists focus_areas text[] not null default '{}';
alter table public.profiles add column if not exists is_assessment_completed boolean not null default false;
alter table public.profiles add column if not exists assessment_answers jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists fine_tuning jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists health_check jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists health_check_completed boolean not null default false;
alter table public.profiles add column if not exists sync_completed_at timestamptz;
alter table public.profiles add column if not exists remembered_cycles_count smallint not null default 0;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- New sign-ups get a profile row automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── cycles: saved periods ──────────────────────────────────
create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  created_at timestamptz not null default now()
);

alter table public.cycles add column if not exists end_date date;
alter table public.cycles add column if not exists cycle_length smallint;
alter table public.cycles add column if not exists period_days smallint;
alter table public.cycles add column if not exists updated_at timestamptz not null default now();
-- Older app versions could insert the same period twice; keep one copy so
-- the unique key below can be created.
delete from public.cycles a
  using public.cycles b
  where a.user_id = b.user_id and a.start_date = b.start_date and a.ctid < b.ctid;
create unique index if not exists cycles_user_start_key on public.cycles (user_id, start_date);

-- ─── symptom_logs: pain / flow / mood / journal entries ─────
create table if not exists public.symptom_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  log_date date not null,
  logged_at timestamptz not null,
  mood smallint check (mood between 1 and 5),
  energy text,
  pain smallint check (pain between 0 and 10),
  flow text check (flow in ('none', 'spotting', 'light', 'moderate', 'heavy', 'severe')),
  tags text[],
  pain_location text[],
  relief_methods text[],
  flow_color text,
  notes text check (char_length(notes) <= 4000),
  extra jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists symptom_logs_user_date_idx on public.symptom_logs (user_id, log_date desc);

-- ─── sleep_logs: hours slept, one per night ─────────────────
create table if not exists public.sleep_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  hours numeric(4, 2) not null check (hours between 0 and 16),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- ─── care_contacts: her own doctors / counsellors ───────────
create table if not exists public.care_contacts (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null check (char_length(name) between 1 and 120),
  role text not null check (role in ('gynaecologist', 'counsellor', 'other')),
  phone text not null check (char_length(phone) between 3 and 30),
  note text check (char_length(note) <= 500),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ─── app_documents: one JSON document per feature ───────────
create table if not exists public.app_documents (
  user_id uuid not null references auth.users (id) on delete cascade,
  doc text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, doc)
);
-- Allowed documents. Re-created each run so new features can be added
-- (PCOS mode and Confidence Booster were added on 10 Nov 2026).
alter table public.app_documents drop constraint if exists app_documents_doc_check;
alter table public.app_documents add constraint app_documents_doc_check
  check (doc in ('fitness', 'study', 'games', 'pcos', 'confidence'));

-- ─── updated_at triggers ────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'cycles', 'symptom_logs', 'sleep_logs', 'care_contacts', 'app_documents'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()',
      t
    );
  end loop;
end;
$$;

-- ─── Row Level Security: owner-only access ──────────────────
alter table public.profiles enable row level security;
alter table public.cycles enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.care_contacts enable row level security;
alter table public.app_documents enable row level security;

drop policy if exists "profiles: owner" on public.profiles;
create policy "profiles: owner" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

do $$
declare
  t text;
begin
  foreach t in array array['cycles', 'symptom_logs', 'sleep_logs', 'care_contacts', 'app_documents'] loop
    execute format('drop policy if exists "%1$s: owner" on public.%1$I', t);
    execute format(
      'create policy "%1$s: owner" on public.%1$I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)',
      t
    );
  end loop;
end;
$$;

-- Anonymous visitors get nothing.
revoke all on public.profiles, public.cycles, public.symptom_logs, public.sleep_logs,
  public.care_contacts, public.app_documents from anon;
grant select, insert, update, delete on public.profiles, public.cycles, public.symptom_logs,
  public.sleep_logs, public.care_contacts, public.app_documents to authenticated;

-- ─── delete_my_account(): right to erasure ──────────────────
-- Deletes the signed-in user; ON DELETE CASCADE removes all her rows.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  -- Explicit deletes also cover older tables created without ON DELETE CASCADE.
  delete from public.symptom_logs where user_id = uid;
  delete from public.cycles where user_id = uid;
  delete from public.sleep_logs where user_id = uid;
  delete from public.care_contacts where user_id = uid;
  delete from public.app_documents where user_id = uid;
  -- daily_logs is the table older app versions wrote to; erase it too if present.
  if to_regclass('public.daily_logs') is not null then
    execute 'delete from public.daily_logs where user_id = $1' using uid;
  end if;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
