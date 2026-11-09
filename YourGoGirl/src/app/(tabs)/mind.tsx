import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Heart,
  Phone,
  MessageCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { Header } from '@/components/common/Header';
import { SomaticVideoLibrary } from '@/components/mind/SomaticVideoLibrary';
import { CBTReframeCard } from '@/components/mind/CBTReframeCard';
import { SOSFab } from '@/components/mind/SOSFab';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';

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

            {/* Strain-aware therapy intro */}
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>
                {biometrics.strainLevel === 'high' ||
                biometrics.strainLevel === 'severe'
                  ? 'High Strain State Detected'
                  : biometrics.strainLevel === 'moderate'
                  ? 'Moderate Biomarker Load'
                  : 'Restorative Equilibrium'}
              </Text>
              <Text style={styles.introDesc}>
                {biometrics.strainLevel === 'high' ||
                biometrics.strainLevel === 'severe'
                  ? `Your HRV is ${Math.abs(biometrics.hrv.delta)}% below baseline. We've queued targeted YouTube polyvagal resets and somatic releases to calm neuro-endocrine tension.`
                  : `Your autonomic nervous system is in a responsive rhythm. Complement your day with gentle vagus nerve regulation and somatic body releases.`}
              </Text>
            </View>

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
              <Text style={styles.sosTitle}>You&apos;re Not Alone</Text>
              <Text style={styles.sosDesc}>
                Acute mood drops during PMDD are caused by a biological
                sensitivity to normal hormonal shifts — not a personal failing.
                Here&apos;s what might help right now:
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
                  title="Call Crisis Support"
                  variant="dark"
                  icon={<Phone size={16} color="#FFFFFF" />}
                  fullWidth
                />
                <PrimaryButton
                  title="Message a Friend"
                  variant="outline"
                  icon={<MessageCircle size={16} color={Theme.colors.textPrimary} />}
                  fullWidth
                />
              </View>
              <Text style={styles.sosFooter}>
                If you are in immediate danger, please call 988 (Suicide &amp;
                Crisis Lifeline).
              </Text>
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
  sosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  sosModal: {
    backgroundColor: Theme.colors.card,
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
  sosFooter: {
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
