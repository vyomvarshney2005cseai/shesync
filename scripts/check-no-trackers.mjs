// Fails if an ad, analytics, attribution or third-party tracking SDK gets into
// SheSync — directly, through another package, or as a tracker address in code.
// Crash reports and 👍/👎 go only to SheSync's own Supabase (see
// src/lib/anonymousReports.ts). Run: npm run check:privacy
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));

// Package names (exact, or a whole @scope/) that must never ship in the app.
const BANNED_PACKAGES = [
  // ads
  'react-native-google-mobile-ads', 'expo-ads-admob', 'expo-ads-facebook', 'react-native-admob', 'react-native-fbads',
  'react-native-applovin-max', 'react-native-unity-ads', 'react-native-ironsource',
  // analytics, attribution, marketing automation
  '@react-native-firebase/analytics', '@react-native-firebase/in-app-messaging', '@react-native-firebase/dynamic-links',
  'expo-firebase-analytics', '@segment/', '@amplitude/', 'amplitude-js', 'mixpanel-react-native', 'mixpanel-browser',
  '@mparticle/', 'react-native-appsflyer', 'react-native-adjust', 'react-native-branch', 'react-native-fbsdk-next',
  'react-native-fbsdk', 'expo-facebook', 'posthog-react-native', 'posthog-js', '@posthog/', 'clevertap-react-native',
  'react-native-onesignal', 'onesignal-expo-plugin', '@braze/', 'react-native-moengage', '@heap/', 'react-native-appmetrica',
  'react-native-smartlook-analytics', '@hotjar/', 'react-native-uxcam', '@contentsquare/', '@fullstory/', 'logrocket',
  '@logrocket/', 'react-native-clarity', '@microsoft/react-native-clarity',
  // third-party crash / monitoring services (SheSync reports crashes to its own server)
  '@sentry/', 'sentry-expo', '@bugsnag/', '@datadog/', 'instabug-reactnative', '@instabug/', '@newrelic/',
  '@react-native-firebase/crashlytics', '@react-native-firebase/perf',
  // advertising IDs and cross-app tracking
  'expo-tracking-transparency', 'react-native-tracking-transparency', 'react-native-idfa', 'react-native-advertising-id',
  '@sparkfabrik/react-native-idfa-aaid',
];
// Tracker / ad addresses that must not appear in the app's code.
const BANNED_HOSTS = [
  'google-analytics.com', 'googletagmanager.com', 'app-measurement.com', 'firebaselogging', 'doubleclick.net',
  'googlesyndication.com', 'graph.facebook.com', 'connect.facebook.net', 'api.mixpanel.com', 'amplitude.com',
  'api.segment.io', 'sentry.io', 'bugsnag.com', 'appsflyer.com', 'adjust.com', 'app.link', 'branch.io', 'clarity.ms',
  'hotjar.com', 'posthog.com', 'onesignal.com', 'clevertap', 'braze.com', 'datadoghq.com', 'instabug.com',
];

const isBanned = (name) => BANNED_PACKAGES.some((b) => (b.endsWith('/') ? name.startsWith(b) : name === b));
const problems = [];
const notes = [];

// 1. Direct dependencies.
const pkg = readJson('package.json');
for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (isBanned(name)) problems.push(`package.json depends on ${name}`);
}

// 2. Everything installed through other packages (package-lock.json).
if (fs.existsSync(path.join(root, 'package-lock.json'))) {
  const lock = readJson('package-lock.json');
  for (const [where, info] of Object.entries(lock.packages ?? {})) {
    const name = where.split('node_modules/').pop();
    if (!name || !isBanned(name)) continue;
    if (info.dev) notes.push(`${name} (development tool only, not in the app)`);
    else problems.push(`${name} is installed (via ${where})`);
  }
}

// 3. Tracker addresses or SDK imports in the app's own code.
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(tsx?|jsx?|mjs|json)$/.test(e.name) ? [p] : [];
  });
for (const file of walk(path.join(root, 'src'))) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  for (const host of BANNED_HOSTS) if (text.includes(host)) problems.push(`${rel} mentions ${host}`);
  for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const spec = m[1] ?? m[2];
    const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
    if (isBanned(name) || isBanned(spec) || /^firebase\/(analytics|performance)/.test(spec)) problems.push(`${rel} imports ${spec}`);
  }
}

// 4. App config: no tracking permission prompts, advertising ID blocked on Android.
const app = readJson('app.json').expo ?? {};
const plist = app.ios?.infoPlist ?? {};
if ('NSUserTrackingUsageDescription' in plist) problems.push('app.json asks iOS for tracking permission (NSUserTrackingUsageDescription)');
const perms = app.android?.permissions ?? [];
if (perms.some((p) => /AD_ID/.test(p))) problems.push('app.json requests the advertising ID permission');
if (!(app.android?.blockedPermissions ?? []).includes('com.google.android.gms.permission.AD_ID'))
  problems.push('app.json should block com.google.android.gms.permission.AD_ID (android.blockedPermissions)');
for (const plugin of app.plugins ?? []) {
  const name = Array.isArray(plugin) ? plugin[0] : plugin;
  if (typeof name === 'string' && isBanned(name)) problems.push(`app.json uses the ${name} plugin`);
}

for (const n of notes) console.log(`note: ${n}`);
if (problems.length) {
  console.error('✗ Privacy check failed — SheSync must not include ad, analytics or tracking SDKs:');
  for (const p of problems) console.error(`  • ${p}`);
  process.exit(1);
}
console.log('✓ No ad, analytics or tracking SDKs; no tracker addresses; advertising ID blocked.');
