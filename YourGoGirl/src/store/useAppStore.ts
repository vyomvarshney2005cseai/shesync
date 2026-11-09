import { create } from 'zustand';
import type {
  AppState,
  FineTuningSettings,
  DailyDataPoint,
  ClinicalAnomaly,
  BiometricSnapshot,
  CycleData,
  SymptomLog,
  PastCycleRecord,
  CyclePrediction,
  YourGoGirlMessage,
  CounsellorMode,
} from '@/types';
import { calculateArchetype } from '@/constants/assessment';
import { calculateCyclePredictionAndPrecautions } from '@/constants/cyclePrediction';
import {
  saveDailyLogToSupabase,
  saveCycleToSupabase,
  signOutSupabase,
} from '@/lib/supabaseService';
import { createInitialWelcomeMessage } from '@/lib/yourGoGirlEngine';

const initialPastCycles: PastCycleRecord[] = [
  {
    id: 'cycle-1',
    cycleNumber: 1,
    startDate: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    daysAgo: 14,
    lengthDays: 28,
    periodDurationDays: 5,
  },
  {
    id: 'cycle-2',
    cycleNumber: 2,
    startDate: new Date(Date.now() - 42 * 86400000).toISOString().split('T')[0],
    daysAgo: 42,
    lengthDays: 28,
    periodDurationDays: 5,
  },
  {
    id: 'cycle-3',
    cycleNumber: 3,
    startDate: new Date(Date.now() - 71 * 86400000).toISOString().split('T')[0],
    daysAgo: 71,
    lengthDays: 29,
    periodDurationDays: 6,
  },
];

// ============================================================
// Dynamic 90-day clinical trend data generator
// Scales realistically with the user's logged pain and cycle status
// ============================================================
function generateDynamicTrendData(
  painSeverity: number = 4,
  isIrregular: boolean = true,
  pastCycles: PastCycleRecord[] = []
): DailyDataPoint[] {
  const data: DailyDataPoint[] = [];
  const basePain = Math.max(1, Math.min(10, painSeverity));

  // Cycle 1: Days 1-28 (Most recent cycle)
  const c1Length = pastCycles[0]?.lengthDays || 28;
  const c1Duration = pastCycles[0]?.periodDurationDays || 5;

  for (let d = 1; d <= 28; d++) {
    const isMenstrual = d <= c1Duration;
    const isLateLuteal = d >= Math.max(20, c1Length - 6);
    let dayPain: number;

    if (isMenstrual) {
      const peakFactor = d <= 2 ? 1.05 : 0.8;
      dayPain = Math.max(1, basePain * peakFactor + Math.sin(d * 1.2) * 0.4);
    } else if (isLateLuteal) {
      dayPain = Math.max(1, basePain * 0.7 + Math.cos(d * 0.8) * 0.5);
    } else {
      dayPain = Math.max(0.5, basePain * 0.25 + Math.sin(d * 2) * 0.3);
    }

    data.push({
      day: d,
      painSeverity: Math.min(10, Math.round(dayPain * 10) / 10),
      cycleDay: d,
      isMenstrual,
      isAnovulatory: false,
    });
  }

  // Cycle 2: Days 29-73 (Simulated anovulatory or previous cycle)
  for (let d = 29; d <= 73; d++) {
    const dayInGap = d - 28;
    const isLateLuteal = isIrregular ? dayInGap >= 32 : (dayInGap % 28) >= 22;
    const isMensesInCycle2 = !isIrregular && (dayInGap % 28) <= c1Duration;

    let dayPain: number;
    if (isIrregular) {
      if (isLateLuteal) {
        dayPain = Math.max(1.5, basePain * 0.88 + Math.sin(d * 0.7) * 0.6);
      } else {
        dayPain = Math.max(0.8, basePain * 0.35 + Math.cos(d * 1.5) * 0.4);
      }
    } else {
      dayPain = isMensesInCycle2
        ? Math.max(1, basePain * 0.85)
        : isLateLuteal
        ? Math.max(1, basePain * 0.7)
        : 1.2;
    }

    data.push({
      day: d,
      painSeverity: Math.min(10, Math.round(dayPain * 10) / 10),
      cycleDay: isIrregular ? null : ((dayInGap - 1) % 28) + 1,
      isMenstrual: !isIrregular && isMensesInCycle2,
      isAnovulatory: isIrregular,
    });
  }

  // Cycle 3: Days 74-90 (New cycle restart)
  for (let d = 74; d <= 90; d++) {
    const newCycleDay = d - 73;
    const isMenstrual = newCycleDay <= c1Duration;
    const dayPain = isMenstrual
      ? Math.max(1, basePain * 0.9 + Math.sin(d) * 0.4)
      : Math.max(0.8, basePain * 0.28);

    data.push({
      day: d,
      painSeverity: Math.min(10, Math.round(dayPain * 10) / 10),
      cycleDay: newCycleDay,
      isMenstrual,
      isAnovulatory: false,
    });
  }

  return data;
}

