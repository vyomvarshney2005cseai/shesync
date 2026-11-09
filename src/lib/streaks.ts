import { addDaysToKey, todayKey } from '@/lib/dates';

/**
 * Consecutive days with activity, counting back from today (or from
 * yesterday if nothing has been logged yet today — the streak is still alive).
 */
export function dayStreak(dates: Iterable<string>): number {
  const set = new Set(dates);
  let day = todayKey();
  if (!set.has(day)) day = addDaysToKey(day, -1);
  let streak = 0;
  while (set.has(day)) {
    streak += 1;
    day = addDaysToKey(day, -1);
  }
  return streak;
}
