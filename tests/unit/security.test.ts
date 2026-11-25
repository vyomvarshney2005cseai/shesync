// Security regression tests (25 Nov 2026 audit): sign-in tokens in secure
// storage, backup-file validation, report HTML escaping, safe links and link
// parameters, export file names, the app-lock return check, web headers, and
// the light-by-default theme.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createSecureSessionStorage, CHUNK_SIZE, secureKey, type KeyValueStore, type SecureStoreLike } from '@/lib/secureSessionStorage';
import { sanitizeBackupData } from '@/lib/importValidation';
import { parseImport } from '@/lib/dataPortability';
import { buildClinicalReportHtml, escapeHtml } from '@/lib/pdfReportService';
import { isSafeExternalUrl } from '@/lib/openExternal';
import { emailParam } from '@/lib/linkParams';
import { safeFileName } from '@/lib/files';
import { isAppLockPaused, noteLeftWhilePaused, pauseAppLock, resumeAppLock, shouldLockOnReturn } from '@/lib/appLock';
import { appearanceOverride, DEFAULT_NIGHT_MODE, migrateSettings, useSettingsStore } from '@/store/useSettingsStore';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const tests: [string, () => void | Promise<void>][] = [];
const test = (name: string, f: () => void | Promise<void>) => tests.push([name, f]);
const root = path.join(__dirname, '..', '..');

// ── H1. Session tokens live in Secure Store, in chunks ──
function fakes() {
  const secure = new Map<string, string>();
  const plain = new Map<string, string>();
  const keyOk = /^[A-Za-z0-9._-]+$/;
  const s: SecureStoreLike = {
    getItemAsync: async (k) => (assert.match(k, keyOk), secure.get(k) ?? null),
    setItemAsync: async (k, v) => {
      assert.match(k, keyOk);
      assert.ok(v.length <= 2048, 'each Secure Store value stays under 2 KB');
      secure.set(k, v);
    },
    deleteItemAsync: async (k) => void secure.delete(k),
  };
  const legacy: KeyValueStore = {
    getItem: async (k) => plain.get(k) ?? null,
    setItem: async (k, v) => void plain.set(k, v),
    removeItem: async (k) => void plain.delete(k),
  };
  return { secure, plain, store: createSecureSessionStorage(s, legacy) };
}
const KEY = 'sb-abcd-auth-token';
const session = JSON.stringify({ access_token: 'a'.repeat(3000), refresh_token: 'r'.repeat(40), user: { email: 'x@y.in' } });

test('session: a large session round-trips through Secure Store chunks, nothing in AsyncStorage', async () => {
  const { secure, plain, store } = fakes();
  await store.setItem(KEY, session);
  assert.equal(await store.getItem(KEY), session);
  assert.equal(plain.size, 0);
  assert.equal(secure.get(`${secureKey(KEY)}.n`), String(Math.ceil(session.length / CHUNK_SIZE)));
});

test('session: an old AsyncStorage session is moved to Secure Store and removed', async () => {
  const { secure, plain, store } = fakes();
  plain.set(KEY, session);
  assert.equal(await store.getItem(KEY), session);
  assert.equal(plain.has(KEY), false, 'plain copy removed');
  assert.ok(secure.size > 1);
  assert.equal(await store.getItem(KEY), session);
});

test('session: a shorter session drops leftover chunks; sign-out removes everything', async () => {
  const { secure, store } = fakes();
  await store.setItem(KEY, session);
  await store.setItem(KEY, '{"short":true}');
  assert.equal(await store.getItem(KEY), '{"short":true}');
  assert.equal(secure.size, 2, 'count + one chunk');
  await store.removeItem(KEY);
  assert.equal(secure.size, 0);
  assert.equal(await store.getItem(KEY), null);
});

