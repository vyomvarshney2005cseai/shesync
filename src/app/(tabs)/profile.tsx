import React from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Theme, createStyles } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore, type NightMode } from '@/store/useSettingsStore';
import { useSafetyStore } from '@/store/useSafetyStore';
import { ROUTES } from '@/lib/routes';
import { pauseAppLock } from '@/lib/appLock';
import { ASSESSMENT_QUESTIONS } from '@/constants/assessment';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSyncStatus } from '@/lib/sync';
import { backupSummary } from '@/lib/privacySummary';
import { FocusAreasCard } from '@/components/home/FocusAreasCard';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { Stepper } from '@/components/common/ui';
import { BrandIcon } from '@/components/icons/BrandIcon';
import { Button, Card, Chip, GroupLabel, ListGroup, ListRow, SwitchRow } from '@/components/ds';
import type { SettingsSection } from '@/app/settings';

const APPEARANCE: { id: NightMode; label: string }[] = [
  { id: 'off', label: 'Light' },
  { id: 'system', label: 'Match phone' },
  { id: 'on', label: 'Dark' },
  { id: 'auto', label: 'Dark at night' },
];

const SETTINGS_ROWS: { id: SettingsSection; title: string; subtitle: string; icon: 'account' | 'privacy' | 'bell' | 'data' | 'about'; tone: 'rose' | 'mint' | 'amber' | 'sky' | 'lilac' }[] = [
  { id: 'account', title: 'Account', subtitle: 'Sign in, sign out, delete account', icon: 'account', tone: 'rose' },
  { id: 'privacy', title: 'Privacy', subtitle: 'Privacy dashboard, app lock, crash reports', icon: 'privacy', tone: 'mint' },
  { id: 'reminders', title: 'Reminders', subtitle: 'Check-in, period heads-up, pad changes', icon: 'bell', tone: 'amber' },
  { id: 'data', title: 'Data', subtitle: 'Backup, export and import', icon: 'data', tone: 'sky' },
  { id: 'about', title: 'About', subtitle: 'Version, updates, how Unnmegh helps', icon: 'about', tone: 'lilac' },
];

