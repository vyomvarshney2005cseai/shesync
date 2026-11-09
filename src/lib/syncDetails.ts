import type { Href } from 'expo-router';
import type { AppState } from '@/types';

/**
 * "Details for Sync" — the one-time setup shown on Home until it is finished.
 * Each step is an existing form or log screen. While the setup runs, every
 * screen is opened with `?onboarding=true` and, when saved, sends her to the
 * next unfinished step (or the referral result at the end).
 */
export type SyncStepId = 'questions' | 'period' | 'pain' | 'flow' | 'mood' | 'safety';

export interface SyncStep {
  id: SyncStepId;
  number: number;
  title: string;
  subtitle: string;
  route: '/assessment' | '/log-cycle' | '/log-pain' | '/log-flow' | '/log-mood' | '/health-check';
  emoji: string;
}

export const SYNC_STEPS: SyncStep[] = [
  { id: 'questions', number: 1, title: 'About your cycle', subtitle: '10 quick questions', route: '/assessment', emoji: '🌷' },
  { id: 'period', number: 2, title: 'Period dates', subtitle: 'Tick your last periods', route: '/log-cycle', emoji: '📅' },
  { id: 'pain', number: 3, title: 'Pain check-in', subtitle: 'Cramps & where it hurts', route: '/log-pain', emoji: '🫶' },
  { id: 'flow', number: 4, title: 'Flow', subtitle: 'How heavy, colour', route: '/log-flow', emoji: '💧' },
  { id: 'mood', number: 5, title: 'Mood & energy', subtitle: 'How you feel today', route: '/log-mood', emoji: '🌙' },
  { id: 'safety', number: 6, title: 'Health safety check', subtitle: '11 yes / no questions', route: '/health-check', emoji: '🩺' },
];

export const SYNC_STEP_COUNT = SYNC_STEPS.length;

type SyncInput = Pick<
  AppState,
  'isAssessmentCompleted' | 'pastCycles' | 'symptomLogs' | 'healthCheckCompleted' | 'syncCompletedAt'
>;

export function isStepDone(step: SyncStepId, s: SyncInput): boolean {
  switch (step) {
    case 'questions':
      return s.isAssessmentCompleted;
    case 'period':
      return s.pastCycles.length > 0;
    case 'pain':
      return s.symptomLogs.some((l) => typeof l.pain === 'number');
    case 'flow':
      return s.symptomLogs.some((l) => !!l.flow);
    case 'mood':
      return s.symptomLogs.some((l) => typeof l.mood === 'number');
    case 'safety':
      return s.healthCheckCompleted;
  }
}

export function syncProgress(s: SyncInput) {
  const steps = SYNC_STEPS.map((step) => ({ ...step, done: isStepDone(step.id, s) }));
  const doneCount = steps.filter((x) => x.done).length;
  return {
    steps,
    doneCount,
    total: steps.length,
    allStepsDone: doneCount === steps.length,
    /** The setup counts as finished once she has seen her result. */
    isComplete: !!s.syncCompletedAt,
    next: steps.find((x) => !x.done) ?? null,
  };
}

/** Where the setup goes next: the first unfinished step, else the result window. */
export function nextSyncHref(s: SyncInput): Href {
  const next = SYNC_STEPS.find((step) => !isStepDone(step.id, s));
  return (next ? `${next.route}?onboarding=true` : '/sync-result') as Href;
}

/** Badge text shown on top of each form while the setup is running. */
export function syncStepBadge(step: SyncStepId): string {
  const n = SYNC_STEPS.find((x) => x.id === step)?.number ?? 1;
  return `DETAILS FOR SYNC · STEP ${n} OF ${SYNC_STEP_COUNT}`;
}
