import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { LoggerProps } from './types';
import { SkipStepLink } from '@/components/common/SkipStepLink';
import {
  ArrowLeft,
  Check,
  Droplets,
  Palette,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { nextSyncHref, syncStepBadge } from '@/lib/syncDetails';
import { ROUTES } from '@/lib/routes';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import type { FlowIntensity } from '@/types';
import { Button, Chip, Card } from '@/components/ds';

interface FlowOption {
  id: FlowIntensity;
  label: string;
  volume: string;
  color: string;
  bgColor: string;
  /** Text colour on bgColor; at least 4.5:1 in both light and dark mode. */
  ink: string;
  desc: string;
}

const FLOW_LEVELS: FlowOption[] = [
  {
    id: 'none',
    label: 'None / Dry',
    volume: '0 ml',
    color: '#8A8194',
    bgColor: '#F3F4F6',
    ink: '#544A5E',
    desc: 'No active menstrual bleeding',
  },
  {
    id: 'spotting',
    label: 'Spotting',
    volume: '< 5 ml',
    color: '#D97706',
    bgColor: '#FEF3C7',
    ink: '#92400E',
    desc: 'Few brown/pink droplets, liner only',
  },
  {
    id: 'light',
    label: 'Light Flow',
    volume: '5 - 15 ml',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    ink: '#9D174D',
    desc: '1–2 light pads or tampons needed',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    volume: '15 - 30 ml',
    color: '#B0346B',
    bgColor: '#FBEAF2',
    ink: '#962A5A',
    desc: 'Standard steady flow, normal absorption',
  },
  {
    id: 'heavy',
    label: 'Heavy Flow',
    volume: '30 - 50 ml',
    color: '#B8324F',
    bgColor: '#FFE4E6',
    ink: '#9F1239',
    desc: 'Pad/tampon filled every 2–3 hours',
  },
  {
    id: 'severe',
    label: 'Clots / Very Heavy',
    volume: '50+ ml',
    color: '#991B1B',
    bgColor: '#FEE2E2',
    ink: '#991B1B',
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

export function FlowLogger({ mode = 'screen', onSaved }: LoggerProps) {
  const isOnboarding = mode === 'onboarding';
  const logSymptom = useAppStore((s) => s.logSymptom);

  const [selectedFlow, setSelectedFlow] = useState<FlowIntensity>('none');
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

    if (mode === 'tab') {
      const bleeding = selectedFlow === 'light' || selectedFlow === 'moderate' || selectedFlow === 'heavy' || selectedFlow === 'severe';
      onSaved?.({ bleeding });
      return;
    }

    if (isOnboarding) {
      router.push(nextSyncHref(useAppStore.getState()));
    } else {
      const bleeding = selectedFlow === 'light' || selectedFlow === 'moderate' || selectedFlow === 'heavy' || selectedFlow === 'severe';
      if (bleeding) {
        // On a bleeding day, offer the pad change timer.
        const msg = 'Flow entry logged in cycle history. Start the pad change timer?';
        if (Platform.OS === 'web') {
          if (window.confirm(msg)) router.replace(ROUTES.padCare);
          else router.back();
        } else {
          Alert.alert('Logged', msg, [
            { text: 'Not now', style: 'cancel', onPress: () => router.back() },
            { text: 'Pad timer', onPress: () => router.replace(ROUTES.padCare) },
          ]);
        }
        return;
      }
      const msg = 'Flow entry logged in cycle history.';
      if (Platform.OS === 'web') {
        window.alert(msg);
        router.back();
      } else {
        Alert.alert('Logged', msg, [{ text: 'OK', onPress: () => router.back() }]);
      }
    }
  };

  // The form itself. In the check-in sheet it is one tab; otherwise a full screen.
  const body = (
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
              <Text style={styles.onboardingBadgeText}>{syncStepBadge('flow')}</Text>
            </View>
            <Text style={styles.onboardingTitle}>Flow today</Text>
            <Text style={styles.onboardingDesc}>
              How heavy is your flow today? Pick “None” if you’re not bleeding.
            </Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 12 }}>
              <SkipStepLink step="flow" />
            </View>
          </View>
        )}

        {/* Flow Intensity Cards */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Droplets size={20} color={themed(currentFlow.color)} />
            <Text style={styles.sectionHeader}>How heavy?</Text>
          </View>

          <View style={styles.flowGrid}>
            {FLOW_LEVELS.map((flow) => {
              const isSelected = selectedFlow === flow.id;
              return (
                <Card
                  key={flow.id}
                  style={[
                    styles.flowCard,
                    isSelected && {
                      borderColor: themed(flow.color),
                      backgroundColor: themed(flow.bgColor),
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedFlow(flow.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, checked: isSelected }}
                  padding="sm"
                >
                  <View style={styles.flowCardHeader}>
                    <View style={styles.flowNameGroup}>
                      <View style={[styles.flowIndicator, { backgroundColor: themed(flow.color) }]} />
                      <Text
                        style={[
                          styles.flowCardLabel,
                          isSelected && { color: themed(flow.ink), fontWeight: '800' },
                        ]}
                      >
                        {flow.label}
                      </Text>
                    </View>
                    <Text style={styles.flowVolumeBadge}>{flow.volume}</Text>
                  </View>
                  <Text style={styles.flowCardDesc}>{flow.desc}</Text>
                </Card>
              );
            })}
          </View>
        </View>

        {/* Color & Fluid Texture */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Palette size={18} color={Theme.colors.secondary} />
            <Text style={styles.sectionHeaderInline}>Colour</Text>
          </View>

          <View style={styles.chipsContainer}>
            {SHADES_AND_TEXTURES.map((shade) => {
              const isSelected = selectedShade === shade.label;
              return (
                <Chip key={shade.label} label={shade.label} selected={isSelected} onPress={() => setSelectedShade(shade.label)} accessibilityRole="radio" icon={<View style={[styles.colorDot, { backgroundColor: themed(shade.color) }]} />} />
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Notes</Text>
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
        <Button
          size="lg"
          fullWidth
          onPress={handleSave}
          disabled={isSaved}
          title={isOnboarding ? 'Save & continue' : isSaved ? 'Saved to Cycle Record' : 'Save Flow Entry'}
          icon={isOnboarding ? undefined : <Check size={20} color={isSaved ? Theme.colors.textTertiary : Theme.colors.onPrimary} />}
          iconRight={isOnboarding ? <ArrowRight size={20} color={Theme.colors.onPrimary} /> : undefined}
          style={styles.saveButton}
        />
      </ScrollView>
  );

  if (mode === 'tab') return body;

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Navigation Header */}
      <View style={styles.navBar}>
        <Button variant="secondary" size="sm" iconOnly onPress={() => router.back()} accessibilityLabel="Go back" icon={<ArrowLeft size={22} color={Theme.colors.textPrimary} />} style={styles.backButton} />
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Log Flow</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {body}
    </SafeAreaView>
  </AdaptiveBackground>
  );
}

const styles = createStyles(() => ({
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
  },
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  navSubtitle: {
    fontSize: 14,
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
  },
  onboardingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  onboardingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primaryDark,
    letterSpacing: 0.5,
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  onboardingDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textSecondary,
  },
  section: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
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
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  sectionSubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  flowGrid: {
    gap: 12,
  },
  flowCard: {
    padding: 16,
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
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  flowVolumeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  flowCardDesc: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginLeft: 20,
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
    fontSize: 14,
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
    fontSize: 16,
    color: Theme.colors.textPrimary,
    minHeight: 88,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  saveButton: {
    marginTop: 4,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
}));
