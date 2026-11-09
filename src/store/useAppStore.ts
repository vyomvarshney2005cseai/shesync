import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceStorage } from './storage';
import type {
  AppState,
  FineTuningSettings,
  DailyDataPoint,
  ClinicalAnomaly,
  BiometricSnapshot,
  CycleData,
  SymptomLog,
  SleepLog,
  PastCycleRecord,
  CyclePrediction,
  CBTPrompt,
  TherapySession,
  WorkoutHistory,
  AdaptiveWorkout,
  ClinicalReport,
  YourGoGirlMessage,
  CounsellorMode,
  HealthCheckAnswers,
  CareContact,
} from '@/types';
import { calculateArchetype } from '@/constants/assessment';
import { calculateCyclePredictionAndPrecautions } from '@/constants/cyclePrediction';
import { signOutSupabase } from '@/lib/supabaseService';
import { daysBetweenKeys, daysSinceKey, lastNDaysKeys, todayKey } from '@/lib/dates';
import { recommendWorkout } from '@/lib/fitness';
import { recentLog, recentSignals } from '@/lib/recent';
import { createInitialWelcomeMessage } from '@/lib/yourGoGirlEngine';
import { useFitnessStore } from './useFitnessStore';
import { useStudyStore } from './useStudyStore';
import { useGamesStore } from './useGamesStore';

// ============================================================
// Defaults for a brand-new account.
//
// New users start EMPTY. Earlier builds shipped demo logs, demo cycles,
// a demo user ("Maya") and invented workout history as if they were the
// user's own data, and hard-coded PCOS + PMDD onto every account.
// ============================================================

const DEFAULT_SETTINGS: FineTuningSettings = {
  archetypeId: 'empowered_cycle_optimizer',
  archetypeName: 'Cycle in Sync',
  archetypeTagline: 'Energy that follows your cycle',
  archetypeDescription: 'Answer the 10 questions to personalise SheSync.',
  strainSensitivity: 'balanced',
  preferredTherapy: 'somatic',
  autoCortisolOverride: true,
  pmddEarlyShield: false,
  dailySleepTargetHours: 8,
  primaryCondition: 'General wellbeing',
};

const DEFAULT_CBT: CBTPrompt = {
  id: 'cbt-general',
  trigger: 'your check-in',
  prompt:
    'Hard days are information, not failure. What is one small thing you could take off your plate today?',
  placeholder: 'e.g. "I can ask a friend to share class notes today"',
  userResponse: undefined,
};

const DEFAULT_THERAPY: TherapySession = {
  id: 'therapy-vagus',
  type: 'somatic',
  title: 'Somatic Vagus Nerve Grounding',
  description:
    'A guided somatic practice using slow humming, gentle neck release and bilateral tapping to settle a racing nervous system.',
  durationSeconds: 615,
  isPlaying: false,
  progress: 0,
  youtubeUrl: 'https://www.youtube.com/watch?v=eFV0FfMc_uo',
  youtubeId: 'eFV0FfMc_uo',
};

/** Fields that belong to one person and are wiped on sign-out / new account. */
function freshUserData() {
  return {
    userName: '',
    userEmail: '',
    userPhoto: undefined as string | undefined,
    isAuthenticated: false,
    isOfflineAccount: false,
    focusAreas: [] as string[],
    isAssessmentCompleted: false,
    assessmentAnswers: {} as Record<string, string>,
    fineTuningSettings: { ...DEFAULT_SETTINGS },
    healthCheck: {} as HealthCheckAnswers,
    healthCheckCompleted: false,
    syncCompletedAt: '',
    careContacts: [] as CareContact[],
    rememberedCyclesCount: 0,
    pastCycles: [] as PastCycleRecord[],
    symptomLogs: [] as SymptomLog[],
    sleepLogs: [] as SleepLog[],
    workoutHistory: [] as WorkoutHistory[],
    cbtPrompt: { ...DEFAULT_CBT },
    activeTherapy: { ...DEFAULT_THERAPY },
    showBiologicalReasoning: false,
    sosActive: false,
    yourGoGirlMessages: [] as YourGoGirlMessage[],
    yourGoGirlMode: 'empathetic_counsellor' as CounsellorMode,
  };
}

type UserData = ReturnType<typeof freshUserData>;

// ============================================================
// Helpers
// ============================================================

