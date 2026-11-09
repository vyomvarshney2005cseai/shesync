import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Dumbbell, GraduationCap, Puzzle, ChevronRight } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useFitnessStore } from '@/store/useFitnessStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useGamesStore } from '@/store/useGamesStore';
import { startOfWeekKey, todayKey } from '@/lib/dates';

type HubId = 'fitness' | 'study' | 'games';

interface WellnessHubProps {
  only?: HubId[];
  title?: string;
}

/** Entry cards for the Fitness, Study Focus and Mind Games dashboards, with live stats. */
export function WellnessHub({ only, title = 'Your wellness dashboards' }: WellnessHubProps) {
  const sessions = useFitnessStore((s) => s.sessions);
  const focusSessions = useStudyStore((s) => s.sessions);
  const records = useGamesStore((s) => s.records);

  const stats = useMemo(() => {
    const week = startOfWeekKey();
    const today = todayKey();
    const moveMinutes = sessions.filter((s) => s.date >= week).reduce((a, s) => a + s.minutes, 0);
    const focusToday = focusSessions.filter((s) => s.date === today).reduce((a, s) => a + s.minutes, 0);
    const gamesWeek = records.filter((r) => r.date >= week).length;
    return { moveMinutes, focusToday, gamesWeek };
  }, [sessions, focusSessions, records]);

  const cards: {
    id: HubId;
    title: string;
    sub: string;
    stat: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    href: '/fitness' | '/study' | '/games';
  }[] = [
    {
      id: 'fitness',
      title: 'Fitness & Weight',
      sub: 'Gym, home workouts & yoga that adapt to your cycle',
      stat: `${stats.moveMinutes}/150 active min this week`,
      icon: <Dumbbell size={22} color="#0F766E" />,
      color: '#0F766E',
      bg: '#E6F7F3',
      href: '/fitness',
    },
    {
      id: 'study',
      title: 'Study Focus',
      sub: 'Period-aware focus timer, confidence & motivation',
      stat: `${stats.focusToday} focus min today`,
      icon: <GraduationCap size={22} color={Theme.colors.secondaryDark} />,
      color: Theme.colors.secondaryDark,
      bg: Theme.colors.secondaryLight,
      href: '/study',
    },
    {
      id: 'games',
      title: 'Mind Games',
      sub: 'Puzzles, maths & breathing to reset your brain',
      stat: `${stats.gamesWeek} games this week`,
      icon: <Puzzle size={22} color={Theme.colors.primaryDark} />,
      color: Theme.colors.primaryDark,
      bg: Theme.colors.primaryLight,
      href: '/games',
    },
  ];

  const shown = only ? cards.filter((c) => only.includes(c.id)) : cards;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {shown.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => router.push(c.href)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${c.title}`}
        >
          <View style={[styles.iconWrap, { backgroundColor: c.bg }]}>{c.icon}</View>
          <View style={styles.textCol}>
            <Text style={styles.cardTitle}>{c.title}</Text>
            <Text style={styles.cardSub} numberOfLines={2}>
              {c.sub}
            </Text>
            <View style={[styles.statPill, { backgroundColor: c.bg }]}>
              <Text style={[styles.statText, { color: c.color }]}>{c.stat}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Theme.colors.textTertiary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  textCol: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.2 },
  cardSub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2, lineHeight: 17 },
  statPill: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  statText: { fontSize: 11, fontWeight: '800' },
});
