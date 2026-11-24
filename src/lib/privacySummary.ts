// ============================================================
// What SheSync keeps, where, and when it was last backed up — for the
// privacy dashboard and Settings → Data. Pure functions over a snapshot of
// the stores, so they are easy to test and always match the code paths in
// src/lib/sync (backed up) and the on-device stores (phone only).
// ============================================================
import type { SyncState } from '@/lib/sync/engine';

/** "just now", "5 min ago", "3 h ago", or a date. */
export function timeAgo(ms: number, now = Date.now()): string {
  const min = Math.round((now - ms) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = new Date(ms);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface BackupInput {
  guest: boolean;
  /** Account kept on this phone (offline sign-up, or no server configured). */
  onDevice: boolean;
  state: SyncState;
  lastSyncedAt?: number;
  now?: number;
}

export interface BackupSummary {
  ok: boolean;
  title: string;
  detail: string;
  /** "Back up now" makes sense. */
  canBackUp: boolean;
  /** Needs an account or a fresh sign-in first. */
  needsSignIn: boolean;
}

export function backupSummary(b: BackupInput): BackupSummary {
  const last = b.lastSyncedAt ? timeAgo(b.lastSyncedAt, b.now) : null;
  if (b.guest) return { ok: false, title: 'Not backed up', detail: 'No account yet — everything is on this phone only', canBackUp: false, needsSignIn: true };
  if (b.onDevice) return { ok: false, title: 'Not backed up', detail: 'This account lives on this phone only', canBackUp: false, needsSignIn: false };
  if (b.state === 'syncing') return { ok: true, title: 'Backing up…', detail: last ? `Last backup ${last}` : 'First backup', canBackUp: false, needsSignIn: false };
  if (b.state === 'signin') return { ok: false, title: 'Backup paused', detail: 'Sign in again to keep backing up', canBackUp: false, needsSignIn: true };
  if (b.state === 'error') return { ok: false, title: 'Backup paused', detail: last ? `No connection · last backup ${last}` : 'No connection — it will retry', canBackUp: true, needsSignIn: false };
  if (b.state === 'off') return { ok: false, title: 'Backup starting', detail: last ? `Last backup ${last}` : 'Waiting for the first backup', canBackUp: true, needsSignIn: false };
  return { ok: true, title: last ? `Backed up ${last}` : 'Backed up', detail: last ? 'Encrypted connection to your account' : 'Waiting for your first change', canBackUp: true, needsSignIn: false };
}

export interface InventoryInput {
  periods: number;
  logs: number; // all symptom logs (mood, pain, flow, check-ins, journal)
  journalText: number; // journal entries with text
  voiceRecordings: number;
  sleepLogs: number;
  careContacts: number;
  chatMessages: number;
  padChanges: number;
  padTimerOn: boolean;
  trustedContact: boolean;
  appLockOn: boolean;
  answersSaved: boolean;
  studySessions: number;
  exams: number;
  workouts: number;
  gamesPlayed: number;
  pcosCheckins: number;
  proudMoments: number;
  reportsWaiting: number;
}

export interface InventoryRow {
  id: string;
  label: string;
  value: string;
}

const n = (count: number, one: string, many = `${one}s`) => (count === 0 ? 'None' : `${count} ${count === 1 ? one : many}`);

/** Everything that never leaves the phone (never backed up, even with an account). */
export function onPhoneRows(x: InventoryInput): InventoryRow[] {
  return [
    { id: 'voice', label: 'Voice recordings', value: n(x.voiceRecordings, 'recording') },
    { id: 'chat', label: 'YourGoGirl chat', value: n(x.chatMessages, 'message') },
    { id: 'pad', label: 'Pad Care', value: x.padTimerOn ? `Timer on · ${n(x.padChanges, 'change')}` : n(x.padChanges, 'change') },
    { id: 'sos', label: 'SOS trusted contact', value: x.trustedContact ? 'Saved' : 'None' },
    { id: 'lock', label: 'App-lock PIN', value: x.appLockOn ? 'On' : 'Off' },
    { id: 'settings', label: 'Settings and reminders', value: 'This phone' },
    { id: 'reports', label: 'Anonymous reports waiting to send', value: x.reportsWaiting ? String(x.reportsWaiting) : 'None' },
  ];
}

/** What is backed up to her account (with an account; otherwise it stays on the phone too). */
export function backedUpRows(x: InventoryInput): InventoryRow[] {
  return [
    { id: 'periods', label: 'Period dates', value: n(x.periods, 'period') },
    { id: 'logs', label: 'Daily logs (mood, pain, flow, check-ins)', value: n(x.logs, 'log') },
    { id: 'journal', label: 'Journal text (not the audio)', value: n(x.journalText, 'entry', 'entries') },
    { id: 'sleep', label: 'Sleep', value: n(x.sleepLogs, 'night') },
    { id: 'care', label: 'Care team contacts', value: n(x.careContacts, 'contact') },
    { id: 'answers', label: 'Your answers and health check', value: x.answersSaved ? 'Saved' : 'None yet' },
    {
      id: 'dashboards',
      label: 'Study, fitness, games, PCOS and confidence',
      value: n(x.studySessions + x.exams + x.workouts + x.gamesPlayed + x.pcosCheckins + x.proudMoments, 'item'),
    },
  ];
}

/** Things SheSync does not collect at all. */
export const NEVER_ROWS: InventoryRow[] = [
  { id: 'location', label: 'Your location', value: 'Never' },
  { id: 'contacts', label: 'Your phone’s contacts list', value: 'Never' },
  { id: 'adid', label: 'Advertising ID', value: 'Blocked' },
  { id: 'trackers', label: 'Ad, analytics or tracking SDKs', value: 'None' },
];
