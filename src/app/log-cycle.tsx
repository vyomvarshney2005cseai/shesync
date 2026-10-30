import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ShieldAlert,
  Heart,
  Activity,
  CheckCircle2,
  ChevronRight,
  Plus,
  Minus,
  AlertTriangle,
  Info,
  Layers,
  Zap,
  TrendingUp,
} from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { calculateCyclePredictionAndPrecautions } from '@/constants/cyclePrediction';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { YearCycleCalendar } from '@/components/cycle/YearCycleCalendar';
import type { PastCycleRecord } from '@/types';

const REMEMBERED_OPTIONS = [
  { count: 1, label: '1 Cycle', desc: 'Last month only' },
  { count: 2, label: '2 Cycles', desc: 'Last 2 months' },
  { count: 3, label: '3 Cycles', desc: 'Recommended baseline' },
  { count: 4, label: '4+ Cycles', desc: 'High precision tracking' },
  { count: -1, label: 'Irregular / Uncertain', desc: 'Cycles vary unpredictably' },
];

export default function LogCycleScreen() {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === 'true';

  const storedRememberedCount = useAppStore((s) => s.rememberedCyclesCount);
  const storedPastCycles = useAppStore((s) => s.pastCycles);
  const assessmentAnswers = useAppStore((s) => s.assessmentAnswers);
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const savePastCycles = useAppStore((s) => s.savePastCycles);

  // User selection of how many cycles they remember
  const [rememberedCount, setRememberedCount] = useState<number>(
    storedRememberedCount || 3
  );

  // Full dynamic cycles state (synced with Calendar and Steppers)
  const [cyclesList, setCyclesList] = useState<PastCycleRecord[]>(() => {
    if (storedPastCycles && storedPastCycles.length > 0) {
      return storedPastCycles;
    }
    const today = Date.now();
    return [
      {
        id: 'cycle-1',
        cycleNumber: 1,
        startDate: new Date(today - 14 * 86400000).toISOString().split('T')[0],
        endDate: new Date(today - 9 * 86400000).toISOString().split('T')[0],
        daysAgo: 14,
        lengthDays: 28,
        periodDurationDays: 5,
      },
      {
        id: 'cycle-2',
        cycleNumber: 2,
        startDate: new Date(today - 42 * 86400000).toISOString().split('T')[0],
        endDate: new Date(today - 37 * 86400000).toISOString().split('T')[0],
        daysAgo: 42,
        lengthDays: 29,
        periodDurationDays: 5,
      },
      {
        id: 'cycle-3',
        cycleNumber: 3,
        startDate: new Date(today - 71 * 86400000).toISOString().split('T')[0],
        endDate: new Date(today - 65 * 86400000).toISOString().split('T')[0],
        daysAgo: 71,
        lengthDays: 30,
        periodDurationDays: 6,
      },
    ];
  });

  // Individual stepper controls for fine-tuning
  const [cycle1DaysAgo, setCycle1DaysAgo] = useState<number>(
    cyclesList[0]?.daysAgo ?? 14
  );
  const [cycle1Length, setCycle1Length] = useState<number>(
    cyclesList[0]?.lengthDays ?? 28
  );
  const [cycle1Duration, setCycle1Duration] = useState<number>(
    cyclesList[0]?.periodDurationDays ?? 5
  );

  const [cycle2Length, setCycle2Length] = useState<number>(
    cyclesList[1]?.lengthDays ?? 29
  );
  const [cycle3Length, setCycle3Length] = useState<number>(
    cyclesList[2]?.lengthDays ?? 30
  );

  // Sync when calendar changes
  const handleCalendarCyclesChange = (newCycles: PastCycleRecord[]) => {
    setCyclesList(newCycles);
    if (newCycles[0]) {
      setCycle1DaysAgo(newCycles[0].daysAgo ?? 14);
      setCycle1Length(newCycles[0].lengthDays ?? 28);
      setCycle1Duration(newCycles[0].periodDurationDays ?? 5);
    }
    if (newCycles[1]) {
      setCycle2Length(newCycles[1].lengthDays ?? 29);
    }
    if (newCycles[2]) {
      setCycle3Length(newCycles[2].lengthDays ?? 30);
    }
  };

  // Sync when steppers change
  const handleStepperUpdate = (
    c1DaysAgo: number,
    c1Len: number,
    c1Dur: number,
    c2Len: number,
    c3Len: number
  ) => {
    const today = Date.now();
    const c1Start = new Date(today - c1DaysAgo * 86400000).toISOString().split('T')[0];
    const c1End = new Date(today - (c1DaysAgo - c1Dur + 1) * 86400000)
      .toISOString()
      .split('T')[0];

    const c2DaysAgo = c1DaysAgo + c1Len;
    const c2Start = new Date(today - c2DaysAgo * 86400000).toISOString().split('T')[0];

    const c3DaysAgo = c2DaysAgo + c2Len;
    const c3Start = new Date(today - c3DaysAgo * 86400000).toISOString().split('T')[0];

    const updated: PastCycleRecord[] = [
      {
        id: cyclesList[0]?.id || 'cycle-1',
        cycleNumber: 1,
        startDate: c1Start,
        endDate: c1End,
        daysAgo: c1DaysAgo,
        lengthDays: c1Len,
        periodDurationDays: c1Dur,
      },
      {
        id: cyclesList[1]?.id || 'cycle-2',
        cycleNumber: 2,
        startDate: c2Start,
        daysAgo: c2DaysAgo,
        lengthDays: c2Len,
        periodDurationDays: cyclesList[1]?.periodDurationDays || 5,
      },
      {
        id: cyclesList[2]?.id || 'cycle-3',
        cycleNumber: 3,
        startDate: c3Start,
        daysAgo: c3DaysAgo,
        lengthDays: c3Len,
        periodDurationDays: cyclesList[2]?.periodDurationDays || 5,
      },
      ...cyclesList.slice(3),
    ];

    setCyclesList(updated);
  };

  // Latest logged pain and flow
  const latestPain = symptomLogs.find((l) => l.pain !== undefined)?.pain ?? 6;
  const latestFlow = symptomLogs.find((l) => l.flow !== undefined)?.flow ?? 'moderate';

  // Live real-time prediction & enhanced precautions
  const prediction = useMemo(() => {
    const effectiveCount = rememberedCount === -1 ? 1 : rememberedCount;
    return calculateCyclePredictionAndPrecautions(
      effectiveCount,
      cyclesList,
      assessmentAnswers,
      latestPain,
      latestFlow
    );
  }, [rememberedCount, cyclesList, assessmentAnswers, latestPain, latestFlow]);

  // Formatted date for most recent period
  const formattedLastStartDate = useMemo(() => {
    const d = new Date(Date.now() - cycle1DaysAgo * 86400000);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [cycle1DaysAgo]);

  const handleSaveAndProceed = () => {
    const effectiveCount = rememberedCount === -1 ? 1 : Math.max(1, rememberedCount);
    savePastCycles(effectiveCount, cyclesList.slice(0, effectiveCount));

    if (isOnboarding) {
      router.push('/log-pain?onboarding=true');
    } else {
      const msg = 'Period dates and full-year cycle rhythm saved. Analytics calibrated!';
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={Theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>Period Cycle & Calendar</Text>
            <Text style={styles.navSubtitle}>Full-Year Rhythm & Analytics</Text>
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
                  BASELINE CALIBRATION (STEP 1 OF 4)
                </Text>
              </View>
              <Text style={styles.onboardingTitle}>
                Tick Your Period Start & End Dates
              </Text>
              <Text style={styles.onboardingDesc}>
                Use the full-year calendar to tick when your period starts and ends.
                SheSync calculates variance across the year to predict upcoming cycles and
                deploy tailored precautions.
              </Text>
            </View>
          )}

          {/* Section: Interactive Full-Year Calendar */}
          <YearCycleCalendar
            pastCycles={cyclesList}
            onCyclesChange={handleCalendarCyclesChange}
            predictedNextStart={prediction.nextPeriodDate}
            predictedLength={prediction.predictedCycleLength}
          />

          {/* Section: Question - How many cycles do you remember? */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Layers size={18} color={Theme.colors.primary} />
              <Text style={styles.sectionTitle}>
                How Many Past Cycles Do You Recall?
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Even recalling 1 or 2 past cycles sharpens prediction confidence.
            </Text>

            <View style={styles.optionsGrid}>
              {REMEMBERED_OPTIONS.map((opt) => {
                const isSelected = rememberedCount === opt.count;
                return (
                  <TouchableOpacity
                    key={opt.count}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                    onPress={() => setRememberedCount(opt.count)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionHeader}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.optionDesc,
                        isSelected && styles.optionDescSelected,
                      ]}
                    >
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section: Fine-Tune Steppers for Most Recent Cycle */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Clock size={18} color={Theme.colors.secondary} />
              <Text style={styles.sectionTitle}>Fine-Tune Cycle Parameters</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Adjust cycle length or bleeding duration directly or rely on your calendar selections.
            </Text>

            {/* Cycle Length Stepper */}
            <View style={styles.controlBox}>
              <View style={styles.controlLabelRow}>
                <Text style={styles.controlLabel}>Cycle Length (Start to Start)</Text>
                <Text style={styles.controlValueHighlight}>{cycle1Length} Days</Text>
              </View>
              <View style={styles.stepperFullRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const newVal = Math.max(20, cycle1Length - 1);
                    setCycle1Length(newVal);
                    handleStepperUpdate(
                      cycle1DaysAgo,
                      newVal,
                      cycle1Duration,
                      cycle2Length,
                      cycle3Length
                    );
                  }}
                >
                  <Minus size={16} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperCountDisplay}>
                  {cycle1Length} <Text style={styles.stepperCountSub}>days</Text>
                </Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const newVal = Math.min(60, cycle1Length + 1);
                    setCycle1Length(newVal);
                    handleStepperUpdate(
                      cycle1DaysAgo,
                      newVal,
                      cycle1Duration,
                      cycle2Length,
                      cycle3Length
                    );
                  }}
                >
                  <Plus size={16} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bleeding Duration Stepper */}
            <View style={styles.controlBox}>
              <View style={styles.controlLabelRow}>
                <Text style={styles.controlLabel}>Bleeding Duration</Text>
                <Text style={styles.controlValueHighlight}>{cycle1Duration} Days</Text>
              </View>
              <View style={styles.stepperFullRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const newVal = Math.max(2, cycle1Duration - 1);
                    setCycle1Duration(newVal);
                    handleStepperUpdate(
                      cycle1DaysAgo,
                      cycle1Length,
                      newVal,
                      cycle2Length,
                      cycle3Length
                    );
                  }}
                >
                  <Minus size={16} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperCountDisplay}>
                  {cycle1Duration} <Text style={styles.stepperCountSub}>days</Text>
                </Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    const newVal = Math.min(10, cycle1Duration + 1);
                    setCycle1Duration(newVal);
                    handleStepperUpdate(
                      cycle1DaysAgo,
                      cycle1Length,
                      newVal,
                      cycle2Length,
                      cycle3Length
                    );
                  }}
                >
                  <Plus size={16} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section: Real-Time Precision Prediction Card */}
          <View style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <View style={styles.predictionBadge}>
                <CalendarIcon size={13} color="#FFFFFF" />
                <Text style={styles.predictionBadgeText}>NEXT CYCLE PREDICTION</Text>
              </View>
              <View style={styles.confidencePill}>
                <CheckCircle2 size={12} color="#10B981" />
                <Text style={styles.confidenceText}>
                  {prediction.confidencePercentage}% Precision
                </Text>
              </View>
            </View>

            <Text style={styles.predictionDateLabel}>Predicted Next Period Start</Text>
            <Text style={styles.predictionDateValue}>{prediction.nextPeriodDate}</Text>
            <Text style={styles.predictionCountdown}>
              {prediction.daysUntilNextPeriod === 0
                ? 'Cycle complete • Due today'
                : prediction.daysUntilNextPeriod < 0
                ? `Cycle delayed • ~${Math.abs(prediction.daysUntilNextPeriod)} days past estimated onset`
                : `Starts in approximately ~${prediction.daysUntilNextPeriod} days`}
            </Text>

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
                <View style={styles.hormoneTag}>
                  <Text style={styles.hormoneTagText}>
                    🧬 {prediction.cyclePhaseBreakdown.hormoneOverview}
                  </Text>
                </View>
              </View>
            )}

            {/* Health Scores Triad */}
            {prediction.healthScores && (
              <View style={styles.healthScoresRow}>
                <View style={styles.healthScoreItem}>
                  <Text style={styles.healthScoreVal}>
                    {prediction.healthScores.hormonalHarmony}%
                  </Text>
                  <Text style={styles.healthScoreLabel}>Hormone Harmony</Text>
                </View>
                <View style={styles.healthScoreDivider} />
                <View style={styles.healthScoreItem}>
                  <Text style={styles.healthScoreVal}>
                    {prediction.healthScores.autonomicRecovery}%
                  </Text>
                  <Text style={styles.healthScoreLabel}>Autonomic Recovery</Text>
                </View>
                <View style={styles.healthScoreDivider} />
                <View style={styles.healthScoreItem}>
                  <Text style={styles.healthScoreVal}>
                    {prediction.healthScores.cycleStability}%
                  </Text>
                  <Text style={styles.healthScoreLabel}>Cycle Stability</Text>
                </View>
              </View>
            )}

            {/* Timeline Breakdown */}
            <View style={styles.timelineBox}>
              <View style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineLabel}>Predicted Ovulation Window:</Text>
                <Text style={styles.timelineVal}>{prediction.ovulationWindow}</Text>
              </View>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.timelineLabel}>Luteal Phase (PMS Window):</Text>
                <Text style={styles.timelineVal}>{prediction.lutealPhaseWindow}</Text>
              </View>
              <View style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: Theme.colors.primary }]} />
                <Text style={styles.timelineLabel}>Cycle Regularity Index:</Text>
                <Text style={styles.timelineVal}>
                  {prediction.regularityStatus === 'regular'
                    ? 'Regular Rhythm (±1-2 days)'
                    : prediction.regularityStatus === 'moderate_variance'
                    ? 'Moderate Variance (±3-4 days)'
                    : 'Irregular / PCOS Rhythm'}
                </Text>
              </View>
            </View>
          </View>

          {/* Section: User-Friendly Daily Actionable Insights */}
          {prediction.userFriendlyInsights && prediction.userFriendlyInsights.length > 0 && (
            <View style={styles.insightsSection}>
              <View style={styles.sectionHeaderRow}>
                <Zap size={18} color="#F59E0B" />
                <Text style={styles.sectionTitle}>What Your Body Needs Today</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Plain-English physiological guidance calibrated to your current cycle phase.
              </Text>

              {prediction.userFriendlyInsights.map((insight) => (
                <View key={insight.id} style={styles.insightCard}>
                  <View style={styles.insightHeaderRow}>
                    <Text style={styles.insightIcon}>{insight.icon}</Text>
                    <View style={styles.insightTitleBox}>
                      <Text style={styles.insightCategory}>
                        {insight.category.toUpperCase()} GUIDANCE
                      </Text>
                      <Text style={styles.insightHeadline}>{insight.headline}</Text>
                    </View>
                  </View>
                  <Text style={styles.insightExplanation}>{insight.explanation}</Text>
                  <View style={styles.actionTipBox}>
                    <Text style={styles.actionTipLabel}>💡 Action Step:</Text>
                    <Text style={styles.actionTipText}>{insight.actionTip}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Section: Tailored Precaution Measures */}
          <View style={styles.precautionsSection}>
            <View style={styles.sectionHeaderRow}>
              <ShieldAlert size={18} color={Theme.colors.strainHigh} />
              <Text style={styles.sectionTitle}>Tailored Precaution Measures</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Actionable clinical precautions generated based on your past cycles and symptom profile.
            </Text>

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
                  <View style={styles.precautionTopRow}>
                    <View
                      style={[
                        styles.urgencyBadge,
                        isHigh ? styles.urgencyHigh : styles.urgencyModerate,
                      ]}
                    >
                      <Text
                        style={[
                          styles.urgencyText,
                          isHigh ? styles.urgencyTextHigh : styles.urgencyTextModerate,
                        ]}
                      >
                        {measure.urgency.toUpperCase()} URGENCY
                      </Text>
                    </View>
                    <Text style={styles.phaseTargetText}>{measure.phaseTarget}</Text>
                  </View>

                  <Text style={styles.precautionTitle}>{measure.title}</Text>
                  <Text style={styles.precautionAdvice}>{measure.advice}</Text>
                </View>
              );
            })}
          </View>

          {/* Bottom Action CTA */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveAndProceed}
            activeOpacity={0.88}
          >
            <Text style={styles.saveButtonText}>
              {isOnboarding
                ? 'Save Calendar & Continue to Pain Check-in (Step 2/4) →'
                : 'Save Cycle Dates & Sync Analytics'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = StyleSheet.create({
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  navSubtitle: {
    fontSize: 12,
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
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  onboardingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  onboardingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  onboardingDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
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
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
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
    marginBottom: 3,
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
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  optionDescSelected: {
    color: '#9D174D',
  },
  controlBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
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
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  controlValueHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  stepperFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 20,
    padding: 18,
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
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  predictionBadgeText: {
    fontSize: 10,
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
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  predictionDateLabel: {
    fontSize: 12,
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
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 14,
  },
  phaseBreakdownBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  daysRemainingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F472B6',
  },
  phaseDescText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 17,
    marginBottom: 6,
  },
  hormoneTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hormoneTagText: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '600',
  },
  healthScoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 14,
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
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
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
    padding: 10,
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightTitleBox: {
    flex: 1,
  },
  insightCategory: {
    fontSize: 9,
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
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 17,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  actionTipText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 16,
  },
  precautionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgencyHigh: {
    backgroundColor: '#FEE2E2',
  },
  urgencyModerate: {
    backgroundColor: '#FEF3C7',
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '800',
  },
  urgencyTextHigh: {
    color: '#DC2626',
  },
  urgencyTextModerate: {
    color: '#D97706',
  },
  phaseTargetText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  precautionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  precautionAdvice: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 17,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
