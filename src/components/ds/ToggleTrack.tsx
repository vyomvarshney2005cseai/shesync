import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { Theme, createStyles } from '@/constants/theme';
import { useReduceMotion } from '@/lib/motion';

/**
 * The switch graphic. It is drawn, not a native control, so it looks the
 * same on iOS, Android and the web in light and dark mode, and it is never a
 * separate tap target: the whole row around it is the switch (see SwitchRow).
 *
 * Off: outlined track and thumb in the tertiary text colour (at least 3:1
 * against the card, as WCAG 1.4.11 asks for controls). On: filled with the
 * accent colour. The thumb slides unless the phone asks for reduced motion.
 */
export function ToggleTrack({ value, disabled, accent = 'primary' }: { value: boolean; disabled?: boolean; accent?: 'primary' | 'secondary' }) {
  const reduce = useReduceMotion();
  const [x] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    if (reduce) {
      x.setValue(value ? 1 : 0);
      return;
    }
    const anim = Animated.timing(x, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [value, reduce, x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const on = accent === 'secondary' ? styles.trackOnSecondary : styles.trackOn;
  return (
    <View
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.track, value ? on : styles.trackOff, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff, { transform: [{ translateX }] }]} />
    </View>
  );
}

const styles = createStyles(() => ({
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    padding: 4,
    justifyContent: 'center',
  },
  trackOff: { backgroundColor: Theme.colors.card, borderColor: Theme.colors.textTertiary },
  trackOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  trackOnSecondary: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary },
  thumb: { width: 20, height: 20, borderRadius: 10 },
  thumbOff: { backgroundColor: Theme.colors.textTertiary },
  thumbOn: { backgroundColor: Theme.colors.onPrimary },
  disabled: { opacity: 0.45 },
}));
