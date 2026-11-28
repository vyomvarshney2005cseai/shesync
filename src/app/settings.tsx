import { AuthGate } from '@/components/common/AuthGate';
import React, { useRef, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { Theme, createStyles } from '@/constants/theme';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Button, Chip, GroupLabel, ListGroup, ListRow, SwitchRow } from '@/components/ds';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useLockStore } from '@/store/useLockStore';
import { usePadCareStore } from '@/store/usePadCareStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteAccountAndData, flushCloudSync, signOutAndClear, useSyncStatus } from '@/lib/sync';
import { ROUTES } from '@/lib/routes';
import { remindersSupported, syncPadReminders, ensureReminderPermission, openNotificationSettings } from '@/lib/padReminders';
import { REMINDER_HOURS, enableReminder, hourLabel } from '@/lib/reminders';
import { backupSummary } from '@/lib/privacySummary';

export type SettingsSection = 'account' | 'privacy' | 'reminders' | 'data' | 'about';

/** Native Alert on phones, window.confirm on web. */
function confirm(title: string, msg: string, action: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${msg}`)) onYes();
    return;
  }
  Alert.alert(title, msg, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onYes },
  ]);
}

function notify(title: string, msg: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${msg}`);
  } else Alert.alert(title, msg);
}

/**
 * Settings, in five sections: Account, Privacy, Reminders, Data, About.
 * /settings?section=privacy opens it scrolled to that section.
 */
/** Signed-out visitors (for example from a link) go to the welcome screen. */
export default function SettingsScreen() {
  return (
    <AuthGate>
      <SettingsScreenContent />
    </AuthGate>
  );
}

function SettingsScreenContent() {
  const { section } = useLocalSearchParams<{ section?: SettingsSection }>();
  const scroller = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [jumped, setJumped] = useState(false);
  const jump = (id: SettingsSection, e: LayoutChangeEvent) => {
    if (id === section && !jumped) {
      setJumped(true);
      scroller.current?.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - 8), animated: false });
    }
  };

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView ref={scroller} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.column}>
            <ScreenHeader title="Settings" subtitle="Account, privacy, reminders, your data and about Unnmegh." fallbackHref="/profile" />
            <View onLayout={(e) => jump('account', e)}>
              <AccountSection />
            </View>
            <View onLayout={(e) => jump('privacy', e)}>
              <PrivacySection />
            </View>
            <View onLayout={(e) => jump('reminders', e)}>
              <RemindersSection />
            </View>
            <View onLayout={(e) => jump('data', e)}>
              <DataSection />
            </View>
            <View onLayout={(e) => jump('about', e)}>
              <AboutSection />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

