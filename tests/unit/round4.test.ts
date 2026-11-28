import assert from 'node:assert/strict';
import { INTENTS, FALLBACK_SUGGESTIONS } from '@/lib/yourGoGirlKnowledge';
import { matchIntent, buildYourGoGirlReply, QUICK_PROMPT_TOPICS, createInitialWelcomeMessage } from '@/lib/yourGoGirlEngine';
import { HINGLISH, HINGLISH_QUESTIONS } from '@/lib/yourGoGirlHinglish';
import { HINDI, HINDI_QUESTIONS } from '@/lib/yourGoGirlHindi';
import { detectLanguage, toMatchText, translateActionLabel } from '@/lib/yourGoGirlLang';
import { buildDoctorQuestions } from '@/lib/doctorVisitPrep';
import { summariseDigestive, cleanDigestive } from '@/lib/digestive';
import { chatToText, chatFileName } from '@/lib/chatExport';
import { PERIOD_MYTHS, mythForDate } from '@/constants/periodMyths';
import { mergeFinal, liveText } from '@/lib/speech';
import { daysAgoKey, todayKey } from '@/lib/dates';

let n = 0;
const test = (name: string, fn: () => void | Promise<void>) => tests.push([name, fn]);
const tests: [string, () => void | Promise<void>][] = [];
const DEV = /[ऀ-ॿ]/;

// ─── Language detection ────────────────────────────────────
test('detects Hindi, Hinglish and English', () => {
  assert.equal(detectLanguage('पेट में दर्द हो रहा है'), 'hi');
  assert.equal(detectLanguage('pet dard ho raha hai'), 'hinglish');
  assert.equal(detectLanguage('periods 5 din late hai kya karu'), 'hinglish');
  assert.equal(detectLanguage('mujhe bahut tension hai'), 'hinglish');
  assert.equal(detectLanguage('I have really bad cramps today'), 'en');
  assert.equal(detectLanguage('my period is late'), 'en');
  assert.equal(detectLanguage('ok'), null);
  assert.equal(detectLanguage('thanks!'), null);
});

// ─── Understanding Hindi and Hinglish ──────────────────────
const cases: [string, string][] = [
  ['पेट में बहुत दर्द हो रहा है', 'cramps'],
  ['पीरियड में बहुत तेज़ क्रैम्प्स', 'cramps'],
  ['पीरियड देर से है', 'late_period'],
  ['मेरे पीरियड अनियमित हैं', 'irregular'],
  ['मैं मरना चाहती हूँ', 'crisis_selfharm'],
  ['मैं ख़ुद को नुकसान पहुँचाना चाहती हूँ', 'crisis_selfharm'],
  ['मेरा पति मुझे मारता है', 'abuse_violence'],
  ['हर घंटे पैड भर जाता है और चक्कर आ रहे हैं', 'emergency_bleeding'],
  ['बुखार है और पेट के निचले हिस्से में दर्द', 'fever_pelvic'],
  ['सफ़ेद पानी आ रहा है', 'discharge'],
  ['पीसीओडी क्या है', 'pcos'],
  ['नींद नहीं आती', 'sleep'],
  ['पढ़ाई में ध्यान नहीं लगता', 'focus'],
  ['मुझे बहुत घबराहट हो रही है', 'anxiety'],
  ['पेशाब में जलन होती है', 'uti'],
  ['बहुत ज़्यादा ब्लीडिंग हो रही है', 'heavy_bleeding'],
  ['मेरा अगला पीरियड कब आएगा', 'next_period'],
  ['पीरियड में क्या खाऊँ', 'period_food'],
  ['पेट फूल रहा है', 'bloating'],
  ['बहुत उदास हूँ', 'low_mood'],
  ['नमस्ते', 'greeting'],
  ['धन्यवाद', 'thanks'],
  ['khud ko hurt karna chahti hoon', 'crisis_selfharm'],
  ['har ghante pad bhar jata hai aur chakkar aa rahe hai', 'emergency_bleeding'],
  ['pet dard ho raha hai', 'cramps'],
  ['periods nahi aaye', 'late_period'],
  ['ghabrahat ho rahi hai', 'anxiety'],
];
test(`understands ${cases.length} Hindi/Hinglish messages`, () => {
  const bad: string[] = [];
  for (const [t, id] of cases) {
    const got = matchIntent(t).intent?.id ?? null;
    if (got !== id) bad.push(`${t} → ${got} (want ${id}) [${toMatchText(t)}]`);
  }
  assert.deepEqual(bad, []);
});

