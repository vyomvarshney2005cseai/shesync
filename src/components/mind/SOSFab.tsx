import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AlertTriangle } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

interface SOSFabProps {
  onPress: () => void;
}

export const SOSFab: React.FC<SOSFabProps> = ({ onPress }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
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
  }, []);

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
        >
          <AlertTriangle size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>SOS</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    ...Theme.shadows.glowing,
  },
  fabText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
});
