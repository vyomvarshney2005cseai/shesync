import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Dumbbell, Flower2, Footprints, Timer, ChevronRight } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { INTENSITY_LABELS, type LibraryWorkout } from '@/constants/fitnessLibrary';
import type { CyclePhase } from '@/types';
import { Card, badgeColors, type BadgeTone } from '@/components/ds';

/** Intensity → badge tone (token colours, at least 4.5:1 in light and dark mode). */
const INTENSITY_TONE: Record<string, BadgeTone> = {
  restorative: 'mint',
  gentle: 'sky',
  moderate: 'amber',
  vigorous: 'danger',
};

export function WorkoutListItem({ workout, phase }: { workout: LibraryWorkout; phase: CyclePhase }) {
  const fits = workout.bestPhases.includes(phase);
  const colors = badgeColors(INTENSITY_TONE[workout.intensity] ?? 'neutral');
  const Icon = workout.category === 'gym' ? Dumbbell : workout.category === 'yoga' ? Flower2 : Footprints;
  return (
    <Card
      onPress={() => router.push(`/fitness/workout/${workout.id}`)}
      accessibilityLabel={`${workout.title}, ${workout.minutes} minutes, ${INTENSITY_LABELS[workout.intensity]}`}
      style={styles.item}
    >
      <View style={[styles.icon, { backgroundColor: colors.bg }]}>
        <Icon size={20} color={colors.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.focus} numberOfLines={1}>
          {workout.focus}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Timer size={12} color={Theme.colors.textTertiary} />
            <Text style={styles.metaText}>{workout.minutes} min</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.bg }]}>
            <Text style={[styles.pillText, { color: colors.fg }]}>{INTENSITY_LABELS[workout.intensity]}</Text>
          </View>
          <Text style={styles.metaText}>{workout.level}</Text>
          {fits ? (
            <View style={[styles.pill, { backgroundColor: Theme.colors.primaryLight }]}>
              <Text style={[styles.pillText, { color: Theme.colors.primaryDark }]}>Fits your phase</Text>
            </View>
          ) : null}
        </View>
      </View>
      <ChevronRight size={18} color={Theme.colors.textTertiary} />
    </Card>
  );
}

const styles = createStyles(() => ({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  icon: { width: 44, height: 44, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  focus: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '600', color: Theme.colors.textTertiary },
  pill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '800' },
}));
