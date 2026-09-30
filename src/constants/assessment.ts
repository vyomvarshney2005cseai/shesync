export interface AssessmentOption {
  id: string;
  label: string;
  description?: string;
  tag?: string;
  points?: {
    strainSensitivity?: number; // 1 (low) to 5 (high)
    pcosRisk?: number;
    pmddRisk?: number;
    cortisolSensitivity?: number;
    recoveryNeed?: number;
  };
}

export interface AssessmentQuestion {
  id: string;
  number: number;
  chapter: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  options: AssessmentOption[];
}

export const ASSESSMENT_CHAPTERS = [
  { id: 'cycle', number: 1, title: 'Hormonal & Cycle Health' },
  { id: 'movement', number: 2, title: 'Strain & Movement' },
  { id: 'sleep', number: 3, title: 'Sleep & Recovery' },
  { id: 'mind', number: 4, title: 'Mental & Somatic Support' },
  { id: 'lifestyle', number: 5, title: 'Metabolism & Health Goals' },
];

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // ─── CHAPTER 1: Hormonal & Menstrual Cycle Health ────────────
  {
    id: 'q1',
    number: 1,
    chapter: 'Hormonal & Cycle Health',
    chapterNumber: 1,
    title: 'How would you describe your typical menstrual cycle length & regularity?',
    subtitle: 'From the first day of one period to the first day of the next.',
    options: [
      { id: 'q1_opt1', label: 'Consistent 26–30 days', description: 'Regular predictable monthly rhythm' },
      { id: 'q1_opt2', label: 'Shorter than 24 days', description: 'Abbreviated follicular phase or frequent cycles' },
      { id: 'q1_opt3', label: 'Longer than 35 days (35–50+)', description: 'Delayed ovulation or extended cycle', points: { pcosRisk: 3 } },
      { id: 'q1_opt4', label: 'Irregular or unpredictable', description: 'Varies by more than 7–10 days each cycle', points: { pcosRisk: 4 } },
      { id: 'q1_opt5', label: 'Absent / Amenorrhea (no period in 90+ days)', description: 'Requiring bio-adaptive hormonal restoration', points: { pcosRisk: 5 } },
    ],
  },
  {
    id: 'q2',
    number: 2,
    chapter: 'Hormonal & Cycle Health',
    chapterNumber: 1,
    title: 'What is your typical menstrual flow intensity and cramping pain level?',
    subtitle: 'Helps calibrate recovery guidelines, strain thresholds, and iron/hydration needs.',
    options: [
      { id: 'q2_opt1', label: 'Light flow with minimal cramps', description: 'Easily manageable with light spotting or liners' },
      { id: 'q2_opt2', label: 'Moderate & balanced flow', description: 'Changing normal protection every 4–6 hours with mild cramps' },
      { id: 'q2_opt3', label: 'Heavy flow with clots & moderate cramps', description: 'Soaking protection in 2–3 hours, radiant lower-back or pelvic ache', points: { recoveryNeed: 3, strainSensitivity: 2 } },
      { id: 'q2_opt4', label: 'Very heavy / Severe debilitating dysmenorrhea', description: 'Hourly saturation, intense pelvic spasms requiring bed rest or medication', points: { recoveryNeed: 4, strainSensitivity: 4 } },
    ],
  },

  // ─── CHAPTER 2: Physical Strain & Movement ───────────────────
  {
    id: 'q3',
    number: 3,
    chapter: 'Strain & Movement',
    chapterNumber: 2,
    title: 'How does your physical energy and stamina fluctuate across your cycle?',
    subtitle: 'Used to calibrate daily adaptive strain targets and workout intensity.',
    options: [
      { id: 'q3_opt1', label: 'High & stable all month', description: 'Sustained vitality from morning through evening' },
      { id: 'q3_opt2', label: 'Good morning energy, normal 3 PM dip', description: 'Standard circadian cortisol dip easily managed' },
      { id: 'q3_opt3', label: 'Cycle surges & crashes (High follicular, wiped in luteal)', description: 'Significant pre-period stamina drop and sluggish recovery', points: { strainSensitivity: 2, pmddRisk: 2 } },
      { id: 'q3_opt4', label: 'Chronic fatigue / Waking exhausted regardless of sleep', description: 'Struggling to regenerate energy reserves', points: { cortisolSensitivity: 4, recoveryNeed: 3 } },
    ],
  },
  {
    id: 'q4',
    number: 4,
    chapter: 'Strain & Movement',
    chapterNumber: 2,
    title: 'What forms of movement and physical strain do you most gravitate toward?',
    subtitle: 'Ensures recommended workouts match your natural capacity.',
    options: [
      { id: 'q4_opt1', label: 'Strength training & progressive lifting', description: 'Barbell, dumbbells, kettlebells, resistance work' },
      { id: 'q4_opt2', label: 'Pilates, barre & low-impact conditioning', description: 'Core stabilization, alignment, mindful toning' },
      { id: 'q4_opt3', label: 'Restorative yoga, stretching & somatic walking', description: 'Gentle nervous system downshifting and active recovery', points: { recoveryNeed: 2 } },
      { id: 'q4_opt4', label: 'Currently rebuilding baseline physical stamina', description: 'Seeking low-strain, parasympathetic starter routines', points: { strainSensitivity: 3, recoveryNeed: 3 } },
    ],
  },

  // ─── CHAPTER 3: Sleep & Recovery ─────────────────────────────
  {
    id: 'q5',
    number: 5,
    chapter: 'Sleep & Recovery',
    chapterNumber: 3,
    title: 'What is your typical sleep duration and nocturnal restorative quality?',
    subtitle: 'Directly influences allostatic load and nervous system repair.',
    options: [
      { id: 'q5_opt1', label: '7.5–9 hours of deep, unbroken sleep', description: 'Consistent bedtime and wake up refreshed' },
      { id: 'q5_opt2', label: '6.5–7 hours with occasional light nighttime wake-ups', description: 'Moderately restorative with slight tiredness' },
      { id: 'q5_opt3', label: 'Disrupted sleep / Insomnia during luteal phase', description: 'Progesterone drops trigger restlessness, night sweats, or frequent waking', points: { pmddRisk: 2, cortisolSensitivity: 2 } },
      { id: 'q5_opt4', label: 'Chronic sleep deficit (<5.5 hours) & frequent sleep fragmentation', description: 'Struggling to achieve restorative REM and deep sleep', points: { cortisolSensitivity: 4, recoveryNeed: 4 } },
    ],
  },
  {
    id: 'q6',
    number: 6,
    chapter: 'Sleep & Recovery',
    chapterNumber: 3,
    title: 'How do you experience your morning awakening and cortisol rhythm?',
    subtitle: 'Detects HPA-axis dysregulation and adrenal fatigue biomarkers.',
    options: [
      { id: 'q6_opt1', label: 'Calm, clear-headed, and alert naturally', description: 'Smooth cortisol awakening response (CAR)' },
      { id: 'q6_opt2', label: 'Sluggish and groggy, needing 30–60 min to feel awake', description: 'Mild sleep inertia or delayed cortisol rise' },
      { id: 'q6_opt3', label: 'Waking with anxiety, rapid heartbeat, or racing thoughts', description: 'Elevated morning cortisol spike or sympathetic overdrive', points: { cortisolSensitivity: 4, strainSensitivity: 2 } },
      { id: 'q6_opt4', label: 'Waking at 2–4 AM unable to fall back asleep', description: 'Adrenal or blood sugar drop typical in luteal phases', points: { cortisolSensitivity: 3, pmddRisk: 2 } },
    ],
  },

  // ─── CHAPTER 4: Mental & Somatic Support ─────────────────────
  {
    id: 'q7',
    number: 7,
    chapter: 'Mental & Somatic Support',
    chapterNumber: 4,
    title: 'Do you experience pre-menstrual syndrome (PMS) or PMDD symptoms?',
    subtitle: 'Occurring in the 7–10 days before your period begins.',
    options: [
      { id: 'q7_opt1', label: 'Little to no premenstrual mood shifts', description: 'Smooth psychological transition into menses' },
      { id: 'q7_opt2', label: 'Mild physical PMS (tender breasts, mild bloating)', description: 'Minimal emotional disruption' },
      { id: 'q7_opt3', label: 'Moderate mood swings, irritability & fatigue', description: 'Noticeable drop in patience, motivation, and social battery', points: { pmddRisk: 2 } },
      { id: 'q7_opt4', label: 'Severe PMDD (intense dysphoria, rage, brain fog, anxiety)', description: 'Profound neuro-endocrine sensitivity altering daily functioning', points: { pmddRisk: 5, cortisolSensitivity: 2, strainSensitivity: 3 } },
    ],
  },
  {
    id: 'q8',
    number: 8,
    chapter: 'Mental & Somatic Support',
    chapterNumber: 4,
    title: 'Which somatic regulation & mind practice appeals to you most?',
    subtitle: 'Shapes your recommended YouTube video therapy and nervous system tools.',
    options: [
      { id: 'q8_opt1', label: 'Somatic Vagus Nerve Grounding & Polyvagal Exercises', description: 'Suboccipital releases, humming, eye movements & YouTube video guides' },
      { id: 'q8_opt2', label: 'Pelvic Floor Release & Somatic Cramp Stretches', description: 'Restorative somatic flows for pain relief and pelvic relaxation' },
      { id: 'q8_opt3', label: 'Bilateral Tapping & Nervous System Calming Flows', description: 'Tactile grounding for acute distress, anxiety & PMDD mood drops' },
      { id: 'q8_opt4', label: 'Diaphragmatic Breathwork & Guided Cognitive Reframing', description: 'Structured breathing cues and CBT mental reset prompts' },
    ],
  },

  // ─── CHAPTER 5: Metabolism & Health Goals ─────────────────────
  {
    id: 'q9',
    number: 9,
    chapter: 'Metabolism & Health Goals',
    chapterNumber: 5,
    title: 'How stable is your metabolic energy and blood sugar between meals?',
    subtitle: 'Key indicator for insulin sensitivity and metabolic hormone balance.',
    options: [
      { id: 'q9_opt1', label: 'Very stable—can fast comfortably without brain fog', description: 'Robust metabolic flexibility and steady glucose' },
      { id: 'q9_opt2', label: 'Afternoon sugar/carb cravings, especially in luteal phase', description: 'Normal progesterone-driven metabolic demand' },
      { id: 'q9_opt3', label: 'Intense energy crashes, shaky when hungry, or PCOS symptoms', description: 'Indicating potential insulin resistance or reactive hypoglycemia', points: { pcosRisk: 4 } },
      { id: 'q9_opt4', label: 'Irregular eating / Skipping meals frequently under stress', description: 'Adrenal strain and skipped hormonal building blocks', points: { cortisolSensitivity: 3 } },
    ],
  },
  {
    id: 'q10',
    number: 10,
    chapter: 'Metabolism & Health Goals',
    chapterNumber: 5,
    title: 'What is your primary health and cycle optimization goal with SheSync?',
    subtitle: 'Determines your clinical focus, strain overrides, and doctor report metrics.',
    options: [
      { id: 'q10_opt1', label: 'Regulate irregular cycles & manage PCOS symptoms', description: 'Ovulation support, metabolic balance, and predictable cycle tracking', points: { pcosRisk: 3 } },
      { id: 'q10_opt2', label: 'Overcome PMDD luteal mood drops & anxiety', description: 'Neuro-hormonal shield, somatic grounding videos, and emotional calm', points: { pmddRisk: 3 } },
      { id: 'q10_opt3', label: 'Reduce severe pelvic pain, cramps & heavy flow', description: 'Gentle restorative pacing, pelvic floor decompression, and anti-inflammatory habits', points: { strainSensitivity: 3, recoveryNeed: 3 } },
      { id: 'q10_opt4', label: 'Optimize energy, fitness & sync workouts to cycle phases', description: 'Harmonize high-strain training in follicular with restorative recovery in luteal' },
    ],
  },
];

