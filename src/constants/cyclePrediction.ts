import type {
  PastCycleRecord,
  CyclePrediction,
  PrecautionMeasure,
  CyclePhaseBreakdown,
  UserFriendlyInsight,
  HealthScores,
  CyclePhase,
} from '@/types';
import { daysAgoKey, daysSinceKey, parseDateKey } from '@/lib/dates';

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
            startDate: daysAgoKey(14),
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
    startDate: daysAgoKey(14),
  };

  // Determine last period start midnight (local calendar date)
  let lastPeriodStartMidnight: Date;
  if (mostRecent.startDate) {
    lastPeriodStartMidnight = parseDateKey(mostRecent.startDate);
  } else if (typeof mostRecent.daysAgo === 'number') {
    lastPeriodStartMidnight = new Date(todayMidnight.getTime() - mostRecent.daysAgo * 86400000);
  } else {
    lastPeriodStartMidnight = new Date(todayMidnight.getTime() - 14 * 86400000);
  }

  // Calendar days elapsed since the last period started. Always derived from
  // the start date: the stored `daysAgo` is frozen at save time, which kept
  // "next period in N days" from ever counting down.
  const daysAgo = mostRecent.startDate
    ? Math.max(0, daysSinceKey(mostRecent.startDate))
    : Math.max(0, mostRecent.daysAgo ?? 14);

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
    phaseDescription = 'Your period. Rest more, keep warm and eat iron-rich food.';
    hormoneOverview = '';
    daysRemainingInPhase = Math.max(1, bleedingDuration - currentCycleDay + 1);
  } else if (currentCycleDay < ovulationCycleDay - 2) {
    currentPhase = 'follicular';
    phaseName = 'Follicular Phase';
    phaseDescription = 'After your period. Energy and focus usually rise.';
    hormoneOverview = '';
    daysRemainingInPhase = Math.max(1, ovulationCycleDay - 2 - currentCycleDay);
  } else if (currentCycleDay <= ovulationCycleDay + 2) {
    currentPhase = 'ovulatory';
    phaseName = 'Ovulatory Window';
    phaseDescription = 'Around ovulation. Energy and mood are often at their best.';
    hormoneOverview = '';
    daysRemainingInPhase = Math.max(1, ovulationCycleDay + 2 - currentCycleDay);
  } else if (currentCycleDay <= avgCycleLength - 6) {
    currentPhase = 'luteal';
    phaseName = 'Luteal Phase';
    phaseDescription = 'After ovulation. You may feel a little warmer and hungrier.';
    hormoneOverview = '';
    daysRemainingInPhase = Math.max(1, avgCycleLength - 6 - currentCycleDay);
  } else if (currentCycleDay <= avgCycleLength) {
    currentPhase = 'luteal';
    phaseName = 'Pre-period Days';
    phaseDescription = 'The days before your period. PMS — bloating, mood swings, lighter sleep — is common now.';
    hormoneOverview = '';
    daysRemainingInPhase = Math.max(1, avgCycleLength - currentCycleDay);
  } else {
    currentPhase = regularityStatus === 'irregular_pcos' ? 'irregular' : 'luteal';
    phaseName = regularityStatus === 'irregular_pcos' ? 'Long Cycle' : 'Period Due';
    phaseDescription =
      regularityStatus === 'irregular_pcos'
        ? 'This cycle is longer than usual. Stress, PCOS or thyroid problems can delay ovulation — log your period when it starts.'
        : 'Your period is due any day now.';
    hormoneOverview = '';
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
      headline: 'Go gentle today',
      explanation: 'Cramps are common on period days, and gentle movement often eases them.',
      actionTip: 'Try a short walk, stretching or yoga instead of hard cardio if you feel crampy.',
      icon: '🌸',
    });
    userFriendlyInsights.push({
      id: 'ins-menstrual-iron',
      category: 'nutrition',
      headline: 'Top up iron',
      explanation: 'You lose some iron with every period, and low iron can make you tired.',
      actionTip: 'Eat dal, leafy greens, pumpkin seeds or eggs with a squeeze of lemon.',
      icon: '🩸',
    });
  } else if (currentPhase === 'follicular') {
    userFriendlyInsights.push({
      id: 'ins-follicular-strength',
      category: 'movement',
      headline: 'Good days for harder workouts',
      explanation: 'Energy usually rises in the days after your period.',
      actionTip: 'A good time for strength training or a tougher workout if you feel up to it.',
      icon: '⚡',
    });
    userFriendlyInsights.push({
      id: 'ins-follicular-nutrition',
      category: 'nutrition',
      headline: 'Fuel your day',
      explanation: 'Regular meals with carbs and protein help you train and study well.',
      actionTip: 'Pick whole grains, dal, curd and fruit around workouts.',
      icon: '🥗',
    });
  } else if (currentPhase === 'ovulatory') {
    userFriendlyInsights.push({
      id: 'ins-ovulatory-peak',
      category: 'hormone',
      headline: 'Energy is often high',
      explanation: 'Many people feel more social and energetic around ovulation.',
      actionTip: 'A good time for presentations, group study or a harder workout.',
      icon: '✨',
    });
  } else if (currentPhase === 'luteal') {
    userFriendlyInsights.push({
      id: 'ins-luteal-progesterone',
      category: 'nutrition',
      headline: 'You may feel hungrier',
      explanation: 'After ovulation your body uses a little more energy, so hunger can rise.',
      actionTip: 'Don’t skip meals — oats, roti, dal and nuts keep energy steady.',
      icon: '🥑',
    });
    userFriendlyInsights.push({
      id: 'ins-luteal-nervous',
      category: 'recovery',
      headline: 'Protect your calm',
      explanation: 'Small stresses can feel bigger in the days before a period.',
      actionTip: 'Wind down before bed with 5 minutes of slow breathing.',
      icon: '🧘‍♀️',
    });
  } else {
    userFriendlyInsights.push({
      id: 'ins-pcos-balance',
      category: 'hormone',
      headline: 'Long cycle',
      explanation: 'This cycle is longer than usual, which often means ovulation came late.',
      actionTip: 'Keep meals and sleep regular. See a gynaecologist if you go 3 months without a period.',
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
    title: currentPhase === 'luteal' ? 'PMS days' : 'PMS days ahead',
    advice:
      currentPhase === 'luteal'
        ? 'Your period is getting closer. Keep sleep regular, go easy on caffeine and plan lighter days if you can.'
        : `PMS days usually start in about ${daysUntilLuteal} days. Plan lighter days and keep your sleep steady.`,
  });

  // Precaution 2: Dysmenorrhea / Cramp Preparedness
  precautions.push({
    id: 'prec-cramp-prep',
    category: 'cramp_prep',
    phaseTarget: 'Menstrual Onset (Days 1–2)',
    urgency: countdownToDisplay <= 2 ? 'high' : 'moderate',
    daysUntilActive: countdownToDisplay,
    title: 'Period coming up',
    advice:
      countdownToDisplay === 0
        ? `Period due today. ${
            painLevel >= 6
              ? 'Keep a heat pad ready and take your usual pain relief early, with food.'
              : 'Keep pads, a heat pad and water handy.'
          }`
        : `Next period in about ${countdownToDisplay} days. ${
            painLevel >= 6 ? 'Keep a heat pad and your usual pain relief ready.' : 'Keep pads and a heat pad handy.'
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
      title: 'Heavy flow: protect your iron',
      advice:
        'Eat iron-rich food (dal, rajma, spinach, eggs or meat) with vitamin C, and avoid tea or coffee with meals. If you soak a pad every 1–2 hours, see a gynaecologist.',
    });
  }

  // Precaution 4: Pacing & Allostatic Strain Cap
  precautions.push({
    id: 'prec-workout-pacing',
    category: 'workout_pacing',
    phaseTarget: `${phaseName}`,
    urgency: currentPhase === 'menstrual' || currentPhase === 'luteal' ? 'moderate' : 'low',
    daysUntilActive: 0,
    title: 'Your cycle rhythm',
    advice: `Your cycles average ${avgCycleLength} days (±${variance} days) — ${
      regularityStatus === 'regular' ? 'a steady rhythm' : 'quite variable'
    }.`,
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
