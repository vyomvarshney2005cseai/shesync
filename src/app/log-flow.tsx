import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Droplets,
  Palette,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import type { FlowIntensity } from '@/types';

interface FlowOption {
  id: FlowIntensity;
  label: string;
  volume: string;
  color: string;
  bgColor: string;
  desc: string;
}

const FLOW_LEVELS: FlowOption[] = [
  {
    id: 'none',
    label: 'None / Dry',
    volume: '0 ml',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
    desc: 'No active menstrual bleeding',
  },
  {
    id: 'spotting',
    label: 'Spotting',
    volume: '< 5 ml',
    color: '#D97706',
    bgColor: '#FEF3C7',
    desc: 'Few brown/pink droplets, liner only',
  },
  {
    id: 'light',
    label: 'Light Flow',
    volume: '5 - 15 ml',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    desc: '1–2 light pads or tampons needed',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    volume: '15 - 30 ml',
    color: Theme.colors.primary,
    bgColor: Theme.colors.primaryLight,
    desc: 'Standard steady flow, normal absorption',
  },
  {
    id: 'heavy',
    label: 'Heavy Flow',
    volume: '30 - 50 ml',
    color: Theme.colors.strainHigh,
    bgColor: '#FFE4E6',
    desc: 'Pad/tampon filled every 2–3 hours',
  },
  {
    id: 'severe',
    label: 'Clots / Very Heavy',
    volume: '50+ ml',
    color: '#991B1B',
    bgColor: '#FEE2E2',
    desc: 'Large clots (>2.5cm) or hourly saturation',
  },
];

const SHADES_AND_TEXTURES = [
  { label: 'Bright Crimson', color: '#E11D48' },
  { label: 'Deep Burgundy', color: '#881337' },
  { label: 'Brownish / Oxidized', color: '#78350F' },
  { label: 'Pinkish / Watery', color: '#F472B6' },
  { label: 'Creamy Cervical Mucus', color: '#FCD34D' },
  { label: 'Egg-White Slippery (Ovulatory)', color: '#6EE7B7' },
];

export default function LogFlowScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === 'true';
  const logSymptom = useAppStore((s) => s.logSymptom);

  const [selectedFlow, setSelectedFlow] = useState<FlowIntensity>('moderate');
  const [selectedShade, setSelectedShade] = useState<string>('Bright Crimson');
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const currentFlow = FLOW_LEVELS.find((f) => f.id === selectedFlow) || FLOW_LEVELS[3];

  const handleSave = () => {
    logSymptom({
      flow: selectedFlow,
      flowColor: selectedShade,
      notes: notes.trim()
        ? `[Shade: ${selectedShade}] ${notes.trim()}`
        : `[Shade: ${selectedShade}]`,
    });

    setIsSaved(true);

    if (isOnboarding) {
      router.push('/log-mood?onboarding=true');
    } else {
      const msg = 'Flow entry logged in cycle history.';
      if (Platform.OS === 'web') {
        window.alert(msg);
        router.back();
      } else {
        Alert.alert('Logged', msg, [{ text: 'OK', onPress: () => router.back() }]);
      }
    }
  };

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Navigation Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Log Flow</Text>
          <Text style={styles.navSubtitle}>Cycle Volume & Texture</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Onboarding Stepper Header if in calibration flow */}
        {isOnboarding && (
          <View style={styles.onboardingBanner}>
            <View style={styles.onboardingBadge}>
              <Sparkles size={13} color={Theme.colors.primary} />
              <Text style={styles.onboardingBadgeText}>BASELINE CALIBRATION (STEP 3 OF 4)</Text>
            </View>
            <Text style={styles.onboardingTitle}>Log Your Flow & Cycle Status</Text>
            <Text style={styles.onboardingDesc}>
              Calibrate your current menstrual bleeding intensity, texture, and product count to sync
              your real-time cycle phase and clinical menorrhagia markers.
            </Text>
          </View>
        )}

        {/* Flow Intensity Cards */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Droplets size={20} color={currentFlow.color} />
            <Text style={styles.sectionHeader}>Flow Intensity</Text>
          </View>
          <Text style={styles.sectionSubtext}>Select the volume that best reflects your flow today</Text>

          <View style={styles.flowGrid}>
            {FLOW_LEVELS.map((flow) => {
              const isSelected = selectedFlow === flow.id;
              return (
                <TouchableOpacity
                  key={flow.id}
                  style={[
                    styles.flowCard,
                    isSelected && {
                      borderColor: flow.color,
                      backgroundColor: flow.bgColor,
                      transform: [{ scale: 1.01 }],
                    },
                  ]}
                  onPress={() => setSelectedFlow(flow.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.flowCardHeader}>
                    <View style={styles.flowNameGroup}>
                      <View style={[styles.flowIndicator, { backgroundColor: flow.color }]} />
                      <Text
                        style={[
                          styles.flowCardLabel,
                          isSelected && { color: flow.color, fontWeight: '800' },
                        ]}
                      >
                        {flow.label}
                      </Text>
                    </View>
                    <Text style={styles.flowVolumeBadge}>{flow.volume}</Text>
                  </View>
                  <Text style={styles.flowCardDesc}>{flow.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Color & Fluid Texture */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Palette size={18} color={Theme.colors.secondary} />
            <Text style={styles.sectionHeaderInline}>Fluid Color & Texture</Text>
          </View>
          <Text style={styles.sectionSubtext}>Useful biomarker indicator for hormone & oxygenation phase</Text>

          <View style={styles.chipsContainer}>
            {SHADES_AND_TEXTURES.map((shade) => {
              const isSelected = selectedShade === shade.label;
              return (
                <TouchableOpacity
                  key={shade.label}
                  style={[styles.shadeChip, isSelected && styles.shadeChipActive]}
                  onPress={() => setSelectedShade(shade.label)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.colorDot, { backgroundColor: shade.color }]} />
                  <Text style={[styles.shadeChipText, isSelected && styles.shadeChipTextActive]}>
                    {shade.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Cycle Notes & Anomalies</Text>
          <Text style={styles.sectionSubtext}>Note clot sizes, odor, unexpected spotting or timeline</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="e.g. Started heavier than usual around 11am, lighter in the evening. No severe cramping."
            placeholderTextColor={Theme.colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save CTA */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: currentFlow.color }]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaved}
        >
          {isOnboarding ? (
            <>
              <Text style={styles.saveButtonText}>Save & Continue to Mood (Step 4/4)</Text>
              <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          ) : (
            <>
              <Check size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {isSaved ? 'Saved to Cycle Record' : 'Save Flow Entry'}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 226, 235, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  navSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  onboardingBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    ...Theme.shadows.soft,
  },
  onboardingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  onboardingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primaryDark,
    letterSpacing: 0.5,
  },
  onboardingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  onboardingDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
  },
  section: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  sectionHeaderInline: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  sectionSubtext: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  flowGrid: {
    gap: 10,
  },
  flowCard: {
    padding: 14,
    borderRadius: Theme.radius.lg,
    borderWidth: 1.5,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.card,
  },
  flowCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  flowNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flowIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  flowCardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  flowVolumeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
  },
  flowCardDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 15,
    marginLeft: 18,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shadeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.backgroundAlt,
  },
  shadeChipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryLight,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  shadeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  shadeChipTextActive: {
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 12,
    fontSize: 13,
    color: Theme.colors.textPrimary,
    minHeight: 88,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  saveButton: {
    borderRadius: Theme.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 24,
    alignSelf: 'stretch',
    ...Theme.shadows.glowing,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    flexShrink: 1,
    textAlign: 'center',
  },
});
