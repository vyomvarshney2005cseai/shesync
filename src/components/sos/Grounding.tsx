import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme, createStyles } from '@/constants/theme';
import { Button } from '@/components/ds';

export const GROUNDING_STEPS = [
  { count: 5, sense: 'see', title: '5 things you can see', hint: 'A colour, a light, something small you had not noticed.' },
  { count: 4, sense: 'touch', title: '4 things you can touch', hint: 'Your clothes, the floor under your feet, something cool or soft.' },
  { count: 3, sense: 'hear', title: '3 things you can hear', hint: 'A fan, traffic, your own breathing.' },
  { count: 2, sense: 'smell', title: '2 things you can smell', hint: 'Soap, tea, fresh air — or just notice the air itself.' },
  { count: 1, sense: 'taste', title: '1 thing you can taste', hint: 'Toothpaste, a sip of water, or simply your mouth right now.' },
] as const;

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

/**
 * 5-4-3-2-1 grounding: one sense at a time, a dot to tap for each thing she
 * notices. Ends by asking how she feels, so SOS can offer a call if needed.
 */
export function Grounding({ onFinished }: { onFinished: (feel: 'better' | 'same') => void }) {
  const [step, setStep] = useState(0);
  const [taps, setTaps] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <View style={styles.box}>
        <Text style={styles.title}>You did it.</Text>
        <Text style={styles.hint}>Take one slow breath. How do you feel now?</Text>
        <View style={styles.feelRow}>
          <Button title="A bit calmer" onPress={() => onFinished('better')} style={{ flex: 1 }} />
          <Button variant="secondary" title="Still not okay" onPress={() => onFinished('same')} style={{ flex: 1 }} />
        </View>
        <Button
          variant="link"
          title="Do it again"
          onPress={() => {
            setDone(false);
            setStep(0);
            setTaps(0);
          }}
          style={{ alignSelf: 'center', marginTop: 12 }}
        />
      </View>
    );
  }

  const s = GROUNDING_STEPS[step];
  const full = taps >= s.count;
  const next = () => {
    if (step === GROUNDING_STEPS.length - 1) setDone(true);
    else {
      setStep(step + 1);
      setTaps(0);
    }
  };

  return (
    <View style={styles.box}>
      <View style={styles.progress}>
        {GROUNDING_STEPS.map((g, i) => (
          <View key={g.sense} style={[styles.bar, i <= step && styles.barOn]} />
        ))}
      </View>
      <Text style={styles.big}>{s.count}</Text>
      <Text style={styles.title}>{s.title}</Text>
      <Text style={styles.hint}>{s.hint}</Text>
      <Text style={styles.small}>Tap a circle each time you notice one.</Text>
      <View style={styles.dots}>
        {Array.from({ length: s.count }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => {
              if (i === taps) {
                setTaps(taps + 1);
                tick();
              }
            }}
            style={[styles.dot, i < taps && styles.dotOn]}
            accessibilityRole="button"
            accessibilityLabel={`Noticed ${i + 1} of ${s.count}`}
            accessibilityState={{ checked: i < taps }}
          />
        ))}
      </View>
      <Button
        variant={full ? 'primary' : 'tertiary'}
        title={full ? (step === GROUNDING_STEPS.length - 1 ? 'Finish' : 'Next') : 'Skip this one'}
        onPress={next}
        fullWidth
        style={styles.nextBtn}
      />
    </View>
  );
}

const styles = createStyles(() => ({
  box: { alignItems: 'center', paddingVertical: 8 },
  progress: { flexDirection: 'row', gap: 8, alignSelf: 'stretch', marginBottom: 16 },
  bar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: Theme.colors.cardBorder },
  barOn: { backgroundColor: Theme.colors.secondary },
  big: { fontSize: 56, fontWeight: '900', color: Theme.colors.secondaryDark, lineHeight: 67 },
  title: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary, textAlign: 'center' },
  hint: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  small: { fontSize: 12, color: Theme.colors.textTertiary, marginTop: 12 },
  dots: { flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Theme.colors.secondary, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: Theme.colors.secondary },
  nextBtn: { marginTop: 20 },
  nextText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  nextSoft: { backgroundColor: 'transparent' },
  nextSoftText: { color: Theme.colors.textSecondary, fontWeight: '700', fontSize: 14 },
  feelRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  feelGood: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary },
  feelGoodText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  feelText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  again: { fontSize: 14, fontWeight: '700', color: Theme.colors.secondaryDark, textDecorationLine: 'underline' },
}));
