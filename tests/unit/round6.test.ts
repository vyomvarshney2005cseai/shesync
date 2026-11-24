import assert from 'node:assert/strict';
import { buildOutlook, forecastExam, prepPlan, dayMarks, heavyDaysFromLogs } from '@/lib/examPlanner';
import { buildLeaveNote, noteTense, leaveDays } from '@/lib/leaveNote';
import { PHASE_PROMPTS, promptPhase, promptsFor } from '@/constants/journalPrompts';
import { passwordStrength } from '@/lib/passwordStrength';
import { breathAt, hapticSlot } from '@/lib/breathing';
import { cleanPhone, isValidPhone, useSafetyStore } from '@/store/useSafetyStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAppStore } from '@/store/useAppStore';
import { PRIVACY_LINES } from '@/constants/privacy';
import { addDaysToKey } from '@/lib/dates';

let passed = 0;
const tests: [string, () => void | Promise<void>][] = [];
const test = (n: string, f: () => void | Promise<void>) => tests.push([n, f]);

const today = '2026-11-24';
const cycles = [
  { id: 'c1', cycleNumber: 1, startDate: '2026-11-10', daysAgo: 14, lengthDays: 28, periodDurationDays: 5 },
  { id: 'c2', cycleNumber: 2, startDate: '2026-10-13', daysAgo: 42, lengthDays: 28, periodDurationDays: 5 },
] as any[];
const pred = { daysUntilNextPeriod: 14, predictedCycleLength: 28, cycleVarianceDays: 2, regularityStatus: 'regular' } as any;
const outlook = buildOutlook({ today, hasCycleData: true, pastCycles: cycles, prediction: pred, logs: [] })!;

