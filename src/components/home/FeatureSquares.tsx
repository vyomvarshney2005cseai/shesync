import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Dumbbell, Flower2, GraduationCap, HeartHandshake, MessageCircleHeart, Puzzle, Sparkles, Wind } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useFitnessStore } from '@/store/useFitnessStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useGamesStore } from '@/store/useGamesStore';
import { usePcosStore } from '@/store/usePcosStore';
import { useConfidenceStore } from '@/store/useConfidenceStore';
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
  const pcosCheckins = usePcosStore((s) => s.checkins.length);
  const confidenceToday = useConfidenceStore((s) => {
    const today = todayKey();
    const n = (s.glow[today]?.length ?? 0) + (s.challenges[today] ? 1 : 0) + (s.levels[today] ? 1 : 0);
    return n;
  });

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
      bg: themed('#FCE9F1'),
      ink: Theme.colors.primaryDark,
      icon: <MessageCircleHeart size={22} color={Theme.colors.primary} />,
    },
    {
      id: 'fitness',
      title: 'Fitness & Weight',
      sub: 'Workouts for your cycle',
      stat: `${stats.moveMinutes}/150 min this week`,
      href: '/fitness',
      bg: themed('#E7F5F0'),
      ink: themed('#2F7D69'),
      icon: <Dumbbell size={22} color={themed('#3E9E86')} />,
    },
    {
      id: 'pcos',
      title: 'PCOS Care',
      sub: 'Signs, food, exercise & doctor checklist',
      stat: pcosCheckins ? `${pcosCheckins} check-in${pcosCheckins === 1 ? '' : 's'}` : undefined,
      href: ROUTES.pcos,
      bg: themed('#FCEEF3'),
      ink: themed('#A8436F'),
      icon: <Flower2 size={22} color={themed('#C9578C')} />,
    },
    {
      id: 'confidence',
      title: 'Confidence Booster',
      sub: 'Affirmations & glow habits',
      stat: confidenceToday ? `${confidenceToday} done today` : undefined,
      href: ROUTES.confidence,
      bg: themed('#FFF1E8'),
      ink: themed('#B0603A'),
      icon: <Sparkles size={22} color={themed('#E07B4F')} />,
    },
    {
      id: 'care',
      title: 'Care Connect',
      sub: 'Doctors & women counsellors',
      href: ROUTES.care,
      bg: themed('#EFEAFB'),
      ink: Theme.colors.secondaryDark,
      icon: <HeartHandshake size={22} color={Theme.colors.secondary} />,
    },
    {
      id: 'study',
      title: 'Study Focus',
      sub: 'Focus timer & study plan',
      stat: `${stats.focusToday} focus min today`,
      href: '/study',
      bg: themed('#FDF0E6'),
      ink: themed('#9A5A2E'),
      icon: <GraduationCap size={22} color={themed('#C77B4A')} />,
    },
    {
      id: 'games',
      title: 'Mind Games',
      sub: 'Puzzles to reset your mind',
      stat: `${stats.gamesWeek} played this week`,
      href: '/games',
      bg: themed('#E9F2FA'),
      ink: themed('#3A6E94'),
      icon: <Puzzle size={22} color={themed('#4F8DBA')} />,
    },
    {
      id: 'breathe',
      title: 'Breathe',
      sub: 'One calm minute, any time',
      href: '/games/breathe',
      bg: themed('#FFF4E3'),
      ink: themed('#94672A'),
      icon: <Wind size={22} color={themed('#D19A45')} />,
    },
  ];

  return (
    <View style={styles.grid}>
      {squares.map((sq) => (
        <Pressable
          key={sq.id}
          onPress={() => router.push(sq.href)}
          style={({ pressed }) => [styles.square, { backgroundColor: themed(sq.bg) }, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${sq.title}. ${sq.sub}`}
        >
          <View style={styles.iconWrap}>{sq.icon}</View>
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: themed(sq.ink) }]} numberOfLines={2}>
              {sq.title}
            </Text>
            <Text style={styles.sub} numberOfLines={2}>
              {sq.sub}
            </Text>
          </View>
          {sq.stat ? (
            <Text style={[styles.stat, { color: themed(sq.ink) }]} numberOfLines={1}>
              {sq.stat}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = createStyles(() => ({
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
}));
