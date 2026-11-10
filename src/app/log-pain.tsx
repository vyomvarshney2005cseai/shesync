import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Flame, MapPin, Shield, HeartPulse, Sparkles, ArrowRight } from 'lucide-react-native';
import { Theme, createStyles, themed, withAlpha } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { nextSyncHref, syncStepBadge } from '@/lib/syncDetails';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import type { PainLevel } from '@/types';

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

export default function LogPainScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === 'true';
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
          <Text style={styles.navTitle}>Log Pain</Text>
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
              <Text style={styles.onboardingBadgeText}>{syncStepBadge('pain')}</Text>
            </View>
            <Text style={styles.onboardingTitle}>Pain today</Text>
            <Text style={styles.onboardingDesc}>
              How much pain do you have today? Pick 0 if none.
            </Text>
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
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.scaleButton,
                    isSelected && {
                      backgroundColor: themed(info.color),
                      borderColor: themed(info.color),
                      transform: [{ scale: 1.1 }],
                    },
                  ]}
                  onPress={() => setPainLevel(num)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.scaleButtonText,
                      isSelected && styles.scaleButtonTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
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
                <TouchableOpacity
                  key={loc}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => toggleLocation(loc)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {isSelected ? `✓ ${loc}` : loc}
                  </Text>
                </TouchableOpacity>
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
                <TouchableOpacity
                  key={sens}
                  style={[styles.radioChip, isSelected && styles.radioChipActive]}
                  onPress={() => setSelectedSensation(sens)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.radioChipText, isSelected && styles.radioChipTextActive]}>
                    {sens}
                  </Text>
                </TouchableOpacity>
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
                <TouchableOpacity
                  key={rel}
                  style={[styles.reliefChip, isSelected && styles.reliefChipActive]}
                  onPress={() => toggleRelief(rel)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.reliefChipText, isSelected && styles.reliefChipTextActive]}>
                    {isSelected ? `✓ ${rel}` : rel}
                  </Text>
                </TouchableOpacity>
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
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: themed(severity.color) }]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaved}
        >
          {isOnboarding ? (
            <>
              <Text style={styles.saveButtonText}>Save & continue</Text>
              <ArrowRight size={20} color={themed('#FFFFFF')} style={{ marginLeft: 8 }} />
            </>
          ) : (
            <>
              <Check size={20} color={themed('#FFFFFF')} style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {isSaved ? 'Logged to History' : 'Save Pain Entry'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionSubtext: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  scaleButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  scaleButtonTextActive: {
    color: '#FFFFFF',
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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,
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
}));
