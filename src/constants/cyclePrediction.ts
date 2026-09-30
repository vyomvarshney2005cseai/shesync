import type { PastCycleRecord, CyclePrediction, PrecautionMeasure } from '@/types';

export function calculateCyclePredictionAndPrecautions(
  rememberedCount: number,
  cycles: PastCycleRecord[],
  answers: Record<string, string> = {},
  painLevel: number = 4,
  flowIntensity: string = 'moderate'
): CyclePrediction {
  const validCycles = cycles.slice(0, Math.max(1, rememberedCount));
  
  // Calculate average cycle length
  const totalLength = validCycles.reduce((sum, c) => sum + (c.lengthDays || 28), 0);
  const avgCycleLength = Math.round(totalLength / validCycles.length) || 28;

  // Calculate variance
  let variance = 0;
  if (validCycles.length > 1) {
    const sumSquareDiffs = validCycles.reduce(
      (sum, c) => sum + Math.pow(c.lengthDays - avgCycleLength, 2),
      0
    );
    variance = Math.round(Math.sqrt(sumSquareDiffs / validCycles.length) * 10) / 10;
  }

  // Regularity Status
  let regularityStatus: CyclePrediction['regularityStatus'] = 'regular';
  let confidencePercentage = 88;

  if (answers['q1'] === 'q1_opt4' || answers['q1'] === 'q1_opt5' || variance > 5) {
    regularityStatus = 'irregular_pcos';
    confidencePercentage = 68;
  } else if (variance > 2.5) {
    regularityStatus = 'moderate_variance';
    confidencePercentage = 78;
  }

  // Most recent cycle
  const mostRecent = validCycles[0] || {
    daysAgo: 14,
    lengthDays: avgCycleLength,
    periodDurationDays: 5,
    startDate: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
  };

  const daysAgo = Math.max(0, mostRecent.daysAgo);
  const daysUntilNextPeriod = Math.max(1, avgCycleLength - daysAgo);

  // Projected Dates
  const today = new Date();
  const nextPeriodDateObj = new Date(today.getTime() + daysUntilNextPeriod * 86400000);
  const nextPeriodDateStr = nextPeriodDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Ovulation Window (typically 14 days before next period)
  const ovulationDayFromLastStart = Math.max(10, avgCycleLength - 14);
  const daysUntilOvulation = ovulationDayFromLastStart - daysAgo;
  const ovulStart = new Date(today.getTime() + (daysUntilOvulation - 2) * 86400000);
  const ovulEnd = new Date(today.getTime() + (daysUntilOvulation + 2) * 86400000);
  const ovulationWindowStr = `${ovulStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${ovulEnd.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  // Luteal Phase Window
  const lutealStart = new Date(today.getTime() + (daysUntilOvulation + 1) * 86400000);
  const lutealEnd = new Date(nextPeriodDateObj.getTime() - 86400000);
  const lutealPhaseWindowStr = `${lutealStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${lutealEnd.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  // Build Personalized Precaution Measures
  const precautions: PrecautionMeasure[] = [];

  // 1. PMDD / Luteal Precaution
  const daysUntilLuteal = Math.max(0, daysUntilOvulation + 1);
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
    urgency: daysUntilNextPeriod <= 3 ? 'high' : 'moderate',
    daysUntilActive: daysUntilNextPeriod,
    title: painLevel >= 6 ? 'Severe Dysmenorrhea Pre-Emptive Protocol' : 'Menstrual Cramp Readiness',
    advice: `Next period starts in ~${daysUntilNextPeriod} days. ${
      painLevel >= 6
        ? `Pre-hydrate with electrolytes, prepare heat therapy, and switch heavy training to pelvic floor release 48 hours prior.`
        : `Keep magnesium glycinate on hand and transition to gentle somatic walking.`
    }`,
  });

  // 3. Heavy Flow / Iron Precaution
  if (flowIntensity === 'heavy' || flowIntensity === 'severe' || answers['q2'] === 'q2_opt3' || answers['q2'] === 'q2_opt4') {
    precautions.push({
      id: 'prec-iron-flow',
      category: 'iron_nutrition',
      phaseTarget: 'Menstrual Peak',
      urgency: 'high',
      daysUntilActive: daysUntilNextPeriod,
      title: 'Menorrhagia & Ferritin Protection Alert',
      advice: 'Given your heavy flow pattern, increase dietary heme iron (lentils, spinach, red meat) and vitamin C 3 days before menses to avoid acute lethargy and brain fog.',
    });
  }

  // 4. Workout Pacing & Cortisol
  precautions.push({
    id: 'prec-workout-pacing',
    category: 'workout_pacing',
    phaseTarget: 'Cycle Transition',
    urgency: 'low',
    daysUntilActive: Math.min(daysUntilLuteal, daysUntilNextPeriod),
    title: 'Bio-Adaptive Strain Ceiling',
    advice: `Predicted cycle length is ${avgCycleLength} days (${regularityStatus === 'regular' ? 'Consistent Rhythm' : 'High Variance'}). Keep strain moderate and prioritize restorative sleep windows.`,
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
