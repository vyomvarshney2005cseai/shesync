import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useFitnessStore } from '@/store/useFitnessStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useGamesStore } from '@/store/useGamesStore';
import { startOfWeekKey, todayKey } from '@/lib/dates';
import { Card, IconBadge, badgeColors, type BadgeTone, type BrandIconName } from '@/components/ds';

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
    stat: string;
    icon: BrandIconName;
    tone: BadgeTone;
    href: '/fitness' | '/study' | '/games';
  }[] = [
    {
      id: 'fitness',
      title: 'Fitness & Weight',
      stat: `${stats.moveMinutes}/150 active min this week`,
      icon: 'fitness',
      tone: 'mint',
      href: '/fitness',
    },
    {
      id: 'study',
      title: 'Study Focus',
      stat: `${stats.focusToday} focus min today`,
      icon: 'study',
      tone: 'lilac',
      href: '/study',
    },
    {
      id: 'games',
      title: 'Mind Games',
      stat: `${stats.gamesWeek} games this week`,
      icon: 'games',
      tone: 'rose',
      href: '/games',
    },
  ];

  const shown = only ? cards.filter((c) => only.includes(c.id)) : cards;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {shown.map((c) => (
        <Card key={c.id} onPress={() => router.push(c.href)} accessibilityLabel={`Open ${c.title}. ${c.stat}`} style={styles.card}>
          <IconBadge name={c.icon} tone={c.tone} size={48} />
          <View style={styles.textCol}>
            <Text style={styles.cardTitle}>{c.title}</Text>
            <View style={[styles.statPill, { backgroundColor: badgeColors(c.tone).bg }]}>
              <Text style={[styles.statText, { color: badgeColors(c.tone).fg }]}>{c.stat}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Theme.colors.textTertiary} />
        </Card>
      ))}
    </View>
  );
}

const styles = createStyles(() => ({
  container: { marginTop: 8, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  textCol: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.2 },
  statPill: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginTop: 8 },
  statText: { fontSize: 14, fontWeight: '800' },
}));
