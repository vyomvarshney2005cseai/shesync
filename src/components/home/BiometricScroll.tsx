import React, { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { Stepper } from '@/components/common/ui';
import { Button, Card, IconBadge, badgeColors, type BadgeTone } from '@/components/ds';
import type { BrandIconName } from '@/components/icons/BrandIcon';
import type { BiometricSnapshot, CycleData } from '@/types';

interface BiometricScrollProps {
  biometrics: BiometricSnapshot;
  cycle: CycleData;
}

interface MetricCardProps {
  icon: BrandIconName;
  tone: BadgeTone;
  title: string;
  value: string;
  subtitle: string;
  onPress?: () => void;
  actionLabel?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, tone, title, value, subtitle, onPress, actionLabel }) => {
  const ink = badgeColors(tone).fg;
  return (
    <Card onPress={onPress} accessibilityLabel={`${title}: ${value}. ${subtitle}${actionLabel ? `. ${actionLabel}` : ''}`} style={styles.card}>
      <IconBadge name={icon} tone={tone} size={40} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.cardSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
      {actionLabel ? <Text style={[styles.action, { color: ink }]}>{actionLabel}</Text> : null}
    </Card>
  );
};

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
          icon="checkIn"
          tone="mint"
          title="Readiness"
          value={`${readiness}%`}
          subtitle={readinessText}
        />
        <MetricCard
          icon="sleep"
          tone="lilac"
          title="Sleep"
          value={biometrics.sleep.logged ? `${biometrics.sleep.hoursSlept}h ${biometrics.sleep.minutesSlept}m` : '—'}
          subtitle={biometrics.sleep.logged ? biometrics.sleep.label.replace(/^\S+ \S+ /, '') : `Target ${sleepTarget}h`}
          onPress={() => {
            setHours(biometrics.sleep.logged ? biometrics.sleep.hoursSlept + biometrics.sleep.minutesSlept / 60 : 7);
            setSleepOpen(true);
          }}
          actionLabel={biometrics.sleep.logged ? 'Edit' : 'Log last night'}
        />
        <MetricCard
          icon="calendar"
          tone="rose"
          title="Cycle Day"
          value={cycle.hasCycleData ? `Day ${cycle.currentDay}` : '—'}
          subtitle={cycle.hasCycleData ? (cycle.isIrregular ? 'Irregular pattern' : cycle.phase) : 'Add period dates'}
          onPress={() => router.push('/log-cycle')}
          actionLabel={cycle.hasCycleData ? 'Update' : 'Add'}
        />
      </ScrollView>

      <Modal visible={sleepOpen} transparent animationType="fade" onRequestClose={() => setSleepOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>How long did you sleep?</Text>
              <Button
                variant="tertiary"
                size="sm"
                iconOnly
                onPress={() => setSleepOpen(false)}
                accessibilityLabel="Close"
                icon={<X size={20} color={Theme.colors.textSecondary} />}
              />
            </View>
            <Text style={styles.sheetHint}>Last night, roughly. Your target is {sleepTarget} hours.</Text>
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
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
            <Button
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

const styles = createStyles(() => ({
  container: { marginTop: Theme.space.lg },
  sectionTitle: { ...Theme.type.title, color: Theme.colors.textPrimary, paddingHorizontal: Theme.space.md },
  sectionHint: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, paddingHorizontal: Theme.space.md, marginBottom: Theme.space.sm, marginTop: 4 },
  scrollContent: { paddingHorizontal: Theme.space.md, gap: Theme.space.sm, paddingTop: Theme.space.sm, paddingBottom: 4 },
  card: { width: 152, gap: 4 },
  cardTitle: { ...Theme.type.caption, color: Theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Theme.space.xs },
  cardValue: { ...Theme.type.h3, color: Theme.colors.textPrimary, letterSpacing: -0.4 },
  cardSubtitle: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, textTransform: 'capitalize' },
  action: { ...Theme.type.label, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: Theme.colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Theme.space.lg },
  sheet: { width: '100%', maxWidth: 380, backgroundColor: Theme.colors.surfaceRaised, borderRadius: Theme.radius.xl, padding: Theme.space.lg, borderWidth: 1, borderColor: Theme.colors.cardBorder },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { ...Theme.type.title, color: Theme.colors.textPrimary },
  sheetHint: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: Theme.space.xs },
}));
