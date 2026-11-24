import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Theme, createStyles } from '@/constants/theme';
import { Card, IconBadge, badgeColors, type BadgeTone } from '@/components/ds';
import type { BrandIconName } from '@/components/icons/BrandIcon';
import { useFitnessStore } from '@/store/useFitnessStore';
import { useStudyStore } from '@/store/useStudyStore';
import { useGamesStore } from '@/store/useGamesStore';
import { usePcosStore } from '@/store/usePcosStore';
import { useConfidenceStore } from '@/store/useConfidenceStore';
import { usePadCareStore } from '@/store/usePadCareStore';
import { useAppStore } from '@/store/useAppStore';
import { startOfWeekKey, todayKey } from '@/lib/dates';
import { ROUTES } from '@/lib/routes';

interface Square {
  id: string;
  title: string;
  sub: string;
  stat?: string;
  href: Href;
  icon: BrandIconName;
  tone: BadgeTone;
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
  const padChanges = usePadCareStore((s) => s.changes);
  const padTimerOn = usePadCareStore((s) => s.active !== null);
  const examsAhead = useStudyStore((s) => s.exams.filter((e) => e.date >= todayKey()).length);
  const onPeriod = useAppStore((s) => s.cycle.phase === 'menstrual');

  const stats = useMemo(() => {
    const week = startOfWeekKey();
    const today = todayKey();
    return {
      moveMinutes: sessions.filter((s) => s.date >= week).reduce((a, s) => a + s.minutes, 0),
      focusToday: focusSessions.filter((s) => s.date === today).reduce((a, s) => a + s.minutes, 0),
      gamesWeek: records.filter((r) => r.date >= week).length,
      padToday: padChanges.filter((c) => c.date === today).length,
    };
  }, [sessions, focusSessions, records, padChanges]);

  const padCare: Square = {
    id: 'padcare',
    title: 'Pad Care',
    sub: 'Change reminders & safer pads',
    stat: padTimerOn ? `Timer on · ${stats.padToday} today` : onPeriod ? 'Start the change timer' : undefined,
    href: ROUTES.padCare,
    icon: 'padCare',
    tone: 'rose',
  };

  const base: Square[] = [
    {
      id: 'ygg',
      title: 'YourGoGirl',
      sub: 'Ask about periods, mood & focus',
      href: ROUTES.yourGoGirl,
    icon: 'chat',
    tone: 'rose',
    },
    {
      id: 'fitness',
      title: 'Fitness & Weight',
      sub: 'Workouts for your cycle',
      stat: `${stats.moveMinutes}/150 min this week`,
      href: '/fitness',
    icon: 'fitness',
    tone: 'mint',
    },
    {
      id: 'pcos',
      title: 'PCOS Care',
      sub: 'Signs, food, exercise & doctor checklist',
      stat: pcosCheckins ? `${pcosCheckins} check-in${pcosCheckins === 1 ? '' : 's'}` : undefined,
      href: ROUTES.pcos,
    icon: 'pcos',
    tone: 'lilac',
    },
    {
      id: 'confidence',
      title: 'Confidence Booster',
      sub: 'Affirmations & glow habits',
      stat: confidenceToday ? `${confidenceToday} done today` : undefined,
      href: ROUTES.confidence,
    icon: 'confidence',
    tone: 'peach',
    },
    {
      id: 'care',
      title: 'Care Connect',
      sub: 'Doctors & women counsellors',
      href: ROUTES.care,
    icon: 'care',
    tone: 'lilac',
    },
    {
      id: 'study',
      title: 'Study Focus',
      sub: 'Focus timer & study plan',
      stat: `${stats.focusToday} focus min today`,
      href: '/study',
    icon: 'study',
    tone: 'amber',
    },
    {
      id: 'exams',
      title: 'Exam planner',
      sub: 'Exams vs your period & PMS',
      stat: examsAhead ? `${examsAhead} exam${examsAhead === 1 ? '' : 's'} ahead` : undefined,
      href: ROUTES.exams,
    icon: 'exam',
    tone: 'sky',
    },
    {
      id: 'games',
      title: 'Mind Games',
      sub: 'Puzzles to reset your mind',
      stat: `${stats.gamesWeek} played this week`,
      href: '/games',
    icon: 'games',
    tone: 'sky',
    },
    {
      id: 'breathe',
      title: 'Breathe',
      sub: 'One calm minute, any time',
      href: '/games/breathe',
    icon: 'breathe',
    tone: 'mint',
    },
  ];

  // Pad Care comes right after YourGoGirl during her period or while its timer runs;
  // otherwise it sits after PCOS Care.
  const squares = [...base];
  const at = onPeriod || padTimerOn ? 1 : squares.findIndex((s) => s.id === 'pcos') + 1;
  squares.splice(at, 0, padCare);

  return (
    <View style={styles.grid}>
      {squares.map((sq, i) => {
        const wide = squares.length % 2 === 1 && i === squares.length - 1;
        return (
          <Card
            key={sq.id}
            onPress={() => router.push(sq.href)}
            accessibilityLabel={`${sq.title}. ${sq.sub}${sq.stat ? `. ${sq.stat}` : ''}`}
            // An odd one out at the end spans the full row instead of sitting alone.
            style={[styles.square, wide && styles.wide]}
          >
            <IconBadge name={sq.icon} tone={sq.tone} size={48} />
            <View style={styles.textBlock}>
              <Text style={styles.title} numberOfLines={2}>
                {sq.title}
              </Text>
              <Text style={styles.sub} numberOfLines={2}>
                {sq.sub}
              </Text>
              {sq.stat ? (
                <Text style={[styles.stat, { color: badgeColors(sq.tone).fg }]} numberOfLines={1}>
                  {sq.stat}
                </Text>
              ) : null}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = createStyles(() => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Theme.space.sm,
    paddingHorizontal: Theme.space.md,
  },
  square: { width: '48.5%', minHeight: 176, justifyContent: 'space-between', gap: Theme.space.sm },
  wide: { width: '100%', minHeight: 0, flexDirection: 'row', alignItems: 'center' },
  textBlock: { gap: 4, flexShrink: 1 },
  title: { ...Theme.type.label, fontSize: 16, lineHeight: 22, color: Theme.colors.textPrimary },
  sub: { ...Theme.type.bodySm, color: Theme.colors.textSecondary },
  stat: { ...Theme.type.caption, fontWeight: '700', marginTop: 2 },
}));
