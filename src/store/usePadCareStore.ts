import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRODUCT_GUIDES, type PeriodProduct } from '@/constants/padCare';
import type { SkinReaction, WearMode, WearSession } from '@/lib/padCare';
import { toDateKey } from '@/lib/dates';
import { deviceStorage } from './storage';

export interface PadChange {
  id: string;
  at: number; // epoch ms
  date: string; // local YYYY-MM-DD
  product: PeriodProduct;
  mode: WearMode;
}

/** A private rating of a pad/brand she has tried. Stays on this phone. */
export interface PadNote {
  id: string;
  date: string;
  brand: string;
  product: PeriodProduct;
  comfort: number; // 1..5
  protection: number; // 1..5 (leaks)
  skin: SkinReaction;
  note?: string;
}

interface PadCareState {
  product: PeriodProduct;
  intervalHours: number;
  remindersOn: boolean;
  /** The product she is wearing now; null when the timer is off. */
  active: WearSession | null;
  changes: PadChange[]; // newest first
  notes: PadNote[]; // newest first
  /** Checklist ticks for the pad she uses now. */
  checklist: string[];

  setProduct: (product: PeriodProduct) => void;
  setIntervalHours: (hours: number) => void;
  setRemindersOn: (on: boolean) => void;
  /** "I just changed" — logs the change and restarts the timer. */
  startWear: (now: number, mode: WearMode) => void;
  /** Period over: stop the timer. */
  stopWear: () => void;
  addNote: (note: Omit<PadNote, 'id' | 'date'>) => void;
  removeNote: (id: string) => void;
  toggleChecklist: (id: string) => void;
  reset: () => void;
}

const empty = () => ({
  product: 'pad' as PeriodProduct,
  intervalHours: PRODUCT_GUIDES.pad.defaultHours,
  remindersOn: false,
  active: null as WearSession | null,
  changes: [] as PadChange[],
  notes: [] as PadNote[],
  checklist: [] as string[],
});

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

/** A second tap within this window corrects the last change instead of adding one. */
const DOUBLE_TAP_MS = 2 * 60_000;

const clampInterval = (product: PeriodProduct, hours: number) => {
  const max = PRODUCT_GUIDES[product].maxDayHours;
  return Math.min(max, Math.max(1, Math.round(hours * 2) / 2));
};

type Persisted = Pick<PadCareState, 'product' | 'intervalHours' | 'remindersOn' | 'active' | 'changes' | 'notes' | 'checklist'>;

export const usePadCareStore = create<PadCareState>()(
  persist(
    (set) => ({
      ...empty(),

      setProduct: (product) =>
        set((s) => ({
          product,
          // Keep the interval valid for the new product (a cup allows 12 h, a pad 6 h).
          intervalHours: clampInterval(product, s.product === product ? s.intervalHours : PRODUCT_GUIDES[product].defaultHours),
          active: s.active ? { ...s.active, product } : null,
        })),

      setIntervalHours: (hours) => set((s) => ({ intervalHours: clampInterval(s.product, hours) })),

      setRemindersOn: (remindersOn) => set({ remindersOn }),

      startWear: (now, mode) =>
        set((s) => {
          const entry: PadChange = { id: uid('chg'), at: now, date: toDateKey(new Date(now)), product: s.product, mode };
          const last = s.changes[0];
          const rest = last && now - last.at < DOUBLE_TAP_MS ? s.changes.slice(1) : s.changes;
          return {
            active: { since: now, mode, product: s.product },
            changes: [entry, ...rest].slice(0, 600),
          };
        }),

      stopWear: () => set({ active: null }),

      addNote: (note) => {
        const brand = note.brand.trim();
        if (!brand) return;
        const clean: PadNote = {
          ...note,
          brand,
          note: note.note?.trim() || undefined,
          comfort: Math.max(1, Math.min(5, Math.round(note.comfort))),
          protection: Math.max(1, Math.min(5, Math.round(note.protection))),
          id: uid('note'),
          date: toDateKey(new Date()),
        };
        set((s) => ({ notes: [clean, ...s.notes].slice(0, 100) }));
      },

      removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      toggleChecklist: (id) =>
        set((s) => ({
          checklist: s.checklist.includes(id) ? s.checklist.filter((c) => c !== id) : [...s.checklist, id],
        })),

      reset: () => set(empty()),
    }),
    {
      name: 'shesync.padcare',
      version: 1,
      storage: deviceStorage<Persisted>(),
      partialize: (s): Persisted => ({
        product: s.product,
        intervalHours: s.intervalHours,
        remindersOn: s.remindersOn,
        active: s.active,
        changes: s.changes,
        notes: s.notes,
        checklist: s.checklist,
      }),
    }
  )
);
