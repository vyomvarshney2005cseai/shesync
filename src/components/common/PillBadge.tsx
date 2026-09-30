import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '@/constants/theme';

interface PillBadgeProps {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

export const PillBadge: React.FC<PillBadgeProps> = ({
  label,
  icon,
  color = Theme.colors.primary,
  bgColor = Theme.colors.primaryLight,
  style,
}) => {
  return (
    <View style={[styles.pill, { backgroundColor: bgColor }, style]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    gap: 5,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
