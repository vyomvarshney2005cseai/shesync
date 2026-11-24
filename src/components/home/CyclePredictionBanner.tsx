import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ds';

export const CyclePredictionBanner: React.FC = () => {
  const cyclePrediction = useAppStore((s) => s.cyclePrediction);
  const hasCycleData = useAppStore((s) => !!s.cycle.hasCycleData);

  if (!cyclePrediction) return null;

  // Sensible defaults never invent a date: without her period dates, ask for one.
  if (!hasCycleData) {
    return (
      <View style={styles.container}>
        <Card padding="lg" style={styles.card} onPress={() => router.push('/log-cycle')} accessibilityRole="button">
          <View style={styles.topRow}>
            <Text style={styles.cardTitle}>Next period</Text>
            <View style={styles.chevronWrap}>
              <Text style={styles.adjustText}>Add dates</Text>
              <ChevronRight size={16} color={Theme.colors.primaryDark} />
            </View>
          </View>
          <Text style={styles.emptyText}>
            Add the first day of your last period — even roughly — and SheSync predicts your next one.
          </Text>
        </Card>
      </View>
    );
  }

  const topPrecaution = cyclePrediction.precautionMeasures?.[0];

  return (
    <View style={styles.container}>
      <Card
        style={styles.card}
        onPress={() => router.push('/log-cycle')}
      >
        {/* Top Header */}
        <View style={styles.topRow}>
          <Text style={styles.cardTitle}>Next period</Text>
          <View style={styles.chevronWrap}>
            <Text style={styles.adjustText} numberOfLines={1}>Edit dates</Text>
            <ChevronRight size={16} color={Theme.colors.primaryDark} />
          </View>
        </View>

        {/* Prediction Main Date */}
        <View style={styles.dateBlock}>
          <View style={styles.dateRow}>
            <Text style={styles.dateValue}>{cyclePrediction.nextPeriodDate}</Text>
            <View style={styles.countdownPill}>
              <Text style={styles.countdownText}>
                {cyclePrediction.daysUntilNextPeriod === 0
                  ? 'Due today'
                  : cyclePrediction.daysUntilNextPeriod < 0
                  ? `${Math.abs(cyclePrediction.daysUntilNextPeriod)}d overdue`
                  : `~${cyclePrediction.daysUntilNextPeriod}d left`}
              </Text>
            </View>
          </View>
        </View>

        {cyclePrediction.approximateDates ? (
          <Text style={styles.approxText}>
            ≈ Based on approximate dates · ±{cyclePrediction.cycleVarianceDays} days. Log your next period on the day to sharpen it.
          </Text>
        ) : null}

        {/* Windows & Regularity */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Ovulation</Text>
            <Text style={styles.statValue}>{cyclePrediction.ovulationWindow}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cycle length</Text>
            <Text style={styles.statValue}>{cyclePrediction.predictedCycleLength} days</Text>
          </View>
        </View>

        {/* Top Precaution Banner */}
        {topPrecaution && (
          <View
            style={[
              styles.precautionBanner,
              topPrecaution.urgency === 'high' && styles.precautionBannerHigh,
            ]}
          >
            <View style={styles.precautionContent}>
              <Text style={styles.precautionTitle} numberOfLines={1}>
                {topPrecaution.title}
              </Text>
              <Text style={styles.precautionDesc} numberOfLines={2}>
                {topPrecaution.advice}
              </Text>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
};

const styles = createStyles(() => ({
  container: { paddingHorizontal: Theme.space.md, marginTop: Theme.space.md },
  card: {
  },
  cardTitle: { ...Theme.type.title, color: Theme.colors.textPrimary },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chevronWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  adjustText: { ...Theme.type.label, color: Theme.colors.primaryDark },
  dateBlock: { marginBottom: 12 },
  emptyText: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary },
  approxText: { fontSize: 14, lineHeight: 20, color: Theme.colors.secondaryDark, fontWeight: '600', marginTop: -4, marginBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateValue: { ...Theme.type.h2, color: Theme.colors.textPrimary, letterSpacing: -0.4 },
  countdownPill: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countdownText: { fontSize: 12, fontWeight: '800', color: Theme.colors.primaryDark },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 12,
    marginBottom: 12,
  },
  statItem: { flex: 1 },
  divider: { width: 1, height: 24, backgroundColor: Theme.colors.cardBorder, marginHorizontal: 12 },
  statLabel: { fontSize: 14, color: Theme.colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  precautionBanner: {
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: Theme.radius.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
  },
  precautionBannerHigh: { borderLeftColor: Theme.colors.primary, backgroundColor: Theme.colors.primaryLight },
  precautionContent: { flex: 1 },
  precautionTitle: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 4 },
  precautionDesc: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary },
}));
