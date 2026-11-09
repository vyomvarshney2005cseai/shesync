import type { SymptomLog } from '@/types';
import { daysSinceKey } from '@/lib/dates';

/** Newest log carrying `field`, logged no more than `maxAgeDays` ago (0 = today). */
export function recentLog<K extends keyof SymptomLog>(
  logs: SymptomLog[],
  field: K,
  maxAgeDays: number
): SymptomLog | undefined {
  return logs.find((l) => {
    if (l[field] === undefined || l[field] === null) return false;
    const age = daysSinceKey(l.date);
    return age >= 0 && age <= maxAgeDays;
  });
}

/**
 * The signals that describe "today". Pain and mood count for two days,
 * flow only for today and yesterday — an old heavy-flow log must not keep
 * someone in her menstrual phase for weeks.
 */
export function recentSignals(logs: SymptomLog[]) {
  const painLog = recentLog(logs, 'pain', 2);
  const flowLog = recentLog(logs, 'flow', 1);
  const moodLog = recentLog(logs, 'mood', 2);
  return {
    painLog,
    flowLog,
    moodLog,
    pain: painLog?.pain ?? null,
    flow: flowLog?.flow ?? 'none',
    mood: moodLog?.mood ?? null,
    energy: moodLog?.energy ?? null,
    tags: moodLog?.tags ?? [],
  };
}
