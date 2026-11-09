import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common/Header';
import { StrainGauge } from '@/components/home/StrainGauge';
import { BiometricScroll } from '@/components/home/BiometricScroll';
import { QuickActionGrid } from '@/components/home/QuickActionGrid';
import { CyclePredictionBanner } from '@/components/home/CyclePredictionBanner';
import { YourGoGirlHomeCard } from '@/components/yourgogirl/YourGoGirlHomeCard';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { WellnessHub } from '@/components/common/WellnessHub';
import { timeOfDayGreeting } from '@/lib/dates';

export default function HomeScreen() {
  const biometrics = useAppStore((s) => s.biometrics);
  const cycle = useAppStore((s) => s.cycle);
  const userName = useAppStore((s) => s.userName);
  const firstName = (userName || 'there').trim().split(' ')[0];

  const handleQuickAction = (id: string) => {
    switch (id) {
      case 'mood':
        router.push('/log-mood');
        break;
      case 'pain':
        router.push('/log-pain');
        break;
      case 'flow':
        router.push('/log-flow');
        break;
      case 'voice':
        router.push('/voice-journal');
        break;
      case 'yourgogirl':
        router.push('/your-go-girl' as any);
        break;
      case 'cycle':
        router.push('/log-cycle');
        break;
    }
  };

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
              title={`${timeOfDayGreeting()}, ${firstName}`}
              subtitle={cycle.label}
              badge="SheSync Engine"
            />
            <StrainGauge
              score={biometrics.strainScore}
              level={biometrics.strainLevel}
            />
            <BiometricScroll biometrics={biometrics} cycle={cycle} />
            <YourGoGirlHomeCard />
            <CyclePredictionBanner />
            <QuickActionGrid onAction={handleQuickAction} />
            <View style={styles.hubWrap}>
              <WellnessHub />
            </View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  centeredWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  hubWrap: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
});
