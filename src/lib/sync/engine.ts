/**
 * Cloud backup engine — offline-first.
 *
 * The phone is always the working copy. Changes are pushed to Supabase a few
 * seconds after they happen (only what actually changed). Before the first
 * push of each session the server copy is merged in, so:
 *   - signing in on a new phone restores her data, and
 *   - a freshly-reset device can never overwrite her cloud data with blanks.
 * Every operation runs one at a time; failures are retried on the next change.
 *
 * No React Native imports: the server client and storage are injected
 * (see ./index.ts), which keeps this testable in Node.
 */
import {
  DOC_NAMES,
  type LocalSnapshot,
  type RemoteData,
  contactToRow,
  cycleToRow,
  hashOf,
  logToRow,
  mergeSnapshot,
  profileToRow,
  sleepToRow,
} from './mappers';

/** The few database operations the engine needs. */
export interface SyncClient {
  getUserId(): Promise<string | null>;
  upsert(table: string, rows: object[], onConflict: string): Promise<void>;
  /** Deletes the user's rows whose `keyColumn` is not in `keep`. */
  deleteMissing(table: string, userId: string, keyColumn: string, keep: string[]): Promise<void>;
  selectAll<T>(table: string, userColumn: string, userId: string): Promise<T[]>;
}

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

interface SyncMeta {
  pushedLogIds: string[];
  hashes: Record<string, string>;
  lastSyncedAt: number;
}

/**
 * off      on-device account (nothing is uploaded)
 * signin   online account without a server session (e.g. email not confirmed yet)
 */
export type SyncState = 'off' | 'signin' | 'idle' | 'syncing' | 'error';

export interface SyncEngineOptions {
  client: SyncClient;
  storage: KeyValueStore;
  getLocal: () => LocalSnapshot;
  applyLocal: (snapshot: LocalSnapshot) => void;
  /** False for on-device-only accounts. */
  isCloudAccount: () => boolean;
  onStatus?: (state: SyncState, info?: { lastSyncedAt?: number; error?: string }) => void;
  debounceMs?: number;
}

const CHUNK = 200;
const emptyMeta = (): SyncMeta => ({ pushedLogIds: [], hashes: {}, lastSyncedAt: 0 });

