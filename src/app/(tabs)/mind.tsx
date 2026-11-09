import React from 'react';
import { ScrollView, View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, Phone, MessageCircle, Wind, Siren, Sparkles, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { Header } from '@/components/common/Header';
import { SomaticVideoLibrary } from '@/components/mind/SomaticVideoLibrary';
import { CBTReframeCard } from '@/components/mind/CBTReframeCard';
import { SOSFab } from '@/components/mind/SOSFab';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { WellnessHub } from '@/components/common/WellnessHub';
import { callNumber, composeSms, CRISIS_LINES } from '@/lib/openExternal';

export default function MindScreen() {
  const cbtPrompt = useAppStore((s) => s.cbtPrompt);
  const sosActive = useAppStore((s) => s.sosActive);
  const submitCBTResponse = useAppStore((s) => s.submitCBTResponse);
  const triggerSOS = useAppStore((s) => s.triggerSOS);
  const dismissSOS = useAppStore((s) => s.dismissSOS);
  const biometrics = useAppStore((s) => s.biometrics);

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centeredWrapper}>
            <Header
              title="Mind & Grounding"
              subtitle="Cycle-Aware Somatic & Cognitive Support"
              badge="YouTube Somatics"
            />

            {/* YourGoGirl Counsellor Quick Launch Banner */}
            <TouchableOpacity
              style={styles.counsellorBanner}
              activeOpacity={0.85}
              onPress={() => router.push('/your-go-girl' as any)}
            >
              <View style={styles.counsellorIconWrap}>
                <Sparkles size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.counsellorTitle}>
                  Need to talk through brain fog, low motivation, or period stress?
                </Text>
                <Text style={styles.counsellorSub}>
                  Chat with YourGoGirl — your 24/7 AI Women&apos;s Health Counsellor
                </Text>
              </View>
              <ChevronRight size={18} color={Theme.colors.primaryDark} />
            </TouchableOpacity>

            {/* Strain-aware therapy intro (from the user's own logs) */}
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>
                {biometrics.strainLevel === 'high' || biometrics.strainLevel === 'severe'
                  ? 'A heavy day, by your logs'
                  : biometrics.strainLevel === 'moderate'
                  ? 'A moderate-strain day'
                  : 'A steadier day'}
              </Text>
              <Text style={styles.introDesc}>
                {biometrics.strainLevel === 'high' || biometrics.strainLevel === 'severe'
                  ? `Your strain score is ${biometrics.strainScore}/100 from what you logged today. Start with a short calming session below — even five minutes helps.`
                  : 'Keep your nervous system steady with a short somatic session, a reframing note, or a calming game.'}
              </Text>
            </View>

            <WellnessHub only={['games', 'study']} title="Calm your mind & focus" />

            {/* Curated YouTube Somatic Therapy Library */}
            <SomaticVideoLibrary />

            {/* Spacing */}
            <View style={{ height: 16 }} />

            {/* CBT Reframing Card */}
            <CBTReframeCard prompt={cbtPrompt} onSubmit={submitCBTResponse} />
          </View>
        </ScrollView>

      {/* SOS Floating Action Button */}
      <SOSFab onPress={triggerSOS} />

      {/* SOS Modal */}
      <Modal
        visible={sosActive}
        animationType="fade"
        transparent
        onRequestClose={dismissSOS}
      >
        <View style={styles.sosOverlay}>
          <View style={styles.sosModal}>
            <View style={styles.sosHeader}>
              <View style={styles.sosIconWrap}>
                <Heart size={28} color={Theme.colors.strainHigh} />
              </View>
              <Pressable onPress={dismissSOS} style={styles.sosClose}>
                <X size={18} color={Theme.colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.sosTitle}>{"You're not alone"}</Text>
            <Text style={styles.sosDesc}>
              Strong feelings before or during a period are real and they pass. Pick one thing
              that helps right now:
            </Text>
            <View style={styles.sosActions}>
              <PrimaryButton
                title="Chat with YourGoGirl Counsellor"
                variant="rose"
                icon={<Sparkles size={16} color="#FFFFFF" />}
                onPress={() => {
                  dismissSOS();
                  router.push('/your-go-girl' as any);
                }}
                fullWidth
              />
              <PrimaryButton
                title="Breathe with me (2 min)"
                variant="dark"
                icon={<Wind size={16} color="#FFFFFF" />}
                onPress={() => {
                  dismissSOS();
                  router.push('/games/breathe');
                }}
                fullWidth
              />
              <PrimaryButton
                title={`Call Tele-MANAS ${CRISIS_LINES.teleManas.number} (free, 24×7)`}
                variant="dark"
                icon={<Phone size={16} color="#FFFFFF" />}
                onPress={() => callNumber(CRISIS_LINES.teleManas.number, CRISIS_LINES.teleManas.label)}
                fullWidth
              />
              <PrimaryButton
                title="Message a friend"
                variant="outline"
                icon={<MessageCircle size={16} color={Theme.colors.textPrimary} />}
                onPress={() =>
                  composeSms("Hey, I'm having a really hard time right now. Can you call me or come over?")
                }
                fullWidth
              />
            </View>
            <Pressable
              onPress={() => callNumber(CRISIS_LINES.emergency.number, CRISIS_LINES.emergency.label)}
              style={styles.sosEmergency}
              accessibilityRole="button"
            >
              <Siren size={14} color={Theme.colors.strainHigh} />
              <Text style={styles.sosFooter}>
                In immediate danger? Call {CRISIS_LINES.emergency.number} (India emergency).
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingTop: 4,
    gap: 0,
  },
  centeredWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  counsellorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FFB8D0',
    ...Theme.shadows.soft,
  },
  counsellorIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counsellorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  counsellorSub: {
    fontSize: 11.5,
    color: Theme.colors.primaryDark,
    fontWeight: '600',
  },
  introCard: {
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: Theme.radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.15)',
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.strainHigh,
    marginBottom: 4,
  },
  introDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: Theme.colors.textSecondary,
  },
  // SOS Modal
  sosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sosModal: {
    // Opaque: the translucent card let the screen behind bleed through.
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Theme.shadows.glowing,
  },
  sosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sosIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sosDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: Theme.colors.textSecondary,
    marginBottom: 20,
  },
  sosActions: {
    gap: 10,
  },
  sosEmergency: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  sosFooter: {
    fontSize: 12,
    lineHeight: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
