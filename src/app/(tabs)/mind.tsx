import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Theme, createStyles } from '@/constants/theme';
import { Header } from '@/components/common/Header';
import { YourGoGirlHomeCard } from '@/components/yourgogirl/YourGoGirlHomeCard';
import { SomaticVideoLibrary } from '@/components/mind/SomaticVideoLibrary';
import { CBTReframeCard } from '@/components/mind/CBTReframeCard';
import { SOSFab } from '@/components/mind/SOSFab';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { WellnessHub } from '@/components/common/WellnessHub';
import { ROUTES } from '@/lib/routes';

export default function MindScreen() {
  const cbtPrompt = useAppStore((s) => s.cbtPrompt);
  const submitCBTResponse = useAppStore((s) => s.submitCBTResponse);
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
      <SOSFab onPress={() => router.push(ROUTES.sos)} />

    </SafeAreaView>
  </AdaptiveBackground>
  );
}

const styles = createStyles(() => ({
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
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textSecondary,
  },
}));
