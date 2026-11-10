/**
 * Export and import of her data. Pure logic (no React Native imports) so it
 * can be tested in Node; file picking and saving live in ./files.ts.
 *
 * Export:  full backup (JSON), daily logs (CSV), periods (CSV).
 * Import:  a SheSync backup, or another tracker's export (Flo, Clue, or any
 *          JSON/CSV). Other apps do not publish a fixed file layout and change
 *          it between versions, so the reader looks for period dates by
 *          meaning (start/end dates, or days marked as period) instead of
 *          relying on one exact structure, and the screen shows what was
 *          found before anything is saved.
 */
import type { FlowIntensity, PastCycleRecord, SymptomLog } from '@/types';
import { DOC_NAMES, isEmptyDoc, type LocalSnapshot } from '@/lib/sync/mappers';

export const BACKUP_FORMAT = 1;

export interface BackupFile {
  app: 'SheSync';
  formatVersion: number;
  exportedAt: string;
  data: LocalSnapshot;
}

export type ImportSource = 'shesync' | 'flo' | 'clue' | 'other';

export interface ImportedPeriod {
  start: string; // YYYY-MM-DD
  end?: string;
}

export interface ImportedDay {
  date: string;
  flow?: FlowIntensity;
}

export interface ImportResult {
  source: ImportSource;
  /** Present only for a SheSync backup. */
  backup?: LocalSnapshot;
  periods: ImportedPeriod[]; // newest first
  days: ImportedDay[];
  notes: string[];
}

// ─── Export ─────────────────────────────────────────────────
export function buildBackup(data: LocalSnapshot, now = new Date()): BackupFile {
  return { app: 'SheSync', formatVersion: BACKUP_FORMAT, exportedAt: now.toISOString(), data };
}

const csvCell = (v: unknown): string => {
  if (v === undefined || v === null) return '';
  let s = Array.isArray(v) ? v.join('; ') : String(v);
  // Stop spreadsheets from running a cell that starts like a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

export function logsToCsv(logs: SymptomLog[]): string {
  const head = ['date', 'time', 'mood (1-5)', 'energy', 'pain (0-10)', 'pain location', 'what helped', 'flow', 'flow colour', 'feelings', 'notes'];
  const rows = [...logs]
    .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
    .map((l) => [l.date, (l.timestamp || '').slice(11, 16), l.mood, l.energy, l.pain, l.painLocation, l.reliefMethods, l.flow, l.flowColor, l.tags, l.notes ?? l.transcript]);
  return csv([head, ...rows]);
}

export function periodsToCsv(cycles: PastCycleRecord[]): string {
  const head = ['period start', 'period end', 'period days', 'cycle length (days)'];
  const rows = [...cycles]
    .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
    .map((c) => [c.startDate, c.endDate, c.periodDurationDays, c.lengthDays]);
  return csv([head, ...rows]);
}

// ─── Dates ──────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const toMs = (k: string) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
const dayDiff = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / 86400000);
const addDays = (k: string, n: number) => new Date(toMs(k) + n * 86400000).toISOString().slice(0, 10);

function validDate(y: number, m: number, d: number, nowYear: number): string | null {
  if (y < 1990 || y > nowYear + 1 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 ? key(y, m, d) : null;
}

/** Reads the common date shapes found in tracker exports. Returns YYYY-MM-DD or null. */
export function readDate(value: unknown, nowYear = new Date().getFullYear()): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Epoch seconds or milliseconds.
    const ms = value > 1e11 ? value : value > 1e8 ? value * 1000 : NaN;
    if (Number.isNaN(ms)) return null;
    const d = new Date(ms);
    return validDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), nowYear);
  }
  if (typeof value !== 'string') return null;
  const s = value.trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:$|[T\s])/);
  if (m) return validDate(+m[1], +m[2], +m[3], nowYear);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:$|[T\s,])/);
  if (m) {
    // Day first (India, UK, Europe) unless that is impossible.
    const a = +m[1];
    const b = +m[2];
    return b > 12 && a <= 12 ? validDate(+m[3], a, b, nowYear) : validDate(+m[3], b, a, nowYear);
  }
  if (/^\d{10,13}$/.test(s)) return readDate(Number(s), nowYear);
  return null;
}

// ─── Finding period data in someone else's file ─────────────
const START_KEY = /^(?:period_?)?start(?:_?date|_?day)?$|period.*start|cycle.*start|first_?day|^lmp$|^from$/i;
const END_KEY = /^(?:period_?)?end(?:_?date|_?day)?$|period.*end|last_?day|^to$/i;
const DAY_KEY = /^(?:date|day|timestamp|time|logged_?at|created_?at|recorded_?at)$/i;
const PERIODISH = /period|menstru|bleed|flow/i;
const NOT_PERIOD = /^(?:none|no|false|0|spotting|excluded)$/i;

