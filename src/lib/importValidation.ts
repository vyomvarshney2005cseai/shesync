/**
 * Checks a SheSync backup file before it is merged into the phone's data.
 *
 * A backup is a file anyone could have edited, so nothing in it is trusted:
 * only known fields with the expected type are kept, text is shortened to
 * the same limits the server uses, lists are capped, and anything else is
 * dropped. A record that cannot be read is skipped rather than failing the
 * whole import.
 */
import type { CareContact, PastCycleRecord, SleepLog, SymptomLog } from '@/types';
import { DOC_NAMES, type LocalSnapshot } from '@/lib/sync/mappers';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FLOWS = new Set(['none', 'spotting', 'light', 'moderate', 'heavy', 'severe']);
const ROLES = new Set(['gynaecologist', 'counsellor', 'other']);

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const isDate = (x: unknown): x is string => typeof x === 'string' && DATE.test(x) && !Number.isNaN(Date.parse(x));
/** "YYYY-MM-DD" from a date that may also carry a time ("2026-10-02T09:00:00Z"), else null. */
const dayOf = (x: unknown): string | null => {
  if (typeof x !== 'string') return null;
  const d = x.slice(0, 10);
  return isDate(d) && (x.length === 10 || x[10] === 'T') ? d : null;
};

function text(x: unknown, max: number): string | undefined {
  return typeof x === 'string' ? x.slice(0, max) : undefined;
}

function int(x: unknown, min: number, max: number): number | undefined {
  const n = typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : undefined;
}

function num(x: unknown, min: number, max: number): number | undefined {
  const n = typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
}

function strings(x: unknown, maxItems = 20, maxLen = 60): string[] | undefined {
  if (!Array.isArray(x)) return undefined;
  return x.filter((v): v is string => typeof v === 'string').slice(0, maxItems).map((v) => v.slice(0, maxLen));
}

/** Own keys only, never the special prototype keys. */
function entries(x: Record<string, unknown>, max = 200): [string, unknown][] {
  return Object.keys(x)
    .filter((k) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype')
    .slice(0, max)
    .map((k) => [k.slice(0, 80), x[k]]);
}

/** A flat object of text / number / yes-no values (settings, answers). */
function flat(x: unknown, maxLen = 300): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!isObj(x)) return out;
  for (const [k, v] of entries(x)) {
    if (typeof v === 'string') out[k] = v.slice(0, maxLen);
    else if (typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) out[k] = v;
  }
  return out;
}

/** Plain JSON data (as JSON.parse makes it), with the prototype keys removed and depth limited. */
function plain(x: unknown, depth = 0): unknown {
  if (depth > 8) return undefined;
  if (Array.isArray(x)) return x.slice(0, 2000).map((v) => plain(v, depth + 1));
  if (isObj(x)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries(x, 2000)) out[k] = plain(v, depth + 1);
    return out;
  }
  if (typeof x === 'string') return x.slice(0, 4000);
  if (typeof x === 'number') return Number.isFinite(x) ? x : undefined;
  return typeof x === 'boolean' || x === null ? x : undefined;
}

function cycle(x: unknown, i: number): PastCycleRecord | null {
  const start = isObj(x) ? dayOf(x.startDate) : null;
  if (!isObj(x) || !start) return null;
  return {
    id: text(x.id, 80) || `cycle-${start}`,
    cycleNumber: int(x.cycleNumber, 0, 999) ?? i + 1,
    startDate: start,
    endDate: dayOf(x.endDate) ?? undefined,
    daysAgo: int(x.daysAgo, 0, 100_000) ?? 0,
    lengthDays: int(x.lengthDays, 1, 365) ?? 28,
    periodDurationDays: int(x.periodDurationDays, 1, 31) ?? 5,
    ...(x.approximate === true ? { approximate: true } : {}),
  };
}

function log(x: unknown, keepDeviceFields = false): SymptomLog | null {
  const date = isObj(x) ? dayOf(x.date) : null;
  if (!isObj(x) || !date) return null;
  const id = text(x.id, 80);
  const timestamp = typeof x.timestamp === 'string' && !Number.isNaN(Date.parse(x.timestamp)) ? x.timestamp.slice(0, 40) : `${date}T12:00:00.000Z`;
  if (!id) return null;
  const out: SymptomLog = { id, date, timestamp };
  const mood = int(x.mood, 1, 5);
  if (mood !== undefined) out.mood = mood as SymptomLog['mood'];
  const pain = int(x.pain, 0, 10);
  if (pain !== undefined) out.pain = pain as SymptomLog['pain'];
  if (typeof x.flow === 'string' && FLOWS.has(x.flow)) out.flow = x.flow as SymptomLog['flow'];
  const energy = text(x.energy, 40);
  if (energy) out.energy = energy;
  const notes = text(x.notes, 4000);
  if (notes) out.notes = notes;
  const transcript = text(x.transcript, 4000);
  if (transcript) out.transcript = transcript;
  const flowColor = text(x.flowColor, 40);
  if (flowColor) out.flowColor = flowColor;
  const audioDuration = text(x.audioDuration, 20);
  if (audioDuration) out.audioDuration = audioDuration;
  for (const key of ['tags', 'painLocation', 'reliefMethods', 'digestive'] as const) {
    const list = strings(x[key]);
    if (list?.length) (out as unknown as Record<string, string[]>)[key] = list;
  }
  if (isObj(x.productsUsed)) {
    const used: Record<string, number> = {};
    for (const [k, v] of entries(x.productsUsed, 20)) {
      const n = int(v, 0, 99);
      if (n !== undefined) used[k.slice(0, 40)] = n;
    }
    out.productsUsed = used;
  }
  if (x.voiceJournal === true) out.voiceJournal = true;
  if (x.checkIn === true) out.checkIn = true;
  if (x.transcriptSource === 'speech' || x.transcriptSource === 'typed') out.transcriptSource = x.transcriptSource;
  // audioFile names a recording on the phone that made the data: kept only for
  // this phone's own saved data, never taken from a backup file.
  if (keepDeviceFields && typeof x.audioFile === 'string' && !/[\\/]/.test(x.audioFile)) out.audioFile = x.audioFile.slice(0, 120);
  return out;
}