// ─── Translations are complete ─────────────────────────────
const phases = ['menstrual', 'follicular', 'ovulatory', 'luteal', 'irregular'] as const;
function ctx(over: any = {}): any {
  return {
    name: 'Priya', hasCycleData: true, day: 23, phase: 'luteal', phaseLabel: '', isIrregular: true,
    nextPeriodDate: 'Nov 25', daysUntilNext: 4, ovulationWindow: 'Nov 8 – 12', fertileWindow: '', cycleLength: 29,
    recentPain: 8, recentFlow: 'heavy', recentMood: 2, mode: 'empathetic_counsellor', text: 'i am using a tampon panic during my period', ...over,
  };
}
const ctxVariants = [
  ctx(),
  ctx({ name: '', hasCycleData: false, day: 0, nextPeriodDate: undefined, daysUntilNext: undefined, recentPain: null, recentFlow: 'none', recentMood: null, text: 'hello' }),
  ...phases.map((p) => ctx({ phase: p, daysUntilNext: -3 })),
  ctx({ daysUntilNext: 0 }), ctx({ daysUntilNext: 1 }), ctx({ daysUntilNext: 12 }),
];
test('every intent has Hinglish and Hindi answers with the same parts as English', () => {
  const problems: string[] = [];
  for (const intent of INTENTS) {
    for (const [name, table] of [['hinglish', HINGLISH], ['hi', HINDI]] as const) {
      const fn = (table as any)[intent.id];
      if (!fn) { problems.push(`${name}: missing ${intent.id}`); continue; }
      for (const c of ctxVariants) {
        const en = intent.reply(c);
        const tr = fn(c);
        const json = JSON.stringify(tr);
        if (/undefined|NaN|\[object/.test(json)) problems.push(`${name} ${intent.id}: bad value`);
        if (!tr.text) problems.push(`${name} ${intent.id}: no text`);
        for (const k of ['why', 'doctor', 'affirmation'] as const) if (en[k] && !tr[k]) problems.push(`${name} ${intent.id}: missing ${k}`);
        if (en.steps && (!tr.steps || tr.steps.length !== en.steps.length)) problems.push(`${name} ${intent.id}: steps ${tr.steps?.length} vs ${en.steps.length}`);
        if (name === 'hi' && !DEV.test(tr.text)) problems.push(`hi ${intent.id}: text not in Devanagari`);
        if (name === 'hinglish' && DEV.test(json)) problems.push(`hinglish ${intent.id}: has Devanagari`);
      }
    }
  }
  assert.deepEqual([...new Set(problems)], []);
});
test('every follow-up, quick prompt and fallback chip is translated', () => {
  const qs = new Set<string>();
  INTENTS.forEach((i) => i.followUps.forEach((f) => qs.add(f)));
  FALLBACK_SUGGESTIONS.forEach((f) => qs.add(f));
  QUICK_PROMPT_TOPICS.forEach((q) => qs.add(q.prompt));
  const missing = [...qs].filter((q) => !HINGLISH_QUESTIONS[q] || !HINDI_QUESTIONS[q]);
  assert.deepEqual(missing, []);
  for (const q of qs) assert.ok(DEV.test(HINDI_QUESTIONS[q]) || /PCOS|PMS/.test(HINDI_QUESTIONS[q]), q);
});
test('every action button label is translated', () => {
  const labels = new Set<string>();
  for (const i of INTENTS) for (const c of ctxVariants) i.reply(c).actions?.forEach((a) => labels.add(a.label));
  const missing = [...labels].filter((l) => translateActionLabel(l, 'hi') === l && !/^(NCW|Emergency|Women)/.test(l));
  assert.deepEqual(missing, []);
});

// ─── Replies in the chosen language ────────────────────────
const appCtx: any = {
  userName: 'Priya Sharma',
  cycle: { currentDay: 23, phase: 'luteal', hasCycleData: true, isIrregular: false, label: 'Day 23', conditions: [], expectedLength: 28, lastPeriodDate: '', progesteroneStatus: 'peak' },
  biometrics: {}, symptomLogs: [], fineTuningSettings: {}, mode: 'empathetic_counsellor',
  cyclePrediction: { nextPeriodDate: 'Nov 25', daysUntilNextPeriod: 4, ovulationWindow: 'Nov 8 – 12', predictedCycleLength: 29 },
};
test('Auto answers in the language she writes in', () => {
  const a = buildYourGoGirlReply('pet dard ho raha hai', { ...appCtx, language: 'auto' });
  assert.equal(a.lang, 'hinglish'); assert.equal(a.intentId, 'cramps'); assert.match(a.text, /dard/);
  const b = buildYourGoGirlReply('पेट में बहुत दर्द हो रहा है', { ...appCtx, language: 'auto' });
  assert.equal(b.lang, 'hi'); assert.ok(DEV.test(b.text)); assert.ok(DEV.test(b.gentleActionSteps![0]));
  const c = buildYourGoGirlReply('my stomach hurts so much on my period', { ...appCtx, language: 'auto' });
  assert.equal(c.lang, 'en');
  const d = buildYourGoGirlReply('thanks', { ...appCtx, language: 'auto', previousLang: 'hi' });
  assert.equal(d.lang, 'hi'); assert.ok(DEV.test(d.text));
});
test('fixed language wins; chips show her language but send English wording', () => {
  const r = buildYourGoGirlReply('How can I reduce period cramps?', { ...appCtx, language: 'hinglish' });
  assert.equal(r.lang, 'hinglish');
  assert.equal(r.followUpSuggestions!.length, r.followUpQueries!.length);
  assert.ok(r.followUpQueries!.every((q) => /^[\x00-\x7F’—]+$/.test(q)));
  assert.notDeepEqual(r.followUpSuggestions, r.followUpQueries);
  for (const q of r.followUpQueries!) assert.ok(matchIntent(q).intent, q);
  assert.ok(r.actions!.some((a) => a.label === 'Dard log karo'));
  const h = buildYourGoGirlReply('I want to kill myself', { ...appCtx, language: 'hi' });
  assert.equal(h.urgent, true); assert.ok(DEV.test(h.text)); assert.ok(h.actions!.some((a) => a.value === '14416'));
});
test('fallback and welcome are translated', () => {
  const f = buildYourGoGirlReply('asdfgh qwerty', { ...appCtx, language: 'hi' });
  assert.ok(DEV.test(f.text)); assert.equal(f.followUpQueries!.length, 4);
  assert.ok(DEV.test(createInitialWelcomeMessage('Priya', 'hi').text));
  assert.match(createInitialWelcomeMessage('Priya', 'hinglish').text, /pucho/);
});

// ─── Doctor-visit prep ─────────────────────────────────────
const basePrep: any = { symptomLogs: [], sleepLogs: [], pastCycles: [], cyclePrediction: { regularityStatus: 'regular' }, healthCheck: {}, assessmentAnswers: {}, sleepTarget: 8 };
test('doctor prep: five general questions with no data', () => {
  const p = buildDoctorQuestions(basePrep, 'en');
  assert.equal(p.questions.length, 5); assert.equal(p.generalOnly, true);
});
test('doctor prep: questions come from her logs and referral', () => {
  const logs = [
    { id: '1', date: daysAgoKey(2), timestamp: '', pain: 9, flow: 'heavy' },
    { id: '2', date: daysAgoKey(3), timestamp: '', flow: 'severe', mood: 1 },
    { id: '3', date: daysAgoKey(4), timestamp: '', mood: 2, digestive: ['bloating', 'nausea'] },
    { id: '4', date: daysAgoKey(5), timestamp: '', mood: 1, digestive: ['bloating'] },
    { id: '5', date: daysAgoKey(6), timestamp: '', digestive: ['bloating'] },
  ];
  const cycles = [
    { id: 'a', cycleNumber: 1, startDate: daysAgoKey(3), daysAgo: 3, lengthDays: 41, periodDurationDays: 6 },
    { id: 'b', cycleNumber: 2, startDate: daysAgoKey(44), daysAgo: 44, lengthDays: 23, periodDurationDays: 5 },
  ];
  const p = buildDoctorQuestions({ ...basePrep, symptomLogs: logs, pastCycles: cycles, cyclePrediction: { regularityStatus: 'irregular_pcos' }, healthCheck: { hc_between: true } }, 'en');
  const ids = p.questions.map((q) => q.id);
  assert.equal(p.generalOnly, false);
  assert.deepEqual(ids.slice(0, 4), ['heavy', 'between', 'pain', 'irregular']);
  assert.match(p.questions.find((q) => q.id === 'pain')!.because, /9\/10/);
  assert.match(p.questions.find((q) => q.id === 'irregular')!.because, /23 to 41/);
  const hi = buildDoctorQuestions({ ...basePrep, symptomLogs: logs, pastCycles: cycles }, 'hi');
  assert.ok(hi.questions.every((q) => DEV.test(q.question)));
  const urgent = buildDoctorQuestions({ ...basePrep, healthCheck: { hc_fever: true } }, 'en');
  assert.equal(urgent.questions[0].id, 'urgent'); assert.equal(urgent.level, 'urgent');
});
test('doctor prep in the chat (all three languages)', () => {
  const getDoctorPrepInput = () => basePrep;
  for (const [text, lang] of [
    ['Help me prepare questions for my doctor visit', 'en'],
    ['what should i ask my gynaecologist', 'en'],
    ['doctor se kya puchu', 'hinglish'],
    ['डॉक्टर से क्या पूछूँ', 'hi'],
  ] as const) {
    const r = buildYourGoGirlReply(text, { ...appCtx, language: 'auto', getDoctorPrepInput });
    assert.equal(r.intentId, 'doctor_prep', text);
    assert.equal(r.lang, lang, text);
    assert.equal(r.gentleActionSteps!.length, 5);
    assert.ok(r.actions!.some((a) => a.kind === 'share' && a.value.includes('1.')));
  }
  // "ask my doctor about PCOS" is a PCOS question, not prep; safety always wins.
  assert.equal(buildYourGoGirlReply('should i ask my doctor about pcos', { ...appCtx, getDoctorPrepInput }).intentId, 'pcos');
  assert.equal(buildYourGoGirlReply('I want to kill myself, what should I ask the doctor', { ...appCtx, getDoctorPrepInput }).intentId, 'crisis_selfharm');
});

// ─── Digestive ─────────────────────────────────────────────
test('tummy summary: counts days, near-period days and persistent bloating', () => {
  const logs: any[] = [];
  for (let d = 0; d < 14; d++) logs.push({ id: `b${d}`, date: daysAgoKey(d), timestamp: '', digestive: ['bloating'] });
  logs.push({ id: 'x', date: daysAgoKey(2), timestamp: '', digestive: ['nausea', 'junk'] });
  const cycles: any[] = [{ id: 'c', cycleNumber: 1, startDate: daysAgoKey(1), daysAgo: 1, lengthDays: 28, periodDurationDays: 5 }];
  const s = summariseDigestive(logs, cycles, 30);
  assert.equal(s.days, 14); assert.equal(s.bySymptom.bloating, 14); assert.equal(s.bySymptom.nausea, 1);
  assert.equal(s.persistentBloating, true); assert.equal(s.nearPeriodDays, 7); // 5 days before + 2 period days so far
  assert.deepEqual(cleanDigestive(['nausea', 'nausea', 'x', 3]), ['nausea']);
});

// ─── Chat export ───────────────────────────────────────────
test('chat export is readable text without markdown', () => {
  const txt = chatToText([
    { id: '1', sender: 'user', text: 'pet dard', timestamp: '10:00', createdAt: '2026-11-18T04:30:00.000Z' },
    { id: '2', sender: 'bot', text: 'Try **heat**', timestamp: '10:00', gentleActionSteps: ['**Heat**: a bag'], whenToSeeDoctor: 'If it stops your day', biologicalWhy: 'Prostaglandins' },
  ] as any, 'Priya Sharma', new Date('2026-11-18T05:00:00Z'));
  assert.match(txt, /Priya:\npet dard/); assert.match(txt, /YourGoGirl:\nTry heat/); assert.ok(!txt.includes('**'));
  assert.match(txt, /• Heat: a bag/); assert.match(txt, /When to see a doctor: If it stops your day/);
  assert.equal(chatFileName(new Date(2026, 10, 8)), 'unnmegh-chat-2026-11-08.txt');
});

// ─── Myths ─────────────────────────────────────────────────
test('myth-buster: unique cards, one per day, rotates', () => {
  assert.ok(PERIOD_MYTHS.length >= 25);
  assert.equal(new Set(PERIOD_MYTHS.map((m) => m.id)).size, PERIOD_MYTHS.length);
  for (const m of PERIOD_MYTHS) assert.ok(m.myth && m.fact && m.why && /^https:\/\//.test(m.source.url), m.id);
  const a = mythForDate(new Date(2026, 10, 18, 8)); const b = mythForDate(new Date(2026, 10, 18, 22)); const c = mythForDate(new Date(2026, 10, 19, 8));
  assert.equal(a.id, b.id); assert.notEqual(a.id, c.id);
});

// ─── Speech helpers ────────────────────────────────────────
test('speech: final results join without repeats', () => {
  assert.equal(mergeFinal('', 'I feel tired'), 'I feel tired');
  assert.equal(mergeFinal('I feel tired', 'and my back hurts'), 'I feel tired and my back hurts');
  assert.equal(mergeFinal('I feel tired', 'I feel tired and my back hurts'), 'I feel tired and my back hurts');
  assert.equal(mergeFinal('I feel tired and sad', 'and sad'), 'I feel tired and sad');
  assert.equal(liveText('I feel tired', 'and my'), 'I feel tired and my');
});

// ─── App lock ──────────────────────────────────────────────
test('app lock: PIN hashed, verified, rate-limited and cleared', async () => {
  const { enableAppLock, verifyPin, disableAppLock, isValidPin } = await import('@/lib/appLock');
  const { useLockStore } = await import('@/store/useLockStore');
  const ss: any = await import('expo-secure-store');
  assert.equal(isValidPin('12a4'), false); assert.equal(isValidPin('12345'), false); assert.equal(isValidPin('123456'), true);
  await enableAppLock('2468', true);
  const raw = ss.__mem.get('shesync.applock.pin');
  assert.ok(raw && !raw.includes('2468'));
  assert.equal(useLockStore.getState().enabled, true); assert.equal(useLockStore.getState().pinLength, 4);
  assert.equal(await verifyPin('2468'), true); assert.equal(await verifyPin('2469'), false);
  const s = useLockStore.getState();
  for (let i = 0; i < 4; i++) s.recordFailure();
  assert.equal(useLockStore.getState().blockedUntil, 0);
  s.recordFailure();
  assert.ok(useLockStore.getState().blockedUntil > Date.now() + 25_000);
  s.recordFailure();
  assert.ok(useLockStore.getState().blockedUntil > Date.now() + 55_000);
  useLockStore.getState().setLocked(true); assert.equal(useLockStore.getState().locked, true);
  useLockStore.getState().recordSuccess();
  assert.equal(useLockStore.getState().failed, 0); assert.equal(useLockStore.getState().locked, false);
  await disableAppLock();
  assert.equal(useLockStore.getState().enabled, false); assert.equal(ss.__mem.has('shesync.applock.pin'), false);
  useLockStore.getState().setLocked(true); assert.equal(useLockStore.getState().locked, false); // can't lock when off
});

// ─── Daily check-in in the store ───────────────────────────
test('check-in: one per day, updated in place, sleep saved, data cleaned', async () => {
  const { useAppStore } = await import('@/store/useAppStore');
  const st = useAppStore.getState();
  st.signup('Priya', 'priya@example.com');
  useAppStore.getState().saveCheckIn({ mood: 2, pain: 6, digestive: ['bloating', 'oops' as any] }, 6.5);
  let s = useAppStore.getState();
  assert.equal(s.symptomLogs.length, 1);
  assert.deepEqual(s.symptomLogs[0].digestive, ['bloating']);
  assert.equal(s.symptomLogs[0].checkIn, true);
  assert.equal(s.sleepLogs[0].hours, 6.5); assert.equal(s.sleepLogs[0].date, todayKey());
  const id = s.symptomLogs[0].id;
  useAppStore.getState().logSymptom({ pain: 3 }); // a separate detailed log
  useAppStore.getState().saveCheckIn({ flow: 'heavy', pain: 8 });
  s = useAppStore.getState();
  assert.equal(s.symptomLogs.length, 2);
  const ci = s.symptomLogs.find((l) => l.checkIn)!;
  assert.equal(ci.id, id); assert.equal(ci.pain, 8); assert.equal(ci.mood, 2); assert.equal(ci.flow, 'heavy');
  assert.equal(s.symptomLogs[0].id, id); // newest first so "today" reads the check-in
  assert.equal(s.cycle.phase === 'menstrual' || s.cycle.label.length > 0, true);
  useAppStore.getState().deleteSymptomLog(id);
  assert.equal(useAppStore.getState().symptomLogs.length, 1);
  // tummy pattern reaches the report
  for (let d = 0; d < 4; d++) useAppStore.getState().logSymptom({ date: daysAgoKey(d), digestive: ['nausea'] });
  assert.ok(useAppStore.getState().clinicalReport.anomalies.some((a) => a.type === 'digestive'));
  // chat delete one / all
  useAppStore.getState().addYourGoGirlMessage({ id: 'm1', sender: 'user', text: 'a', timestamp: '' });
  useAppStore.getState().addYourGoGirlMessage({ id: 'm2', sender: 'bot', text: 'b', timestamp: '' });
  useAppStore.getState().deleteYourGoGirlMessage('m1');
  assert.deepEqual(useAppStore.getState().yourGoGirlMessages.map((m) => m.id), ['m2']);
  useAppStore.getState().clearYourGoGirlChat();
  assert.equal(useAppStore.getState().yourGoGirlMessages.length, 0);
});

(async () => {
  for (const [name, fn] of tests) {
    try {
      await fn();
      n++;
    } catch (e: any) {
      console.log(`FAIL ${name}\n  ${e.message?.slice(0, 2000)}`);
      process.exitCode = 1;
    }
  }
  console.log(`\n${n}/${tests.length} round-4 tests passed`);
})();
