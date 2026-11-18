// Pure helpers for the pad change timer. No React, no storage — easy to test.
import { PRODUCT_GUIDES, type PeriodProduct } from '@/constants/padCare';
import type { FlowIntensity } from '@/types';

export type WearMode = 'day' | 'night';

export const HOUR_MS = 3_600_000;

export interface WearSession {
  since: number; // epoch ms when the product was put on
  mode: WearMode;
  product: PeriodProduct;
}

export interface ChangeEvent {
  at: number; // epoch ms
}

export type TimerStatusId = 'fresh' | 'soon' | 'due' | 'over';

export interface TimerStatus {
  id: TimerStatusId;
  label: string;
  hint: string;
  color: string;
  /** Share of the reminder interval used so far, clamped to 0..1 (drives the ring). */
  fraction: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Hours until the first reminder for this session. */
export function reminderHours(product: PeriodProduct, mode: WearMode, intervalHours: number): number {
  const g = PRODUCT_GUIDES[product];
  if (mode === 'night') return g.nightHours;
  return clamp(intervalHours, 1, g.maxDayHours);
}

/** Interval to suggest for today: shorter on heavy days for pads and tampons. */
export function suggestedHours(product: PeriodProduct, flow: FlowIntensity | null | undefined): number {
  const g = PRODUCT_GUIDES[product];
  const heavy = flow === 'heavy' || flow === 'severe';
  if (heavy && (product === 'pad' || product === 'cloth_pad' || product === 'tampon')) return 3;
  if (heavy && product === 'cup') return 6;
  return g.defaultHours;
}

export function timerStatus(session: WearSession, intervalHours: number, now: number): TimerStatus {
  const g = PRODUCT_GUIDES[session.product];
  const target = reminderHours(session.product, session.mode, intervalHours);
  const hours = Math.max(0, now - session.since) / HOUR_MS;
  const fraction = clamp(hours / target, 0, 1);

  if (hours >= g.overHours) {
    return {
      id: 'over',
      label: `Over ${g.overHours} hours`,
      hint:
        session.product === 'tampon'
          ? 'Take it out now. Leaving a tampon in longer than 8 hours raises the risk of a rare but serious infection.'
          : `Please ${g.verb} your ${g.noun} now.`,
      color: '#B91C1C',
      fraction: 1,
    };
  }
  if (hours >= target) {
    return {
      id: 'due',
      label: g.verb === 'empty' ? 'Time to empty' : 'Time to change',
      hint: `It has been ${formatElapsed(now - session.since)}. A fresh one keeps rashes and infections away.`,
      color: '#E11D48',
      fraction,
    };
  }
  if (fraction >= 0.75) {
    return {
      id: 'soon',
      label: g.verb === 'empty' ? 'Empty soon' : 'Change soon',
      hint: `Reminder in ${formatElapsed(session.since + target * HOUR_MS - now)}.`,
      color: '#D97706',
      fraction,
    };
  }
  return {
    id: 'fresh',
    label: 'All good',
    hint:
      session.mode === 'night'
        ? `Sleep well — reminder in about ${target} hours.`
        : `Next reminder in ${formatElapsed(session.since + target * HOUR_MS - now)}.`,
    color: '#059669',
    fraction,
  };
}

/** "45m", "2h 05m". */
export function formatElapsed(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** "2:15 pm" in the phone's locale. */
export function clockLabel(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/**
 * How many back-to-back changes in the last `windowHours` came within `gapHours`
 * of each other. Several in a row can mean soaking through every 1–2 hours.
 */
export function shortGapCount(changes: ChangeEvent[], now: number, windowHours = 24, gapHours = 2): number {
  const from = now - windowHours * HOUR_MS;
  const times = changes
    .map((c) => c.at)
    .filter((t) => t >= from && t <= now)
    .sort((a, b) => a - b);
  let count = 0;
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] <= gapHours * HOUR_MS) count++;
  }
  return count;
}

export type SkinReaction = 'fine' | 'mild' | 'irritated';

/** Score for a personal pad note: comfort + leak protection, minus skin trouble. */
export function noteScore(n: { comfort: number; protection: number; skin: SkinReaction }): number {
  const penalty = n.skin === 'irritated' ? 3 : n.skin === 'mild' ? 1 : 0;
  return n.comfort + n.protection - penalty;
}
