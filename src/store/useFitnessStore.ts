import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceStorage } from './storage';
import type { BodyProfile } from '@/lib/fitness';
import type { WorkoutCategory } from '@/constants/fitnessLibrary';
import { todayKey } from '@/lib/dates';

export interface WeightEntry {
  date: string; // local YYYY-MM-DD
  kg: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  workoutId: string;
  title: string;
  category: WorkoutCategory;
  minutes: number;
  kcal: number;
  intensity: string;
  feel?: 'easy' | 'right' | 'hard';
}

export interface DayHabits {
  water: number; // glasses (250 ml)
  steps: number;
}

interface FitnessState {
  profile?: BodyProfile;
  weights: WeightEntry[]; // newest first
  sessions: WorkoutSession[]; // newest first
  habits: Record<string, DayHabits>;

  saveProfile: (profile: BodyProfile) => void;
  setTrainingPlace: (place: BodyProfile['trainingPlace']) => void;
  logWeight: (kg: number) => void;
  removeWeight: (date: string) => void;
  logSession: (session: Omit<WorkoutSession, 'id' | 'date'>) => string;
  rateSession: (id: string, feel: WorkoutSession['feel']) => void;
  addWater: (delta: number) => void;
  setSteps: (steps: number) => void;
  reset: () => void;
}

const empty = () => ({
  profile: undefined as BodyProfile | undefined,
  weights: [] as WeightEntry[],
  sessions: [] as WorkoutSession[],
  habits: {} as Record<string, DayHabits>,
});

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      ...empty(),

      saveProfile: (profile) => {
        set({ profile });
        // Keep today's weight log in step with the profile weight.
        const today = todayKey();
        const hasToday = get().weights.some((w) => w.date === today);
        if (!hasToday) get().logWeight(profile.weightKg);
      },

      setTrainingPlace: (trainingPlace) => {
        const p = get().profile;
        if (p) set({ profile: { ...p, trainingPlace } });
      },

      logWeight: (kg) => {
        const value = Math.round(kg * 10) / 10;
        if (!Number.isFinite(value) || value < 25 || value > 300) return;
        const today = todayKey();
        set((s) => ({
          weights: [{ date: today, kg: value }, ...s.weights.filter((w) => w.date !== today)].slice(0, 400),
          profile: s.profile ? { ...s.profile, weightKg: value } : s.profile,
        }));
      },

      removeWeight: (date) => set((s) => ({ weights: s.weights.filter((w) => w.date !== date) })),

      logSession: (session) => {
        const id = `ws-${Date.now()}`;
        set((s) => ({
          sessions: [{ ...session, id, date: todayKey() }, ...s.sessions].slice(0, 500),
        }));
        return id;
      },

      rateSession: (id, feel) =>
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, feel } : x)) })),

      addWater: (delta) => {
        const today = todayKey();
        set((s) => {
          const cur = s.habits[today] ?? { water: 0, steps: 0 };
          return { habits: { ...s.habits, [today]: { ...cur, water: Math.max(0, Math.min(20, cur.water + delta)) } } };
        });
      },

      setSteps: (steps) => {
        const today = todayKey();
        set((s) => {
          const cur = s.habits[today] ?? { water: 0, steps: 0 };
          return { habits: { ...s.habits, [today]: { ...cur, steps: Math.max(0, Math.min(100000, Math.round(steps))) } } };
        });
      },

      reset: () => set(empty()),
    }),
    {
      name: 'shesync.fitness',
      version: 1,
      storage: deviceStorage(),
      partialize: (s) => ({ profile: s.profile, weights: s.weights, sessions: s.sessions, habits: s.habits }),
    }
  )
);
