// ============================================================
// Local (on-phone) reminders for the pad change timer.
//
// Uses expo-notifications local notifications: nothing is sent to a server
// and no push token is needed, so they also work in Expo Go. On web there
// are no system reminders — the timer on the Pad Care screen still runs.
//
// Two fixed identifiers are used, so re-scheduling always replaces the old
// reminders and sign-out can cancel them without remembering any ids.
// ============================================================
import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
// Enums imported by name: eslint-plugin-import cannot see them through the namespace.
import { AndroidImportance, AndroidNotificationVisibility, IosAuthorizationStatus } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { ROUTES } from '@/lib/routes';
import { PRODUCT_GUIDES } from '@/constants/padCare';
import { HOUR_MS, reminderHours } from '@/lib/padCare';
import { usePadCareStore } from '@/store/usePadCareStore';

// Android: the lock screen shows "SheSync" but hides what the reminder says
// until the phone is unlocked. Channel settings cannot change after creation,
// so this is a new channel; the old public one is removed.
const CHANNEL_ID = 'pad-care-private';
const OLD_CHANNEL_ID = 'pad-care';
const DUE_ID = 'shesync-pad-due';
const OVER_ID = 'shesync-pad-over';
const PAD_CARE_URL = '/pad-care';

export const remindersSupported = Platform.OS === 'ios' || Platform.OS === 'android';

let configured: Promise<void> | null = null;

/** Shows reminders while the app is open and creates the Android channel. Safe to call often. */
function configure(): Promise<void> {
  if (!remindersSupported) return Promise.resolve();
  if (!configured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    configured =
      Platform.OS === 'android'
        ? Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Pad change reminders',
            importance: AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 150, 250],
            lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
          })
            .then(() => Notifications.deleteNotificationChannelAsync(OLD_CHANNEL_ID).catch(() => undefined))
            .then(() => undefined)
        : Promise.resolve();
  }
  return configured;
}

function isAllowed(p: Notifications.NotificationPermissionsStatus): boolean {
  return p.granted || p.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}

export type PermissionResult = 'granted' | 'denied' | 'unsupported';

/** Asks for notification permission if needed. */
export async function ensureReminderPermission(): Promise<PermissionResult> {
  if (!remindersSupported) return 'unsupported';
  try {
    await configure();
    const current = await Notifications.getPermissionsAsync();
    if (isAllowed(current)) return 'granted';
    if (!current.canAskAgain) return 'denied';
    const asked = await Notifications.requestPermissionsAsync();
    return isAllowed(asked) ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/** Opens the phone's settings page for this app (to turn notifications back on). */
export function openNotificationSettings(): void {
  Linking.openSettings().catch(() => {});
}

export async function cancelPadReminders(): Promise<void> {
  if (!remindersSupported) return;
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(DUE_ID).catch(() => {}),
    Notifications.cancelScheduledNotificationAsync(OVER_ID).catch(() => {}),
  ]);
}

async function scheduleAt(identifier: string, at: number, title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, data: { url: PAD_CARE_URL }, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: CHANNEL_ID },
  });
}

async function doSync(): Promise<void> {
  if (!remindersSupported) return;
  await cancelPadReminders();
  const { remindersOn, active, intervalHours } = usePadCareStore.getState();
  if (!remindersOn || !active) return;

  await configure();
  const g = PRODUCT_GUIDES[active.product];
  const target = reminderHours(active.product, active.mode, intervalHours);
  const dueAt = active.since + target * HOUR_MS;
  const overAt = active.since + g.overHours * HOUR_MS;
  const soon = Date.now() + 30_000;
  const action = g.verb === 'empty' ? `empty your ${g.noun}` : `change your ${g.noun}`;

  if (dueAt > soon) {
    const title = active.mode === 'night' ? 'Good morning 🌸' : `Time to ${action}`;
    const body =
      active.mode === 'night'
        ? `It has been about ${target} hours — ${action} first thing.`
        : `It has been ${target} hours. A fresh one keeps rashes and infections away.`;
    await scheduleAt(DUE_ID, dueAt, title, body);
  }
  if (overAt > dueAt && overAt > soon) {
    const body =
      active.product === 'tampon'
        ? 'Take it out now — over 8 hours raises the risk of a rare but serious infection (TSS).'
        : `Please ${action} now. Open SheSync and tap “I just changed”.`;
    await scheduleAt(OVER_ID, overAt, `Over ${g.overHours} hours — ${action}`, body);
  }
}

let queue: Promise<void> = Promise.resolve();

/**
 * Re-schedules reminders from the current Pad Care state. Call after any change
 * to the timer, product, interval or the reminders switch. Calls run one at a
 * time so two quick taps cannot leave a stale reminder behind.
 */
export function syncPadReminders(): Promise<void> {
  queue = queue.then(doSync, doSync).catch((e) => {
    console.warn('[PadCare] Could not schedule reminder', e);
  });
  return queue;
}

/** Opens the right screen when a reminder is tapped. Mount once, in the root layout. */
export function usePadReminderTaps(): void {
  useEffect(() => {
    if (!remindersSupported) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      // Pad Care, the daily check-in and the cycle heads-up (Settings → Reminders).
      if (url === PAD_CARE_URL) router.push(ROUTES.padCare);
      else if (url === '/check-in' || url === '/log-cycle') router.push(url as Href);
      else return;
      // Without this, the same tap would reopen the screen on the next launch.
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    // A tap that launched the app from closed.
    Notifications.getLastNotificationResponseAsync()
      .then(open)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
}
