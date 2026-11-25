// Backup: entries deleted on the phone are deleted on the server and never
// come back; edited entries are backed up; a wiped phone never deletes
// anything on the server. Runs the real sync engine against an in-memory
// "Supabase" whose bookkeeping survives app restarts, like the phone's storage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createSyncEngine, type Deleted, type SyncClient } from '@/lib/sync/engine';
import type { LocalSnapshot } from '@/lib/sync/mappers';
import { useAppStore } from '@/store/useAppStore';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;
const root = path.join(__dirname, '..', '..');
const tests: [string, () => void | Promise<void>][] = [];
const test = (name: string, f: () => void | Promise<void>) => tests.push([name, f]);

type Row = Record<string, any>;
class Server implements SyncClient {
  tables: Record<string, Row[]> = {};
  offline = false;
  calls: string[] = [];
  async getUserId() { return 'u1'; }
  private net(call: string) { if (this.offline) throw new Error('Network request failed'); this.calls.push(call); }
  async upsert(table: string, rows: object[], onConflict: string) {
    this.net(`upsert:${table}:${rows.length}`);
    const keys = onConflict.split(',');
    const t = (this.tables[table] ??= []);
    for (const r of rows as Row[]) {
      const i = t.findIndex((x) => keys.every((k) => x[k] === r[k]));
      if (i >= 0) t[i] = { ...t[i], ...r }; else t.push({ ...r });
    }
  }
  async deleteMissing(table: string, userId: string, key: string, keep: string[]) {
    this.net(`deleteMissing:${table}`);
    this.tables[table] = (this.tables[table] ?? []).filter((r) => r.user_id !== userId || keep.includes(r[key]));
  }
  async deleteRows(table: string, userId: string, key: string, keys: string[]) {
    this.net(`deleteRows:${table}:${keys.length}`);
    this.tables[table] = (this.tables[table] ?? []).filter((r) => r.user_id !== userId || !keys.includes(r[key]));
  }
  async selectAll<T>(table: string, col: string, uid: string) {
    this.net(`select:${table}`);
    return (this.tables[table] ?? []).filter((r) => r[col] === uid) as T[];
  }
  has(table: string, key: string, value: string) { return (this.tables[table] ?? []).some((r) => r[key] === value); }
}
class KV { m = new Map<string, string>(); async getItem(k: string) { return this.m.get(k) ?? null; } async setItem(k: string, v: string) { this.m.set(k, v); } }

const blank = (): LocalSnapshot => ({
  profile: { userName: 'A', focusAreas: [], isAssessmentCompleted: false, assessmentAnswers: {}, fineTuningSettings: {} as any, healthCheck: {}, healthCheckCompleted: false, syncCompletedAt: '', rememberedCyclesCount: 0 },
  cycles: [], logs: [], sleep: [], contacts: [],
  docs: { fitness: {}, study: {}, games: {}, pcos: {}, confidence: {} } as any,
});
const log = (id: string, ts: string, extra: Record<string, unknown> = {}) => ({ id, date: ts.slice(0, 10), timestamp: ts, ...extra }) as any;
const cycle = (start: string) => ({ id: `cycle-${start}`, cycleNumber: 1, startDate: start, endDate: start, daysAgo: 0, lengthDays: 28, periodDurationDays: 5 });

/** One phone: its data, its deletions and its saved bookkeeping; `launch()` = app start. */
function phone(server: Server) {
  const p = {
    local: blank(),
    deleted: { logs: [], cycles: [], contacts: [] } as Deleted,
    meta: new KV(),
    launch() {
      return createSyncEngine({
        client: server,
        storage: p.meta,
        getLocal: () => p.local,
        applyLocal: (m) => { p.local = m; },
        isCloudAccount: () => true,
        getDeleted: () => p.deleted,
        onDeletedSynced: (done) => {
          p.deleted = {
            logs: p.deleted.logs.filter((x) => !done.logs?.includes(x)),
            cycles: p.deleted.cycles.filter((x) => !done.cycles?.includes(x)),
            contacts: p.deleted.contacts.filter((x) => !done.contacts?.includes(x)),
          };
        },
        debounceMs: 0,
      });
    },
  };
  return p;
}

