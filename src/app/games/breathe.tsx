import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { GameResult, LevelPicker, StatStrip, clock } from '@/components/games/GameKit';
import { Card, uiStyles } from '@/components/common/ui';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Theme, createStyles } from '@/constants/theme';
import { BREATH_PATTERNS } from '@/lib/games';
import { useGamesStore } from '@/store/useGamesStore';

type PatternId = keyof typeof BREATH_PATTERNS;
const DURATIONS = [
  { id: '1', label: '1 min' },
  { id: '2', label: '2 min' },
  { id: '3', label: '3 min' },
  { id: '5', label: '5 min' },
] as const;
type DurationId = (typeof DURATIONS)[number]['id'];

function KeepAwake() {
  useKeepAwake('shesync-breathe');
  return null;
}

export default function CalmBreathing() {
  const recordGame = useGamesStore((s) => s.recordGame);
  const [patternId, setPatternId] = useState<PatternId>('coherent');
  const [duration, setDuration] = useState<DurationId>('2');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ id: string; newBest: boolean } | null>(null);
  const [scale] = useState(() => new Animated.Value(0.55));

  const pattern = BREATH_PATTERNS[patternId];
  const cycleSec = pattern.steps.reduce((a, s) => a + s.seconds, 0);
  const totalSec = Number(duration) * 60;
  const running = startedAt != null && !done;

  const finish = (start: number, end: number) => {
    setDone(true);
    const secs = Math.max(1, Math.round((end - start) / 1000));
    setResult(recordGame({ game: 'breathe', seconds: secs, won: true, level: patternId }));
  };

  useEffect(() => {
    if (startedAt == null || done) return;
    const start = startedAt;
    const id = setInterval(() => {
      const t = Date.now();
      if (t - start >= totalSec * 1000) {
        clearInterval(id);
        finish(start, t);
      } else setNow(t);
    }, 200);
    return () => clearInterval(id);
    // finish uses the pattern chosen before starting; it cannot change mid-session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, done, totalSec]);

  // Where are we in the breathing cycle?
  const elapsed = running ? Math.max(0, ((now || startedAt!) - startedAt!) / 1000) : 0;
  const inCycle = elapsed % cycleSec;
  let acc = 0;
  let stepIdx = 0;
  for (let i = 0; i < pattern.steps.length; i++) {
    if (inCycle < acc + pattern.steps[i].seconds) {
      stepIdx = i;
      break;
    }
    acc += pattern.steps[i].seconds;
  }
  const step = pattern.steps[stepIdx];
  const stepLeft = Math.max(1, Math.ceil(acc + step.seconds - inCycle));
  const cycleNo = Math.floor(elapsed / cycleSec);

  // Animate the circle each time a new step begins.
  useEffect(() => {
    if (!running) {
      Animated.timing(scale, { toValue: 0.55, duration: 400, useNativeDriver: Platform.OS !== 'web' }).start();
      return;
    }
    Animated.timing(scale, {
      toValue: step.scale,
      duration: step.seconds * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [running, stepIdx, cycleNo, step.scale, step.seconds, scale]);

  const start = () => {
    const t = Date.now();
    setDone(false);
    setResult(null);
    setNow(t);
    setStartedAt(t);
  };

  const stop = () => {
    if (startedAt == null) return;
    const t = Date.now();
    if (t - startedAt >= 20000) finish(startedAt, t);
    else {
      setStartedAt(null);
    }
  };

  return (
    <Screen>
      {running && Platform.OS !== 'web' ? <KeepAwake /> : null}
      <ScreenHeader title="Calm Breathing" subtitle="Follow the circle. Breathe through your nose if you can." fallbackHref="/games" />
      {!running ? (
        <>
          <LevelPicker
            levels={(Object.keys(BREATH_PATTERNS) as PatternId[]).map((id) => ({ id, label: BREATH_PATTERNS[id].name }))}
            value={patternId}
            onChange={setPatternId}
          />
          <Text style={[uiStyles.muted, { marginTop: -4, marginBottom: 10 }]}>{pattern.hint}</Text>
          <LevelPicker levels={[...DURATIONS]} value={duration} onChange={setDuration} />
        </>
      ) : null}

      <StatStrip
        items={[
          { label: 'Left', value: clock(running ? Math.max(0, totalSec - elapsed) : totalSec) },
          { label: 'Breaths', value: `${running ? cycleNo + 1 : 0}` },
        ]}
      />

      <View style={styles.stage}>
        <Animated.View style={[styles.halo, { transform: [{ scale }] }]} />
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.stepLabel} accessibilityLiveRegion="polite">
            {running ? step.label : done ? 'Well done' : 'Ready'}
          </Text>
          {running ? <Text style={styles.stepCount}>{stepLeft}</Text> : null}
        </View>
      </View>

      {!running && !done ? (
        <PrimaryButton title="Begin" onPress={start} fullWidth style={{ marginTop: 8 }} />
      ) : null}
      {running ? <PrimaryButton title="Finish" variant="outline" onPress={stop} fullWidth style={{ marginTop: 8 }} /> : null}

      {done ? (
        <GameResult
          title="Session complete"
          lines={[`${pattern.name} · ${duration} min`, 'Notice your shoulders and jaw — are they a little softer?']}
          recordId={result?.id ?? null}
          onReplay={start}
        />
      ) : (
        <Card tone="lilac" style={{ marginTop: 16 }}>
          <Text style={uiStyles.body}>
            Long, slow exhales tell your nervous system it is safe. If you feel light-headed, return to normal
            breathing for a moment.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const SIZE = 240;
const styles = createStyles(() => ({
  stage: { height: SIZE + 30, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  halo: {
    position: 'absolute',
    width: SIZE + 30,
    height: SIZE + 30,
    borderRadius: (SIZE + 30) / 2,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  circle: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: Theme.colors.secondary,
    opacity: 0.85,
    ...Theme.shadows.glowing,
  },
  center: { alignItems: 'center' },
  stepLabel: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 4 },
  stepCount: { fontSize: 44, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
}));
