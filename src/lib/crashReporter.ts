// ============================================================
// Crash reports without trackers.
//
// Uncaught errors, unhandled promise rejections and errors caught by the
// friendly error screens are sent — scrubbed of emails and numbers, with no
// account or device id — to SheSync's own server (table `crash_reports`).
// She can turn this off in Profile → Settings. Nothing is sent in development.
// ============================================================
import { AppState, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { enqueueReport, appVersion, flushReports, platformName } from '@/lib/anonymousReports';
import { firstFrame, scrub } from '@/lib/scrub';
import { useSettingsStore } from '@/store/useSettingsStore';

export type CrashSource = 'boundary' | 'global' | 'promise' | 'manual';

const MAX_PER_SESSION = 15;
const seen = new Set<string>();
let sent = 0;
let currentRoute = '';
let installed = false;

/** The root layout keeps this up to date, so a report says which screen broke. */
export function setCrashRoute(route: string): void {
  currentRoute = route;
}

function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  if (typeof e === 'string') return new Error(e);
  try {
    return new Error(JSON.stringify(e));
  } catch {
    return new Error(String(e));
  }
}

/** Builds the row that is sent (exported for tests). */
export function buildCrashRow(e: unknown, ctx: { source: CrashSource; fatal?: boolean; route?: string }) {
  const err = toError(e);
  const signature = `${err.name}: ${err.message}`.slice(0, 120) + ' | ' + firstFrame(err.stack);
  return {
    signature: scrub(signature, 200),
    name: scrub(err.name, 120),
    message: scrub(err.message, 1000),
    stack: scrub(err.stack ?? '', 8000),
    source: ctx.source,
    fatal: !!ctx.fatal,
    route: scrub(ctx.route ?? currentRoute, 200) || null,
    app_version: appVersion(),
    runtime_version: safe(() => Updates.runtimeVersion) ?? null,
    update_id: safe(() => Updates.updateId) ?? null,
    platform: platformName(),
    os_version: String(Platform.Version ?? '').slice(0, 40),
  };
}

function safe<T>(f: () => T): T | undefined {
  try {
    return f();
  } catch {
    return undefined;
  }
}

/**
 * Records one error. Duplicates in a session are sent once, at most 15 a
 * session. Resolves when the report is safely queued on the phone.
 */
export function reportError(e: unknown, ctx: { source: CrashSource; fatal?: boolean; route?: string }): Promise<void> {
  try {
    if (!useSettingsStore.getState().crashReports) return Promise.resolve();
    const row = buildCrashRow(e, ctx);
    if (seen.has(row.signature) || sent >= MAX_PER_SESSION) return Promise.resolve();
    seen.add(row.signature);
    sent += 1;
    if (__DEV__ && process.env.EXPO_PUBLIC_CRASH_REPORTS_IN_DEV !== '1') {
      console.warn('[crash report — not sent in development]', row.message);
      return Promise.resolve();
    }
    return enqueueReport('crash_reports', row).catch(() => {});
  } catch {
    return Promise.resolve();
  }
}

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;

/** Installs the global handlers once (root layout). */
export function installCrashReporting(): void {
  if (installed) return;
  installed = true;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (ev) => void reportError(ev.error ?? ev.message, { source: 'global' }));
      window.addEventListener('unhandledrejection', (ev) => void reportError(ev.reason, { source: 'promise' }));
    }
  } else {
    const g = globalThis as unknown as {
      ErrorUtils?: { getGlobalHandler(): GlobalHandler; setGlobalHandler(h: GlobalHandler): void };
      HermesInternal?: { enablePromiseRejectionTracker?: (o: object) => void };
    };
    const utils = g.ErrorUtils;
    if (utils) {
      const previous = utils.getGlobalHandler();
      utils.setGlobalHandler((error, isFatal) => {
        // Give the report a moment to reach storage before a fatal error closes the app.
        const queued = reportError(error, { source: 'global', fatal: isFatal });
        const wait = new Promise((r) => setTimeout(r, 600));
        void Promise.race([queued, wait]).finally(() => previous?.(error, isFatal));
      });
    }
    // Release builds drop unhandled promise rejections silently; catch them too.
    if (!__DEV__ && g.HermesInternal?.enablePromiseRejectionTracker) {
      g.HermesInternal.enablePromiseRejectionTracker({
        allRejections: true,
        onUnhandled: (_id: number, error: unknown) => void reportError(error, { source: 'promise' }),
        onHandled: () => {},
      });
    }
  }

  // Send anything left from last time, and again whenever she comes back.
  setTimeout(() => void flushReports(), 4000);
  AppState.addEventListener('change', (s) => {
    if (s === 'active') void flushReports();
  });
}
