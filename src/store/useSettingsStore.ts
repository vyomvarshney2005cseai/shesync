import { useEffect, useState } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceStorage } from './storage';

/**
 * off = light, on = dark, auto = dark from 9 pm to 6 am, system = follow the phone.
 * Light is the default: every page is light unless she picks a dark option.
 */
export type NightMode = 'off' | 'on' | 'auto' | 'system';

export const DEFAULT_NIGHT_MODE: NightMode = 'off';

/**
 * Saved settings from older versions. Version 1 defaulted to "Match phone",
 * which turned SheSync dark on phones in dark mode although she never chose
 * dark; those phones now start in light. Light/Dark/Dark at night are kept.
 */
export function migrateSettings(persisted: unknown, version: number): Record<string, unknown> {
  const s = { ...((persisted as Record<string, unknown>) ?? {}) };
  if (version < 2 && (s.nightMode === 'system' || s.nightMode === undefined)) s.nightMode = DEFAULT_NIGHT_MODE;
  if (!['off', 'on', 'auto', 'system'].includes(s.nightMode as string)) s.nightMode = DEFAULT_NIGHT_MODE;
  return s;
}

/**
 * What the phone's own UI (alerts, keyboard, pickers, status bar) should use,
 * so it matches the app: light/dark when she chose one, the phone's own
 * setting only for "Match phone".
 */
export function appearanceOverride(nightMode: NightMode, nightActive: boolean): 'light' | 'dark' | 'unspecified' {
  if (nightMode === 'system') return 'unspecified';
  return nightActive ? 'dark' : 'light';
}

/** YourGoGirl's reply language. `auto` answers in the language she writes in. */
export type ChatLanguageSetting = 'auto' | 'en' | 'hinglish' | 'hi';

/** Language the voice journal listens for. */
export type JournalSpeechLang = 'en-IN' | 'hi-IN';

/** Background sound inside the focus timer (bundled, works offline). */
export type FocusSound = 'off' | 'rain' | 'cafe' | 'lofi';

interface SettingsState {
  /** off = always light (default), on = always night, auto = night from 9 pm to 6 am, system = follow the phone. */
  nightMode: NightMode;
  setNightMode: (mode: NightMode) => void;
  chatLanguage: ChatLanguageSetting;
  setChatLanguage: (lang: ChatLanguageSetting) => void;
  journalLang: JournalSpeechLang;
  setJournalLang: (lang: JournalSpeechLang) => void;
  focusSound: FocusSound;
  focusVolume: number; // 0..1
  setFocusSound: (sound: FocusSound) => void;
  setFocusVolume: (volume: number) => void;
  /** Login prefills this email when she ticked "Remember my email". */
  rememberedEmail: string;
  setRememberedEmail: (email: string) => void;
  /** The 3 welcome slides were seen (or skipped) on this phone. */
  welcomeSeen: boolean;
  setWelcomeSeen: (seen: boolean) => void;
  /** Send anonymous crash reports to SheSync's own server (no account or device id). */
  crashReports: boolean;
  setCrashReports: (on: boolean) => void;
  /** Daily check-in reminder (local notification) and its hour, 0–23. */
  checkInReminder: boolean;
  checkInReminderHour: number;
  setCheckInReminder: (on: boolean, hour?: number) => void;
  /** A discreet heads-up two days before the predicted period. */
  periodReminder: boolean;
  setPeriodReminder: (on: boolean) => void;
}

/** Settings that belong to the phone, not the account: kept after sign-out. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      nightMode: DEFAULT_NIGHT_MODE,
      setNightMode: (nightMode) => set({ nightMode }),
      chatLanguage: 'auto',
      setChatLanguage: (chatLanguage) => set({ chatLanguage }),
      journalLang: 'en-IN',
      setJournalLang: (journalLang) => set({ journalLang }),
      focusSound: 'off',
      focusVolume: 0.6,
      setFocusSound: (focusSound) => set({ focusSound }),
      setFocusVolume: (v) => set({ focusVolume: Math.max(0, Math.min(1, Math.round(v * 10) / 10)) }),
      rememberedEmail: '',
      setRememberedEmail: (rememberedEmail) => set({ rememberedEmail: rememberedEmail.trim().slice(0, 120) }),
      welcomeSeen: false,
      setWelcomeSeen: (welcomeSeen) => set({ welcomeSeen }),
      crashReports: true,
      setCrashReports: (crashReports) => set({ crashReports }),
      checkInReminder: false,
      checkInReminderHour: 20,
      setCheckInReminder: (checkInReminder, hour) =>
        set((s) => ({ checkInReminder, checkInReminderHour: hour === undefined ? s.checkInReminderHour : Math.max(0, Math.min(23, Math.round(hour))) })),
      periodReminder: false,
      setPeriodReminder: (periodReminder) => set({ periodReminder }),
    }),
    {
      name: 'shesync.settings',
      version: 2,
      storage: deviceStorage(),
      migrate: (persisted, version) => migrateSettings(persisted, version) as unknown as SettingsState,
    }
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
  const scheme = useColorScheme();
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

  return nightMode === 'on' || (nightMode === 'auto' && nightHour) || (nightMode === 'system' && scheme === 'dark');
}