/** `daysAgo` is stored at save time and goes stale; always re-derive it from the start date. */
export function withFreshDaysAgo(cycles: PastCycleRecord[]): PastCycleRecord[] {
  return cycles
    .filter((c) => !!c.startDate)
    .map((c) => ({ ...c, daysAgo: Math.max(0, daysSinceKey(c.startDate)) }))
    .sort((a, b) => a.daysAgo - b.daysAgo)
    .map((c, i) => ({ ...c, cycleNumber: i + 1 }));
}

const BLEEDING_FLOWS = new Set(['light', 'moderate', 'heavy', 'severe']);

// ============================================================
// 90-day trend — built ONLY from what the user logged.
// (Earlier builds drew sine waves and labelled them as her history.)
// ============================================================
function buildTrendData(logs: SymptomLog[], cycles: PastCycleRecord[]): DailyDataPoint[] {
  const keys = lastNDaysKeys(90);
  const painByDay = new Map<string, number>();
  const bleedingDays = new Set<string>();
  for (const l of logs) {
    if (typeof l.pain === 'number') painByDay.set(l.date, Math.max(painByDay.get(l.date) ?? 0, l.pain));
    if (l.flow && BLEEDING_FLOWS.has(l.flow)) bleedingDays.add(l.date);
  }
  // Oldest cycle first so "latest start on or before this day" is easy.
  const starts = [...cycles].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));

  return keys.map((key, i) => {
    let cycleDay: number | null = null;
    let isMenstrual = bleedingDays.has(key);
    let isAnovulatory = false;
    for (let c = starts.length - 1; c >= 0; c--) {
      const cyc = starts[c];
      if (cyc.startDate <= key) {
        const offset = daysBetweenKeys(cyc.startDate, key);
        cycleDay = offset + 1;
        if (offset < (cyc.periodDurationDays || 5)) isMenstrual = true;
        // A saved cycle longer than 35 days is a long / possibly anovulatory cycle.
        const next = starts[c + 1];
        const length = next ? daysBetweenKeys(cyc.startDate, next.startDate) : cyc.lengthDays;
        if (length > 35 && offset < length) isAnovulatory = true;
        break;
      }
    }
    return {
      day: i + 1,
      dateKey: key,
      painSeverity: painByDay.has(key) ? painByDay.get(key)! : null,
      cycleDay,
      isMenstrual,
      isAnovulatory,
    };
  });
}

