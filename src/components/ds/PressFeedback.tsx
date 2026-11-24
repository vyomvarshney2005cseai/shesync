import { createContext, useCallback, useContext, useState } from 'react';

/**
 * Lets an icon inside a card or button play its micro-interaction when that
 * card or button is pressed or hovered. The pressable owns a counter and
 * bumps it; IconBadge animates whenever the number changes.
 */
export const PressFeedbackContext = createContext(0);

export function usePressFeedback(): [number, () => void] {
  const [count, setCount] = useState(0);
  const bump = useCallback(() => setCount((c) => (c + 1) % 1000), []);
  return [count, bump];
}

export const usePressSignal = () => useContext(PressFeedbackContext);
