/**
 * Pure mapping between SheSync's on-device state and the Supabase tables in
 * supabase/migrations/20261109000000_shesync_backend.sql. No React Native or
 * network imports here, so it can be unit-tested in Node.
 */
import type {
  CareContact,
  FineTuningSettings,
  HealthCheckAnswers,
  PastCycleRecord,
  SleepLog,
  SymptomLog,
} from '@/types';

export type DocName = 'fitness' | 'study' | 'games';

export interface LocalProfile {
  userName: string;
  focusAreas: string[];
  isAssessmentCompleted: boolean;
  assessmentAnswers: Record<string, string>;
  fineTuningSettings: FineTuningSettings;
  healthCheck: HealthCheckAnswers;
  healthCheckCompleted: boolean;
  syncCompletedAt: string;
  rememberedCyclesCount: number;
}

/** Everything SheSync backs up for one user. */
export interface LocalSnapshot {
  profile: LocalProfile;
  cycles: PastCycleRecord[];
  logs: SymptomLog[];
  sleep: SleepLog[];
  contacts: CareContact[];
  docs: Record<DocName, Record<string, unknown>>;
}

// ─── Row types ──────────────────────────────────────────────
export interface ProfileRow {
  id: string;
  full_name: string | null;
  focus_areas: string[];
  is_assessment_completed: boolean;
  assessment_answers: Record<string, string>;
  fine_tuning: Partial<FineTuningSettings>;
  health_check: HealthCheckAnswers;
  health_check_completed: boolean;
  sync_completed_at: string | null;
  remembered_cycles_count: number;
}

export interface CycleRow {
  user_id: string;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  period_days: number | null;
}

export interface LogRow {
  user_id: string;
  id: string;
  log_date: string;
  logged_at: string;
  mood: number | null;
  energy: string | null;
  pain: number | null;
  flow: string | null;
  tags: string[] | null;
  pain_location: string[] | null;
  relief_methods: string[] | null;
  flow_color: string | null;
  notes: string | null;
  extra: Record<string, unknown> | null;
}

export interface SleepRow {
  user_id: string;
  log_date: string;
  hours: number;
}

export interface ContactRow {
  user_id: string;
  id: string;
  name: string;
  role: CareContact['role'];
  phone: string;
  note: string | null;
}

export interface DocRow {
  user_id: string;
  doc: DocName;
  data: Record<string, unknown>;
}

const orNull = <T>(v: T | undefined | null): T | null => (v === undefined ? null : v);
const clampInt = (n: number | undefined, lo: number, hi: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : null;

// ─── Local → rows ───────────────────────────────────────────
export function profileToRow(userId: string, p: LocalProfile): ProfileRow {
  return {
    id: userId,
    full_name: p.userName?.trim() || null,
    focus_areas: p.focusAreas ?? [],
    is_assessment_completed: !!p.isAssessmentCompleted,
    assessment_answers: p.assessmentAnswers ?? {},
    fine_tuning: p.fineTuningSettings ?? {},
    health_check: p.healthCheck ?? {},
    health_check_completed: !!p.healthCheckCompleted,
    sync_completed_at: p.syncCompletedAt || null,
    remembered_cycles_count: Math.max(0, Math.min(99, p.rememberedCyclesCount || 0)),
  };
}

export function cycleToRow(userId: string, c: PastCycleRecord): CycleRow {
  return {
    user_id: userId,
    start_date: c.startDate,
    end_date: c.endDate || null,
    cycle_length: clampInt(c.lengthDays, 10, 120),
    period_days: clampInt(c.periodDurationDays, 1, 20),
  };
}

const LOG_KNOWN = new Set([
  'id', 'date', 'timestamp', 'mood', 'energy', 'pain', 'flow', 'tags',
  'painLocation', 'reliefMethods', 'flowColor', 'notes',
]);

export function logToRow(userId: string, l: SymptomLog): LogRow {
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(l)) if (!LOG_KNOWN.has(k) && v !== undefined) extra[k] = v;
  return {
    user_id: userId,
    id: l.id,
    log_date: l.date,
    logged_at: l.timestamp || new Date().toISOString(),
    mood: orNull(l.mood),
    energy: orNull(l.energy),
    pain: orNull(l.pain),
    flow: orNull(l.flow),
    tags: l.tags?.length ? l.tags : null,
    pain_location: l.painLocation?.length ? l.painLocation : null,
    relief_methods: l.reliefMethods?.length ? l.reliefMethods : null,
    flow_color: orNull(l.flowColor),
    notes: l.notes ? l.notes.slice(0, 4000) : null,
    extra: Object.keys(extra).length ? extra : null,
  };
}

export const sleepToRow = (userId: string, s: SleepLog): SleepRow => ({ user_id: userId, log_date: s.date, hours: s.hours });

export const contactToRow = (userId: string, c: CareContact): ContactRow => ({
  user_id: userId,
  id: c.id,
  name: c.name.slice(0, 120),
  role: c.role,
  phone: c.phone.slice(0, 30),
  note: c.note ? c.note.slice(0, 500) : null,
});

