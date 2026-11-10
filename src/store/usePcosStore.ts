import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceStorage } from './storage';
import { todayKey } from '@/lib/dates';

/** 0 = none, 1 = mild, 2 = moderate, 3 = a lot. */
export type SignLevel = 0 | 1 | 2 | 3;

export interface PcosCheckin {
  id: string;
  date: string;
  acne: SignLevel;
  /** Thick, dark hair on the chin, upper lip, chest or tummy. */
  bodyHair: SignLevel;
  /** Thinning hair on the scalp. */
  hairThinning: SignLevel;
  /** Dark, velvety skin patches on the neck or underarms. */
  darkPatches: SignLevel;
  waistCm?: number;
  weightKg?: number;
}

export type Told = 'yes' | 'no' | 'unknown';

interface PcosState {
  /** Has a doctor already told her she has PCOS? */
  diagnosed: Told;
  /** Has a scan (or AMH blood test) shown polycystic ovaries? */
  scan: Told;
  checkins: PcosCheckin[]; // newest first
  /** Ticked items of the doctor checklist. */
  checklist: Record<string, boolean>;

  setDiagnosed: (value: Told) => void;
  setScan: (value: Told) => void;
  saveCheckin: (entry: Omit<PcosCheckin, 'id' | 'date'>) => void;
  removeCheckin: (id: string) => void;
  toggleChecklist: (id: string) => void;
  reset: () => void;
}

const empty = () => ({
  diagnosed: 'unknown' as Told,
  scan: 'unknown' as Told,
  checkins: [] as PcosCheckin[],
  checklist: {} as Record<string, boolean>,
});

export const usePcosStore = create<PcosState>()(
  persist(
    (set) => ({
      ...empty(),
      setDiagnosed: (diagnosed) => set({ diagnosed }),
      setScan: (scan) => set({ scan }),
      saveCheckin: (entry) => {
        const date = todayKey();
        set((s) => ({
          // One check-in per day: saving again today replaces it.
          checkins: [{ ...entry, id: `pcos-${Date.now()}`, date }, ...s.checkins.filter((c) => c.date !== date)].slice(0, 200),
        }));
      },
      removeCheckin: (id) => set((s) => ({ checkins: s.checkins.filter((c) => c.id !== id) })),
      toggleChecklist: (id) => set((s) => ({ checklist: { ...s.checklist, [id]: !s.checklist[id] } })),
      reset: () => set(empty()),
    }),
    {
      name: 'shesync.pcos',
      version: 1,
      storage: deviceStorage(),
      partialize: (s) => ({ diagnosed: s.diagnosed, scan: s.scan, checkins: s.checkins, checklist: s.checklist }),
    }
  )
);
