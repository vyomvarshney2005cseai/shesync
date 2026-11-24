// ============================================================
// Exam-cycle planner: which exams fall on predicted heavy-flow,
// period or PMS days, and a dated prep plan for each.
//
// Pure functions (no React, no stores) so they are easy to test.
// Predictions are estimates: the further ahead, the wider the margin.
// ============================================================
import type { CyclePrediction, PastCycleRecord, SymptomLog } from '@/types';
import { addDaysToKey, daysBetweenKeys, shortDateLabel } from '@/lib/dates';

export type ExamRisk = 'heavy' | 'period' | 'pms' | 'near' | 'clear' | 'unknown';

export interface CycleOutlook {
  /** Predicted period starts, oldest first (the last real one, then predictions). */
  starts: string[];
  cycleLength: number;
  periodLength: number;
  /** Period days (1-based) that are usually heavy for her. */
  heavyDays: number[];
  /** True when the heavy days come from her own flow logs. */
  heavyFromLogs: boolean;
  /** ± days of uncertainty for the next predicted period. */
  baseMargin: number;
  irregular: boolean;
}

export interface ExamForecast {
  risk: ExamRisk;
  /** Short label for the badge, e.g. "Heavy day (day 1 of period)". */
  label: string;
  /** One sentence on why. */
  detail: string;
  /** The period start this exam is measured against. */
  periodStart?: string;
  /** Day of her period (1-based) when risk is heavy/period. */
  periodDay?: number;
  /** ± days of uncertainty for this date. */
  margin: number;
}

export interface PlanStep {
  date: string; // YYYY-MM-DD ('' = no date, general tip)
  text: string;
}

const PMS_DAYS = 5;

/** Builds the forecast inputs from her saved cycles, prediction and flow logs. */
export function buildOutlook(input: {
  today: string;
  hasCycleData: boolean;
  pastCycles: PastCycleRecord[];
  prediction: Pick<CyclePrediction, 'daysUntilNextPeriod' | 'predictedCycleLength' | 'cycleVarianceDays' | 'regularityStatus'>;
  logs: SymptomLog[];
  horizonDays?: number;
}): CycleOutlook | null {
  const { today, pastCycles, prediction } = input;
  if (!input.hasCycleData || !pastCycles.length) return null;
  const cycleLength = clamp(Math.round(prediction.predictedCycleLength || 28), 21, 45);
  const durations = pastCycles.map((c) => c.periodDurationDays).filter((d) => d >= 2 && d <= 10);
  const periodLength = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 5;
  const lastStart = [...pastCycles].sort((a, b) => b.startDate.localeCompare(a.startDate))[0].startDate;
  const next = addDaysToKey(today, Math.max(0, Math.round(prediction.daysUntilNextPeriod)));

  const horizon = input.horizonDays ?? 240;
  const starts = [lastStart];
  // The engine's "next" already accounts for a late period; never put it before the last real start.
  let s = daysBetweenKeys(lastStart, next) >= 10 ? next : addDaysToKey(lastStart, cycleLength);
  while (daysBetweenKeys(today, s) <= horizon) {
    starts.push(s);
    s = addDaysToKey(s, cycleLength);
  }

  const { days: heavyDays, fromLogs } = heavyDaysFromLogs(input.logs, pastCycles);
  const irregular = prediction.regularityStatus === 'irregular_pcos';
  const variance = Math.max(0, Math.round(prediction.cycleVarianceDays ?? 0));
  const baseMargin = clamp(irregular ? Math.max(5, variance) : Math.max(2, variance), 2, 10);
  return { starts, cycleLength, periodLength, heavyDays, heavyFromLogs: fromLogs, baseMargin, irregular };
}

/**
 * Which period days were heavy for her. Needs heavy/severe flow logs from at
 * least two different periods; otherwise days 1–2 (the usual heaviest).
 */
