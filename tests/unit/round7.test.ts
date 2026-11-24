// Round 7: skip setup, range picker, approximate dates, crash reports,
// answer feedback and the missing-column fallback.
import assert from 'node:assert/strict';
import {
  approximateStart,
  approximateLabel,
  nextRange,
  savePeriod,
  removePeriod,
  rangeDays,
  withTypicalLength,
  MAX_PERIOD_DAYS,
} from '@/lib/periodDates';
import { calculateCyclePredictionAndPrecautions } from '@/constants/cyclePrediction';
import { nextSyncHref, syncProgress, isStepHandled } from '@/lib/syncDetails';
import { cycleToRow, rowToCycle } from '@/lib/sync/mappers';
import { scrub, firstFrame } from '@/lib/scrub';
import { buildCrashRow, reportError } from '@/lib/crashReporter';
import { flushReports, pendingReports } from '@/lib/anonymousReports';
import { feedbackRow, FEEDBACK_REASONS, FEEDBACK_TEXT } from '@/lib/answerFeedback';
import { HEALTH_CHECK_QUESTIONS } from '@/constants/healthCheck';
import { PRIVACY_LINES } from '@/constants/privacy';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { addDaysToKey, todayKey } from '@/lib/dates';
import { __inserts, __next } from '@/lib/supabase';
import type { PastCycleRecord } from '@/types';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const tests: [string, () => void | Promise<void>][] = [];
const test = (name: string, f: () => void | Promise<void>) => tests.push([name, f]);
const TODAY = '2026-11-24';

// ── 2. Range date picker ──
test('range: first tap starts, second tap ends, third tap starts again', () => {
  let r = nextRange({ start: null, end: null }, '2026-11-02');
  assert.deepEqual(r, { start: '2026-11-02', end: null });
  r = nextRange(r, '2026-11-06');
  assert.deepEqual(r, { start: '2026-11-02', end: '2026-11-06' });
  assert.equal(rangeDays(r.start!, r.end!), 5);
  r = nextRange(r, '2026-10-05');
  assert.deepEqual(r, { start: '2026-10-05', end: null });
});
test('range: tapping before the start moves the start; too long starts over', () => {
  assert.deepEqual(nextRange({ start: '2026-11-10', end: null }, '2026-11-08'), { start: '2026-11-08', end: null });
  const far = addDaysToKey('2026-11-01', MAX_PERIOD_DAYS);
  assert.deepEqual(nextRange({ start: '2026-11-01', end: null }, far), { start: far, end: null });
  const ok = addDaysToKey('2026-11-01', MAX_PERIOD_DAYS - 1);
  assert.deepEqual(nextRange({ start: '2026-11-01', end: null }, ok), { start: '2026-11-01', end: ok });
});
test('savePeriod: newest first, lengths from consecutive starts, newest gets the average', () => {
  let c = savePeriod([], { start: '2026-11-02', end: '2026-11-06' }, TODAY);
  assert.equal(c.length, 1);
  assert.equal(c[0].periodDurationDays, 5);
  assert.equal(c[0].daysAgo, 22);
  c = savePeriod(c, { start: '2026-10-04', end: '2026-10-08' }, TODAY);
  c = savePeriod(c, { start: '2026-09-04', end: '2026-09-09' }, TODAY);
  assert.deepEqual(c.map((x) => x.startDate), ['2026-11-02', '2026-10-04', '2026-09-04']);
  assert.deepEqual(c.map((x) => x.cycleNumber), [1, 2, 3]);
  assert.equal(c[1].lengthDays, 29); // 4 Oct → 2 Nov
  assert.equal(c[2].lengthDays, 30); // 4 Sep → 4 Oct
  assert.equal(c[0].lengthDays, 30); // round((29 + 30) / 2)
});
test('savePeriod: a corrected range replaces the overlapping one instead of duplicating', () => {
  let c = savePeriod([], { start: '2026-11-02', end: '2026-11-06' }, TODAY);
  c = savePeriod(c, { start: '2026-11-03', end: '2026-11-08' }, TODAY);
  assert.equal(c.length, 1);
  assert.equal(c[0].startDate, '2026-11-03');
  assert.equal(c[0].periodDurationDays, 6);
  c = removePeriod(c, c[0].id, TODAY);
  assert.equal(c.length, 0);
});
test('typical cycle length only applies with one period, clamped 21–45', () => {
  const one = savePeriod([], { start: '2026-11-02', end: '2026-11-06' }, TODAY);
  assert.equal(withTypicalLength(one, 60)[0].lengthDays, 45);
  assert.equal(withTypicalLength(one, 18)[0].lengthDays, 21);
  assert.equal(withTypicalLength(one, 31)[0].lengthDays, 31);
  const two = savePeriod(one, { start: '2026-10-04', end: '2026-10-08' }, TODAY);
  assert.equal(withTypicalLength(two, 40), two);
});