test('session: the Supabase client uses secure storage on phones', () => {
  const src = fs.readFileSync(path.join(root, 'src/lib/supabase.ts'), 'utf8');
  assert.match(src, /storage: authStorage/);
  assert.match(src, /createSecureSessionStorage\(SecureStore, AsyncStorage/);
  assert.doesNotMatch(src, /storage: AsyncStorage/);
});

// ── M2. Doctor report escapes everything ──
const evil = '<img src=x onerror=alert(1)>';
test('report: names, settings and numbers from data are HTML-escaped', () => {
  const html = buildClinicalReportHtml({
    userName: evil,
    userEmail: `"><script>alert(1)</script>`,
    focusAreas: [evil],
    fineTuningSettings: { archetypeName: evil, archetypeTagline: evil, dailySleepTargetHours: evil as unknown as number },
    biometrics: { strainScore: evil as unknown as number },
    pastCycles: [{ id: 'c', cycleNumber: 1, startDate: evil, daysAgo: 0, lengthDays: evil as unknown as number, periodDurationDays: 5 }],
    cyclePrediction: { nextPeriodDate: evil },
    clinicalReport: { anomalies: [{ title: evil, description: evil }], trendData: [] },
    symptomLogs: [],
    sleepLogs: [{ date: '2026-11-01', hours: evil as unknown as number }],
    healthCheck: {},
    assessmentAnswers: {},
  } as never);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('report: escapeHtml covers quotes and ampersands', () => {
  assert.equal(escapeHtml(`a&b<"'>`), 'a&amp;b&lt;&quot;&#39;&gt;');
});

// ── M3. Backup files are validated ──
test('backup import: keeps good records, drops malformed ones and device-only fields', () => {
  const data = sanitizeBackupData({
    profile: { userName: 'A'.repeat(500), fineTuningSettings: { dailySleepTargetHours: '<b>', archetypeName: 'x', nested: { a: 1 } }, rememberedCyclesCount: 1e9, focusAreas: ['sleep', 5] },
    cycles: [{ startDate: '2026-10-01', lengthDays: 9999 }, { startDate: 'not a date' }, null, 'x'],
    logs: [
      { id: 'l1', date: '2026-10-02', timestamp: '2026-10-02T09:00:00Z', pain: 99, mood: 0, flow: 'lava', notes: 'n'.repeat(9000), audioFile: '../../secrets', tags: ['a', 1, 'b'] },
      { id: 'l2', date: '2026/10/02' },
      { date: '2026-10-03' },
    ],
    sleep: [{ date: '2026-10-02', hours: 40 }, { date: '2026-10-03', hours: 'lots' }],
    contacts: [{ id: 'c1', name: 'Dr M', role: 'hacker', phone: '98765' }, { id: 'c2', name: '', phone: '1' }],
    docs: { pcos: { checkins: [] }, evil: { x: 1 } },
  });
  assert.equal(data.profile.userName.length, 120);
  assert.equal((data.profile.fineTuningSettings as any).dailySleepTargetHours, undefined);
  assert.equal((data.profile.fineTuningSettings as any).nested, undefined);
  assert.equal(data.profile.rememberedCyclesCount, 99);
  assert.deepEqual(data.profile.focusAreas, ['sleep']);
  assert.equal(data.cycles.length, 1);
  assert.equal(data.cycles[0].lengthDays, 365);
  assert.equal(data.logs.length, 1);
  const l = data.logs[0];
  assert.equal(l.pain, 10);
  assert.equal(l.mood, 1);
  assert.equal(l.flow, undefined);
  assert.equal(l.notes!.length, 4000);
  assert.equal((l as any).audioFile, undefined);
  assert.deepEqual(l.tags, ['a', 'b']);
  assert.deepEqual(data.sleep, [{ date: '2026-10-02', hours: 16 }]);
  assert.deepEqual(data.contacts, [{ id: 'c1', name: 'Dr M', role: 'other', phone: '98765' }]);
  assert.equal((data.docs as any).evil, undefined);
  assert.deepEqual((data.docs as any).pcos, { checkins: [] });
});

test('backup import: prototype keys in a file never reach objects', () => {
  const text = '{"app":"SheSync","formatVersion":1,"data":{"cycles":[],"logs":[],"profile":{"assessmentAnswers":{"__proto__":{"polluted":"yes"},"q1":"a"}},"docs":{"fitness":{"__proto__":{"polluted":"yes"}}}}}';
  const r = parseImport(text, 'shesync-backup.json');
  assert.equal(r.source, 'shesync');
  assert.equal(({} as any).polluted, undefined);
  assert.deepEqual(Object.keys(r.backup!.profile.assessmentAnswers), ['q1']);
  assert.equal(Object.prototype.hasOwnProperty.call(r.backup!.docs.fitness, '__proto__'), false);
});

// ── L2 / L3. Links and link parameters ──
test('links: only web, phone, SMS and email links open', () => {
  for (const ok of ['https://www.nhs.uk/x', 'http://example.org', 'tel:14416', 'sms:?body=hi', 'mailto:a@b.in', 'HTTPS://WA.ME/91']) assert.ok(isSafeExternalUrl(ok), ok);
  for (const bad of ['javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'intent://x#Intent;end', 'shesync://settings', '', '//evil.com']) assert.ok(!isSafeExternalUrl(bad), bad);
});

test('link params: ?email= is used only when it is a plain email address', () => {
  assert.equal(emailParam('  priya@example.in '), 'priya@example.in');
  assert.equal(emailParam(['a@b.co', 'x']), 'a@b.co');
  for (const bad of ['', 'not-an-email', '<script>@x.com', 'a@b', 'a b@c.com', 'x'.repeat(300) + '@a.com', 42, undefined]) assert.equal(emailParam(bad), '', String(bad));
});

// ── M4. Export file names ──
test('exports: file names cannot point outside the export folder', () => {
  assert.equal(safeFileName('shesync-backup-2026.json'), 'shesync-backup-2026.json');
  assert.ok(!safeFileName('../../etc/passwd').includes('/'));
  assert.ok(!safeFileName('..\\x.json').includes('\\'));
  assert.ok(!safeFileName('.hidden').startsWith('.'));
  assert.equal(safeFileName(''), 'shesync-export.txt');
});

// ── M5. App lock: leaving during a picker ──
test('app lock: returning from a picker in time stays unlocked; staying away locks', () => {
  const t0 = Date.now();
  pauseAppLock(10_000);
  assert.ok(isAppLockPaused(t0 + 1));
  noteLeftWhilePaused(t0 + 1000);
  assert.equal(shouldLockOnReturn(t0 + 5000), false, 'back from the share sheet quickly');
  assert.equal(shouldLockOnReturn(t0 + 60_000), true, 'pressed Home and came back much later');
  resumeAppLock();
  assert.equal(shouldLockOnReturn(t0 + 60_000), false, 'nothing recorded after resume');
});

// ── M1. Web security headers ──
test('web: vercel.json sends CSP, frame, sniffing, referrer and permissions headers', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const all = cfg.headers.find((h: any) => h.source === '/(.*)').headers as { key: string; value: string }[];
  const get = (k: string) => all.find((h) => h.key.toLowerCase() === k.toLowerCase())?.value ?? '';
  const csp = get('Content-Security-Policy');
  for (const d of ["default-src 'self'", "script-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'"]) assert.ok(csp.includes(d), d);
  assert.doesNotMatch(csp.match(/script-src[^;]*/)![0], /unsafe-inline|unsafe-eval/);
  assert.equal(get('X-Content-Type-Options'), 'nosniff');
  assert.equal(get('X-Frame-Options'), 'DENY');
  assert.ok(get('Referrer-Policy'));
  assert.match(get('Permissions-Policy'), /camera=\(\)/);
});

// ── Theme: light unless she picks dark ──
test('theme: light is the default and old "Match phone" defaults become light', () => {
  assert.equal(DEFAULT_NIGHT_MODE, 'off');
  assert.equal(useSettingsStore.getState().nightMode, 'off');
  assert.equal(migrateSettings({ nightMode: 'system', crashReports: false }, 1).nightMode, 'off');
  assert.equal(migrateSettings({ nightMode: 'system' }, 1).crashReports, undefined, 'other settings untouched');
  assert.equal(migrateSettings({}, 0).nightMode, 'off');
  for (const kept of ['on', 'auto', 'off'] as const) assert.equal(migrateSettings({ nightMode: kept }, 1).nightMode, kept);
  assert.equal(migrateSettings({ nightMode: 'system' }, 2).nightMode, 'system', 'a choice made after the update is kept');
  assert.equal(migrateSettings({ nightMode: 'purple' }, 2).nightMode, 'off');
});

test('theme: phone UI follows the app unless "Match phone" is chosen', () => {
  assert.equal(appearanceOverride('off', false), 'light');
  assert.equal(appearanceOverride('on', true), 'dark');
  assert.equal(appearanceOverride('auto', false), 'light');
  assert.equal(appearanceOverride('auto', true), 'dark');
  assert.equal(appearanceOverride('system', true), 'unspecified');
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
  console.log(`${passed}/${tests.length} security tests passed`);
})();