export function heavyDaysFromLogs(logs: SymptomLog[], cycles: PastCycleRecord[]): { days: number[]; fromLogs: boolean } {
  const starts = cycles.map((c) => c.startDate).sort();
  const hits = new Map<number, Set<string>>();
  for (const l of logs) {
    if (l.flow !== 'heavy' && l.flow !== 'severe') continue;
    const start = [...starts].reverse().find((st) => st <= l.date);
    if (!start) continue;
    const day = daysBetweenKeys(start, l.date) + 1;
    if (day < 1 || day > 8) continue;
    if (!hits.has(day)) hits.set(day, new Set());
    hits.get(day)!.add(start);
  }
  const periodsWithHeavy = new Set(Array.from(hits.values()).flatMap((v) => Array.from(v)));
  if (periodsWithHeavy.size >= 2) {
    const days = Array.from(hits.entries())
      .filter(([, set]) => set.size >= 2 || set.size / periodsWithHeavy.size >= 0.5)
      .map(([d]) => d)
      .sort((a, b) => a - b);
    if (days.length) return { days, fromLogs: true };
  }
  return { days: [1, 2], fromLogs: false };
}

/** What her cycle is likely doing on an exam date. */
export function forecastExam(date: string, outlook: CycleOutlook | null, today: string): ExamForecast {
  if (!outlook) {
    return { risk: 'unknown', label: 'Add your period dates', detail: 'Save your last period so SheSync can check this date.', margin: 0 };
  }
  const { starts, periodLength, heavyDays, cycleLength } = outlook;
  // The period start at or before the exam, and the next one after it.
  let prev: string | undefined;
  let next: string | undefined;
  for (const s of starts) {
    if (s <= date) prev = s;
    else if (!next) next = s;
  }
  if (!next && prev) next = addDaysToKey(prev, cycleLength);
  const cyclesAhead = Math.max(0, starts.filter((s) => s > today && s <= (next ?? date)).length - 1);
  const margin = clamp(outlook.baseMargin + cyclesAhead, 2, 12);

  if (prev) {
    const day = daysBetweenKeys(prev, date) + 1;
    if (day >= 1 && day <= periodLength) {
      if (heavyDays.includes(day)) {
        return {
          risk: 'heavy',
          label: `Heavy day · day ${day} of period`,
          detail: `Your period is predicted to start ${shortDateLabel(prev)}${prev > today ? ` (±${margin} days)` : ''}, so this exam may land on one of your heavier days.`,
          periodStart: prev,
          periodDay: day,
          margin,
        };
      }
      return {
        risk: 'period',
        label: `Period · day ${day}`,
        detail: `Your period is predicted to start ${shortDateLabel(prev)}${prev > today ? ` (±${margin} days)` : ''}; by day ${day} flow is usually lighter.`,
        periodStart: prev,
        periodDay: day,
        margin,
      };
    }
  }
  if (next) {
    const before = daysBetweenKeys(date, next);
    if (before >= 1 && before <= PMS_DAYS) {
      return {
        risk: 'pms',
        label: `PMS days · ${before} day${before === 1 ? '' : 's'} before period`,
        detail: `Your next period is predicted for ${shortDateLabel(next)} (±${margin} days). The days just before it can bring low energy, cramps or mood dips.`,
        periodStart: next,
        margin,
      };
    }
    // Close enough that the margin could move a heavy day onto the exam.
    const toHeavy = Math.min(...heavyDays.map((d) => Math.abs(daysBetweenKeys(date, addDaysToKey(next as string, d - 1)))));
    if (toHeavy <= margin) {
      return {
        risk: 'near',
        label: 'Could overlap your period',
        detail: `Your period is predicted for ${shortDateLabel(next)}, but cycles can shift by ±${margin} days — worth being ready.`,
        periodStart: next,
        margin,
      };
    }
  }
  return {
    risk: 'clear',
    label: 'Clear of period & PMS',
    detail: 'Your cycle is unlikely to get in the way of this one.',
    margin,
  };
}