test('outlook: next start from engine, then every 28 days', () => {
  assert.equal(outlook.starts[0], '2026-11-10');
  assert.equal(outlook.starts[1], '2026-12-08');
  assert.equal(outlook.starts[2], '2027-01-05');
  assert.deepEqual(outlook.heavyDays, [1, 2]);
  assert.equal(outlook.periodLength, 5);
});
test('no cycle data → unknown + tip', () => {
  const o = buildOutlook({ today, hasCycleData: false, pastCycles: [], prediction: pred, logs: [] });
  assert.equal(o, null);
  const f = forecastExam('2026-12-08', null, today);
  assert.equal(f.risk, 'unknown');
  assert.ok(prepPlan('2026-12-08', f, today).some((s) => /Log period/.test(s.text)));
});
test('exam on predicted day 1 → heavy', () => {
  const f = forecastExam('2026-12-08', outlook, today);
  assert.equal(f.risk, 'heavy'); assert.equal(f.periodDay, 1);
});
test('exam on day 4 → period (lighter)', () => assert.equal(forecastExam('2026-12-11', outlook, today).risk, 'period'));
test('exam 3 days before → PMS', () => {
  const f = forecastExam('2026-12-05', outlook, today);
  assert.equal(f.risk, 'pms'); assert.match(f.label, /3 days before/);
});
test('mid-cycle exam → clear', () => assert.equal(forecastExam('2026-11-26', outlook, today).risk, 'clear'));
test('within margin of heavy day but outside PMS → near', () => {
  // 6 days before next start: not PMS (5), margin 2 → heavy day 1 is 6 away → clear; 1 day after period end (day 6) → near via next? use day 7 of… use 2026-12-02 (6 before) with larger variance
  const o = buildOutlook({ today, hasCycleData: true, pastCycles: cycles, prediction: { ...pred, cycleVarianceDays: 6 }, logs: [] })!;
  assert.equal(forecastExam('2026-12-02', o, today).risk, 'near');
  assert.equal(forecastExam('2026-12-01', o, today).risk, 'clear');
});
test('margin grows further ahead', () => {
  const near = forecastExam('2026-12-08', outlook, today).margin;
  const far = forecastExam('2027-03-01', outlook, today).margin;
  assert.ok(far > near, `${far} > ${near}`);
});
test('heavy days learned from flow logs (2+ periods)', () => {
  const logs = [
    { id: '1', date: '2026-10-14', flow: 'heavy' }, { id: '2', date: '2026-10-15', flow: 'severe' },
    { id: '3', date: '2026-11-11', flow: 'heavy' }, { id: '4', date: '2026-11-12', flow: 'heavy' },
    { id: '5', date: '2026-11-10', flow: 'light' },
  ] as any[];
  const r = heavyDaysFromLogs(logs, cycles);
  assert.deepEqual(r, { days: [2, 3], fromLogs: true });
  const o = buildOutlook({ today, hasCycleData: true, pastCycles: cycles, prediction: pred, logs })!;
  assert.equal(forecastExam('2026-12-08', o, today).risk, 'period'); // day 1 no longer heavy for her
  assert.equal(forecastExam('2026-12-09', o, today).risk, 'heavy');
});
test('prep plan: heavy exam has kit + finish-by, no past dates, sorted', () => {
  const f = forecastExam('2026-12-08', outlook, today);
  const plan = prepPlan('2026-12-08', f, today);
  assert.ok(plan.length >= 5);
  assert.ok(plan.every((s) => s.date === '' || s.date >= today));
  assert.ok(plan.some((s) => /exam-day kit/i.test(s.text)));
  assert.ok(plan.some((s) => /Finish the hardest topics/.test(s.text)));
  const dated = plan.filter((s) => s.date).map((s) => s.date);
  assert.deepEqual(dated, [...dated].sort());
});
test('prep plan: PMS exam mentions sleep and gentle timer', () => {
  const plan = prepPlan('2026-12-05', forecastExam('2026-12-05', outlook, today), today);
  assert.ok(plan.some((s) => /Sleep 7–8 hours/.test(s.text)));
  assert.ok(plan.some((s) => /15\/5/.test(s.text)));
});
test('prep plan: exam tomorrow drops long-range steps', () => {
  const plan = prepPlan('2026-11-25', forecastExam('2026-11-25', outlook, today), today);
  assert.ok(plan.every((s) => s.date >= today));
  assert.ok(!plan.some((s) => /Start revising/.test(s.text)));
});
test('prep plan: heavy exam tomorrow still gets the kit today', () => {
  const o = buildOutlook({ today, hasCycleData: true, pastCycles: cycles, prediction: { ...pred, daysUntilNextPeriod: 1 }, logs: [] })!;
  const f = forecastExam('2026-11-25', o, today);
  assert.equal(f.risk, 'heavy');
  const plan = prepPlan('2026-11-25', f, today);
  const kit = plan.find((s) => /exam-day kit/i.test(s.text));
  assert.equal(kit?.date, today);
  assert.ok(plan.some((s) => s.date === '2026-11-25' && /breakfast/.test(s.text)));
});
test('calendar marks: PMS, heavy and period days', () => {
  const m = dayMarks(outlook, today, 60);
  assert.equal(m['2026-12-08'], 'heavy'); assert.equal(m['2026-12-09'], 'heavy');
  assert.equal(m['2026-12-10'], 'period'); assert.equal(m['2026-12-03'], 'pms');
  assert.equal(m['2026-11-26'], undefined);
});
test('late period: next start never before last real start + 10', () => {
  const o = buildOutlook({ today, hasCycleData: true, pastCycles: [{ ...cycles[0], startDate: '2026-10-20' }], prediction: { ...pred, daysUntilNextPeriod: 0 }, logs: [] })!;
  assert.equal(o.starts[1], today);
});