function generateDynamicAnomalies(
  pain: number,
  flow: string,
  mood: number,
  strainScore: number,
  hrvDelta: number,
  conditions: string[],
  sleepDeficit: boolean = false
): ClinicalAnomaly[] {
  const anomalies: ClinicalAnomaly[] = [];

  if (pain >= 7) {
    anomalies.push({
      id: 'anomaly-pain-severe',
      type: 'pain_cluster',
      severity: 'critical',
      title: `Severe Pelvic Dysmenorrhea Peak (${pain}/10)`,
      description: `Acute pain score of ${pain}/10 logged with uterine spasms. Prostaglandin-driven myometrial contractions are elevated. Deploy heat therapy and restorative pelvic floor decompression.`,
      icon: '⚡',
    });
  } else if (pain >= 4) {
    anomalies.push({
      id: 'anomaly-pain-mod',
      type: 'pain_cluster',
      severity: 'moderate',
      title: `Moderate Cyclical Cramping (${pain}/10)`,
      description: `Discomfort score of ${pain}/10 logged. Responsive to restorative somatic flows, magnesium glycinate, and warm compresses.`,
      icon: '🌸',
    });
  } else {
    anomalies.push({
      id: 'anomaly-pain-low',
      type: 'pain_cluster',
      severity: 'moderate',
      title: `Optimal Pelvic Comfort (${pain}/10)`,
      description: `Baseline pelvic comfort remains steady. Uterine smooth muscle shows balanced inflammatory signaling and low spasm activity.`,
      icon: '✨',
    });
  }

  if (flow === 'heavy' || flow === 'severe') {
    anomalies.push({
      id: 'anomaly-flow-hmb',
      type: 'anovulatory_gap',
      severity: 'critical',
      title: 'Heavy Menstrual Bleeding (HMB) Saturation',
      description: `Rapid protection saturation logged with clot formation. Recommend monitoring serum ferritin, staying hydrated with electrolytes, and clinical consultation if saturation persists >2 hours.`,
      icon: '🩸',
    });
  } else if (conditions.includes('PCOS') || flow === 'spotting') {
    anomalies.push({
      id: 'anomaly-pcos-gap',
      type: 'anovulatory_gap',
      severity: 'severe',
      title: 'Extended Follicular / Anovulatory Gap',
      description: `Extended interval without ovulatory progesterone markers recorded. Pattern correlates with metabolic or stress-induced follicular arrest.`,
      icon: '⚠️',
    });
  } else {
    anomalies.push({
      id: 'anomaly-cycle-regular',
      type: 'anovulatory_gap',
      severity: 'moderate',
      title: 'Predictable Menstrual Phase Synchronization',
      description: `Cycle markers demonstrate consistent physiological phasing without anovulatory disruption.`,
      icon: '🔄',
    });
  }

  if (mood <= 2) {
    anomalies.push({
      id: 'anomaly-pmdd-mood',
      type: 'hrv_drop',
      severity: 'severe',
      title: 'Late Luteal PMDD Neuro-Dysphoria Drop',
      description: `Acute mood dip (Level ${mood}/5) logged. Reflects GABA-A receptor sensitivity to shifting allopregnanolone levels prior to menstruation. Somatic vagal grounding recommended.`,
      icon: '🥺',
    });
  } else if (strainScore >= 65 || hrvDelta <= -20) {
    anomalies.push({
      id: 'anomaly-hrv-suppression',
      type: 'hrv_drop',
      severity: 'moderate',
      title: 'Persistent Autonomic HRV Suppression',
      description: `Heart rate variability is ${Math.abs(hrvDelta)}% below baseline, indicating heightened sympathetic strain. Downshift workout intensity and engage slow diaphragmatic breathing.`,
      icon: '📉',
    });
  } else {
    anomalies.push({
      id: 'anomaly-autonomic-bal',
      type: 'hrv_drop',
      severity: 'moderate',
      title: 'Resilient Parasympathetic Vagal Tone',
      description: `Autonomic nervous system shows healthy vagal flexibility and stable neuro-endocrine regulation.`,
      icon: '🌿',
    });
  }

  if (sleepDeficit) {
    anomalies.push({
      id: 'anomaly-sleep-deficit',
      type: 'sleep_deficit',
      severity: 'moderate',
      title: 'Restorative Sleep Debt Detected',
      description: `Sleep duration fell short of the restorative baseline. Lack of deep slow-wave sleep impairs cortisol clearance and elevates luteal pain sensitivity.`,
      icon: '🌙',
    });
  }

  return anomalies;
}

