// ============================================================
// Fitness maths and the daily workout recommendation.
//
// Formulas: BMI (WHO), Mifflin–St Jeor BMR for women, activity
// multipliers for TDEE, and MET-based calorie estimates. Weight-loss
// targets are deliberately conservative: never below 1,200 kcal or BMR,
// and no loss target for an underweight BMI.
// ============================================================
import {
  FITNESS_LIBRARY,
  getLibraryWorkout,
  type LibraryWorkout,
  type WorkoutCategory,
} from '@/constants/fitnessLibrary';
import type { AdaptiveWorkout, CyclePhase } from '@/types';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type FitnessGoal = 'lose' | 'maintain' | 'gain' | 'fitness';
export type TrainingPlace = 'gym' | 'home';

export interface BodyProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  activity: ActivityLevel;
  goal: FitnessGoal;
  targetWeightKg?: number;
  trainingPlace: TrainingPlace;
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string; hint: string }> = {
  sedentary: { factor: 1.2, label: 'Mostly sitting', hint: 'Classes, desk work, little walking' },
  light: { factor: 1.375, label: 'Lightly active', hint: 'Walking on campus, 1–2 workouts a week' },
  moderate: { factor: 1.55, label: 'Active', hint: '3–5 workouts a week' },
  active: { factor: 1.725, label: 'Very active', hint: 'Training most days or sport' },
};

export const GOAL_LABELS: Record<FitnessGoal, string> = {
  lose: 'Lose weight',
  maintain: 'Maintain',
  gain: 'Gain strength & weight',
  fitness: 'Just get fitter',
};

const round = (n: number, step = 1) => Math.round(n / step) * step;

export function bmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  if (!m || !weightKg) return 0;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export interface BmiBand {
  label: string;
  color: string;
  note: string;
}

/** WHO bands, with the lower Asian-Indian risk threshold called out. */
export function bmiBand(value: number): BmiBand {
  if (value <= 0) return { label: '—', color: '#9CA3AF', note: '' };
  if (value < 18.5)
    return {
      label: 'Underweight',
      color: '#0EA5E9',
      note: 'Below the healthy range. Focus on nourishment and strength, not weight loss.',
    };
  if (value < 23)
    return { label: 'Healthy', color: '#10B981', note: 'In the healthy range for South Asian women.' };
  if (value < 25)
    return {
      label: 'Healthy (Asian risk zone)',
      color: '#F59E0B',
      note: 'WHO healthy range, but for Asian Indians metabolic risk starts rising from 23.',
    };
  if (value < 30) return { label: 'Overweight', color: '#F97316', note: 'A 5–10% loss can noticeably improve energy, cycles and PCOS symptoms.' };
  return { label: 'Obese range', color: '#EF4444', note: 'Worth discussing with a doctor; small, steady changes work best.' };
}

/** Mifflin–St Jeor resting energy for women (kcal/day). */
export function bmrFemale(p: Pick<BodyProfile, 'heightCm' | 'weightKg' | 'age'>): number {
  return Math.round(10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 161);
}

export function tdee(p: BodyProfile): number {
  return Math.round(bmrFemale(p) * ACTIVITY_FACTORS[p.activity].factor);
}

/** Lowest weight inside the healthy BMI range (18.5) for this height. */
export function minHealthyWeight(heightCm: number): number {
  const m = heightCm / 100;
  return Math.ceil(18.5 * m * m * 10) / 10;
}

export interface EnergyPlan {
  maintenance: number;
  target: number;
  bmr: number;
  floorApplied: boolean;
  lossBlocked: boolean;
  proteinGrams: [number, number];
  waterLitres: number;
  weeksToGoal?: number;
  message: string;
}

export function energyPlan(p: BodyProfile): EnergyPlan {
  const base = bmrFemale(p);
  const maintenance = tdee(p);
  const currentBmi = bmi(p.heightCm, p.weightKg);
  const proteinGrams: [number, number] = [round(p.weightKg * 1.0), round(p.weightKg * 1.2)];
  const waterLitres = Math.round(p.weightKg * 0.035 * 10) / 10;

  if (p.goal === 'lose') {
    if (currentBmi > 0 && currentBmi < 18.5) {
      return {
        maintenance,
        target: maintenance,
        bmr: base,
        floorApplied: false,
        lossBlocked: true,
        proteinGrams,
        waterLitres,
        message:
          'Your BMI is below 18.5, so SheSync will not set a weight-loss target. Eat to maintain, build strength, and talk to a doctor if your weight keeps dropping.',
      };
    }
    const floor = Math.max(1200, base);
    const raw = maintenance - 400;
    const target = Math.max(floor, round(raw, 10));
    const goalWeight = p.targetWeightKg && p.targetWeightKg < p.weightKg ? p.targetWeightKg : undefined;
    const weeklyKg = ((maintenance - target) * 7) / 7700;
    const weeksToGoal =
      goalWeight && weeklyKg > 0.05 ? Math.ceil((p.weightKg - goalWeight) / weeklyKg) : undefined;
    return {
      maintenance,
      target,
      bmr: base,
      floorApplied: target === floor && raw < floor,
      lossBlocked: false,
      proteinGrams,
      waterLitres,
      weeksToGoal,
      message:
        'A gentle 300–400 kcal daily deficit — about 0.3–0.5 kg a week. Slow loss protects your cycle, mood and muscle.',
    };
  }
  if (p.goal === 'gain') {
    return {
      maintenance,
      target: round(maintenance + 250, 10),
      bmr: base,
      floorApplied: false,
      lossBlocked: false,
      proteinGrams: [round(p.weightKg * 1.2), round(p.weightKg * 1.6)],
      waterLitres,
      message: 'A small surplus plus strength training builds muscle without rushing.',
    };
  }
  return {
    maintenance,
    target: maintenance,
    bmr: base,
    floorApplied: false,
    lossBlocked: false,
    proteinGrams,
    waterLitres,
    message: 'Eat around maintenance and let training drive the change.',
  };
}

