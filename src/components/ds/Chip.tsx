import React from 'react';
import { Pressable, Text, View, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import { Theme, createStyles, withAlpha, themed } from '@/constants/theme';
import { useNativeFocus, type PressState } from './interaction';

/**
 * The one selectable pill (choices, filters, tags). 44pt tall, so it is easy
 * to hit; the selected state is filled, not just tinted, so it reads at a glance.
 */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  color,
  small,
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
  testID,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  /** Fill for the selected state (defaults to the accent). Must carry white text in light mode. */
  color?: string;
  small?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, focusHandlers] = useNativeFocus();
  // Custom colours follow light/dark mode too; text on them is onPrimary (≥ 4.5:1 for the tokens used).
  const fill = color ? themed(color) : Theme.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      {...focusHandlers}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected: !!selected, checked: accessibilityRole === 'radio' || accessibilityRole === 'checkbox' ? !!selected : undefined, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={(state: PressState) => [
        styles.chip,
        small && styles.small,
        selected ? { backgroundColor: fill, borderColor: fill } : null,
        state.hovered && !selected && !disabled && styles.hovered,
        state.pressed && !disabled && { backgroundColor: selected ? fill : withAlpha(fill, 0.1) },
        focused && styles.focused,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <View>{icon}</View> : null}
      <Text style={[styles.text, selected && styles.textSelected]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = createStyles(() => ({
  chip: {
    minHeight: Theme.touch,
    minWidth: Theme.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.space.xs,
    paddingHorizontal: Theme.space.md,
    paddingVertical: Theme.space.xxs,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  small: { paddingHorizontal: Theme.space.sm },
  hovered: { borderColor: Theme.colors.borderStrong, backgroundColor: Theme.colors.backgroundAlt },
  focused: { borderColor: Theme.colors.focusRing, borderWidth: 2 },
  disabled: { opacity: 0.5 },
  text: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: Theme.colors.textPrimary, textAlign: 'center' },
  textSelected: { color: Theme.colors.onPrimary, fontWeight: '700' },
}));
