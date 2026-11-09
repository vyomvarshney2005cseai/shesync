import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Dumbbell, GraduationCap, HeartHandshake, MessageCircleHeart, Puzzle, Wind } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useFitnessStore } from '@/store/useFitnessStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useGamesStore } from '@/store/useGamesStore';
import { startOfWeekKey, todayKey } from '@/lib/dates';
import { ROUTES } from '@/lib/routes';

interface Square {
  id: string;
  title: string;
  sub: string;
  stat?: string;
  href: Href;
  bg: string;
  ink: string;
  icon: React.ReactNode;
}

/** Square "experience boxes" for SheSync's features, shown on Home. */
export function FeatureSquares() {
  const sessions = useFitnessStore((s) => s.sessions);
  const focusSessions = useStudyStore((s) => s.sessions);
  const records = useGamesStore((s) => s.records);

  const stats = useMemo(() => {
    const week = startOfWeekKey();
    const today = todayKey();
    return {
      moveMinutes: sessions.filter((s) => s.date >= week).reduce((a, s) => a + s.minutes, 0),
      focusToday: focusSessions.filter((s) => s.date === today).reduce((a, s) => a + s.minutes, 0),
      gamesWeek: records.filter((r) => r.date >= week).length,
    };
  }, [sessions, focusSessions, records]);

  const squares: Square[] = [
    {
      id: 'ygg',
      title: 'YourGoGirl',
      sub: 'Ask about periods, mood & focus',
      href: ROUTES.yourGoGirl,
      bg: '#FCE9F1',
      ink: Theme.colors.primaryDark,
      icon: <MessageCircleHeart size={22} color={Theme.colors.primary} />,
    },
    {
      id: 'fitness',
      title: 'Fitness & Weight',
      sub: 'Workouts for your cycle',
      stat: `${stats.moveMinutes}/150 min this week`,
      href: '/fitness',
      bg: '#E7F5F0',
      ink: '#2F7D69',
      icon: <Dumbbell size={22} color="#3E9E86" />,
    },
    {
      id: 'care',
      title: 'Care Connect',
      sub: 'Doctors & women counsellors',
      href: ROUTES.care,
      bg: '#EFEAFB',
      ink: Theme.colors.secondaryDark,
      icon: <HeartHandshake size={22} color={Theme.colors.secondary} />,
    },
    {
      id: 'study',
      title: 'Study Focus',
      sub: 'Focus timer & study plan',
      stat: `${stats.focusToday} focus min today`,
      href: '/study',
      bg: '#FDF0E6',
      ink: '#9A5A2E',
      icon: <GraduationCap size={22} color="#C77B4A" />,
    },
    {
      id: 'games',
      title: 'Mind Games',
      sub: 'Puzzles to reset your mind',
      stat: `${stats.gamesWeek} played this week`,
      href: '/games',
      bg: '#E9F2FA',
      ink: '#3A6E94',
      icon: <Puzzle size={22} color="#4F8DBA" />,
    },
    {
      id: 'breathe',
      title: 'Breathe',
      sub: 'One calm minute, any time',
      href: '/games/breathe',
      bg: '#FFF4E3',
      ink: '#94672A',
      icon: <Wind size={22} color="#D19A45" />,
    },
  ];

  return (
    <View style={styles.grid}>
      {squares.map((sq) => (
        <Pressable
          key={sq.id}
          onPress={() => router.push(sq.href)}
          style={({ pressed }) => [styles.square, { backgroundColor: sq.bg }, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${sq.title}. ${sq.sub}`}
        >
          <View style={styles.iconWrap}>{sq.icon}</View>
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: sq.ink }]} numberOfLines={1}>
              {sq.title}
            </Text>
            <Text style={styles.sub} numberOfLines={2}>
              {sq.sub}
            </Text>
          </View>
          {sq.stat ? (
            <Text style={[styles.stat, { color: sq.ink }]} numberOfLines={1}>
              {sq.stat}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingHorizontal: 20,
  },
  square: {
    width: '48.2%',
    aspectRatio: 1,
    borderRadius: 26,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    ...Theme.shadows.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { gap: 2 },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  sub: { fontSize: 11.5, lineHeight: 15, color: Theme.colors.textSecondary },
  stat: { fontSize: 10.5, fontWeight: '700', opacity: 0.85 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
