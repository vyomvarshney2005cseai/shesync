/**
 * Connects the backup engine to the app: Supabase as the server, AsyncStorage
 * for bookkeeping, and the zustand stores as the on-device data.
 *
 * - startCloudSync()  once, from the root layout
 * - pullCloudData()   right after an online sign-in (restores her data)
 * - signOutAndClear() / deleteAccountAndData()  from the Profile screen
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { deleteCloudAccount } from '@/lib/supabaseService';
import { useAppStore } from '@/store/useAppStore';
import { useFitnessStore } from '@/store/useFitnessStore';
import { useGamesStore } from '@/store/useGamesStore';
import { useStudyStore } from '@/store/useStudyStore';
import { usePcosStore } from '@/store/usePcosStore';
import { useConfidenceStore } from '@/store/useConfidenceStore';
import { flushStorage } from '@/store/storage';
import { createSyncEngine, type SyncState } from './engine';
import { supabaseSyncClient } from './supabaseClient';
import type { LocalSnapshot } from './mappers';

// ─── Status (shown on the Profile screen) ───────────────────
interface SyncStatus {
  state: SyncState;
  lastSyncedAt?: number;
  error?: string;
}
export const useSyncStatus = create<SyncStatus>(() => ({ state: 'off' }));

// ─── Store ⇄ snapshot ───────────────────────────────────────
export function getLocal(): LocalSnapshot {
  const s = useAppStore.getState();
  const f = useFitnessStore.getState();
  const st = useStudyStore.getState();
  const g = useGamesStore.getState();
  const pc = usePcosStore.getState();
  const cf = useConfidenceStore.getState();
  return {
    profile: {
      userName: s.userName,
      focusAreas: s.focusAreas,
      isAssessmentCompleted: s.isAssessmentCompleted,
      assessmentAnswers: s.assessmentAnswers,
      fineTuningSettings: s.fineTuningSettings,
      healthCheck: s.healthCheck,
      healthCheckCompleted: s.healthCheckCompleted,
      syncCompletedAt: s.syncCompletedAt,
      rememberedCyclesCount: s.rememberedCyclesCount,
    },
    cycles: s.pastCycles,
    logs: s.symptomLogs,
    sleep: s.sleepLogs,
    contacts: s.careContacts,
    docs: {
      fitness: { profile: f.profile ?? null, weights: f.weights, sessions: f.sessions, habits: f.habits },
      study: {
        preset: st.preset,
        sessions: st.sessions,
        tasks: st.tasks,
        confidence: st.confidence,
        wins: st.wins,
        kitChecks: st.kitChecks,
      },
      games: { records: g.records, best: g.best },
      pcos: { diagnosed: pc.diagnosed, scan: pc.scan, checkins: pc.checkins, checklist: pc.checklist },
      confidence: { levels: cf.levels, glow: cf.glow, challenges: cf.challenges, proud: cf.proud, saved: cf.saved },
    },
  };
}

/** Copies only the keys a store persists, so server data cannot add stray fields. */
function pick(data: Record<string, unknown>, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (data[k] !== undefined && data[k] !== null) out[k] = data[k];
  return out;
}

export function applyLocal(m: LocalSnapshot) {
  const app = useAppStore.getState();
  useAppStore.setState({
    userName: m.profile.userName || app.userName,
    focusAreas: m.profile.focusAreas,
    isAssessmentCompleted: m.profile.isAssessmentCompleted,
    assessmentAnswers: m.profile.assessmentAnswers,
    fineTuningSettings: m.profile.fineTuningSettings,
    healthCheck: m.profile.healthCheck,
    healthCheckCompleted: m.profile.healthCheckCompleted,
    syncCompletedAt: m.profile.syncCompletedAt,
    symptomLogs: m.logs.slice(0, 1500),
    sleepLogs: m.sleep.slice(0, 400),
    careContacts: m.contacts.slice(0, 30),
  });
  // Recomputes cycle numbers, phase, prediction and every derived score.
  useAppStore.getState().savePastCycles(m.profile.rememberedCyclesCount, m.cycles);

  useFitnessStore.setState(pick(m.docs.fitness, ['profile', 'weights', 'sessions', 'habits']));
  useStudyStore.setState(pick(m.docs.study, ['preset', 'sessions', 'tasks', 'confidence', 'wins', 'kitChecks']));
  useGamesStore.setState(pick(m.docs.games, ['records', 'best']));
  usePcosStore.setState(pick(m.docs.pcos ?? {}, ['diagnosed', 'scan', 'checkins', 'checklist']));
  useConfidenceStore.setState(pick(m.docs.confidence ?? {}, ['levels', 'glow', 'challenges', 'proud', 'saved']));
}

const isCloudAccount = () => {
  const s = useAppStore.getState();
  return isSupabaseConfigured && s.isAuthenticated && !s.isOfflineAccount;
};

