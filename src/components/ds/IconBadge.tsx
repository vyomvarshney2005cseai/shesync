import React, { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Theme, createStyles, withAlpha } from '@/constants/theme';
import { BrandIcon, type BrandIconName } from '@/components/icons/BrandIcon';
import { BRAND_ICONS, type IconMotion } from '@/components/icons/brandIconData';
import { useReduceMotion } from '@/lib/motion';
import { usePressSignal } from './PressFeedback';
import { badgeColors, type BadgeTone } from './tones';

export { badgeColors, type BadgeTone } from './tones';

/**
 * A feature icon in a soft squircle that adapts to light and dark mode.
 * Plays a small micro-interaction (bell rings, sparkle spins, heart pulses …)
 * when its card or button is pressed or hovered — unless the phone asks
 * for reduced motion.
 */
export function IconBadge({
  name,
  tone = 'rose',
  size = 44,
  label,
  motion,
}: {
  name: BrandIconName;
  tone?: BadgeTone;
  /** Container size; the icon is about 55% of it. */
  size?: number;
  label?: string;
  motion?: IconMotion;
}) {
  const { fg, bg } = badgeColors(tone);
  const signal = usePressSignal();
  const reduce = useReduceMotion();
  const kind = motion ?? BRAND_ICONS[name].motion;
  const [t] = useState(() => new Animated.Value(0));
  // The signal starts at 0 for every card; only a press or hover moves it.
  const [startSignal] = useState(signal);

  useEffect(() => {
    if (signal === startSignal) return;
    if (reduce || kind === 'none') return;
    t.setValue(0);
    Animated.timing(t, {
      toValue: 1,
      duration: kind === 'ring' ? 600 : kind === 'spin' ? 650 : 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [signal, startSignal, reduce, kind, t]);

  const transform =
    kind === 'ring'
      ? [{ rotate: t.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: ['0deg', '-14deg', '12deg', '-8deg', '4deg', '0deg'] }) }]
      : kind === 'pulse'
      ? [{ scale: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.16, 1] }) }]
      : kind === 'tilt'
      ? [{ rotate: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '-10deg', '0deg'] }) }]
      : kind === 'bounce'
      ? [{ translateY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -3, 0] }) }]
      : kind === 'spin'
      ? [{ rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }]
      : [];

  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size >= 48 ? Theme.radius.lg : Theme.radius.md, backgroundColor: bg, borderColor: withAlpha(fg, 0.16) },
      ]}
    >
      <Animated.View style={{ transform }}>
        <BrandIcon name={name} size={Math.round(size * 0.56)} color={fg} label={label} />
      </Animated.View>
    </View>
  );
}

const styles = createStyles(() => ({
  badge: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
}));
