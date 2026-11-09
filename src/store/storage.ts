import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * Batched device storage for the persisted stores.
 *
 * zustand's default JSON storage serialises and writes the whole store on
 * every change; with a few hundred logs that is several hundred KB per tap
 * (logging pain, for example, changes state twice). Here changes are kept in
 * memory and written together a moment later, and immediately when the app
 * goes to the background or the browser tab is hidden.
 */
const WRITE_DELAY_MS = 400;
const pending = new Map<string, unknown>();
let timer: ReturnType<typeof setTimeout> | null = null;

export async function flushStorage(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!pending.size) return;
  const entries = [...pending].map(([key, value]) => [key, JSON.stringify(value)] as [string, string]);
  pending.clear();
  try {
    await AsyncStorage.multiSet(entries);
  } catch (e) {
    console.warn('[storage] save failed', e);
  }
}

AppState.addEventListener('change', (state) => {
  if (state !== 'active') void flushStorage();
});
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => void flushStorage());
}

export function deviceStorage<S>(): PersistStorage<S> {
  return {
    async getItem(name) {
      if (pending.has(name)) return pending.get(name) as StorageValue<S>;
      const raw = await AsyncStorage.getItem(name);
      return raw ? (JSON.parse(raw) as StorageValue<S>) : null;
    },
    setItem(name, value) {
      // Store snapshots are immutable, so keeping the reference is safe.
      pending.set(name, value);
      if (!timer) timer = setTimeout(() => void flushStorage(), WRITE_DELAY_MS);
    },
    async removeItem(name) {
      pending.delete(name);
      await AsyncStorage.removeItem(name);
    },
  };
}
