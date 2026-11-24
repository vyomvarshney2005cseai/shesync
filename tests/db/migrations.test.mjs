// Runs every migration in supabase/migrations (twice, to prove they are safe to
// re-run) on an in-memory Postgres (PGlite) with Supabase-like roles, then
// checks row-level security and the anonymous report tables.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', '..', 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
assert.ok(files.length >= 2, 'migrations found');

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated, anon;
  grant usage on schema public to authenticated, anon;
  grant execute on function auth.uid() to authenticated, anon;
  -- Supabase grants table rights to the API roles by default; RLS and
  -- explicit revokes must still keep data safe.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  -- an OLD project schema, to prove the first migration upgrades it
  create table public.cycles (id uuid primary key default gen_random_uuid(), user_id uuid, start_date date, end_date date, cycle_length int, created_at timestamptz default now());
  create table public.app_documents (user_id uuid not null references auth.users (id) on delete cascade, doc text not null check (doc in ('fitness','study','games')), data jsonb not null, updated_at timestamptz not null default now(), primary key (user_id, doc));
  create table public.daily_logs (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), log_date date, pain_level int);
`);
const L = '33333333-3333-3333-3333-333333333333';
await db.exec(`insert into auth.users (id) values ('${L}');
  insert into public.cycles (user_id, start_date, cycle_length) values ('${L}','2026-01-01',28), ('${L}','2026-01-01',28)`);

for (const round of [1, 2]) {
  for (const f of files) {
    try {
      await db.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
    } catch (e) {
      throw new Error(`${f} (run ${round}): ${e.message}`);
    }
  }
}

let passed = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  passed++;
};
const rejects = async (p, msg) => {
  let failed = false;
  try {
    await p;
  } catch {
    failed = true;
  }
  ok(failed, msg);
};

ok((await db.query(`select count(*)::int n from public.cycles`)).rows[0].n === 1, 'legacy duplicate cycles collapsed');
await db.exec(`delete from public.cycles; delete from auth.users where id='${L}'`);

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
await db.exec(`insert into auth.users (id, raw_user_meta_data) values ('${A}', '{"full_name":"Ananya Verma"}'), ('${B}', '{}')`);
ok((await db.query(`select count(*)::int n from public.profiles`)).rows[0].n === 2, 'profiles auto-created');

async function as(role, uid, q, params) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
  try {
    return await db.query(q, params);
  } finally {
    await db.exec('reset role;');
  }
}
const user = (uid, q, params) => as('authenticated', uid, q, params);
const anon = (q, params) => as('anon', null, q, params);

// ── Own data only (first migration) ──
await user(A, `insert into public.symptom_logs (user_id, id, log_date, logged_at, pain, flow) values ($1,'log-1','2026-11-09',now(),4,'none')`, [A]);
await user(A, `insert into public.cycles (user_id, start_date, end_date, cycle_length, period_days) values ($1,'2026-10-26','2026-10-31',28,5)`, [A]);
await rejects(user(A, `insert into public.app_documents (user_id, doc, data) values ($1,'other','{}')`, [A]), 'unknown document rejected');
const bSees = (await user(B, `select (select count(*)::int from public.symptom_logs) logs, (select count(*)::int from public.cycles) cycles`)).rows[0];
ok(bSees.logs === 0 && bSees.cycles === 0, "B cannot see A's data");
await rejects(user(B, `insert into public.symptom_logs (user_id,id,log_date,logged_at) values ($1,'x','2026-11-09',now())`, [A]), 'B cannot write as A');
await rejects(user(A, `insert into public.symptom_logs (user_id,id,log_date,logged_at,flow) values ($1,'log-2','2026-11-09',now(),'gushing')`, [A]), 'invalid flow rejected');
const anonProfiles = await anon(`select count(*)::int n from public.profiles`).then((r) => r.rows[0].n, () => 0);
ok(anonProfiles === 0, 'anon sees no profiles');

// ── 3. Approximate periods ──
await user(A, `insert into public.cycles (user_id, start_date, end_date, cycle_length, period_days, approximate) values ($1,'2026-09-15','2026-09-19',28,5,true)`, [A]);
const approx = (await user(A, `select start_date::text d, approximate from public.cycles order by start_date`, [])).rows;
ok(approx.length === 2 && approx[0].approximate === true && approx[1].approximate === false, 'cycles.approximate stored, defaults to false');

// ── 6. Answer feedback: anyone can add, nobody can read through the app ──
await anon(`insert into public.answer_feedback (intent_id, rating, reason, lang, platform, app_version) values ('cramps','down','not_answered','hinglish','android','1.0.0')`);
await user(A, `insert into public.answer_feedback (intent_id, rating, lang, platform) values ('cramps','up','en','ios')`);
await anon(`insert into public.answer_feedback (intent_id, rating, question) values ('no_match','down','how to use menstrual cup')`);
await rejects(anon(`insert into public.answer_feedback (intent_id, rating) values ('cramps','meh')`), 'unknown rating rejected');
await rejects(anon(`insert into public.answer_feedback (intent_id, rating, question) values ('x','down',repeat('a',301))`), 'long question rejected');
await rejects(anon(`insert into public.answer_feedback (intent_id, rating, reason) values ('x','down','spam')`), 'unknown reason rejected');
await rejects(anon(`select * from public.answer_feedback`), 'anon cannot read feedback');
await rejects(user(A, `select * from public.answer_feedback`), 'signed-in users cannot read feedback');
await rejects(user(A, `update public.answer_feedback set rating='up'`), 'nobody can change feedback');
await rejects(anon(`delete from public.answer_feedback`), 'nobody can delete feedback');
await rejects(anon(`select * from public.answer_feedback_summary`), 'summary is owner-only');
const summary = (await db.query(`select intent_id, helpful::int, not_helpful::int, not_helpful_pct::int pct, did_not_answer::int from public.answer_feedback_summary order by intent_id`)).rows;
ok(
  JSON.stringify(summary) ===
    JSON.stringify([
      { intent_id: 'cramps', helpful: 1, not_helpful: 1, pct: 50, did_not_answer: 1 },
      { intent_id: 'no_match', helpful: 0, not_helpful: 1, pct: 100, did_not_answer: 0 },
    ]),
  'feedback summary per answer'
);
const cols = (await db.query(`select column_name from information_schema.columns where table_name in ('answer_feedback','crash_reports')`)).rows.map((r) => r.column_name);
ok(!cols.some((c) => /user|email|device|ip/.test(c)), 'report tables have no user, email, device or IP column');

// ── 7. Crash reports: same rules ──
await anon(`insert into public.crash_reports (signature, name, message, source, fatal, platform, app_version) values ('TypeError: x | at f','TypeError','x','global',true,'android','1.0.0')`);
await user(B, `insert into public.crash_reports (signature, source, platform) values ('TypeError: x | at f','boundary','web')`);
await rejects(anon(`insert into public.crash_reports (signature, source) values ('x','tracker')`), 'unknown source rejected');
await rejects(anon(`insert into public.crash_reports (signature, source, stack) values ('x','manual',repeat('s',8001))`), 'huge stack rejected');
await rejects(anon(`select * from public.crash_reports`), 'anon cannot read crash reports');
await rejects(user(B, `select * from public.crash_summary`), 'crash summary is owner-only');
const crash = (await db.query(`select signature, reports::int, fatal_reports::int from public.crash_summary`)).rows;
ok(crash.length === 1 && crash[0].reports === 2 && crash[0].fatal_reports === 1, 'crash summary groups by signature');

// ── Account deletion still removes everything of hers ──
await user(A, `select public.delete_my_account()`);
const left = (await db.query(`select (select count(*)::int from auth.users) users, (select count(*)::int from public.cycles) cycles, (select count(*)::int from public.answer_feedback) feedback`)).rows[0];
ok(left.users === 1 && left.cycles === 0, 'account deletion removes her data');
ok(left.feedback === 3, 'anonymous feedback is not linked to any account');

console.log(`${passed} database checks passed (${files.length} migrations, run twice)`);