// ============================================================
// Patterns to discuss with a doctor — from the last 30 days of logs.
// Worded as observations, never as diagnoses.
// ============================================================
function buildPatterns(
  logs: SymptomLog[],
  sleepLogs: SleepLog[],
  cycles: PastCycleRecord[],
  prediction: CyclePrediction,
  sleepTarget: number
): { anomalies: ClinicalAnomaly[]; flags: string[] } {
  const anomalies: ClinicalAnomaly[] = [];
  const flags: string[] = [];
  const last30 = logs.filter((l) => {
    const age = daysSinceKey(l.date);
    return age >= 0 && age <= 30;
  });

  const pains = last30.filter((l) => typeof l.pain === 'number').map((l) => l.pain as number);
  if (pains.length) {
    const maxPain = Math.max(...pains);
    if (maxPain >= 7) {
      flags.push('Severe period pain logged');
      anomalies.push({
        id: 'pattern-pain-severe',
        type: 'pain_cluster',
        severity: 'critical',
        title: `Severe period pain logged (${maxPain}/10)`,
        description:
          'Pain this strong is worth raising with a gynaecologist — especially if it stops you studying or working, or painkillers do not help. Note which cycle days it peaks.',
        icon: '⚡',
      });
    } else if (maxPain >= 4) {
      anomalies.push({
        id: 'pattern-pain-moderate',
        type: 'pain_cluster',
        severity: 'moderate',
        title: `Moderate cramps logged (up to ${maxPain}/10)`,
        description: 'Heat, gentle movement and rest help many people. Track whether it changes cycle to cycle.',
        icon: '🌸',
      });
    }
  }

  const heavyDays = new Set(last30.filter((l) => l.flow === 'heavy' || l.flow === 'severe').map((l) => l.date));
  if (heavyDays.size) {
    flags.push('Heavy flow logged');
    anomalies.push({
      id: 'pattern-flow-heavy',
      type: 'flow_heavy',
      severity: 'critical',
      title: `Heavy flow logged on ${heavyDays.size} day${heavyDays.size > 1 ? 's' : ''}`,
      description:
        'See a doctor if you soak a pad or tampon every 1–2 hours, pass clots bigger than a ₹2 coin, bleed for more than 7 days, or feel dizzy or breathless. Ask whether an iron (ferritin) test makes sense.',
      icon: '🩸',
    });
  }

  if (prediction.regularityStatus === 'irregular_pcos') {
    const lengths = cycles.map((c) => c.lengthDays).filter((n) => n > 0);
    const range = lengths.length > 1 ? ` Your saved cycles range from ${Math.min(...lengths)} to ${Math.max(...lengths)} days.` : '';
    flags.push('Irregular cycle lengths');
    anomalies.push({
      id: 'pattern-cycle-irregular',
      type: 'anovulatory_gap',
      severity: 'severe',
      title: 'Irregular cycle lengths',
      description: `Cycles shorter than 21 days, longer than 35 days, or that vary a lot are worth checking with a gynaecologist, who may suggest tests (for example for PCOS or thyroid).${range}`,
      icon: '🔄',
    });
  }

  const lowMoodDays = new Set(last30.filter((l) => typeof l.mood === 'number' && (l.mood as number) <= 2).map((l) => l.date));
  if (lowMoodDays.size) {
    if (lowMoodDays.size >= 2) flags.push('Low-mood days logged');
    anomalies.push({
      id: 'pattern-mood-low',
      type: 'mood_pattern',
      severity: lowMoodDays.size >= 3 ? 'severe' : 'moderate',
      title: `Low mood on ${lowMoodDays.size} day${lowMoodDays.size > 1 ? 's' : ''} this month`,
      description:
        'If low mood, irritability or anxiety return in the week before most periods and ease once it starts, ask your doctor about PMS/PMDD. If you ever feel unsafe, call Tele-MANAS on 14416 (free, 24×7).',
      icon: '💜',
    });
  }

  const recentSleep = sleepLogs.filter((s) => {
    const age = daysSinceKey(s.date);
    return age >= 0 && age < 7;
  });
  const shortNights = recentSleep.filter((s) => s.hours < sleepTarget - 1.5).length;
  if (shortNights >= 3) {
    flags.push('Short sleep');
    anomalies.push({
      id: 'pattern-sleep-short',
      type: 'sleep_deficit',
      severity: 'moderate',
      title: `Short sleep on ${shortNights} of the last 7 nights`,
      description: 'Sleep loss makes pain, cravings and low mood feel worse. A steady bedtime helps more than catching up at weekends.',
      icon: '🌙',
    });
  }

  return { anomalies, flags };
}

function deriveCbtPrompt(logs: SymptomLog[], previous: CBTPrompt): CBTPrompt {
  const moodLog = recentLog(logs, 'mood', 2);
  const painLog = recentLog(logs, 'pain', 2);
  let next: CBTPrompt = DEFAULT_CBT;
  if (moodLog?.tags?.includes('Brain Fog')) {
    next = {
      id: 'cbt-brainfog',
      trigger: 'brain fog',
      prompt:
        'You logged brain fog. That is your body asking for a lighter load — not a personal failure. What is one task you can make smaller or hand off today?',
      placeholder: 'e.g. "I can ask a friend to share class notes today"',
    };
  } else if (moodLog && (moodLog.mood as number) <= 2) {
    next = {
      id: 'cbt-lowmood',
      trigger: 'a low mood',
      prompt: 'You logged a low mood. Write down one thought that keeps repeating — then a kinder, more balanced version of it.',
      placeholder: 'e.g. "I am behind on everything" → "I am behind on two things and can start one today"',
    };
  } else if (painLog && (painLog.pain as number) >= 6) {
    next = {
      id: 'cbt-pain',
      trigger: 'strong pain',
      prompt: 'Pain drains focus. What would “good enough” look like for today, instead of perfect?',
      placeholder: 'e.g. "Revise one chapter with a heat pad, skip the gym"',
    };
  }
  return next.id === previous.id ? previous : { ...next, userResponse: undefined };
}