export interface ArchetypeResult {
  id: string;
  name: string;
  tagline: string;
  description: string;
  primaryCondition: string;
  recommendedStrainSensitivity: 'gentle' | 'balanced' | 'dynamic';
  defaultTherapy: 'somatic' | 'cbt' | 'breathwork';
  cortisolOverrideDefault: boolean;
  pmddAlertDefault: boolean;
  sleepTargetHours: number;
}

export function calculateArchetype(answers: Record<string, string>): ArchetypeResult {
  let pcosScore = 0;
  let pmddScore = 0;
  let cortisolScore = 0;
  let strainScore = 0;

  // Tally scores from selected options
  ASSESSMENT_QUESTIONS.forEach((q) => {
    const selectedOptionId = answers[q.id];
    if (selectedOptionId) {
      const option = q.options.find((o) => o.id === selectedOptionId);
      if (option?.points) {
        if (option.points.pcosRisk) pcosScore += option.points.pcosRisk;
        if (option.points.pmddRisk) pmddScore += option.points.pmddRisk;
        if (option.points.cortisolSensitivity) cortisolScore += option.points.cortisolSensitivity;
        if (option.points.strainSensitivity) strainScore += option.points.strainSensitivity;
      }
    }
  });

  // Check specific selections
  const primaryGoal = answers['q10'];
  const cycleLength = answers['q1'];
  const pmsSeverity = answers['q7'];

  // Determine Archetype based on predominant clinical profile
  if (
    pcosScore >= 4 ||
    primaryGoal === 'q10_opt1' ||
    cycleLength === 'q1_opt3' ||
    cycleLength === 'q1_opt4' ||
    cycleLength === 'q1_opt5'
  ) {
    return {
      id: 'pcos_strain_adaptive',
      name: 'PCOS Bio-Adaptive Synchronizer',
      tagline: 'Metabolic Stability & Cycle Harmony',
      description: 'Your body thrives with steady insulin modulation, low-cortisol strength sessions, and adaptive anovulatory cycle tracking.',
      primaryCondition: 'PCOS & Metabolic Health',
      recommendedStrainSensitivity: 'gentle',
      defaultTherapy: 'somatic',
      cortisolOverrideDefault: true,
      pmddAlertDefault: true,
      sleepTargetHours: 8.5,
    };
  }

  if (pmddScore >= 4 || primaryGoal === 'q10_opt2' || pmsSeverity === 'q7_opt4') {
    return {
      id: 'pmdd_luteal_shield',
      name: 'Somatic Luteal-Resilient Archetype',
      tagline: 'Neuro-Hormonal Protection & Emotional Ease',
      description: 'You experience heightened luteal sensitivity. SheSync will deploy early PMDD YouTube somatic sequences and dial back physical strain 7 days before menses.',
      primaryCondition: 'PMDD & Luteal Sensitivity',
      recommendedStrainSensitivity: 'gentle',
      defaultTherapy: 'somatic',
      cortisolOverrideDefault: true,
      pmddAlertDefault: true,
      sleepTargetHours: 8.5,
    };
  }

  if (cortisolScore >= 4 || strainScore >= 4 || primaryGoal === 'q10_opt3') {
    return {
      id: 'high_cortisol_restorative',
      name: 'Vagal Restorative Archetype',
      tagline: 'Adrenal Recovery & Parasympathetic Tone',
      description: 'Your nervous system carries high allostatic load. Priority is placed on YouTube vagus nerve stimulation, restorative flows, and deep sleep recovery.',
      primaryCondition: 'Adrenal / Cortisol Sensitivity',
      recommendedStrainSensitivity: 'gentle',
      defaultTherapy: 'somatic',
      cortisolOverrideDefault: true,
      pmddAlertDefault: false,
      sleepTargetHours: 8.5,
    };
  }

  // Default balanced / athletic archetype
  return {
    id: 'empowered_cycle_optimizer',
    name: 'Empowered Cyclical Optimizer',
    tagline: 'Dynamic Vitality & Natural Alignment',
    description: 'You have a resilient foundation. SheSync will maximize your follicular energy windows while ensuring restorative somatic balance throughout the luteal phase.',
    primaryCondition: 'Cycle Optimization',
    recommendedStrainSensitivity: 'dynamic',
    defaultTherapy: 'somatic',
    cortisolOverrideDefault: true,
    pmddAlertDefault: false,
    sleepTargetHours: 8.0,
  };
}
