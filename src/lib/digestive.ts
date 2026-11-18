import type { DigestiveSymptom, PastCycleRecord, SymptomLog } from '@/types';
import { addDaysToKey, daysSinceKey } from '@/lib/dates';

/**
 * Tummy symptoms around periods — bloating, constipation, loose motions and
 * nausea. Prostaglandins and progesterone change gut movement, so these are
 * common in the days before and during a period (NHS, ACOG), and rarely
 * tracked. This file only counts what she logged; it never diagnoses.
 */
export const DIGESTIVE_SYMPTOMS: { id: DigestiveSymptom; label: string; emoji: string }[] = [
  { id: 'bloating', label: 'Bloating', emoji: '🎈' },
  { id: 'constipation', label: 'Constipation', emoji: '🧱' },
  { id: 'loose_motions', label: 'Loose motions', emoji: '💧' },
  { id: 'nausea', label: 'Nausea', emoji: '🤢' },
];

export const DIGESTIVE_LABEL: Record<DigestiveSymptom, string> = {
  bloating: 'bloating',
  constipation: 'constipation',
  loose_motions: 'loose motions',
  nausea: 'nausea',
};

const VALID = new Set<string>(DIGESTIVE_SYMPTOMS.map((d) => d.id));

/** Keeps only known symptom ids, without duplicates. */
export function cleanDigestive(list: unknown): DigestiveSymptom[] {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((x): x is DigestiveSymptom => typeof x === 'string' && VALID.has(x)))];
}

export interface DigestiveSummary {
  /** Days (within the window) with at least one tummy symptom. */
  days: number;
  /** Days per symptom. */
  bySymptom: Record<DigestiveSymptom, number>;
  /** Of `days`, how many fell in the 5 days before a period or during one. */
  nearPeriodDays: number;
  /** Bloating on most days of the last 3 weeks (NHS: see a GP). */
  persistentBloating: boolean;
  /** Most common symptoms, most frequent first. */
  top: DigestiveSymptom[];
}

const BLEEDING = new Set(['light', 'moderate', 'heavy', 'severe']);

/** Period days (saved periods and days she logged bleeding) and the 5 days before each saved period start. */
function periodWindowKeys(cycles: PastCycleRecord[], logs: SymptomLog[]): Set<string> {
  const keys = new Set<string>();
  for (const c of cycles) {
    if (!c.startDate) continue;
    const len = Math.max(1, Math.min(10, c.periodDurationDays || 5));
    for (let d = -5; d < len; d++) keys.add(addDaysToKey(c.startDate, d));
  }
  for (const l of logs) if (l.flow && BLEEDING.has(l.flow)) keys.add(l.date);
  return keys;
}

export function summariseDigestive(logs: SymptomLog[], cycles: PastCycleRecord[], windowDays = 30): DigestiveSummary {
  const byDay = new Map<string, Set<DigestiveSymptom>>();
  for (const l of logs) {
    const list = cleanDigestive(l.digestive);
    if (!list.length) continue;
    const age = daysSinceKey(l.date);
    if (age < 0 || age > windowDays) continue;
    const set = byDay.get(l.date) ?? new Set<DigestiveSymptom>();
    list.forEach((s) => set.add(s));
    byDay.set(l.date, set);
  }

  const bySymptom: Record<DigestiveSymptom, number> = { bloating: 0, constipation: 0, loose_motions: 0, nausea: 0 };
  byDay.forEach((set) => set.forEach((s) => (bySymptom[s] += 1)));

  const near = periodWindowKeys(cycles, logs);
  let nearPeriodDays = 0;
  byDay.forEach((_set, key) => {
    if (near.has(key)) nearPeriodDays += 1;
  });

  let bloatingLast21 = 0;
  byDay.forEach((set, key) => {
    if (set.has('bloating') && daysSinceKey(key) <= 20) bloatingLast21 += 1;
  });

  const top = (Object.keys(bySymptom) as DigestiveSymptom[])
    .filter((s) => bySymptom[s] > 0)
    .sort((a, b) => bySymptom[b] - bySymptom[a]);

  return { days: byDay.size, bySymptom, nearPeriodDays, persistentBloating: bloatingLast21 >= 12, top };
}

/** "bloating and nausea", "bloating, nausea and constipation" */
export function joinSymptoms(list: DigestiveSymptom[]): string {
  const words = list.map((s) => DIGESTIVE_LABEL[s]);
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
