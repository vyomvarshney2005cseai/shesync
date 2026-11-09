/**
 * Quick yes/no safety check — step 6 of "Details for Sync".
 *
 * The questions follow the "see a doctor if…" signs used by NHS guidance on
 * heavy periods, period pain, missed periods and toxic shock syndrome, and the
 * FIGO limits for a normal cycle (24–38 days, bleeding ≤ 8 days). Answers feed
 * the referable / not referable result in src/lib/referral.ts.
 */
export interface HealthCheckQuestion {
  id: string;
  question: string;
  hint?: string;
  group: 'Bleeding' | 'Pain' | 'Hormones' | 'Right now' | 'Mind';
}

export const HEALTH_CHECK_QUESTIONS: HealthCheckQuestion[] = [
  {
    id: 'hc_soak',
    group: 'Bleeding',
    question: 'On heavy days, do you change a pad or tampon every 1–2 hours, use two products together, or bleed through clothes or bedding?',
  },
  {
    id: 'hc_long',
    group: 'Bleeding',
    question: 'Does your period usually last more than 7 days?',
  },
  {
    id: 'hc_between',
    group: 'Bleeding',
    question: 'Do you bleed or spot between periods, or after sex?',
    hint: 'Spotting in the first 3 months of starting a hormonal pill or coil is common, but still worth mentioning.',
  },
  {
    id: 'hc_dizzy',
    group: 'Bleeding',
    question: 'During or after your period, do you often feel very tired, dizzy, faint or short of breath?',
  },
  {
    id: 'hc_pain_daily',
    group: 'Pain',
    question: 'Does period pain stop you from going to school, college or work — or do painkillers not help?',
  },
  {
    id: 'hc_pain_other',
    group: 'Pain',
    question: 'Do you get pain when peeing or pooing around your period, or pain during sex?',
  },
  {
    id: 'hc_hair_acne',
    group: 'Hormones',
    question: 'Do you have extra hair on your face, chest or back, or acne that will not settle?',
  },
  {
    id: 'hc_pregnant',
    group: 'Right now',
    question: 'Could you be pregnant? (sex without contraception, or contraception that may have failed, since your last period)',
  },
  {
    id: 'hc_fever',
    group: 'Right now',
    question: 'Right now, do you have a fever with lower-tummy pain, unusual or smelly discharge, or a rash — especially while using a tampon or menstrual cup?',
  },
  {
    id: 'hc_low_mood',
    group: 'Mind',
    question: 'For the past 2 weeks, have you felt down or hopeless, or lost interest in things you usually enjoy, on most days?',
  },
  {
    id: 'hc_self_harm',
    group: 'Mind',
    question: 'Have you had thoughts of hurting yourself, or that you would be better off not here?',
    hint: 'It is okay to answer honestly. If yes, SheSync will show you people you can talk to right now.',
  },
];
