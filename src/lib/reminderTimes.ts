// Pure helpers for Settings → Reminders (no notification APIs here, so they
// can be tested without a phone).

/** When the period heads-up should fire: 9 am two days before the predicted start (null if none or past). */
export function periodReminderAt(daysUntilNextPeriod: number | undefined, hasCycleData: boolean, now = new Date()): Date | null {
  if (!hasCycleData || daysUntilNextPeriod === undefined || daysUntilNextPeriod < 3) return null;
  const at = new Date(now);
  at.setDate(at.getDate() + daysUntilNextPeriod - 2);
  at.setHours(9, 0, 0, 0);
  return at.getTime() > now.getTime() + 60_000 ? at : null;
}

/** "8 pm" / "9 am" for the check-in time chips. */
export function hourLabel(hour: number): string {
  const h = ((hour + 11) % 12) + 1;
  return `${h} ${hour < 12 ? 'am' : 'pm'}`;
}

export const REMINDER_HOURS = [9, 13, 20, 22] as const;