// ─── Rows → local ───────────────────────────────────────────
export function rowToCycle(r: CycleRow): PastCycleRecord {
  return {
    id: `cycle-${r.start_date}`,
    cycleNumber: 0,
    startDate: r.start_date,
    endDate: r.end_date ?? undefined,
    daysAgo: 0,
    lengthDays: r.cycle_length ?? 28,
    periodDurationDays: r.period_days ?? 5,
  };
}

export function rowToLog(r: LogRow): SymptomLog {
  const log: SymptomLog = {
    ...(r.extra ?? {}),
    id: r.id,
    date: r.log_date,
    timestamp: r.logged_at,
  };
  if (r.mood != null) log.mood = r.mood as SymptomLog['mood'];
  if (r.energy != null) log.energy = r.energy;
  if (r.pain != null) log.pain = r.pain as SymptomLog['pain'];
  if (r.flow != null) log.flow = r.flow as SymptomLog['flow'];
  if (r.tags) log.tags = r.tags;
  if (r.pain_location) log.painLocation = r.pain_location;
  if (r.relief_methods) log.reliefMethods = r.relief_methods;
  if (r.flow_color != null) log.flowColor = r.flow_color;
  if (r.notes != null) log.notes = r.notes;
  return log;
}

export const rowToSleep = (r: SleepRow): SleepLog => ({ date: r.log_date, hours: Number(r.hours) });

export const rowToContact = (r: ContactRow): CareContact => ({
  id: r.id,
  name: r.name,
  role: r.role,
  phone: r.phone,
  note: r.note ?? undefined,
});

// ─── Merging (after sign-in on a device) ────────────────────
export interface RemoteData {
  profile: ProfileRow | null;
  cycles: CycleRow[];
  logs: LogRow[];
  sleep: SleepRow[];
  contacts: ContactRow[];
  docs: DocRow[];
}

/** True when a feature document holds nothing worth keeping. */
export function isEmptyDoc(doc: DocName, data: Record<string, unknown> | undefined): boolean {
  if (!data) return true;
  const len = (k: string) => (Array.isArray(data[k]) ? (data[k] as unknown[]).length : 0);
  if (doc === 'fitness') return !data.profile && len('sessions') === 0 && len('weights') === 0;
  if (doc === 'study') return len('sessions') === 0 && len('tasks') === 0 && len('wins') === 0;
  return len('records') === 0;
}

/**
 * Combines what is on this device with what the server has. Records are
 * merged by id/date (the device wins when both have the same record);
 * profile answers come from the server only where the device has none.
 */
export function mergeSnapshot(local: LocalSnapshot, remote: RemoteData): LocalSnapshot {
  const lp = local.profile;
  const rp = remote.profile;
  const profile: LocalProfile = { ...lp };
  if (rp) {
    if (!lp.userName && rp.full_name) profile.userName = rp.full_name;
    if (!lp.focusAreas?.length && rp.focus_areas?.length) profile.focusAreas = rp.focus_areas;
    if (!lp.isAssessmentCompleted && rp.is_assessment_completed) {
      profile.isAssessmentCompleted = true;
      profile.assessmentAnswers = rp.assessment_answers ?? {};
      profile.fineTuningSettings = { ...lp.fineTuningSettings, ...(rp.fine_tuning ?? {}) };
    }
    if (!lp.healthCheckCompleted && rp.health_check_completed) {
      profile.healthCheckCompleted = true;
      profile.healthCheck = rp.health_check ?? {};
    }
    if (!lp.syncCompletedAt && rp.sync_completed_at) profile.syncCompletedAt = rp.sync_completed_at;
    profile.rememberedCyclesCount = Math.max(lp.rememberedCyclesCount || 0, rp.remembered_cycles_count || 0);
  }

  const byStart = new Map(remote.cycles.map((r) => [r.start_date, rowToCycle(r)]));
  for (const c of local.cycles) byStart.set(c.startDate, c);

  const logs = new Map(remote.logs.map((r) => [r.id, rowToLog(r)]));
  for (const l of local.logs) logs.set(l.id, l);

  const sleep = new Map(remote.sleep.map((r) => [r.log_date, rowToSleep(r)]));
  for (const s of local.sleep) sleep.set(s.date, s);

  const contacts = new Map(remote.contacts.map((r) => [r.id, rowToContact(r)]));
  for (const c of local.contacts) contacts.set(c.id, c);

  const docs = { ...local.docs };
  for (const d of remote.docs) {
    if (isEmptyDoc(d.doc, docs[d.doc])) docs[d.doc] = d.data;
  }

  return {
    profile,
    cycles: [...byStart.values()].sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
    logs: [...logs.values()].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    sleep: [...sleep.values()].sort((a, b) => (a.date < b.date ? 1 : -1)),
    contacts: [...contacts.values()],
    docs,
  };
}

/** Small, fast string hash (FNV-1a) used to skip uploads that would change nothing. */
export function hashOf(value: unknown): string {
  const s = JSON.stringify(value) ?? '';
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + s.length.toString(36);
}
