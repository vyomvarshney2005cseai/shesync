import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { useNativeFocus, type PressState } from './interaction';

/** A tickable row (checklists, "remember me"): 44pt tall, the whole row toggles. */
export function CheckRow({
  label,
  detail,
  checked,
  onToggle,
  testID,
  style,
  children,
}: {
  label?: string;
  detail?: string;
  checked: boolean;
  onToggle: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  /** Custom content instead of label/detail. */
  children?: React.ReactNode;
}) {
  const [focused, focusHandlers] = useNativeFocus();
  return (
    <Pressable
      onPress={onToggle}
      {...focusHandlers}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label ? (detail ? `${label}. ${detail}` : label) : undefined}
      testID={testID}
      style={(state: PressState) => [styles.row, state.hovered && styles.hovered, state.pressed && styles.pressed, focused && styles.focused, style]}
    >
      <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Check size={16} color={Theme.colors.onPrimary} /> : null}</View>
      {children ?? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, checked && styles.labelDone]}>{label}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = createStyles(() => ({
  row: { minHeight: Theme.touch, flexDirection: 'row', alignItems: 'center', gap: Theme.space.sm, paddingVertical: Theme.space.xxs, borderRadius: Theme.radius.sm },
  hovered: { backgroundColor: Theme.colors.backgroundAlt },
  pressed: { opacity: 0.85 },
  focused: { borderWidth: 2, borderColor: Theme.colors.focusRing },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.card,
  },
  boxOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  label: { ...Theme.type.bodySm, color: Theme.colors.textPrimary },
  labelDone: { color: Theme.colors.textSecondary },
  detail: { ...Theme.type.caption, fontWeight: '400', color: Theme.colors.textSecondary, marginTop: 2 },
}));