test('a deleted entry is deleted on the server and does not come back after a restart', async () => {
  const server = new Server();
  const ph = phone(server);
  ph.local.logs = [log('keep', '2026-11-20T08:00:00.000Z', { pain: 2 }), log('journal', '2026-11-21T08:00:00.000Z', { notes: 'private' })];
  let app = ph.launch();
  await app.flush();
  assert.ok(server.has('symptom_logs', 'id', 'journal'));
  // she deletes the journal entry
  ph.local = { ...ph.local, logs: ph.local.logs.filter((l) => l.id !== 'journal') };
  ph.deleted.logs.push('journal');
  await app.flush();
  assert.ok(!server.has('symptom_logs', 'id', 'journal'), 'deleted on the server');
  assert.deepEqual(ph.deleted.logs, [], 'phone forgets it once the server has deleted it');
  app = ph.launch(); // app closed and opened again
  await app.flush();
  assert.deepEqual(ph.local.logs.map((l) => l.id), ['keep'], 'still gone after the restart');
});

test('deleted while offline, app restarted: never restored, deleted once online', async () => {
  const server = new Server();
  const ph = phone(server);
  ph.local.logs = [log('a', '2026-11-20T08:00:00.000Z'), log('b', '2026-11-21T08:00:00.000Z')];
  ph.local.cycles = [cycle('2026-10-01'), cycle('2026-10-29')];
  ph.local.contacts = [{ id: 'care-1', name: 'Dr A', role: 'gynaecologist', phone: '98765' }, { id: 'care-2', name: 'Dr B', role: 'counsellor', phone: '91234' }];
  await ph.launch().flush();
  // offline: she deletes a log, a period and a contact; the upload fails
  server.offline = true;
  ph.local = {
    ...ph.local,
    logs: ph.local.logs.filter((l) => l.id !== 'b'),
    cycles: ph.local.cycles.filter((c) => c.startDate !== '2026-10-29'),
    contacts: ph.local.contacts.filter((c) => c.id !== 'care-2'),
  };
  ph.deleted = { logs: ['b'], cycles: ['2026-10-29'], contacts: ['care-2'] };
  assert.equal(await ph.launch().flush(), false);
  assert.deepEqual(ph.deleted, { logs: ['b'], cycles: ['2026-10-29'], contacts: ['care-2'] }, 'kept until the server has them deleted');
  // back online, app opened again: the server copy must not bring them back
  server.offline = false;
  await ph.launch().flush();
  assert.deepEqual(ph.local.logs.map((l) => l.id), ['a']);
  assert.deepEqual(ph.local.cycles.map((c) => c.startDate), ['2026-10-01']);
  assert.deepEqual(ph.local.contacts.map((c) => c.id), ['care-1']);
  assert.ok(!server.has('symptom_logs', 'id', 'b') && !server.has('cycles', 'start_date', '2026-10-29') && !server.has('care_contacts', 'id', 'care-2'), 'deleted on the server');
  assert.deepEqual(ph.deleted, { logs: [], cycles: [], contacts: [] });
});

test('an edited check-in (same entry, saved again) is backed up', async () => {
  const server = new Server();
  const ph = phone(server);
  ph.local.logs = [log('ci-today', '2026-11-25T08:00:00.000Z', { pain: 3, checkIn: true })];
  const app = ph.launch();
  await app.flush();
  ph.local = { ...ph.local, logs: [log('ci-today', '2026-11-25T20:00:00.000Z', { pain: 8, checkIn: true })] };
  server.calls = [];
  await app.flush();
  assert.equal(server.tables.symptom_logs.find((r) => r.id === 'ci-today')!.pain, 8);
  assert.deepEqual(server.calls, ['upsert:symptom_logs:1'], 'only the edited entry is sent');
});

