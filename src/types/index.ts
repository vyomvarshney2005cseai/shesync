// ============================================================
// SheSync: Bio-Adaptive Health & Mental Therapy — Type System
// ============================================================

// ─── Biometric Data ─────────────────────────────────────────

export interface HRVData {
  current: number;          // milliseconds
  baseline: number;         // personal baseline ms
  status: 'below' | 'at' | 'above';
  label: string;            // e.g. "32 ms (Below Baseline)"
  delta: number;            // % deviation from baseline
}

export interface SleepData {
  hoursSlept: number;
  minutesSlept: number;
  deficit: boolean;
  severity: 'mild' | 'moderate' | 'severe';
  label: string;            // e.g. "6h 30m (1h short)" or "Not logged"
  quality: number;          // 0-100
  logged: boolean;          // false until the user logs last night's sleep
}

export interface SleepLog {
  date: string;             // local "YYYY-MM-DD" of the morning after
  hours: number;
}

export interface CortisolData {
  level: 'low' | 'normal' | 'elevated' | 'high';
  value: number;            // µg/dL
  isOverride: boolean;      // triggers workout override
  timestamp: string;
}

/**
 * Daily body snapshot. Everything here is DERIVED from what the user logs
 * (pain, flow, mood, energy, sleep, assessment). SheSync has no wearable or
 * lab connection, so `hrv` and `cortisol` are internal model estimates and
 * must never be shown as measurements.
 */
export interface BiometricSnapshot {
  hrv: HRVData;
  sleep: SleepData;
  cortisol: CortisolData;
  strainScore: number;      // 0-100 daily strain
  strainLevel: 'low' | 'moderate' | 'high' | 'severe';
  recoveryScore: number;    // 0-100 readiness, the inverse view of strain
}

// ─── Cycle Tracking ─────────────────────────────────────────

export type CyclePhase =
  | 'menstrual'
  | 'follicular'
  | 'ovulatory'
  | 'luteal'
  | 'irregular'
  | 'anovulatory';

export interface CycleData {
  currentDay: number;       // e.g. Day 45
  expectedLength: number;   // normal ~28 days
  phase: CyclePhase;
  isIrregular: boolean;
  lastPeriodDate: string;   // ISO date
  label: string;            // "Day 45 (Irregular Phase)"
  progesteroneStatus: 'rising' | 'peak' | 'dropping' | 'low';
  conditions: string[];     // user-chosen focus areas, never auto-diagnosed
  hasCycleData?: boolean;   // false until the user has saved period dates
}

export interface PastCycleRecord {
  id: string;
  cycleNumber: number;      // 1 = most recent, 2 = previous, etc.
  startDate: string;        // ISO date string e.g. '2026-09-02'
  endDate?: string;         // ISO date string e.g. '2026-09-07'
  daysAgo: number;          // relative days ago
  lengthDays: number;       // e.g. 28 days
  periodDurationDays: number;// e.g. 5 days
}

export interface PrecautionMeasure {
  id: string;
  category: 'cramp_prep' | 'pmdd_shield' | 'fatigue_warning' | 'iron_nutrition' | 'workout_pacing';
  title: string;
  advice: string;
  phaseTarget: string;
  urgency: 'low' | 'moderate' | 'high';
  daysUntilActive: number;
}

export interface CyclePhaseBreakdown {
  phase: CyclePhase;
  phaseName: string;
  phaseDescription: string;
  hormoneOverview: string;
  daysRemainingInPhase: number;
}

export interface UserFriendlyInsight {
  id: string;
  category: 'hormone' | 'nutrition' | 'movement' | 'recovery';
  headline: string;
  explanation: string;
  actionTip: string;
  icon: string;
}

export interface HealthScores {
  hormonalHarmony: number;      // 0-100
  autonomicRecovery: number;    // 0-100
  cycleStability: number;       // 0-100
}

export interface CyclePrediction {
  nextPeriodDate: string;
  daysUntilNextPeriod: number;
  ovulationWindow: string;
  lutealPhaseWindow: string;
  predictedCycleLength: number;
  regularityStatus: 'regular' | 'moderate_variance' | 'irregular_pcos';
  confidencePercentage: number;
  precautionMeasures: PrecautionMeasure[];
  cycleVarianceDays?: number;
  fertileWindow?: string;
  ovulationDate?: string;
  cyclePhaseBreakdown?: CyclePhaseBreakdown;
  userFriendlyInsights?: UserFriendlyInsight[];
  healthScores?: HealthScores;
}

// ─── Mood & Symptom Logging ─────────────────────────────────

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type PainLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type FlowIntensity = 'none' | 'spotting' | 'light' | 'moderate' | 'heavy' | 'severe';

export interface SymptomLog {
  id: string;
  date: string;
  mood?: MoodLevel;
  energy?: string;
  pain?: PainLevel;
  flow?: FlowIntensity;
  voiceJournal?: boolean;
  notes?: string;
  timestamp: string;
  tags?: string[];
  painLocation?: string[];
  reliefMethods?: string[];
  flowColor?: string;
  productsUsed?: Record<string, number>;
  transcript?: string;
  audioDuration?: string;
}

// ─── Adaptive Movement / Workout ─────────────────────────────

export interface AdaptiveWorkout {
  id: string;
  title: string;
  duration: string;          // "20 min"
  intensity: 'restorative' | 'gentle' | 'moderate' | 'vigorous';
  type: string;              // e.g. "Pelvic Floor Flow"
  description: string;
  overriddenFrom?: string;   // what was originally scheduled
  reason?: string;           // biological reasoning
  tags: string[];
  libraryWorkoutId?: string; // session the in-app player runs
}