function AccountSection() {
  const userName = useAppStore((s) => s.userName);
  const userEmail = useAppStore((s) => s.userEmail);
  const isGuest = useAppStore((s) => s.isGuest);
  const isOfflineAccount = useAppStore((s) => s.isOfflineAccount);
  const sync = useSyncStatus();
  const [busy, setBusy] = useState<'signout' | 'delete' | null>(null);
  const backedUp = sync.state === 'idle' && !!sync.lastSyncedAt;

  const status = isGuest
    ? 'No account · everything stays on this phone'
    : isOfflineAccount || !isSupabaseConfigured
    ? 'Account on this phone only · not backed up'
    : userEmail ?? 'Signed in';

  const signOut = () =>
    confirm(
      isGuest ? 'Leave and delete everything?' : 'Sign out of Unnmegh?',
      isGuest
        ? 'You are using Unnmegh without an account, so this deletes everything you logged on this phone. Create an account first to keep it.'
        : backedUp || sync.state === 'syncing'
        ? 'Your data is backed up and comes back when you sign in again. It is removed from this device.'
        : 'For your privacy, signing out removes your logs, cycles and dashboard data from this device.',
      isGuest ? 'Delete' : 'Sign out',
      () => {
        setBusy('signout');
        signOutAndClear()
          .catch((err) => console.warn('Sign out error', err))
          .finally(() => setBusy(null));
      }
    );

  const deleteAccount = () =>
    confirm(
      'Delete your account?',
      'This permanently deletes your account and all your Unnmegh data' +
        (isOfflineAccount || !isSupabaseConfigured ? ' on this device.' : ', on this device and in the cloud.') +
        ' This cannot be undone.',
      'Delete',
      () => {
        setBusy('delete');
        deleteAccountAndData()
          .catch(() => notify('Could not delete', 'Check your internet connection and try again. Nothing was deleted.'))
          .finally(() => setBusy(null));
      }
    );

  return (
    <>
      <GroupLabel icon="account" tone="rose">
        Account
      </GroupLabel>
      <ListGroup>
        <ListRow icon="profile" tone="rose" title={userName || (isGuest ? 'Trying Unnmegh' : 'You')} subtitle={status} />
        {isGuest ? (
          <ListRow icon="cloud" tone="lilac" title="Create an account" subtitle="Back up what you have logged — nothing is lost" onPress={() => router.push('/signup')} />
        ) : null}
        <ListRow
          icon="logout"
          tone="neutral"
          title={busy === 'signout' ? 'Signing out…' : isGuest ? 'Leave and delete data' : 'Sign out'}
          onPress={busy ? undefined : signOut}
          testID="settings-sign-out"
        />
        {!isGuest ? (
          <ListRow icon="trash" danger title={busy === 'delete' ? 'Deleting…' : 'Delete account'} subtitle="Removes your account and all your data" onPress={busy ? undefined : deleteAccount} />
        ) : null}
      </ListGroup>
    </>
  );
}

function PrivacySection() {
  const lockOn = useLockStore((s) => s.enabled);
  const crashReports = useSettingsStore((s) => s.crashReports);
  const setCrashReports = useSettingsStore((s) => s.setCrashReports);
  return (
    <>
      <GroupLabel icon="privacy" tone="mint">
        Privacy
      </GroupLabel>
      <ListGroup>
        <ListRow
          icon="eye"
          tone="mint"
          title="Privacy dashboard"
          subtitle="What is on this phone, what is backed up, last backup"
          onPress={() => router.push('/privacy-dashboard' as Href)}
          testID="settings-privacy-dashboard"
        />
        <ListRow icon="lock" tone="lilac" title="App lock" value={lockOn ? 'On' : 'Off'} subtitle="PIN or fingerprint / Face ID" onPress={() => router.push(ROUTES.appLock)} />
        <SwitchRow
          icon="update"
          tone="sky"
          title="Send anonymous crash reports"
          subtitle="Only the error and app version, to Unnmegh’s own server. No ad or tracking SDKs."
          value={crashReports}
          onValueChange={setCrashReports}
          testID="settings-crash-reports"
        />
        <ListRow icon="healthCheck" tone="rose" title="Our privacy promise" subtitle="Three lines, in plain words" onPress={() => router.push(ROUTES.privacy)} />
      </ListGroup>
    </>
  );
}

