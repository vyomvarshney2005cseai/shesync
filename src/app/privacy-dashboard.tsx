import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Theme, createStyles } from '@/constants/theme';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Button, Card, GroupLabel, IconBadge, ListGroup, ListRow } from '@/components/ds';
import { useAppStore } from '@/store/useAppStore';
import { usePadCareStore } from '@/store/usePadCareStore';
import { useSafetyStore } from '@/store/useSafetyStore';
import { useLockStore } from '@/store/useLockStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useFitnessStore } from '@/store/useFitnessStore';
import { useGamesStore } from '@/store/useGamesStore';
import { usePcosStore } from '@/store/usePcosStore';
import { useConfidenceStore } from '@/store/useConfidenceStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { flushCloudSync, useSyncStatus } from '@/lib/sync';
import { pendingReports } from '@/lib/anonymousReports';
import { ROUTES } from '@/lib/routes';
import { NEVER_ROWS, backedUpRows, backupSummary, onPhoneRows, type InventoryInput } from '@/lib/privacySummary';

/** What is on this phone, what is backed up, and when it was last backed up. */
export default function PrivacyDashboardScreen() {
  const logs = useAppStore((s) => s.symptomLogs);
  const periods = useAppStore((s) => s.pastCycles.length);
  const sleepLogs = useAppStore((s) => s.sleepLogs.length);
  const careContacts = useAppStore((s) => s.careContacts.length);
  const chatMessages = useAppStore((s) => s.yourGoGirlMessages.filter((m) => m.id !== 'welcome-yourgogirl').length);
  const answersSaved = useAppStore((s) => s.isAssessmentCompleted || s.healthCheckCompleted);
  const isGuest = useAppStore((s) => s.isGuest);
  const isOfflineAccount = useAppStore((s) => s.isOfflineAccount);
  const padChanges = usePadCareStore((s) => s.changes.length);
  const padTimerOn = usePadCareStore((s) => s.active !== null);
  const trustedContact = useSafetyStore((s) => !!s.trusted);
  const appLockOn = useLockStore((s) => s.enabled);
  const studySessions = useStudyStore((s) => s.sessions.length);
  const exams = useStudyStore((s) => s.exams.length);
  const workouts = useFitnessStore((s) => s.sessions.length);
  const gamesPlayed = useGamesStore((s) => s.records.length);
  const pcosCheckins = usePcosStore((s) => s.checkins.length);
  const proudMoments = useConfidenceStore((s) => s.proud.length);
  const sync = useSyncStatus();
  const [reportsWaiting, setReportsWaiting] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    pendingReports()
      .then((n) => alive && setReportsWaiting(n))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const inventory: InventoryInput = useMemo(
    () => ({
      periods,
      logs: logs.length,
      journalText: logs.filter((l) => l.voiceJournal && (l.notes ?? '').trim()).length,
      voiceRecordings: logs.filter((l) => !!l.audioFile).length,
      sleepLogs,
      careContacts,
      chatMessages,
      padChanges,
      padTimerOn,
      trustedContact,
      appLockOn,
      answersSaved,
      studySessions,
      exams,
      workouts,
      gamesPlayed,
      pcosCheckins,
      proudMoments,
      reportsWaiting,
    }),
    [periods, logs, sleepLogs, careContacts, chatMessages, padChanges, padTimerOn, trustedContact, appLockOn, answersSaved, studySessions, exams, workouts, gamesPlayed, pcosCheckins, proudMoments, reportsWaiting]
  );
  const onDevice = isOfflineAccount || !isSupabaseConfigured;
  const backup = backupSummary({ guest: isGuest, onDevice, state: sync.state, lastSyncedAt: sync.lastSyncedAt });

  const backUpNow = async () => {
    setBusy(true);
    await flushCloudSync(15000).catch(() => false);
    setBusy(false);
  };

  return (
    <Screen>
      <ScreenHeader title="Privacy dashboard" subtitle="What SheSync keeps, where it lives, and when it was last backed up." fallbackHref="/settings" />

      <Card tone={backup.ok ? 'mint' : 'default'} testID="privacy-backup-card">
        <View style={styles.backupRow}>
          <IconBadge name={backup.ok ? 'cloud' : 'cloudOff'} tone={backup.ok ? 'mint' : 'neutral'} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>LAST BACKUP</Text>
            <Text style={styles.backupTitle}>{backup.title}</Text>
            <Text style={styles.backupDetail}>{backup.detail}</Text>
          </View>
        </View>
        {backup.canBackUp ? (
          <Button variant="secondary" size="sm" title={busy ? 'Backing up' : 'Back up now'} loading={busy} onPress={() => void backUpNow()} style={styles.backupAction} />
        ) : isGuest ? (
          <Button size="sm" title="Create an account to back up" onPress={() => router.push('/signup')} style={styles.backupAction} />
        ) : null}
      </Card>

      <GroupLabel icon="phone" tone="rose">
        On this phone only
      </GroupLabel>
      <Text style={styles.caption}>Never backed up, even with an account. Signing out deletes it.</Text>
      <ListGroup>
        {onPhoneRows(inventory).map((r) => (
          <ListRow key={r.id} title={r.label} value={r.value} accessibilityLabel={`${r.label}: ${r.value}`} />
        ))}
      </ListGroup>

      <GroupLabel icon="cloud" tone="mint">
        {isGuest || onDevice ? 'Backed up with an account' : 'Backed up to your account'}
      </GroupLabel>
      <Text style={styles.caption}>
        {isGuest || onDevice
          ? 'Right now these stay on this phone too. With an online account they are backed up over an encrypted connection.'
          : 'Sent over an encrypted connection; only you can read them. Delete your account to remove them everywhere.'}
      </Text>
      <ListGroup>
        {backedUpRows(inventory).map((r) => (
          <ListRow key={r.id} title={r.label} value={r.value} accessibilityLabel={`${r.label}: ${r.value}`} />
        ))}
      </ListGroup>

      <GroupLabel icon="privacy" tone="lilac">
        Never collected
      </GroupLabel>
      <ListGroup>
        {NEVER_ROWS.map((r) => (
          <ListRow key={r.id} title={r.label} value={r.value} accessibilityLabel={`${r.label}: ${r.value}`} />
        ))}
      </ListGroup>

      <View style={styles.actions}>
        <Button variant="secondary" title="Export or delete my data" onPress={() => router.push(ROUTES.data)} fullWidth />
        <Button variant="link" title="Read our privacy promise" onPress={() => router.push(ROUTES.privacy)} style={styles.link} />
      </View>
    </Screen>
  );
}

const styles = createStyles(() => ({
  backupRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.space.sm },
  eyebrow: { ...Theme.type.caption, fontWeight: '800', letterSpacing: 0.6, color: Theme.colors.textSecondary },
  backupTitle: { ...Theme.type.title, color: Theme.colors.textPrimary, marginTop: 2 },
  backupDetail: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 2 },
  backupAction: { marginTop: Theme.space.md, alignSelf: 'flex-start' },
  caption: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginBottom: Theme.space.xs, paddingHorizontal: Theme.space.xxs },
  actions: { marginTop: Theme.space.lg, gap: Theme.space.xs, alignItems: 'center' },
  link: { alignSelf: 'center' },
}));
