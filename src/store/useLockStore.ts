import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceStorage } from './storage';

/**
 * App lock state. The PIN itself is never kept here: only a salted hash,
 * in the phone's secure storage (see src/lib/appLock.ts).
 */
interface LockState {
  enabled: boolean;
  /** Offer fingerprint / Face ID before the PIN. */
  biometrics: boolean;
  pinLength: 4 | 6;
  /** Wrong PINs in a row (kept across restarts so closing the app does not reset it). */
  failed: number;
  /** After repeated wrong PINs, no tries until this time (ms). */
  blockedUntil: number;

  /** Runtime only: the lock screen is showing. */
  locked: boolean;

  setLocked: (locked: boolean) => void;
  setBiometrics: (on: boolean) => void;
  recordFailure: () => void;
  recordSuccess: () => void;
  turnOn: (pinLength: 4 | 6, biometrics: boolean) => void;
  turnOff: () => void;
}

const FREE_TRIES = 5;

export const useLockStore = create<LockState>()(
  persist(
    (set, get) => ({
      enabled: false,
      biometrics: false,
      pinLength: 4,
      failed: 0,
      blockedUntil: 0,
      locked: false,

      setLocked: (locked) => set({ locked: locked && get().enabled }),
      setBiometrics: (biometrics) => set({ biometrics }),
      recordFailure: () => {
        const failed = get().failed + 1;
        // 5 free tries, then 30 s, 1 min, 2 min … up to 15 min between tries.
        const wait = failed >= FREE_TRIES ? Math.min(15 * 60_000, 30_000 * 2 ** (failed - FREE_TRIES)) : 0;
        set({ failed, blockedUntil: wait ? Date.now() + wait : 0 });
      },
      recordSuccess: () => set({ failed: 0, blockedUntil: 0, locked: false }),
      turnOn: (pinLength, biometrics) => set({ enabled: true, pinLength, biometrics, failed: 0, blockedUntil: 0, locked: false }),
      turnOff: () => set({ enabled: false, biometrics: false, failed: 0, blockedUntil: 0, locked: false }),
    }),
    {
      name: 'shesync.lock',
      version: 1,
      storage: deviceStorage(),
      partialize: (s) => ({
        enabled: s.enabled,
        biometrics: s.biometrics,
        pinLength: s.pinLength,
        failed: s.failed,
        blockedUntil: s.blockedUntil,
      }),
      // Opening the app is "coming back": start locked when the lock is on.
      onRehydrateStorage: () => (state) => {
        if (state?.enabled) useLockStore.setState({ locked: true });
      },
    }
  )
);
