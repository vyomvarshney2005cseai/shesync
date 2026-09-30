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
  label: string;            // e.g. "4h 12m (Severe Deficit)"
  quality: number;          // 0-100
}

export interface CortisolData {
  level: 'low' | 'normal' | 'elevated' | 'high';
  value: number;            // µg/dL
  isOverride: boolean;      // triggers workout override
  timestamp: string;
}

export interface BiometricSnapshot {
  hrv: HRVData;
  sleep: SleepData;
  cortisol: CortisolData;
  strainScore: number;      // 0-100 daily strain
  strainLevel: 'low' | 'moderate' | 'high' | 'severe';
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
  conditions: string[];     // e.g. ["PCOS", "PMDD"]
}

export interface PastCycleRecord {
  id: string;
  cycleNumber: number;      // 1 = most recent, 2 = previous, etc.
  startDate: string;        // ISO date string e.g. '2026-09-02'
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

export interface CyclePrediction {
  nextPeriodDate: string;
  daysUntilNextPeriod: number;
  ovulationWindow: string;
  lutealPhaseWindow: string;
  predictedCycleLength: number;
  regularityStatus: 'regular' | 'moderate_variance' | 'irregular_pcos';
  confidencePercentage: number;
  precautionMeasures: PrecautionMeasure[];
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

// ─── Clinical Report ─────────────────────────────────────────

export interface DailyDataPoint {
  day: number;               // 1-90
  painSeverity: number;      // 0-10
  cycleDay: number | null;   // null = anovulatory gap
  isMenstrual: boolean;
  isAnovulatory: boolean;
}

export interface ClinicalAnomaly {
  id: string;
  type: 'anovulatory_gap' | 'pain_cluster' | 'hrv_drop' | 'sleep_deficit';
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

  // Symptom logs
  symptomLogs: SymptomLog[];
  
  // Move / Adaptive workouts
  todayWorkout: AdaptiveWorkout;
  workoutHistory: WorkoutHistory[];
  showBiologicalReasoning: boolean;

  // Mind / Therapy
  activeTherapy: TherapySession;
  cbtPrompt: CBTPrompt;
  sosActive: boolean;

  // Clinical report
  clinicalReport: ClinicalReport;

  // Actions
  login: (email?: string, name?: string) => void;
  signup: (name: string, email: string) => void;
  logout: () => void;
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
  generateClinicalPDF: () => void;
  logSymptom: (log: Partial<SymptomLog>) => void;
  setStrainScore: (score: number) => void;
  fineTuneAllAnalytics: () => void;
}
