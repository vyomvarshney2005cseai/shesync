import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Calendar, ChevronRight, ShieldAlert, Sparkles, Clock } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

export const CyclePredictionBanner: React.FC = () => {
  const cyclePrediction = useAppStore((s) => s.cyclePrediction);
  const rememberedCyclesCount = useAppStore((s) => s.rememberedCyclesCount);

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
          <View style={styles.calendarBadge}>
            <Calendar size={12} color="#FFFFFF" />
            <Text style={styles.calendarBadgeText}>CYCLE PREDICTION</Text>
          </View>

          <View style={styles.chevronWrap}>
            <Text style={styles.adjustText} numberOfLines={1}>Manage Cycles</Text>
            <ChevronRight size={14} color={Theme.colors.primary} />
          </View>
        </View>

        {/* Prediction Main Date */}
        <View style={styles.dateBlock}>
          <Text style={styles.label}>Predicted Next Period Start</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateValue}>{cyclePrediction.nextPeriodDate}</Text>
            <View style={styles.countdownPill}>
              <Text style={styles.countdownText}>
                {cyclePrediction.daysUntilNextPeriod === 0
                  ? 'Due Today'
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
            <Text style={styles.statLabel}>Ovulation Window</Text>
            <Text style={styles.statValue}>{cyclePrediction.ovulationWindow}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Confidence</Text>
            <Text style={styles.statValue}>{cyclePrediction.confidencePercentage}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cycle Base</Text>
            <Text style={styles.statValue}>
              {rememberedCyclesCount > 0 ? `${rememberedCyclesCount} Tracked` : 'Calibrated'}
            </Text>
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
            <ShieldAlert
              size={15}
              color={topPrecaution.urgency === 'high' ? '#EF4444' : Theme.colors.secondary}
            />
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
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#1E1B2E',
    borderRadius: Theme.radius.xl,
    padding: 18,
    ...Theme.shadows.glowing,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.25)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  calendarBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  memoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  memoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  chevronWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  adjustText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  dateBlock: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  countdownPill: {
    backgroundColor: 'rgba(255, 77, 141, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.4)',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Theme.radius.md,
    padding: 10,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 10,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  precautionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Theme.radius.md,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
  },
  precautionBannerHigh: {
    borderLeftColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  precautionContent: {
    flex: 1,
  },
  precautionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  precautionDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 15,
  },
});
