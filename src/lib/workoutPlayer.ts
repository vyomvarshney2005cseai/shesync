// Pure state machine for the guided workout player. Kept outside the
// screen so every transition is easy to test and never depends on render.
import type { LibraryWorkout } from '@/constants/fitnessLibrary';

export type PlayerPhase = 'ready' | 'work' | 'rest' | 'done';

export interface PlayerState {
  phase: PlayerPhase;
  step: number;
  set: number;
  /** Epoch ms when the current countdown ends (null = no countdown or paused). */
  endsAt: number | null;
  /** Ms left on the countdown when paused. */
  pausedLeft: number | null;
  paused: boolean;
  startedAt: number | null;
  pausedAt: number | null;
  pausedMs: number;
  finishedAt: number | null;
  completedSteps: number;
  now: number;
}

export type PlayerAction =
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'doneSet'; now: number }
  | { type: 'skip'; now: number }
  | { type: 'next'; now: number }
  | { type: 'prev'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'finish'; now: number };

export const initialPlayerState: PlayerState = {
  phase: 'ready',
  step: 0,
  set: 1,
  endsAt: null,
  pausedLeft: null,
  paused: false,
  startedAt: null,
  pausedAt: null,
  pausedMs: 0,
  finishedAt: null,
  completedSteps: 0,
  now: 0,
};

export function createPlayerReducer(workout: LibraryWorkout) {
  const steps = workout.steps;

  const enterWork = (s: PlayerState, step: number, set: number, now: number): PlayerState => {
    const st = steps[step];
    return {
      ...s,
      phase: 'work',
      step,
      set,
      endsAt: st.seconds ? now + st.seconds * 1000 : null,
      pausedLeft: null,
      now,
    };
  };

  const finish = (s: PlayerState, now: number): PlayerState => {
    const extraPause = s.paused && s.pausedAt ? now - s.pausedAt : 0;
    return {
      ...s,
      phase: 'done',
      endsAt: null,
      paused: false,
      pausedAt: null,
      pausedMs: s.pausedMs + extraPause,
      finishedAt: now,
      now,
    };
  };

  const nextStep = (s: PlayerState, now: number): PlayerState => {
    const completed = Math.max(s.completedSteps, s.step + 1);
    if (s.step + 1 >= steps.length) return finish({ ...s, completedSteps: completed }, now);
    return enterWork({ ...s, completedSteps: completed }, s.step + 1, 1, now);
  };

  const afterSet = (s: PlayerState, now: number): PlayerState => {
    const st = steps[s.step];
    const sets = st.sets ?? 1;
    if (s.set < sets) {
      const rest = st.restSeconds ?? 0;
      if (rest > 0) return { ...s, phase: 'rest', endsAt: now + rest * 1000, pausedLeft: null, now };
      return enterWork(s, s.step, s.set + 1, now);
    }
    return nextStep(s, now);
  };

  return function reducer(s: PlayerState, a: PlayerAction): PlayerState {
    switch (a.type) {
      case 'start':
        if (s.phase !== 'ready') return s;
        return enterWork({ ...s, startedAt: a.now }, 0, 1, a.now);
      case 'tick':
        if (s.paused || (s.phase !== 'work' && s.phase !== 'rest')) return { ...s, now: a.now };
        if (s.endsAt != null && a.now >= s.endsAt) {
          return s.phase === 'work' ? afterSet(s, a.now) : enterWork(s, s.step, s.set + 1, a.now);
        }
        return { ...s, now: a.now };
      case 'doneSet':
        if (s.phase !== 'work' || s.paused) return s;
        return afterSet(s, a.now);
      case 'skip':
        if (s.paused) return s;
        if (s.phase === 'rest') return enterWork(s, s.step, s.set + 1, a.now);
        if (s.phase === 'work') return afterSet(s, a.now);
        return s;
      case 'next':
        if (s.phase !== 'work' && s.phase !== 'rest') return s;
        return nextStep({ ...s, paused: false, pausedLeft: null }, a.now);
      case 'prev':
        if ((s.phase !== 'work' && s.phase !== 'rest') || s.step === 0) return s;
        return enterWork({ ...s, paused: false }, s.step - 1, 1, a.now);
      case 'pause':
        if (s.paused || (s.phase !== 'work' && s.phase !== 'rest')) return s;
        return {
          ...s,
          paused: true,
          pausedAt: a.now,
          pausedLeft: s.endsAt != null ? Math.max(0, s.endsAt - a.now) : null,
          endsAt: null,
          now: a.now,
        };
      case 'resume':
        if (!s.paused) return s;
        return {
          ...s,
          paused: false,
          pausedMs: s.pausedMs + (s.pausedAt ? a.now - s.pausedAt : 0),
          pausedAt: null,
          endsAt: s.pausedLeft != null ? a.now + s.pausedLeft : null,
          pausedLeft: null,
          now: a.now,
        };
      case 'finish':
        if (s.phase === 'ready' || s.phase === 'done') return s;
        return finish(s, a.now);
      default:
        return s;
    }
  };
}

/** Seconds left on the visible countdown (null for rep-based work). */
export function secondsLeft(s: PlayerState): number | null {
  if (s.endsAt != null) return Math.max(0, Math.ceil((s.endsAt - s.now) / 1000));
  if (s.pausedLeft != null) return Math.ceil(s.pausedLeft / 1000);
  return null;
}

/** Active minutes (excluding pauses), at least 1. */
export function activeMinutes(s: PlayerState): number {
  if (s.startedAt == null) return 0;
  const end = s.finishedAt ?? s.now;
  return Math.max(1, Math.round((end - s.startedAt - s.pausedMs) / 60000));
}