function RemindersSection() {
  const padOn = usePadCareStore((s) => s.remindersOn);
  const setPadOn = usePadCareStore((s) => s.setRemindersOn);
  const checkIn = useSettingsStore((s) => s.checkInReminder);
  const checkInHour = useSettingsStore((s) => s.checkInReminderHour);
  const setCheckIn = useSettingsStore((s) => s.setCheckInReminder);
  const period = useSettingsStore((s) => s.periodReminder);
  const setPeriod = useSettingsStore((s) => s.setPeriodReminder);
  const calm = useAppStore((s) => s.fineTuningSettings.pmddEarlyShield);
  const updateFineTuning = useAppStore((s) => s.updateFineTuningSettings);
  const hasCycleData = useAppStore((s) => !!s.cycle.hasCycleData);
  const [blocked, setBlocked] = useState(false);

  const toggle = async (kind: 'checkIn' | 'period' | 'pad', on: boolean) => {
    if (!on) {
      if (kind === 'checkIn') setCheckIn(false);
      else if (kind === 'period') setPeriod(false);
      else {
        setPadOn(false);
        void syncPadReminders();
      }
      return;
    }
    if (kind === 'pad') {
      const perm = await ensureReminderPermission();
      if (perm !== 'granted') return setBlocked(perm === 'denied');
      setPadOn(true);
      void syncPadReminders();
      return;
    }
    const ok = await enableReminder(kind);
    if (!ok) setBlocked(true);
  };

  return (
    <>
      <GroupLabel icon="bell" tone="amber">
        Reminders
      </GroupLabel>
      <ListGroup>
        <SwitchRow
          icon="checkIn"
          tone="rose"
          title="Daily check-in"
          subtitle={checkIn ? `Every day at ${hourLabel(checkInHour)}` : 'A gentle nudge for the 10-second check-in'}
          value={checkIn}
          onValueChange={(on) => void toggle('checkIn', on)}
          disabled={!remindersSupported}
          testID="settings-checkin-reminder"
        />
        {checkIn ? (
          <View style={styles.hours} accessibilityLabel="Reminder time">
            {REMINDER_HOURS.map((h) => (
              <Chip key={h} label={hourLabel(h)} small selected={checkInHour === h} onPress={() => setCheckIn(true, h)} accessibilityRole="radio" />
            ))}
          </View>
        ) : null}
        <SwitchRow
          icon="calendar"
          tone="lilac"
          title="Heads-up before your period"
          subtitle={hasCycleData ? 'Two days before, at 9 am. The notification doesn’t say “period”.' : 'Add your period dates first'}
          value={period}
          onValueChange={(on) => void toggle('period', on)}
          disabled={!remindersSupported}
          testID="settings-period-reminder"
        />
        <SwitchRow
          icon="padCare"
          tone="rose"
          title="Pad change reminders"
          subtitle="When the Pad Care timer is running"
          value={padOn}
          onValueChange={(on) => void toggle('pad', on)}
          disabled={!remindersSupported}
        />
        <SwitchRow
          icon="lotus"
          tone="mint"
          title="Pre-period calm suggestions"
          subtitle="Extra calming ideas in the app the week before your period"
          value={calm}
          onValueChange={(on) => updateFineTuning({ pmddEarlyShield: on })}
        />
      </ListGroup>
      {!remindersSupported ? (
        <Text style={styles.note}>Reminders work in the Unnmegh phone app. On the web, the timers still run while the page is open.</Text>
      ) : blocked ? (
        <View style={styles.blocked}>
          <Text style={styles.note}>Notifications are turned off for Unnmegh on this phone.</Text>
          <Button variant="link" title="Open phone settings" onPress={openNotificationSettings} />
        </View>
      ) : null}
    </>
  );
}

