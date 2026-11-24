import React from 'react';
import { Pressable, View, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import { Theme, createStyles } from '@/constants/theme';
import { PressFeedbackContext, usePressFeedback } from './PressFeedback';
import { useNativeFocus, type PressState } from './interaction';

export type CardTone =
  | 'default'
  | 'muted'
  | 'rose'
  | 'lilac'
  | 'mint'
  | 'amber'
  | 'sky'
  | 'danger'
  | 'inverse'
  /** Older names, kept so existing screens read the same. */
  | 'dark';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * The one card. A surface with a 1px border (no drop shadow), 16pt radius
 * and padding from the spacing scale. Give it `onPress` and it becomes a
 * pressable card with hover, pressed and keyboard-focus states.
 */
export function Card({
  children,
  style,
  tone = 'default',
  padding = 'md',
  onPress,
  onLongPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  testID,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: CardTone;
  padding?: CardPadding;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean; expanded?: boolean };
  testID?: string;
}) {
  const [signal, bump] = usePressFeedback();
  const [focused, focusHandlers] = useNativeFocus();
  const base = [styles.card, tones[tone === 'dark' ? 'inverse' : tone], pads[padding]];

  if (!onPress && !onLongPress) {
    return (
      <View style={[base, style]} testID={testID} accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityRole}>
        {children}
      </View>
    );
  }

  return (
    <PressFeedbackContext.Provider value={signal}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        onPressIn={bump}
        onHoverIn={bump}
        {...focusHandlers}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
        testID={testID}
        style={(state: PressState) => [
          base,
          styles.pressable,
          state.hovered && !disabled && styles.hovered,
          state.pressed && !disabled && styles.pressed,
          focused && styles.focused,
          disabled && styles.disabled,
          style,
        ]}
      >
        {children}
      </Pressable>
    </PressFeedbackContext.Provider>
  );
}

const styles = createStyles(() => ({
  card: {
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressable: { minHeight: Theme.touch },
  hovered: { borderColor: Theme.colors.borderStrong },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  focused: { borderColor: Theme.colors.focusRing, borderWidth: 2 },
  disabled: { opacity: 0.55 },
}));

const tones = createStyles(() => ({
  default: { backgroundColor: Theme.colors.card, borderColor: Theme.colors.cardBorder },
  muted: { backgroundColor: Theme.colors.backgroundMuted, borderColor: Theme.colors.cardBorderLight },
  rose: { backgroundColor: Theme.colors.primaryLight, borderColor: '#F3D3E2' },
  lilac: { backgroundColor: Theme.colors.secondaryLight, borderColor: Theme.colors.secondaryBorder },
  mint: { backgroundColor: Theme.colors.successLight, borderColor: '#C6E6D8' },
  amber: { backgroundColor: Theme.colors.warningLight, borderColor: '#F2DDB0' },
  sky: { backgroundColor: Theme.colors.infoLight, borderColor: '#C9E0EA' },
  danger: { backgroundColor: Theme.colors.dangerLight, borderColor: '#F5C9C6' },
  inverse: { backgroundColor: Theme.colors.obsidian, borderColor: Theme.colors.obsidian },
}));

const pads = createStyles(() => ({
  none: { padding: 0 },
  sm: { padding: Theme.space.sm },
  md: { padding: Theme.space.md },
  lg: { padding: Theme.space.lg },
}));
