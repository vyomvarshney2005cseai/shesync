import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'rose' | 'dark' | 'outline' | 'lilac';
  icon?: React.ReactNode;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'rose',
  icon,
  loading = false,
  style,
  fullWidth = false,
}) => {
  const variantStyles: Record<string, { bg: string; text: string; border?: string }> = {
    rose: { bg: Theme.colors.primary, text: '#FFFFFF' },
    dark: { bg: Theme.colors.obsidian, text: '#FFFFFF' },
    outline: { bg: 'transparent', text: Theme.colors.textPrimary, border: Theme.colors.cardBorder },
    lilac: { bg: Theme.colors.secondary, text: '#FFFFFF' },
  };

  const v = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg },
        v.border ? { borderWidth: 1.5, borderColor: v.border } : null,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: v.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.lg,
    gap: 8,
    maxWidth: '100%',
    ...Theme.shadows.soft,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    flexShrink: 1,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
