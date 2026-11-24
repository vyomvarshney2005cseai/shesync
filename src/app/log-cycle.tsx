import React, { useState, useMemo } from 'react';
import { Pressable, View, Text, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore, withFreshDaysAgo } from '@/store/useAppStore';
import { nextSyncHref, syncStepBadge } from '@/lib/syncDetails';
import { addDaysToKey, todayKey } from '@/lib/dates';
import { withTypicalLength } from '@/lib/periodDates';
import { SkipStepLink } from '@/components/common/SkipStepLink';
import { calculateCyclePredictionAndPrecautions } from '@/constants/cyclePrediction';
import { recentSignals } from '@/lib/recent';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { YearCycleCalendar } from '@/components/cycle/YearCycleCalendar';
import type { PastCycleRecord } from '@/types';
import { Button, Card } from '@/components/ds';


export default function LogCycleScreen() {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === 'true';

  const storedRememberedCount = useAppStore((s) => s.rememberedCyclesCount);
  const storedPastCycles = useAppStore((s) => s.pastCycles);
  const assessmentAnswers = useAppStore((s) => s.assessmentAnswers);
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const savePastCycles = useAppStore((s) => s.savePastCycles);

  // "Irregular / hard to predict" (saved as rememberedCyclesCount = -1, as before).
  const [irregular, setIrregular] = useState<boolean>(storedRememberedCount === -1);

  // Her saved periods, newest first. A first visit starts empty — no made-up dates.
  const [cyclesList, setCyclesList] = useState<PastCycleRecord[]>(() =>
    storedPastCycles && storedPastCycles.length > 0 ? withFreshDaysAgo(storedPastCycles) : []
  );
  const typicalLength = cyclesList[0]?.lengthDays ?? 28;
  const averageLength = cyclesList.length > 1
    ? Math.round(cyclesList.slice(1).reduce((a, c) => a + c.lengthDays, 0) / (cyclesList.length - 1))
    : typicalLength;

  // Today's pain and flow, read the same way as Home (recent logs only; no
  // made-up "moderate flow" when nothing was logged, which forced "Menstrual Phase").
  const signals = recentSignals(symptomLogs);
  const latestPain = signals.pain ?? 2;
  const latestFlow = signals.flow;

  // Live real-time prediction & enhanced precautions
  const prediction = useMemo(() => {
    return calculateCyclePredictionAndPrecautions(
      irregular ? -1 : Math.max(1, cyclesList.length),
      cyclesList,
      assessmentAnswers,
      latestPain,
      latestFlow
    );
  }, [irregular, cyclesList, assessmentAnswers, latestPain, latestFlow]);
  // The calendar wants a YYYY-MM-DD key for the predicted start.
  const predictedStartKey = cyclesList.length ? addDaysToKey(todayKey(), prediction.daysUntilNextPeriod) : undefined;

  const handleSaveAndProceed = () => {
    if (cyclesList.length === 0) {
      const msg = 'Tap the first and last day of your last period on the calendar, then “Save this period” — or choose “I don’t remember exactly”.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Add your last period', msg);
      return;
    }
    savePastCycles(irregular ? -1 : cyclesList.length, cyclesList);

    if (isOnboarding) {
      router.push(nextSyncHref(useAppStore.getState()));
    } else {
      const msg = 'Period dates saved.';
      if (Platform.OS === 'web') {
        window.alert(msg);
        router.back();
      } else {
        Alert.alert('Saved', msg, [{ text: 'OK', onPress: () => router.back() }]);
      }
    }
  };

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Button variant="secondary" size="sm" iconOnly onPress={() => router.back()} accessibilityLabel="Go back" icon={<ArrowLeft size={22} color={Theme.colors.textPrimary} />} />
          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>Period Cycle & Calendar</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Onboarding Stepper Header */}
          {isOnboarding && (
            <View style={styles.onboardingBanner}>
              <View style={styles.onboardingBadge}>
                <Sparkles size={13} color={Theme.colors.primary} />
                <Text style={styles.onboardingBadgeText}>
                  {syncStepBadge('period')}
                </Text>
              </View>
              <Text style={styles.onboardingTitle}>
                Your period dates
              </Text>
              <Text style={styles.onboardingDesc}>
                Tap the first and last day of your last period — add more if you remember them.
              </Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 12 }}>
                <SkipStepLink step="period" />
              </View>
            </View>
          )}

          {/* Section: Interactive Full-Year Calendar */}
          <YearCycleCalendar
            pastCycles={cyclesList}
            onCyclesChange={setCyclesList}
            predictedNextStart={predictedStartKey}
            predictedLength={prediction.predictedCycleLength}
          />

          {/* Section: Typical cycle length + irregular */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Your cycle length</Text>
            </View>
            {cyclesList.length > 1 ? (
              <Text style={styles.controlLabel}>
                About {averageLength} days between periods, worked out from your dates.
              </Text>
            ) : (
              <View style={styles.controlBox}>
                <View style={styles.controlLabelRow}>
                  <Text style={styles.controlLabel}>Usually, first day to first day</Text>
                  <Text style={styles.controlValueHighlight}>{typicalLength} Days</Text>
                </View>
                <View style={styles.stepperFullRow}>
                  <Button variant="secondary" size="sm" iconOnly disabled={!cyclesList.length} onPress={() => setCyclesList((list) => withTypicalLength(list, typicalLength - 1))} accessibilityLabel="Shorter cycle" icon={<Minus size={20} color={Theme.colors.textPrimary} />} />
                  <Text style={styles.stepperCountDisplay}>
                    {typicalLength} <Text style={styles.stepperCountSub}>days</Text>
                  </Text>
                  <Button variant="secondary" size="sm" iconOnly disabled={!cyclesList.length} onPress={() => setCyclesList((list) => withTypicalLength(list, typicalLength + 1))} accessibilityLabel="Longer cycle" icon={<Plus size={20} color={Theme.colors.textPrimary} />} />
                </View>
                <Text style={styles.stepperHint}>
                  {cyclesList.length ? 'Not sure? 28 days is a good start — it sharpens as you log.' : 'Save a period first.'}
                </Text>
              </View>
            )}
            <Pressable
              style={[styles.irregularRow, irregular && styles.irregularRowOn]}
              onPress={() => setIrregular((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: irregular }}
            >
              <View style={[styles.radioCircle, irregular && styles.radioCircleSelected]}>
                {irregular && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>My periods are irregular</Text>
                <Text style={styles.optionDesc}>They come at very different times — predictions get a wider margin.</Text>
              </View>
            </Pressable>
          </Card>

          {/* Section: Prediction */}
          {cyclesList.length > 0 ? (
          <View style={styles.predictionCard}>
            <Text style={styles.predictionDateLabel}>Next period</Text>
            <Text style={styles.predictionDateValue}>{prediction.nextPeriodDate}</Text>
            <Text style={styles.predictionCountdown}>
              {prediction.daysUntilNextPeriod === 0
                ? 'Due today'
                : prediction.daysUntilNextPeriod < 0
                ? `${Math.abs(prediction.daysUntilNextPeriod)} ${Math.abs(prediction.daysUntilNextPeriod) === 1 ? 'day' : 'days'} late`
                : `In about ${prediction.daysUntilNextPeriod} ${prediction.daysUntilNextPeriod === 1 ? 'day' : 'days'}`}
            </Text>

            {prediction.approximateDates ? (
              <Text style={styles.approxNote}>
                ≈ Some dates are approximate, so this could be ±{prediction.cycleVarianceDays} days. Log your next period on the day it starts.
              </Text>
            ) : null}

            {/* Phase Breakdown Card */}
            {prediction.cyclePhaseBreakdown && (
              <View style={styles.phaseBreakdownBox}>
                <View style={styles.phaseTopRow}>
                  <Text style={styles.phaseNameText}>
                    {prediction.cyclePhaseBreakdown.phaseName}
                  </Text>
                  <View style={styles.daysRemainingBadge}>
                    <Text style={styles.daysRemainingBadgeText}>
                      ~{prediction.cyclePhaseBreakdown.daysRemainingInPhase}d left in phase
                    </Text>
                  </View>
                </View>
                <Text style={styles.phaseDescText}>
                  {prediction.cyclePhaseBreakdown.phaseDescription}
                </Text>
              </View>
            )}


            {/* Timeline Breakdown */}
            <View style={styles.timelineBox}>
              <View style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineLabel}>Ovulation:</Text>
                <Text style={styles.timelineVal}>{prediction.ovulationWindow}</Text>
              </View>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: themed('#F59E0B') }]} />
                <Text style={styles.timelineLabel}>PMS days:</Text>
                <Text style={styles.timelineVal}>{prediction.lutealPhaseWindow}</Text>
              </View>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: Theme.colors.primary }]} />
                <Text style={styles.timelineLabel}>Regularity:</Text>
                <Text style={styles.timelineVal}>
                  {prediction.regularityStatus === 'regular'
                    ? 'Regular'
                    : prediction.regularityStatus === 'moderate_variance'
                    ? 'Varies a little'
                    : 'Irregular'}
                </Text>
              </View>
            </View>
          </View>
          ) : null}

          {/* Section: User-Friendly Daily Actionable Insights */}
          {cyclesList.length > 0 && prediction.userFriendlyInsights && prediction.userFriendlyInsights.length > 0 && (
            <View style={styles.insightsSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Tips for today</Text>
              </View>

              {prediction.userFriendlyInsights.map((insight) => (
                <View key={insight.id} style={styles.insightCard}>
                  <Text style={styles.insightHeadline}>{insight.headline}</Text>
                  <Text style={styles.insightExplanation}>{insight.explanation}</Text>
                  <Text style={styles.actionTipText}>{insight.actionTip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Section: Tailored Precaution Measures */}
          {cyclesList.length > 0 ? (
          <View style={styles.precautionsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Coming up</Text>
            </View>

            {prediction.precautionMeasures.map((measure) => {
              const isHigh = measure.urgency === 'high';
              return (
                <View
                  key={measure.id}
                  style={[
                    styles.precautionCard,
                    isHigh && styles.precautionCardHigh,
                  ]}
                >
                  <Text style={styles.precautionTitle}>{measure.title}</Text>
                  <Text style={styles.precautionAdvice}>{measure.advice}</Text>
                </View>
              );
            })}
          </View>
          ) : null}

          {/* Bottom Action CTA */}
          <Button
            size="lg"
            fullWidth
            title={isOnboarding ? 'Save dates & continue' : 'Save dates'}
            iconRight={isOnboarding ? <ArrowRight size={20} color={Theme.colors.onPrimary} /> : undefined}
            onPress={handleSaveAndProceed}
            style={styles.saveButton}
          />
        </ScrollView>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = createStyles(() => ({
  stepperHint: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
  irregularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  irregularRowOn: { borderColor: Theme.colors.primary, backgroundColor: Theme.colors.primaryLight },
  approxNote: { fontSize: 14, lineHeight: 20, color: Theme.colors.secondaryDark, fontWeight: '600', marginTop: 8 },
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
  },
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  navSubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  onboardingBanner: {
    backgroundColor: '#FDF2F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  onboardingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  onboardingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  onboardingDesc: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  sectionCard: { marginBottom: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsGrid: {
    gap: 8,
  },
  optionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionCardSelected: {
    backgroundColor: '#FDF2F8',
    borderColor: Theme.colors.primary,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  optionLabelSelected: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Theme.colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
  },
  optionDesc: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  optionDescSelected: {
    color: '#9D174D',
  },
  controlBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  controlLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  controlValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  stepperFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBtn: {
  },
  stepperCountDisplay: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  stepperCountSub: {
    fontSize: 12,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
  },
  predictionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  predictionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  predictionDateLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  predictionDateValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  predictionCountdown: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 16,
  },
  phaseBreakdownBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  phaseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBCFE8',
  },
  daysRemainingBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysRemainingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F472B6',
  },
  phaseDescText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 8,
  },
  hormoneTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hormoneTagText: {
    fontSize: 12,
    color: '#93C5FD',
    fontWeight: '600',
  },
  healthScoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  healthScoreItem: {
    alignItems: 'center',
  },
  healthScoreVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  healthScoreLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  healthScoreDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  timelineBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
    marginRight: 8,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },
  timelineVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  insightsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightTitleBox: {
    flex: 1,
  },
  insightCategory: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 0.5,
  },
  insightHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  insightExplanation: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionTipBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  actionTipLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  actionTipText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
  },
  precautionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  precautionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  precautionCardHigh: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  precautionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyHigh: {
    backgroundColor: '#FEE2E2',
  },
  urgencyModerate: {
    backgroundColor: '#FEF3C7',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '800',
  },
  urgencyTextHigh: {
    color: '#DC2626',
  },
  urgencyTextModerate: {
    color: '#D97706',
  },
  phaseTargetText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  precautionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  precautionAdvice: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  saveButton: {
    marginBottom: 20,
  },
}));
