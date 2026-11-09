// ============================================================
// Local-date helpers.
//
// Dates in SheSync are stored as local calendar keys ("YYYY-MM-DD").
// `toISOString()` must not be used for this: it converts to UTC, so in
// India (UTC+5:30) anything logged between midnight and 5:30 AM was
// filed under the previous day.
// ============================================================

const DAY_MS = 86400000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar key for a date, e.g. "2026-11-08". */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's local calendar key. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Local midnight for a "YYYY-MM-DD" key (falls back to today for bad input). */
export function parseDateKey(key: string | undefined | null): Date {
  if (key) {
    const parts = key.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && parts.every((p) => !Number.isNaN(p))) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Key for the day `days` after `key` (negative goes back). DST-safe. */
export function addDaysToKey(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Key for N days before today. */
export function daysAgoKey(days: number): string {
  return addDaysToKey(todayKey(), -days);
}

/** Whole calendar days from `fromKey` to `toKey` (positive when `toKey` is later). */
export function daysBetweenKeys(fromKey: string, toKey: string): number {
  const a = parseDateKey(fromKey);
  const b = parseDateKey(toKey);
  // Use UTC of the local calendar fields so DST shifts never produce 0.958 days.
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / DAY_MS);
}

/** Days since a key, measured from today (0 = today). */
export function daysSinceKey(key: string): number {
  return daysBetweenKeys(key, todayKey());
}

/** Keys for the last `n` days ending today, oldest first. */
export function lastNDaysKeys(n: number): string[] {
  const today = todayKey();
  return Array.from({ length: n }, (_, i) => addDaysToKey(today, i - (n - 1)));
}

/** Monday-based start of the week containing `key`. */
export function startOfWeekKey(key: string = todayKey()): string {
  const d = parseDateKey(key);
  const weekday = (d.getDay() + 6) % 7; // Mon = 0 … Sun = 6
  return addDaysToKey(key, -weekday);
}

/** Short label such as "Mon" for a key. */
export function weekdayLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString('en-US', { weekday: 'short' });
}

/** Friendly label such as "8 Nov" for a key. */
export function shortDateLabel(key: string): string {
  return parseDateKey(key).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Greeting for the current local time. */
export function timeOfDayGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "mm:ss" for a number of seconds. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
