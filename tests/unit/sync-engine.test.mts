import assert from 'node:assert/strict';
import { createSyncEngine, type SyncClient, type SyncState } from '@/lib/sync/engine';
import {
  logToRow,
  rowToLog,
  type LocalSnapshot,
} from '@/lib/sync/mappers';

// ─── in-memory "Supabase" ─────────────────────────────────
type Row = Record<string, any>;
class MemServer implements SyncClient {
  tables: Record<string, Row[]> = {};
  uid: string | null = 'u1';
  offline = false;
  calls: string[] = [];
  async getUserId() { return this.uid; }
  private net() { if (this.offline) throw new Error('Network request failed'); }
  async upsert(table: string, rows: object[], onConflict: string) {
    this.net();
    this.calls.push(`upsert:${table}:${rows.length}`);
    const keys = onConflict.split(',');
    const t = (this.tables[table] ??= []);
    for (const r of rows as Row[]) {
      const i = t.findIndex((x) => keys.every((k) => x[k] === r[k]));
      if (i >= 0) t[i] = { ...t[i], ...r }; else t.push({ ...r });
    }
  }
  async deleteMissing(table: string, userId: string, key: string, keep: string[]) {
    this.net();
    this.calls.push(`delete:${table}:${keep.length}`);
    this.tables[table] = (this.tables[table] ?? []).filter((r) => r.user_id !== userId || keep.includes(r[key]));
  }
  async selectAll<T>(table: string, col: string, uid: string) {
    this.net();
    this.calls.push(`select:${table}`);
    return (this.tables[table] ?? []).filter((r) => r[col] === uid) as T[];
  }
}
class MemStorage {
  m = new Map<string, string>();
  async getItem(k: string) { return this.m.get(k) ?? null; }
  async setItem(k: string, v: string) { this.m.set(k, v); }
}

const emptyLocal = (): LocalSnapshot => ({
  profile: {
    userName: '', focusAreas: [], isAssessmentCompleted: false, assessmentAnswers: {},
    fineTuningSettings: { archetypeId: 'x', archetypeName: 'X', archetypeTagline: '', archetypeDescription: '',
      strainSensitivity: 'balanced', preferredTherapy: 'somatic', autoCortisolOverride: true, pmddEarlyShield: false,
      dailySleepTargetHours: 8, primaryCondition: '' },
    healthCheck: {}, healthCheckCompleted: false, syncCompletedAt: '', rememberedCyclesCount: 0,
  },
  cycles: [], logs: [], sleep: [], contacts: [],
  docs: { fitness: { weights: [], sessions: [] }, study: { sessions: [], tasks: [], wins: [] }, games: { records: [] } },
});

function setup(local: LocalSnapshot, server = new MemServer()) {
  let state = local;
  const statuses: SyncState[] = [];
  const storage = new MemStorage();
  const engine = createSyncEngine({
    client: server,
    storage,
    getLocal: () => state,
    applyLocal: (s) => { state = s; },
    isCloudAccount: () => true,
    onStatus: (s) => statuses.push(s),
    debounceMs: 10,
  });
  return { engine, server, storage, statuses, get: () => state, set: (s: LocalSnapshot) => { state = s; } };
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log('  ✓', name);
}

// ─── tests ────────────────────────────────────────────────
await test('mapper round-trip keeps every log field (incl. voice journal extras)', async () => {
  const log = { id: 'log-1', date: '2026-11-09', timestamp: '2026-11-09T08:00:00.000Z', mood: 4 as const, energy: 'low',
    pain: 6 as const, flow: 'heavy' as const, tags: ['cramps'], painLocation: ['lower back'], reliefMethods: ['heat'],
    flowColor: 'bright red', notes: 'rough day', productsUsed: { pads: 3 }, voiceJournal: true, transcript: 'hi', audioDuration: '0:12' };
  assert.deepEqual(rowToLog(logToRow('u1', log)), log);
});