// ── 3. "I don't remember exactly" ──
test('approximate start: early 5th, mid 15th, late ~25th, never in the future', () => {
  assert.equal(approximateStart(2026, 9, 'early', TODAY), '2026-10-05');
  assert.equal(approximateStart(2026, 9, 'mid', TODAY), '2026-10-15');
  assert.equal(approximateStart(2026, 9, 'late', TODAY), '2026-10-25');
  assert.equal(approximateStart(2026, 1, 'late', TODAY), '2026-02-25');
  assert.equal(approximateStart(2026, 10, 'late', TODAY), TODAY);
  assert.equal(approximateLabel('2026-10-15'), 'around mid-October');
  assert.equal(approximateLabel('2026-10-05'), 'around early-October');
  assert.equal(approximateLabel('2026-10-25'), 'around late-October');
});
test('approximate dates lower prediction confidence and widen the window', () => {
  const exact = [
    { start: '2026-11-02', end: '2026-11-06' },
    { start: '2026-10-04', end: '2026-10-08' },
    { start: '2026-09-05', end: '2026-09-09' },
  ].reduce<PastCycleRecord[]>((acc, p) => savePeriod(acc, p, TODAY), []);
  const approx = exact.map((c, i) => (i === 0 ? { ...c, approximate: true } : c));
  const a = calculateCyclePredictionAndPrecautions(exact.length, exact);
  const b = calculateCyclePredictionAndPrecautions(approx.length, approx);
  assert.ok(!a.approximateDates);
  assert.equal(b.approximateDates, true);
  assert.ok(b.confidencePercentage < a.confidencePercentage, `${b.confidencePercentage} < ${a.confidencePercentage}`);
  assert.ok(b.confidencePercentage >= 45);
  assert.ok((b.cycleVarianceDays ?? 0) >= 5);
  // An older approximate period counts for less than the latest one.
  const olderApprox = exact.map((c, i) => (i === 2 ? { ...c, approximate: true } : c));
  const c = calculateCyclePredictionAndPrecautions(olderApprox.length, olderApprox);
  assert.ok(c.confidencePercentage > b.confidencePercentage);
  assert.ok((c.cycleVarianceDays ?? 0) >= 3.5);
});
test('approximate flag survives backup (row mappers)', () => {
  const [c] = savePeriod([], { start: '2026-10-15', end: '2026-10-19', approximate: true }, TODAY);
  const row = cycleToRow('u1', c);
  assert.equal(row.approximate, true);
  assert.equal(rowToCycle(row).approximate, true);
  const exactRow = cycleToRow('u1', { ...c, approximate: undefined });
  assert.equal(exactRow.approximate, false);
  assert.equal(rowToCycle({ ...exactRow, approximate: null }).approximate, undefined);
});

