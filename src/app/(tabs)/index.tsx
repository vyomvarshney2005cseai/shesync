import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common/Header';
import { StrainGauge } from '@/components/home/StrainGauge';
import { BiometricScroll } from '@/components/home/BiometricScroll';
import { QuickActionGrid, type QuickActionId } from '@/components/home/QuickActionGrid';
import { CyclePredictionBanner } from '@/components/home/CyclePredictionBanner';
import { SyncDetailsCard } from '@/components/home/SyncDetailsCard';
import { FeatureSquares } from '@/components/home/FeatureSquares';
import { ReferralStatusCard } from '@/components/home/ReferralStatusCard';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { timeOfDayGreeting } from '@/lib/dates';
import { Theme } from '@/constants/theme';

const QUICK_ROUTES = {
  mood: '/log-mood',
  pain: '/log-pain',
  flow: '/log-flow',
  cycle: '/log-cycle',
  voice: '/voice-journal',
} as const;

export default function HomeScreen() {
  const biometrics = useAppStore((s) => s.biometrics);
  const cycle = useAppStore((s) => s.cycle);
  const userName = useAppStore((s) => s.userName);
  const isSynced = useAppStore((s) => !!s.syncCompletedAt);
  const firstName = (userName || 'there').trim().split(' ')[0];

  const handleQuickAction = (id: QuickActionId) => router.push(QUICK_ROUTES[id]);

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
              subtitle={isSynced ? cycle.label : 'Let’s set up SheSync for you'}
            />

            {isSynced ? (
              // ─── Synced: the full dashboard ───
              <>
                <StrainGauge score={biometrics.strainScore} level={biometrics.strainLevel} />
                <BiometricScroll biometrics={biometrics} cycle={cycle} />
                <ReferralStatusCard />
                <CyclePredictionBanner />
                <QuickActionGrid onAction={handleQuickAction} />
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Explore SheSync</Text>
                </View>
                <FeatureSquares />
              </>
            ) : (
              // ─── First run: Details for Sync + feature squares ───
              <>
                <SyncDetailsCard />
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Explore SheSync</Text>
                </View>
                <FeatureSquares />
              </>
            )}
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
  sectionHead: {
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
});