export default function ProfileScreen() {
  const userName = useAppStore((s) => s.userName);
  const userEmail = useAppStore((s) => s.userEmail);
  const userPhoto = useAppStore((s) => s.userPhoto);
  const updateUserPhoto = useAppStore((s) => s.updateUserPhoto);
  const assessmentAnswers = useAppStore((s) => s.assessmentAnswers);
  const fineTuningSettings = useAppStore((s) => s.fineTuningSettings);
  const updateFineTuningSettings = useAppStore((s) => s.updateFineTuningSettings);
  const generateClinicalPDF = useAppStore((s) => s.generateClinicalPDF);
  const isOfflineAccount = useAppStore((s) => s.isOfflineAccount);
  const isGuest = useAppStore((s) => s.isGuest);
  const trusted = useSafetyStore((s) => s.trusted);
  const nightMode = useSettingsStore((s) => s.nightMode);
  const setNightMode = useSettingsStore((s) => s.setNightMode);
  const sync = useSyncStatus();

  const answeredCount = Object.keys(assessmentAnswers).length;
  const initial = (userName || 'S').charAt(0).toUpperCase();
  const backup = backupSummary({ guest: isGuest, onDevice: isOfflineAccount || !isSupabaseConfigured, state: sync.state, lastSyncedAt: sync.lastSyncedAt });

  const handlePickImage = async () => {
    pauseAppLock(); // the photo picker is not "leaving" Unnmegh
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (!result.canceled) updateUserPhoto(result.assets[0].uri);
  };

  const openSettings = (section?: SettingsSection) =>
    router.push((section ? { pathname: '/settings', params: { section } } : '/settings') as Href);

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.column}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle} accessibilityRole="header">
                Profile
              </Text>
              <Button
                variant="secondary"
                size="sm"
                iconOnly
                accessibilityLabel="Settings"
                icon={<BrandIcon name="settings" size={22} color={Theme.colors.textPrimary} accent={Theme.colors.primary} />}
                onPress={() => openSettings()}
                style={styles.round}
                testID="profile-settings"
              />
            </View>

            {/* Who she is + backup at a glance */}
            <Card padding="lg">
              <View style={styles.identityRow}>
                <Pressable
                  onPress={handlePickImage}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                  style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.85 }]}
                >
                  {userPhoto ? <Image source={{ uri: userPhoto }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initial}</Text>}
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{userName || (isGuest ? 'Trying Unnmegh' : 'You')}</Text>
                  <Text style={styles.email}>{isGuest ? 'No account · everything stays on this phone' : userEmail || 'On this phone'}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => openSettings('data')}
                accessibilityRole="button"
                accessibilityLabel={`${backup.title}. ${backup.detail}`}
                style={({ pressed }) => [styles.backupPill, !backup.ok && styles.backupPillOff, pressed && { opacity: 0.85 }]}
              >
                <BrandIcon name={backup.ok ? 'cloud' : 'cloudOff'} size={20} color={backup.ok ? Theme.colors.strainOptimal : Theme.colors.textSecondary} />
                <Text style={[styles.backupText, !backup.ok && styles.backupTextOff]} numberOfLines={1}>
                  {backup.title}
                </Text>
              </Pressable>
              {isGuest ? <Button title="Create an account" onPress={() => router.push('/signup')} fullWidth style={{ marginTop: Theme.space.sm }} /> : null}
            </Card>

            <GroupLabel icon="sparkle" tone="lilac">
              Your Unnmegh
            </GroupLabel>
            <Card tone="lilac">
              <Text style={styles.eyebrow}>YOUR RESULT</Text>
              <Text style={styles.archetypeName}>{fineTuningSettings.archetypeName}</Text>
              <Text style={styles.archetypeDesc}>{fineTuningSettings.archetypeDescription}</Text>
            </Card>
            <ListGroup style={{ marginTop: Theme.space.sm }}>
              <ListRow
                icon="report"
                tone="rose"
                title="Health assessment"
                subtitle={answeredCount > 0 ? `${answeredCount}/${ASSESSMENT_QUESTIONS.length} questions answered` : `${ASSESSMENT_QUESTIONS.length} quick questions`}
                value={answeredCount > 0 ? 'Review' : 'Start'}
                onPress={() => router.push('/assessment' as Href)}
              />
              <ListRow
                icon="sos"
                tone="danger"
                title="SOS"
                subtitle={trusted ? `One-tap call: ${trusted.name} or Tele-MANAS 14416` : 'Add someone you trust for one-tap calls'}
                onPress={() => router.push(ROUTES.sos)}
              />
              <ListRow
                icon="report"
                tone="lilac"
                title="Doctor report (PDF)"
                subtitle="Your last 90 days for your gynaecologist"
                onPress={() => {
                  generateClinicalPDF();
                  router.push('/(tabs)/report' as Href);
                }}
              />
            </ListGroup>
            <View style={{ height: Theme.space.sm }} />
            <FocusAreasCard mode="profile" />

            <GroupLabel icon="appearance" tone="amber">
              Preferences
            </GroupLabel>
            <Card>
              <Text style={styles.prefLabel}>Appearance</Text>
              <Text style={styles.prefHelp}>Dark is a calm slate screen. “Dark at night” switches from 9 pm to 6 am.</Text>
              <View style={styles.chips}>
                {APPEARANCE.map((o) => (
                  <Chip key={o.id} label={o.label} selected={nightMode === o.id} onPress={() => setNightMode(o.id)} accessibilityRole="radio" small />
                ))}
              </View>

              <Text style={[styles.prefLabel, styles.prefGap]}>Workout intensity</Text>
              <View style={styles.chips}>
                {(['gentle', 'balanced', 'dynamic'] as const).map((level) => (
                  <Chip
                    key={level}
                    label={level.charAt(0).toUpperCase() + level.slice(1)}
                    selected={fineTuningSettings.strainSensitivity === level}
                    onPress={() => updateFineTuningSettings({ strainSensitivity: level })}
                    accessibilityRole="radio"
                    small
                  />
                ))}
              </View>

              <Text style={[styles.prefLabel, styles.prefGap]}>Calming practice</Text>
              <View style={styles.chips}>
                {(
                  [
                    ['somatic', 'Body calm'],
                    ['cbt', 'Reframing'],
                    ['breathwork', 'Breathing'],
                  ] as const
                ).map(([mode, label]) => (
                  <Chip
                    key={mode}
                    label={label}
                    selected={fineTuningSettings.preferredTherapy === mode}
                    onPress={() => updateFineTuningSettings({ preferredTherapy: mode })}
                    accessibilityRole="radio"
                    small
                  />
                ))}
              </View>

              <View style={[styles.sleepRow, styles.prefGap]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefLabel}>Sleep goal</Text>
                  <Text style={styles.prefHelp}>Used for the sleep card and your strain score.</Text>
                </View>
                <Stepper
                  label="Sleep goal"
                  value={fineTuningSettings.dailySleepTargetHours}
                  onChange={(v) => updateFineTuningSettings({ dailySleepTargetHours: v })}
                  min={6}
                  max={10}
                  step={0.5}
                  format={(v) => `${v}h`}
                />
              </View>
            </Card>
            <ListGroup style={{ marginTop: Theme.space.sm }}>
              <SwitchRow
                icon="fitness"
                tone="mint"
                title="Gentler workouts on hard days"
                subtitle="Swaps intense sessions for gentle ones when your strain is high"
                value={fineTuningSettings.autoCortisolOverride}
                onValueChange={(val) => updateFineTuningSettings({ autoCortisolOverride: val })}
              />
            </ListGroup>

            <GroupLabel icon="settings" tone="neutral">
              Settings
            </GroupLabel>
            <ListGroup>
              {SETTINGS_ROWS.map((r) => (
                <ListRow key={r.id} icon={r.icon} tone={r.tone} title={r.title} subtitle={r.subtitle} onPress={() => openSettings(r.id)} testID={`profile-settings-${r.id}`} />
              ))}
            </ListGroup>
            <View style={{ height: Theme.space.xxxl }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = createStyles(() => ({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: 96 },
  column: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: Theme.space.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Theme.space.sm, paddingBottom: Theme.space.md },
  headerTitle: { ...Theme.type.h1, color: Theme.colors.textPrimary, letterSpacing: -0.5 },
  round: { borderRadius: Theme.radius.full, borderColor: Theme.colors.cardBorder },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.space.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 64, height: 64 },
  avatarText: { ...Theme.type.h2, color: Theme.colors.onPrimary },
  name: { ...Theme.type.h3, color: Theme.colors.textPrimary },
  email: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 2 },
  backupPill: {
    marginTop: Theme.space.md,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.space.xs,
    paddingHorizontal: Theme.space.sm,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.successLight,
  },
  backupPillOff: { backgroundColor: Theme.colors.backgroundMuted },
  backupText: { ...Theme.type.label, color: Theme.colors.strainOptimal, flexShrink: 1 },
  backupTextOff: { color: Theme.colors.textSecondary },
  eyebrow: { ...Theme.type.caption, fontWeight: '800', letterSpacing: 0.6, color: Theme.colors.secondaryDark },
  archetypeName: { ...Theme.type.h3, color: Theme.colors.textPrimary, marginTop: 4 },
  archetypeDesc: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 4 },
  prefLabel: { ...Theme.type.label, fontSize: 16, lineHeight: 22, color: Theme.colors.textPrimary },
  prefHelp: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 2 },
  prefGap: { marginTop: Theme.space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.space.xs, marginTop: Theme.space.sm },
  sleepRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.space.sm },
}));
