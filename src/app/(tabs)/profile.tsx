import React from 'react';
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
import { router, useNavigation } from 'expo-router';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import {
  User,
  Sparkles,
  Activity,
  Heart,
  Shield,
  Moon,
  ChevronRight,
  RefreshCw,
  LogOut,
  FileText,
  Sliders,
  CheckCircle2,
  Calendar,
} from 'lucide-react-native';

import * as ImagePicker from 'expo-image-picker';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const userName = useAppStore((s) => s.userName);
  const userEmail = useAppStore((s) => s.userEmail);
  const userPhoto = useAppStore((s) => s.userPhoto);
  const updateUserPhoto = useAppStore((s) => s.updateUserPhoto);
  const cycle = useAppStore((s) => s.cycle);
  const isAssessmentCompleted = useAppStore((s) => s.isAssessmentCompleted);
  const assessmentAnswers = useAppStore((s) => s.assessmentAnswers);
  const fineTuningSettings = useAppStore((s) => s.fineTuningSettings);
  const updateFineTuningSettings = useAppStore((s) => s.updateFineTuningSettings);
  const logout = useAppStore((s) => s.logout);
  const generateClinicalPDF = useAppStore((s) => s.generateClinicalPDF);

  const answeredCount = Object.keys(assessmentAnswers).length;
  const initial = (userName || 'M').charAt(0).toUpperCase();

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error', err);
    }

    if (Platform.OS === 'web') {
      try {
        router.replace('/');
      } catch (_) {}
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } else {
      const parent = navigation.getParent();
      if (parent) {
        parent.reset({
          index: 0,
          routes: [{ name: 'index' }],
        });
      } else {
        router.replace('/');
      }
    }
  };

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
            <View style={styles.badgeRow}>
              <Image
                source={require('@/../assets/images/shesync-logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerBadgeText}>SHESYNC CALIBRATION</Text>
            </View>
            <Text style={styles.headerTitle}>Health Profile</Text>
            <Text style={styles.headerSubtitle}>Bio-Adaptive Fine-Tuning & Identity</Text>
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
            <Text style={styles.userNameText}>{userName || 'Maya'}</Text>
            <Text style={styles.userEmailText}>{userEmail || 'maya@shesync.app'}</Text>
            <View style={styles.membershipPill}>
              <Sparkles size={11} color={Theme.colors.feminismAccent} />
              <Text style={styles.membershipText}>
                {isAssessmentCompleted ? 'Fully Calibrated' : 'Initial Profile'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bio-Adaptive Archetype Card */}
        <View style={styles.archetypeCard}>
          <View style={styles.archetypeHeader}>
            <View style={styles.archetypeTag}>
              <Activity size={13} color={Theme.colors.feminismAccent} />
              <Text style={styles.archetypeTagText}>BIO-ADAPTIVE ARCHETYPE</Text>
            </View>
            <Text style={styles.conditionPill}>{fineTuningSettings.primaryCondition}</Text>
          </View>

          <Text style={styles.archetypeNameText}>{fineTuningSettings.archetypeName}</Text>
          <Text style={styles.archetypeTaglineText}>{fineTuningSettings.archetypeTagline}</Text>
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
                {answeredCount > 0 ? `${answeredCount}/30 Questions Completed` : '30-Question Calibration Available'}
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
              {answeredCount > 0 ? 'Review or Re-take Assessment (30 MCQs)' : 'Start 30-Question Health Assessment'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fine-Tuning Control Center */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Sliders size={16} color={Theme.colors.textPrimary} />
            <Text style={styles.sectionTitle}>Fine-Tuning Control Center</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Custom rules calibrated directly from your clinical responses.
          </Text>

          {/* Setting 1: Strain Sensitivity */}
          <View style={styles.settingItem}>
            <View style={styles.settingTopRow}>
              <View>
                <Text style={styles.settingLabel}>Strain Sensitivity</Text>
                <Text style={styles.settingHelp}>Adjusts workout intensity limits</Text>
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
                <Text style={styles.settingLabel}>Somatic Therapy Modality</Text>
                <Text style={styles.settingHelp}>Featured in Mind tab daily</Text>
              </View>
            </View>
            <View style={styles.chipsRow}>
              {(['somatic', 'cbt', 'breathwork'] as const).map((mode) => {
                const isActive = fineTuningSettings.preferredTherapy === mode;
                const labels: Record<string, string> = {
                  somatic: 'Vagus Nerve',
                  cbt: 'CBT Reframing',
                  breathwork: 'Box Breathwork',
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
              <Text style={styles.settingLabel}>Cortisol Workout Override</Text>
              <Text style={styles.settingHelp}>
                Replaces high-strain sessions with pelvic/vagus flows when cortisol is elevated.
              </Text>
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
              <Text style={styles.settingLabel}>Late-Luteal PMDD Shield</Text>
              <Text style={styles.settingHelp}>
                Proactive neuro-hormonal calming sequences 7 days before period.
              </Text>
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
                <Text style={styles.settingLabel}>Restorative Sleep Target</Text>
                <Text style={styles.settingHelp}>Recommended minimum for hormonal synthesis</Text>
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
            <Text style={styles.exportTitle}>Clinical 90-Day Health Report</Text>
            <Text style={styles.exportSubtitle}>Export formatted summary for your OB/GYN</Text>
          </View>
          <ChevronRight size={18} color={Theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out of SheSync</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AdaptiveBackground>
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
    paddingBottom: 40,
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
    backgroundColor: '#111827',
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
});
