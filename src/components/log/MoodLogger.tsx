import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { LoggerProps } from './types';
import { SkipStepLink } from '@/components/common/SkipStepLink';
import {
  ArrowLeft,
  Check,
  BatteryCharging,
  Tag,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { nextSyncHref, syncStepBadge } from '@/lib/syncDetails';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import type { MoodLevel } from '@/types';
import { Button, Chip, Card } from '@/components/ds';

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
    color: '#6447B0',
    bgColor: '#F1EDFB',
  },
  {
    level: 3,
    emoji: '😌',
    label: 'Balanced',
    description: 'Calm, grounded, peaceful',
    color: '#1D7457',
    bgColor: '#E8F5F1',
  },
  {
    level: 4,
    emoji: '😊',
    label: 'Energized',
    description: 'Upbeat, productive & motivated',
    color: '#9A5A00',
    bgColor: '#FEF3C7',
  },
  {
    level: 5,
    emoji: '✨',
    label: 'Radiant',
    description: 'Joyful, euphoric & empowered',
    color: '#B0346B',
    bgColor: '#FBEAF2',
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

export function MoodLogger({ mode = 'screen', onSaved }: LoggerProps) {
  const isOnboarding = mode === 'onboarding';
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

    if (mode === 'tab') {
      onSaved?.();
      return;
    }

    if (isOnboarding) {
      router.push(nextSyncHref(useAppStore.getState()));
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
              <Text style={styles.onboardingBadgeText}>{syncStepBadge('mood')}</Text>
            </View>
            <Text style={styles.onboardingTitle}>Mood today</Text>
            <Text style={styles.onboardingDesc}>
              How are you feeling today?
            </Text>
            <View style={{ alignSelf: 'flex-start', marginTop: 12 }}>
              <SkipStepLink step="mood" />
            </View>
          </View>
        )}

        {/* Section: Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>How are you feeling?</Text>

          <View style={styles.moodGrid}>
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.level;
              return (
                <Card
                  key={m.level}
                  style={[
                    styles.moodTile,
                    isSelected && {
                      borderColor: themed(m.color),
                      backgroundColor: themed(m.bgColor),
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedMood(m.level)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, checked: isSelected }}
                  accessibilityLabel={`${m.label}: ${m.description}`}
                  padding="sm"
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && { color: themed(m.color), fontWeight: '800' },
                    ]}
                  >
                    {m.label}
                  </Text>
                  <Text style={styles.moodDesc}>{m.description}</Text>
                </Card>
              );
            })}
          </View>
        </View>

        {/* Section: Energy Level */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <BatteryCharging size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionHeaderInline}>Energy</Text>
          </View>
          <View style={styles.chipsRow}>
            {ENERGY_LEVELS.map((energy) => {
              const isSelected = selectedEnergy === energy.id;
              return (
                <Chip key={energy.id} label={energy.label} selected={isSelected} onPress={() => setSelectedEnergy(energy.id)} accessibilityRole="radio" />
              );
            })}
          </View>
        </View>

        {/* Section: Emotional Tags */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Tag size={18} color={Theme.colors.secondary} />
            <Text style={styles.sectionHeaderInline}>Feelings</Text>
          </View>
          <View style={styles.tagsContainer}>
            {EMOTIONAL_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <Chip key={tag} label={isSelected ? `✓ ${tag}` : tag} selected={isSelected} onPress={() => toggleTag(tag)} accessibilityRole="checkbox" />
              );
            })}
          </View>
        </View>

        {/* Section: Reflection Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Notes</Text>
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
        <Button
          size="lg"
          fullWidth
          onPress={handleSave}
          disabled={isSaved}
          title={isOnboarding ? 'Save & continue' : isSaved ? 'Saved to Health Log' : 'Save Mood Entry'}
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
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <Button variant="secondary" size="sm" iconOnly onPress={() => router.back()} accessibilityLabel="Go back" icon={<ArrowLeft size={22} color={Theme.colors.textPrimary} />} style={styles.backButton} />
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Log Mood</Text>
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
  moodGrid: {
    gap: 12,
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
    marginRight: 16,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    minWidth: 90,
  },
  moodDesc: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
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
    fontSize: 14,
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
    paddingVertical: 8,
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
