import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Brain,
  Radio,
} from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';

export default function VoiceJournalScreen() {
  const logSymptom = useAppStore((s) => s.logSymptom);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState(
    "I'm feeling a noticeable shift in energy today as I head into my luteal phase. There's a little tension around my lower back and mild pelvic tightness, but mentally I'm trying to soften and give myself permission to slow down rather than pushing through."
  );
  const [isSaved, setIsSaved] = useState(false);

  // Animation for pulse effect during recording
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: any;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const toggleRecording = () => {
    if (!isRecording) {
      // Start
      setIsRecording(true);
      setIsPaused(false);
      setSeconds(0);
      setHasRecorded(false);
    } else {
      // Stop
      setIsRecording(false);
      setIsPaused(false);
      setHasRecorded(true);
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setSeconds(0);
    setHasRecorded(false);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    setIsPlaying((prev) => !prev);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handleSave = () => {
    logSymptom({
      voiceJournal: true,
      transcript: transcript.trim(),
      audioDuration: formatTime(seconds || 38),
      notes: `[Voice Journal ${formatTime(seconds || 38)}] ${transcript.trim()}`,
    });

    setIsSaved(true);
    const msg = 'Voice journal & somatic transcript saved!';
    if (Platform.OS === 'web') {
      window.alert(msg);
      router.back();
    } else {
      Alert.alert('Journal Saved', msg, [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  // Simulated waveform bar heights
  const WAVE_BARS = [14, 28, 42, 22, 54, 36, 18, 48, 62, 38, 24, 46, 58, 30, 20, 44, 52, 26];

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
          <Text style={styles.navTitle}>Voice Journal</Text>
          <Text style={styles.navSubtitle}>Somatic Vocal Biomarkers</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Studio Recording Hub Card */}
        <View style={styles.recordCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isRecording && styles.statusDotRecording]} />
            <Text style={styles.statusText}>
              {isRecording
                ? 'RECORDING SOMATIC AUDIO'
                : hasRecorded
                ? 'RECORDING COMPLETE • AUDIO READY'
                : 'TAP MIC TO START SPEAKING'}
            </Text>
          </View>

          {/* Time Counter */}
          <Text style={styles.timerText}>
            {formatTime(seconds || (hasRecorded ? 38 : 0))}
          </Text>

          {/* Animated Waveform Bars */}
          <View style={styles.waveformContainer}>
            {WAVE_BARS.map((h, i) => {
              const activeHeight = isRecording || isPlaying ? h : Math.max(8, h * 0.3);
              return (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: activeHeight,
                      backgroundColor:
                        isRecording || isPlaying
                          ? Theme.colors.primary
                          : Theme.colors.cardBorder,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Main Record Action Button */}
          <View style={styles.actionCenter}>
            <Animated.View
              style={[
                styles.pulseHalo,
                isRecording && {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: 'rgba(255, 77, 141, 0.2)',
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.recordBtn,
                  isRecording && styles.recordBtnActive,
                  hasRecorded && styles.recordBtnRecorded,
                ]}
                onPress={toggleRecording}
                activeOpacity={0.8}
              >
                {isRecording ? (
                  <Square size={28} color="#FFFFFF" />
                ) : (
                  <Mic size={32} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Secondary Controls (Restart & Playback) */}
          {hasRecorded && (
            <View style={styles.playbackControls}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={resetRecording}
                activeOpacity={0.7}
              >
                <RotateCcw size={16} color={Theme.colors.textSecondary} />
                <Text style={styles.secondaryBtnText}>Re-record</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playBtn}
                onPress={togglePlayback}
                activeOpacity={0.8}
              >
                {isPlaying ? (
                  <Pause size={18} color="#FFFFFF" />
                ) : (
                  <Play size={18} color="#FFFFFF" />
                )}
                <Text style={styles.playBtnText}>{isPlaying ? 'Pause Audio' : 'Play Preview'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* AI Real-Time Transcription */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Brain size={18} color={Theme.colors.secondary} />
            <Text style={styles.sectionHeaderInline}>Automated Speech-to-Text</Text>
          </View>
          <Text style={styles.sectionSubtext}>
            Captured vocal transcript with real-time biological terminology parsing
          </Text>

          <TextInput
            style={styles.transcriptInput}
            multiline
            numberOfLines={5}
            value={transcript}
            onChangeText={setTranscript}
            placeholder="Your voice transcription will appear here... you can edit directly."
            placeholderTextColor={Theme.colors.textTertiary}
          />
        </View>

        {/* AI Somatic Tone Analysis */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Volume2 size={18} color={Theme.colors.strainOptimal} />
            <Text style={styles.sectionHeaderInline}>Voice Biomarker Insights</Text>
          </View>

          <View style={styles.insightBox}>
            <View style={styles.insightTagRow}>
              <View style={styles.insightPill}>
                <Text style={styles.insightPillText}>Vocal Cadence: 44 bpm (Slow/Reflective)</Text>
              </View>
              <View style={[styles.insightPill, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.insightPillText, { color: Theme.colors.strainAmber }]}>
                  Luteal Hormonal Tone
                </Text>
              </View>
            </View>

            <Text style={styles.insightBody}>
              Vocal pitch analysis detects mild nervous system fatigue and natural luteal slowness.
              Corticosteroid voice markers are within balanced range.
            </Text>

            <View style={styles.recommendationWrap}>
              <Text style={styles.recTitle}>Suggested Somatic Micro-Practice:</Text>
              <Text style={styles.recText}>
                5 minutes of non-judgmental resting breathing or a warm cup of herbal tea.
              </Text>
            </View>
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={isSaved}
        >
          <Check size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>
            {isSaved ? 'Voice Entry Saved' : 'Save Voice Journal'}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 226, 235, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  navSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  recordCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.strainOptimal,
  },
  statusDotRecording: {
    backgroundColor: Theme.colors.strainHigh,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -1,
    marginVertical: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    gap: 5,
    marginVertical: 14,
    paddingHorizontal: 12,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  actionCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  pulseHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.glowing,
  },
  recordBtnActive: {
    backgroundColor: Theme.colors.strainHigh,
  },
  recordBtnRecorded: {
    backgroundColor: Theme.colors.secondary,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.backgroundMuted,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.soft,
  },
  playBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeaderInline: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  sectionSubtext: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  transcriptInput: {
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 14,
    fontSize: 13,
    color: Theme.colors.textPrimary,
    lineHeight: 20,
    minHeight: 110,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  insightBox: {
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.lg,
    padding: 14,
    gap: 10,
  },
  insightTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  insightPill: {
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  insightPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.strainOptimal,
  },
  insightBody: {
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
  },
  recommendationWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.md,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
  },
  recTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.secondaryDark,
    marginBottom: 2,
  },
  recText: {
    fontSize: 12,
    color: Theme.colors.textPrimary,
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