/** Rough calories for a session: kcal/min = MET × 3.5 × kg / 200. */
export function kcalFromMet(met: number, weightKg: number, minutes: number): number {
  return Math.round(((met * 3.5 * weightKg) / 200) * minutes);
}

/** Healthy target weight suggestion: never below BMI 18.5. */
export function clampTargetWeight(heightCm: number, targetKg: number): { value: number; clamped: boolean } {
  const floor = minHealthyWeight(heightCm);
  return targetKg < floor ? { value: floor, clamped: true } : { value: targetKg, clamped: false };
}

// ─── Daily recommendation ───────────────────────────────────

export type StrainLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface PlanInput {
  phase: CyclePhase;
  strainLevel: StrainLevel;
  strainScore: number;
  recentPain?: number;
  recentFlow?: string;
  place: TrainingPlace;
}

export interface TodayPlan {
  workout: LibraryWorkout;
  planned: LibraryWorkout;
  isOverride: boolean;
  card: AdaptiveWorkout;
  phaseNote: string;
}

const PHASE_DEFAULTS: Record<'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'irregular', Record<TrainingPlace, string>> = {
  menstrual: { gym: 'gym-low-impact', home: 'home-core-pelvic' },
  follicular: { gym: 'gym-full-body-a', home: 'home-low-impact-burn' },
  ovulatory: { gym: 'gym-glutes-legs', home: 'home-hiit-tabata' },
  luteal: { gym: 'gym-low-impact', home: 'walk-brisk' },
  irregular: { gym: 'gym-full-body-a', home: 'home-full-body-15' },
};

const PHASE_NOTES: Record<keyof typeof PHASE_DEFAULTS, string> = {
  menstrual:
    'Period days: move if it helps, rest if it doesn’t. Gentle strength and stretching often ease cramps.',
  follicular:
    'After your period many people feel more energetic — a good window to learn lifts and add weight.',
  ovulatory:
    'Energy often peaks around ovulation. Go for your harder sessions if you feel good — warm up well.',
  luteal:
    'In the second half of the cycle, steady cardio and moderate strength usually feel better than all-out efforts.',
  irregular:
    'With an irregular cycle, train by how you feel today. Regular strength training supports insulin sensitivity.',
};

function phaseKey(phase: CyclePhase): keyof typeof PHASE_DEFAULTS {
  if (phase === 'menstrual' || phase === 'follicular' || phase === 'ovulatory' || phase === 'luteal') return phase;
  return 'irregular';
}

const INTENSE = new Set(['moderate', 'vigorous']);

/**
 * Picks today's session from the library. High strain, severe pain (7+)
 * or heavy flow swap an intense plan for a gentler one; the reason is
 * written in plain language from the user's own logs.
 */
export function recommendWorkout(input: PlanInput): TodayPlan {
  const key = phaseKey(input.phase);
  const planned = getLibraryWorkout(PHASE_DEFAULTS[key][input.place]) ?? FITNESS_LIBRARY[0];
  const pain = input.recentPain ?? 0;
  const heavyFlow = input.recentFlow === 'heavy' || input.recentFlow === 'severe';
  const highStrain = input.strainLevel === 'high' || input.strainLevel === 'severe';

  let workout = planned;
  let reasonParts: string[] = [];
  if (highStrain || pain >= 7 || heavyFlow) {
    const gentleId =
      pain >= 5 || heavyFlow || key === 'menstrual'
        ? 'yoga-cramp-relief'
        : input.strainLevel === 'severe'
        ? 'yoga-sleep-calm'
        : 'home-core-pelvic';
    workout = getLibraryWorkout(gentleId) ?? planned;
    if (highStrain) reasonParts.push(`your strain score is ${input.strainScore}/100`);
    if (pain >= 7) reasonParts.push(`you logged pain of ${pain}/10`);
    if (heavyFlow) reasonParts.push('you logged a heavy flow');
  }
  const isOverride = workout.id !== planned.id && INTENSE.has(planned.intensity);

  const reason = isOverride
    ? `Today ${reasonParts.join(' and ')}. A hard session on a day like this can leave you more drained, so SheSync swapped “${planned.title}” for a gentler routine. Light movement and stretching help many people with cramps and low energy — and rest is fine too.`
    : PHASE_NOTES[key];

  const categoryLabel: Record<WorkoutCategory, string> = { gym: 'Gym session', home: 'Home workout', yoga: 'Yoga' };

  const card: AdaptiveWorkout = {
    id: `today-${workout.id}`,
    libraryWorkoutId: workout.id,
    title: workout.title,
    duration: `${workout.minutes} min`,
    intensity: workout.intensity,
    type: categoryLabel[workout.category],
    description: workout.summary,
    overriddenFrom: isOverride ? planned.title : undefined,
    reason,
    tags: [categoryLabel[workout.category], workout.level, workout.equipment.split(',')[0]],
  };

  return { workout, planned, isOverride, card, phaseNote: PHASE_NOTES[key] };
}