const engine = createSyncEngine({
  client: supabaseSyncClient(supabase),
  storage: AsyncStorage,
  getLocal,
  applyLocal,
  isCloudAccount,
  onStatus: (state, info) =>
    useSyncStatus.setState((prev) => ({
      state,
      lastSyncedAt: info?.lastSyncedAt ?? prev.lastSyncedAt,
      error: state === 'error' ? info?.error : undefined,
    })),
});

// ─── Wiring ─────────────────────────────────────────────────
const APP_KEYS = [
  'userName', 'focusAreas', 'isAssessmentCompleted', 'assessmentAnswers', 'fineTuningSettings',
  'healthCheck', 'healthCheckCompleted', 'syncCompletedAt', 'rememberedCyclesCount',
  'pastCycles', 'symptomLogs', 'sleepLogs', 'careContacts',
] as const;
const STUDY_KEYS = ['preset', 'sessions', 'tasks', 'confidence', 'wins', 'kitChecks'] as const;

const changed = <T extends object>(a: T, b: T, keys: readonly (keyof T)[]) => keys.some((k) => a[k] !== b[k]);

let started = false;

/** Starts automatic backup. Safe to call more than once. */
export function startCloudSync(): () => void {
  if (!isSupabaseConfigured || started) return () => {};
  started = true;
  const schedule = () => {
    if (isCloudAccount()) engine.schedule();
  };
  const unsubs = [
    useAppStore.subscribe((s, p) => {
      if (
        s.isAuthenticated !== p.isAuthenticated ||
        s.isOfflineAccount !== p.isOfflineAccount ||
        s.userEmail !== p.userEmail
      ) {
        // Another account (or none): merge that account's server copy before any upload.
        engine.resetSession();
        useSyncStatus.setState({ state: isCloudAccount() ? 'idle' : 'off', error: undefined });
      }
      if (changed(s, p, APP_KEYS)) schedule();
    }),
    useFitnessStore.subscribe((s, p) => {
      if (s.profile !== p.profile || s.weights !== p.weights || s.sessions !== p.sessions || s.habits !== p.habits) schedule();
    }),
    useStudyStore.subscribe((s, p) => {
      if (changed(s, p, STUDY_KEYS)) schedule();
    }),
    useGamesStore.subscribe((s, p) => {
      if (s.records !== p.records || s.best !== p.best) schedule();
    }),
    usePcosStore.subscribe((s, p) => {
      if (s.checkins !== p.checkins || s.checklist !== p.checklist || s.diagnosed !== p.diagnosed || s.scan !== p.scan) schedule();
    }),
    useConfidenceStore.subscribe((s, p) => {
      if (s.levels !== p.levels || s.glow !== p.glow || s.challenges !== p.challenges || s.proud !== p.proud || s.saved !== p.saved) schedule();
    }),
  ];
  // Upload anything waiting when the app goes to the background, and retry
  // a failed upload when she comes back.
  const appState = AppState.addEventListener('change', (next) => {
    if (!isCloudAccount()) return;
    if (next === 'background' || next === 'inactive') void engine.flush();
    else if (next === 'active' && useSyncStatus.getState().state === 'error') engine.schedule();
  });
  // Catch up on changes made while offline last time.
  if (isCloudAccount()) {
    useSyncStatus.setState({ state: 'idle' });
    engine.schedule();
  }
  return () => {
    unsubs.forEach((u) => u());
    appState.remove();
    started = false;
  };
}

const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T) =>
  Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

/** Restores her data after signing in (waits at most `timeoutMs`; the rest finishes in the background). */
export function pullCloudData(timeoutMs = 6000): Promise<boolean> {
  if (!isCloudAccount()) return Promise.resolve(false);
  return withTimeout(engine.pull(), timeoutMs, false);
}

/** Uploads pending changes now. Resolves false if that did not finish within `timeoutMs`. */
export function flushCloudSync(timeoutMs = 5000): Promise<boolean> {
  if (!isCloudAccount()) return Promise.resolve(true);
  return withTimeout(engine.flush(), timeoutMs, false);
}

/** True for accounts that back up to the server (vs. on-device only). */
export const isCloudAccountNow = isCloudAccount;

async function clearBookkeeping() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('shesync.sync.'));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch {
    // Only upload bookkeeping (ids and hashes); nothing personal is left behind.
  }
}

/** Uploads anything waiting, then signs out and removes her data from this device. */
export async function signOutAndClear(): Promise<void> {
  await flushCloudSync();
  engine.resetSession();
  await useAppStore.getState().logout();
  await Promise.all([clearBookkeeping(), flushStorage()]);
}

/**
 * Permanently deletes her account: the server copy (online accounts) and
 * everything on this device. Throws if the server could not be reached, in
 * which case nothing is removed.
 */
export async function deleteAccountAndData(): Promise<void> {
  engine.resetSession();
  if (isCloudAccount()) await deleteCloudAccount();
  await useAppStore.getState().logout();
  await Promise.all([clearBookkeeping(), flushStorage()]);
}
