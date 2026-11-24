import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useReduceMotion } from '@/lib/motion';
import { BrandIcon, type BrandIconName } from './BrandIcon';

/** Bottom-tab icon: the brand icon on a soft pill when selected, with a small hop when it becomes active. */
export function TabIcon({ name, color, focused }: { name: BrandIconName; color: string; focused: boolean }) {
  const reduce = useReduceMotion();
  const [hop] = useState(() => new Animated.Value(0));

  // A small hop when the tab becomes active (not on first render).
  useEffect(() => {
    if (!focused || reduce) return;
    hop.setValue(0);
    const anim = Animated.spring(hop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true });
    anim.start(() => hop.setValue(0));
    return () => anim.stop();
  }, [focused, reduce, hop]);

  const translateY = hop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -3, 0] });
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <BrandIcon name={name} size={24} color={themed(color)} accent={focused ? Theme.colors.primary : themed(color)} />
      </Animated.View>
    </View>
  );
}

const styles = createStyles(() => ({
  pill: { width: 56, height: 32, borderRadius: Theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: Theme.colors.primaryLight },
}));