test('two phones: the newer edit wins in both directions', async () => {
  const server = new Server();
  const a = phone(server);
  a.local.logs = [log('ci', '2026-11-25T08:00:00.000Z', { pain: 3 })];
  await a.launch().flush();
  const b = phone(server);
  await b.launch().flush(); // restore on the second phone
  b.local = { ...b.local, logs: [log('ci', '2026-11-25T21:00:00.000Z', { pain: 9 })] };
  await b.launch().flush();
  // the first phone still has the older copy; opening it takes the newer one and never overwrites it
  await a.launch().flush();
  assert.equal((a.local.logs[0] as any).pain, 9);
  assert.equal(server.tables.symptom_logs[0].pain, 9);
});

test('a wiped phone (no deletions recorded) restores everything and deletes nothing', async () => {
  const server = new Server();
  const ph = phone(server);
  ph.local.logs = [log('a', '2026-11-20T08:00:00.000Z'), log('b', '2026-11-21T08:00:00.000Z')];
  ph.local.cycles = [cycle('2026-10-01')];
  await ph.launch().flush();
  // the phone's data is lost (bookkeeping survives), then she opens the app again
  ph.local = blank();
  server.calls = [];
  await ph.launch().flush();
  assert.deepEqual(ph.local.logs.map((l) => l.id).sort(), ['a', 'b']);
  assert.equal(ph.local.cycles.length, 1);
  assert.ok(!server.calls.some((c) => c.startsWith('deleteRows')), 'nothing deleted on the server');
  assert.equal(server.tables.symptom_logs.length, 2);
});

test('a new phone restores with 6 reads and sends no logs back', async () => {
  const server = new Server();
  const a = phone(server);
  a.local.logs = Array.from({ length: 30 }, (_, i) => log(`l${i}`, `2026-10-${String(i + 1).padStart(2, '0')}T08:00:00.000Z`));
  await a.launch().flush();
  const b = phone(server);
  server.calls = [];
  await b.launch().flush();
  assert.equal(b.local.logs.length, 30);
  assert.equal(server.calls.filter((c) => c.startsWith('select')).length, 6);
  assert.deepEqual(server.calls.filter((c) => /symptom_logs/.test(c) && !c.startsWith('select')), [], 'restored logs are not uploaded again');
});

test('bookkeeping from the previous version: no mass re-upload after the update', async () => {
  const server = new Server();
  const ph = phone(server);
  ph.local.logs = Array.from({ length: 20 }, (_, i) => log(`l${i}`, `2026-09-${String(i + 1).padStart(2, '0')}T08:00:00.000Z`));
  await ph.launch().flush();
  // turn the saved bookkeeping into the old format (ids only)
  const key = 'shesync.sync.u1';
  const old = JSON.parse((await ph.meta.getItem(key))!);
  delete old.logStamps;
  await ph.meta.setItem(key, JSON.stringify(old));
  server.calls = [];
  await ph.launch().flush();
  assert.deepEqual(server.calls.filter((c) => c.startsWith('upsert:symptom_logs')), [], 'unchanged logs are not sent again');
});