// ── 1. Skip the questionnaire ──
test('skip setup: defaults, no invented data, steps come back to personalise', () => {
  const store = useAppStore.getState();
  assert.deepEqual(store.skippedSyncSteps, []);
  const before = useAppStore.getState();
  assert.equal(nextSyncHref(before), '/assessment?onboarding=true');
  useAppStore.getState().skipSyncStep('questions');
  assert.equal(nextSyncHref(useAppStore.getState()), '/log-cycle?onboarding=true');
  assert.ok(isStepHandled('questions', useAppStore.getState()));
  useAppStore.getState().skipSetup();
  const s = useAppStore.getState();
  const p = syncProgress(s);
  assert.ok(s.syncCompletedAt, 'setup counts as finished');
  assert.ok(p.isComplete && p.allStepsDone && p.next === null);
  assert.equal(p.doneCount, 0);
  assert.equal(p.toPersonalise.length, 6);
  assert.equal(s.pastCycles.length, 0, 'no made-up periods');
  assert.equal(nextSyncHref(s), '/sync-result');
  useAppStore.getState().snoozePersonalise(14);
  assert.equal(useAppStore.getState().personalisePromptSnoozedUntil, addDaysToKey(todayKey(), 14));
});
test('a skipped step that is later done counts as done', () => {
  const s = useAppStore.getState();
  const p = syncProgress({ ...s, pastCycles: savePeriod([], { start: '2026-11-02', end: '2026-11-06' }, TODAY) });
  const period = p.steps.find((x) => x.id === 'period')!;
  assert.ok(period.done && !period.skipped);
  assert.equal(p.toPersonalise.length, 5);
});

// ── 4. Why we ask ──
test('every health-check question explains why it matters', () => {
  assert.equal(HEALTH_CHECK_QUESTIONS.length, 11);
  for (const q of HEALTH_CHECK_QUESTIONS) assert.ok(q.why && q.why.length > 30 && q.why.length < 400, q.id);
});

// ── 6. Helpful / not helpful ──
test('feedback row: intent, rating, reason; question only when given, scrubbed', () => {
  const up = feedbackRow({ intentId: 'cramps', rating: 'up', lang: 'hinglish' });
  assert.deepEqual(
    { ...up, app_version: 'x' },
    { intent_id: 'cramps', rating: 'up', reason: null, lang: 'hinglish', question: null, app_version: 'x', platform: 'android' }
  );
  const down = feedbackRow({
    rating: 'down',
    reason: 'not_answered',
    question: '  my email is priya.s@gmail.com, call 98765 43210  ',
  });
  assert.equal(down.intent_id, 'no_match');
  assert.equal(down.question, 'my email is [email], call [number]');
  assert.ok(!JSON.stringify(down).includes('priya'));
  assert.equal(feedbackRow({ rating: 'down', question: 'x'.repeat(900) }).question!.length, 300);
  for (const lang of ['en', 'hinglish', 'hi'] as const) for (const r of FEEDBACK_REASONS) assert.ok(FEEDBACK_TEXT[lang].reasons[r]);
});
test('rating an answer is kept with the message', () => {
  useAppStore.getState().addYourGoGirlMessage({
    id: 'bot-1',
    sender: 'bot',
    text: 'Cramps help',
    category: 'menstruation',
    timestamp: '10:00',
    createdAt: new Date().toISOString(),
    intentId: 'cramps',
  });
  useAppStore.getState().rateYourGoGirlMessage('bot-1', 'down', 'too_long');
  const m = useAppStore.getState().yourGoGirlMessages.find((x) => x.id === 'bot-1')!;
  assert.equal(m.feedback, 'down');
  assert.equal(m.feedbackReason, 'too_long');
});

