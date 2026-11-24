import React, { useEffect, useState } from 'react';
import { Animated, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { Theme, createStyles } from '@/constants/theme';
import { useReduceMotion } from '@/lib/motion';
import { Card } from './Card';

/**
 * A grey placeholder in the shape of what is loading — used instead of a
 * spinner. It breathes gently; with reduced motion it stays still.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = Theme.radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReduceMotion();
  const [o] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduce) {
      o.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 0.55, duration: 800, useNativeDriver: true }),
        Animated.timing(o, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, o]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, borderRadius: radius, opacity: o }, style]}
    />
  );
}

/** A few lines of text that are still loading (the last one shorter). */
export function SkeletonLines({ lines = 3, style }: { lines?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.lines, style]}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}

/** A card-shaped placeholder: icon, title and a few lines. */
export function SkeletonCard({ lines = 2, label = 'Loading' }: { lines?: number; label?: string }) {
  return (
    <Card accessibilityLabel={label} accessibilityRole="progressbar">
      <View style={styles.head}>
        <Skeleton width={40} height={40} radius={Theme.radius.md} />
        <View style={{ flex: 1, gap: Theme.space.xs }}>
          <Skeleton height={16} width="55%" />
          <Skeleton height={12} width="35%" />
        </View>
      </View>
      <SkeletonLines lines={lines} style={{ marginTop: Theme.space.md }} />
    </Card>
  );
}

/**
 * The whole screen while saved data loads (web refresh, or behind the splash
 * screen on phones): a title, a hero card and two cards — no spinner.
 */
export function ScreenSkeleton({ label = 'Loading your data' }: { label?: string }) {
  return (
    <View style={styles.screen} accessibilityLabel={label} accessibilityRole="progressbar">
      <Skeleton height={28} width="45%" radius={Theme.radius.sm} />
      <Skeleton height={14} width="65%" style={{ marginTop: Theme.space.xs }} />
      <Skeleton height={160} radius={Theme.radius.lg} style={{ marginTop: Theme.space.lg }} />
      <View style={{ marginTop: Theme.space.md, gap: Theme.space.md }}>
        <SkeletonCard label={label} />
        <SkeletonCard label={label} lines={1} />
      </View>
    </View>
  );
}

const styles = createStyles(() => ({
  block: { backgroundColor: Theme.colors.skeleton },
  screen: { flex: 1, backgroundColor: Theme.colors.background, paddingHorizontal: Theme.space.md, paddingTop: Theme.space.xxl },
  lines: { gap: Theme.space.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: Theme.space.sm },
}));
