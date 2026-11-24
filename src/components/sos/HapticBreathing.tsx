import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useReduceMotion } from '@/lib/motion';
import { Theme, createStyles, themed } from '@/constants/theme';
import { BREATH, breathAt, hapticSlot } from '@/lib/breathing';
import { Button, SwitchRow } from '@/components/ds';

const KEEP_AWAKE_TAG = 'shesync-sos-breathe';
const canVibrate = Platform.OS === 'ios' || Platform.OS === 'android';

/** A breathing circle with matching vibrations, so it works with eyes closed. */
export function HapticBreathing() {
  const [running, setRunning] = useState(false);
  const [vibrate, setVibrate] = useState(canVibrate);
  const [t, setT] = useState(0);
  const [scale] = useState(() => new Animated.Value(0.6));
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    let lastKey = '';
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    // Reduced motion: the circle stays still; the words, timer and vibration still guide the breath.
    const loop = reduceMotion ? null : Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: BREATH.inhale * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.delay(BREATH.hold * 1000),
        Animated.timing(scale, { toValue: 0.6, duration: BREATH.exhale * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    loop?.start();
    const id = setInterval(() => {
      const secs = (Date.now() - start) / 1000;
      setT(secs);
      if (!vibrate || !canVibrate) return;
      const slot = hapticSlot(secs);
      if (slot && slot.key !== lastKey) {
        lastKey = slot.key;
        Haptics.impactAsync(slot.style === 'in' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    }, 50);
    return () => {
      clearInterval(id);
      loop?.stop();
      scale.setValue(0.6);
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [running, vibrate, scale, reduceMotion]);

  const b = breathAt(t);
  const label = !running ? 'Ready' : b.stage === 'in' ? 'Breathe in' : b.stage === 'hold' ? 'Hold' : 'Breathe out';

  return (
    <View style={styles.box}>
      <View style={styles.circleWrap}>
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
        <View style={styles.circleText} pointerEvents="none">
          <Text style={styles.stage} accessibilityLiveRegion="polite">
            {label}
          </Text>
          {running ? <Text style={styles.count}>{b.secondsLeft}</Text> : null}
        </View>
      </View>
      <Text style={styles.hint}>
        {running
          ? `${b.breaths} breath${b.breaths === 1 ? '' : 's'} · in 4 · hold 2 · out 6`
          : 'In for 4, hold for 2, out for 6. A long out-breath tells your body it is safe.'}
      </Text>
      <Button
        variant={running ? 'secondary' : 'primary'}
        title={running ? 'Stop' : 'Start breathing'}
        onPress={() => {
          setT(0);
          setRunning(!running);
        }}
        fullWidth
        style={styles.btn}
      />
      <SwitchRow
        bare
        accent="secondary"
        style={styles.vibRow}
        title="Vibrate with the breath"
        subtitle={canVibrate ? 'Eyes closed: quick taps — in, still — hold, slow taps — out.' : 'Vibration works in the phone app.'}
        value={vibrate && canVibrate}
        onValueChange={setVibrate}
        disabled={!canVibrate}
      />
    </View>
  );
}

const SIZE = 190;
const styles = createStyles(() => ({
  box: { alignItems: 'center', paddingVertical: 8 },
  circleWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  circle: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: 'rgba(139, 92, 246, 0.22)', borderWidth: 2, borderColor: 'rgba(139, 92, 246, 0.45)' },
  circleText: { alignItems: 'center' },
  stage: { fontSize: 20, fontWeight: '800', color: Theme.colors.textPrimary },
  count: { fontSize: 32, fontWeight: '900', color: Theme.colors.secondaryDark, marginTop: 4 },
  hint: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 12 },
  btn: { marginTop: 16 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  btnStop: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Theme.colors.cardBorder },
  btnStopText: { color: Theme.colors.textPrimary },
  vibRow: { marginTop: 8, alignSelf: 'stretch' },
}));