// ── 7. Crash reports without trackers ──
test('scrub removes emails, phone numbers and URL queries', () => {
  assert.equal(scrub('mail a.b+c@college.ac.in now'), 'mail [email] now');
  assert.equal(scrub('call +91 98765-43210'), 'call [number]');
  assert.equal(scrub('GET https://x.supabase.co/rest/v1/cycles?user_id=eq.123 failed'), 'GET https://x.supabase.co/rest/v1/cycles?[query] failed');
  assert.equal(scrub('Day 12 of 28'), 'Day 12 of 28');
  assert.equal(scrub('abc', 2), 'ab');
});
test('firstFrame groups the same crash across builds', () => {
  const hermes = 'TypeError: Cannot read property at of undefined\n    at onPress (address at index.android.bundle:1:234567)\n    at next (native)';
  assert.equal(firstFrame(hermes), 'at onPress (address at index.android.bundle');
  const safari = 'render@http://localhost:8081/entry.bundle:12:34\ncommit@http://localhost:8081/entry.bundle:99:1';
  assert.equal(firstFrame(safari), 'render@entry.bundle');
  const web = 'TypeError: x\n    at c (http://127.0.0.1:8104/_expo/static/js/web/index-e3c3c99a0b1f7960f8667ba718b3e777.js:1:568)';
  assert.equal(firstFrame(web), 'at c (index.js');
  assert.equal(firstFrame(undefined), '');
});
test('crash row has the error and app version, nothing about her', () => {
  const e = new Error('Failed to save for ananya@example.com (98765 43210)');
  const row = buildCrashRow(e, { source: 'boundary', route: '/log-mood' });
  assert.equal(row.source, 'boundary');
  assert.equal(row.route, '/log-mood');
  assert.equal(row.app_version, '1.0.0');
  assert.equal(row.runtime_version, 'test-runtime');
  assert.equal(row.platform, 'android');
  assert.equal(row.os_version, '34');
  assert.ok(!JSON.stringify(row).includes('ananya') && !JSON.stringify(row).includes('98765'));
  assert.ok(row.signature.startsWith('Error: Failed to save for [email]'));
  assert.ok(row.signature.length <= 200 && row.message.length <= 1000 && row.stack.length <= 8000);
  for (const k of ['user_id', 'email', 'device_id', 'name_of_user']) assert.ok(!(k in row), k);
  assert.equal(buildCrashRow('plain string', { source: 'manual' }).message, 'plain string');
});
test('crash reports: off switch, once per crash, queued then sent', async () => {
  __inserts.length = 0;
  useSettingsStore.getState().setCrashReports(false);
  await reportError(new Error('switch is off'), { source: 'manual' });
  assert.equal(await pendingReports(), 0);
  useSettingsStore.getState().setCrashReports(true);
  __next.throws = true; // offline
  await reportError(new Error('boom once'), { source: 'manual' });
  await reportError(new Error('boom once'), { source: 'manual' });
  await flushReports();
  assert.equal(await pendingReports(), 1, 'kept for later while offline');
  __next.throws = false;
  await flushReports();
  assert.equal(await pendingReports(), 0);
  const sent = __inserts.filter((x) => x.table === 'crash_reports').flatMap((x) => x.rows);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].message, 'boom once');
  assert.ok(typeof sent[0].created_at === 'string');
});
test('crash reports: capped per session; rejected data is dropped, not retried forever', async () => {
  for (let i = 0; i < 30; i++) await reportError(new Error(`distinct ${i}`), { source: 'manual' });
  await flushReports();
  const sent = __inserts.filter((x) => x.table === 'crash_reports').flatMap((x) => x.rows);
  assert.ok(sent.length <= 15, `sent ${sent.length}`);
  __next.error = { message: 'violates check constraint', code: '23514' };
  await feedbackSend();
  await flushReports();
  assert.equal(await pendingReports(), 0, 'a 23xxx rejection does not block the queue');
  __next.error = { message: 'relation "answer_feedback" does not exist', code: '42P01' };
  await feedbackSend();
  await flushReports();
  assert.equal(await pendingReports(), 1, 'kept until the migration has run');
  __next.error = null;
  await flushReports();
  assert.equal(await pendingReports(), 0);
});
async function feedbackSend() {
  const { sendAnswerFeedback } = await import('@/lib/answerFeedback');
  await sendAnswerFeedback({ intentId: 'cramps', rating: 'up', lang: 'en' });
}
test('privacy lines say no trackers and stay short', () => {
  const never = PRIVACY_LINES.find((l) => /never/i.test(l.title ?? '') || l.id === 'never') ?? PRIVACY_LINES[2];
  assert.match(never.text, /tracking SDKs/);
  for (const l of PRIVACY_LINES) assert.ok(l.text.length <= 140, l.id);
});

(async () => {
  let passed = 0;
  for (const [n, f] of tests) {
    try {
      await f();
      passed++;
    } catch (e: any) {
      console.log('FAIL', n, '\n ', e.message);
      process.exitCode = 1;
    }
  }
  console.log(`${passed}/${tests.length} round-7 tests passed`);
})();