// ── The app records only deliberate deletions ──
test('app: deleting a log, a period or a contact is remembered for the backup', () => {
  const st = useAppStore.getState();
  st.signup('Asha', 'asha@example.com');
  useAppStore.setState({ symptomLogs: [log('x1', '2026-11-20T08:00:00.000Z'), log('x2', '2026-11-21T08:00:00.000Z')] as any });
  useAppStore.getState().deleteSymptomLog('x1');
  useAppStore.getState().deleteSymptomLog('not-there');
  assert.deepEqual(useAppStore.getState().deletedLogIds, ['x1']);

  useAppStore.getState().savePastCycles(2, [cycle('2026-10-01'), cycle('2026-10-29')] as any);
  useAppStore.getState().savePastCycles(1, [cycle('2026-10-01')] as any);
  assert.deepEqual(useAppStore.getState().deletedCycleStarts, ['2026-10-29']);
  useAppStore.getState().savePastCycles(2, [cycle('2026-10-01'), cycle('2026-10-29')] as any);
  assert.deepEqual(useAppStore.getState().deletedCycleStarts, [], 'adding the period again undoes the deletion');

  useAppStore.getState().addCareContact({ name: 'Dr A', role: 'gynaecologist', phone: '98765' });
  const id = useAppStore.getState().careContacts[0].id;
  useAppStore.getState().removeCareContact(id);
  assert.deepEqual(useAppStore.getState().deletedContactIds, [id]);

  useAppStore.getState().forgetDeletions({ logs: ['x1'], contacts: [id] });
  assert.deepEqual(useAppStore.getState().deletedLogIds, []);
  assert.deepEqual(useAppStore.getState().deletedContactIds, []);
});

test('app: restoring or importing (more entries) records no deletions; sign-out clears them', async () => {
  useAppStore.setState({ pastCycles: [cycle('2026-10-01')] as any, deletedCycleStarts: [] });
  useAppStore.getState().savePastCycles(2, [cycle('2026-10-01'), cycle('2026-09-03')] as any);
  assert.deepEqual(useAppStore.getState().deletedCycleStarts, []);
  useAppStore.getState().deleteSymptomLog('x2');
  assert.equal(useAppStore.getState().deletedLogIds.length, 1);
  await useAppStore.getState().logout();
  assert.deepEqual(useAppStore.getState().deletedLogIds, []);
  assert.deepEqual(useAppStore.getState().deletedCycleStarts, []);
});

test('app: entries saved in the same millisecond get different ids (none is overwritten)', () => {
  const RealDate = Date;
  const fixed = new RealDate('2026-11-25T10:00:00.000Z').getTime();
  class FixedDate extends RealDate {
    constructor(...a: unknown[]) { super(...((a.length ? a : [fixed]) as [number])); }
    static now() { return fixed; }
  }
  useAppStore.setState({ symptomLogs: [], deletedLogIds: [`log-${fixed}-3`] });
  (globalThis as { Date: DateConstructor }).Date = FixedDate as unknown as DateConstructor;
  try {
    useAppStore.getState().saveCheckIn({ mood: 3 });
    useAppStore.getState().logSymptom({ pain: 4 });
    useAppStore.getState().logSymptom({ pain: 5 });
  } finally {
    (globalThis as { Date: DateConstructor }).Date = RealDate;
  }
  const ids = useAppStore.getState().symptomLogs.map((l) => l.id);
  assert.equal(new Set(ids).size, 3, ids.join(', '));
  assert.ok(!ids.includes(`log-${fixed}-3`), 'never reuses the id of a deleted entry');
  useAppStore.getState().saveCheckIn({ mood: 4 }); // updating the check-in keeps the other two
  assert.equal(useAppStore.getState().symptomLogs.length, 3);
});

test('wiring: the backup reads and clears the app’s deletions; deletions are saved on the phone', () => {
  const sync = fs.readFileSync(path.join(root, 'src/lib/sync/index.ts'), 'utf8');
  assert.match(sync, /getDeleted: \(\) =>/);
  assert.match(sync, /onDeletedSynced: \(done\) => useAppStore\.getState\(\)\.forgetDeletions\(done\)/);
  const store = fs.readFileSync(path.join(root, 'src/store/useAppStore.ts'), 'utf8');
  for (const k of ['deletedLogIds', 'deletedCycleStarts', 'deletedContactIds']) assert.match(store, new RegExp(`${k}: s\\.${k}`), `${k} persisted`);
});

(async () => {
  let passed = 0;
  for (const [n, f] of tests) {
    try {
      await f();
      passed++;
    } catch (e: any) {
      console.log('FAIL', n, '\n ', e.message);
      process.exitCode = 1;
    }
  }
  console.log(`${passed}/${tests.length} deletion/backup tests passed`);
})();
