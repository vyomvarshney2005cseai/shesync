import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { ASSESSMENT_QUESTIONS } from '@/constants/assessment';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteAccountAndData, flushCloudSync, signOutAndClear, useSyncStatus } from '@/lib/sync';
import {
  ChevronRight,
  RefreshCw,
  LogOut,
  FileText,
  Cloud,
  CloudOff,
  Trash2,
  Sliders,
  CheckCircle2,
} from 'lucide-react-native';

import * as ImagePicker from 'expo-image-picker';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';

export default function ProfileScreen() {
  const userName = useAppStore((s) => s.userName);
  const userEmail = useAppStore((s) => s.userEmail);
  const userPhoto = useAppStore((s) => s.userPhoto);
  const updateUserPhoto = useAppStore((s) => s.updateUserPhoto);
  const assessmentAnswers = useAppStore((s) => s.assessmentAnswers);
  const fineTuningSettings = useAppStore((s) => s.fineTuningSettings);
  const updateFineTuningSettings = useAppStore((s) => s.updateFineTuningSettings);
  const isOfflineAccount = useAppStore((s) => s.isOfflineAccount);
  const sync = useSyncStatus();
  const [busy, setBusy] = useState<'signout' | 'delete' | null>(null);
  const generateClinicalPDF = useAppStore((s) => s.generateClinicalPDF);

  const answeredCount = Object.keys(assessmentAnswers).length;
  const initial = (userName || 'M').charAt(0).toUpperCase();

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      updateUserPhoto(result.assets[0].uri);
    }
  };

  const handleRetakeAssessment = () => {
    router.push('/assessment' as any);
  };

  /** Native Alert on phones, window.confirm on web. */
  const confirm = (title: string, msg: string, action: string, onYes: () => void) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${msg}`)) onYes();
      return;
    }
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: 'destructive', onPress: onYes },
    ]);
  };

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(`${title}\n\n${msg}`);
    } else Alert.alert(title, msg);
  };

  const backedUp = sync.state === 'idle' && !!sync.lastSyncedAt;

  // Clearing the session is enough: the signed-in area's AuthGate sends the
  // user to the welcome screen. (Navigating here too raced with it on web.)
  const confirmLogout = () =>
    confirm(
      'Sign out of SheSync?',
      backedUp || sync.state === 'syncing'
        ? 'Your data is backed up and comes back when you sign in again. It is removed from this device.'
        : 'For your privacy, signing out removes your logs, cycles and dashboard data from this device.',
      'Sign out',
      () => {
        setBusy('signout');
        signOutAndClear()
          .catch((err) => console.warn('Sign out error', err))
          .finally(() => setBusy(null));
      }
    );

  const confirmDelete = () =>
    confirm(
      'Delete your account?',
      'This permanently deletes your account and all your SheSync data' +
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

  const handleExportPDF = () => {
    generateClinicalPDF();
    router.push('/(tabs)/report' as any);
  };

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centeredWrapper}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </View>

        {/* Identity Card */}
        <View style={styles.identityCard}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            <View style={styles.avatarGlow}>
              <View style={styles.avatarCircle}>
                {userPhoto ? (
                  <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initial}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.identityInfo}>
            <Text style={styles.userNameText}>{userName}</Text>
            {userEmail ? <Text style={styles.userEmailText}>{userEmail}</Text> : null}
          </View>
        </View>

        {/* Bio-Adaptive Archetype Card */}
        <View style={styles.archetypeCard}>
          <Text style={styles.archetypeNameText}>{fineTuningSettings.archetypeName}</Text>
          <Text style={styles.archetypeDescText}>{fineTuningSettings.archetypeDescription}</Text>
        </View>

        {/* Health Assessment Status & Retake Action */}
        <View style={styles.assessmentCard}>
          <View style={styles.assessmentHeader}>
            <View style={styles.assessmentIconCircle}>
              <CheckCircle2 size={20} color={Theme.colors.feminismAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.assessmentTitle}>Health Assessment</Text>
              <Text style={styles.assessmentStatusText}>
                {answeredCount > 0
                  ? `${answeredCount}/${ASSESSMENT_QUESTIONS.length} questions answered`
                  : `${ASSESSMENT_QUESTIONS.length} quick questions`}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetakeAssessment}
            activeOpacity={0.8}
          >
            <RefreshCw size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retakeButtonText}>
              {answeredCount > 0 ? 'Review or retake' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fine-Tuning Control Center */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Sliders size={16} color={Theme.colors.textPrimary} />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>

          {/* Setting 1: Strain Sensitivity */}
          <View style={styles.settingItem}>
            <View style={styles.settingTopRow}>
              <View>
                <Text style={styles.settingLabel}>Workout intensity</Text>
              </View>
            </View>
            <View style={styles.chipsRow}>
              {(['gentle', 'balanced', 'dynamic'] as const).map((level) => {
                const isActive = fineTuningSettings.strainSensitivity === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[styles.settingChip, isActive && styles.settingChipActive]}
                    onPress={() => updateFineTuningSettings({ strainSensitivity: level })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.settingChipText, isActive && styles.settingChipTextActive]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Setting 2: Preferred Somatic Therapy */}
          <View style={styles.settingItem}>
            <View style={styles.settingTopRow}>
              <View>
                <Text style={styles.settingLabel}>Calming practice</Text>
              </View>
            </View>
            <View style={styles.chipsRow}>
              {(['somatic', 'cbt', 'breathwork'] as const).map((mode) => {
                const isActive = fineTuningSettings.preferredTherapy === mode;
                const labels: Record<string, string> = {
                  somatic: 'Body calm',
                  cbt: 'Reframing',
                  breathwork: 'Breathing',
                };
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.settingChip, isActive && styles.settingChipActive]}
                    onPress={() => updateFineTuningSettings({ preferredTherapy: mode })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.settingChipText, isActive && styles.settingChipTextActive]}>
                      {labels[mode]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Setting 3: Cortisol Auto-Override Switch */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.settingLabel}>Gentler workouts on hard days</Text>
              <Text style={styles.settingHelp}>Swaps intense sessions for gentle ones when your strain is high.</Text>
            </View>
            <Switch
              value={fineTuningSettings.autoCortisolOverride}
              onValueChange={(val) => updateFineTuningSettings({ autoCortisolOverride: val })}
              trackColor={{ false: '#E5E7EB', true: '#FF88AD' }}
              thumbColor={fineTuningSettings.autoCortisolOverride ? Theme.colors.feminismAccent : '#F3F4F6'}
            />
          </View>

          {/* Setting 4: PMDD Early Shield Alert Switch */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.settingLabel}>Pre-period calm reminders</Text>
              <Text style={styles.settingHelp}>Extra calming suggestions in the week before your period.</Text>
            </View>
            <Switch
              value={fineTuningSettings.pmddEarlyShield}
              onValueChange={(val) => updateFineTuningSettings({ pmddEarlyShield: val })}
              trackColor={{ false: '#E5E7EB', true: '#FF88AD' }}
              thumbColor={fineTuningSettings.pmddEarlyShield ? Theme.colors.feminismAccent : '#F3F4F6'}
            />
          </View>

          {/* Setting 5: Sleep Target */}
          <View style={styles.settingItem}>
            <View style={styles.settingTopRow}>
              <View>
                <Text style={styles.settingLabel}>Sleep goal</Text>
              </View>
              <View style={styles.sleepStepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() =>
                    updateFineTuningSettings({
                      dailySleepTargetHours: Math.max(6, fineTuningSettings.dailySleepTargetHours - 0.5),
                    })
                  }
                >
                  <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.sleepValueText}>
                  {fineTuningSettings.dailySleepTargetHours}h
                </Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() =>
                    updateFineTuningSettings({
                      dailySleepTargetHours: Math.min(10, fineTuningSettings.dailySleepTargetHours + 0.5),
                    })
                  }
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Clinical Report Export Link */}
        <TouchableOpacity
          style={styles.exportCard}
          onPress={handleExportPDF}
          activeOpacity={0.8}
        >
          <View style={styles.exportIconBox}>
            <FileText size={20} color={Theme.colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.exportTitle}>Doctor report (PDF)</Text>
            <Text style={styles.exportSubtitle}>Your last 90 days for your gynaecologist</Text>
          </View>
          <ChevronRight size={18} color={Theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* Backup status */}
        <BackupRow
          state={sync.state}
          lastSyncedAt={sync.lastSyncedAt}
          onDevice={isOfflineAccount || !isSupabaseConfigured}
          onSignIn={() => router.push({ pathname: '/login', params: { email: userEmail ?? '' } })}
          onRetry={() => void flushCloudSync(15000)}
        />

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={confirmLogout}
          disabled={!!busy}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{busy === 'signout' ? 'Signing out…' : 'Sign out'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} disabled={!!busy} activeOpacity={0.7}>
          <Trash2 size={14} color={Theme.colors.textTertiary} style={{ marginRight: 6 }} />
          <Text style={styles.deleteText}>{busy === 'delete' ? 'Deleting…' : 'Delete account'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

function timeAgo(ms: number): string {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(ms).toLocaleDateString();
}

function BackupRow(props: {
  state: ReturnType<typeof useSyncStatus.getState>['state'];
  lastSyncedAt?: number;
  onDevice: boolean;
  onSignIn: () => void;
  onRetry: () => void;
}) {
  const { state, lastSyncedAt, onDevice } = props;
  let title = 'Backed up';
  let detail = lastSyncedAt ? timeAgo(lastSyncedAt) : 'Waiting for your first change';
  let action: { label: string; onPress: () => void } | null = null;
  let ok = true;

  if (onDevice) {
    ok = false;
    title = 'Saved on this device only';
    detail = isSupabaseConfigured ? 'Sign in online to back up your data' : 'Cloud backup is not set up';
    if (isSupabaseConfigured) action = { label: 'Sign in', onPress: props.onSignIn };
  } else if (state === 'syncing') {
    title = 'Backing up…';
    detail = lastSyncedAt ? `Last backup ${timeAgo(lastSyncedAt)}` : 'First backup';
  } else if (state === 'signin') {
    ok = false;
    title = 'Backup paused';
    detail = 'Sign in again to keep backing up';
    action = { label: 'Sign in', onPress: props.onSignIn };
  } else if (state === 'error') {
    ok = false;
    title = 'Backup paused';
    detail = 'No connection — it will retry automatically';
    action = { label: 'Retry', onPress: props.onRetry };
  }

  const Icon = ok ? Cloud : CloudOff;
  return (
    <View style={styles.backupRow}>
      <View style={[styles.backupIcon, !ok && styles.backupIconOff]}>
        <Icon size={18} color={ok ? Theme.colors.primaryDark : Theme.colors.textTertiary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.backupTitle}>{title}</Text>
        <Text style={styles.backupDetail}>{detail}</Text>
      </View>
      {action ? (
        <TouchableOpacity onPress={action.onPress} style={styles.backupAction} activeOpacity={0.8}>
          <Text style={styles.backupActionText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 100,
  },
  centeredWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  headerRow: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFE3EC',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    marginBottom: 6,
  },
  headerLogo: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.feminismAccent,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    ...Theme.shadows.soft,
    gap: 14,
  },
  avatarGlow: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFE5ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFADC4',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.feminismAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  identityInfo: {
    flex: 1,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  userEmailText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  membershipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FFD7E3',
  },
  membershipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.feminismAccent,
  },
  archetypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    ...Theme.shadows.soft,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  archetypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  archetypeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.feminismAccent,
    letterSpacing: 0.8,
  },
  conditionPill: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
  },
  archetypeNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  archetypeTaglineText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
    marginTop: 2,
    marginBottom: 6,
  },
  archetypeDescText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4B5563',
  },
  assessmentCard: {
    backgroundColor: '#FFF5F8',
    borderRadius: Theme.radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD3E0',
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  assessmentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFADC4',
  },
  assessmentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  assessmentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  retakeButton: {
    backgroundColor: '#46375A',
    borderRadius: Theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.card,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    ...Theme.shadows.soft,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: -8,
    marginBottom: 2,
  },
  settingItem: {
    borderTopWidth: 1,
    borderTopColor: '#FFF0F5',
    paddingTop: 12,
  },
  settingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  settingHelp: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  settingChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: Theme.radius.md,
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#FFD7E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingChipActive: {
    backgroundColor: Theme.colors.feminismAccent,
    borderColor: Theme.colors.feminismAccent,
  },
  settingChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  settingChipTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#FFF0F5',
    paddingTop: 12,
  },
  sleepStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8FA',
    borderRadius: Theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFD7E3',
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFADC4',
  },
  stepperBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.feminismAccent,
    lineHeight: 18,
  },
  sleepValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    marginBottom: 16,
    gap: 12,
    ...Theme.shadows.soft,
  },
  exportIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFE4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  exportSubtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignSelf: 'stretch',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    flexShrink: 1,
    textAlign: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textTertiary,
  },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 14,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.cardGlass,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  backupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primaryLight,
  },
  backupIconOff: {
    backgroundColor: Theme.colors.secondaryLight,
  },
  backupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  backupDetail: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  backupAction: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Theme.colors.primaryLight,
  },
  backupActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
  },
});
