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
} from '@/types';
import { calculateArchetype } from '@/constants/assessment';
import { calculateCyclePredictionAndPrecautions } from '@/constants/cyclePrediction';

const initialPastCycles: PastCycleRecord[] = [
  {
    id: 'cycle-1',
    cycleNumber: 1,
    startDate: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
    daysAgo: 28,
    lengthDays: 28,
    periodDurationDays: 5,
  },
  {
    id: 'cycle-2',
    cycleNumber: 2,
    startDate: new Date(Date.now() - 56 * 86400000).toISOString().split('T')[0],
    daysAgo: 56,
    lengthDays: 29,
    periodDurationDays: 5,
  },
  {
    id: 'cycle-3',
    cycleNumber: 3,
    startDate: new Date(Date.now() - 86 * 86400000).toISOString().split('T')[0],
    daysAgo: 86,
    lengthDays: 30,
    periodDurationDays: 6,
  },
];


// ============================================================
// Dynamic 90-day clinical trend data generator
// Scales realistically with the user's logged pain and cycle status
// ============================================================
function generateDynamicTrendData(
  painSeverity: number = 4,
  isIrregular: boolean = true
): DailyDataPoint[] {
  const data: DailyDataPoint[] = [];
  const basePain = Math.max(1, Math.min(10, painSeverity));

  // Cycle 1: Days 1-28
  for (let d = 1; d <= 28; d++) {
    const isMenstrual = d <= 5;
    const isLateLuteal = d >= 22;
    let dayPain: number;

    if (isMenstrual) {
      dayPain = Math.max(1, basePain * 0.95 + (Math.sin(d) * 0.6));
    } else if (isLateLuteal) {
      dayPain = Math.max(1, basePain * 0.75 + (Math.cos(d) * 0.5));
    } else {
      dayPain = Math.max(0.5, basePain * 0.25 + (Math.sin(d * 2) * 0.4));
    }

    data.push({
      day: d,
      painSeverity: Math.min(10, Math.round(dayPain * 10) / 10),
      cycleDay: d,
      isMenstrual,
      isAnovulatory: false,
    });
  }

  // Cycle 2: Days 29-73 (if irregular, simulated 45-day anovulatory gap)
  for (let d = 29; d <= 73; d++) {
    const dayInGap = d - 28;
    const isLateLuteal = isIrregular ? dayInGap >= 32 : (dayInGap % 28) >= 22;
    const isMensesInCycle2 = !isIrregular && (dayInGap % 28) <= 5;

    let dayPain: number;
    if (isIrregular) {
      if (isLateLuteal) {
        dayPain = Math.max(1.5, basePain * 0.9 + (Math.sin(d) * 0.8));
      } else {
        dayPain = Math.max(0.8, basePain * 0.35 + (Math.cos(d * 1.5) * 0.5));
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
    const isMenstrual = newCycleDay <= 5;
    const dayPain = isMenstrual
      ? Math.max(1, basePain * 0.9 + (Math.sin(d) * 0.5))
      : Math.max(0.8, basePain * 0.3);

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

// ============================================================
// Dynamic Clinical Anomalies Generator
// Generates anomalies matching the user's specific biomarkers
// ============================================================
function generateDynamicAnomalies(
  pain: number,
  flow: string,
  mood: number,
  strainScore: number,
  hrvDelta: number,
  conditions: string[]
): ClinicalAnomaly[] {
  const anomalies: ClinicalAnomaly[] = [];

  // Anomaly 1: Pain Pattern
  if (pain >= 7) {
    anomalies.push({
      id: 'anomaly-pain-severe',
      type: 'pain_cluster',
      severity: 'critical',
      title: `Severe Pelvic Dysmenorrhea Peak (${pain}/10)`,
      description: `Acute pain score of ${pain}/10 logged with pelvic cramping. Prostaglandin-driven uterine contraction markers are elevated, warranting clinical pain management protocol.`,
      icon: '⚡',
    });
  } else if (pain >= 4) {
    anomalies.push({
      id: 'anomaly-pain-mod',
      type: 'pain_cluster',
      severity: 'moderate',
      title: `Moderate Cyclical Cramping (${pain}/10)`,
      description: `Discomfort score of ${pain}/10 logged. Responsive to restorative pelvic floor somatic flows and heat therapy.`,
      icon: '🌸',
    });
  } else {
    anomalies.push({
      id: 'anomaly-pain-low',
      type: 'pain_cluster',
      severity: 'moderate',
      title: `Optimal Pelvic Comfort (${pain}/10)`,
      description: `Baseline discomfort remains low. Uterine smooth muscle exhibits balanced inflammatory tone.`,
      icon: '✨',
    });
  }

  // Anomaly 2: Flow or Cycle Interval
  if (flow === 'heavy' || flow === 'severe') {
    anomalies.push({
      id: 'anomaly-flow-hmb',
      type: 'anovulatory_gap',
      severity: 'critical',
      title: 'Heavy Menstrual Bleeding (HMB) Saturation',
      description: `Rapid protection saturation logged with clots. Recommend clinical serum ferritin/iron evaluation and gynecological consultation.`,
      icon: '🩸',
    });
  } else if (conditions.includes('PCOS') || flow === 'spotting') {
    anomalies.push({
      id: 'anomaly-pcos-gap',
      type: 'anovulatory_gap',
      severity: 'severe',
      title: '45-Day Extended Follicular / Anovulatory Gap',
      description: `Extended interval without ovulatory progesterone markers recorded. Pattern matches insulin-mediated PCOS follicular arrest.`,
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

  // Anomaly 3: Neuro-Endocrine / Mood / HRV
  if (mood <= 2) {
    anomalies.push({
      id: 'anomaly-pmdd-mood',
      type: 'hrv_drop',
      severity: 'severe',
      title: 'Late Luteal PMDD Neuro-Dysphoria Drop',
      description: `Acute mood dip (Level ${mood}/5) logged. Reflects GABA-A receptor sensitivity to shifting allopregnanolone levels prior to menstruation.`,
      icon: '🥺',
    });
  } else if (strainScore >= 65) {
    anomalies.push({
      id: 'anomaly-hrv-suppression',
      type: 'hrv_drop',
      severity: 'moderate',
      title: 'Persistent HRV Autonomic Suppression',
      description: `Heart rate variability is ${Math.abs(hrvDelta)}% below baseline, indicating heightened sympathetic strain. Somatic vagus reset exercises recommended.`,
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

  return anomalies;
}

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

  // ─── Biometrics (Initial baseline, dynamically updated) ─────
  biometrics: {
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
  },

  // ─── Cycle & Prediction ─────────────────────────
  cycle: {
    currentDay: 45,
    expectedLength: 28,
    phase: 'irregular',
    isIrregular: true,
    lastPeriodDate: '2026-08-09',
    label: 'Day 45 (Irregular Phase)',
    progesteroneStatus: 'dropping',
    conditions: ['PCOS', 'PMDD'],
  },
  rememberedCyclesCount: 3,
  pastCycles: initialPastCycles,
  cyclePrediction: calculateCyclePredictionAndPrecautions(3, initialPastCycles, {}, 6, 'spotting'),

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

    // Find most recent logged metrics
    const latestPainLog = logs.find((l) => l.pain !== undefined);
    const latestFlowLog = logs.find((l) => l.flow !== undefined);
    const latestMoodLog = logs.find((l) => l.mood !== undefined);

    const painVal = latestPainLog?.pain ?? 4;
    const flowVal = latestFlowLog?.flow ?? 'spotting';
    const moodVal = latestMoodLog?.mood ?? 3;
    const energyVal = latestMoodLog?.energy ?? 'moderate';

    // 1. Calculate Fine-Tuned Strain Score (0 - 100)
    let computedStrain = 20; // baseline

    // Assessment question modifiers
    if (answers['q1'] === 'q1_opt4' || answers['q1'] === 'q1_opt5') computedStrain += 8;
    if (answers['q5'] === 'q5_opt3' || answers['q5'] === 'q5_opt4') computedStrain += 10;
    if (answers['q6'] === 'q6_opt3' || answers['q6'] === 'q6_opt4') computedStrain += 8;
    if (answers['q7'] === 'q7_opt4') computedStrain += 10;

    // Pain contribution (0 - 10 scale => up to 40 pts)
    computedStrain += Math.round(painVal * 3.8);

    // Flow contribution
    if (flowVal === 'heavy') computedStrain += 14;
    else if (flowVal === 'severe') computedStrain += 22;
    else if (flowVal === 'moderate') computedStrain += 8;
    else if (flowVal === 'spotting') computedStrain += 4;

    // Mood contribution
    if (moodVal === 1) computedStrain += 18;
    else if (moodVal === 2) computedStrain += 12;
    else if (moodVal === 4) computedStrain -= 8;
    else if (moodVal === 5) computedStrain -= 16;

    // Energy contribution
    if (energyVal === 'low') computedStrain += 8;
    else if (energyVal === 'high') computedStrain -= 8;

    const finalStrain = Math.min(96, Math.max(12, computedStrain));
    const strainLevel: 'low' | 'moderate' | 'high' | 'severe' =
      finalStrain >= 82 ? 'severe' : finalStrain >= 62 ? 'high' : finalStrain >= 38 ? 'moderate' : 'low';

    // 2. Fine-Tuned HRV
    const baseHrv = 58;
    const currentHrv = Math.round(76 - (finalStrain / 100) * 50);
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

    // 3. Fine-Tuned Cortisol
    let cortisolLevel: 'low' | 'normal' | 'elevated' | 'high' = 'normal';
    let cortisolValue = 13.5;
    let isOverride = false;

    if (finalStrain >= 65 || painVal >= 7 || moodVal <= 2) {
      cortisolLevel = 'high';
      cortisolValue = Math.round((24.0 + (finalStrain / 100) * 5.8) * 10) / 10;
      isOverride = true;
    } else if (finalStrain >= 40) {
      cortisolLevel = 'elevated';
      cortisolValue = Math.round((18.0 + (finalStrain / 100) * 3.5) * 10) / 10;
      isOverride = true;
    } else {
      cortisolLevel = 'normal';
      cortisolValue = Math.round((11.0 + (finalStrain / 100) * 4) * 10) / 10;
      isOverride = false;
    }

    // 4. Fine-Tuned Sleep
    let hoursSlept = 7;
    let minutesSlept = 30;
    let sleepDeficit = false;
    let sleepSeverity: 'mild' | 'moderate' | 'severe' = 'mild';
    let sleepQuality = 80;

    if (answers['q5'] === 'q5_opt4' || energyVal === 'low' || finalStrain >= 75) {
      hoursSlept = 4;
      minutesSlept = 40;
      sleepDeficit = true;
      sleepSeverity = 'severe';
      sleepQuality = 34;
    } else if (answers['q5'] === 'q5_opt3' || finalStrain >= 50) {
      hoursSlept = 6;
      minutesSlept = 15;
      sleepDeficit = true;
      sleepSeverity = 'moderate';
      sleepQuality = 56;
    }

    const sleepLabel = `${hoursSlept}h ${minutesSlept}m (${
      sleepDeficit ? `${sleepSeverity === 'severe' ? 'Severe ' : ''}Deficit` : 'Restorative'
    })`;

    // 5. Fine-Tuned Cycle Phase & Conditions
    const conditions = [...state.cycle.conditions];
    if (painVal >= 6 && !conditions.includes('Dysmenorrhea')) conditions.push('Dysmenorrhea');
    if ((flowVal === 'heavy' || flowVal === 'severe') && !conditions.includes('Menorrhagia'))
      conditions.push('Menorrhagia');
    if (moodVal <= 2 && !conditions.includes('PMDD')) conditions.push('PMDD');

    let cyclePhase: CycleData['phase'] = state.cycle.phase;
    let cycleDay = state.cycle.currentDay;
    let cycleLabel = state.cycle.label;

    if (flowVal === 'moderate' || flowVal === 'heavy' || flowVal === 'severe') {
      cyclePhase = 'menstrual';
      cycleDay = 2;
      cycleLabel = `Day 2 (Active ${flowVal === 'heavy' ? 'Heavy ' : ''}Menstrual Flow)`;
    } else if (flowVal === 'spotting') {
      cyclePhase = 'luteal';
      cycleDay = 26;
      cycleLabel = 'Day 26 (Premenstrual Spotting)';
    } else if (state.cycle.isIrregular) {
      cyclePhase = 'irregular';
      cycleDay = 45;
      cycleLabel = 'Day 45 (Irregular Luteal Gap)';
    }

    // 6. Fine-Tuned Trend Data & Anomalies
    const newTrendData = generateDynamicTrendData(painVal, state.cycle.isIrregular);
    const newAnomalies = generateDynamicAnomalies(
      painVal,
      flowVal,
      moodVal,
      finalStrain,
      hrvDelta,
      conditions
    );

    // 7. Dynamic Cycle Prediction & Precaution Engine
    const newPrediction = calculateCyclePredictionAndPrecautions(
      state.rememberedCyclesCount || 3,
      state.pastCycles || initialPastCycles,
      answers,
      painVal,
      flowVal
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
        phase: cyclePhase,
        currentDay: cycleDay,
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

  // ─── Auth Actions ────────────────────────────────
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

  logout: () =>
    set({
      isAuthenticated: false,
    }),

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

    // Trigger full analytics fine-tuning
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

  generateClinicalPDF: () => {
    set((state) => ({
      clinicalReport: { ...state.clinicalReport, isGenerating: true },
    }));
    setTimeout(() => {
      set((state) => ({
        clinicalReport: {
          ...state.clinicalReport,
          isGenerating: false,
          generatedAt: new Date().toISOString(),
        },
      }));
    }, 2500);
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

    // Immediately fine-tune all analytics across the entire application
    get().fineTuneAllAnalytics();
  },
}));
