import React from 'react';
import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Theme, createStyles } from '@/constants/theme';
import { PressFeedbackContext, usePressFeedback } from './PressFeedback';
import { useNativeFocus, type PressState } from './interaction';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Common = {
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shown before the title (or alone, with `iconOnly`). */
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Busy: the button is disabled and announced as busy; no spinner. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityHint?: string;
  /** Extra state for toggles that open something (e.g. expanded). */
  accessibilityState?: { expanded?: boolean; selected?: boolean; checked?: boolean };
};

type Props =
  | (Common & { title: string; iconOnly?: false; accessibilityLabel?: string })
  | (Common & { title?: string; iconOnly: true; accessibilityLabel: string });

const HEIGHT: Record<ButtonSize, number> = { sm: 44, md: 48, lg: 56 };

/**
 * The one button.
 *   primary   — the main action on a screen (filled accent)
 *   secondary — other actions (outlined)
 *   tertiary  — low-emphasis actions (accent text, tinted on hover)
 *   danger    — destructive actions
 *   link      — inline text actions ("Skip for now"), still 44pt tall
 * Every size is at least 44 × 44pt, with hover, pressed, disabled and
 * keyboard-focus states.
 */
export function Button(props: Props) {
  const {
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    loading,
    disabled,
    fullWidth,
    style,
    textStyle,
    testID,
    accessibilityHint,
    accessibilityState,
  } = props;
  const iconOnly = props.iconOnly === true;
  const [signal, bump] = usePressFeedback();
  const [focused, focusHandlers] = useNativeFocus();
  const off = !!disabled || !!loading;
  const v = variants[variant];
  const t = labels[variant];

  return (
    <PressFeedbackContext.Provider value={signal}>
      <Pressable
        onPress={onPress}
        disabled={off}
        onPressIn={bump}
        onHoverIn={bump}
        {...focusHandlers}
        accessibilityRole={variant === 'link' ? 'link' : 'button'}
        accessibilityLabel={props.accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: off, busy: !!loading, ...accessibilityState }}
        testID={testID}
        hitSlop={variant === 'link' ? 4 : undefined}
        style={(state: PressState) => [
          styles.base,
          { minHeight: HEIGHT[size] },
          iconOnly && { width: HEIGHT[size], paddingHorizontal: 0 },
          size === 'lg' && styles.large,
          v,
          fullWidth && styles.fullWidth,
          state.hovered && !off && hovers[variant],
          state.pressed && !off && [presses[variant], styles.pressed],
          focused && styles.focused,
          off && (variant === 'link' || variant === 'tertiary' ? styles.disabledQuiet : styles.disabled),
          style,
          // Never smaller than a 44pt target, whatever a screen's style says.
          styles.minTarget,
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        {!iconOnly && title ? (
          <Text
            style={[styles.label, size === 'sm' && styles.labelSmall, t, off && styles.labelDisabled, variant === 'link' && styles.linkText, textStyle]}
            numberOfLines={2}
          >
            {loading ? `${title.replace(/…$/, '')}…` : title}
          </Text>
        ) : null}
        {iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
      </Pressable>
    </PressFeedbackContext.Provider>
  );
}

const styles = createStyles(() => ({
  minTarget: { minWidth: Theme.touch, minHeight: Theme.touch },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.space.xs,
    paddingHorizontal: Theme.space.md,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    maxWidth: '100%',
  },
  large: { paddingHorizontal: Theme.space.lg, borderRadius: Theme.radius.lg },
  fullWidth: { alignSelf: 'stretch' },
  icon: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, lineHeight: 22, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  labelSmall: { fontSize: 14, lineHeight: 20 },
  linkText: { textDecorationLine: 'underline', fontWeight: '600' },
  labelDisabled: { color: Theme.colors.textTertiary },
  pressed: { transform: [{ scale: 0.98 }] },
  focused: { borderColor: Theme.colors.focusRing, borderWidth: 2 },
  disabled: { backgroundColor: Theme.colors.backgroundMuted, borderColor: Theme.colors.backgroundMuted },
  disabledQuiet: { opacity: 0.6 },
}));

const variants = createStyles(() => ({
  primary: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  secondary: { backgroundColor: Theme.colors.card, borderColor: Theme.colors.borderStrong },
  tertiary: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Theme.colors.dangerLight, borderColor: Theme.colors.dangerLight },
  link: { backgroundColor: 'transparent', paddingHorizontal: Theme.space.xs, alignSelf: 'flex-start' },
}));

const hovers = createStyles(() => ({
  primary: { backgroundColor: Theme.colors.primaryDark, borderColor: Theme.colors.primaryDark },
  secondary: { backgroundColor: Theme.colors.backgroundAlt },
  tertiary: { backgroundColor: Theme.colors.primaryLight },
  danger: { borderColor: Theme.colors.danger },
  link: { opacity: 0.85 },
}));

const presses = createStyles(() => ({
  primary: { backgroundColor: Theme.colors.primaryDark, borderColor: Theme.colors.primaryDark },
  secondary: { backgroundColor: Theme.colors.backgroundMuted },
  tertiary: { backgroundColor: Theme.colors.primaryLight },
  danger: { borderColor: Theme.colors.danger },
  link: { opacity: 0.7 },
}));

const labels = createStyles(() => ({
  primary: { color: Theme.colors.onPrimary },
  secondary: { color: Theme.colors.textPrimary },
  tertiary: { color: Theme.colors.primaryDark },
  danger: { color: Theme.colors.danger },
  link: { color: Theme.colors.primaryDark },
}));
