import type {
  AppState,
  ReferralLevel,
  ReferralReason,
  ReferralResult,
} from '@/types';
import { daysSinceKey } from '@/lib/dates';

/**
 * Referable / not referable — a screening guide, never a diagnosis.
 *
 * "Referable" means at least one answer matches a sign that health services
 * say should be checked by a doctor (usually a gynaecologist):
 *  - cycles outside the FIGO normal range (24–38 days), very irregular cycles,
 *    or no period for 3+ months (NHS: see a GP after 3 missed periods);
 *  - heavy bleeding: changing protection every 1–2 hours, double protection,
 *    flooding, periods longer than 7 days, clots, feeling faint/breathless;
 *  - bleeding between periods or after sex;
 *  - period pain that stops daily life or does not respond to painkillers,
 *    or pain when peeing/pooing/during sex (possible endometriosis);
 *  - signs that may point to PCOS (irregular cycles with excess hair/acne);
 *  - fever with pelvic pain/discharge/rash (urgent: infection or toxic shock).
 * A counsellor is suggested separately for low mood, anxiety or severe PMS.
 */

type ReferralInput = Pick<
  AppState,
  'assessmentAnswers' | 'healthCheck' | 'symptomLogs' | 'pastCycles' | 'cyclePrediction'
>;

const ORDER: Record<ReferralLevel, number> = { none: 0, routine: 1, soon: 2, urgent: 3 };

export const REFERRAL_LEVEL_TEXT: Record<ReferralLevel, { title: string; when: string }> = {
  urgent: { title: 'Get medical help today', when: 'Please see a doctor today or go to the nearest hospital emergency.' },
  soon: { title: 'Book a gynaecologist visit soon', when: 'Try to see a gynaecologist in the next 1–2 weeks.' },
  routine: { title: 'Plan a gynaecologist check-up', when: 'Book a check-up when you can — within the next month or two.' },
  none: { title: 'No warning signs found', when: 'Keep tracking. Re-check if anything below changes.' },
};

