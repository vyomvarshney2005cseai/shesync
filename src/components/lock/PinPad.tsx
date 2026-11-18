import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Platform, Animated } from 'react-native';
import { Delete, ScanFace } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';

interface PinPadProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  /** Called once all digits are entered. */
  onComplete: (pin: string) => void;
  disabled?: boolean;
  /** Bumped by the parent after a wrong PIN to shake the dots. */
  errorKey?: number;
  /** Shows a fingerprint / Face ID key in the bottom-left. */
  biometricLabel?: string;
  onBiometric?: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Number pad with PIN dots. On the web, the keyboard's digits and Backspace work too. */
export function PinPad({
  length,
  value,
  onChange,
  onComplete,
  disabled,
  errorKey = 0,
  biometricLabel,
  onBiometric,
}: PinPadProps) {
  const [shake] = useState(() => new Animated.Value(0));
  const live = useRef({ value, disabled, length, onChange, onComplete });
  useEffect(() => {
    live.current = { value, disabled, length, onChange, onComplete };
  }, [value, disabled, length, onChange, onComplete]);

  useEffect(() => {
    if (!errorKey) return;
    Animated.sequence(
      [10, -10, 8, -8, 0].map((toValue) => Animated.timing(shake, { toValue, duration: 55, useNativeDriver: Platform.OS !== 'web' }))
    ).start();
  }, [errorKey, shake]);

  const press = (digit: string) => {
    const s = live.current;
    if (s.disabled || s.value.length >= s.length) return;
    const next = s.value + digit;
    s.onChange(next);
    if (next.length === s.length) s.onComplete(next);
  };
  const back = () => {
    const s = live.current;
    if (!s.disabled) s.onChange(s.value.slice(0, -1));
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // press/back read the latest props from `live`.
  }, []);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]} accessibilityLabel={`${value.length} of ${length} digits entered`}>
        {Array.from({ length }, (_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotOn]} />
        ))}
      </Animated.View>

      <View style={styles.grid}>
        {KEYS.map((k) => (
          <Key key={k} label={k} onPress={() => press(k)} disabled={disabled} />
        ))}
        {biometricLabel && onBiometric ? (
          <Pressable
            onPress={onBiometric}
            style={({ pressed }) => [styles.key, styles.keyGhost, pressed && styles.keyPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Use ${biometricLabel}`}
          >
            <ScanFace size={26} color={Theme.colors.primaryDark} />
          </Pressable>
        ) : (
          <View style={[styles.key, styles.keyEmpty]} />
        )}
        <Key label="0" onPress={() => press('0')} disabled={disabled} />
        <Pressable
          onPress={back}
          style={({ pressed }) => [styles.key, styles.keyGhost, pressed && styles.keyPressed]}
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <Delete size={24} color={Theme.colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

function Key({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed, disabled && styles.keyDisabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.keyText}>{label}</Text>
    </Pressable>
  );
}

const styles = createStyles(() => ({
  wrap: { alignItems: 'center', width: '100%' },
  dots: { flexDirection: 'row', gap: 14, marginBottom: 28, height: 18, alignItems: 'center' },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    backgroundColor: 'transparent',
  },
  dotOn: { backgroundColor: Theme.colors.primary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 282,
    gap: 18,
  },
  key: {
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  keyGhost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyPressed: { backgroundColor: Theme.colors.primaryLight },
  keyDisabled: { opacity: 0.4 },
  keyText: { fontSize: 28, fontWeight: '600', color: Theme.colors.textPrimary },
}));
