import React, { useState } from 'react';
import { Pressable, View, Text, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { LoggerProps } from './types';
import { SkipStepLink } from '@/components/common/SkipStepLink';
import { ArrowLeft, Check, Flame, MapPin, Shield, HeartPulse, Sparkles, ArrowRight } from 'lucide-react-native';
import { Theme, createStyles, themed, withAlpha } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { nextSyncHref, syncStepBadge } from '@/lib/syncDetails';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import type { PainLevel } from '@/types';
import { Button, Chip } from '@/components/ds';

const PAIN_LOCATIONS = [
  'Pelvic / Uterine Cramps',
  'Lower Back',
  'Headache / Migraine',
  'Breast Tenderness',
  'Bloating & Digestion',
  'Joint & Muscle Pain',
  'Radiating Thigh Ache',
];

const SENSATIONS = [
  'Dull Ache',
  'Sharp / Stabbing',
  'Throbbing Waves',
  'Cramping Spasms',
  'Burning Sensation',
];

const RELIEF_METHODS = [
  'Heating Pad / Warm Bath',
  'Ibuprofen / NSAID',
  'Magnesium / Herbal Tea',
  'Rest & Horizontal Sleep',
  'Pelvic Floor Stretching',
  'Acupressure / Massage',
];

export function PainLogger({ mode = 'screen', onSaved }: LoggerProps) {
  const isOnboarding = mode === 'onboarding';
  const logSymptom = useAppStore((s) => s.logSymptom);

  const [painLevel, setPainLevel] = useState<PainLevel>(4);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([
    'Pelvic / Uterine Cramps',
  ]);
  const [selectedSensation, setSelectedSensation] = useState<string>('Cramping Spasms');
  const [selectedRelief, setSelectedRelief] = useState<string[]>(['Heating Pad / Warm Bath']);
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const toggleRelief = (rel: string) => {
    setSelectedRelief((prev) =>
      prev.includes(rel) ? prev.filter((r) => r !== rel) : [...prev, rel]
    );
  };

  const getSeverityInfo = (level: number) => {
    if (level === 0) return { label: 'No Pain', color: Theme.colors.strainOptimal, desc: 'Completely comfortable' };
    if (level <= 3) return { label: 'Mild Discomfort', color: Theme.colors.strainTeal, desc: 'Noticeable but easily manageable' };
    if (level <= 6) return { label: 'Moderate Pain', color: Theme.colors.strainAmber, desc: 'Distracting, slows down daily routine' };
    if (level <= 8) return { label: 'Severe Strain', color: Theme.colors.strainHigh, desc: 'Intense discomfort, limits mobility' };
    return { label: 'Debilitating', color: themed('#991B1B'), desc: 'Requires immediate rest and medical care' };
  };

  const severity = getSeverityInfo(painLevel);

  const handleSave = () => {
    logSymptom({
      pain: painLevel,
      painLocation: selectedLocations,
      reliefMethods: selectedRelief,
      notes: notes.trim()
        ? `[${selectedSensation}] ${notes.trim()}`
        : `[${selectedSensation}]`,
    });

    setIsSaved(true);

    if (mode === 'tab') {
      onSaved?.();
      return;
    }

    if (isOnboarding) {
      router.push(nextSyncHref(useAppStore.getState()));
    } else {
      const msg = 'Pain logged.';
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
              <Text style={styles.onboardingBadgeText}>{syncStepBadge('pain')}</Text>
            </View>
            <Text style={styles.onboardingTitle}>Pain today</Text>
            <Text style={styles.onboardingDesc}>
              How much pain do you have today? Pick 0 if none.
            </Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 12 }}>
              <SkipStepLink step="pain" />
            </View>
          </View>
        )}

        {/* Pain Severity Scale */}
        <View style={styles.section}>
          <View style={styles.severityHeaderRow}>
            <View style={styles.sectionRow}>
              <Flame size={20} color={themed(severity.color)} />
              <Text style={styles.sectionHeader}>How strong?</Text>
            </View>
            <View style={[styles.severityBadge, { backgroundColor: withAlpha(themed(severity.color), 0.13) }]}>
              <Text style={[styles.severityBadgeText, { color: themed(severity.color) }]}>
                {painLevel}/10 • {severity.label}
              </Text>
            </View>
          </View>
          <Text style={styles.sectionSubtext}>{severity.desc}</Text>

          {/* 0 - 10 Selector Buttons */}
          <View style={styles.scaleRow}>
            {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as PainLevel[]).map((num) => {
              const isSelected = painLevel === num;
              const info = getSeverityInfo(num);
              return (
                <Pressable
                  key={num}
                  style={[
                    styles.scaleButton,
                    isSelected && {
                      backgroundColor: themed(info.color),
                      borderColor: themed(info.color),
                    },
                  ]}
                  onPress={() => setPainLevel(num)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, checked: isSelected }}
                  accessibilityLabel={`Pain ${num} of 10`}
                >
                  <Text
                    style={[
                      styles.scaleButtonText,
                      isSelected && styles.scaleButtonTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Pain Location */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <MapPin size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionHeaderInline}>Where does it hurt?</Text>
          </View>
          <View style={styles.chipsContainer}>
            {PAIN_LOCATIONS.map((loc) => {
              const isSelected = selectedLocations.includes(loc);
              return (
                <Chip key={loc} label={isSelected ? `✓ ${loc}` : loc} selected={isSelected} onPress={() => toggleLocation(loc)} accessibilityRole="checkbox" />
              );
            })}
          </View>
        </View>

        {/* Sensation Quality */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <HeartPulse size={18} color={Theme.colors.secondary} />
            <Text style={styles.sectionHeaderInline}>What does it feel like?</Text>
          </View>
          <View style={styles.chipsContainer}>
            {SENSATIONS.map((sens) => {
              const isSelected = selectedSensation === sens;
              return (
                <Chip key={sens} label={sens} selected={isSelected} onPress={() => setSelectedSensation(sens)} accessibilityRole="radio" />
              );
            })}
          </View>
        </View>

        {/* Relief Measures Tried */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Shield size={18} color={Theme.colors.strainOptimal} />
            <Text style={styles.sectionHeaderInline}>What helped?</Text>
          </View>
          <View style={styles.chipsContainer}>
            {RELIEF_METHODS.map((rel) => {
              const isSelected = selectedRelief.includes(rel);
              return (
                <Chip key={rel} label={isSelected ? `✓ ${rel}` : rel} selected={isSelected} onPress={() => toggleRelief(rel)} accessibilityRole="checkbox" />
              );
            })}
          </View>
        </View>

        {/* Specific Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="e.g. Cramps peaked after lunch, radiating into upper thighs. Heating pad provided partial relief."
            placeholderTextColor={Theme.colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Submit CTA */}
        <Button
          size="lg"
          fullWidth
          onPress={handleSave}
          disabled={isSaved}
          title={isOnboarding ? 'Save & continue' : isSaved ? 'Logged to History' : 'Save Pain Entry'}
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
          <Text style={styles.navTitle}>Log Pain</Text>
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
  },
  severityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionSubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Theme.space.xs,
  },
  scaleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  scaleButtonTextActive: {
    color: Theme.colors.onPrimary,
    fontWeight: '800',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.backgroundAlt,
  },
  chipActive: {
    backgroundColor: Theme.colors.primaryLight,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  chipTextActive: {
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
  radioChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.backgroundAlt,
  },
  radioChipActive: {
    backgroundColor: Theme.colors.secondaryLight,
    borderColor: Theme.colors.secondary,
  },
  radioChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  radioChipTextActive: {
    color: Theme.colors.secondaryDark,
    fontWeight: '700',
  },
  reliefChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.backgroundAlt,
  },
  reliefChipActive: {
    backgroundColor: '#E8F5F1',
    borderColor: Theme.colors.strainOptimal,
  },
  reliefChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  reliefChipTextActive: {
    color: Theme.colors.strainOptimal,
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
