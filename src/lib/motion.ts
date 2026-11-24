// ============================================================
// "Reduce motion": follows the phone's accessibility setting
// (iOS Reduce Motion, Android Remove animations, the browser's
// prefers-reduced-motion). When it is on, SheSync stops pulsing,
// sliding and wiggling: screens change without slides, skeletons
// don't shimmer, breathing circles don't grow.
// ============================================================
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

let current = false;
const listeners = new Set<(on: boolean) => void>();

function set(on: boolean) {
  if (on === current) return;
  current = on;
  listeners.forEach((l) => l(on));
}

try {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      set(mq.matches);
      mq.addEventListener?.('change', (e) => set(e.matches));
    }
  } else {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(set)
      .catch(() => {});
    AccessibilityInfo.addEventListener?.('reduceMotionChanged', set);
  }
} catch {
  // No accessibility API (tests): motion stays on.
}

/** True while the phone asks for less motion (for code outside components). */
export function reduceMotionNow(): boolean {
  return current;
}

/** Re-renders when the phone's reduce-motion setting changes. */
export function useReduceMotion(): boolean {
  const [on, setOn] = useState(current);
  useEffect(() => {
    listeners.add(setOn);
    return () => {
      listeners.delete(setOn);
    };
  }, []);
  // The first answer from the phone can arrive after the first render.
  return on || current;
}

/** For tests: pretend the setting changed. */
export function __setReduceMotion(on: boolean): void {
  set(on);
}
