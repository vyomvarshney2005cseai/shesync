import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowRightLeft, TrendingDown } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import type { WorkoutHistory } from '@/types';

interface AdaptationHistoryProps {
  history: WorkoutHistory[];
}

export const AdaptationHistory: React.FC<AdaptationHistoryProps> = ({ history }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Past Adaptation History</Text>
      {history.map((item, index) => (
        <View key={index} style={styles.historyCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={styles.strainBadge}>
              <TrendingDown size={12} color={Theme.colors.strainAmber} />
              <Text style={styles.strainText}>{item.strainAtTime}% Strain</Text>
            </View>
          </View>
          <View style={styles.adaptRow}>
            <View style={styles.workoutCol}>
              <Text style={styles.workoutLabel}>ORIGINAL</Text>
              <Text style={styles.workoutOriginal}>{item.original}</Text>
            </View>
            <View style={styles.arrowWrap}>
              <ArrowRightLeft size={14} color={Theme.colors.primary} />
            </View>
            <View style={styles.workoutCol}>
              <Text style={[styles.workoutLabel, { color: Theme.colors.strainOptimal }]}>ADAPTED</Text>
              <Text style={styles.workoutAdapted}>{item.adapted}</Text>
            </View>
          </View>
          <Text style={styles.reason}>{item.reason}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateBadge: {
    backgroundColor: Theme.colors.backgroundMuted,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  strainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
  },
  strainText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  adaptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  workoutCol: {
    flex: 1,
  },
  workoutLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.strainHigh,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  workoutOriginal: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  workoutAdapted: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  arrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reason: {
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.textTertiary,
    fontStyle: 'italic',
  },
});
