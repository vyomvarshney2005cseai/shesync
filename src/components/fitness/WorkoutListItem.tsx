import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Dumbbell, Flower2, Footprints, Timer, ChevronRight } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { INTENSITY_LABELS, type LibraryWorkout } from '@/constants/fitnessLibrary';
import type { CyclePhase } from '@/types';

const INTENSITY_COLORS: Record<string, { fg: string; bg: string }> = {
  restorative: { fg: '#047857', bg: '#D1FAE5' },
  gentle: { fg: '#0E7490', bg: '#CFFAFE' },
  moderate: { fg: '#B45309', bg: '#FEF3C7' },
  vigorous: { fg: '#BE123C', bg: '#FFE4E6' },
};

export function WorkoutListItem({ workout, phase }: { workout: LibraryWorkout; phase: CyclePhase }) {
  const fits = workout.bestPhases.includes(phase);
  const colors = INTENSITY_COLORS[workout.intensity];
  const Icon = workout.category === 'gym' ? Dumbbell : workout.category === 'yoga' ? Flower2 : Footprints;
  return (
    <Pressable
      onPress={() => router.push(`/fitness/workout/${workout.id}`)}
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`${workout.title}, ${workout.minutes} minutes, ${INTENSITY_LABELS[workout.intensity]}`}
    >
      <View style={[styles.icon, { backgroundColor: themed(colors.bg) }]}>
        <Icon size={20} color={themed(colors.fg)} />
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
          <View style={[styles.pill, { backgroundColor: themed(colors.bg) }]}>
            <Text style={[styles.pillText, { color: themed(colors.fg) }]}>{INTENSITY_LABELS[workout.intensity]}</Text>
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
    </Pressable>
  );
}

const styles = createStyles(() => ({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  focus: { fontSize: 11, color: Theme.colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, fontWeight: '600', color: Theme.colors.textTertiary },
  pill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  pillText: { fontSize: 10, fontWeight: '800' },
}));
