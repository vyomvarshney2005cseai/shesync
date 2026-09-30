import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'alert' | 'lilac' | 'dark';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: Theme.colors.card,
      borderColor: Theme.colors.cardBorder,
    },
    alert: {
      backgroundColor: '#FFF7ED',
      borderColor: '#FDBA74',
    },
    lilac: {
      backgroundColor: Theme.colors.secondaryLight,
      borderColor: Theme.colors.secondaryBorder,
    },
    dark: {
      backgroundColor: Theme.colors.obsidian,
      borderColor: 'rgba(255,255,255,0.1)',
    },
  };

  return (
    <View style={[styles.card, variantStyles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    ...Theme.shadows.card,
  },
});
