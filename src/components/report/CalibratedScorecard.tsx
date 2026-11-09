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

  // Show "not logged" instead of inventing defaults.
  const painVal = latestPain?.pain;
  const flowVal = latestFlow?.flow;
  const moodVal = latestMood?.mood;
  const energyVal = latestMood?.energy;

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
          <Text style={styles.calibratedPillText}>FINE-TUNED FROM YOUR LOGS</Text>
        </View>
        <Text style={styles.timestampText}>Updates as you log</Text>
      </View>

      <Text style={styles.cardTitle}>Calibrated Health Baseline</Text>
      <Text style={styles.cardSubtitle}>
        Built from your 10-question assessment and your latest pain, flow, mood and sleep logs.
      </Text>

      {/* 4-Pillar Grid */}
      <View style={styles.grid}>
        {/* Metric 1: Strain Score */}
        <View style={styles.gridItem}>
          <View style={styles.itemHeader}>
            <Activity size={16} color={strainColor} />
            <Text style={styles.itemTitle}>Daily Strain</Text>
          </View>
          <Text style={[styles.itemValue, { color: strainColor }]}>
            {biometrics.strainScore}/100
          </Text>
          <Text style={styles.itemSubtext}>
            {biometrics.strainLevel.toUpperCase()} STRAIN
          </Text>
        </View>

        {/* Metric 2: Pain Severity */}
        <View style={styles.gridItem}>
          <View style={styles.itemHeader}>
            <Flame size={16} color={(painVal ?? 0) >= 6 ? Theme.colors.strainHigh : Theme.colors.strainAmber} />
            <Text style={styles.itemTitle}>Pain Baseline</Text>
          </View>
          <Text
            style={[
              styles.itemValue,
              { color: (painVal ?? 0) >= 6 ? Theme.colors.strainHigh : Theme.colors.strainAmber },
            ]}
          >
            {painVal != null ? `${painVal}/10` : '—'}
          </Text>
          <Text style={styles.itemSubtext} numberOfLines={1}>
            {latestPain?.painLocation?.[0] || (painVal != null ? 'Logged' : 'Not logged yet')}
          </Text>
        </View>

        {/* Metric 3: Menstrual Flow */}
        <View style={styles.gridItem}>
          <View style={styles.itemHeader}>
            <Droplets size={16} color={Theme.colors.primary} />
            <Text style={styles.itemTitle}>Active Flow</Text>
          </View>
          <Text style={[styles.itemValue, { color: Theme.colors.primary }]}>
            {flowVal ? flowVal.toUpperCase() : '—'}
          </Text>
          <Text style={styles.itemSubtext} numberOfLines={1}>
            {latestFlow?.flowColor || (flowVal ? 'Logged' : 'Not logged yet')}
          </Text>
        </View>

        {/* Metric 4: Mood & Vitality */}
        <View style={styles.gridItem}>
          <View style={styles.itemHeader}>
            <Smile size={16} color={Theme.colors.secondary} />
            <Text style={styles.itemTitle}>Mood & Energy</Text>
          </View>
          <Text style={[styles.itemValue, { color: Theme.colors.secondary }]}>
            {moodVal != null ? `${moodVal}/5` : '—'}
          </Text>
          <Text style={styles.itemSubtext} numberOfLines={1}>
            {energyVal ? `${energyVal.toUpperCase()} ENERGY` : 'Not logged yet'}
          </Text>
        </View>
      </View>

      {/* Identified Conditions Shield */}
      <View style={styles.shieldRow}>
        <Shield size={16} color={Theme.colors.strainOptimal} />
        <View style={{ flex: 1 }}>
          <Text style={styles.shieldLabel}>Archetype & focus areas (self-chosen):</Text>
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
              {cyclePrediction.confidencePercentage}% Precision
            </Text>
          </View>

          {/* Phase Breakdown Card */}
          {cyclePrediction.cyclePhaseBreakdown && (
            <View style={styles.phaseOverviewCard}>
              <View style={styles.phaseOverviewTop}>
                <Text style={styles.phaseOverviewTitle}>
                  {cyclePrediction.cyclePhaseBreakdown.phaseName}
                </Text>
                <Text style={styles.phaseOverviewBadge}>
                  ~{cyclePrediction.cyclePhaseBreakdown.daysRemainingInPhase}d left in phase
                </Text>
              </View>
              <Text style={styles.phaseOverviewDesc}>
                {cyclePrediction.cyclePhaseBreakdown.phaseDescription}
              </Text>
              <Text style={styles.phaseOverviewHormone}>
                🧬 {cyclePrediction.cyclePhaseBreakdown.hormoneOverview}
              </Text>
            </View>
          )}

          {/* Health Scores Triad */}
          {cyclePrediction.healthScores && (
            <View style={styles.scoreTriadRow}>
              <View style={styles.scoreTriadItem}>
                <Text style={styles.scoreTriadVal}>
                  {cyclePrediction.healthScores.hormonalHarmony}%
                </Text>
                <Text style={styles.scoreTriadLabel}>Hormonal Harmony</Text>
              </View>
              <View style={styles.scoreTriadDivider} />
              <View style={styles.scoreTriadItem}>
                <Text style={styles.scoreTriadVal}>
                  {cyclePrediction.healthScores.autonomicRecovery}%
                </Text>
                <Text style={styles.scoreTriadLabel}>Autonomic Recovery</Text>
              </View>
              <View style={styles.scoreTriadDivider} />
              <View style={styles.scoreTriadItem}>
                <Text style={styles.scoreTriadVal}>
                  {cyclePrediction.healthScores.cycleStability}%
                </Text>
                <Text style={styles.scoreTriadLabel}>Cycle Stability</Text>
              </View>
            </View>
          )}

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

        {(painVal ?? 0) >= 6 && (
          <View style={styles.talkingPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.talkingPointText}>
              <Text style={styles.boldText}>Strong period pain:</Text> logged at {painVal}/10. Ask whether tests such as an ultrasound are needed to look for causes like endometriosis or fibroids.
            </Text>
          </View>
        )}

        {(flowVal === 'heavy' || flowVal === 'severe') && (
          <View style={styles.talkingPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.talkingPointText}>
              <Text style={styles.boldText}>Heavy flow:</Text> heavy bleeding was logged. Ask whether a blood count and ferritin (iron) test make sense.
            </Text>
          </View>
        )}

        {moodVal != null && moodVal <= 2 && (
          <View style={styles.talkingPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.talkingPointText}>
              <Text style={styles.boldText}>Low mood:</Text> logged at {moodVal}/5. If dips come back before most periods, ask about PMS/PMDD screening and support.
            </Text>
          </View>
        )}

        <View style={styles.talkingPoint}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.talkingPointText}>
            <Text style={styles.boldText}>Daily strain:</Text> {biometrics.strainScore}/100 ({biometrics.strainLevel}) — a SheSync score from logged pain, flow, mood and sleep, not a lab or device reading.
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
  phaseOverviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  phaseOverviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseOverviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBCFE8',
  },
  phaseOverviewBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F472B6',
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  phaseOverviewDesc: {
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 15,
    marginBottom: 4,
  },
  phaseOverviewHormone: {
    fontSize: 10,
    color: '#93C5FD',
    fontWeight: '600',
  },
  scoreTriadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  scoreTriadItem: {
    alignItems: 'center',
  },
  scoreTriadVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreTriadLabel: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 1,
    fontWeight: '600',
  },
  scoreTriadDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});