function sleep(x: unknown): SleepLog | null {
  const date = isObj(x) ? dayOf(x.date) : null;
  if (!isObj(x) || !date) return null;
  const hours = num(x.hours, 0, 16);
  return hours === undefined ? null : { date, hours };
}

function contact(x: unknown): CareContact | null {
  if (!isObj(x)) return null;
  const name = text(x.name, 120)?.trim();
  const phone = text(x.phone, 30)?.trim();
  const id = text(x.id, 80);
  if (!name || !phone || !id) return null;
  const role = typeof x.role === 'string' && ROLES.has(x.role) ? (x.role as CareContact['role']) : 'other';
  const note = text(x.note, 500);
  return { id, name, role, phone, ...(note ? { note } : {}) };
}

function list<T>(x: unknown, max: number, read: (v: unknown, i: number) => T | null): T[] {
  if (!Array.isArray(x)) return [];
  const out: T[] = [];
  for (let i = 0; i < x.length && out.length < max; i++) {
    const v = read(x[i], i);
    if (v) out.push(v);
  }
  return out;
}

/** Returns only what SheSync can safely use from a backup file's `data`. */
export function sanitizeBackupData(data: unknown): LocalSnapshot {
  const d = isObj(data) ? data : {};
  const p = isObj(d.profile) ? d.profile : {};
  const fine = flat(p.fineTuningSettings);
  const sleepTarget = num(fine.dailySleepTargetHours, 4, 12);
  if (sleepTarget !== undefined) fine.dailySleepTargetHours = sleepTarget;
  else delete fine.dailySleepTargetHours;
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(flat(p.assessmentAnswers))) answers[k] = String(v);
  const health: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(flat(p.healthCheck))) if (typeof v === 'boolean') health[k] = v;

  const docsIn = isObj(d.docs) ? d.docs : {};
  const docs = {} as LocalSnapshot['docs'];
  for (const name of DOC_NAMES) {
    const doc = plain(docsIn[name]);
    docs[name] = isObj(doc) ? doc : {};
  }

  return {
    profile: {
      userName: text(p.userName, 120) ?? '',
      focusAreas: strings(p.focusAreas, 20, 60) ?? [],
      isAssessmentCompleted: p.isAssessmentCompleted === true,
      assessmentAnswers: answers,
      fineTuningSettings: fine as unknown as LocalSnapshot['profile']['fineTuningSettings'],
      healthCheck: health,
      healthCheckCompleted: p.healthCheckCompleted === true,
      syncCompletedAt: typeof p.syncCompletedAt === 'string' && !Number.isNaN(Date.parse(p.syncCompletedAt)) ? p.syncCompletedAt.slice(0, 40) : '',
      rememberedCyclesCount: int(p.rememberedCyclesCount, 0, 99) ?? 0,
    },
    cycles: list(d.cycles, 200, cycle),
    logs: list(d.logs, 1500, (v) => log(v)),
    sleep: list(d.sleep, 400, sleep),
    contacts: list(d.contacts, 30, contact),
    docs,
  };
}

/**
 * Repairs this phone's own saved data when it cannot be read as it is (for
 * example a record written by an old version): keeps every record that is
 * well-formed and drops the rest, so the app always opens. Recordings stay
 * linked to their journal entries.
 */
export function repairSavedRecords(s: { pastCycles?: unknown; symptomLogs?: unknown; sleepLogs?: unknown; careContacts?: unknown; focusAreas?: unknown; rememberedCyclesCount?: unknown }) {
  return {
    pastCycles: list(s.pastCycles, 200, cycle),
    symptomLogs: list(s.symptomLogs, 1500, (v) => log(v, true)),
    sleepLogs: list(s.sleepLogs, 400, sleep),
    careContacts: list(s.careContacts, 30, contact),
    focusAreas: strings(s.focusAreas, 20, 60) ?? [],
    rememberedCyclesCount: int(s.rememberedCyclesCount, 0, 99) ?? 0,
  };
}

/** True when saved records have a shape the app cannot use (then repairSavedRecords fixes them). */
export function hasMalformedRecords(s: { pastCycles?: unknown; symptomLogs?: unknown; sleepLogs?: unknown; careContacts?: unknown; focusAreas?: unknown }): boolean {
  const arr = (x: unknown) => x === undefined || Array.isArray(x);
  if (!arr(s.pastCycles) || !arr(s.symptomLogs) || !arr(s.sleepLogs) || !arr(s.careContacts)) return true;
  if (s.focusAreas !== undefined && !Array.isArray(s.focusAreas)) return true;
  const cycles = (s.pastCycles as unknown[] | undefined) ?? [];
  const logs = (s.symptomLogs as unknown[] | undefined) ?? [];
  const sleeps = (s.sleepLogs as unknown[] | undefined) ?? [];
  return (
    cycles.some((c) => !isObj(c) || !dayOf(c.startDate) || (c.endDate !== undefined && c.endDate !== null && !dayOf(c.endDate))) ||
    logs.some((l) => !isObj(l) || typeof l.id !== 'string' || !dayOf(l.date)) ||
    sleeps.some((x) => !isObj(x) || !dayOf(x.date) || typeof x.hours !== 'number' || !Number.isFinite(x.hours))
  );
}
