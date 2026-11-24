// ============================================================
// Anonymous reports to SheSync's own server (the same Supabase
// project as backup): crash reports and 👍/👎 on YourGoGirl answers.
//
// No account id, device id, name or email is sent. Reports wait in a
// small queue on the phone and go when the server is reachable.
// No third-party analytics, ad or marketing SDK is involved.
// ============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type ReportTable = 'crash_reports' | 'answer_feedback';

const TABLES: ReportTable[] = ['crash_reports', 'answer_feedback'];
const MAX_QUEUE = 30;
const key = (t: ReportTable) => `shesync.reports.${t}`;

export function appVersion(): string {
  return String(Constants.expoConfig?.version ?? 'dev').slice(0, 40);
}

export function platformName(): 'ios' | 'android' | 'web' {
  return Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
}

async function readQueue(t: ReportTable): Promise<Record<string, unknown>[]> {
  try {
    const raw = await AsyncStorage.getItem(key(t));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeQueue(t: ReportTable, list: Record<string, unknown>[]) {
  try {
    if (list.length) await AsyncStorage.setItem(key(t), JSON.stringify(list.slice(-MAX_QUEUE)));
    else await AsyncStorage.removeItem(key(t));
  } catch {
    // Reporting must never break the app.
  }
}

/**
 * Queue changes run one at a time, so a report added while a batch is being
 * sent is neither lost nor sent twice.
 */
let chain: Promise<unknown> = Promise.resolve();
function locked<T>(f: () => Promise<T>): Promise<T> {
  const run = chain.then(f, f);
  chain = run.catch(() => {});
  return run;
}

type Queued = Record<string, unknown> & { _q?: string };

/** Adds a report to the queue (oldest dropped past 30) and tries to send it. */
export async function enqueueReport(t: ReportTable, row: Record<string, unknown>): Promise<void> {
  await locked(async () => {
    const list = await readQueue(t);
    const _q = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    list.push({ ...row, created_at: new Date().toISOString(), _q });
    await writeQueue(t, list);
  });
  void flushReports();
}

let flushing: Promise<void> | null = null;

/** Sends everything waiting. Safe to call often; failures stay queued for next time. */
export function flushReports(): Promise<void> {
  if (!isSupabaseConfigured) return Promise.resolve();
  if (!flushing) {
    flushing = (async () => {
      for (const t of TABLES) {
        const batch = (await locked(() => readQueue(t))) as Queued[];
        if (!batch.length) continue;
        try {
          const rows = batch.map(({ _q, ...row }) => row);
          const { error } = await supabase.from(t).insert(rows);
          // Sent — or the server refused the data itself (SQLSTATE 22xxx/23xxx,
          // e.g. a check constraint), which would fail the same way forever.
          if (!error || /^2[23]/.test(String((error as { code?: string }).code ?? ''))) {
            const done = new Set(batch.map((r) => r._q));
            await locked(async () => writeQueue(t, ((await readQueue(t)) as Queued[]).filter((r) => !done.has(r._q))));
          }
        } catch {
          // Offline: try again later.
        }
      }
    })().finally(() => {
      flushing = null;
    });
  }
  return flushing;
}

/** Number of reports waiting on this phone (for tests and the Profile screen). */
export async function pendingReports(): Promise<number> {
  let n = 0;
  for (const t of TABLES) n += (await readQueue(t)).length;
  return n;
}