// ── Leave note ──
const base = { level: 'college' as const, to: 'hod' as const, reason: 'unwell' as const, lang: 'en' as const, name: 'Ananya Sharma', classOrCourse: 'B.Tech CSE, 3rd year, Section E', rollNo: '2301', institution: 'ABES Institute of Technology', city: 'Ghaziabad', from: today, to_: today, today };
test('leave note EN: one day, present tense, private reason', () => {
  const n = buildLeaveNote(base);
  assert.match(n.body, /^To,\nThe Head of Department,\nABES Institute of Technology,\nGhaziabad/);
  assert.match(n.body, /I am unable to attend classes on 24 November 2026 as I am unwell\./);
  assert.match(n.body, /Roll No\. 2301/);
  assert.equal(n.subject, 'Application for leave on 24 November 2026');
  assert.ok(!/menstrual/.test(n.body));
});
test('leave note EN: past range with period pain, school adds parent line', () => {
  const n = buildLeaveNote({ ...base, level: 'school', to: 'class_teacher', reason: 'period_pain', from: '2026-11-20', to_: '2026-11-21', classOrCourse: 'Class 10-B' });
  assert.match(n.body, /I was unable to attend school from 20 November 2026 to 21 November 2026 \(2 days\) as I had severe menstrual cramps\./);
  assert.match(n.body, /Parent’s signature/);
  assert.match(n.body, /The Class Teacher/);
});
test('leave note EN: future + doctor', () => {
  const n = buildLeaveNote({ ...base, reason: 'doctor', from: '2026-11-26', to_: '2026-11-27' });
  assert.match(n.body, /will not be able to attend classes from 26 November 2026 to 27 November 2026 \(2 days\) on my doctor’s advice/);
});
test('leave note HI: Devanagari, dates, feminine verb', () => {
  const n = buildLeaveNote({ ...base, lang: 'hi', reason: 'period_pain', from: '2026-11-23', to_: '2026-11-23' });
  assert.match(n.body, /^सेवा में,\nविभागाध्यक्ष महोदय\/महोदया,/);
  assert.match(n.body, /मासिक धर्म में तेज़ दर्द के कारण मैं दिनांक 23\/11\/2026 को कॉलेज नहीं आ सकी।/);
  assert.match(n.body, /आपकी आज्ञाकारी शिष्या/);
});
test('leave note: blanks become placeholders, tense/day helpers', () => {
  const n = buildLeaveNote({ ...base, name: ' ', institution: '', city: '', rollNo: '' });
  assert.match(n.body, /\[Your name\]/); assert.match(n.body, /\[College name\]/); assert.ok(!/Roll No/.test(n.body));
  assert.equal(noteTense('2026-11-20', '2026-11-21', today), 'past');
  assert.equal(noteTense('2026-11-24', '2026-11-26', today), 'present');
  assert.equal(leaveDays('2026-11-24', '2026-11-26'), 3);
});

// ── Journal prompts ──
test('phase prompts: every phase has en+hi of equal length, distinct', () => {
  for (const [k, p] of Object.entries(PHASE_PROMPTS)) {
    assert.equal(p.en.length, p.hi.length, k);
    assert.equal(new Set(p.en).size, p.en.length, k);
  }
});
test('phase prompts: mapping and daily pick', () => {
  assert.equal(promptPhase('luteal', true), 'luteal');
  assert.equal(promptPhase('luteal', false), 'any');
  assert.equal(promptPhase('irregular', true), 'any');
  const d1 = new Date(2026, 10, 24, 9), d1b = new Date(2026, 10, 24, 22), d2 = new Date(2026, 10, 25, 9);
  const a = promptsFor('menstrual', 'en', 0, d1);
  assert.equal(a.length, 3); assert.equal(new Set(a).size, 3);
  assert.deepEqual(a, promptsFor('menstrual', 'en', 0, d1b));
  assert.notEqual(a[0], promptsFor('menstrual', 'en', 0, d2)[0]);
  assert.notEqual(a[0], promptsFor('menstrual', 'en', 1, d1)[0]);
  assert.ok(PHASE_PROMPTS.menstrual.en.includes(a[0]));
  assert.ok(/[ऀ-ॿ]/.test(promptsFor('luteal', 'hi', 0, d1)[0]));
});

// ── Password strength ──
test('password strength', () => {
  assert.equal(passwordStrength('abc').score, 0);
  assert.equal(passwordStrength('123456').score, 1);
  assert.equal(passwordStrength('password').score, 1);
  assert.equal(passwordStrength('aaaaaaaa').score, 1);
  assert.equal(passwordStrength('ananya2024', ['Ananya Sharma', 'ananya@x.com']).score, 1);
  assert.equal(passwordStrength('mangoes7').score, 2);
  assert.ok(passwordStrength('Mangoes-and-chai-7').score >= 4);
  assert.equal(passwordStrength('rainyafternoon').label, 'Okay');
});

// ── Breathing ──
test('breathing: stages and haptic rhythm', () => {
  assert.equal(breathAt(0).stage, 'in'); assert.equal(breathAt(4.5).stage, 'hold'); assert.equal(breathAt(7).stage, 'out');
  assert.equal(breathAt(12.1).breaths, 1); assert.equal(breathAt(1.2).secondsLeft, 3);
  assert.equal(hapticSlot(5), null);
  const inKeys = new Set(Array.from({ length: 40 }, (_, i) => hapticSlot(i * 0.1)?.key));
  assert.equal(inKeys.size, 8); // 8 quick taps while breathing in
  const outKeys = new Set(Array.from({ length: 60 }, (_, i) => hapticSlot(6 + i * 0.1)?.key));
  assert.equal(outKeys.size, 4); // 4 slow taps while breathing out
});

