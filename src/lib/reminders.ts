// ============================================================
// Settings → Reminders: a daily check-in nudge and a discreet heads-up two
// days before the predicted period. Local notifications only (no server, no
// push token), like the pad change reminders. The wording never says
// "period" on the lock screen.
// ============================================================
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
// Enums imported by name: eslint-plugin-import cannot see them through the namespace.
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { ensureReminderPermission, remindersSupported } from '@/lib/padReminders';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAppStore } from '@/store/useAppStore';

const CHECKIN_ID = 'shesync-checkin-daily';
const PERIOD_ID = 'shesync-period-soon';
const CHANNEL_ID = 'reminders';
export const CHECKIN_URL = '/check-in';
export const PERIOD_URL = '/log-cycle';

import { periodReminderAt } from './reminderTimes';

export { periodReminderAt, hourLabel, REMINDER_HOURS } from './reminderTimes';

let channelReady: Promise<void> | null = null;
function channel(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (!channelReady) {
    channelReady = Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Check-in and cycle reminders',
      importance: AndroidImportance.DEFAULT,
    }).then(() => undefined);
  }
  return channelReady;
}

export async function cancelReminders(): Promise<void> {
  if (!remindersSupported) return;
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(CHECKIN_ID).catch(() => {}),
    Notifications.cancelScheduledNotificationAsync(PERIOD_ID).catch(() => {}),
  ]);
}

async function doSync(): Promise<void> {
  if (!remindersSupported) return;
  await cancelReminders();
  const { checkInReminder, checkInReminderHour, periodReminder } = useSettingsStore.getState();
  const app = useAppStore.getState();
  const signedIn = app.isAuthenticated || app.isGuest;
  if (!signedIn || (!checkInReminder && !periodReminder)) return;
  const perm = await Notifications.getPermissionsAsync().catch(() => null);
  if (!perm?.granted && perm?.ios?.status !== IosAuthorizationStatus.PROVISIONAL) return;
  await channel();

  if (checkInReminder) {
    await Notifications.scheduleNotificationAsync({
      identifier: CHECKIN_ID,
      content: { title: 'How are you today? 🌸', body: 'A 10-second check-in keeps your patterns accurate.', data: { url: CHECKIN_URL } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: checkInReminderHour, minute: 0, channelId: CHANNEL_ID },
    });
  }
  const at = periodReminder ? periodReminderAt(app.cyclePrediction?.daysUntilNextPeriod, !!app.cycle.hasCycleData) : null;
  if (at) {
    await Notifications.scheduleNotificationAsync({
      identifier: PERIOD_ID,
      // Discreet: nothing on the lock screen says what it is about.
      content: { title: 'A gentle heads-up from SheSync', body: 'Something to plan for in the next few days — tap to see.', data: { url: PERIOD_URL } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
    });
  }
}

let queue: Promise<void> = Promise.resolve();

/** Re-schedules both reminders from the current settings and prediction. Safe to call often. */
export function syncReminders(): Promise<void> {
  queue = queue.then(doSync, doSync).catch((e) => console.warn('[Reminders] could not schedule', e));
  return queue;
}

/** Turning a reminder on asks for notification permission first. Returns false if it was refused. */
export async function enableReminder(kind: 'checkIn' | 'period'): Promise<boolean> {
  const perm = await ensureReminderPermission();
  if (perm !== 'granted') return false;
  if (kind === 'checkIn') useSettingsStore.getState().setCheckInReminder(true);
  else useSettingsStore.getState().setPeriodReminder(true);
  await syncReminders();
  return true;
}
