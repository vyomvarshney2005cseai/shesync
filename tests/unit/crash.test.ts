// Crash regression tests (25 Nov 2026 reliability audit): saved data that
// cannot be read must never stop the app from opening, the forecast must
// survive any plausible saved state, Supabase requests must not hang the
// backup queue, and every web route must be served by Vercel.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/useAppStore';
import { flushStorage } from '@/store/storage';
import { addDaysToKey, parseDateKey, todayKey } from '@/lib/dates';
import { hasMalformedRecords, repairSavedRecords } from '@/lib/importValidation';
import { withTimeout } from '@/lib/fetchWithTimeout';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;
const root = path.join(__dirname, '..', '..');
const tests: [string, () => void | Promise<void>][] = [];
const test = (name: string, f: () => void | Promise<void>) => tests.push([name, f]);
const silent = async <T,>(f: () => Promise<T>) => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return await f();
  } finally {
    console.warn = warn;
  }
};
const today = todayKey();

// ── Saved data that cannot be read ──
test('unreadable saved data: the app still finishes loading, a copy is kept', async () => {
  await flushStorage();
  await AsyncStorage.setItem('shesync.app', '{"state":{"pastCycles":[{"startDate":"2026-10-0'); // cut off mid-write
  await silent(() => Promise.resolve(useAppStore.persist.rehydrate()));
  assert.equal(useAppStore.persist.hasHydrated(), true, 'hydration finished');
  assert.equal(useAppStore.getState().pastCycles.length, 0);
  assert.match((await AsyncStorage.getItem('shesync.app.unreadable')) ?? '', /pastCycles/, 'original kept for recovery');
});

test('saved records of the wrong type: repaired, good records kept, app loads', async () => {
  await flushStorage();
  const good = { id: 'c1', cycleNumber: 1, startDate: addDaysToKey(today, -20), endDate: addDaysToKey(today, -15), daysAgo: 20, lengthDays: 28, periodDurationDays: 5 };
  const saved = {
    state: {
      isAuthenticated: true,
      userName: 'Asha',
      focusAreas: null,
      pastCycles: [good, { id: 'bad', startDate: 12345, lengthDays: 'x' }],
      symptomLogs: [{ id: 'l1', date: addDaysToKey(today, -1), timestamp: new Date().toISOString(), pain: 4 }, { id: 'l2', date: { x: 1 }, pain: 'a lot' }],
      sleepLogs: [{ date: today, hours: 7 }, { date: 99, hours: 'x' }],
      careContacts: [],
    },
    version: 3,
  };
  await AsyncStorage.setItem('shesync.app', JSON.stringify(saved));
  await silent(() => Promise.resolve(useAppStore.persist.rehydrate()));
  const s = useAppStore.getState();
  assert.equal(useAppStore.persist.hasHydrated(), true, 'hydration finished');
  assert.equal(s.userName, 'Asha');
  assert.deepEqual(s.pastCycles.map((c) => c.startDate), [good.startDate], 'bad period dropped, good one kept');
  assert.deepEqual(s.symptomLogs.map((l) => l.id), ['l1']);
  assert.ok(Number.isFinite(s.biometrics.strainScore));
  assert.ok(Number.isFinite(s.cyclePrediction.daysUntilNextPeriod));
  assert.deepEqual(s.cycle.conditions, []);
});

test('older saved dates with a time part are not treated as broken', () => {
  const old = { symptomLogs: [{ id: 'a', date: '2026-10-02T09:00:00.000Z', timestamp: '2026-10-02T09:00:00.000Z' }], pastCycles: [{ id: 'c', startDate: '2026-09-30T00:00:00Z' }] };
  assert.equal(hasMalformedRecords(old), false);
  const r = repairSavedRecords(old);
  assert.equal(r.symptomLogs[0].date, '2026-10-02');
  assert.equal(r.pastCycles[0].startDate, '2026-09-30');
});

test('repair keeps journal recordings linked; backups never bring file names', () => {
  const r = repairSavedRecords({ symptomLogs: [{ id: 'j1', date: today, timestamp: new Date().toISOString(), audioFile: 'journal-1.m4a' }, { id: 'j2', date: today, audioFile: '../secret' }] });
  assert.equal(r.symptomLogs[0].audioFile, 'journal-1.m4a');
  assert.equal(r.symptomLogs[1].audioFile, undefined, 'paths are never accepted');
});

