import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Brain, Calculator, Grid3x3, LayoutGrid, Puzzle, Wind } from 'lucide-react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Card, SectionHeader, StatTile, uiStyles } from '@/components/common/ui';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useGamesStore, type GameId } from '@/store/useGamesStore';
import { startOfWeekKey, formatClock } from '@/lib/dates';
import { dayStreak } from '@/lib/streaks';

interface GameTile {
  id: GameId;
  name: string;
  benefit: string;
  icon: React.ReactNode;
  bg: string;
  best: (b?: { bestScore?: number; bestMoves?: number; bestSeconds?: number; plays: number }) => string;
}

const GAMES: GameTile[] = [
  {
    id: 'breathe',
    name: 'Calm Breathing',
    benefit: 'Slow your breath, settle your body',
    icon: <Wind size={22} color="#047857" />,
    bg: '#D1FAE5',
    best: (b) => (b?.plays ? `${b.plays} session${b.plays > 1 ? 's' : ''}` : 'Start in 1 tap'),
  },
  {
    id: 'memory',
    name: 'Memory Match',
    benefit: 'Gentle focus & short-term memory',
    icon: <LayoutGrid size={22} color={Theme.colors.primaryDark} />,
    bg: Theme.colors.primaryLight,
    best: (b) => (b?.bestMoves ? `Best: ${b.bestMoves} moves` : 'Not played yet'),
  },
  {
    id: 'maths',
    name: 'Quick Maths',
    benefit: 'Wake up a foggy brain with mental maths',
    icon: <Calculator size={22} color="#B45309" />,
    bg: '#FEF3C7',
    best: (b) => (b?.bestScore != null ? `Best: ${b.bestScore} correct` : 'Not played yet'),
  },
  {
    id: 'slide',
    name: 'Sliding Puzzle',
    benefit: 'Planning & problem solving',
    icon: <Puzzle size={22} color={Theme.colors.secondaryDark} />,
    bg: Theme.colors.secondaryLight,
    best: (b) => (b?.bestMoves ? `Best: ${b.bestMoves} moves` : 'Not played yet'),
  },
  {
    id: 'sudoku',
    name: 'Mini Sudoku',
    benefit: 'Logic without the stress — 4×4 or 6×6',
    icon: <Grid3x3 size={22} color="#0E7490" />,
    bg: '#CFFAFE',
    best: (b) => (b?.bestSeconds != null ? `Best: ${formatClock(b.bestSeconds)}` : 'Not played yet'),
  },
  {
    id: 'schulte',
    name: 'Focus Grid',
    benefit: 'Tap 1→25 in order to train attention',
    icon: <Brain size={22} color="#A8436F" />,
    bg: '#FCE7F3',
    best: (b) => (b?.bestSeconds != null ? `Best: ${formatClock(b.bestSeconds)}` : 'Not played yet'),
  },
];

/** Best stats across a game's levels (stored per level as "game:level"). */
function bestFor(best: Record<string, any>, id: GameId) {
  const entries = Object.entries(best).filter(([k]) => k === id || k.startsWith(`${id}:`)).map(([, v]) => v);
  if (!entries.length) return undefined;
  return {
    plays: entries.reduce((a, b) => a + (b?.plays ?? 0), 0),
    bestScore: entries.map((e) => e?.bestScore).filter((v) => v != null).sort((a, b) => b - a)[0],
    bestMoves: entries.map((e) => e?.bestMoves).filter((v) => v != null).sort((a, b) => a - b)[0],
    bestSeconds: entries.map((e) => e?.bestSeconds).filter((v) => v != null).sort((a, b) => a - b)[0],
  };
}

export default function GamesDashboard() {
  const records = useGamesStore((s) => s.records);
  const best = useGamesStore((s) => s.best);

  const stats = useMemo(() => {
    const week = startOfWeekKey();
    const thisWeek = records.filter((r) => r.date >= week);
    const rated = records.filter((r) => r.feelAfter).slice(0, 30);
    const calmer = rated.filter((r) => r.feelAfter === 'calmer' || r.feelAfter === 'okay').length;
    return {
      games: thisWeek.length,
      minutes: Math.round(thisWeek.reduce((a, r) => a + r.seconds, 0) / 60),
      streak: dayStreak(records.map((r) => r.date)),
      calmerPct: rated.length >= 3 ? Math.round((calmer / rated.length) * 100) : null,
    };
  }, [records]);

  return (
    <Screen>
      <ScreenHeader title="Mind Games" subtitle="Short games to reset your mind" />

      <View style={styles.tiles}>
        <StatTile label="This week" value={`${stats.games}`} hint="games played" color={Theme.colors.primary} />
        <StatTile label="Calm time" value={`${stats.minutes} min`} hint="this week" color={themed('#047857')} />
        <StatTile label="Streak" value={`${stats.streak}d`} hint="days in a row" color={Theme.colors.secondary} />
      </View>
      {stats.calmerPct != null ? (
        <Card tone="mint" style={{ marginTop: 10 }}>
          <Text style={[uiStyles.body, { color: themed('#065F46') }]}>
            You felt okay or calmer after {stats.calmerPct}% of your recent sessions. 💚
          </Text>
        </Card>
      ) : null}

      <SectionHeader title="Pick a game" subtitle="Each one takes 1–5 minutes. No ads, no pressure." />
      <View style={styles.grid}>
        {GAMES.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => router.push(`/games/${g.id}`)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            accessibilityRole="button"
            accessibilityLabel={`${g.name}. ${g.benefit}`}
          >
            <View style={[styles.icon, { backgroundColor: themed(g.bg) }]}>{g.icon}</View>
            <Text style={styles.name}>{g.name}</Text>
            <Text style={styles.benefit} numberOfLines={2}>
              {g.benefit}
            </Text>
            <Text style={styles.bestText}>{g.best(bestFor(best, g.id))}</Text>
          </Pressable>
        ))}
      </View>

      <Card tone="lilac" style={{ marginTop: 8 }}>
        <Text style={uiStyles.strong}>Why games?</Text>
        <Text style={[uiStyles.body, { marginTop: 4 }]}>
          Short, absorbing tasks pull attention away from worry loops, and slow breathing helps your body
          switch out of stress mode. Use them as a 3-minute reset between study blocks or on a heavy PMS day.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = createStyles(() => ({
  tiles: { flexDirection: 'row', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  name: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
  benefit: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 3, lineHeight: 16, minHeight: 32 },
  bestText: { fontSize: 11, fontWeight: '800', color: Theme.colors.primary, marginTop: 8 },
}));
