/**
 * PCOS mode content.
 *
 * Follows the 2023 International Evidence-based Guideline for PCOS
 * (Monash University; endorsed by ASRM, ESHRE and others), which keeps the
 * Rotterdam criteria: in adults, 2 of 3 —
 *   1. irregular cycles / ovulation problems,
 *   2. signs of high androgens (on the body or in a blood test),
 *   3. polycystic ovaries on ultrasound, or a raised AMH blood test —
 * after other causes are ruled out. In teenagers both 1 and 2 are needed and
 * scans/AMH are not used (within 8 years of the first period).
 *
 * SheSync only helps her notice and record signs. It never diagnoses.
 */
import type { PastCycleRecord } from '@/types';
import type { PcosCheckin, Told } from '@/store/usePcosStore';

export const SIGN_LEVELS = ['None', 'Mild', 'Moderate', 'A lot'] as const;

export const SIGN_QUESTIONS: { id: 'acne' | 'bodyHair' | 'hairThinning' | 'darkPatches'; label: string; help: string }[] = [
  { id: 'bodyHair', label: 'Extra facial or body hair', help: 'Thick, dark hair on the chin, upper lip, chest or tummy.' },
  { id: 'acne', label: 'Acne', help: 'Especially along the jaw, and not settling with usual care.' },
  { id: 'hairThinning', label: 'Hair thinning on the scalp', help: 'A wider parting or thinner hair on top.' },
  { id: 'darkPatches', label: 'Dark, velvety skin patches', help: 'On the neck, underarms or groin. Can point to insulin resistance.' },
];

export type SignStatus = 'yes' | 'maybe' | 'no' | 'unknown';

export interface CriteriaSummary {
  cycles: { status: SignStatus; detail: string };
  androgens: { status: SignStatus; detail: string };
  ovaries: { status: SignStatus; detail: string };
  /** How many of the three are present ("yes"). */
  count: number;
  /** Enough to be worth a doctor's visit about PCOS. */
  worthChecking: boolean;
}

/** Guideline definition of irregular cycles for adults: shorter than 21 or longer than 35 days. */
const isIrregular = (days: number) => days < 21 || days > 35;

export function summariseCriteria(cycles: PastCycleRecord[], latest: PcosCheckin | undefined, scan: Told): CriteriaSummary {
  // 1) Cycles — from her saved periods.
  const lengths = cycles.slice(0, 8).map((c) => c.lengthDays).filter((n) => n > 0);
  let cyc: CriteriaSummary['cycles'];
  if (lengths.length < 3) {
    cyc = { status: 'unknown', detail: 'Save at least 3 periods so SheSync can see your pattern.' };
  } else {
    const off = lengths.filter(isIrregular).length;
    cyc =
      off >= 2
        ? { status: 'yes', detail: `${off} of your last ${lengths.length} cycles were shorter than 21 or longer than 35 days.` }
        : off === 1
          ? { status: 'maybe', detail: `1 of your last ${lengths.length} cycles was outside 21–35 days. One odd cycle is common.` }
          : { status: 'no', detail: `Your last ${lengths.length} cycles were all 21–35 days.` };
  }

  // 2) Androgen signs — from her latest check-in. Extra hair is the strongest
  // sign on the body; acne or hair thinning alone are weaker.
  let and: CriteriaSummary['androgens'];
  if (!latest) and = { status: 'unknown', detail: 'Do a quick check-in below.' };
  else if (latest.bodyHair >= 2) and = { status: 'yes', detail: 'You noted moderate or more extra facial/body hair.' };
  else if (latest.bodyHair === 1 || latest.acne >= 2 || latest.hairThinning >= 2)
    and = { status: 'maybe', detail: 'You noted some skin or hair signs. A blood test can check hormone levels.' };
  else and = { status: 'no', detail: 'No clear skin or hair signs in your latest check-in.' };

  // 3) Ovaries — only a scan or blood test can tell.
  const ov: CriteriaSummary['ovaries'] =
    scan === 'yes'
      ? { status: 'yes', detail: 'A doctor has told you a scan or AMH test showed this.' }
      : scan === 'no'
        ? { status: 'no', detail: 'Your scan or AMH test was normal.' }
        : { status: 'unknown', detail: 'Only an ultrasound or AMH blood test can show this.' };

  const count = [cyc, and, ov].filter((x) => x.status === 'yes').length;
  const maybe = [cyc, and].filter((x) => x.status === 'maybe').length;
  return { cycles: cyc, androgens: and, ovaries: ov, count, worthChecking: count >= 2 || (count === 1 && maybe >= 1) };
}

