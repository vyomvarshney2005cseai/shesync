import { useSyncExternalStore } from 'react';
import { useAppStore } from './useAppStore';
import { useFitnessStore } from './useFitnessStore';
import { useStudyStore } from './useStudyStore';
import { useGamesStore } from './useGamesStore';
import { useSettingsStore } from './useSettingsStore';
import { usePcosStore } from './usePcosStore';
import { useConfidenceStore } from './useConfidenceStore';

const stores = [useAppStore, useFitnessStore, useStudyStore, useGamesStore, useSettingsStore, usePcosStore, useConfidenceStore];

function subscribe(onChange: () => void) {
  const unsubs = stores.map((s) => s.persist.onFinishHydration(onChange));
  return () => unsubs.forEach((u) => u());
}

function allHydrated() {
  return stores.every((s) => s.persist.hasHydrated());
}

/**
 * True once every persisted store has loaded from device storage.
 * Screens that decide where to send the user (signed in or not) must wait
 * for this, otherwise they briefly see the empty initial state.
 */
export function useStoresHydrated(): boolean {
  return useSyncExternalStore(subscribe, allHydrated, () => false);
}
