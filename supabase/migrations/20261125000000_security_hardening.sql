-- ============================================================
-- Unnmegh — 25 Nov 2026: security hardening
--   1. daily_logs (the table older app versions wrote to) gets the same
--      owner-only Row Level Security as every other table, and nothing for
--      anonymous visitors. Skipped if the table does not exist.
--   2. The two owner-only summary views run with the rights of whoever
--      queries them (security_invoker), so they can never show report rows
--      to the app's keys even if a grant is added by mistake.
--   3. A notice lists any other table in `public` that has RLS switched off.
--
-- Safe to run more than once.
-- ============================================================

-- 1. Legacy daily_logs ────────────────────────────────────────
do $$
begin
  if to_regclass('public.daily_logs') is null then
    return;
  end if;

  execute 'alter table public.daily_logs enable row level security';
  execute 'revoke all on public.daily_logs from anon';

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'daily_logs' and column_name = 'user_id'
  ) then
    execute 'drop policy if exists "daily_logs: owner" on public.daily_logs';
    execute $p$
      create policy "daily_logs: owner" on public.daily_logs
        for all to authenticated
        using ((select auth.uid()) = user_id)
        with check ((select auth.uid()) = user_id)
    $p$;
  else
    -- No owner column: nobody using the app's keys may touch it.
    execute 'revoke all on public.daily_logs from authenticated';
  end if;
end;
$$;

-- 2. Summary views: invoker rights ────────────────────────────
do $$
begin
  if to_regclass('public.answer_feedback_summary') is not null then
    execute 'alter view public.answer_feedback_summary set (security_invoker = true)';
    execute 'revoke all on public.answer_feedback_summary from anon, authenticated';
  end if;
  if to_regclass('public.crash_summary') is not null then
    execute 'alter view public.crash_summary set (security_invoker = true)';
    execute 'revoke all on public.crash_summary from anon, authenticated';
  end if;
end;
$$;

-- 3. Tables without RLS (should be none) ─────────────────────
do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  loop
    raise notice 'Unnmegh: table public.% has Row Level Security switched OFF', t.relname;
  end loop;
end;
$$;
