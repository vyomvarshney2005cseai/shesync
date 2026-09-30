import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { HeartPulse, Moon, Calendar } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import type { BiometricSnapshot, CycleData } from '@/types';

interface BiometricScrollProps {
  biometrics: BiometricSnapshot;
  cycle: CycleData;
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  accentColor: string;
  bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  accentColor,
  bgColor,
}) => (
  <View style={[styles.card, { borderColor: bgColor }]}>
    <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>{icon}</View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={[styles.cardValue, { color: accentColor }]}>{value}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
  </View>
);

export const BiometricScroll: React.FC<BiometricScrollProps> = ({
  biometrics,
  cycle,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Biometric Snapshot</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <MetricCard
          icon={<HeartPulse size={18} color={Theme.colors.strainHigh} />}
          title="HRV"
          value={`${biometrics.hrv.current} ms`}
          subtitle={`${biometrics.hrv.delta > 0 ? '+' : ''}${biometrics.hrv.delta.toFixed(0)}% from baseline`}
          accentColor={Theme.colors.strainHigh}
          bgColor={Theme.colors.primaryLight}
        />
        <MetricCard
          icon={<Moon size={18} color={Theme.colors.secondary} />}
          title="Sleep"
          value={`${biometrics.sleep.hoursSlept}h ${biometrics.sleep.minutesSlept}m`}
          subtitle={biometrics.sleep.severity === 'severe' ? 'Severe Deficit' : 'Below Target'}
          accentColor={Theme.colors.secondary}
          bgColor={Theme.colors.secondaryLight}
        />
        <MetricCard
          icon={<Calendar size={18} color={Theme.colors.strainAmber} />}
          title="Cycle Day"
          value={`Day ${cycle.currentDay}`}
          subtitle={cycle.isIrregular ? 'Irregular Phase' : cycle.phase}
          accentColor={Theme.colors.strainAmber}
          bgColor="#FEF3C7"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 16,
    width: 155,
    borderWidth: 1,
    ...Theme.shadows.card,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.textTertiary,
    marginTop: 2,
  },
});