function DataSection() {
  const isGuest = useAppStore((s) => s.isGuest);
  const isOfflineAccount = useAppStore((s) => s.isOfflineAccount);
  const userEmail = useAppStore((s) => s.userEmail);
  const sync = useSyncStatus();
  const b = backupSummary({ guest: isGuest, onDevice: isOfflineAccount || !isSupabaseConfigured, state: sync.state, lastSyncedAt: sync.lastSyncedAt });
  const [busy, setBusy] = useState(false);
  const backUpNow = async () => {
    setBusy(true);
    const ok = await flushCloudSync(15000).catch(() => false);
    setBusy(false);
    if (!ok) notify('Not backed up yet', 'Check your internet connection. Unnmegh keeps trying in the background.');
  };

  return (
    <>
      <GroupLabel icon="data" tone="sky">
        Data
      </GroupLabel>
      <ListGroup>
        <ListRow icon={b.ok ? 'cloud' : 'cloudOff'} tone={b.ok ? 'mint' : 'neutral'} title={b.title} subtitle={b.detail} testID="settings-backup-status" />
        {b.canBackUp ? (
          <View style={styles.rowAction}>
            <Button variant="secondary" size="sm" title={busy ? 'Backing up' : 'Back up now'} loading={busy} onPress={() => void backUpNow()} />
          </View>
        ) : b.needsSignIn ? (
          <View style={styles.rowAction}>
            <Button
              variant="secondary"
              size="sm"
              title={isGuest ? 'Create an account' : 'Sign in again'}
              onPress={() => (isGuest ? router.push('/signup') : router.push({ pathname: '/login', params: { email: userEmail ?? '' } }))}
            />
          </View>
        ) : null}
        <ListRow icon="exportData" tone="sky" title="Export or import" subtitle="Backup file, CSV, or bring data from Flo / Clue" onPress={() => router.push(ROUTES.data)} />
        <ListRow icon="eye" tone="mint" title="See everything Unnmegh keeps" subtitle="Privacy dashboard" onPress={() => router.push('/privacy-dashboard' as Href)} />
      </ListGroup>
    </>
  );
}

function AboutSection() {
  const version = String(Constants.expoConfig?.version ?? '1.0.0');
  const [checking, setChecking] = useState(false);
  const updateId = Updates.isEnabled ? Updates.updateId : null;
  const channel = Updates.isEnabled ? Updates.channel : null;

  const checkForUpdate = async () => {
    if (!Updates.isEnabled) {
      notify('Updates', 'This build updates from the app store (or the dev server).');
      return;
    }
    setChecking(true);
    try {
      const r = await Updates.checkForUpdateAsync();
      if (r.isAvailable) {
        await Updates.fetchUpdateAsync();
        notify('Update ready', 'A small fix has downloaded. Tap “Restart” on the banner to use it.');
      } else notify('You’re up to date', 'No new fixes right now.');
    } catch {
      notify('Could not check', 'Check your internet connection and try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <GroupLabel icon="about" tone="lilac">
        About
      </GroupLabel>
      <ListGroup>
        <ListRow
          icon="about"
          tone="lilac"
          title={`Unnmegh ${version}`}
          subtitle={updateId ? `Update ${updateId.slice(0, 8)}${channel ? ` · ${channel}` : ''}` : 'Your period & wellbeing companion'}
        />
        <ListRow icon="update" tone="sky" title={checking ? 'Checking…' : 'Check for updates'} subtitle="Small fixes arrive without an app-store update" onPress={checking ? undefined : () => void checkForUpdate()} />
        <ListRow
          icon="healthCheck"
          tone="mint"
          title="Not a medical device"
          subtitle="Unnmegh helps you notice patterns and prepare for a doctor. In an emergency, call 112."
        />
        <ListRow icon="sparkle" tone="peach" title="Made for Unnmegh" subtitle="Icons, sounds and the YourGoGirl knowledge base are our own work." />
        <ListRow icon="mail" tone="rose" title="Tele-MANAS (free, 24×7)" subtitle="Mental health support · 14416" onPress={() => void Linking.openURL('tel:14416')} />
      </ListGroup>
      <View style={{ height: Theme.space.xxxl }} />
    </>
  );
}

const styles = createStyles(() => ({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: Theme.space.xxxl },
  column: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: Theme.space.md },
  hours: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.space.xs,
    paddingHorizontal: Theme.space.md,
    paddingBottom: Theme.space.sm,
    paddingLeft: 68,
    backgroundColor: Theme.colors.card,
  },
  rowAction: { paddingHorizontal: Theme.space.md, paddingBottom: Theme.space.sm, paddingLeft: 68, backgroundColor: Theme.colors.card, alignItems: 'flex-start' },
  note: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: Theme.space.xs, paddingHorizontal: Theme.space.xxs },
  blocked: { marginTop: Theme.space.xxs },
}));
