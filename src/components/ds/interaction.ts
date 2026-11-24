import { useState } from 'react';
import { Platform, type PressableStateCallbackType } from 'react-native';

/** Pressable state including the web-only hover/focus flags. */
export type PressState = PressableStateCallbackType & { hovered?: boolean; focused?: boolean };

/**
 * Keyboard focus ring. On the web the global `:focus-visible` outline
 * (src/global.css) draws it, so only native keyboards (Android / iPad)
 * need this state.
 */
export function useNativeFocus(): [boolean, { onFocus?: () => void; onBlur?: () => void }] {
  const [focused, setFocused] = useState(false);
  if (Platform.OS === 'web') return [false, {}];
  return [focused, { onFocus: () => setFocused(true), onBlur: () => setFocused(false) }];
}

/** Hit area that brings a smaller visual up to the 44pt minimum. */
export function hitSlopFor(height: number, width = height): { top: number; bottom: number; left: number; right: number } {
  const v = Math.max(0, Math.ceil((44 - height) / 2));
  const h = Math.max(0, Math.ceil((44 - width) / 2));
  return { top: v, bottom: v, left: h, right: h };
}
