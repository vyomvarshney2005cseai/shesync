import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from '@/lib/dates';

export interface FocusPreset {
  focus: number; // minutes
  rest: number; // minutes
}

export const FOCUS_PRESETS: (FocusPreset & { label: string; hint: string })[] = [
  { focus: 15, rest: 5, label: '15 / 5', hint: 'Gentle — cramps or brain fog' },
  { focus: 25, rest: 5, label: '25 / 5', hint: 'Classic Pomodoro' },
  { focus: 45, rest: 10, label: '45 / 10', hint: 'Deep work — high energy' },
  { focus: 50, rest: 10, label: '50 / 10', hint: 'Exam marathon' },
];

export interface FocusSession {
  id: string;
  date: string;
  minutes: number;
  subject: string;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  pomodoros: number;
  done: boolean;
  date: string;
}

export interface WinEntry {
  id: string;
  date: string;
  text: string;
}

export type TimerMode = 'idle' | 'focus' | 'break';

export interface TimerState {
  mode: TimerMode;
  /** Epoch ms when the running phase ends; null while paused or idle. */
  endsAt: number | null;
  /** Seconds left when paused. */
  pausedRemaining: number | null;
  /** Length of the current phase in seconds. */
  phaseSeconds: number;
  subject: string;
  rounds: number;
}

interface StudyState {
  preset: FocusPreset;
  timer: TimerState;
  sessions: FocusSession[];
  tasks: StudyTask[];
  confidence: Record<string, number>; // date -> 1..5
  wins: WinEntry[];
  kitChecks: Record<string, string[]>; // date -> checked item ids

  setPreset: (preset: FocusPreset) => void;
  setSubject: (subject: string) => void;
  startFocus: (now: number) => void;
  pause: (now: number) => void;
  resume: (now: number) => void;
  stop: (now: number) => void;
  /** Called when the running phase reaches zero. */
  completePhase: (now: number) => void;
  skipBreak: () => void;

  addTask: (title: string, subject: string, pomodoros: number) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearDoneTasks: () => void;

  setConfidence: (level: number) => void;
  addWin: (text: string) => void;
  removeWin: (id: string) => void;
  toggleKitItem: (itemId: string) => void;
  reset: () => void;
}

const idleTimer = (subject = 'General'): TimerState => ({
  mode: 'idle',
  endsAt: null,
  pausedRemaining: null,
  phaseSeconds: 0,
  subject,
  rounds: 0,
});

const empty = () => ({
  preset: { focus: 25, rest: 5 } as FocusPreset,
  timer: idleTimer(),
  sessions: [] as FocusSession[],
  tasks: [] as StudyTask[],
  confidence: {} as Record<string, number>,
  wins: [] as WinEntry[],
  kitChecks: {} as Record<string, string[]>,
});

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      ...empty(),

      setPreset: (preset) => {
        // Changing the preset only affects the next phase.
        set({ preset });
      },

      setSubject: (subject) => set((s) => ({ timer: { ...s.timer, subject: subject.trim() || 'General' } })),

      startFocus: (now) => {
        const secs = get().preset.focus * 60;
        set((s) => ({
          timer: { ...s.timer, mode: 'focus', endsAt: now + secs * 1000, pausedRemaining: null, phaseSeconds: secs },
        }));
      },

      pause: (now) => {
        const t = get().timer;
        if (!t.endsAt) return;
        set({ timer: { ...t, endsAt: null, pausedRemaining: Math.max(0, Math.round((t.endsAt - now) / 1000)) } });
      },

      resume: (now) => {
        const t = get().timer;
        if (t.pausedRemaining == null) return;
        set({ timer: { ...t, endsAt: now + t.pausedRemaining * 1000, pausedRemaining: null } });
      },

      stop: (now) => {
        const t = get().timer;
        // Keep credit for a focus block stopped after at least 5 minutes.
        if (t.mode === 'focus') {
          const left = t.endsAt ? (t.endsAt - now) / 1000 : t.pausedRemaining ?? t.phaseSeconds;
          const doneMinutes = Math.floor((t.phaseSeconds - left) / 60);
          if (doneMinutes >= 5) {
            set((s) => ({
              sessions: [{ id: uid('fs'), date: todayKey(), minutes: doneMinutes, subject: t.subject }, ...s.sessions].slice(0, 1000),
            }));
          }
        }
        set({ timer: { ...idleTimer(t.subject), rounds: t.rounds } });
      },

      completePhase: (now) => {
        const { timer: t, preset } = get();
        if (t.mode === 'focus') {
          const rounds = t.rounds + 1;
          // Every 4th round earns a longer break.
          const restMin = rounds % 4 === 0 ? Math.max(preset.rest * 3, 15) : preset.rest;
          set((s) => ({
            sessions: [
              { id: uid('fs'), date: todayKey(), minutes: Math.round(t.phaseSeconds / 60), subject: t.subject },
              ...s.sessions,
            ].slice(0, 1000),
            timer: {
              ...t,
              mode: 'break',
              rounds,
              phaseSeconds: restMin * 60,
              endsAt: now + restMin * 60 * 1000,
              pausedRemaining: null,
            },
          }));
        } else if (t.mode === 'break') {
          set({ timer: { ...idleTimer(t.subject), rounds: t.rounds } });
        }
      },

      skipBreak: () => {
        const t = get().timer;
        if (t.mode === 'break') set({ timer: { ...idleTimer(t.subject), rounds: t.rounds } });
      },

      addTask: (title, subject, pomodoros) => {
        const clean = title.trim();
        if (!clean) return;
        set((s) => ({
          tasks: [
            { id: uid('task'), title: clean, subject: subject.trim() || 'General', pomodoros: Math.max(1, Math.min(8, pomodoros)), done: false, date: todayKey() },
            ...s.tasks,
          ].slice(0, 200),
        }));
      },

      toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      clearDoneTasks: () => set((s) => ({ tasks: s.tasks.filter((t) => !t.done) })),

      setConfidence: (level) =>
        set((s) => ({ confidence: { ...s.confidence, [todayKey()]: Math.max(1, Math.min(5, Math.round(level))) } })),

      addWin: (text) => {
        const clean = text.trim();
        if (!clean) return;
        set((s) => ({ wins: [{ id: uid('win'), date: todayKey(), text: clean }, ...s.wins].slice(0, 300) }));
      },

      removeWin: (id) => set((s) => ({ wins: s.wins.filter((w) => w.id !== id) })),

      toggleKitItem: (itemId) => {
        const today = todayKey();
        set((s) => {
          const cur = s.kitChecks[today] ?? [];
          const next = cur.includes(itemId) ? cur.filter((i) => i !== itemId) : [...cur, itemId];
          return { kitChecks: { ...s.kitChecks, [today]: next } };
        });
      },

      reset: () => set(empty()),
    }),
    {
      name: 'shesync.study',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        preset: s.preset,
        timer: s.timer,
        sessions: s.sessions,
        tasks: s.tasks,
        confidence: s.confidence,
        wins: s.wins,
        kitChecks: s.kitChecks,
      }),
    }
  )
);