// ─── Eating well with PCOS (Indian kitchen) ─────────────────
export const MEAL_PRINCIPLES: { title: string; text: string }[] = [
  { title: 'Build a balanced thali', text: 'Half vegetables or salad, a quarter protein (dal, chana, rajma, paneer, curd, egg, fish, chicken), a quarter whole grains.' },
  { title: 'Choose slower carbs', text: 'Roti from whole wheat, jowar, bajra or ragi; brown or hand-pounded rice; oats; poha with vegetables. Keep maida, sweets and sugary drinks for sometimes.' },
  { title: 'Protein at every meal', text: 'It keeps you full and steadies blood sugar: sprouts, besan chilla, curd, dal, soya, eggs, peanuts.' },
  { title: 'Eat on time', text: 'Regular meals work better than skipping and then overeating. Crash diets and long fasts usually backfire.' },
  { title: 'Good fats, small amounts', text: 'A handful of nuts or seeds a day; cook with mustard, groundnut or rice-bran oil rather than vanaspati or reused oil.' },
];

export const SAMPLE_DAY: { meal: string; ideas: string }[] = [
  { meal: 'Breakfast', ideas: 'Besan or moong chilla with curd · vegetable poha with peanuts · 2 eggs with a roti · ragi dosa with sambar' },
  { meal: 'Lunch', ideas: '2 rotis or a small bowl of rice + dal or rajma + a sabzi + salad + curd' },
  { meal: 'Evening', ideas: 'Roasted chana · a fruit with a few nuts · sprouts chaat · buttermilk' },
  { meal: 'Dinner', ideas: 'Like lunch but lighter; finish 2–3 hours before bed. Paneer, fish or chicken with vegetables works well.' },
];

export const MEAL_NOTE =
  'No single “PCOS diet” is proven best — the guideline recommends a balanced way of eating you can keep up. If you have diabetes, thyroid problems or are underweight, plan your meals with a doctor or dietitian.';

// ─── Movement ───────────────────────────────────────────────
export const WEEKLY_MINUTES_GOAL = 150;

export const EXERCISE_PLAN: { day: string; plan: string; minutes: number }[] = [
  { day: 'Mon', plan: 'Brisk walk or cycling', minutes: 30 },
  { day: 'Tue', plan: 'Strength: squats, push-ups, planks', minutes: 20 },
  { day: 'Wed', plan: 'Brisk walk, skipping or dance', minutes: 30 },
  { day: 'Thu', plan: 'Yoga or stretching', minutes: 20 },
  { day: 'Fri', plan: 'Strength: lunges, bridges, rows', minutes: 20 },
  { day: 'Sat', plan: 'Something fun: badminton, a long walk, swimming', minutes: 40 },
  { day: 'Sun', plan: 'Rest or an easy walk', minutes: 0 },
];

export const EXERCISE_NOTE =
  'Aim for at least 150 minutes of moderate activity a week, with muscle-strengthening on 2 days. On period or low-energy days, a gentle walk still counts.';

// ─── Doctor visit ───────────────────────────────────────────
export const DOCTOR_CHECKLIST: { group: string; items: { id: string; label: string; why?: string }[] }[] = [
  {
    group: 'Take with you',
    items: [
      { id: 'report', label: 'Your SheSync doctor report (period dates and symptoms)' },
      { id: 'family', label: 'Family history: diabetes, PCOS, thyroid' },
      { id: 'medicines', label: 'List of medicines and supplements you take' },
    ],
  },
  {
    group: 'Tests doctors often order',
    items: [
      { id: 'androgens', label: 'Testosterone (androgen) blood test', why: 'Checks hormone levels behind acne and extra hair.' },
      { id: 'tsh', label: 'Thyroid (TSH) and prolactin', why: 'To rule out other causes of irregular periods.' },
      { id: 'sugar', label: 'Blood sugar: fasting glucose, HbA1c or a glucose tolerance test', why: 'PCOS raises the chance of diabetes.' },
      { id: 'lipids', label: 'Cholesterol (lipid profile) and blood pressure' },
      { id: 'scan', label: 'Pelvic ultrasound or AMH blood test (adults)', why: 'Not used for teenagers within 8 years of their first period.' },
    ],
  },
  {
    group: 'Questions to ask',
    items: [
      { id: 'q_criteria', label: 'Do I have PCOS, or could it be something else?' },
      { id: 'q_periods', label: 'How do we keep my periods regular enough to protect the womb lining?' },
      { id: 'q_treat', label: 'What are my options: lifestyle, the pill, metformin, skin and hair treatment?' },
      { id: 'q_future', label: 'What does this mean for pregnancy later, and how often should I be checked?' },
      { id: 'q_mood', label: 'I have been feeling low or anxious — can we talk about that too?' },
    ],
  },
];

export const CHECKLIST_TOTAL = DOCTOR_CHECKLIST.reduce((n, g) => n + g.items.length, 0);
