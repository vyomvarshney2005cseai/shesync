import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timer, Zap, Leaf, ArrowRight } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { PillBadge } from '@/components/common/PillBadge';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import type { AdaptiveWorkout } from '@/types';

interface AdaptiveWorkoutCardProps {
  workout: AdaptiveWorkout;
  onStartFlow?: () => void;
  onViewReasoning?: () => void;
}

export const AdaptiveWorkoutCard: React.FC<AdaptiveWorkoutCardProps> = ({
  workout,
  onStartFlow,
  onViewReasoning,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Leaf size={22} color={Theme.colors.strainOptimal} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.label}>TODAY'S ADAPTIVE PLAN</Text>
          <Text style={styles.title}>{workout.title}</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Timer size={14} color={Theme.colors.textSecondary} />
          <Text style={styles.metaText}>{workout.duration}</Text>
        </View>
        <View style={styles.metaItem}>
          <Zap size={14} color={Theme.colors.strainOptimal} />
          <Text style={[styles.metaText, { color: Theme.colors.strainOptimal }]}>
            {workout.intensity.charAt(0).toUpperCase() + workout.intensity.slice(1)}
          </Text>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tagRow}>
        {workout.tags.map((tag) => (
          <PillBadge
            key={tag}
            label={tag}
            color={Theme.colors.strainOptimal}
            bgColor="rgba(16, 185, 129, 0.1)"
          />
        ))}
      </View>

      {/* Description */}
      <Text style={styles.description}>{workout.description}</Text>

      {/* Overridden notice */}
      {workout.overriddenFrom && (
        <View style={styles.overrideNotice}>
          <Text style={styles.overrideLabel}>REPLACED</Text>
          <Text style={styles.overrideValue}>{workout.overriddenFrom}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.buttonStack}>
        <PrimaryButton
          title="Start Restorative Flow"
          variant="rose"
          icon={<ArrowRight size={16} color="#FFFFFF" />}
          onPress={onStartFlow}
          fullWidth
        />
        <PrimaryButton
          title="View Biological Reasoning"
          variant="outline"
          onPress={onViewReasoning}
          fullWidth
          style={styles.reasoningBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.strainOptimal,
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: Theme.colors.textSecondary,
    marginBottom: 14,
  },
  overrideNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
    marginBottom: 16,
  },
  overrideLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.strainHigh,
    letterSpacing: 0.6,
  },
  overrideValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    textDecorationLine: 'line-through',
    flex: 1,
  },
  buttonStack: {
    gap: 8,
    alignSelf: 'stretch',
  },
  reasoningBtn: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
});
