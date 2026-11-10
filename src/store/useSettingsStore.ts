import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceStorage } from './storage';

export type NightMode = 'off' | 'on' | 'auto';

interface SettingsState {
  /** off = always light, on = always night, auto = night from 9 pm to 6 am. */
  nightMode: NightMode;
  setNightMode: (mode: NightMode) => void;
}

/** Settings that belong to the phone, not the account: kept after sign-out. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      nightMode: 'off',
      setNightMode: (nightMode) => set({ nightMode }),
    }),
    { name: 'shesync.settings', version: 1, storage: deviceStorage() }
  )
);

const NIGHT_STARTS = 21; // 9 pm
const NIGHT_ENDS = 6; // 6 am

export function isNightHour(date = new Date()): boolean {
  const h = date.getHours();
  return h >= NIGHT_STARTS || h < NIGHT_ENDS;
}

/** True when the night palette should be showing right now. */
export function useNightActive(): boolean {
  const nightMode = useSettingsStore((s) => s.nightMode);
  const [nightHour, setNightHour] = useState(() => isNightHour());

  useEffect(() => {
    if (nightMode !== 'auto') return;
    const check = () => setNightHour(isNightHour());
    check();
    const timer = setInterval(check, 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [nightMode]);

  return nightMode === 'on' || (nightMode === 'auto' && nightHour);
}