export function assessReferral(input: ReferralInput): ReferralResult {
  const a = input.assessmentAnswers ?? {};
  const hc = input.healthCheck ?? {};
  const reasons: ReferralReason[] = [];
  const counsellorReasons: ReferralReason[] = [];
  const add = (r: ReferralReason) => {
    if (!reasons.some((x) => x.id === r.id)) reasons.push(r);
  };

  // ── Recent logs (last 60 days) ──────────────────────────
  const recent = input.symptomLogs.filter((l) => {
    const age = daysSinceKey(l.date);
    return age >= 0 && age <= 60;
  });
  const maxPain = Math.max(0, ...recent.map((l) => (typeof l.pain === 'number' ? l.pain : 0)));
  const loggedVeryHeavy = recent.some((l) => l.flow === 'severe');
  const loggedHeavy = recent.some((l) => l.flow === 'heavy');
  const lowMoodDays = new Set(
    recent
      .filter((l) => daysSinceKey(l.date) <= 14 && typeof l.mood === 'number' && (l.mood as number) <= 2)
      .map((l) => l.date)
  ).size;
  const anxiousTags = recent.some(
    (l) => daysSinceKey(l.date) <= 14 && (l.tags ?? []).some((t) => t === 'Anxious' || t === 'Overwhelmed')
  );

  // ── Urgent: fever with pelvic pain / discharge / rash ───
  if (hc.hc_fever) {
    add({
      id: 'fever',
      level: 'urgent',
      specialist: 'doctor',
      title: 'Fever with tummy pain, discharge or a rash',
      detail:
        'This can be an infection that needs treatment quickly. If you are using a tampon or menstrual cup, take it out now and tell the doctor you were using one.',
    });
  }

  // ── Possible pregnancy ──────────────────────────────────
  const pregnancyTestFirst = !!hc.hc_pregnant;
  if (hc.hc_pregnant && (maxPain >= 7 || hc.hc_between)) {
    add({
      id: 'pregnancy-pain',
      level: 'urgent',
      specialist: 'doctor',
      title: 'Possible pregnancy with strong pain or bleeding',
      detail:
        'Pain on one side of the tummy or bleeding when you might be pregnant needs to be checked the same day.',
    });
  }

  // ── Cycle length & regularity ───────────────────────────
  const pcosSigns = !!hc.hc_hair_acne || a.q9 === 'q9_opt3';
  if (a.q1 === 'q1_opt5') {
    add({
      id: 'no-period',
      level: 'soon',
      specialist: 'gynaecologist',
      title: 'No period for 3 months or more',
      detail:
        'Take a pregnancy test first if there is any chance. Common causes include PCOS, thyroid problems, stress, weight change or over-exercising — a doctor can check with simple blood tests.',
    });
  } else if (a.q1 === 'q1_opt3' || a.q1 === 'q1_opt4' || input.cyclePrediction?.regularityStatus === 'irregular_pcos') {
    add({
      id: 'irregular',
      level: pcosSigns ? 'soon' : 'routine',
      specialist: 'gynaecologist',
      title: a.q1 === 'q1_opt3' ? 'Long cycles (more than 35 days)' : 'Irregular cycles',
      detail: pcosSigns
        ? 'Irregular cycles together with extra hair, acne or energy crashes can be signs of PCOS. A gynaecologist can check with an ultrasound and blood tests.'
        : 'Cycles that are often longer than 38 days or change by more than about a week are worth checking. In the first 2–3 years after periods start, irregular cycles are common.',
    });
  } else if (a.q1 === 'q1_opt2') {
    add({
      id: 'short-cycles',
      level: 'routine',
      specialist: 'gynaecologist',
      title: 'Short cycles (less than 24 days)',
      detail: 'Periods that come more often than every 24 days are outside the normal range and worth a check-up.',
    });
  }
  if (pcosSigns && !reasons.some((r) => r.id === 'irregular') && hc.hc_hair_acne) {
    add({
      id: 'hair-acne',
      level: 'routine',
      specialist: 'gynaecologist',
      title: 'Extra hair or stubborn acne',
      detail: 'Worth mentioning at a check-up — hormone levels (such as androgens) can be tested.',
    });
  }

  // ── Heavy bleeding ──────────────────────────────────────
  const heavySigns = [
    hc.hc_soak && 'changing protection every 1–2 hours or bleeding through',
    hc.hc_long && 'periods longer than 7 days',
    loggedVeryHeavy && 'very heavy flow / clots logged',
    a.q2 === 'q2_opt4' && 'very heavy flow you described',
  ].filter(Boolean) as string[];
  if (heavySigns.length) {
    add({
      id: 'heavy',
      level: 'soon',
      specialist: 'gynaecologist',
      title: 'Heavy or long periods',
      detail: `You told SheSync about ${heavySigns.join(', ')}. Heavy periods are treatable — ask the doctor about an iron (haemoglobin/ferritin) test too.`,
    });
  } else if (a.q2 === 'q2_opt3' || loggedHeavy) {
    add({
      id: 'heavy-mild',
      level: 'routine',
      specialist: 'gynaecologist',
      title: 'Heavy flow with clots',
      detail: 'Passing clots bigger than a ₹2 coin or flow that affects daily life is worth a check-up, including an iron test.',
    });
  }
  if (hc.hc_dizzy) {
    add({
      id: 'anaemia',
      level: 'soon',
      specialist: 'doctor',
      title: 'Feeling faint, dizzy or breathless',
      detail:
        'This can be a sign of low iron (anaemia), especially with heavy periods. If you faint or feel this way while bleeding heavily right now, get care today.',
    });
  }

  // ── Bleeding between periods / after sex ───────────────
  if (hc.hc_between) {
    add({
      id: 'between',
      level: 'soon',
      specialist: 'gynaecologist',
      title: 'Bleeding between periods or after sex',
      detail: 'Usually not serious, but it should always be checked by a doctor.',
    });
  }

  // ── Pain ────────────────────────────────────────────────
  if (hc.hc_pain_daily || a.q2 === 'q2_opt4' || maxPain >= 8) {
    add({
      id: 'pain-severe',
      level: 'soon',
      specialist: 'gynaecologist',
      title: 'Period pain that stops your day',
      detail:
        'Pain that keeps you from school or work, or that painkillers do not help, is not something to just put up with. Conditions like endometriosis or adenomyosis can cause it and can be treated.',
    });
  } else if (maxPain >= 7) {
    add({
      id: 'pain-strong',
      level: 'routine',
      specialist: 'gynaecologist',
      title: `Strong period pain logged (${maxPain}/10)`,
      detail: 'Mention it at a check-up, especially if it is getting worse cycle after cycle.',
    });
  }
  if (hc.hc_pain_other) {
    add({
      id: 'pain-other',
      level: 'soon',
      specialist: 'gynaecologist',
      title: 'Pain when peeing, pooing or during sex',
      detail: 'Together with period pain, this is one of the signs doctors look for when checking for endometriosis.',
    });
  }

  // ── Mind: counsellor ────────────────────────────────────
  const crisis = !!hc.hc_self_harm;
  if (crisis) {
    counsellorReasons.push({
      id: 'crisis',
      level: 'urgent',
      specialist: 'counsellor',
      title: 'You mentioned thoughts of hurting yourself',
      detail: 'You deserve support right now. Tele-MANAS (14416) is free, confidential and open 24×7.',
    });
  }
  if (a.q7 === 'q7_opt4') {
    counsellorReasons.push({
      id: 'pmdd',
      level: 'soon',
      specialist: 'counsellor',
      title: 'Severe mood changes before your period',
      detail:
        'Intense low mood, anger or anxiety in the days before a period (sometimes PMDD) is treatable. A counsellor can help, and a gynaecologist or psychiatrist can discuss medical options.',
    });
    add({
      id: 'pmdd-doctor',
      level: 'routine',
      specialist: 'gynaecologist',
      title: 'Severe pre-period mood symptoms',
      detail: 'Track mood for 2 cycles and show the doctor — it helps confirm PMS/PMDD.',
    });
  }
  if (hc.hc_low_mood || lowMoodDays >= 3) {
    counsellorReasons.push({
      id: 'low-mood',
      level: 'soon',
      specialist: 'counsellor',
      title: 'Low mood most days',
      detail: 'Feeling down for 2 weeks or more is a good reason to talk to a counsellor. It is free and private.',
    });
  }
  if (a.q6 === 'q6_opt3' || anxiousTags) {
    counsellorReasons.push({
      id: 'anxiety',
      level: 'routine',
      specialist: 'counsellor',
      title: 'Anxiety or feeling overwhelmed',
      detail: 'A counsellor can teach you tools that make anxious mornings and racing thoughts easier.',
    });
  }

  const level = reasons.reduce<ReferralLevel>((acc, r) => (ORDER[r.level] > ORDER[acc] ? r.level : acc), 'none');
  reasons.sort((x, y) => ORDER[y.level] - ORDER[x.level]);
  counsellorReasons.sort((x, y) => ORDER[y.level] - ORDER[x.level]);

  return {
    referable: reasons.length > 0,
    level,
    reasons,
    counsellorSuggested: counsellorReasons.length > 0,
    counsellorReasons,
    crisis,
    pregnancyTestFirst,
    watchFor: [
      'You start changing pads every 1–2 hours, or bleed for more than 7 days',
      'Your period is 3 months late (after a negative pregnancy test)',
      'Pain stops you from studying or working, or painkillers stop helping',
      'You bleed between periods or after sex',
      'You feel low or hopeless on most days for 2 weeks',
    ],
  };
}
