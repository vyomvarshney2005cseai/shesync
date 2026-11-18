import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { CheckCircle2, Timer, ChevronRight } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { todayKey } from '@/lib/dates';

/** Home entry point for the 10-second daily check-in. */
export function CheckInCard() {
  const doneToday = useAppStore((s) => {
    const today = todayKey();
    return s.symptomLogs.some((l) => l.checkIn && l.date === today);
  });

  return (
    <Pressable
      onPress={() => router.push('/check-in' as Href)}
      style={({ pressed }) => [styles.card, doneToday && styles.cardDone, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={doneToday ? 'Edit today’s check-in' : 'Start the 10-second check-in'}
    >
      <View style={[styles.icon, doneToday && styles.iconDone]}>
        {doneToday ? (
          <CheckCircle2 size={22} color={Theme.colors.strainOptimal} />
        ) : (
          <Timer size={22} color={themed('#FFFFFF')} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{doneToday ? 'Checked in today' : '10-second check-in'}</Text>
        <Text style={styles.sub}>{doneToday ? 'Tap to update mood, pain, flow or sleep' : 'Mood · pain · flow · sleep · tummy'}</Text>
      </View>
      <View style={[styles.cta, doneToday && styles.ctaDone]}>
        <Text style={[styles.ctaText, doneToday && styles.ctaTextDone]}>{doneToday ? 'Edit' : 'Start'}</Text>
        <ChevronRight size={14} color={doneToday ? Theme.colors.primaryDark : themed('#FFFFFF')} />
      </View>
    </Pressable>
  );
}

const styles = createStyles(() => ({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(201, 87, 140, 0.28)',
  },
  cardDone: {
    backgroundColor: Theme.colors.card,
    borderColor: Theme.colors.cardBorder,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDone: { backgroundColor: Theme.colors.sageLight },
  title: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
  sub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
  },
  ctaDone: { backgroundColor: Theme.colors.backgroundMuted },
  ctaText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  ctaTextDone: { color: Theme.colors.primaryDark },
}));
