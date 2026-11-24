import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AlertTriangle } from 'lucide-react-native';
import { useReduceMotion } from '@/lib/motion';
import { Theme, createStyles, themed } from '@/constants/theme';

interface SOSFabProps {
  onPress: () => void;
}

export const SOSFab: React.FC<SOSFabProps> = ({ onPress }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    // No pulsing when the phone asks for reduced motion.
    if (reduceMotion) {
      scale.value = 1;
      glowOpacity.value = 0.35;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [glowOpacity, scale, reduceMotion]);

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.glowRing, animatedGlow]} />
      <Animated.View style={animatedScale}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="SOS: breathing, grounding and one-tap calls"
        >
          <AlertTriangle size={24} color={Theme.colors.onPrimary} />
          <Text style={styles.fabText}>SOS</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = createStyles(() => ({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  glowRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: Theme.colors.strainHigh,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.strainHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
}));
