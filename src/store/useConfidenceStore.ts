import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceStorage } from './storage';
import { todayKey } from '@/lib/dates';

export interface ProudMoment {
  id: string;
  date: string;
  text: string;
}

interface ConfidenceState {
  /** date -> how confident she felt, 1 (shaky) to 5 (unstoppable). */
  levels: Record<string, number>;
  /** date -> glow-habit ids ticked that day. */
  glow: Record<string, string[]>;
  /** date -> id of the small challenge she completed. */
  challenges: Record<string, string>;
  proud: ProudMoment[]; // newest first
  /** Ids of affirmations she saved. */
  saved: string[];

  setLevel: (level: number) => void;
  toggleGlow: (habitId: string) => void;
  completeChallenge: (challengeId: string) => void;
  undoChallenge: () => void;
  addProud: (text: string) => void;
  removeProud: (id: string) => void;
  toggleSaved: (affirmationId: string) => void;
  reset: () => void;
}

const empty = () => ({
  levels: {} as Record<string, number>,
  glow: {} as Record<string, string[]>,
  challenges: {} as Record<string, string>,
  proud: [] as ProudMoment[],
  saved: [] as string[],
});

/** Keeps per-day maps from growing forever (about 13 months). */
function trim<T>(map: Record<string, T>): Record<string, T> {
  const keys = Object.keys(map);
  if (keys.length <= 400) return map;
  const keep = keys.sort().slice(-400);
  return Object.fromEntries(keep.map((k) => [k, map[k]]));
}

export const useConfidenceStore = create<ConfidenceState>()(
  persist(
    (set) => ({
      ...empty(),
      setLevel: (level) =>
        set((s) => ({ levels: trim({ ...s.levels, [todayKey()]: Math.min(5, Math.max(1, Math.round(level))) }) })),
      toggleGlow: (habitId) => {
        const today = todayKey();
        set((s) => {
          const cur = s.glow[today] ?? [];
          const next = cur.includes(habitId) ? cur.filter((h) => h !== habitId) : [...cur, habitId];
          return { glow: trim({ ...s.glow, [today]: next }) };
        });
      },
      completeChallenge: (challengeId) => set((s) => ({ challenges: trim({ ...s.challenges, [todayKey()]: challengeId }) })),
      undoChallenge: () =>
        set((s) => {
          const next = { ...s.challenges };
          delete next[todayKey()];
          return { challenges: next };
        }),
      addProud: (text) => {
        const clean = text.trim().slice(0, 280);
        if (!clean) return;
        set((s) => ({ proud: [{ id: `proud-${Date.now()}`, date: todayKey(), text: clean }, ...s.proud].slice(0, 300) }));
      },
      removeProud: (id) => set((s) => ({ proud: s.proud.filter((p) => p.id !== id) })),
      toggleSaved: (affirmationId) =>
        set((s) => ({
          saved: s.saved.includes(affirmationId) ? s.saved.filter((a) => a !== affirmationId) : [...s.saved, affirmationId],
        })),
      reset: () => set(empty()),
    }),
    {
      name: 'shesync.confidence',
      version: 1,
      storage: deviceStorage(),
      partialize: (s) => ({ levels: s.levels, glow: s.glow, challenges: s.challenges, proud: s.proud, saved: s.saved }),
    }
  )
);