test('dates: values that are not text fall back to today instead of throwing', () => {
  const t = parseDateKey(todayKey());
  for (const v of [12345, {}, [], true] as unknown[]) {
    const d = parseDateKey(v as string);
    assert.equal(d.getTime(), t.getTime(), String(v));
  }
});

// ── Forecast never crashes on plausible saved data ──
test('forecast: 600 random plausible histories — no crash, no NaN', () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const date = () => pick([addDaysToKey(today, -int(0, 40)), addDaysToKey(today, -int(0, 800)), addDaysToKey(today, int(1, 30)), '2024-02-29']);
  for (let i = 0; i < 600; i++) {
    const pastCycles = Array.from({ length: pick([0, 1, 2, 5, 12]) }, (_, k) => {
      const start = date();
      return { id: `c${k}`, cycleNumber: k + 1, startDate: start, endDate: rnd() < 0.2 ? undefined : addDaysToKey(start, int(-2, 12)), daysAgo: 0, lengthDays: pick([1, 21, 28, 35, 90, 365]), periodDurationDays: pick([1, 5, 14]), ...(rnd() < 0.2 ? { approximate: true } : {}) };
    });
    const symptomLogs = Array.from({ length: pick([0, 3, 40]) }, (_, k) => ({ id: `l${k}`, date: date(), timestamp: new Date().toISOString(), pain: int(0, 10) as never, mood: int(1, 5) as never, flow: pick(['none', 'light', 'heavy', 'severe']) as never }));
    const sleepLogs = Array.from({ length: pick([0, 7]) }, () => ({ date: date(), hours: pick([0, 6, 16]) }));
    useAppStore.setState({ pastCycles, symptomLogs, sleepLogs, focusAreas: pick([[], ['pcos']]) } as never);
    useAppStore.getState().savePastCycles(int(0, 12), pastCycles as never);
    const s = useAppStore.getState();
    assert.ok(Number.isFinite(s.biometrics.strainScore), `strain NaN at #${i}`);
    assert.ok(Number.isFinite(s.cycle.currentDay), `cycle day NaN at #${i}`);
    assert.ok(Number.isFinite(s.cyclePrediction.daysUntilNextPeriod), `countdown NaN at #${i}`);
    assert.doesNotMatch(String(s.cyclePrediction.nextPeriodDate), /NaN|Invalid/, `date at #${i}`);
  }
});

// ── Network: a request that never answers ──
test('Supabase requests: a stalled request fails after the time limit', async () => {
  const never = (_i: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
  const t0 = Date.now();
  await assert.rejects(withTimeout(never, 60)('https://x.supabase.co/rest/v1/cycles'), /aborted/);
  assert.ok(Date.now() - t0 < 1000);
});

test('Supabase requests: normal answers pass; a caller cancel still works', async () => {
  const ok = async () => new Response('[]', { status: 200 });
  assert.equal((await withTimeout(ok, 60)('https://x')).status, 200);
  const never = (_i: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('cancelled'))));
  const c = new AbortController();
  const p = withTimeout(never, 10_000)('https://x', { signal: c.signal });
  c.abort();
  await assert.rejects(p, /cancelled/);
  assert.match(fs.readFileSync(path.join(root, 'src/lib/supabase.ts'), 'utf8'), /global: \{ fetch: withTimeout\(/);
});

// ── Web hosting: every route must load the app ──
test('vercel.json: all paths rewrite to "/" (with cleanUrls, "/index.html" gives 404 on every route)', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  assert.equal(cfg.cleanUrls, true);
  assert.equal(cfg.framework, null);
  assert.deepEqual(cfg.rewrites, [{ source: '/:path*', destination: '/' }]);
});

test('vercel.json: deploys the tree-shaken build; only content-hashed files are cached for a year', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(cfg.buildCommand, 'npm run export:web');
  assert.match(pkg.scripts['export:web'], /EXPO_UNSTABLE_TREE_SHAKING=1/);
  assert.match(pkg.scripts['export:web'], /expo export --platform web$/, 'writes to dist, the outputDirectory');
  const long = cfg.headers.filter((h: any) => h.headers.some((x: any) => x.key === 'Cache-Control' && /max-age=31536000, immutable/.test(x.value)));
  assert.deepEqual(long.map((h: any) => h.source).sort(), ['/_expo/static/(.*)', '/assets/(.*)']);
  const all = cfg.headers.find((h: any) => h.source === '/(.*)');
  assert.ok(!all.headers.some((x: any) => x.key === 'Cache-Control'), 'pages and index.html keep Vercel’s revalidate-every-time default');
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
  console.log(`${passed}/${tests.length} crash tests passed`);
})();