// ── Trusted contact ──
test('trusted contact: clean, validate, reject', () => {
  assert.equal(cleanPhone('+91 98765-43210'), '+919876543210');
  assert.ok(isValidPhone('98765 43210')); assert.ok(!isValidPhone('ab'));
  useSafetyStore.getState().setTrusted({ name: ' Didi ', phone: '+91 98765 43210' });
  assert.deepEqual(useSafetyStore.getState().trusted, { name: 'Didi', phone: '+919876543210' });
  useSafetyStore.getState().setTrusted({ name: '', phone: '123' });
  assert.equal(useSafetyStore.getState().trusted, null);
});

// ── Exams store ──
test('exams: add sorts, dedupes, validates', () => {
  const st = useStudyStore.getState();
  st.addExam('Maths', '2026-12-10'); st.addExam('Physics', '2026-12-02'); st.addExam('maths', '2026-12-10'); st.addExam('', '2026-12-01'); st.addExam('Bio', '12/12/2026');
  const ex = useStudyStore.getState().exams;
  assert.deepEqual(ex.map((e) => e.subject), ['Physics', 'maths']);
  useStudyStore.getState().removeExam(ex[0].id);
  assert.equal(useStudyStore.getState().exams.length, 1);
  useStudyStore.getState().setNoteProfile({ institution: 'ABES' });
  assert.equal(useStudyStore.getState().noteProfile.institution, 'ABES');
});

// ── Settings ──
test('settings: remembered email, focus volume clamp, welcome flag', () => {
  const s = useSettingsStore.getState();
  s.setRememberedEmail('  a@b.com '); assert.equal(useSettingsStore.getState().rememberedEmail, 'a@b.com');
  s.setFocusVolume(1.7); assert.equal(useSettingsStore.getState().focusVolume, 1);
  s.setFocusVolume(0.44); assert.equal(useSettingsStore.getState().focusVolume, 0.4);
  s.setFocusSound('rain'); assert.equal(useSettingsStore.getState().focusSound, 'rain');
  s.setWelcomeSeen(true); assert.equal(useSettingsStore.getState().welcomeSeen, true);
});

// ── Guest flow ──
test('guest: try without account, log, upgrade keeps data; login elsewhere wipes', async () => {
  const app = useAppStore.getState();
  app.startGuest();
  let s = useAppStore.getState();
  assert.equal(s.isAuthenticated, true); assert.equal(s.isGuest, true); assert.equal(s.isOfflineAccount, true); assert.equal(s.userEmail, '');
  s.logSymptom({ pain: 5 } as any);
  useSafetyStore.getState().setTrusted({ name: 'Didi', phone: '9876543210' });
  s.setFocusAreas(['Period Pain', 'Period Pain', ' Study Focus ']);
  assert.deepEqual(useAppStore.getState().focusAreas, ['Period Pain', 'Study Focus']);
  useAppStore.getState().upgradeGuest('Ananya', 'ananya@x.com', { offline: true });
  s = useAppStore.getState();
  assert.equal(s.isGuest, false); assert.equal(s.userName, 'Ananya'); assert.equal(s.symptomLogs.length, 1);
  assert.ok(useSafetyStore.getState().trusted, 'trusted contact kept');
  // a guest who logs in to another account gets that account, not the guest data
  useAppStore.getState().startGuest();
  useAppStore.getState().logSymptom({ pain: 3 } as any);
  useAppStore.getState().login('other@x.com', 'Other', { offline: true });
  s = useAppStore.getState();
  assert.equal(s.isGuest, false); assert.equal(s.symptomLogs.length, 0);
  assert.equal(useSafetyStore.getState().trusted, null, 'trusted contact cleared for a different account');
});
test('focus prompt snooze', () => {
  useAppStore.getState().snoozeFocusPrompt(7);
  assert.ok(useAppStore.getState().focusPromptSnoozedUntil > addDaysToKey(new Date().toISOString().slice(0, 10), 5));
});

// ── Privacy ──
test('privacy: exactly 3 lines, each short', () => {
  assert.equal(PRIVACY_LINES.length, 3);
  for (const l of PRIVACY_LINES) assert.ok(l.text.length <= 140, l.id);
});

(async () => {
  for (const [n, f] of tests) {
    try { await f(); passed++; } catch (e: any) { console.log('FAIL', n, '\n ', e.message); process.exitCode = 1; }
  }
  console.log(`${passed}/${tests.length} round-6 tests passed`);
})();
