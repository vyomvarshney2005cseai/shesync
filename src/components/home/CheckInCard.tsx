import React from 'react';
import { View, Text } from 'react-native';
import { router, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { todayKey } from '@/lib/dates';
import { Card, IconBadge } from '@/components/ds';

/** Home entry point for the 10-second daily check-in. */
export function CheckInCard() {
  const doneToday = useAppStore((s) => {
    const today = todayKey();
    return s.symptomLogs.some((l) => l.checkIn && l.date === today);
  });

  return (
    <Card
      tone={doneToday ? 'default' : 'rose'}
      onPress={() => router.push('/check-in' as Href)}
      accessibilityLabel={doneToday ? 'Edit today’s check-in' : 'Start the 10-second check-in'}
      style={styles.card}
    >
      <View style={styles.row}>
        <IconBadge name="checkIn" tone={doneToday ? 'mint' : 'rose'} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{doneToday ? 'Checked in today' : '10-second check\u2011in'}</Text>
          <Text style={styles.sub}>{doneToday ? 'Tap to update mood, pain, flow or sleep' : 'Mood · pain · flow · sleep · tummy'}</Text>
        </View>
        <View style={[styles.cta, doneToday && styles.ctaDone]}>
          <Text style={[styles.ctaText, doneToday && styles.ctaTextDone]}>{doneToday ? 'Edit' : 'Start'}</Text>
          <ChevronRight size={16} color={doneToday ? Theme.colors.primaryDark : Theme.colors.onPrimary} />
        </View>
      </View>
    </Card>
  );
}

const styles = createStyles(() => ({
  card: { marginHorizontal: Theme.space.md, marginTop: Theme.space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Theme.space.sm },
  title: { ...Theme.type.title, color: Theme.colors.textPrimary },
  sub: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 2 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 36,
    paddingHorizontal: Theme.space.sm,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.primary,
  },
  ctaDone: { backgroundColor: Theme.colors.primaryLight },
  ctaText: { ...Theme.type.label, color: Theme.colors.onPrimary },
  ctaTextDone: { color: Theme.colors.primaryDark },
}));