const initialCycleState: CycleData = {
  currentDay: 14,
  expectedLength: 28,
  phase: 'ovulatory',
  isIrregular: false,
  lastPeriodDate: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
  label: 'Day 14 (Ovulatory Phase • Peak Estrogen)',
  progesteroneStatus: 'rising',
  conditions: ['Cycle Sync'],
};

const initialBiometricsState: BiometricSnapshot = {
  hrv: {
    current: 34,
    baseline: 58,
    status: 'below',
    label: '34 ms (41.4% Below Baseline)',
    delta: -41.4,
  },
  sleep: {
    hoursSlept: 5,
    minutesSlept: 30,
    deficit: true,
    severity: 'moderate',
    label: '5h 30m (Restorative Deficit)',
    quality: 42,
  },
  cortisol: {
    level: 'high',
    value: 26.8,
    isOverride: true,
    timestamp: new Date().toISOString(),
  },
  strainScore: 74,
  strainLevel: 'high',
};

export const useAppStore = create<AppState>((set, get) => ({
  // ─── User & Auth ─────────────────────────────────
  userName: 'Maya',
  userEmail: 'maya@shesync.app',
  userPhoto: undefined,
  isAuthenticated: false,

  // ─── Assessment & Fine-Tuning ─────────────────────
  isAssessmentCompleted: false,
  assessmentAnswers: {},
  fineTuningSettings: {
    archetypeId: 'pcos_strain_adaptive',
    archetypeName: 'PCOS Bio-Adaptive Synchronizer',
    archetypeTagline: 'Metabolic Stability & Cycle Harmony',
    archetypeDescription:
      'Calibrated for gentle insulin-sensitive strength, hormonal equilibrium, and nervous system recovery.',
    strainSensitivity: 'gentle',
    preferredTherapy: 'somatic',
    autoCortisolOverride: true,
    pmddEarlyShield: true,
    dailySleepTargetHours: 8.5,
    primaryCondition: 'PCOS & Metabolic Health',
  },

  // ─── Biometrics ──────────────────────────────────
  biometrics: initialBiometricsState,

  // ─── Cycle & Prediction ──────────────────────────
  cycle: initialCycleState,
  rememberedCyclesCount: 3,
  pastCycles: initialPastCycles,
  cyclePrediction: calculateCyclePredictionAndPrecautions(3, initialPastCycles, {}, 4, 'none'),

  // ─── Initial Baseline Symptom Logs ───────────────
  symptomLogs: [
    {
      id: 'log-initial-pain',
      date: new Date().toISOString().split('T')[0],
      pain: 6,
      painLocation: ['Pelvic / Uterine Cramps', 'Lower Back'],
      reliefMethods: ['Heating Pad / Warm Bath'],
      notes: '[Cramping Spasms] Baseline pelvic cramping logged during setup.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'log-initial-flow',
      date: new Date().toISOString().split('T')[0],
      flow: 'spotting',
      flowColor: 'Deep Burgundy',
      notes: 'Light luteal spotting detected before full menses.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'log-initial-mood',
      date: new Date().toISOString().split('T')[0],
      mood: 2,
      energy: 'low',
      tags: ['Tender', 'Brain Fog'],
      notes: 'Luteal mood sensitivity with physical exhaustion.',
      timestamp: new Date().toISOString(),
    },
  ],

  // ─── Adaptive Movement ───────────────────────────
  todayWorkout: {
    id: 'workout-today',
    title: '20-Min Restorative Pelvic Floor Flow',
    duration: '20 min',
    intensity: 'restorative',
    type: 'Pelvic Floor Flow',
    description:
      'A gentle, restorative sequence targeting deep pelvic floor engagement, diaphragmatic breathing, and parasympathetic activation. Designed to reduce cortisol without triggering a sympathetic spike.',
    overriddenFrom: '35-Min High-Intensity Interval Training',
    reason:
      'Elevated physiological strain detected. HIIT exercise during high strain amplifies HPA axis dysregulation, which can worsen PCOS symptoms and delay cycles. This restorative flow activates the parasympathetic nervous system, reducing cortisol by ~18% within 20 minutes.',
    tags: ['Parasympathetic', 'Pelvic Floor', 'Cortisol-Safe', 'PCOS Adaptive'],
  },

  workoutHistory: [
    {
      date: '2026-09-28',
      original: '30-Min Power Yoga',
      adapted: '15-Min Gentle Stretch & Breathwork',
      reason: 'HRV dropped 41% below baseline. Sleep deficit of 3.2 hours detected.',
      strainAtTime: 76,
    },
    {
      date: '2026-09-27',
      original: '40-Min Spin Session',
      adapted: '20-Min Walking Meditation',
      reason:
        'Late luteal phase detected with elevated inflammatory markers. High-intensity cardio contraindicated.',
      strainAtTime: 71,
    },
    {
      date: '2026-09-26',
      original: '25-Min HIIT Circuit',
      adapted: '20-Min Somatic Movement Flow',
      reason:
        'Cortisol spike detected at 24.1 µg/dL. Progesterone dropping — sympathetic overload risk.',
      strainAtTime: 68,
    },
  ],

  showBiologicalReasoning: false,

  // ─── Mental Therapy & YouTube Sessions ───────────
  activeTherapy: {
    id: 'therapy-vagus',
    type: 'somatic',
    title: 'Somatic Vagus Nerve Grounding',
    description:
      'A guided somatic practice stimulating the vagus nerve through slow humming, cold water exposure cues, and bilateral tapping. Designed for acute PMDD emotional dysregulation.',
    durationSeconds: 615,
    isPlaying: false,
    progress: 0,
    youtubeUrl: 'https://www.youtube.com/watch?v=eFV0FfMc_uo',
    youtubeId: 'eFV0FfMc_uo',
  },

  cbtPrompt: {
    id: 'cbt-brainfog',
    trigger: 'severe brain fog',
    prompt:
      'You logged severe brain fog. Remember, this is a biological response to dropping progesterone — not a personal failure. What is one task we can offload today?',
    placeholder: 'e.g., "I can delegate the report review to Sarah and focus on rest..."',
    userResponse: undefined,
  },

  sosActive: false,

  // ─── YourGoGirl AI Counsellor State ──────────────
  yourGoGirlMode: 'empathetic_counsellor',
  yourGoGirlMessages: [
    createInitialWelcomeMessage('Maya', initialCycleState, initialBiometricsState),
  ],

  // ─── Clinical Report ─────────────────────────────
  clinicalReport: {
    trendData: generateDynamicTrendData(6, true),
    anomalies: generateDynamicAnomalies(6, 'spotting', 2, 74, -41.4, ['PCOS', 'PMDD']),
    isGenerating: false,
  },

  // ─── Core Fine-Tuning Analytics Engine ───────────
  fineTuneAllAnalytics: () => {
    const state = get();
    const logs = state.symptomLogs;
    const answers = state.assessmentAnswers;
    const sensitivity = state.fineTuningSettings?.strainSensitivity || 'gentle';

    const latestPainLog = logs.find((l) => l.pain !== undefined);
    const latestFlowLog = logs.find((l) => l.flow !== undefined);
    const latestMoodLog = logs.find((l) => l.mood !== undefined);

    const painVal = latestPainLog?.pain ?? 4;
    const flowVal = latestFlowLog?.flow ?? 'spotting';
    const moodVal = latestMoodLog?.mood ?? 3;
    const energyVal = latestMoodLog?.energy ?? 'moderate';

    let neuroStrain = 6;
    if (answers['q6'] === 'q6_opt4') neuroStrain += 10;
    else if (answers['q6'] === 'q6_opt3') neuroStrain += 6;

    if (answers['q7'] === 'q7_opt4') neuroStrain += 10;
    else if (answers['q7'] === 'q7_opt3') neuroStrain += 6;

    if (moodVal === 1) neuroStrain += 14;
    else if (moodVal === 2) neuroStrain += 9;
    else if (moodVal === 4) neuroStrain -= 5;
    else if (moodVal === 5) neuroStrain -= 9;

    let pelvicStrain = Math.round(painVal * 3.3);
    if (answers['q2'] === 'q2_opt4') pelvicStrain += 8;
    else if (answers['q2'] === 'q2_opt3') pelvicStrain += 5;

    let flowStrain = 4;
    if (flowVal === 'severe') flowStrain += 18;
    else if (flowVal === 'heavy') flowStrain += 12;
    else if (flowVal === 'moderate') flowStrain += 6;
    else if (flowVal === 'spotting') flowStrain += 2;

    let recoveryStrain = 4;
    if (answers['q5'] === 'q5_opt4') recoveryStrain += 10;
    else if (answers['q5'] === 'q5_opt3') recoveryStrain += 6;

    if (answers['q3'] === 'q3_opt4') recoveryStrain += 8;
    else if (answers['q3'] === 'q3_opt3') recoveryStrain += 5;

    if (energyVal === 'low') recoveryStrain += 7;
    else if (energyVal === 'high') recoveryStrain -= 6;

    if (answers['q1'] === 'q1_opt4' || answers['q1'] === 'q1_opt5') recoveryStrain += 6;
    if (answers['q8'] === 'q8_opt3' || answers['q8'] === 'q8_opt4') recoveryStrain += 5;

    let totalStrain = neuroStrain + pelvicStrain + flowStrain + recoveryStrain;

    if (sensitivity === 'gentle') {
      totalStrain = Math.round(totalStrain * 1.08);
    } else if (sensitivity === 'dynamic') {
      totalStrain = Math.round(totalStrain * 0.92);
    }

    const finalStrain = Math.min(96, Math.max(10, totalStrain));
    const strainLevel: 'low' | 'moderate' | 'high' | 'severe' =
      finalStrain >= 80
        ? 'severe'
        : finalStrain >= 60
        ? 'high'
        : finalStrain >= 36
        ? 'moderate'
        : 'low';

    const baseHrv = 58;
    const currentHrv = Math.max(18, Math.round(74 - (finalStrain / 100) * 46));
    const hrvDelta = Math.round(((currentHrv - baseHrv) / baseHrv) * 1000) / 10;
    const hrvStatus: 'below' | 'at' | 'above' =
      hrvDelta < -10 ? 'below' : hrvDelta > 10 ? 'above' : 'at';
    const hrvLabel = `${currentHrv} ms (${
      hrvStatus === 'below'
        ? `${Math.abs(hrvDelta)}% Below Baseline`
        : hrvStatus === 'above'
        ? `${hrvDelta}% Above Baseline`
        : 'Near Baseline'
    })`;

    let cortisolLevel: 'low' | 'normal' | 'elevated' | 'high' = 'normal';
    let cortisolValue = 13.5;
    let isOverride = false;

    if (finalStrain >= 65 || painVal >= 7 || moodVal <= 2) {
      cortisolLevel = 'high';
      cortisolValue = Math.round((24.0 + (finalStrain / 100) * 5.4) * 10) / 10;
      isOverride = true;
    } else if (finalStrain >= 40 || painVal >= 5) {
      cortisolLevel = 'elevated';
      cortisolValue = Math.round((17.5 + (finalStrain / 100) * 3.8) * 10) / 10;
      isOverride = true;
    } else {
      cortisolLevel = 'normal';
      cortisolValue = Math.round((11.2 + (finalStrain / 100) * 3.2) * 10) / 10;
      isOverride = false;
    }

    let hoursSlept = 7;
    let minutesSlept = 30;
    let sleepDeficit = false;
    let sleepSeverity: 'mild' | 'moderate' | 'severe' = 'mild';
    let sleepQuality = 82;

    if (answers['q5'] === 'q5_opt4' || energyVal === 'low' || finalStrain >= 75) {
      hoursSlept = 4;
      minutesSlept = 45;
      sleepDeficit = true;
      sleepSeverity = 'severe';
      sleepQuality = 34;
    } else if (answers['q5'] === 'q5_opt3' || finalStrain >= 50) {
      hoursSlept = 6;
      minutesSlept = 15;
      sleepDeficit = true;
      sleepSeverity = 'moderate';
      sleepQuality = 58;
    }

    const sleepLabel = `${hoursSlept}h ${minutesSlept}m (${
      sleepDeficit ? `${sleepSeverity === 'severe' ? 'Severe ' : ''}Deficit` : 'Restorative'
    })`;

    const activeCycles =
      state.pastCycles && state.pastCycles.length > 0 ? state.pastCycles : initialPastCycles;
    const effectiveCount = state.rememberedCyclesCount || 3;
    const newPrediction = calculateCyclePredictionAndPrecautions(
      effectiveCount,
      activeCycles,
      answers,
      painVal,
      flowVal
    );

    const isIrregular = newPrediction.regularityStatus === 'irregular_pcos';

    const mostRecentCycle = activeCycles[0];
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let daysSinceStart = 14;
    let periodStartDateStr = mostRecentCycle?.startDate;
    if (periodStartDateStr) {
      const parts = periodStartDateStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        const startMidnight = new Date(parts[0], parts[1] - 1, parts[2]);
        daysSinceStart = Math.max(
          0,
          Math.round((todayMidnight.getTime() - startMidnight.getTime()) / 86400000)
        );
      }
    } else if (typeof mostRecentCycle?.daysAgo === 'number') {
      daysSinceStart = Math.max(0, mostRecentCycle.daysAgo);
      periodStartDateStr = new Date(todayMidnight.getTime() - daysSinceStart * 86400000)
        .toISOString()
        .split('T')[0];
    }

    const calculatedCycleDay = Math.max(1, daysSinceStart + 1);
    const predictedLen = newPrediction.predictedCycleLength || 28;
    const periodDuration = mostRecentCycle?.periodDurationDays || 5;

    let cyclePhase: CycleData['phase'] = 'follicular';
    let cycleLabel = `Day ${calculatedCycleDay}`;

    if (
      flowVal === 'moderate' ||
      flowVal === 'heavy' ||
      flowVal === 'severe' ||
      calculatedCycleDay <= periodDuration
    ) {
      cyclePhase = 'menstrual';
      cycleLabel = `Day ${calculatedCycleDay} (Active ${
        flowVal !== 'none' ? flowVal.toUpperCase() + ' ' : ''
      }Menstrual Flow)`;
    } else if (calculatedCycleDay < Math.max(8, predictedLen - 16)) {
      cyclePhase = 'follicular';
      cycleLabel = `Day ${calculatedCycleDay} (Follicular Phase • Rising Energy)`;
    } else if (calculatedCycleDay <= Math.max(12, predictedLen - 12)) {
      cyclePhase = 'ovulatory';
      cycleLabel = `Day ${calculatedCycleDay} (Ovulatory Phase • Peak Estrogen)`;
    } else if (calculatedCycleDay <= predictedLen) {
      cyclePhase = 'luteal';
      cycleLabel = `Day ${calculatedCycleDay} (Luteal Phase${
        flowVal === 'spotting' ? ' • Spotting' : ''
      })`;
    } else {
      cyclePhase = isIrregular ? 'irregular' : 'luteal';
      cycleLabel = isIrregular
        ? `Day ${calculatedCycleDay} (Extended / Irregular Gap)`
        : `Day ${calculatedCycleDay} (Delayed / Overdue • Cycle Completion Expected)`;
    }

    const conditions = [...state.cycle.conditions];
    if (painVal >= 6 && !conditions.includes('Dysmenorrhea')) conditions.push('Dysmenorrhea');
    if ((flowVal === 'heavy' || flowVal === 'severe') && !conditions.includes('Menorrhagia'))
      conditions.push('Menorrhagia');
    if (moodVal <= 2 && !conditions.includes('PMDD')) conditions.push('PMDD');
    if (isIrregular && !conditions.includes('PCOS')) conditions.push('PCOS');

    const newTrendData = generateDynamicTrendData(painVal, isIrregular, activeCycles);
    const newAnomalies = generateDynamicAnomalies(
      painVal,
      flowVal,
      moodVal,
      finalStrain,
      hrvDelta,
      conditions,
      sleepDeficit
    );

    set({
      biometrics: {
        hrv: {
          current: currentHrv,
          baseline: baseHrv,
          status: hrvStatus,
          label: hrvLabel,
          delta: hrvDelta,
        },
        sleep: {
          hoursSlept,
          minutesSlept,
          deficit: sleepDeficit,
          severity: sleepSeverity,
          label: sleepLabel,
          quality: sleepQuality,
        },
        cortisol: {
          level: cortisolLevel,
          value: cortisolValue,
          isOverride,
          timestamp: new Date().toISOString(),
        },
        strainScore: finalStrain,
        strainLevel,
      },
      cycle: {
        ...state.cycle,
        expectedLength: predictedLen,
        lastPeriodDate: periodStartDateStr || state.cycle.lastPeriodDate,
        isIrregular,
        phase: cyclePhase,
        currentDay: calculatedCycleDay,
        label: cycleLabel,
        conditions: conditions.slice(0, 3),
      },
      cyclePrediction: newPrediction,
      clinicalReport: {
        ...state.clinicalReport,
        trendData: newTrendData,
        anomalies: newAnomalies,
      },
    });
  },

  // ─── Past Cycles & Predictions ───────────────────
  savePastCycles: (count: number, cycles: PastCycleRecord[]) => {
    const state = get();
    const latestPainLog = state.symptomLogs.find((l) => l.pain !== undefined);
    const latestFlowLog = state.symptomLogs.find((l) => l.flow !== undefined);
    const painVal = latestPainLog?.pain ?? 4;
    const flowVal = latestFlowLog?.flow ?? 'spotting';

    const newPrediction = calculateCyclePredictionAndPrecautions(
      count,
      cycles,
      state.assessmentAnswers,
      painVal,
      flowVal
    );

    const mostRecent = cycles[0];
    const isIrregular = newPrediction.regularityStatus === 'irregular_pcos';

    set((s) => ({
      rememberedCyclesCount: count,
      pastCycles: cycles,
      cyclePrediction: newPrediction,
      cycle: {
        ...s.cycle,
        expectedLength: newPrediction.predictedCycleLength,
        lastPeriodDate: mostRecent?.startDate || s.cycle.lastPeriodDate,
        isIrregular,
      },
    }));

    get().fineTuneAllAnalytics();

    cycles.forEach((c) => {
      saveCycleToSupabase({
        start_date: c.startDate,
        cycle_length: c.lengthDays,
      }).catch(() => {});
    });
  },

  // ─── Actions ─────────────────────────────────────
  toggleAudioPlayback: () =>
    set((state) => ({
      activeTherapy: {
        ...state.activeTherapy,
        isPlaying: !state.activeTherapy.isPlaying,
      },
    })),

  updateAudioProgress: (progress: number) =>
    set((state) => ({
      activeTherapy: {
        ...state.activeTherapy,
        progress: Math.min(Math.max(progress, 0), 1),
      },
    })),

  submitCBTResponse: (response: string) =>
    set((state) => ({
      cbtPrompt: {
        ...state.cbtPrompt,
        userResponse: response,
      },
    })),

  login: (email?: string, name?: string) =>
    set((state) => ({
      isAuthenticated: true,
      userName: name || state.userName || 'Maya',
      userEmail: email || state.userEmail || 'maya@shesync.app',
    })),

  signup: (name: string, email: string) =>
    set({
      isAuthenticated: true,
      userName: name,
      userEmail: email,
    }),

  logout: async () => {
    try {
      await signOutSupabase();
    } catch (e) {
      console.warn('Logout signOutSupabase error', e);
    }
    set({
      isAuthenticated: false,
      userName: '',
      userEmail: '',
      userPhoto: undefined,
      isAssessmentCompleted: false,
    });
  },

  updateUserPhoto: (uri: string) =>
    set({
      userPhoto: uri,
    }),

  completeAssessment: (answers: Record<string, string>) => {
    const archetype = calculateArchetype(answers);
    const newConditions = ['PCOS', 'PMDD'];
    if (archetype.primaryCondition && !newConditions.includes(archetype.primaryCondition)) {
      newConditions.unshift(archetype.primaryCondition);
    }

    set((state) => ({
      isAssessmentCompleted: true,
      assessmentAnswers: answers,
      fineTuningSettings: {
        archetypeId: archetype.id,
        archetypeName: archetype.name,
        archetypeTagline: archetype.tagline,
        archetypeDescription: archetype.description,
        strainSensitivity: archetype.recommendedStrainSensitivity,
        preferredTherapy: archetype.defaultTherapy,
        autoCortisolOverride: archetype.cortisolOverrideDefault,
        pmddEarlyShield: archetype.pmddAlertDefault,
        dailySleepTargetHours: archetype.sleepTargetHours,
        primaryCondition: archetype.primaryCondition,
      },
      cycle: {
        ...state.cycle,
        conditions: newConditions.slice(0, 2),
      },
    }));

    get().fineTuneAllAnalytics();
  },

  updateFineTuningSettings: (settings: Partial<FineTuningSettings>) =>
    set((state) => ({
      fineTuningSettings: {
        ...state.fineTuningSettings,
        ...settings,
      },
    })),

  triggerSOS: () => set({ sosActive: true }),
  dismissSOS: () => set({ sosActive: false }),

  toggleBiologicalReasoning: () =>
    set((state) => ({
      showBiologicalReasoning: !state.showBiologicalReasoning,
    })),

  generateClinicalPDF: async () => {
    set((state) => ({
      clinicalReport: { ...state.clinicalReport, isGenerating: true },
    }));

    try {
      const { generateAndDownloadClinicalPDF } = await import('@/lib/pdfReportService');
      await generateAndDownloadClinicalPDF(get());
      set((state) => ({
        clinicalReport: {
          ...state.clinicalReport,
          isGenerating: false,
          generatedAt: new Date().toISOString(),
        },
      }));
    } catch (err) {
      console.error('[Report] Failed to generate/share PDF:', err);
      set((state) => ({
        clinicalReport: {
          ...state.clinicalReport,
          isGenerating: false,
        },
      }));
    }
  },

  setStrainScore: (score: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(score)));
    const level: 'low' | 'moderate' | 'high' | 'severe' =
      clamped >= 82 ? 'severe' : clamped >= 62 ? 'high' : clamped >= 38 ? 'moderate' : 'low';
    set((state) => ({
      biometrics: {
        ...state.biometrics,
        strainScore: clamped,
        strainLevel: level,
      },
    }));
  },

  logSymptom: (log: Partial<SymptomLog>) => {
    const newLog: SymptomLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      ...log,
    };

    set((state) => ({
      symptomLogs: [newLog, ...state.symptomLogs],
    }));

    get().fineTuneAllAnalytics();

    saveDailyLogToSupabase({
      log_date: newLog.date,
      pain_level: newLog.pain ?? null,
      mood: newLog.mood ? String(newLog.mood) : null,
      symptoms: newLog.painLocation || [],
      notes: newLog.notes || null,
    }).catch(() => {});
  },

  // ─── YourGoGirl AI Counsellor Actions ────────────
  addYourGoGirlMessage: (msg: YourGoGirlMessage) =>
    set((state) => ({
      yourGoGirlMessages: [...state.yourGoGirlMessages, msg],
    })),

  setYourGoGirlMode: (mode: CounsellorMode) =>
    set({ yourGoGirlMode: mode }),

  clearYourGoGirlChat: () =>
    set((state) => ({
      yourGoGirlMessages: [
        createInitialWelcomeMessage(state.userName, state.cycle, state.biometrics),
      ],
    })),
}));