export function createSyncEngine(opts: SyncEngineOptions) {
  const { client, storage } = opts;
  const debounceMs = opts.debounceMs ?? 2500;
  let timer: ReturnType<typeof setTimeout> | null = null;
  /** Account whose server data has been merged into this device this session. */
  let mergedFor: string | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  let pendingPush: Promise<boolean> | null = null;

  const metaKey = (uid: string) => `shesync.sync.${uid}`;
  async function readMeta(uid: string): Promise<SyncMeta> {
    try {
      const raw = await storage.getItem(metaKey(uid));
      if (raw) return { ...emptyMeta(), ...JSON.parse(raw) };
    } catch {
      // Corrupt or missing bookkeeping: start fresh (uploads are idempotent upserts).
    }
    return emptyMeta();
  }
  const writeMeta = (uid: string, m: SyncMeta) => storage.setItem(metaKey(uid), JSON.stringify(m));

  /** Runs tasks strictly one after another. */
  function serial<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  async function upsertChunked(table: string, rows: object[], onConflict: string) {
    for (let i = 0; i < rows.length; i += CHUNK) await client.upsert(table, rows.slice(i, i + CHUNK), onConflict);
  }

  /** Downloads the account's rows and merges them into the device. */
  async function mergeFromServer(uid: string) {
    const [profiles, cycles, logs, sleep, contacts, docs] = await Promise.all([
      client.selectAll<NonNullable<RemoteData['profile']>>('profiles', 'id', uid),
      client.selectAll<RemoteData['cycles'][number]>('cycles', 'user_id', uid),
      client.selectAll<RemoteData['logs'][number]>('symptom_logs', 'user_id', uid),
      client.selectAll<RemoteData['sleep'][number]>('sleep_logs', 'user_id', uid),
      client.selectAll<RemoteData['contacts'][number]>('care_contacts', 'user_id', uid),
      client.selectAll<RemoteData['docs'][number]>('app_documents', 'user_id', uid),
    ]);
    const local = opts.getLocal();
    const merged = mergeSnapshot(local, { profile: profiles[0] ?? null, cycles, logs, sleep, contacts, docs });
    if (hashOf(merged) !== hashOf(local)) opts.applyLocal(merged);

    // Everything downloaded is already on the server.
    const meta = await readMeta(uid);
    meta.pushedLogIds = [...new Set([...meta.pushedLogIds, ...logs.map((l) => l.id)])];
    await writeMeta(uid, meta);
    mergedFor = uid;
  }

  async function syncOnce(): Promise<boolean> {
    if (!opts.isCloudAccount()) {
      opts.onStatus?.('off');
      return false;
    }
    const uid = await client.getUserId();
    if (!uid) {
      opts.onStatus?.('signin');
      return false;
    }
    opts.onStatus?.('syncing');
    if (mergedFor !== uid) await mergeFromServer(uid);

    const local = opts.getLocal();
    const meta = await readMeta(uid);
    const fresh = (key: string, value: unknown) => {
      const h = hashOf(value);
      return meta.hashes[key] === h ? null : h;
    };

    const profileRow = profileToRow(uid, local.profile);
    const ph = fresh('profile', profileRow);
    if (ph) {
      await client.upsert('profiles', [profileRow], 'id');
      meta.hashes.profile = ph;
    }

    const cycleRows = local.cycles.filter((c) => !!c.startDate).map((c) => cycleToRow(uid, c));
    const ch = fresh('cycles', cycleRows);
    if (ch) {
      if (cycleRows.length) await upsertChunked('cycles', cycleRows, 'user_id,start_date');
      await client.deleteMissing('cycles', uid, 'start_date', cycleRows.map((r) => r.start_date));
      meta.hashes.cycles = ch;
    }

    const pushed = new Set(meta.pushedLogIds);
    const newLogs = local.logs.filter((l) => !pushed.has(l.id));
    if (newLogs.length) {
      await upsertChunked('symptom_logs', newLogs.map((l) => logToRow(uid, l)), 'user_id,id');
      newLogs.forEach((l) => pushed.add(l.id));
    }
    // Remember only ids still on the device, so the list cannot grow forever.
    const onDevice = new Set(local.logs.map((l) => l.id));
    meta.pushedLogIds = [...pushed].filter((id) => onDevice.has(id));

    const sleepRows = local.sleep.map((s) => sleepToRow(uid, s));
    const sh = fresh('sleep', sleepRows);
    if (sh) {
      if (sleepRows.length) await upsertChunked('sleep_logs', sleepRows, 'user_id,log_date');
      meta.hashes.sleep = sh;
    }

    const contactRows = local.contacts.map((c) => contactToRow(uid, c));
    const kh = fresh('contacts', contactRows);
    if (kh) {
      if (contactRows.length) await client.upsert('care_contacts', contactRows, 'user_id,id');
      await client.deleteMissing('care_contacts', uid, 'id', contactRows.map((r) => r.id));
      meta.hashes.contacts = kh;
    }

    for (const doc of DOC_NAMES) {
      const data = local.docs[doc] ?? {};
      const dh = fresh(`doc:${doc}`, data);
      if (dh) {
        await client.upsert('app_documents', [{ user_id: uid, doc, data }], 'user_id,doc');
        meta.hashes[`doc:${doc}`] = dh;
      }
    }

    meta.lastSyncedAt = Date.now();
    await writeMeta(uid, meta);
    opts.onStatus?.('idle', { lastSyncedAt: meta.lastSyncedAt });
    return true;
  }

  /** Queues one sync; while one is waiting to start, further calls share it. */
  function sync(): Promise<boolean> {
    if (pendingPush) return pendingPush;
    const p = serial(async () => {
      pendingPush = null; // changes made from now on need another run
      try {
        return await syncOnce();
      } catch (e: unknown) {
        opts.onStatus?.('error', { error: e instanceof Error ? e.message : String(e) });
        return false;
      }
    });
    pendingPush = p;
    return p;
  }

  function flush(): Promise<boolean> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    return sync();
  }

  return {
    /** Call on every local change; uploads after a short quiet period. */
    schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void sync();
      }, debounceMs);
    },

    /** Uploads now (before sign-out, or when the app goes to the background). */
    flush,

    /** Merges the server copy into this device, then uploads. Use right after sign-in. */
    pull(): Promise<boolean> {
      mergedFor = null;
      return flush();
    },

    /** Forget the merged account (call when the signed-in account changes or signs out). */
    resetSession() {
      if (timer) clearTimeout(timer);
      timer = null;
      mergedFor = null;
    },
  };
}

export type SyncEngine = ReturnType<typeof createSyncEngine>;
