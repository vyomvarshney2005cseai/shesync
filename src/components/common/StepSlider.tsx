import React, { useRef, useState } from 'react';
import { View, type LayoutChangeEvent, type GestureResponderEvent } from 'react-native';
import { Theme, createStyles, themed, withAlpha } from '@/constants/theme';

interface StepSliderProps {
  min: number;
  max: number;
  step: number;
  /** null = not set yet: the thumb is dimmed until she touches the slider. */
  value: number | null;
  onChange: (value: number) => void;
  /** Where an unset slider's thumb rests. */
  restAt?: number;
  color?: string;
  accessibilityLabel: string;
  /** Spoken value, e.g. "6 out of 10". */
  valueText: (value: number) => string;
}

const THUMB = 28;

/**
 * A slider that snaps to steps. Built on the touch responder system so it works
 * the same on Android, iOS and the web, follows night mode, and counts a tap
 * on the current position as "set" (a native slider would not).
 */
export function StepSlider({
  min,
  max,
  step,
  value,
  onChange,
  restAt,
  color = Theme.colors.primary,
  accessibilityLabel,
  valueText,
}: StepSliderProps) {
  const [width, setWidth] = useState(0);
  const grab = useRef({ x: 0, pageX: 0 });
  const steps = Math.round((max - min) / step);
  const shown = value ?? restAt ?? min;
  const fraction = steps > 0 ? (shown - min) / (max - min) : 0;
  const isSet = value !== null;

  const toValue = (x: number) => {
    if (width <= 0) return min;
    const usable = Math.max(1, width - THUMB);
    const f = Math.min(1, Math.max(0, (x - THUMB / 2) / usable));
    const raw = min + f * (max - min);
    return Number(Math.min(max, Math.max(min, Math.round((raw - min) / step) * step + min)).toFixed(4));
  };

  // Responder props (not PanResponder) so the handlers always see the latest props.
  const onGrant = (e: GestureResponderEvent) => {
    grab.current = { x: e.nativeEvent.locationX, pageX: e.nativeEvent.pageX };
    // A tap on the current spot still counts as choosing it.
    onChange(toValue(grab.current.x));
  };
  const onMove = (e: GestureResponderEvent) => {
    const next = toValue(grab.current.x + (e.nativeEvent.pageX - grab.current.pageX));
    if (next !== value) onChange(next);
  };

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const left = width > 0 ? fraction * (width - THUMB) : 0;
  const tint = themed(color);

  return (
    <View
      style={styles.hitArea}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: isSet ? valueText(shown) : 'not set' }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const base = value ?? restAt ?? min;
        const next = e.nativeEvent.actionName === 'increment' ? base + step : base - step;
        onChange(Math.min(max, Math.max(min, Number(next.toFixed(4)))));
      }}
    >
      <View style={styles.track} pointerEvents="none">
        <View
          style={[
            styles.fill,
            { width: left + THUMB / 2, backgroundColor: isSet ? tint : withAlpha(tint, 0.18) },
          ]}
        />
        {steps <= 12 &&
          Array.from({ length: steps + 1 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.tick,
                { left: THUMB / 2 + (steps ? (i / steps) * Math.max(0, width - THUMB) : 0) - 2 },
              ]}
            />
          ))}
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            left,
            borderColor: isSet ? tint : Theme.colors.cardBorder,
            backgroundColor: isSet ? themed('#FFFFFF') : Theme.colors.backgroundMuted,
          },
        ]}
      >
        <View style={[styles.thumbDot, { backgroundColor: isSet ? tint : Theme.colors.textTertiary }]} />
      </View>
    </View>
  );
}

const styles = createStyles(() => ({
  hitArea: {
    height: 44,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.backgroundMuted,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  tick: {
    position: 'absolute',
    top: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(58, 46, 72, 0.18)',
  },
  thumb: {
    position: 'absolute',
    top: (44 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A2E48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}));
