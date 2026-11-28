import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/common/Header';
import { StrainGauge } from '@/components/home/StrainGauge';
import { BiometricScroll } from '@/components/home/BiometricScroll';
import { QuickActionGrid, type QuickActionId } from '@/components/home/QuickActionGrid';
import { CyclePredictionBanner } from '@/components/home/CyclePredictionBanner';
import { SyncDetailsCard } from '@/components/home/SyncDetailsCard';
import { FeatureSquares } from '@/components/home/FeatureSquares';
import { ReferralStatusCard } from '@/components/home/ReferralStatusCard';
import { CheckInCard } from '@/components/home/CheckInCard';
import { MythBusterCard } from '@/components/home/MythBusterCard';
import { FocusAreasCard } from '@/components/home/FocusAreasCard';
import { GuestBackupCard } from '@/components/home/GuestBackupCard';
import { PersonaliseCard } from '@/components/home/PersonaliseCard';
import { CardBoundary } from '@/components/errors/FriendlyError';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { timeOfDayGreeting } from '@/lib/dates';
import { Theme, createStyles } from '@/constants/theme';

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
  const firstName = (userName || '').trim().split(' ')[0];

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
              title={firstName ? `${timeOfDayGreeting()}, ${firstName}` : timeOfDayGreeting()}
              subtitle={isSynced ? cycle.label : 'Let’s set up Unnmegh for you'}
            />

            {isSynced ? (
              // ─── Synced: the full dashboard ───
              // Each card has its own error boundary: one broken card never blanks Home.
              <>
                <CardBoundary><CheckInCard /></CardBoundary>
                <CardBoundary><PersonaliseCard /></CardBoundary>
                <CardBoundary><StrainGauge score={biometrics.strainScore} level={biometrics.strainLevel} /></CardBoundary>
                <CardBoundary><BiometricScroll biometrics={biometrics} cycle={cycle} /></CardBoundary>
                <CardBoundary><ReferralStatusCard /></CardBoundary>
                <CardBoundary><CyclePredictionBanner /></CardBoundary>
                <CardBoundary><QuickActionGrid onAction={handleQuickAction} /></CardBoundary>
                <CardBoundary><FocusAreasCard /></CardBoundary>
                <CardBoundary><MythBusterCard /></CardBoundary>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Explore Unnmegh</Text>
                </View>
                <CardBoundary><FeatureSquares /></CardBoundary>
                <CardBoundary><GuestBackupCard /></CardBoundary>
              </>
            ) : (
              // ─── First run: Details for Sync + feature squares ───
              <>
                <CardBoundary><SyncDetailsCard /></CardBoundary>
                <CardBoundary><MythBusterCard /></CardBoundary>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Explore Unnmegh</Text>
                </View>
                <CardBoundary><FeatureSquares /></CardBoundary>
                <CardBoundary><GuestBackupCard /></CardBoundary>
              </>
            )}
          </View>
        </ScrollView>
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
  },
  centeredWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  sectionHead: {
    paddingHorizontal: Theme.space.md,
    marginTop: Theme.space.lg,
    marginBottom: Theme.space.sm,
  },
  sectionTitle: {
    ...Theme.type.title,
    color: Theme.colors.textPrimary,
  },
}));
