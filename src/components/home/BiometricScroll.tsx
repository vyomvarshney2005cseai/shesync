import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BatteryCharging, Moon, Calendar, X } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { Stepper } from '@/components/common/ui';
import { PrimaryButton } from '@/components/common/PrimaryButton';
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
  onPress?: () => void;
  actionLabel?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, subtitle, accentColor, bgColor, onPress, actionLabel }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={`${title}: ${value}. ${subtitle}`}
    style={({ pressed }) => [styles.card, { borderColor: bgColor }, pressed && { opacity: 0.85 }]}
  >
    <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>{icon}</View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={[styles.cardValue, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
    <Text style={styles.cardSubtitle} numberOfLines={2}>
      {subtitle}
    </Text>
    {actionLabel ? <Text style={[styles.action, { color: accentColor }]}>{actionLabel}</Text> : null}
  </Pressable>
);

/**
 * Today's snapshot. Every number comes from the user's own logs:
 * readiness from the strain engine, sleep from her sleep log, cycle day
 * from her saved period dates. (Earlier builds showed invented HRV values.)
 */
export const BiometricScroll: React.FC<BiometricScrollProps> = ({ biometrics, cycle }) => {
  const logSleep = useAppStore((s) => s.logSleep);
  const sleepTarget = useAppStore((s) => s.fineTuningSettings.dailySleepTargetHours);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [hours, setHours] = useState(7);

  const readiness = biometrics.recoveryScore;
  const readinessText = readiness >= 70 ? 'Good to train' : readiness >= 45 ? 'Go moderate' : 'Recovery day';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today’s Snapshot</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <MetricCard
          icon={<BatteryCharging size={18} color={Theme.colors.strainOptimal} />}
          title="Readiness"
          value={`${readiness}%`}
          subtitle={readinessText}
          accentColor={Theme.colors.strainOptimal}
          bgColor="#D1FAE5"
        />
        <MetricCard
          icon={<Moon size={18} color={Theme.colors.secondary} />}
          title="Sleep"
          value={biometrics.sleep.logged ? `${biometrics.sleep.hoursSlept}h ${biometrics.sleep.minutesSlept}m` : '—'}
          subtitle={biometrics.sleep.logged ? biometrics.sleep.label.replace(/^\S+ \S+ /, '') : `Target ${sleepTarget}h`}
          accentColor={Theme.colors.secondary}
          bgColor={Theme.colors.secondaryLight}
          onPress={() => {
            setHours(biometrics.sleep.logged ? biometrics.sleep.hoursSlept + biometrics.sleep.minutesSlept / 60 : 7);
            setSleepOpen(true);
          }}
          actionLabel={biometrics.sleep.logged ? 'Edit' : 'Log last night'}
        />
        <MetricCard
          icon={<Calendar size={18} color={Theme.colors.strainAmber} />}
          title="Cycle Day"
          value={cycle.hasCycleData ? `Day ${cycle.currentDay}` : '—'}
          subtitle={cycle.hasCycleData ? (cycle.isIrregular ? 'Irregular pattern' : cycle.phase) : 'Add period dates'}
          accentColor={Theme.colors.strainAmber}
          bgColor="#FEF3C7"
          onPress={() => router.push('/log-cycle')}
          actionLabel={cycle.hasCycleData ? 'Update' : 'Add'}
        />
      </ScrollView>

      <Modal visible={sleepOpen} transparent animationType="fade" onRequestClose={() => setSleepOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>How long did you sleep?</Text>
              <Pressable onPress={() => setSleepOpen(false)} style={styles.close} accessibilityLabel="Close">
                <X size={18} color={Theme.colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.sheetHint}>Last night, roughly. Your target is {sleepTarget} hours.</Text>
            <View style={{ alignItems: 'center', marginVertical: 18 }}>
              <Stepper
                label="Hours slept"
                value={hours}
                onChange={setHours}
                min={0}
                max={14}
                step={0.25}
                format={(v) => `${Math.floor(v)}h ${Math.round((v % 1) * 60)}m`}
              />
            </View>
            <PrimaryButton
              title="Save sleep"
              onPress={() => {
                logSleep(hours);
                setSleepOpen(false);
              }}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    paddingHorizontal: 20,
  },
  sectionHint: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 2,
  },
  scrollContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 16,
    width: 150,
    borderWidth: 1,
    ...Theme.shadows.card,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: Theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  cardValue: { fontSize: 22, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  cardSubtitle: { fontSize: 11, fontWeight: '500', color: Theme.colors.textTertiary, marginTop: 2, textTransform: 'capitalize' },
  action: { fontSize: 11, fontWeight: '800', marginTop: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: Theme.radius.xl, padding: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary },
  sheetHint: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 6 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.colors.backgroundMuted, alignItems: 'center', justifyContent: 'center' },
});