/** A dated prep plan for one exam. Dates in the past are dropped. */
export function prepPlan(examDate: string, f: ExamForecast, today: string): PlanStep[] {
  const steps: PlanStep[] = [];
  const add = (offset: number, text: string) => {
    const d = addDaysToKey(examDate, offset);
    if (d >= today) steps.push({ date: d, text });
  };
  /** Like add, but a step that is already due moves to today instead of being dropped. */
  const addSoon = (offset: number, text: string) => {
    const d = addDaysToKey(examDate, offset);
    if (examDate >= today) steps.push({ date: d >= today ? d : today, text });
  };
  const daysLeft = daysBetweenKeys(today, examDate);

  if (daysLeft >= 14) add(-14, 'Start revising: list every chapter and plan two focus blocks a day.');
  else if (daysLeft > 3) steps.push({ date: today, text: `${daysLeft} days to go: list the chapters left and plan two or three focus blocks a day.` });

  if (f.risk === 'heavy' || f.risk === 'period' || f.risk === 'near') {
    const start = f.periodStart as string;
    const finishBy = addDaysToKey(start, -2 - (f.risk === 'near' ? f.margin : 0));
    if (finishBy >= today && finishBy < examDate) {
      steps.push({ date: finishBy, text: 'Finish the hardest topics by today — your period may start in the next few days, when focus can dip.' });
    }
    add(-7, 'If pain or heavy bleeding usually stops you, see a gynaecologist now — there are safe ways to manage pain, and for an important exam a doctor can talk you through options to shift a period.');
    addSoon(-2, 'Pack an exam-day kit: extra pads or a fresh cup, spare underwear, the pain relief that has worked for you before, water and a snack. Dark, comfortable clothes help.');
    addSoon(-1, 'Ask the exam office or your teacher how restroom breaks work, and keep a heat pad ready for the night.');
    add(0, 'Eat a proper breakfast, take your usual pain relief early if your doctor said that is fine for you, and change just before the exam starts.');
  } else if (f.risk === 'pms') {
    const pmsStart = addDaysToKey(f.periodStart as string, -PMS_DAYS);
    if (pmsStart > today) steps.push({ date: addDaysToKey(pmsStart, -1), text: 'Get through the hardest topics before tomorrow — the next few days may feel slower.' });
    add(-3, 'Use the gentle 15/5 focus timer on low-energy days and revise topics you already know well.');
    addSoon(-1, 'Sleep 7–8 hours (no all-nighter), eat regular meals and go easy on caffeine — it can make cramps and anxiety worse.');
    add(0, 'Feeling low or irritable is common before a period and passes. A 2-minute breathing break before you go in helps.');
  } else if (f.risk === 'clear') {
    add(-1, 'Light review only and an early night — your cycle should not get in the way of this one.');
  } else {
    steps.push({ date: '', text: 'Save your last period (Home → Log period) to see whether this exam clashes with your cycle.' });
  }
  if (daysLeft >= 4) add(-3, 'Do one full timed mock paper and note what to fix.');
  if (f.risk !== 'clear' && daysLeft >= 1) add(-1, 'Light review only — pack your bag tonight and sleep early.');

  // One step per day (earliest first); the first wins when two land on the same day.
  const seen = new Set<string>();
  return steps
    .sort((a, b) => (a.date || '9').localeCompare(b.date || '9'))
    .filter((s) => {
      const key = s.date + s.text.slice(0, 12);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Predicted heavy / period / PMS days from `from` for `days` days (for calendar dots). */
export function dayMarks(outlook: CycleOutlook | null, from: string, days = 240): Record<string, 'heavy' | 'period' | 'pms'> {
  const out: Record<string, 'heavy' | 'period' | 'pms'> = {};
  if (!outlook) return out;
  const to = addDaysToKey(from, days);
  for (const start of outlook.starts) {
    for (let i = 1; i <= PMS_DAYS; i++) {
      const d = addDaysToKey(start, -i);
      if (d >= from && d <= to && !out[d]) out[d] = 'pms';
    }
    for (let day = 1; day <= outlook.periodLength; day++) {
      const d = addDaysToKey(start, day - 1);
      if (d >= from && d <= to) out[d] = outlook.heavyDays.includes(day) ? 'heavy' : 'period';
    }
  }
  return out;
}

export const RISK_ORDER: ExamRisk[] = ['heavy', 'period', 'pms', 'near', 'clear', 'unknown'];

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
