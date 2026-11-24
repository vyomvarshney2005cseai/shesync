// ============================================================
// Saving period dates: one start–end range per period, plus
// "I don't remember exactly" (around early / mid / late in a month).
// Pure functions, so they are easy to test.
// ============================================================
import type { PastCycleRecord } from '@/types';
import { addDaysToKey, daysBetweenKeys, parseDateKey, toDateKey } from '@/lib/dates';

export type MonthPart = 'early' | 'mid' | 'late';

export const MONTH_PART_LABEL: Record<MonthPart, string> = { early: 'Early', mid: 'Mid', late: 'Late' };

/** Longest period the range picker accepts; a later tap starts a new range. */
export const MAX_PERIOD_DAYS = 14;

/** The day we use for "around early / mid / late <month>". */
export function approximateStart(year: number, monthIndex: number, part: MonthPart, today: string): string {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const day = part === 'early' ? 5 : part === 'mid' ? 15 : Math.min(25, daysInMonth - 2);
  const key = toDateKey(new Date(year, monthIndex, day));
  return key > today ? today : key;
}

/** "around mid-October" for an approximate start date. */
export function approximateLabel(start: string): string {
  const d = parseDateKey(start);
  const day = d.getDate();
  const part = day <= 10 ? 'early' : day <= 20 ? 'mid' : 'late';
  const month = d.toLocaleDateString('en-IN', { month: 'long' });
  return `around ${part}-${month}`;
}

/** Inclusive number of days in a range. */
export function rangeDays(start: string, end: string): number {
  return Math.max(1, daysBetweenKeys(start, end) + 1);
}

/** What the next tap on the calendar does with the current selection. */
export function nextRange(
  current: { start: string | null; end: string | null },
  tapped: string
): { start: string | null; end: string | null } {
  const { start, end } = current;
  // Nothing picked yet, or a full range already picked: start a new one.
  if (!start || end) return { start: tapped, end: null };
  // Tapping before the start (or the start again) moves the start.
  if (tapped <= start) return { start: tapped, end: null };
  // Too long to be one period: begin again from this day.
  if (rangeDays(start, tapped) > MAX_PERIOD_DAYS) return { start: tapped, end: null };
  return { start, end: tapped };
}

/**
 * Adds one period to the list. A saved period that overlaps it (or starts
 * within 10 days of it) is replaced, so tapping a corrected range edits rather
 * than duplicates. Returns the list newest first, renumbered, with cycle
 * lengths recomputed from consecutive starts.
 */
export function savePeriod(
  cycles: PastCycleRecord[],
  period: { start: string; end: string; approximate?: boolean },
  today: string
): PastCycleRecord[] {
  const end = period.end < period.start ? period.start : period.end;
  const kept = cycles.filter((c) => {
    const cEnd = c.endDate ?? addDaysToKey(c.startDate, Math.max(1, c.periodDurationDays || 5) - 1);
    const overlaps = c.startDate <= end && cEnd >= period.start;
    const close = Math.abs(daysBetweenKeys(c.startDate, period.start)) < 10;
    return !overlaps && !close;
  });
  const record: PastCycleRecord = {
    id: `cycle-${period.start}`,
    cycleNumber: 1,
    startDate: period.start,
    endDate: end,
    daysAgo: Math.max(0, daysBetweenKeys(period.start, today)),
    lengthDays: 28,
    periodDurationDays: rangeDays(period.start, end),
    ...(period.approximate ? { approximate: true } : {}),
  };
  return renumber([record, ...kept], today);
}

export function removePeriod(cycles: PastCycleRecord[], id: string, today: string): PastCycleRecord[] {
  return renumber(cycles.filter((c) => c.id !== id), today);
}

/** Sort newest first, renumber, refresh daysAgo, and recompute lengths between starts. */
export function renumber(cycles: PastCycleRecord[], today: string): PastCycleRecord[] {
  const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((c) => ({ ...c }));
  sorted.forEach((c, i) => {
    c.cycleNumber = i + 1;
    c.daysAgo = Math.max(0, daysBetweenKeys(c.startDate, today));
    const older = sorted[i + 1];
    if (older) {
      const len = daysBetweenKeys(older.startDate, c.startDate);
      if (len >= 15 && len <= 100) older.lengthDays = len;
    }
  });
  // The newest cycle is still running, so its length is unknown: use her average.
  if (sorted.length > 1) {
    const known = sorted.slice(1).map((c) => c.lengthDays);
    sorted[0].lengthDays = Math.round(known.reduce((a, b) => a + b, 0) / known.length);
  }
  return sorted;
}

/** Sets the "typical cycle length" when only one period is known. */
export function withTypicalLength(cycles: PastCycleRecord[], days: number): PastCycleRecord[] {
  if (cycles.length !== 1) return cycles;
  return [{ ...cycles[0], lengthDays: Math.min(45, Math.max(21, Math.round(days))) }];
}