await test('first sync: uploads everything once, then nothing when unchanged', async () => {
  const l = emptyLocal();
  l.profile.userName = 'Ananya';
  l.cycles = [{ id: 'c1', cycleNumber: 1, startDate: '2026-10-26', endDate: '2026-10-31', daysAgo: 14, lengthDays: 28, periodDurationDays: 5 }];
  l.logs = [{ id: 'log-1', date: '2026-11-09', timestamp: '2026-11-09T08:00:00Z', pain: 4 }];
  l.contacts = [{ id: 'care-1', name: 'Dr Mehta', role: 'gynaecologist', phone: '999' }];
  const t = setup(l);
  assert.equal(await t.engine.flush(), true);
  assert.equal(t.server.tables.profiles[0].full_name, 'Ananya');
  assert.equal(t.server.tables.cycles.length, 1);
  assert.equal(t.server.tables.symptom_logs.length, 1);
  assert.equal(t.server.tables.care_contacts.length, 1);
  assert.equal(t.server.tables.app_documents.length, 5); // fitness, study, games, pcos, confidence
  t.server.calls = [];
  await t.engine.flush();
  assert.deepEqual(t.server.calls.filter((c) => !c.startsWith('select')), [], 'no uploads when nothing changed');
});

await test('a new log uploads just that log', async () => {
  const t = setup(emptyLocal());
  await t.engine.flush();
  t.server.calls = [];
  const s = t.get();
  t.set({ ...s, logs: [{ id: 'log-2', date: '2026-11-09', timestamp: '2026-11-09T09:00:00Z', mood: 3 }, ...s.logs] });
  await t.engine.flush();
  assert.deepEqual(t.server.calls, ['upsert:symptom_logs:1']);
});

await test('NEW PHONE: fresh device restores her data and never wipes the server', async () => {
  // Her data already in the cloud from her old phone.
  const old = setup((() => {
    const l = emptyLocal();
    l.profile.userName = 'Ananya'; l.profile.isAssessmentCompleted = true; l.profile.assessmentAnswers = { q1: 'a' };
    l.profile.healthCheckCompleted = true; l.profile.healthCheck = { hc_soak: false }; l.profile.syncCompletedAt = '2026-11-01T00:00:00Z';
    l.profile.rememberedCyclesCount = 2;
    l.cycles = [{ id: 'c1', cycleNumber: 1, startDate: '2026-10-26', daysAgo: 0, lengthDays: 28, periodDurationDays: 5 },
                { id: 'c2', cycleNumber: 2, startDate: '2026-09-28', daysAgo: 0, lengthDays: 29, periodDurationDays: 4 }];
    l.logs = [{ id: 'log-1', date: '2026-11-01', timestamp: '2026-11-01T08:00:00Z', pain: 7, productsUsed: { pads: 2 } }];
    l.contacts = [{ id: 'care-1', name: 'Dr Mehta', role: 'gynaecologist', phone: '999' }];
    l.docs.games = { records: [{ id: 'g1', game: 'memory' }], best: {} };
    return l;
  })());
  await old.engine.flush();

  // New phone: empty local state; an upload is triggered BEFORE any explicit pull.
  const phone = setup(emptyLocal(), old.server);
  phone.engine.schedule();
  await sleep(30);
  await phone.engine.flush();
  const s = phone.get();
  assert.equal(old.server.tables.cycles.length, 2, 'server cycles untouched');
  assert.equal(old.server.tables.care_contacts.length, 1, 'server contacts untouched');
  assert.equal(s.profile.isAssessmentCompleted, true);
  assert.equal(s.profile.syncCompletedAt, '2026-11-01T00:00:00Z');
  assert.equal(s.profile.rememberedCyclesCount, 2);
  assert.equal(s.cycles.length, 2);
  assert.equal(s.logs[0].productsUsed?.pads, 2);
  assert.equal(s.contacts[0].name, 'Dr Mehta');
  assert.equal((s.docs.games.records as unknown[]).length, 1);
});

