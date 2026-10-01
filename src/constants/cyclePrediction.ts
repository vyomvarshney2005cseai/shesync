import type { PastCycleRecord, CyclePrediction, PrecautionMeasure } from '@/types';

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

  // Base average cycle length from logged cycles
  const totalLength = validCycles.reduce((sum, c) => sum + (c.lengthDays || 28), 0);
  let avgCycleLength = Math.round(totalLength / validCycles.length) || 28;

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

  // Calculate variance across remembered cycles
  let variance = 0;
  if (validCycles.length > 1) {
    const sumSquareDiffs = validCycles.reduce(
      (sum, c) => sum + Math.pow(c.lengthDays - avgCycleLength, 2),
      0
    );
    variance = Math.round(Math.sqrt(sumSquareDiffs / validCycles.length) * 10) / 10;
  } else if (answers['q1'] === 'q1_opt4' || answers['q1'] === 'q1_opt5' || rememberedCount === -1) {
    variance = 7.5;
  } else if (answers['q1'] === 'q1_opt3') {
    variance = 4.2;
  }

  // Regularity Status
  let regularityStatus: CyclePrediction['regularityStatus'] = 'regular';
  let confidencePercentage = 88;

  if (answers['q1'] === 'q1_opt4' || answers['q1'] === 'q1_opt5' || rememberedCount === -1 || variance > 5) {
    regularityStatus = 'irregular_pcos';
    confidencePercentage = 68;
  } else if (answers['q1'] === 'q1_opt3' || variance > 2.5) {
    regularityStatus = 'moderate_variance';
    confidencePercentage = 78;
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

  // Exact calendar days elapsed
  const daysAgo =
    typeof mostRecent.daysAgo === 'number'
      ? mostRecent.daysAgo
      : Math.max(0, Math.round((todayMidnight.getTime() - lastPeriodStartMidnight.getTime()) / 86400000));

  // Raw difference between cycle length and days elapsed
  const rawDaysUntil = avgCycleLength - daysAgo;

  let daysUntilNextPeriod: number;
  let nextPeriodDateObj: Date;

  if (rawDaysUntil > 0) {
    // Standard upcoming cycle
    daysUntilNextPeriod = rawDaysUntil;
    nextPeriodDateObj = new Date(todayMidnight.getTime() + daysUntilNextPeriod * 86400000);
  } else if (rawDaysUntil === 0) {
    // Due today
    daysUntilNextPeriod = 0;
    nextPeriodDateObj = todayMidnight;
  } else {
    // Days elapsed exceeds expected cycle length (overdue or irregular extension)
    if (regularityStatus === 'irregular_pcos') {
      // In irregular/PCOS cycle, project imminent or extended window based on active flow/pain
      const imminentDays = flowIntensity === 'spotting' || painLevel >= 6 ? 1 : Math.min(6, Math.max(2, Math.round(variance || 3)));
      daysUntilNextPeriod = imminentDays;
      nextPeriodDateObj = new Date(todayMidnight.getTime() + daysUntilNextPeriod * 86400000);
    } else {
      // For regular cycles, calculate expected date and mark overdue
      daysUntilNextPeriod = rawDaysUntil; // negative count represents overdue days
      nextPeriodDateObj = new Date(lastPeriodStartMidnight.getTime() + avgCycleLength * 86400000);
    }
  }

  const nextPeriodDateStr = nextPeriodDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Ovulation Window (typically ~14 days before next period)
  const ovulationDayFromLastStart = Math.max(10, avgCycleLength - 14);
  const daysUntilCurrentCycleOvulation = ovulationDayFromLastStart - daysAgo;

  let ovulStart: Date;
  let ovulEnd: Date;

  if (daysUntilCurrentCycleOvulation + 2 >= 0) {
    // Current cycle's ovulation window is active or upcoming
    ovulStart = new Date(lastPeriodStartMidnight.getTime() + (ovulationDayFromLastStart - 2) * 86400000);
    ovulEnd = new Date(lastPeriodStartMidnight.getTime() + (ovulationDayFromLastStart + 2) * 86400000);
  } else {
    // Current cycle's ovulation has passed; project next cycle's ovulation window
    const nextCycleOvulMid = new Date(nextPeriodDateObj.getTime() + ovulationDayFromLastStart * 86400000);
    ovulStart = new Date(nextCycleOvulMid.getTime() - 2 * 86400000);
    ovulEnd = new Date(nextCycleOvulMid.getTime() + 2 * 86400000);
  }

  const ovulationWindowStr = `${ovulStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${ovulEnd.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  // Luteal Phase Window: After ovulation until day before next period
  let lutealStart: Date;
  let lutealEnd: Date;

  if (daysUntilCurrentCycleOvulation + 2 >= 0) {
    lutealStart = new Date(ovulEnd.getTime() + 86400000);
    lutealEnd = new Date(nextPeriodDateObj.getTime() - 86400000);
    if (lutealEnd.getTime() < lutealStart.getTime()) {
      lutealEnd = new Date(lutealStart.getTime() + 10 * 86400000);
    }
  } else {
    lutealStart = new Date(lastPeriodStartMidnight.getTime() + (ovulationDayFromLastStart + 3) * 86400000);
    lutealEnd = new Date(nextPeriodDateObj.getTime() - 86400000);
    if (lutealEnd.getTime() < lutealStart.getTime()) {
      lutealEnd = new Date(todayMidnight.getTime() + Math.max(1, daysUntilNextPeriod) * 86400000);
    }
  }

  const lutealPhaseWindowStr = `${lutealStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${lutealEnd.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  // Build Personalized Precaution Measures
  const precautions: PrecautionMeasure[] = [];
  const countdownToDisplay = Math.max(0, daysUntilNextPeriod);

  // 1. PMDD / Luteal Precaution
  const daysUntilLuteal = Math.max(0, daysUntilCurrentCycleOvulation + 1);
  precautions.push({
    id: 'prec-pmdd-luteal',
    category: 'pmdd_shield',
    phaseTarget: 'Upcoming Luteal Phase',
    urgency: daysUntilLuteal <= 4 ? 'high' : 'moderate',
    daysUntilActive: daysUntilLuteal,
    title: 'Pre-Luteal Neuro-Hormonal Shield',
    advice: `Your luteal phase is projected in ${daysUntilLuteal} days. To blunt expected progesterone drops, queue 10-minute vagal toning videos, reduce refined sugar, and maintain regular sleep.`,
  });

  // 2. Dysmenorrhea / Cramp Precaution
  precautions.push({
    id: 'prec-cramp-prep',
    category: 'cramp_prep',
    phaseTarget: 'Upcoming Menses (Day 1-2)',
    urgency: countdownToDisplay <= 3 ? 'high' : 'moderate',
    daysUntilActive: countdownToDisplay,
    title: painLevel >= 6 ? 'Severe Dysmenorrhea Pre-Emptive Protocol' : 'Menstrual Cramp Readiness',
    advice:
      countdownToDisplay === 0
        ? `Period due today. ${
            painLevel >= 6
              ? 'Pre-hydrate with electrolytes, prepare heat therapy, and switch heavy training to pelvic floor release.'
              : 'Keep magnesium glycinate on hand and transition to gentle somatic walking.'
          }`
        : `Next period starts in ~${countdownToDisplay} days. ${
            painLevel >= 6
              ? 'Pre-hydrate with electrolytes, prepare heat therapy, and switch heavy training to pelvic floor release 48 hours prior.'
              : 'Keep magnesium glycinate on hand and transition to gentle somatic walking.'
          }`,
  });

  // 3. Heavy Flow / Iron Precaution
  if (
    flowIntensity === 'heavy' ||
    flowIntensity === 'severe' ||
    answers['q2'] === 'q2_opt3' ||
    answers['q2'] === 'q2_opt4'
  ) {
    precautions.push({
      id: 'prec-iron-flow',
      category: 'iron_nutrition',
      phaseTarget: 'Menstrual Peak',
      urgency: 'high',
      daysUntilActive: countdownToDisplay,
      title: 'Menorrhagia & Ferritin Protection Alert',
      advice:
        'Given your heavy flow pattern, increase dietary heme iron (lentils, spinach, red meat) and vitamin C 3 days before menses to avoid acute lethargy and brain fog.',
    });
  }

  // 4. Workout Pacing & Cortisol
  precautions.push({
    id: 'prec-workout-pacing',
    category: 'workout_pacing',
    phaseTarget: 'Cycle Transition',
    urgency: 'low',
    daysUntilActive: Math.min(daysUntilLuteal, countdownToDisplay),
    title: 'Bio-Adaptive Strain Ceiling',
    advice: `Predicted cycle length is ${avgCycleLength} days (${
      regularityStatus === 'regular' ? 'Consistent Rhythm' : 'High Variance'
    }). Keep strain moderate and prioritize restorative sleep windows.`,
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
  };
}

