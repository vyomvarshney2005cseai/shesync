import type {
  PastCycleRecord,
  CyclePrediction,
  PrecautionMeasure,
  CyclePhaseBreakdown,
  UserFriendlyInsight,
  HealthScores,
  CyclePhase,
} from '@/types';

/**
 * Enhanced Clinical Cycle Prediction & Precision Precaution Engine
 * Features:
 * - Exponential recency-weighted cycle averaging
 * - Statistical variance & Coefficient of Variation (CV%)
 * - Biological luteal vs follicular phase modeling
 * - Actionable, user-friendly plain-English guidance
 * - Multi-dimensional health scores (Hormonal Harmony, Autonomic Recovery, Cycle Stability)
 */
export function calculateCyclePredictionAndPrecautions(
  rememberedCount: number,
  cycles: PastCycleRecord[],
  answers: Record<string, string> = {},
  painLevel: number = 4,
  flowIntensity: string = 'moderate'
): CyclePrediction {
  const effectiveCount = rememberedCount === -1 ? 1 : Math.max(1, rememberedCount);
  const validCycles =
    cycles && cycles.length > 0
      ? cycles.slice(0, effectiveCount)
      : [
          {
            id: 'cycle-default',
            cycleNumber: 1,
            daysAgo: 14,
            lengthDays: 28,
            periodDurationDays: 5,
            startDate: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
          },
        ];

  // 1. Exponential Recency-Weighted Average
  // Most recent cycle has weight 3, previous 2, older 1.5, oldest 1.0
  const weights = [3.0, 2.0, 1.5, 1.0];
  let weightedSum = 0;
  let totalWeight = 0;

  validCycles.forEach((c, idx) => {
    const w = weights[idx] ?? 1.0;
    const len = c.lengthDays || 28;
    weightedSum += len * w;
    totalWeight += w;
  });

  let avgCycleLength = Math.round(weightedSum / totalWeight) || 28;

  // Calibrate cycle length using assessment questionnaire if user indicated non-standard rhythm
  if (answers['q1']) {
    if (answers['q1'] === 'q1_opt2') {
      avgCycleLength = Math.min(avgCycleLength, 23);
    } else if (answers['q1'] === 'q1_opt3') {
      avgCycleLength = Math.max(avgCycleLength, 38);
    } else if (answers['q1'] === 'q1_opt4') {
      avgCycleLength = Math.max(avgCycleLength, 35);
    } else if (answers['q1'] === 'q1_opt5') {
      avgCycleLength = Math.max(avgCycleLength, 45);
    }
  }

  // 2. Statistical Variance & Coefficient of Variation
  let variance = 0;
  if (validCycles.length > 1) {
    const sumSquareDiffs = validCycles.reduce(
      (sum, c) => sum + Math.pow((c.lengthDays || 28) - avgCycleLength, 2),
      0
    );
    variance = Math.round(Math.sqrt(sumSquareDiffs / validCycles.length) * 10) / 10;
  } else if (answers['q1'] === 'q1_opt4' || answers['q1'] === 'q1_opt5' || rememberedCount === -1) {
    variance = 7.5;
  } else if (answers['q1'] === 'q1_opt3') {
    variance = 4.2;
  } else {
    variance = 1.2;
  }

  const cvPercent = Math.round((variance / Math.max(20, avgCycleLength)) * 100);

  // 3. Regularity Status & Clinical Confidence
  let regularityStatus: CyclePrediction['regularityStatus'] = 'regular';
  let confidencePercentage = 94;

  if (
    answers['q1'] === 'q1_opt4' ||
    answers['q1'] === 'q1_opt5' ||
    rememberedCount === -1 ||
    variance > 5.5 ||
    cvPercent > 18 ||
    avgCycleLength > 36 ||
    avgCycleLength < 21
  ) {
    regularityStatus = 'irregular_pcos';
    confidencePercentage = Math.max(65, 72 - Math.round(variance * 1.2));
  } else if (answers['q1'] === 'q1_opt3' || variance > 2.5 || cvPercent > 9) {
    regularityStatus = 'moderate_variance';
    confidencePercentage = Math.max(76, 86 - Math.round(variance * 1.5));
  } else {
    regularityStatus = 'regular';
    confidencePercentage = Math.min(97, 91 + Math.min(validCycles.length * 2, 6));
  }

  // Today normalized to midnight for day-accurate calculations
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Most recent cycle
  const mostRecent = validCycles[0] || {
    daysAgo: 14,
    lengthDays: avgCycleLength,
    periodDurationDays: 5,
    startDate: new Date(todayMidnight.getTime() - 14 * 86400000).toISOString().split('T')[0],
  };

  // Determine last period start midnight
  let lastPeriodStartMidnight: Date;
  if (mostRecent.startDate) {
    const parts = mostRecent.startDate.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      lastPeriodStartMidnight = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      const parsed = new Date(mostRecent.startDate);
      lastPeriodStartMidnight = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  } else if (typeof mostRecent.daysAgo === 'number') {
    lastPeriodStartMidnight = new Date(todayMidnight.getTime() - mostRecent.daysAgo * 86400000);
  } else {
    lastPeriodStartMidnight = new Date(todayMidnight.getTime() - 14 * 86400000);
  }

  // Exact calendar days elapsed since last period start
  const daysAgo =
    typeof mostRecent.daysAgo === 'number'
      ? mostRecent.daysAgo
      : Math.max(0, Math.round((todayMidnight.getTime() - lastPeriodStartMidnight.getTime()) / 86400000));

  // Current Cycle Day (Day 1 is start of bleeding)
  const currentCycleDay = daysAgo + 1;
  const bleedingDuration = mostRecent.periodDurationDays || 5;

  // 4. Raw difference between cycle length and days elapsed
  const rawDaysUntil = avgCycleLength - daysAgo;

  let daysUntilNextPeriod: number;
  let nextPeriodDateObj: Date;

  if (rawDaysUntil > 0) {
    daysUntilNextPeriod = rawDaysUntil;
    nextPeriodDateObj = new Date(todayMidnight.getTime() + daysUntilNextPeriod * 86400000);
  } else if (rawDaysUntil === 0) {
    daysUntilNextPeriod = 0;
    nextPeriodDateObj = todayMidnight;
  } else {
    // Overdue or irregular extension
    if (regularityStatus === 'irregular_pcos') {
      const imminentDays =
        flowIntensity === 'spotting' || painLevel >= 6
          ? 1
          : Math.min(6, Math.max(2, Math.round(variance || 3)));
      daysUntilNextPeriod = imminentDays;
      nextPeriodDateObj = new Date(todayMidnight.getTime() + daysUntilNextPeriod * 86400000);
    } else {
      daysUntilNextPeriod = rawDaysUntil; // negative count represents overdue days
      nextPeriodDateObj = new Date(lastPeriodStartMidnight.getTime() + avgCycleLength * 86400000);
    }
  }

  const nextPeriodDateStr = nextPeriodDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // 5. Precision Biological Ovulation & Luteal Modeling
  // Biological rule: The luteal phase is typically constant (~14 days). Follicular phase varies.
  const estimatedLutealLength = 14;
  const ovulationCycleDay = Math.max(9, avgCycleLength - estimatedLutealLength);

  // Exact calendar date of ovulation in current cycle
  const currentCycleOvulDate = new Date(lastPeriodStartMidnight.getTime() + (ovulationCycleDay - 1) * 86400000);
  const fertileStart = new Date(currentCycleOvulDate.getTime() - 5 * 86400000);
  const fertileEnd = new Date(currentCycleOvulDate.getTime() + 1 * 86400000);

  const ovulationDateStr = currentCycleOvulDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const fertileWindowStr = `${fertileStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${fertileEnd.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  const ovulationWindowStr = `${new Date(currentCycleOvulDate.getTime() - 2 * 86400000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${new Date(currentCycleOvulDate.getTime() + 2 * 86400000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  // Luteal Phase Window: After ovulation until onset of menses
  const lutealStart = new Date(currentCycleOvulDate.getTime() + 2 * 86400000);
  const lutealEnd = new Date(nextPeriodDateObj.getTime() - 86400000);

  const lutealPhaseWindowStr = `${lutealStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${lutealEnd.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  // 6. Current Cycle Phase Identification & User-Friendly Breakdown
  let currentPhase: CyclePhase = 'follicular';
  let phaseName = 'Follicular Phase';
  let phaseDescription = 'Estrogen is steadily climbing, replenishing cellular stamina and boosting insulin sensitivity.';
  let hormoneOverview = 'Estrogen: Rising • Progesterone: Baseline • Insulin: Sensitive';
  let daysRemainingInPhase = Math.max(1, ovulationCycleDay - currentCycleDay);

  if (
    currentCycleDay <= bleedingDuration ||
    flowIntensity === 'heavy' ||
    flowIntensity === 'severe' ||
    flowIntensity === 'moderate'
  ) {
    currentPhase = 'menstrual';
    phaseName = 'Menstrual Phase';
    phaseDescription = 'Active uterine shedding. Your body is resetting inflammatory signaling. Focus on gentle recovery, warmth, and adequate iron.';
    hormoneOverview = 'Estrogen: Low • Progesterone: Low • Inflammation: Transiently Elevated';
    daysRemainingInPhase = Math.max(1, bleedingDuration - currentCycleDay + 1);
  } else if (currentCycleDay < ovulationCycleDay - 2) {
    currentPhase = 'follicular';
    phaseName = 'Follicular Phase';
    phaseDescription = 'FSH and estradiol are maturing follicles. Energy, mental clarity, and strength tolerance peak during this window.';
    hormoneOverview = 'Estrogen: High • Progesterone: Low • Recovery Rate: Optimal';
    daysRemainingInPhase = Math.max(1, ovulationCycleDay - 2 - currentCycleDay);
  } else if (currentCycleDay <= ovulationCycleDay + 2) {
    currentPhase = 'ovulatory';
    phaseName = 'Ovulatory Window';
    phaseDescription = 'LH surge triggers egg release. Peak estrogen brings maximum social confidence, libido, and cardiovascular output.';
    hormoneOverview = 'LH: Surge • Estrogen: Peak • Testosterone: Mild Peak';
    daysRemainingInPhase = Math.max(1, ovulationCycleDay + 2 - currentCycleDay);
  } else if (currentCycleDay <= avgCycleLength - 6) {
    currentPhase = 'luteal';
    phaseName = 'Early to Mid Luteal Phase';
    phaseDescription = 'The corpus luteum secretes progesterone. Basal body temperature elevates and metabolic calorie burn increases by ~100-250 kcal/day.';
    hormoneOverview = 'Progesterone: Dominant • Estrogen: Moderate • Metabolic Rate: +5-10%';
    daysRemainingInPhase = Math.max(1, avgCycleLength - 6 - currentCycleDay);
  } else if (currentCycleDay <= avgCycleLength) {
    currentPhase = 'luteal';
    phaseName = 'Late Luteal / Pre-Menstrual Window';
    phaseDescription = 'Progesterone levels drop sharply. Allopregnanolone fluctuations can trigger emotional sensitivity, mild water retention, and sleep disruption.';
    hormoneOverview = 'Progesterone: Dropping • GABA Sensitivity: High • Cortisol: Reactive';
    daysRemainingInPhase = Math.max(1, avgCycleLength - currentCycleDay);
  } else {
    currentPhase = regularityStatus === 'irregular_pcos' ? 'irregular' : 'luteal';
    phaseName = regularityStatus === 'irregular_pcos' ? 'Extended Anovulatory Gap' : 'Delayed / Cycle Completion Due';
    phaseDescription =
      regularityStatus === 'irregular_pcos'
        ? 'Cycle has exceeded standard interval. Progesterone markers remain low, suggesting delayed ovulation typical of metabolic or stress-induced PCOS.'
        : 'Cycle length has surpassed expected window. Menstrual onset is imminent.';
    hormoneOverview = 'Progesterone: Low • LH/FSH: Variable • Metabolic Strain: Elevated';
    daysRemainingInPhase = 1;
  }

  const cyclePhaseBreakdown: CyclePhaseBreakdown = {
    phase: currentPhase,
    phaseName,
    phaseDescription,
    hormoneOverview,
    daysRemainingInPhase,
  };

  // 7. Multi-Dimensional Health Scores (0 - 100)
  // Hormonal Harmony: Evaluates regular rhythm, balanced flow, and manageable pain
  let harmony = 85;
  if (regularityStatus === 'irregular_pcos') harmony -= 20;
  else if (regularityStatus === 'moderate_variance') harmony -= 10;
  if (painLevel >= 7) harmony -= 18;
  else if (painLevel >= 5) harmony -= 8;
  if (flowIntensity === 'heavy' || flowIntensity === 'severe') harmony -= 14;

  const hormonalHarmony = Math.min(98, Math.max(25, harmony));

  // Autonomic Recovery Score
  let recovery = 88;
  if (painLevel >= 7) recovery -= 22;
  else if (painLevel >= 4) recovery -= 10;
  if (answers['q5'] === 'q5_opt4') recovery -= 20;
  if (answers['q6'] === 'q6_opt4') recovery -= 16;
  const autonomicRecovery = Math.min(96, Math.max(20, recovery));

  // Cycle Stability Score
  const stability = Math.min(99, Math.max(30, Math.round(100 - variance * 8.5)));

  const healthScores: HealthScores = {
    hormonalHarmony,
    autonomicRecovery,
    cycleStability: stability,
  };

  // 8. User-Friendly Actionable Daily Insights
  const userFriendlyInsights: UserFriendlyInsight[] = [];

  if (currentPhase === 'menstrual') {
    userFriendlyInsights.push({
      id: 'ins-menstrual-rest',
      category: 'movement',
      headline: 'Downshift to Somatic Pelvic Release',
      explanation: 'Uterine contractions are elevated today. High-intensity cardio elevates pelvic prostaglandins and prolongs cramps.',
      actionTip: 'Swap strenuous cardio for 15 minutes of legs-up-the-wall and deep diaphragmatic breathing.',
      icon: '🌸',
    });
    userFriendlyInsights.push({
      id: 'ins-menstrual-iron',
      category: 'nutrition',
      headline: 'Replenish Iron and Electrolytes',
      explanation: 'Active bleeding depletes serum ferritin, which can cause sudden afternoon brain fog and fatigue.',
      actionTip: 'Incorporate dark leafy greens, pumpkin seeds, or lentils paired with vitamin C (lemon water).',
      icon: '🩸',
    });
  } else if (currentPhase === 'follicular') {
    userFriendlyInsights.push({
      id: 'ins-follicular-strength',
      category: 'movement',
      headline: 'Optimal Strength Building Window',
      explanation: 'Rising estrogen enhances neuromuscular recruitment, glycogen storage, and joint resilience.',
      actionTip: 'Excellent day for progressive strength training, compound lifts, or higher-intensity conditioning.',
      icon: '⚡',
    });
    userFriendlyInsights.push({
      id: 'ins-follicular-nutrition',
      category: 'nutrition',
      headline: 'Metabolic Insulin Sensitivity is High',
      explanation: 'Your body processes complex carbohydrates with maximum efficiency during this phase.',
      actionTip: 'Fuel workouts with whole grains, sweet potatoes, and fermented foods for gut microbiome balance.',
      icon: '🥗',
    });
  } else if (currentPhase === 'ovulatory') {
    userFriendlyInsights.push({
      id: 'ins-ovulatory-peak',
      category: 'hormone',
      headline: 'Estrogen Peak & Peak Cognitive Clarity',
      explanation: 'Testosterone and estradiol peak together, sharpening verbal fluency and executive focus.',
      actionTip: 'Schedule challenging presentations, collaborative meetings, or personal milestone workouts today.',
      icon: '✨',
    });
  } else if (currentPhase === 'luteal') {
    userFriendlyInsights.push({
      id: 'ins-luteal-progesterone',
      category: 'nutrition',
      headline: 'Metabolic Baseline Elevated (+150 kcal/day)',
      explanation: 'Progesterone production elevates basal body temperature, requiring ~100-250 additional clean calories.',
      actionTip: 'Do not under-eat. Prioritize complex carbs (oats, quinoa) and healthy fats to stabilize serotonin.',
      icon: '🥑',
    });
    userFriendlyInsights.push({
      id: 'ins-luteal-nervous',
      category: 'recovery',
      headline: 'Vagal Shield Against Cortisol Spikes',
      explanation: 'Shifting progesterone sensitizes GABA receptors. Minor stressors trigger higher cortisol reactions.',
      actionTip: 'Use a 5-minute somatic humming or physiological sigh practice before sleep to protect sleep quality.',
      icon: '🧘‍♀️',
    });
  } else {
    userFriendlyInsights.push({
      id: 'ins-pcos-balance',
      category: 'hormone',
      headline: 'Metabolic Sensitivity Calibrator',
      explanation: 'Delayed ovulation detected. Insulin stabilization is the most direct pathway to resume regular cyclicity.',
      actionTip: 'Focus on 30g protein at breakfast and 15-minute gentle post-meal walks to steady glucose response.',
      icon: '🌿',
    });
  }

  // 9. Tailored Precaution Measures
  const precautions: PrecautionMeasure[] = [];
  const countdownToDisplay = Math.max(0, daysUntilNextPeriod);
  const daysUntilLuteal = Math.max(0, ovulationCycleDay - currentCycleDay + 2);

  // Precaution 1: PMDD / Neuro-Vulnerability Alert
  precautions.push({
    id: 'prec-pmdd-luteal',
    category: 'pmdd_shield',
    phaseTarget: currentPhase === 'luteal' ? 'Current Luteal Phase' : 'Upcoming Luteal Window',
    urgency: currentPhase === 'luteal' || daysUntilLuteal <= 3 ? 'high' : 'moderate',
    daysUntilActive: currentPhase === 'luteal' ? 0 : daysUntilLuteal,
    title: 'Pre-Luteal Neuro-Hormonal Shield',
    advice:
      currentPhase === 'luteal'
        ? 'Active luteal progesterone drop. Guard your energy by setting boundary buffers, minimizing alcohol, and engaging somatic vagal grounding.'
        : `Luteal phase starts in ~${daysUntilLuteal} days. Plan ahead: queue 10-minute vagal toning sessions and increase magnesium intake.`,
  });

  // Precaution 2: Dysmenorrhea / Cramp Preparedness
  precautions.push({
    id: 'prec-cramp-prep',
    category: 'cramp_prep',
    phaseTarget: 'Menstrual Onset (Days 1–2)',
    urgency: countdownToDisplay <= 2 ? 'high' : 'moderate',
    daysUntilActive: countdownToDisplay,
    title: painLevel >= 6 ? 'Severe Dysmenorrhea Pre-Emptive Protocol' : 'Menstrual Cramp Readiness',
    advice:
      countdownToDisplay === 0
        ? `Period due today. ${
            painLevel >= 6
              ? 'Pre-hydrate with electrolytes, prepare heat therapy, and avoid high-impact jumping to minimize uterine spasm.'
              : 'Keep magnesium glycinate on hand and transition to gentle somatic walking.'
          }`
        : `Next period starts in ~${countdownToDisplay} days. ${
            painLevel >= 6
              ? 'Pre-hydrate with electrolytes, prepare heating pads, and initiate anti-inflammatory nutrition 48 hours in advance.'
              : 'Keep magnesium glycinate on hand and transition to gentle somatic walking.'
          }`,
  });

  // Precaution 3: Heavy Flow & Iron Preservation
  if (
    flowIntensity === 'heavy' ||
    flowIntensity === 'severe' ||
    answers['q2'] === 'q2_opt3' ||
    answers['q2'] === 'q2_opt4'
  ) {
    precautions.push({
      id: 'prec-iron-flow',
      category: 'iron_nutrition',
      phaseTarget: 'Menstrual Flow Window',
      urgency: 'high',
      daysUntilActive: countdownToDisplay,
      title: 'Menorrhagia & Ferritin Protection Alert',
      advice:
        'Given your heavy flow pattern, prioritize dietary heme iron (lentils, spinach, pasture-raised red meat) and avoid black tea or coffee with meals to optimize iron absorption.',
    });
  }

  // Precaution 4: Pacing & Allostatic Strain Cap
  precautions.push({
    id: 'prec-workout-pacing',
    category: 'workout_pacing',
    phaseTarget: `${phaseName}`,
    urgency: currentPhase === 'menstrual' || currentPhase === 'luteal' ? 'moderate' : 'low',
    daysUntilActive: 0,
    title: 'Bio-Adaptive Strain Ceiling',
    advice: `Predicted cycle length is ${avgCycleLength} days with ±${variance}d variance (${
      regularityStatus === 'regular' ? 'Consistent Rhythm' : 'High Variance'
    }). Respect your body's current ${phaseName} needs.`,
  });

  return {
    nextPeriodDate: nextPeriodDateStr,
    daysUntilNextPeriod,
    ovulationWindow: ovulationWindowStr,
    lutealPhaseWindow: lutealPhaseWindowStr,
    predictedCycleLength: avgCycleLength,
    regularityStatus,
    confidencePercentage,
    precautionMeasures: precautions,
    cycleVarianceDays: variance,
    fertileWindow: fertileWindowStr,
    ovulationDate: ovulationDateStr,
    cyclePhaseBreakdown,
    userFriendlyInsights,
    healthScores,
  };
}