await test('offline: reports error and uploads nothing; works once back online', async () => {
  const l = emptyLocal();
  l.logs = [{ id: 'log-9', date: '2026-11-09', timestamp: '2026-11-09T08:00:00Z' }];
  const t = setup(l);
  t.server.offline = true;
  assert.equal(await t.engine.flush(), false);
  assert.equal(t.statuses.at(-1), 'error');
  assert.equal(t.server.tables.symptom_logs, undefined);
  t.server.offline = false;
  assert.equal(await t.engine.flush(), true);
  assert.equal(t.statuses.at(-1), 'idle');
  assert.equal(t.server.tables.symptom_logs.length, 1);
});

await test('removing a care contact or a cycle removes it from the server', async () => {
  const l = emptyLocal();
  l.contacts = [{ id: 'a', name: 'A', role: 'counsellor', phone: '1' }, { id: 'b', name: 'B', role: 'other', phone: '2' }];
  l.cycles = [{ id: 'c1', cycleNumber: 1, startDate: '2026-10-26', daysAgo: 0, lengthDays: 28, periodDurationDays: 5 },
              { id: 'c2', cycleNumber: 2, startDate: '2026-09-28', daysAgo: 0, lengthDays: 28, periodDurationDays: 5 }];
  const t = setup(l);
  await t.engine.flush();
  t.set({ ...t.get(), contacts: t.get().contacts.filter((c) => c.id !== 'a'), cycles: t.get().cycles.slice(0, 1) });
  await t.engine.flush();
  assert.deepEqual(t.server.tables.care_contacts.map((c) => c.id), ['b']);
  assert.deepEqual(t.server.tables.cycles.map((c) => c.start_date), ['2026-10-26']);
});

await test('daysAgo-only changes (recomputed daily) do not re-upload cycles', async () => {
  const l = emptyLocal();
  l.cycles = [{ id: 'c1', cycleNumber: 1, startDate: '2026-10-26', daysAgo: 14, lengthDays: 28, periodDurationDays: 5 }];
  const t = setup(l);
  await t.engine.flush();
  t.server.calls = [];
  t.set({ ...t.get(), cycles: [{ ...t.get().cycles[0], daysAgo: 15 }] });
  await t.engine.flush();
  assert.deepEqual(t.server.calls, []);
});

await test('many quick changes are batched into one upload', async () => {
  const t = setup(emptyLocal());
  await t.engine.flush();
  t.server.calls = [];
  for (let i = 0; i < 20; i++) {
    t.set({ ...t.get(), logs: [{ id: `q${i}`, date: '2026-11-09', timestamp: `2026-11-09T08:00:${String(i).padStart(2, '0')}Z` }, ...t.get().logs] });
    t.engine.schedule();
  }
  await sleep(60);
  await t.engine.flush();
  assert.deepEqual(t.server.calls, ['upsert:symptom_logs:20']);
});

await test('no server session (email not confirmed) → "signin" state, nothing uploaded', async () => {
  const server = new MemServer();
  server.uid = null;
  const t = setup(emptyLocal(), server);
  assert.equal(await t.engine.flush(), false);
  assert.equal(t.statuses.at(-1), 'signin');
  assert.deepEqual(server.calls, []);
});

await test('switching accounts merges the new account before uploading', async () => {
  const server = new MemServer();
  const a = setup((() => { const l = emptyLocal(); l.cycles = [{ id: 'c', cycleNumber: 1, startDate: '2026-01-01', daysAgo: 0, lengthDays: 28, periodDurationDays: 5 }]; return l; })(), server);
  await a.engine.flush();
  // same engine, user signs out → local wiped → user u2 signs in
  a.engine.resetSession();
  a.set(emptyLocal());
  server.uid = 'u2';
  await a.engine.flush();
  server.uid = 'u1';
  a.engine.resetSession();
  await a.engine.flush(); // back to u1 with an empty device: must restore, not delete
  assert.equal(server.tables.cycles.filter((r) => r.user_id === 'u1').length, 1);
  assert.equal(a.get().cycles.length, 1);
});

console.log(`\n${passed} sync tests passed`);