// ============================================================
// Core analytics engine — everything below is derived from the
// user's logs, assessment answers and saved cycles.
// ============================================================
type EngineInput = Pick<
  UserData,
  | 'symptomLogs'
  | 'sleepLogs'
  | 'assessmentAnswers'
  | 'fineTuningSettings'
  | 'pastCycles'
  | 'rememberedCyclesCount'
  | 'focusAreas'
  | 'cbtPrompt'
>;

interface Derived {
  biometrics: BiometricSnapshot;
  cycle: CycleData;
  cyclePrediction: CyclePrediction;
  trendData: DailyDataPoint[];
  anomalies: ClinicalAnomaly[];
  patternFlags: string[];
  todayWorkout: AdaptiveWorkout;
  workoutIsOverride: boolean;
  cbtPrompt: CBTPrompt;
  pastCycles: PastCycleRecord[];
}

function computeDerived(input: EngineInput): Derived {
  const logs = input.symptomLogs;
  const answers = input.assessmentAnswers;
  const settings = input.fineTuningSettings;
  const sensitivity = settings?.strainSensitivity || 'balanced';
  const sleepTarget = settings?.dailySleepTargetHours || 8;

  // Only recent logs describe "today": a heavy-flow log from three weeks ago
  // must not keep the user in her menstrual phase.
  const signals = recentSignals(logs);
  const flowLog = signals.flowLog;
  const painVal = signals.pain;
  const flowVal = signals.flow;
  const moodVal = signals.mood ?? 3;
  const energyVal = signals.energy ?? 'moderate';
  const sleepLog = input.sleepLogs.find((s) => {
    const age = daysSinceKey(s.date);
    return age >= 0 && age <= 1;
  });

  // ── 1. Strain score (0–100) ─────────────────────────────
  let neuroStrain = 6;
  if (answers['q6'] === 'q6_opt4') neuroStrain += 10;
  else if (answers['q6'] === 'q6_opt3') neuroStrain += 6;
  if (answers['q7'] === 'q7_opt4') neuroStrain += 10;
  else if (answers['q7'] === 'q7_opt3') neuroStrain += 6;
  if (moodVal === 1) neuroStrain += 14;
  else if (moodVal === 2) neuroStrain += 9;
  else if (moodVal === 4) neuroStrain -= 5;
  else if (moodVal === 5) neuroStrain -= 9;

  let pelvicStrain = Math.round((painVal ?? 1) * 3.3);
  if (answers['q2'] === 'q2_opt4') pelvicStrain += 8;
  else if (answers['q2'] === 'q2_opt3') pelvicStrain += 5;

  let flowStrain = 4;
  if (flowVal === 'severe') flowStrain += 18;
  else if (flowVal === 'heavy') flowStrain += 12;
  else if (flowVal === 'moderate') flowStrain += 6;
  else if (flowVal === 'spotting' || flowVal === 'light') flowStrain += 2;

  let recoveryStrain = 4;
  if (sleepLog) {
    const shortBy = sleepTarget - sleepLog.hours;
    if (shortBy >= 2.5) recoveryStrain += 10;
    else if (shortBy >= 1.5) recoveryStrain += 6;
    else if (shortBy >= 0.75) recoveryStrain += 3;
    else if (sleepLog.hours >= sleepTarget) recoveryStrain -= 3;
  } else if (answers['q5'] === 'q5_opt4') recoveryStrain += 10;
  else if (answers['q5'] === 'q5_opt3') recoveryStrain += 6;
  if (answers['q3'] === 'q3_opt4') recoveryStrain += 8;
  else if (answers['q3'] === 'q3_opt3') recoveryStrain += 5;
  if (energyVal === 'low') recoveryStrain += 7;
  else if (energyVal === 'high') recoveryStrain -= 6;
  if (answers['q1'] === 'q1_opt4' || answers['q1'] === 'q1_opt5') recoveryStrain += 6;
  if (answers['q8'] === 'q8_opt3' || answers['q8'] === 'q8_opt4') recoveryStrain += 5;

  let totalStrain = neuroStrain + pelvicStrain + flowStrain + recoveryStrain;
  if (sensitivity === 'gentle') totalStrain = Math.round(totalStrain * 1.08);
  else if (sensitivity === 'dynamic') totalStrain = Math.round(totalStrain * 0.92);

  const finalStrain = Math.min(96, Math.max(10, totalStrain));
  const strainLevel: BiometricSnapshot['strainLevel'] =
    finalStrain >= 80 ? 'severe' : finalStrain >= 60 ? 'high' : finalStrain >= 36 ? 'moderate' : 'low';

  // Internal model estimates only — never displayed as measurements.
  const baseHrv = 58;
  const currentHrv = Math.max(18, Math.round(74 - (finalStrain / 100) * 46));
  const hrvDelta = Math.round(((currentHrv - baseHrv) / baseHrv) * 1000) / 10;
  const hrvStatus: 'below' | 'at' | 'above' = hrvDelta < -10 ? 'below' : hrvDelta > 10 ? 'above' : 'at';
  const strainOverride = finalStrain >= 65 || (painVal ?? 0) >= 7 || moodVal <= 2;
  const cortisolLevel: BiometricSnapshot['cortisol']['level'] = strainOverride
    ? 'high'
    : finalStrain >= 40 || (painVal ?? 0) >= 5
    ? 'elevated'
    : 'normal';

  // ── 2. Sleep — from the user's own log ─────────────────
  let sleep: BiometricSnapshot['sleep'];
  if (sleepLog) {
    const hours = Math.floor(sleepLog.hours);
    const minutes = Math.round((sleepLog.hours - hours) * 60);
    const shortBy = Math.max(0, sleepTarget - sleepLog.hours);
    const deficit = shortBy >= 0.5;
    sleep = {
      hoursSlept: hours,
      minutesSlept: minutes,
      deficit,
      severity: shortBy >= 2 ? 'severe' : shortBy >= 1 ? 'moderate' : 'mild',
      label: deficit ? `${hours}h ${minutes}m (${shortBy.toFixed(1)}h short)` : `${hours}h ${minutes}m (on target)`,
      quality: Math.max(10, Math.min(100, Math.round((sleepLog.hours / sleepTarget) * 100))),
      logged: true,
    };
  } else {
    sleep = { hoursSlept: 0, minutesSlept: 0, deficit: false, severity: 'mild', label: 'Not logged', quality: 0, logged: false };
  }

  // ── 3. Cycle prediction ────────────────────────────────
  const cycles = withFreshDaysAgo(input.pastCycles);
  const hasCycleData = cycles.length > 0;
  const effectiveCount = hasCycleData ? Math.max(1, Math.min(cycles.length, input.rememberedCyclesCount || cycles.length)) : 1;
  const prediction = calculateCyclePredictionAndPrecautions(effectiveCount, cycles, answers, painVal ?? 2, flowVal);
  const isIrregular = prediction.regularityStatus === 'irregular_pcos';

  const mostRecent = cycles[0];
  const bleedingToday = BLEEDING_FLOWS.has(flowVal);
  let currentDay = 0;
  let phase: CycleData['phase'] = bleedingToday ? 'menstrual' : 'irregular';
  let label = bleedingToday ? 'Period logged today' : 'Add your period dates to unlock predictions';
  if (mostRecent) {
    currentDay = Math.max(1, mostRecent.daysAgo + 1);
    const predictedLen = prediction.predictedCycleLength || 28;
    const periodDuration = mostRecent.periodDurationDays || 5;
    if (bleedingToday || currentDay <= periodDuration) {
      phase = 'menstrual';
      label = `Day ${currentDay} · Menstrual phase${flowLog?.flow ? ` (${flowLog.flow} flow)` : ''}`;
    } else if (currentDay < Math.max(8, predictedLen - 16)) {
      phase = 'follicular';
      label = `Day ${currentDay} · Follicular phase`;
    } else if (currentDay <= Math.max(12, predictedLen - 12)) {
      phase = 'ovulatory';
      label = `Day ${currentDay} · Ovulatory window`;
    } else if (currentDay <= predictedLen) {
      phase = 'luteal';
      label = `Day ${currentDay} · Luteal phase`;
    } else {
      phase = isIrregular ? 'irregular' : 'luteal';
      label = isIrregular ? `Day ${currentDay} · Long cycle` : `Day ${currentDay} · Period due`;
    }
  }

  // ── 4. Patterns, trend, CBT, workout ───────────────────
  const { anomalies, flags } = buildPatterns(logs, input.sleepLogs, cycles, prediction, sleepTarget);
  const trendData = buildTrendData(logs, cycles);
  const place = useFitnessStore.getState().profile?.trainingPlace ?? 'home';
  const plan = recommendWorkout({
    phase,
    strainLevel,
    strainScore: finalStrain,
    recentPain: painVal ?? undefined,
    recentFlow: flowVal,
    place,
  });

  return {
    biometrics: {
      hrv: {
        current: currentHrv,
        baseline: baseHrv,
        status: hrvStatus,
        label: `Estimated from logs`,
        delta: hrvDelta,
      },
      sleep,
      cortisol: { level: cortisolLevel, value: 0, isOverride: strainOverride, timestamp: todayKey() },
      strainScore: finalStrain,
      strainLevel,
      recoveryScore: Math.max(5, Math.min(99, 105 - finalStrain)),
    },
    cycle: {
      currentDay,
      expectedLength: prediction.predictedCycleLength,
      phase,
      isIrregular,
      lastPeriodDate: mostRecent?.startDate ?? '',
      label,
      progesteroneStatus: phase === 'luteal' ? 'peak' : phase === 'menstrual' ? 'low' : 'rising',
      conditions: input.focusAreas.slice(0, 3),
      hasCycleData,
    },
    cyclePrediction: prediction,
    trendData,
    anomalies,
    patternFlags: flags,
    todayWorkout: plan.card,
    workoutIsOverride: plan.isOverride,
    cbtPrompt: deriveCbtPrompt(logs, input.cbtPrompt),
    pastCycles: cycles,
  };
}

