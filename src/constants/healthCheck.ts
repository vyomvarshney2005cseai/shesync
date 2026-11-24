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
  /** "Why we ask": what a yes can point to, in plain words (shown behind the ⓘ). */
  why: string;
  group: 'Bleeding' | 'Pain' | 'Hormones' | 'Right now' | 'Mind';
}

export const HEALTH_CHECK_QUESTIONS: HealthCheckQuestion[] = [
  {
    id: 'hc_soak',
    why: 'Changing every 1–2 hours or doubling up is how doctors (and the NHS) describe heavy menstrual bleeding. It is common and treatable — and over time it can cause low iron (anaemia).',
    group: 'Bleeding',
    question: 'On heavy days, do you change a pad or tampon every 1–2 hours, use two products together, or bleed through clothes or bedding?',
  },
  {
    id: 'hc_long',
    why: 'Most periods last up to 7 days; doctors use 8 days as the upper limit. Longer bleeding is worth checking for treatable causes such as fibroids, polyps or hormone changes.',
    group: 'Bleeding',
    question: 'Does your period usually last more than 7 days?',
  },
  {
    id: 'hc_between',
    why: 'Bleeding between periods or after sex is not part of a normal cycle. The cause is usually simple (an infection, a polyp, or a new pill or coil), but it should always be checked.',
    group: 'Bleeding',
    question: 'Do you bleed or spot between periods, or after sex?',
    hint: 'Spotting in the first 3 months of starting a hormonal pill or coil is common, but still worth mentioning.',
  },
  {
    id: 'hc_dizzy',
    why: 'Feeling very tired, dizzy or breathless can be a sign of anaemia from heavy bleeding. A simple blood test checks your iron.',
    group: 'Bleeding',
    question: 'During or after your period, do you often feel very tired, dizzy, faint or short of breath?',
  },
  {
    id: 'hc_pain_daily',
    why: 'Pain that stops normal life, or does not ease with painkillers, is not something you should have to put up with. It can point to endometriosis or adenomyosis, which doctors can treat.',
    group: 'Pain',
    question: 'Does period pain stop you from going to school, college or work — or do painkillers not help?',
  },
  {
    id: 'hc_pain_other',
    why: 'Pain when peeing, pooing or during sex around your period is a common sign of endometriosis, which often takes years to be diagnosed. Mentioning it early helps.',
    group: 'Pain',
    question: 'Do you get pain when peeing or pooing around your period, or pain during sex?',
  },
  {
    id: 'hc_hair_acne',
    why: 'Extra hair or acne that will not settle can come from higher androgen hormones, as in PCOS — especially together with irregular periods. A doctor can check with a simple blood test.',
    group: 'Hormones',
    question: 'Do you have extra hair on your face, chest or back, or acne that will not settle?',
  },
  {
    id: 'hc_pregnant',
    why: 'A late or unusual period can mean pregnancy, and some advice — medicines, exercise, fasting — changes if you might be pregnant. Most home tests work from the day your period was due.',
    group: 'Right now',
    question: 'Could you be pregnant? (sex without contraception, or contraception that may have failed, since your last period)',
  },
  {
    id: 'hc_fever',
    why: 'Fever with tummy pain or unusual discharge can be an infection (such as pelvic inflammatory disease) that needs treatment soon. With a tampon or cup, fever and a rash can be toxic shock syndrome — rare, but urgent.',
    group: 'Right now',
    question: 'Right now, do you have a fever with lower-tummy pain, unusual or smelly discharge, or a rash — especially while using a tampon or menstrual cup?',
  },
  {
    id: 'hc_low_mood',
    why: 'Low mood most days for 2 weeks can be depression — or PMDD if it follows your cycle. Both are common and treatable; your answer helps SheSync point you to the right support.',
    group: 'Mind',
    question: 'For the past 2 weeks, have you felt down or hopeless, or lost interest in things you usually enjoy, on most days?',
  },
  {
    id: 'hc_self_harm',
    why: 'We ask so that, if you are struggling, SheSync can show you people you can talk to straight away. Your answer stays private.',
    group: 'Mind',
    question: 'Have you had thoughts of hurting yourself, or that you would be better off not here?',
    hint: 'It is okay to answer honestly. If yes, SheSync will show you people you can talk to right now.',
  },
];
