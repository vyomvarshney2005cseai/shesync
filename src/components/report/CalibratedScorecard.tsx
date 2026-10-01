import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Activity,
  Flame,
  Droplets,
  Smile,
  Shield,
  ClipboardList,
  Sparkles,
  HeartPulse,
  Calendar,
  ShieldAlert,
} from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

export const CalibratedScorecard: React.FC = () => {
  const biometrics = useAppStore((s) => s.biometrics);
  const cycle = useAppStore((s) => s.cycle);
  const settings = useAppStore((s) => s.fineTuningSettings);
  const logs = useAppStore((s) => s.symptomLogs);
  const cyclePrediction = useAppStore((s) => s.cyclePrediction);

  const latestPain = logs.find((l) => l.pain !== undefined);
  const latestFlow = logs.find((l) => l.flow !== undefined);
  const latestMood = logs.find((l) => l.mood !== undefined);

  const painVal = latestPain?.pain ?? 4;
  const flowVal = latestFlow?.flow ?? 'spotting';
  const moodVal = latestMood?.mood ?? 3;
  const energyVal = latestMood?.energy ?? 'moderate';

  const getStrainColor = (level: string) => {
    switch (level) {
      case 'severe':
        return '#991B1B';
      case 'high':
        return Theme.colors.strainHigh;
      case 'moderate':
        return Theme.colors.strainAmber;
      default:
        return Theme.colors.strainOptimal;
    }
  };

  const strainColor = getStrainColor(biometrics.strainLevel);

  return (
    <View style={styles.container}>
      {/* Header Badge */}
      <View style={styles.topBadgeRow}>
        <View style={styles.calibratedPill}>
          <Sparkles size={13} color={Theme.colors.primary} />
          <Text style={styles.calibratedPillText}>FINE-TUNED CLINICAL MATRIX</Text>
        </View>
        <Text style={styles.timestampText}>Live Biometric Sync</Text>
      </View>

      <Text style={styles.cardTitle}>Calibrated Health Baseline</Text>
      <Text style={styles.cardSubtitle}>
        Generated dynamically from your 10-question assessment, baseline pain, flow, and mood check-in.
      </Text>

      {/* 4-Pillar Grid */}
      <View style={styles.grid}>
        {/* Metric 1: Strain Score */}
        <View style={styles.gridItem}>
          <View style={styles.itemHeader}>
            <Activity size={16} color={strainColor} />
            <Text style={styles.itemTitle}>Allostatic Strain</Text>
          </View>
          <Text style={[styles.itemValue, { color: strainColor }]}>
            {biometrics.strainScore}%
          </Text>
          <Text style={styles.itemSubtext}>
            {biometrics.strainLevel.toUpperCase()} STRAIN
          </Text>
        </View>

        {/* Metric 2: Pain Severity */}
        <View style={styles.gridItem}>
          <View style={styles.itemHeader}>
            <Flame size={16} color={painVal >= 6 ? Theme.colors.strainHigh : Theme.colors.strainAmber} />
            <Text style={styles.itemTitle}>Pain Baseline</Text>
          </View>
          <Text
            style={[
              styles.itemValue,
              { color: painVal >= 6 ? Theme.colors.strainHigh : Theme.colors.strainAmber },
            ]}
          >
            {painVal}/10
          </Text>
          <Text style={styles.itemSubtext} numberOfLines={1}>
            {latestPain?.painLocation?.[0] || 'Pelvic Cramping'}
          </Text>
        </View>

        {/* Metric 3: Menstrual Flow */}
        <View style={styles.gridItem}>
          <View style={styles.itemHeader}>
            <Droplets size={16} color={Theme.colors.primary} />
            <Text style={styles.itemTitle}>Active Flow</Text>
          </View>
          <Text style={[styles.itemValue, { color: Theme.colors.primary }]}>
            {flowVal.toUpperCase()}
          </Text>
          <Text style={styles.itemSubtext} numberOfLines={1}>
            {latestFlow?.flowColor || 'Cervical markers'}
          </Text>
        </View>

        {/* Metric 4: Mood & Vitality */}
        <View style={styles.gridItem}>
          <View style={styles.itemHeader}>
            <Smile size={16} color={Theme.colors.secondary} />
            <Text style={styles.itemTitle}>Mood & Energy</Text>
          </View>
          <Text style={[styles.itemValue, { color: Theme.colors.secondary }]}>
            {moodVal}/5
          </Text>
          <Text style={styles.itemSubtext} numberOfLines={1}>
            {energyVal.toUpperCase()} VITALITY
          </Text>
        </View>
      </View>

      {/* Identified Conditions Shield */}
      <View style={styles.shieldRow}>
        <Shield size={16} color={Theme.colors.strainOptimal} />
        <View style={{ flex: 1 }}>
          <Text style={styles.shieldLabel}>Primary Clinical Shield & Archetype:</Text>
          <Text style={styles.shieldValue}>
            {settings.archetypeName} ({cycle.conditions.join(', ') || 'Cycle Sync'})
          </Text>
        </View>
      </View>

      {/* Cycle Prediction & Precaution Protocols */}
      {cyclePrediction && (
        <View style={styles.predictionBox}>
          <View style={styles.predictionBoxHeader}>
            <View style={styles.predictionBadge}>
              <Calendar size={13} color="#FFFFFF" />
              <Text style={styles.predictionBadgeText}>CYCLE PREDICTION & PRECAUTIONS</Text>
            </View>
            <Text style={styles.confidenceScoreText}>
              {cyclePrediction.confidencePercentage}% Confidence
            </Text>
          </View>

          <View style={styles.predictionDataRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.predictionDataLabel}>Predicted Next Period Start</Text>
              <Text style={styles.predictionDataVal}>{cyclePrediction.nextPeriodDate}</Text>
              <Text style={styles.predictionCountdownText}>
                {cyclePrediction.daysUntilNextPeriod === 0
                  ? `Due Today (${cyclePrediction.predictedCycleLength}d cycle length)`
                  : cyclePrediction.daysUntilNextPeriod < 0
                  ? `~${Math.abs(cyclePrediction.daysUntilNextPeriod)}d overdue (${cyclePrediction.predictedCycleLength}d cycle length)`
                  : `~${cyclePrediction.daysUntilNextPeriod} days remaining (${cyclePrediction.predictedCycleLength}d cycle length)`}
              </Text>
            </View>
          </View>

          {/* Precautions List */}
          {cyclePrediction.precautionMeasures?.length > 0 && (
            <View style={styles.precautionsContainer}>
              <Text style={styles.precautionsSectionHeading}>Tailored Clinical Precautions:</Text>
              {cyclePrediction.precautionMeasures.slice(0, 3).map((p) => {
                const isHigh = p.urgency === 'high';
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.precautionItem,
                      isHigh && styles.precautionItemHigh,
                    ]}
                  >
                    <View style={styles.precautionItemHeader}>
                      <ShieldAlert size={14} color={isHigh ? '#DC2626' : Theme.colors.secondary} />
                      <Text style={styles.precautionItemTitle}>{p.title}</Text>
                      <Text style={[styles.precautionUrgency, isHigh && styles.precautionUrgencyHigh]}>
                        {p.urgency.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.precautionItemAdvice}>{p.advice}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Doctor Consultation Talking Points */}
      <View style={styles.doctorNotesCard}>
        <View style={styles.doctorNotesHeader}>
          <ClipboardList size={16} color={Theme.colors.textPrimary} />
          <Text style={styles.doctorNotesTitle}>Doctor Co-Pilot Consultation Talking Points</Text>
        </View>

        <View style={styles.talkingPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.talkingPointText}>
            <Text style={styles.boldText}>Next Cycle Rhythm:</Text> Next menses predicted on{' '}
            <Text style={styles.boldText}>{cyclePrediction?.nextPeriodDate || 'upcoming cycle'}</Text>{' '}
            ({cyclePrediction?.daysUntilNextPeriod === 0
              ? 'due today'
              : cyclePrediction?.daysUntilNextPeriod && cyclePrediction.daysUntilNextPeriod < 0
              ? `~${Math.abs(cyclePrediction.daysUntilNextPeriod)} days overdue`
              : `~${cyclePrediction?.daysUntilNextPeriod ?? 14} days`}). Model indicates{' '}
            {cyclePrediction?.regularityStatus === 'regular' ? 'stable 28-30 day rhythm' : 'irregular / high variance profile'}.
          </Text>
        </View>

        <View style={styles.talkingPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.talkingPointText}>
            <Text style={styles.boldText}>Cycle Regularity:</Text> Currently tracking {cycle.label}. Share 90-day chart showing{' '}
            {cycle.isIrregular ? 'anovulatory/extended gap intervals' : 'regular cyclical transitions'}.
          </Text>
        </View>

        {painVal >= 6 && (
          <View style={styles.talkingPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.talkingPointText}>
              <Text style={styles.boldText}>Severe Dysmenorrhea:</Text> Pain score peaks at {painVal}/10. Request ultrasound evaluation for secondary dysmenorrhea or pelvic adhesions.
            </Text>
          </View>
        )}

        {(flowVal === 'heavy' || flowVal === 'severe') && (
          <View style={styles.talkingPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.talkingPointText}>
              <Text style={styles.boldText}>Menorrhagia Risk:</Text> Heavy flow logged with clots. Request complete blood count (CBC) and serum ferritin/iron stores test.
            </Text>
          </View>
        )}

        {moodVal <= 2 && (
          <View style={styles.talkingPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.talkingPointText}>
              <Text style={styles.boldText}>Luteal PMDD Sensitivity:</Text> Significant mood dips correlating with late luteal phase. Inquire about cycle-phase neuro-steroid support.
            </Text>
          </View>
        )}

        <View style={styles.talkingPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.talkingPointText}>
            <Text style={styles.boldText}>Autonomic Balance:</Text> HRV currently at {biometrics.hrv.current} ms ({biometrics.hrv.label}). Adrenal cortisol override active.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    ...Theme.shadows.card,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calibratedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  calibratedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primaryDark,
    letterSpacing: 0.5,
  },
  timestampText: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorderLight,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  itemValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  itemSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F5F1',
    borderRadius: Theme.radius.md,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  shieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.strainOptimal,
    textTransform: 'uppercase',
  },
  shieldValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 1,
  },
  doctorNotesCard: {
    backgroundColor: '#FFF9FB',
    borderRadius: Theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  doctorNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  doctorNotesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  talkingPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 12,
    color: Theme.colors.primaryDark,
    fontWeight: '800',
  },
  talkingPointText: {
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  predictionBox: {
    backgroundColor: '#1E1B2E',
    borderRadius: Theme.radius.lg,
    padding: 14,
    marginBottom: 14,
    ...Theme.shadows.card,
  },
  predictionBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 77, 141, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  predictionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF69B4',
    letterSpacing: 0.4,
  },
  confidenceScoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  predictionDataRow: {
    marginBottom: 8,
  },
  predictionDataLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 2,
  },
  predictionDataVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  predictionCountdownText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginTop: 1,
  },
  precautionsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
    gap: 6,
  },
  precautionsSectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  precautionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
  },
  precautionItemHigh: {
    borderLeftColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  precautionItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  precautionItemTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  precautionUrgency: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.secondary,
  },
  precautionUrgencyHigh: {
    color: '#F87171',
  },
  precautionItemAdvice: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 14,
  },
});