export interface WorkoutHistory {
  date: string;
  original: string;          // original planned workout
  adapted: string;           // what it was changed to
  reason: string;            // why it was changed
  strainAtTime: number;
}

// ─── Mental Therapy & Somatic Videos ─────────────────────────

export interface YouTubeVideoSession {
  id: string;
  title: string;
  channel: string;
  youtubeUrl: string;
  youtubeId: string;
  duration: string;
  description: string;
  category: 'vagus' | 'pelvic' | 'pmdd' | 'stress';
  tag: string;
  targetFocus: string;
}

export interface TherapySession {
  id: string;
  type: 'somatic' | 'cbt' | 'breathwork' | 'grounding';
  title: string;
  description: string;
  durationSeconds: number;
  isPlaying: boolean;
  progress: number;          // 0-1
  youtubeUrl?: string;
  youtubeId?: string;
}

export interface CBTPrompt {
  id: string;
  trigger: string;           // what symptom triggered this
  prompt: string;            // the reframing question
  placeholder: string;       // input hint
  userResponse?: string;
}

// ─── YourGoGirl counsellor (used by src/lib/yourGoGirlEngine.ts) ───

export type CounsellorMode =
  | 'empathetic_counsellor'
  | 'focus_motivation'
  | 'cycle_disturbances'
  | 'somatic_cbt';

export type CounsellorTopic =
  | 'general'
  | 'focus'
  | 'motivation'
  | 'disturbances'
  | 'menstruation'
  | 'emotional';

export interface YourGoGirlMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  category?: CounsellorTopic;
  mode?: CounsellorMode;
  biologicalWhy?: string;
  gentleActionSteps?: string[];
  affirmation?: string;
  followUpSuggestions?: string[];
}

// ─── Clinical Report ─────────────────────────────────────────

export interface DailyDataPoint {
  day: number;               // 1-90 (90 = today)
  dateKey: string;           // local "YYYY-MM-DD"
  painSeverity: number | null; // highest pain logged that day, null = not logged
  cycleDay: number | null;   // null = before the first saved period
  isMenstrual: boolean;
  isAnovulatory: boolean;    // inside a cycle longer than 35 days
}

export interface ClinicalAnomaly {
  id: string;
  type: 'anovulatory_gap' | 'pain_cluster' | 'hrv_drop' | 'sleep_deficit' | 'flow_heavy' | 'mood_pattern';
  severity: 'moderate' | 'severe' | 'critical';
  title: string;
  description: string;
  icon: string;
}

export interface ClinicalReport {
  trendData: DailyDataPoint[];
  anomalies: ClinicalAnomaly[];
  generatedAt?: string;
  isGenerating: boolean;
}

export interface FineTuningSettings {
  archetypeId: string;
  archetypeName: string;
  archetypeTagline: string;
  archetypeDescription: string;
  strainSensitivity: 'gentle' | 'balanced' | 'dynamic';
  preferredTherapy: 'somatic' | 'cbt' | 'breathwork';
  autoCortisolOverride: boolean;
  pmddEarlyShield: boolean;
  dailySleepTargetHours: number;
  primaryCondition: string;
}

// ─── App State ───────────────────────────────────────────────

export interface AppState {
  // User & Auth
  userName: string;
  userEmail?: string;
  userPhoto?: string;
  isAuthenticated: boolean;
  isOfflineAccount: boolean;   // true when signed in on this device only
  focusAreas: string[];        // chosen at sign-up

  // Assessment & Fine-Tuning
  isAssessmentCompleted: boolean;
  assessmentAnswers: Record<string, string>;
  fineTuningSettings: FineTuningSettings;

  // Biometrics
  biometrics: BiometricSnapshot;

  // Cycle & Prediction
  cycle: CycleData;
  rememberedCyclesCount: number;
  pastCycles: PastCycleRecord[];
  cyclePrediction: CyclePrediction;

  // Symptom & sleep logs
  symptomLogs: SymptomLog[];
  sleepLogs: SleepLog[];
  patternFlags: string[];      // non-diagnostic patterns from the user's logs

  // Move / Adaptive workouts
  todayWorkout: AdaptiveWorkout;
  workoutHistory: WorkoutHistory[];
  showBiologicalReasoning: boolean;

  // Mind / Therapy
  activeTherapy: TherapySession;
  cbtPrompt: CBTPrompt;
  sosActive: boolean;

  // YourGoGirl AI Counsellor
  yourGoGirlMessages: YourGoGirlMessage[];
  yourGoGirlMode: CounsellorMode;

  // Clinical report
  clinicalReport: ClinicalReport;

  // Actions
  login: (email?: string, name?: string, options?: { offline?: boolean }) => void;
  signup: (name: string, email: string, focusAreas?: string[], options?: { offline?: boolean }) => void;
  logSleep: (hours: number) => void;
  logout: () => Promise<void> | void;
  updateUserPhoto: (uri: string) => void;
  completeAssessment: (answers: Record<string, string>) => void;
  savePastCycles: (count: number, cycles: PastCycleRecord[]) => void;
  updateFineTuningSettings: (settings: Partial<FineTuningSettings>) => void;
  toggleAudioPlayback: () => void;
  updateAudioProgress: (progress: number) => void;
  submitCBTResponse: (response: string) => void;
  triggerSOS: () => void;
  dismissSOS: () => void;
  toggleBiologicalReasoning: () => void;
  generateClinicalPDF: () => Promise<void> | void;
  logSymptom: (log: Partial<SymptomLog>) => void;
  setStrainScore: (score: number) => void;
  fineTuneAllAnalytics: () => void;
  addYourGoGirlMessage: (msg: YourGoGirlMessage) => void;
  setYourGoGirlMode: (mode: CounsellorMode) => void;
  clearYourGoGirlChat: () => void;
}
