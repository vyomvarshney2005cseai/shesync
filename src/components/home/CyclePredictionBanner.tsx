import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

export const CyclePredictionBanner: React.FC = () => {
  const cyclePrediction = useAppStore((s) => s.cyclePrediction);

  if (!cyclePrediction) return null;

  const topPrecaution = cyclePrediction.precautionMeasures?.[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push('/log-cycle')}
      >
        {/* Top Header */}
        <View style={styles.topRow}>
          <Text style={styles.cardTitle}>Next period</Text>
          <View style={styles.chevronWrap}>
            <Text style={styles.adjustText} numberOfLines={1}>Edit dates</Text>
            <ChevronRight size={14} color={Theme.colors.primary} />
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
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginTop: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  chevronWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  adjustText: { fontSize: 12, fontWeight: '700', color: Theme.colors.primary },
  dateBlock: { marginBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateValue: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.4 },
  countdownPill: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countdownText: { fontSize: 12, fontWeight: '800', color: Theme.colors.primaryDark },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 10,
    marginBottom: 12,
  },
  statItem: { flex: 1 },
  divider: { width: 1, height: 24, backgroundColor: Theme.colors.cardBorder, marginHorizontal: 10 },
  statLabel: { fontSize: 11, color: Theme.colors.textSecondary, marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: '700', color: Theme.colors.textPrimary },
  precautionBanner: {
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: Theme.radius.md,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
  },
  precautionBannerHigh: { borderLeftColor: Theme.colors.primary, backgroundColor: Theme.colors.primaryLight },
  precautionContent: { flex: 1 },
  precautionTitle: { fontSize: 12.5, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 2 },
  precautionDesc: { fontSize: 12, lineHeight: 17, color: Theme.colors.textSecondary },
});
