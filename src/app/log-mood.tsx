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
  Smile,
  BatteryCharging,
  Heart,
  Tag,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import type { MoodLevel } from '@/types';

interface MoodOption {
  level: MoodLevel;
  emoji: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const MOODS: MoodOption[] = [
  {
    level: 1,
    emoji: '😔',
    label: 'Depleted',
    description: 'Low energy, tearful or exhausted',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
  {
    level: 2,
    emoji: '🥺',
    label: 'Sensitive',
    description: 'Vulnerable, emotionally tender',
    color: Theme.colors.secondary,
    bgColor: Theme.colors.secondaryLight,
  },
  {
    level: 3,
    emoji: '😌',
    label: 'Balanced',
    description: 'Calm, grounded, peaceful',
    color: Theme.colors.strainOptimal,
    bgColor: '#E8F5F1',
  },
  {
    level: 4,
    emoji: '😊',
    label: 'Energized',
    description: 'Upbeat, productive & motivated',
    color: Theme.colors.strainAmber,
    bgColor: '#FEF3C7',
  },
  {
    level: 5,
    emoji: '✨',
    label: 'Radiant',
    description: 'Joyful, euphoric & empowered',
    color: Theme.colors.primary,
    bgColor: Theme.colors.primaryLight,
  },
];

const ENERGY_LEVELS = [
  { id: 'low', label: 'Low / Drained' },
  { id: 'restorative', label: 'Restorative' },
  { id: 'moderate', label: 'Steady' },
  { id: 'high', label: 'High Vitality' },
];

const EMOTIONAL_TAGS = [
  'Grateful',
  'Brain Fog',
  'Anxious',
  'Grounded',
  'Overwhelmed',
  'Creative',
  'Restless',
  'Tender',
  'Irritable',
  'Focused',
];

export default function LogMoodScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === 'true';
  const logSymptom = useAppStore((s) => s.logSymptom);

  const [selectedMood, setSelectedMood] = useState<MoodLevel>(3);
  const [selectedEnergy, setSelectedEnergy] = useState<string>('moderate');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Grounded']);
  const [notes, setNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    logSymptom({
      mood: selectedMood,
      energy: selectedEnergy,
      tags: selectedTags,
      notes: notes.trim() || undefined,
    });

    setIsSaved(true);

    if (isOnboarding) {
      router.push('/assessment?reveal=true');
    } else {
      const msg = 'Mood entry logged successfully!';
      if (Platform.OS === 'web') {
        window.alert(msg);
        router.back();
      } else {
        Alert.alert('Logged', msg, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    }
  };

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Log Mood</Text>
          <Text style={styles.navSubtitle}>Emotional & Somatic Wellbeing</Text>
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
              <Text style={styles.onboardingBadgeText}>BASELINE CALIBRATION (STEP 4 OF 4)</Text>
            </View>
            <Text style={styles.onboardingTitle}>Log Your Mood & Vitality</Text>
            <Text style={styles.onboardingDesc}>
              Calibrate your baseline emotional state and nervous energy. This finalizes your
              fine-tuned clinical analytics and personalized Doctor Co-Pilot profile.
            </Text>
          </View>
        )}

        {/* Section: Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>How are you feeling right now?</Text>
          <Text style={styles.sectionSubtext}>Select the state closest to your present emotion</Text>

          <View style={styles.moodGrid}>
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.level;
              return (
                <TouchableOpacity
                  key={m.level}
                  style={[
                    styles.moodTile,
                    isSelected && {
                      borderColor: m.color,
                      backgroundColor: m.bgColor,
                      transform: [{ scale: 1.02 }],
                    },
                  ]}
                  onPress={() => setSelectedMood(m.level)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && { color: m.color, fontWeight: '800' },
                    ]}
                  >
                    {m.label}
                  </Text>
                  <Text style={styles.moodDesc}>{m.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Energy Level */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <BatteryCharging size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionHeaderInline}>Vitality & Energy Level</Text>
          </View>
          <View style={styles.chipsRow}>
            {ENERGY_LEVELS.map((energy) => {
              const isSelected = selectedEnergy === energy.id;
              return (
                <TouchableOpacity
                  key={energy.id}
                  style={[
                    styles.chip,
                    isSelected && styles.chipActive,
                  ]}
                  onPress={() => setSelectedEnergy(energy.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextActive,
                    ]}
                  >
                    {energy.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Emotional Tags */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Tag size={18} color={Theme.colors.secondary} />
            <Text style={styles.sectionHeaderInline}>Emotional Qualities</Text>
          </View>
          <Text style={styles.sectionSubtext}>Select any tags that resonate with you today</Text>
          <View style={styles.tagsContainer}>
            {EMOTIONAL_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, isSelected && styles.tagPillActive]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
                    {isSelected ? `✓ ${tag}` : tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Reflection Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Somatic Reflection Notes</Text>
          <Text style={styles.sectionSubtext}>Optional: What triggered or supported this feeling?</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Write freely... e.g., Felt gentle wave of relief after morning walk, slight brain fog around 2pm."
            placeholderTextColor={Theme.colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaved}
        >
          {isOnboarding ? (
            <>
              <Text style={styles.saveButtonText}>Save & Reveal Calibrated Archetype & Analytics</Text>
              <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          ) : (
            <>
              <Check size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {isSaved ? 'Saved to Health Log' : 'Save Mood Entry'}
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
  moodGrid: {
    gap: 10,
  },
  moodTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Theme.radius.lg,
    borderWidth: 1.5,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.card,
  },
  moodEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    minWidth: 90,
  },
  moodDesc: {
    flex: 1,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 15,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.backgroundAlt,
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.backgroundMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagPillActive: {
    backgroundColor: Theme.colors.secondaryLight,
    borderColor: Theme.colors.secondary,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  tagTextActive: {
    color: Theme.colors.secondaryDark,
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
    backgroundColor: Theme.colors.primary,
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
