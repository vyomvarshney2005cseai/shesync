import React, { useState, useMemo } from 'react';
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
  Calendar,
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
} from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { calculateCyclePredictionAndPrecautions } from '@/constants/cyclePrediction';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
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

  // Editable past cycle records
  const [cycle1DaysAgo, setCycle1DaysAgo] = useState<number>(
    storedPastCycles[0]?.daysAgo ?? 14
  );
  const [cycle1Length, setCycle1Length] = useState<number>(
    storedPastCycles[0]?.lengthDays ?? 28
  );
  const [cycle1Duration, setCycle1Duration] = useState<number>(
    storedPastCycles[0]?.periodDurationDays ?? 5
  );

  const [cycle2Length, setCycle2Length] = useState<number>(
    storedPastCycles[1]?.lengthDays ?? 29
  );
  const [cycle2Duration, setCycle2Duration] = useState<number>(
    storedPastCycles[1]?.periodDurationDays ?? 5
  );

  const [cycle3Length, setCycle3Length] = useState<number>(
    storedPastCycles[2]?.lengthDays ?? 30
  );
  const [cycle3Duration, setCycle3Duration] = useState<number>(
    storedPastCycles[2]?.periodDurationDays ?? 6
  );

  const [cycle4Length, setCycle4Length] = useState<number>(
    storedPastCycles[3]?.lengthDays ?? 28
  );
  const [cycle4Duration, setCycle4Duration] = useState<number>(
    storedPastCycles[3]?.periodDurationDays ?? 5
  );

  // Construct current cycle records array
  const currentCycles: PastCycleRecord[] = useMemo(() => {
    const today = Date.now();
    const c1Start = new Date(today - cycle1DaysAgo * 86400000).toISOString().split('T')[0];
    const c2DaysAgo = cycle1DaysAgo + cycle1Length;
    const c2Start = new Date(today - c2DaysAgo * 86400000).toISOString().split('T')[0];
    const c3DaysAgo = c2DaysAgo + cycle2Length;
    const c3Start = new Date(today - c3DaysAgo * 86400000).toISOString().split('T')[0];
    const c4DaysAgo = c3DaysAgo + cycle3Length;
    const c4Start = new Date(today - c4DaysAgo * 86400000).toISOString().split('T')[0];

    return [
      {
        id: 'cycle-1',
        cycleNumber: 1,
        startDate: c1Start,
        daysAgo: cycle1DaysAgo,
        lengthDays: cycle1Length,
        periodDurationDays: cycle1Duration,
      },
      {
        id: 'cycle-2',
        cycleNumber: 2,
        startDate: c2Start,
        daysAgo: c2DaysAgo,
        lengthDays: cycle2Length,
        periodDurationDays: cycle2Duration,
      },
      {
        id: 'cycle-3',
        cycleNumber: 3,
        startDate: c3Start,
        daysAgo: c3DaysAgo,
        lengthDays: cycle3Length,
        periodDurationDays: cycle3Duration,
      },
      {
        id: 'cycle-4',
        cycleNumber: 4,
        startDate: c4Start,
        daysAgo: c4DaysAgo,
        lengthDays: cycle4Length,
        periodDurationDays: cycle4Duration,
      },
    ];
  }, [
    cycle1DaysAgo,
    cycle1Length,
    cycle1Duration,
    cycle2Length,
    cycle2Duration,
    cycle3Length,
    cycle3Duration,
    cycle4Length,
    cycle4Duration,
  ]);

  // Derive latest pain and flow from logs or answers
  const latestPain = symptomLogs.find((l) => l.pain !== undefined)?.pain ?? 6;
  const latestFlow = symptomLogs.find((l) => l.flow !== undefined)?.flow ?? 'moderate';

  // Live real-time prediction & precautions
  const prediction = useMemo(() => {
    const effectiveCount = rememberedCount === -1 ? 1 : rememberedCount;
    return calculateCyclePredictionAndPrecautions(
      effectiveCount,
      currentCycles,
      assessmentAnswers,
      latestPain,
      latestFlow
    );
  }, [rememberedCount, currentCycles, assessmentAnswers, latestPain, latestFlow]);

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
    const effectiveCount = rememberedCount === -1 ? 1 : rememberedCount;
    savePastCycles(effectiveCount, currentCycles.slice(0, effectiveCount));

    if (isOnboarding) {
      router.push('/log-pain?onboarding=true');
    } else {
      const msg = 'Past cycles saved. Predictions & precautions calibrated.';
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
            <Text style={styles.navTitle}>Past Cycles & Prediction</Text>
            <Text style={styles.navSubtitle}>Clinical Rhythm Calibration</Text>
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
                How Many Past Cycles Do You Remember?
              </Text>
              <Text style={styles.onboardingDesc}>
                Logging your previous cycles allows SheSync to calculate cycle length
                variance, predict your exact upcoming period, and deploy tailored precaution
                measures for dysmenorrhea and PMDD.
              </Text>
            </View>
          )}

          {/* Section 1: Question - How many cycles do you remember? */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Layers size={18} color={Theme.colors.primary} />
              <Text style={styles.sectionTitle}>
                Select How Many Last Cycles You Remember
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Even recalling 1 or 2 past cycles significantly sharpens predictions.
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

          {/* Section 2: Cycle 1 (Most Recent Period Details) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Calendar size={18} color={Theme.colors.secondary} />
              <Text style={styles.sectionTitle}>Cycle 1: Most Recent Period</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              When did your last menstrual period start and how long did it last?
            </Text>

            {/* Days Ago Selector */}
            <View style={styles.controlBox}>
              <View style={styles.controlLabelRow}>
                <Text style={styles.controlLabel}>Period Started</Text>
                <Text style={styles.controlValueHighlight}>
                  {cycle1DaysAgo} days ago ({formattedLastStartDate})
                </Text>
              </View>

              {/* Quick Stepper */}
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setCycle1DaysAgo((prev) => Math.max(1, prev - 1))}
                >
                  <Minus size={16} color={Theme.colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.quickChipsRow}>
                  {[7, 14, 21, 28].map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={[
                        styles.quickChip,
                        cycle1DaysAgo === days && styles.quickChipActive,
                      ]}
                      onPress={() => setCycle1DaysAgo(days)}
                    >
                      <Text
                        style={[
                          styles.quickChipText,
                          cycle1DaysAgo === days && styles.quickChipTextActive,
                        ]}
                      >
                        {days}d ago
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setCycle1DaysAgo((prev) => Math.min(60, prev + 1))}
                >
                  <Plus size={16} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cycle Length Stepper */}
            <View style={styles.controlBox}>
              <View style={styles.controlLabelRow}>
                <Text style={styles.controlLabel}>Cycle Length (Start to Start)</Text>
                <Text style={styles.controlValueHighlight}>{cycle1Length} Days</Text>
              </View>
              <View style={styles.stepperFullRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setCycle1Length((prev) => Math.max(21, prev - 1))}
                >
                  <Minus size={16} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperCountDisplay}>
                  {cycle1Length} <Text style={styles.stepperCountSub}>days</Text>
                </Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setCycle1Length((prev) => Math.min(50, prev + 1))}
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
                  onPress={() => setCycle1Duration((prev) => Math.max(2, prev - 1))}
                >
                  <Minus size={16} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperCountDisplay}>
                  {cycle1Duration} <Text style={styles.stepperCountSub}>days</Text>
                </Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setCycle1Duration((prev) => Math.min(10, prev + 1))}
                >
                  <Plus size={16} color={Theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section 3: Cycle 2 Details (if >= 2 remembered) */}
          {(rememberedCount >= 2 || rememberedCount === -1) && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Clock size={18} color="#6366F1" />
                <Text style={styles.sectionTitle}>Cycle 2: Previous Month</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Estimated cycle length for the cycle prior to the most recent.
              </Text>

              <View style={styles.controlBox}>
                <View style={styles.controlLabelRow}>
                  <Text style={styles.controlLabel}>Cycle 2 Length</Text>
                  <Text style={styles.controlValueHighlight}>{cycle2Length} Days</Text>
                </View>
                <View style={styles.stepperFullRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCycle2Length((prev) => Math.max(21, prev - 1))}
                  >
                    <Minus size={16} color={Theme.colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperCountDisplay}>
                    {cycle2Length} <Text style={styles.stepperCountSub}>days</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCycle2Length((prev) => Math.min(50, prev + 1))}
                  >
                    <Plus size={16} color={Theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Section 4: Cycle 3 Details (if >= 3 remembered) */}
          {rememberedCount >= 3 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Clock size={18} color="#059669" />
                <Text style={styles.sectionTitle}>Cycle 3: 3 Months Ago</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Cycle length 3 months back for variance calibration.
              </Text>

              <View style={styles.controlBox}>
                <View style={styles.controlLabelRow}>
                  <Text style={styles.controlLabel}>Cycle 3 Length</Text>
                  <Text style={styles.controlValueHighlight}>{cycle3Length} Days</Text>
                </View>
                <View style={styles.stepperFullRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCycle3Length((prev) => Math.max(21, prev - 1))}
                  >
                    <Minus size={16} color={Theme.colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperCountDisplay}>
                    {cycle3Length} <Text style={styles.stepperCountSub}>days</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setCycle3Length((prev) => Math.min(50, prev + 1))}
                  >
                    <Plus size={16} color={Theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Section 5: Real-Time Next Cycle Prediction Card */}
          <View style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <View style={styles.predictionBadge}>
                <Calendar size={13} color="#FFFFFF" />
                <Text style={styles.predictionBadgeText}>NEXT CYCLE PREDICTION</Text>
              </View>
              <View style={styles.confidencePill}>
                <CheckCircle2 size={12} color="#10B981" />
                <Text style={styles.confidenceText}>
                  {prediction.confidencePercentage}% Confidence
                </Text>
              </View>
            </View>

            <Text style={styles.predictionDateLabel}>Predicted Next Period Start</Text>
            <Text style={styles.predictionDateValue}>{prediction.nextPeriodDate}</Text>
            <Text style={styles.predictionCountdown}>
              Starts in approximately ~{prediction.daysUntilNextPeriod} days
            </Text>

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

          {/* Section 6: Tailored Precaution Measures */}
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
                ? 'Save & Continue to Pain Check-in (Step 2/4) →'
                : 'Save Cycle History & Sync Predictions'}
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
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  navSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 60,
    paddingTop: 8,
  },
  onboardingBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 141, 0.25)',
    ...Theme.shadows.card,
  },
  onboardingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0F5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  onboardingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 0.3,
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
    lineHeight: 24,
  },
  onboardingDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  optionsGrid: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: Theme.radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  optionCardSelected: {
    backgroundColor: '#FFF5F8',
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
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  optionLabelSelected: {
    color: Theme.colors.primary,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Theme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  optionDescSelected: {
    color: Theme.colors.primaryDark,
  },
  controlBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: Theme.radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  controlLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  controlValueHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickChip: {
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  stepperCountDisplay: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  stepperCountSub: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
  },
  predictionCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: Theme.radius.xl,
    padding: 20,
    marginBottom: 16,
    ...Theme.shadows.glowing,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  predictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 77, 141, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  predictionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF69B4',
    letterSpacing: 0.5,
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  predictionDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 4,
  },
  predictionDateValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  predictionCountdown: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginTop: 2,
    marginBottom: 16,
  },
  timelineBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Theme.radius.lg,
    padding: 14,
    gap: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  timelineLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  timelineVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  precautionsSection: {
    marginBottom: 16,
  },
  precautionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.secondary,
    ...Theme.shadows.card,
  },
  precautionCardHigh: {
    borderLeftColor: Theme.colors.strainHigh,
    backgroundColor: '#FFF9F9',
  },
  precautionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyHigh: {
    backgroundColor: '#FEE2E2',
  },
  urgencyModerate: {
    backgroundColor: '#FEF3C7',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
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
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  precautionAdvice: {
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    alignSelf: 'stretch',
    ...Theme.shadows.glowing,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    flexShrink: 1,
    textAlign: 'center',
  },
});
