import { INTENTS } from '@/lib/yourGoGirlKnowledge';
import { matchIntent, buildYourGoGirlReply, QUICK_PROMPT_TOPICS } from '@/lib/yourGoGirlEngine';

let fail = 0, pass = 0;
function expect(text: string, id: string | null) {
  const m = matchIntent(text);
  const got = m.intent?.id ?? null;
  if (got !== id) { fail++; console.log(`FAIL  "${text}" → ${got} (${m.score.toFixed(2)}), expected ${id}`); }
  else pass++;
}
// 1. every example routes to its own intent
for (const i of INTENTS) for (const ex of i.examples) expect(ex, i.id);
// 2. every follow-up and quick prompt routes somewhere (not fallback)
const ids = new Set(INTENTS.map(i => i.id));
for (const i of INTENTS) for (const f of i.followUps) { const m = matchIntent(f); if (!m.intent) { fail++; console.log(`FAIL followUp of ${i.id}: "${f}" → fallback ${m.score.toFixed(2)}`);} else pass++; }
for (const q of QUICK_PROMPT_TOPICS.filter((q) => q.id !== 'doctor_prep')) { const m = matchIntent(q.prompt); if (!m.intent) { fail++; console.log(`FAIL quick "${q.prompt}"`);} else pass++; }
// 3. realistic phrasing
const cases: [string, string|null][] = [
  ['My stomach hurts so much on my period what do i do', 'cramps'],
  ['cramps are killing me', 'cramps'],
  ['period pain', 'cramps'],
  ['periods 5 din late hai', 'late_period'],
  ['My period is 12 days late and test is negative', 'late_period'],
  ['is it normal to have a 35 day cycle?', 'cycle_basics'],
  ['when will i get my next period', 'next_period'],
  ['what day of my cycle am i on', 'my_phase'],
  ['I think I have PCOS', 'pcos'],
  ['pcod diet plan', 'pcos_diet'],
  ['how much bleeding is too much', 'heavy_bleeding'],
  ['I am soaking a pad every hour and feel dizzy', 'emergency_bleeding'],
  ['I fainted during my period today', 'emergency_bleeding'],
  ['I want to kill myself', 'crisis_selfharm'],
  ['sometimes i think about hurting myself', 'crisis_selfharm'],
  ['my husband hits me', 'abuse_violence'],
  ['I have fever and rash and I am using a tampon', 'fever_pelvic'],
  ['i might be pregnant and have sharp pain on one side', 'pregnancy_emergency'],
  ['sudden severe pain in my lower right tummy', 'severe_sudden_pain'],
  ['feeling very anxious before exam tomorrow', 'exam'],
  ['i feel so sad and empty', 'low_mood'],
  ['I am really stressed with college work', 'stress'],
  ['I keep snapping at my mom before my period', 'anger'],
  ['what is endometriosis', 'endometriosis'],
  ['can i take meftal spas for cramps', 'painkillers'],
  ['my back hurts during periods', 'back_leg_pain'],
  ['i feel bloated', 'bloating'],
  ['white discharge with itching', 'discharge'],
  ['burning while peeing', 'uti'],
  ['how often should i change a tampon', 'hygiene'],
  ['can i wash hair in periods', 'myths'],
  ['i am always tired and dizzy', 'fatigue'],
  ['what to eat in periods', 'period_food'],
  ['I craving chocolate so much', 'cravings'],
  ['is it ok to go to gym during periods', 'exercise_period'],
  ['pimples before period', 'acne'],
  ['hair on my chin', 'hair'],
  ['I want to lose weight', 'weight'],
  ['what is the luteal phase', 'phases_explained'],
  ['when am i fertile', 'ovulation'],
  ['brown spotting before period', 'spotting'],
  ['blood clots in period', 'blood_colour'],
  ['my period lasted 9 days', 'period_length'],
  ['i got my first period today', 'first_period'],
  ['i missed my birth control pill', 'birth_control'],
  ['took ipill yesterday', 'emergency_pill'],
  ['i feel lonely', 'lonely'],
  ['i hate my body', 'body_image'],
  ['I feel so lazy and guilty', 'guilt'],
  ['no motivation to study', 'motivation'],
  ['brain fog', 'focus'],
  ['i broke up with my boyfriend', 'relationship'],
  ['can you calm me down', 'grounding'],
  ['how to tell my professor i have cramps', 'explain_others'],
  ['i need someone to talk to', 'counsellor'],
  ['do i need to see a gyno', 'see_doctor'],
  ['hello', 'greeting'],
  ['thank you so much', 'thanks'],
  ['who are you', 'about_bot'],
  ['how do i log my mood', 'app_help'],
  ['thyroid', 'thyroid'],
  ['headache before period', 'headache'],
  ['loose motions in periods', 'digestion'],
  ['sore breasts', 'breast_pain'],
  ['cant sleep', 'sleep'],
  ['what is the capital of france', null],
  ['asdfgh', null],
];
for (const [t, id] of cases) expect(t, id);
// 4. replies build without throwing, with and without cycle data
const baseCtx: any = { userName: 'Priya Sharma', cycle: { currentDay: 23, phase: 'luteal', hasCycleData: true, isIrregular: false, label: 'Day 23', conditions: [], expectedLength: 28, lastPeriodDate: '', progesteroneStatus: 'peak' }, biometrics: {}, symptomLogs: [], fineTuningSettings: {}, mode: 'empathetic_counsellor', cyclePrediction: { nextPeriodDate: 'Nov 15', daysUntilNextPeriod: 6, ovulationWindow: 'Oct 29 – Nov 2', predictedCycleLength: 29 } };
const noData: any = { ...baseCtx, cycle: { ...baseCtx.cycle, hasCycleData: false, currentDay: 0, phase: 'irregular' }, cyclePrediction: undefined };
for (const i of INTENTS) {
  for (const c of [baseCtx, noData]) {
    const ex = i.examples[0] ?? 'I want to kill myself';
    const msg = buildYourGoGirlReply(ex, c);
    if (!msg.text || /undefined|NaN|\[object/.test(JSON.stringify(msg))) { fail++; console.log('BAD REPLY', i.id, msg.text.slice(0,80)); }
  }
}
// continuation
const cont = buildYourGoGirlReply('tell me more', { ...baseCtx, lastIntentId: 'cramps' });
console.log('continue →', cont.intentId, cont.followUpSuggestions);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
