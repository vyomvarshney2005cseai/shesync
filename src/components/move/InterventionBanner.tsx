import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ShieldAlert } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

export const InterventionBanner: React.FC = () => {
  const pulseOpacity = useSharedValue(1);
  const slideIn = useSharedValue(-20);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    slideIn.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideIn.value }],
  }));

  return (
    <Animated.View style={[styles.container, slideStyle]}>
      <View style={styles.iconRow}>
        <Animated.View style={pulseStyle}>
          <View style={styles.iconCircle}>
            <ShieldAlert size={22} color="#B45309" />
          </View>
        </Animated.View>
        <View style={styles.textCol}>
          <Text style={styles.title}>⚠️ High Cortisol Detected</Text>
          <Text style={styles.subtitle}>
            Your scheduled HIIT workout has been overridden.
          </Text>
        </View>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Cortisol</Text>
        <Text style={styles.detailValue}>28.3 µg/dL</Text>
        <View style={styles.dot} />
        <Text style={styles.detailLabel}>Normal</Text>
        <Text style={styles.detailValue}>10–20 µg/dL</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF7ED',
    borderRadius: Theme.radius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    marginHorizontal: 20,
    ...Theme.shadows.soft,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B45309',
    marginTop: 2,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D97706',
  },
});
