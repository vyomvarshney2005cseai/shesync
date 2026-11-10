import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Theme, createStyles, themed } from '@/constants/theme';
import {
  ASSESSMENT_QUESTIONS,
  ASSESSMENT_CHAPTERS,
  calculateArchetype,
  ArchetypeResult,
} from '@/constants/assessment';
import { useAppStore } from '@/store/useAppStore';
import { nextSyncHref } from '@/lib/syncDetails';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
} from 'lucide-react-native';

export default function AssessmentScreen() {
  const { reveal } = useLocalSearchParams<{ reveal?: string }>();
  const completeAssessment = useAppStore((s) => s.completeAssessment);
  const savedAnswers = useAppStore((s) => s.assessmentAnswers);
  const cycleLabel = useAppStore((s) => s.cycle.label);
  const isAssessmentCompleted = useAppStore((s) => s.isAssessmentCompleted);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers || {});
  const [retaking, setRetaking] = useState(false);
  const isCompleted = reveal === 'true' || isAssessmentCompleted;
  const [calculatedResult, setCalculatedResult] = useState<ArchetypeResult | null>(() => {
    return calculateArchetype(savedAnswers || {});
  });

  const currentQ = ASSESSMENT_QUESTIONS[currentIndex] || ASSESSMENT_QUESTIONS[0];
  const currentChapter = ASSESSMENT_CHAPTERS.find((c) => c.number === currentQ.chapterNumber);
  const progressPercent = Math.round(((currentIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100);
  const selectedOptionId = answers[currentQ.id];

  const handleSelectOption = (optionId: string) => {
    const updated = { ...answers, [currentQ.id]: optionId };
    setAnswers(updated);
  };

  const handleNext = () => {
    if (!selectedOptionId) return;
    if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all 10 questions: save, then continue "Details for Sync"
      // with the next unfinished step (period dates on a first run).
      const archetype = calculateArchetype(answers);
      setCalculatedResult(archetype);
      completeAssessment(answers);
      router.push(nextSyncHref(useAppStore.getState()));
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (router.canGoBack()) {
      // Question 1: "Back" returns to Home; progress on later steps is kept.
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleDone = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setRetaking(true);
  };

  // ─── Saved profile view ─────────────────────────────────
  if (isCompleted && !retaking && calculatedResult) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.outerCenterWrapper}>
          <ScrollView
            style={styles.scrollWrapper}
            contentContainerStyle={styles.completionScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.completionTitle}>Your SheSync profile</Text>
            <Text style={styles.archetypeName}>{calculatedResult.name}</Text>
            <Text style={styles.archetypeTagline}>{calculatedResult.tagline}</Text>
            <View style={styles.archetypeCard}>
              <Text style={styles.archetypeDesc}>{calculatedResult.description}</Text>
            </View>
            {cycleLabel ? <Text style={styles.cycleLine}>Today: {cycleLabel}</Text> : null}

            <TouchableOpacity style={styles.enterButton} onPress={handleDone} activeOpacity={0.88}>
              <Text style={styles.enterButtonText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retakeLink} onPress={handleRetake} activeOpacity={0.7}>
              <Text style={styles.retakeLinkText}>Retake the {ASSESSMENT_QUESTIONS.length} questions</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Active Questionnaire Step View ───────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.outerCenterWrapper}>
        {/* Top Header & Progress (Skip button removed per user request) */}
        <View style={styles.topBar}>
          <View style={styles.topBrandRow}>
            <Image
              source={require('@/../assets/images/logo.png')}
              style={styles.topLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.topBrandTitle}>Details for Sync · Step 1 of 6</Text>
              <Text style={styles.topChapterSubtitle}>
                Chapter {currentQ.chapterNumber}/5: {currentChapter?.title}
              </Text>
            </View>
          </View>
        </View>

        {/* Animated Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.progressLabelRow}>
          <Text style={styles.progressCounterText}>
            Question {currentQ.number} of {ASSESSMENT_QUESTIONS.length}
          </Text>
          <Text style={styles.progressPercentText}>{progressPercent}% Calibrated</Text>
        </View>

        {/* Questions Scroll Area */}
        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={styles.questionScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Category Tag */}
          <View style={styles.chapterTagBadge}>
            <Compass size={12} color={Theme.colors.feminismAccent} style={{ marginRight: 4 }} />
            <Text style={styles.chapterTagText}>{currentQ.chapter.toUpperCase()}</Text>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.questionTitle}>{currentQ.title}</Text>
          {currentQ.subtitle ? (
            <Text style={styles.questionSubtitle}>{currentQ.subtitle}</Text>
          ) : null}

          {/* Options List */}
          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    isSelected ? styles.optionCardSelected : styles.optionCardUnselected,
                  ]}
                  onPress={() => handleSelectOption(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected ? styles.optionLabelSelected : styles.optionLabelUnselected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {opt.description ? (
                      <Text
                        style={[
                          styles.optionDesc,
                          isSelected ? styles.optionDescSelected : styles.optionDescUnselected,
                        ]}
                      >
                        {opt.description}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected ? styles.radioCircleSelected : styles.radioCircleUnselected,
                    ]}
                  >
                    {isSelected && <Check size={13} color={themed('#FFFFFF')} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Navigation Buttons */}
        <View style={styles.bottomNavRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={handlePrev}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={Theme.colors.textPrimary} />
            <Text style={styles.navBtnText}>
              {currentIndex === 0 ? 'Home' : 'Previous'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextBtn,
              !selectedOptionId && styles.nextBtnDisabled,
            ]}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text style={styles.nextBtnText} numberOfLines={1}>
              {currentIndex === ASSESSMENT_QUESTIONS.length - 1
                ? 'Save & continue →'
                : 'Next Question'}
            </Text>
            {currentIndex !== ASSESSMENT_QUESTIONS.length - 1 && (
              <ArrowRight size={18} color={themed('#FFFFFF')} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = createStyles(() => ({
  cycleLine: { fontSize: 13, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 14 },
  retakeLink: { alignSelf: 'center', paddingVertical: 14 },
  retakeLinkText: { fontSize: 14, fontWeight: '700', color: Theme.colors.primary },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF4F7',
  },
  outerCenterWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
  },
  scrollWrapper: {
    flex: 1,
    width: '100%',
  },
  topBar: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  topBrandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  topChapterSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#FFD7E3',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  progressBarTrack: {
    width: '100%',
    maxWidth: 480,
    height: 6,
    backgroundColor: '#FFE2EB',
    borderRadius: 3,
    paddingHorizontal: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.feminismAccent,
    borderRadius: 3,
  },
  progressLabelRow: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  progressCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.feminismAccent,
  },
  questionScroll: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  chapterTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFE5ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    marginBottom: 10,
    marginTop: 4,
  },
  chapterTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.feminismAccent,
    letterSpacing: 0.8,
  },
  questionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  questionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
    marginBottom: 18,
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Theme.radius.lg,
    borderWidth: 1.5,
    ...Theme.shadows.soft,
  },
  optionCardSelected: {
    backgroundColor: '#FFF0F5',
    borderColor: Theme.colors.feminismAccent,
  },
  optionCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE5EC',
  },
  optionContent: {
    flex: 1,
    paddingRight: 10,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Theme.colors.primaryDark,
  },
  optionLabelUnselected: {
    color: Theme.colors.textPrimary,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  optionDescSelected: {
    color: '#831843',
  },
  optionDescUnselected: {
    color: Theme.colors.textSecondary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: Theme.colors.feminismAccent,
  },
  radioCircleUnselected: {
    borderWidth: 1.5,
    borderColor: '#FFADC4',
    backgroundColor: 'transparent',
  },
  bottomNavRow: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFF4F7',
    borderTopWidth: 1,
    borderTopColor: '#FFE2EB',
    gap: 12,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE2EB',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  navBtnTextDisabled: {
    color: '#9CA3AF',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: '#46375A',
    ...Theme.shadows.card,
  },
  nextBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    textAlign: 'center',
  },

  // ─── Completion Archetype Reveal Styles ───────────────────
  completionScroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignSelf: 'center',
  },
  archetypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: '#FFE5ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    marginBottom: 12,
  },
  archetypeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.feminismAccent,
    letterSpacing: 0.8,
  },
  completionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  archetypeName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  archetypeTagline: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  archetypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    marginBottom: 20,
    ...Theme.shadows.soft,
    alignSelf: 'stretch',
  },
  archetypeDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: '#374151',
    textAlign: 'center',
  },
  calibrationsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  calibrationsGrid: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: 20,
  },
  calibItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: '#FFE5EC',
    alignSelf: 'stretch',
  },
  calibIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibTextWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  calibLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  calibValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  metricsSummaryCard: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    marginBottom: 16,
    gap: 10,
    ...Theme.shadows.card,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  metricRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  metricRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  metricRowVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  analyticsButton: {
    alignSelf: 'stretch',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: Theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    ...Theme.shadows.soft,
  },
  enterButton: {
    alignSelf: 'stretch',
    backgroundColor: '#46375A',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.card,
    marginBottom: 24,
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  predictionSummaryCard: {
    alignSelf: 'stretch',
    backgroundColor: '#1E1B2E',
    borderRadius: Theme.radius.lg,
    padding: 16,
    marginBottom: 16,
    ...Theme.shadows.glowing,
  },
  predictionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201, 87, 140, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  predictionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF69B4',
    letterSpacing: 0.4,
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  predDateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  predSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginTop: 2,
    marginBottom: 10,
  },
  predInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  predInfoLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  predInfoVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  precautionHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  precautionHighlightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FCA5A5',
    flex: 1,
  },
}));
