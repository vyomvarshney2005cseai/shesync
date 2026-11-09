import React from 'react';
import { ScrollView, View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, Phone, MessageCircle, Wind, Siren, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { Header } from '@/components/common/Header';
import { YourGoGirlHomeCard } from '@/components/yourgogirl/YourGoGirlHomeCard';
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
              title="Mind"
              subtitle="Calm your body and mind"
            />

            <YourGoGirlHomeCard />

            {biometrics.strainLevel === 'high' || biometrics.strainLevel === 'severe' ? (
              <View style={styles.introCard}>
                <Text style={styles.introTitle}>A heavy day</Text>
                <Text style={styles.introDesc}>
                  Your strain is {biometrics.strainScore}/100 from today’s logs. Try a short calming video below — even five
                  minutes helps.
                </Text>
              </View>
            ) : null}

            <WellnessHub only={['games', 'study']} title="Focus & games" />

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
                title="Talk to YourGoGirl"
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
  introCard: {
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: Theme.radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 87, 140, 0.15)',
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
    fontWeight: '800',
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
