// Timing for SOS breathing: what to show and when to vibrate. Pure, so it is easy to test.

/** In 4 s, hold 2 s, out 6 s: a long out-breath slows the heart. */
export const BREATH = { inhale: 4, hold: 2, exhale: 6 } as const;
const CYCLE = BREATH.inhale + BREATH.hold + BREATH.exhale;

export type BreathStage = 'in' | 'hold' | 'out';

/** Where in the breath she is, `t` seconds after starting. */
export function breathAt(t: number): { stage: BreathStage; secondsLeft: number; breaths: number } {
  const inCycle = t % CYCLE;
  const breaths = Math.floor(t / CYCLE);
  if (inCycle < BREATH.inhale) return { stage: 'in', secondsLeft: Math.ceil(BREATH.inhale - inCycle), breaths };
  if (inCycle < BREATH.inhale + BREATH.hold) return { stage: 'hold', secondsLeft: Math.ceil(BREATH.inhale + BREATH.hold - inCycle), breaths };
  return { stage: 'out', secondsLeft: Math.ceil(CYCLE - inCycle), breaths };
}

/**
 * Which haptic tap (if any) belongs to this moment: quick taps while breathing
 * in (every 0.5 s), none while holding, slow taps while breathing out (every
 * 1.5 s). Returns a key that changes once per tap.
 */
export function hapticSlot(t: number): { key: string; style: 'in' | 'out' } | null {
  const cycle = Math.floor(t / CYCLE);
  const inCycle = t % CYCLE;
  if (inCycle < BREATH.inhale) return { key: `${cycle}-i-${Math.floor(inCycle / 0.5)}`, style: 'in' };
  if (inCycle < BREATH.inhale + BREATH.hold) return null;
  return { key: `${cycle}-o-${Math.floor((inCycle - BREATH.inhale - BREATH.hold) / 1.5)}`, style: 'out' };
}