function engineInput(s: EngineInput): EngineInput {
  return {
    symptomLogs: s.symptomLogs,
    sleepLogs: s.sleepLogs,
    assessmentAnswers: s.assessmentAnswers,
    fineTuningSettings: s.fineTuningSettings,
    pastCycles: s.pastCycles,
    rememberedCyclesCount: s.rememberedCyclesCount,
    focusAreas: s.focusAreas,
    cbtPrompt: s.cbtPrompt,
  };
}

function derivedState(d: Derived, report?: Partial<ClinicalReport>) {
  return {
    biometrics: d.biometrics,
    cycle: d.cycle,
    cyclePrediction: d.cyclePrediction,
    patternFlags: d.patternFlags,
    todayWorkout: d.todayWorkout,
    cbtPrompt: d.cbtPrompt,
    pastCycles: d.pastCycles,
    clinicalReport: {
      trendData: d.trendData,
      anomalies: d.anomalies,
      isGenerating: report?.isGenerating ?? false,
      generatedAt: report?.generatedAt,
    },
  };
}

function resetFeatureStores() {
  useFitnessStore.getState().reset();
  useStudyStore.getState().reset();
  useGamesStore.getState().reset();
}

const initialUser = freshUserData();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialUser,
      ...derivedState(computeDerived(engineInput(initialUser))),

      // ─── Core analytics refresh ──────────────────────
      fineTuneAllAnalytics: () => {
        const state = get();
        const d = computeDerived(engineInput(state));
        const today = todayKey();
        let workoutHistory = state.workoutHistory;
        // Record a real adaptation (once per day) when today's plan was swapped.
        if (d.workoutIsOverride && d.todayWorkout.overriddenFrom && !workoutHistory.some((h) => h.date === today)) {
          workoutHistory = [
            {
              date: today,
              original: d.todayWorkout.overriddenFrom,
              adapted: d.todayWorkout.title,
              reason: d.todayWorkout.reason ?? '',
              strainAtTime: d.biometrics.strainScore,
            },
            ...workoutHistory,
          ].slice(0, 60);
        }
        set({ ...derivedState(d, state.clinicalReport), workoutHistory });
      },

      // ─── Past cycles ─────────────────────────────────
      savePastCycles: (count: number, cycles: PastCycleRecord[]) => {
        const fresh = withFreshDaysAgo(cycles);
        set({ rememberedCyclesCount: count, pastCycles: fresh });
        get().fineTuneAllAnalytics();
      },

      // ─── Audio / CBT / SOS ───────────────────────────
      toggleAudioPlayback: () =>
        set((state) => ({ activeTherapy: { ...state.activeTherapy, isPlaying: !state.activeTherapy.isPlaying } })),

      updateAudioProgress: (progress: number) =>
        set((state) => ({
          activeTherapy: { ...state.activeTherapy, progress: Math.min(Math.max(progress, 0), 1) },
        })),

      submitCBTResponse: (response: string) =>
        set((state) => ({ cbtPrompt: { ...state.cbtPrompt, userResponse: response } })),

      triggerSOS: () => set({ sosActive: true }),
      dismissSOS: () => set({ sosActive: false }),

      toggleBiologicalReasoning: () => set((state) => ({ showBiologicalReasoning: !state.showBiologicalReasoning })),

      // ─── Auth ────────────────────────────────────────
      login: (email?: string, name?: string, options?: { offline?: boolean }) => {
        const s = get();
        const cleanEmail = (email ?? '').trim();
        const sameAccount = !!s.userEmail && s.userEmail.toLowerCase() === cleanEmail.toLowerCase();
        if (!sameAccount) {
          // A different account on this device never sees the previous person's data.
          resetFeatureStores();
          const fresh = freshUserData();
          set({ ...fresh, ...derivedState(computeDerived(engineInput(fresh))) });
        }
        set({
          isAuthenticated: true,
          userEmail: cleanEmail,
          userName: (name || get().userName || cleanEmail.split('@')[0] || 'Friend').trim(),
          isOfflineAccount: !!options?.offline,
        });
      },

      signup: (name: string, email: string, focusAreas: string[] = [], options?: { offline?: boolean }) => {
        resetFeatureStores();
        const fresh = { ...freshUserData(), focusAreas };
        set({
          ...fresh,
          ...derivedState(computeDerived(engineInput(fresh))),
          isAuthenticated: true,
          userName: name.trim(),
          userEmail: email.trim(),
          isOfflineAccount: !!options?.offline,
        });
      },

      logout: async () => {
        await signOutSupabase();
        // Health data is personal: sign-out removes it from this device.
        resetFeatureStores();
        const fresh = freshUserData();
        set({ ...fresh, ...derivedState(computeDerived(engineInput(fresh))) });
      },

      updateUserPhoto: (uri: string) => set({ userPhoto: uri }),

      // ─── Assessment ──────────────────────────────────
      completeAssessment: (answers: Record<string, string>) => {
        const archetype = calculateArchetype(answers);
        set({
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
        });
        get().fineTuneAllAnalytics();
      },

      updateFineTuningSettings: (settings: Partial<FineTuningSettings>) => {
        set((state) => ({ fineTuningSettings: { ...state.fineTuningSettings, ...settings } }));
        // Sensitivity and sleep target change the strain score immediately.
        get().fineTuneAllAnalytics();
      },

      // ─── Report ──────────────────────────────────────
      generateClinicalPDF: async () => {
        set((state) => ({ clinicalReport: { ...state.clinicalReport, isGenerating: true } }));
        try {
          const { generateAndDownloadClinicalPDF } = await import('@/lib/pdfReportService');
          await generateAndDownloadClinicalPDF(get());
          set((state) => ({
            clinicalReport: { ...state.clinicalReport, isGenerating: false, generatedAt: new Date().toISOString() },
          }));
        } catch (err) {
          console.error('[Report] Failed to generate/share PDF:', err);
          set((state) => ({ clinicalReport: { ...state.clinicalReport, isGenerating: false } }));
        }
      },

      setStrainScore: (score: number) => {
        const clamped = Math.min(100, Math.max(0, Math.round(score)));
        const level: BiometricSnapshot['strainLevel'] =
          clamped >= 80 ? 'severe' : clamped >= 60 ? 'high' : clamped >= 36 ? 'moderate' : 'low';
        set((state) => ({
          biometrics: { ...state.biometrics, strainScore: clamped, strainLevel: level, recoveryScore: Math.max(5, Math.min(99, 105 - clamped)) },
        }));
      },

      // ─── Logging ─────────────────────────────────────
      logSymptom: (log: Partial<SymptomLog>) => {
        const now = new Date();
        const newLog: SymptomLog = {
          ...log,
          id: `log-${now.getTime()}`,
          date: log.date ?? todayKey(),
          timestamp: now.toISOString(),
        };
        set((state) => ({ symptomLogs: [newLog, ...state.symptomLogs].slice(0, 1500) }));
        get().fineTuneAllAnalytics();
      },

      logSleep: (hours: number) => {
        const clean = Math.round(Math.max(0, Math.min(16, hours)) * 4) / 4;
        const today = todayKey();
        set((state) => ({
          sleepLogs: [{ date: today, hours: clean }, ...state.sleepLogs.filter((s) => s.date !== today)].slice(0, 400),
        }));
        get().fineTuneAllAnalytics();
      },

      // ─── YourGoGirl AI Counsellor ────────────────────
      addYourGoGirlMessage: (msg: YourGoGirlMessage) =>
        // Keep the chat light on storage: the newest 150 messages are plenty.
        set((state) => ({
          yourGoGirlMessages: [...state.yourGoGirlMessages, msg].slice(-150),
        })),

      setYourGoGirlMode: (mode: CounsellorMode) =>
        set({ yourGoGirlMode: mode }),

      clearYourGoGirlChat: () =>
        set((state) => ({
          yourGoGirlMessages: [
            createInitialWelcomeMessage(state.userName, state.cycle, state.biometrics),
          ],
        })),

      // ─── Details for Sync / referral / care team ─────
      saveHealthCheck: (answers: HealthCheckAnswers) =>
        set({ healthCheck: { ...answers }, healthCheckCompleted: true }),

      markSyncComplete: () => {
        if (!get().syncCompletedAt) set({ syncCompletedAt: new Date().toISOString() });
      },

      addCareContact: (contact: Omit<CareContact, 'id'>) =>
        set((state) => ({
          careContacts: [
            ...state.careContacts,
            {
              ...contact,
              name: contact.name.trim(),
              phone: contact.phone.trim(),
              note: contact.note?.trim() || undefined,
              id: `care-${Date.now()}`,
            },
          ].slice(0, 30),
        })),

      removeCareContact: (id: string) =>
        set((state) => ({ careContacts: state.careContacts.filter((c) => c.id !== id) })),
    }),
    {
      name: 'shesync.app',
      version: 3,
      // v2 adds the "Details for Sync" setup. Anyone who finished the old
      // onboarding (questionnaire + period dates) keeps their full dashboard.
      migrate: (persisted, fromVersion) => {
        const s = (persisted ?? {}) as Record<string, any>;
        if (fromVersion < 2) {
          s.healthCheck = s.healthCheck ?? {};
          s.healthCheckCompleted = s.healthCheckCompleted ?? false;
          s.careContacts = s.careContacts ?? [];
          // YourGoGirl's answers were rebuilt in v2: start the chat fresh.
          s.yourGoGirlMessages = [];
          s.syncCompletedAt =
            s.syncCompletedAt ??
            (s.isAssessmentCompleted && Array.isArray(s.pastCycles) && s.pastCycles.length > 0
              ? new Date().toISOString()
              : '');
        }
        if (fromVersion < 3 && s.fineTuningSettings) {
          // v3 renamed the profile types in plain language; keep her settings.
          const a = calculateArchetype(s.assessmentAnswers ?? {});
          s.fineTuningSettings = {
            ...s.fineTuningSettings,
            archetypeId: a.id,
            archetypeName: a.name,
            archetypeTagline: a.tagline,
            archetypeDescription: a.description,
            primaryCondition: a.primaryCondition,
          };
        }
        return s as any;
      },
      storage: deviceStorage(),
      // Persist the user's own data; everything derived is recomputed on launch.
      partialize: (s) => ({
        userName: s.userName,
        userEmail: s.userEmail,
        userPhoto: s.userPhoto,
        isAuthenticated: s.isAuthenticated,
        isOfflineAccount: s.isOfflineAccount,
        focusAreas: s.focusAreas,
        isAssessmentCompleted: s.isAssessmentCompleted,
        assessmentAnswers: s.assessmentAnswers,
        fineTuningSettings: s.fineTuningSettings,
        healthCheck: s.healthCheck,
        healthCheckCompleted: s.healthCheckCompleted,
        syncCompletedAt: s.syncCompletedAt,
        careContacts: s.careContacts,
        rememberedCyclesCount: s.rememberedCyclesCount,
        pastCycles: s.pastCycles,
        symptomLogs: s.symptomLogs,
        sleepLogs: s.sleepLogs,
        workoutHistory: s.workoutHistory,
        cbtPrompt: s.cbtPrompt,
        yourGoGirlMessages: s.yourGoGirlMessages,
        yourGoGirlMode: s.yourGoGirlMode,
      }),
      onRehydrateStorage: () => (state) => {
        // Dates move on between launches: recompute phase, prediction and trend.
        state?.fineTuneAllAnalytics();
      },
    }
  )
);