function flowOf(text: string): FlowIntensity | undefined {
  const t = text.toLowerCase();
  if (/spot/.test(t)) return 'spotting';
  if (/very.?heavy|severe|flood/.test(t)) return 'severe';
  if (/heavy|high/.test(t)) return 'heavy';
  if (/medium|moderate|normal/.test(t)) return 'moderate';
  if (/light|low/.test(t)) return 'light';
  return undefined;
}

interface Found {
  ranges: ImportedPeriod[];
  days: Map<string, FlowIntensity | undefined>;
}

/** One record (a JSON object or a CSV row): is it a period range, or a day of bleeding? */
function readRecord(rec: Record<string, unknown>, found: Found, nowYear: number) {
  const keys = Object.keys(rec);

  // 1) A range: { period_start_date, period_end_date } and friends.
  const startKey = keys.find((k) => START_KEY.test(k) && readDate(rec[k], nowYear));
  if (startKey) {
    const start = readDate(rec[startKey], nowYear)!;
    const endKey = keys.find((k) => END_KEY.test(k) && readDate(rec[k], nowYear));
    const end = endKey ? readDate(rec[endKey], nowYear)! : undefined;
    // "start"/"from" alone are too generic unless the record is about periods.
    const generic = /^(?:start(?:_?date)?|from)$/i.test(startKey);
    const about = keys.some((k) => PERIODISH.test(k)) || Object.values(rec).some((v) => typeof v === 'string' && PERIODISH.test(v));
    if (!generic || about || (endKey && end && dayDiff(start, end) >= 0 && dayDiff(start, end) <= 14)) {
      found.ranges.push({ start, end: end && dayDiff(start, end) >= 0 && dayDiff(start, end) <= 14 ? end : undefined });
      return;
    }
  }

  // 2) A day entry.
  const dayKey = keys.find((k) => DAY_KEY.test(k) && readDate(rec[k], nowYear));
  if (!dayKey) return;
  const date = readDate(rec[dayKey], nowYear)!;

  // { type: "period", value: { option: "heavy" } }  /  { category: "period", value: "medium" }
  const typeKey = keys.find((k) => /^(?:type|category|kind|name|measurement|event)$/i.test(k) && typeof rec[k] === 'string');
  if (typeKey) {
    const type = String(rec[typeKey]);
    if (!/period|menstru|bleed|flow/i.test(type) || /spotting|predict|forecast/i.test(type)) return;
    const raw = rec.value ?? rec.option ?? rec.data ?? rec.intensity ?? rec.level;
    const text = typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : String(raw ?? '');
    if (NOT_PERIOD.test(text.replace(/[{}"]|option:?/gi, '').trim())) return;
    const flow = flowOf(text);
    if (flow === 'spotting') return;
    found.days.set(date, flow ?? found.days.get(date));
    return;
  }

  // { day: "...", period: "heavy" }  /  { date, flow: "light" }  /  { date, menstruation: true }
  const flowKey = keys.find((k) => /^(?:period|flow|bleeding|menstruation|menstrual_?flow|period_?flow)$/i.test(k));
  if (flowKey) {
    const v = rec[flowKey];
    if (v === true) found.days.set(date, found.days.get(date));
    else if (typeof v === 'string' && v && !NOT_PERIOD.test(v.trim())) {
      const flow = flowOf(v);
      if (flow !== 'spotting') found.days.set(date, flow ?? found.days.get(date));
    } else if (typeof v === 'number' && v > 0) found.days.set(date, v >= 3 ? 'heavy' : v === 2 ? 'moderate' : 'light');
  }
}

function walk(node: unknown, found: Found, nowYear: number, depth = 0) {
  if (depth > 12 || node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, found, nowYear, depth + 1);
    return;
  }
  const rec = node as Record<string, unknown>;
  readRecord(rec, found, nowYear);
  for (const [k, v] of Object.entries(rec)) {
    if (v === null || typeof v !== 'object') continue;
    // Skip forecasts: only what actually happened is imported.
    if (/predict|forecast|estimate|expected/i.test(k)) continue;
    // { "2024-03-01": { period: "heavy" } } — a map keyed by date.
    const dateKey = readDate(k, nowYear);
    if (dateKey && !Array.isArray(v)) readRecord({ date: dateKey, ...(v as object) }, found, nowYear);
    walk(v, found, nowYear, depth + 1);
  }
}

/** Minimal CSV reader (quoted cells, commas or semicolons). */
export function parseCsv(text: string): string[][] {
  const first = text.split(/\r?\n/, 1)[0] ?? '';
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : first.includes('\t') && !first.includes(',') ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

/** Days marked as period -> periods (a gap of up to one unmarked day stays in the same period). */
function daysToPeriods(days: string[]): ImportedPeriod[] {
  const sorted = [...new Set(days)].sort();
  const out: ImportedPeriod[] = [];
  for (const d of sorted) {
    const last = out[out.length - 1];
    if (last && dayDiff(last.end ?? last.start, d) <= 2 && dayDiff(last.start, d) <= 14) last.end = d;
    else out.push({ start: d }); // a single marked day: let the usual period length apply
  }
  return out;
}

function tidyPeriods(list: ImportedPeriod[], today: string): ImportedPeriod[] {
  const byStart = new Map<string, ImportedPeriod>();
  for (const p of list) {
    if (p.start > today) continue; // predictions are not history
    const had = byStart.get(p.start);
    if (!had || (!had.end && p.end)) byStart.set(p.start, p);
  }
  // Two "periods" starting within 10 days of each other are one period logged twice.
  const sorted = [...byStart.values()].sort((a, b) => (a.start < b.start ? -1 : 1));
  const out: ImportedPeriod[] = [];
  for (const p of sorted) {
    const last = out[out.length - 1];
    if (last && dayDiff(last.start, p.start) < 10) {
      if (p.end && (!last.end || p.end > last.end) && dayDiff(last.start, p.end) <= 14) last.end = p.end;
    } else out.push({ ...p });
  }
  return out.reverse().slice(0, 240);
}

function looksLikeBackup(x: unknown): x is BackupFile {
  const b = x as BackupFile | null;
  return !!b && typeof b === 'object' && b.app === 'SheSync' && !!b.data && Array.isArray(b.data.cycles) && Array.isArray(b.data.logs);
}

/** Reads the text of a picked file and works out what it contains. */
export function parseImport(text: string, fileName = '', now = new Date()): ImportResult {
  const notes: string[] = [];
  const nowYear = now.getFullYear();
  const today = now.toISOString().slice(0, 10);
  const clean = text.replace(/^﻿/, '').trim();
  if (!clean) return { source: 'other', periods: [], days: [], notes: ['The file is empty.'] };
  if (clean.startsWith('PK')) {
    return { source: 'other', periods: [], days: [], notes: ['This is a ZIP file. Open (unzip) it first, then choose the .json or .csv file inside.'] };
  }

  const found: Found = { ranges: [], days: new Map() };
  let json: unknown;
  let isJson = false;
  if (clean[0] === '{' || clean[0] === '[') {
    try {
      json = JSON.parse(clean);
      isJson = true;
    } catch {
      notes.push('The file looks like JSON but could not be read fully. It may be incomplete.');
    }
  }

  if (isJson && looksLikeBackup(json)) {
    if (json.formatVersion > BACKUP_FORMAT) notes.push('This backup was made by a newer SheSync. Update the app if something is missing.');
    return { source: 'shesync', backup: json.data, periods: [], days: [], notes };
  }

  if (isJson) walk(json, found, nowYear);
  else {
    const rows = parseCsv(clean);
    if (rows.length >= 2) {
      const head = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
      for (const r of rows.slice(1)) {
        const rec: Record<string, unknown> = {};
        head.forEach((h, i) => { if (h && r[i] !== undefined && r[i].trim() !== '') rec[h] = r[i].trim(); });
        readRecord(rec, found, nowYear);
      }
    }
  }

  const lower = `${fileName} ${clean.slice(0, 4000)}`.toLowerCase();
  const source: ImportSource = /clue|"measurements"|"type"\s*:\s*"period"/.test(lower)
    ? 'clue'
    : /flo|operationaldata|period_start_date/.test(lower)
      ? 'flo'
      : 'other';

  const fromDays = daysToPeriods([...found.days.keys()].filter((d) => d <= today));
  const periods = tidyPeriods([...found.ranges, ...fromDays], today);
  const days = [...found.days.entries()]
    .filter(([d, flow]) => d <= today && !!flow)
    .map(([date, flow]) => ({ date, flow }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 1500);

  if (!periods.length) notes.push('No period dates were found in this file. Try the .json or .csv file from the export, or add your dates in "Period".');
  return { source, periods, days, notes };
}

// ─── Turning what was found into SheSync data ───────────────
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : 0;
};

/** Imported periods -> SheSync cycle records (cycle length = days until the next period). */
export function periodsToCycles(periods: ImportedPeriod[]): PastCycleRecord[] {
  const asc = [...periods].sort((a, b) => (a.start < b.start ? -1 : 1));
  const gaps = asc.slice(1).map((p, i) => dayDiff(asc[i].start, p.start)).filter((g) => g >= 15 && g <= 90);
  const usual = Math.min(45, Math.max(21, median(gaps) || 28));
  const lengths = asc.map((p) => (p.end ? dayDiff(p.start, p.end) + 1 : 0)).filter((n) => n >= 1 && n <= 14);
  const usualDays = Math.min(10, Math.max(2, median(lengths) || 5));
  return asc
    .map((p, i) => {
      const next = asc[i + 1];
      const gap = next ? dayDiff(p.start, next.start) : usual;
      const days = p.end ? Math.min(14, Math.max(1, dayDiff(p.start, p.end) + 1)) : usualDays;
      return {
        id: `cycle-${p.start}`,
        cycleNumber: 0,
        startDate: p.start,
        endDate: p.end ?? addDays(p.start, days - 1),
        daysAgo: 0,
        // A very long gap is usually missing logs, not one 200-day cycle.
        lengthDays: gap >= 15 && gap <= 120 ? gap : usual,
        periodDurationDays: days,
      };
    })
    .reverse();
}

export function daysToLogs(days: ImportedDay[], source: ImportSource): SymptomLog[] {
  return days
    .filter((d) => !!d.flow)
    .map((d) => ({
      id: `import-${source}-${d.date}`,
      date: d.date,
      timestamp: `${d.date}T12:00:00.000Z`,
      flow: d.flow,
      tags: [`Imported from ${source === 'flo' ? 'Flo' : source === 'clue' ? 'Clue' : 'another app'}`],
    }));
}

/**
 * Adds imported data to what is already on the phone. Nothing she already
 * has is replaced: periods are matched by start date, logs by id.
 */
export function mergeImport(local: LocalSnapshot, incoming: Partial<LocalSnapshot>): LocalSnapshot {
  const cycles = new Map((incoming.cycles ?? []).map((c) => [c.startDate, c]));
  for (const c of local.cycles) cycles.set(c.startDate, c);
  // Drop an imported period that falls inside one she already has (±3 days).
  const mine = local.cycles.map((c) => c.startDate);
  for (const k of [...cycles.keys()]) {
    if (!mine.includes(k) && mine.some((m) => Math.abs(dayDiff(m, k)) <= 3)) cycles.delete(k);
  }

  const logs = new Map((incoming.logs ?? []).map((l) => [l.id, l]));
  for (const l of local.logs) logs.set(l.id, l);
  const sleep = new Map((incoming.sleep ?? []).map((s) => [s.date, s]));
  for (const s of local.sleep) sleep.set(s.date, s);
  const contacts = new Map((incoming.contacts ?? []).map((c) => [c.id, c]));
  for (const c of local.contacts) contacts.set(c.id, c);

  const docs = { ...local.docs };
  for (const name of DOC_NAMES) {
    const theirs = incoming.docs?.[name];
    if (theirs && isEmptyDoc(name, docs[name]) && !isEmptyDoc(name, theirs)) docs[name] = theirs;
  }

  const lp = local.profile;
  const ip = incoming.profile;
  const profile = { ...lp };
  if (ip) {
    if (!lp.focusAreas?.length && ip.focusAreas?.length) profile.focusAreas = ip.focusAreas;
    if (!lp.isAssessmentCompleted && ip.isAssessmentCompleted) {
      profile.isAssessmentCompleted = true;
      profile.assessmentAnswers = ip.assessmentAnswers ?? {};
      profile.fineTuningSettings = { ...lp.fineTuningSettings, ...(ip.fineTuningSettings ?? {}) };
    }
    if (!lp.healthCheckCompleted && ip.healthCheckCompleted) {
      profile.healthCheckCompleted = true;
      profile.healthCheck = ip.healthCheck ?? {};
    }
    if (!lp.syncCompletedAt && ip.syncCompletedAt) profile.syncCompletedAt = ip.syncCompletedAt;
  }
  const allCycles = [...cycles.values()].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  profile.rememberedCyclesCount = Math.max(lp.rememberedCyclesCount || 0, Math.min(99, allCycles.length));

  return {
    profile,
    cycles: allCycles,
    logs: [...logs.values()].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    sleep: [...sleep.values()].sort((a, b) => (a.date < b.date ? 1 : -1)),
    contacts: [...contacts.values()],
    docs,
  };
}

/** Counts shown on the confirmation card before importing. */
export function describeImport(local: LocalSnapshot, result: ImportResult) {
  const incoming: Partial<LocalSnapshot> = result.backup ?? {
    cycles: periodsToCycles(result.periods),
    logs: daysToLogs(result.days, result.source),
  };
  const merged = mergeImport(local, incoming);
  const range = (result.backup ? result.backup.cycles.map((c) => c.startDate) : result.periods.map((p) => p.start)).sort();
  return {
    incoming,
    merged,
    newPeriods: merged.cycles.length - local.cycles.length,
    newLogs: merged.logs.length - local.logs.length,
    foundPeriods: result.backup ? result.backup.cycles.length : result.periods.length,
    from: range[0],
    to: range[range.length - 1],
  };
}
