import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ShieldAlert, Sparkles } from 'lucide-react-native';
import { useReduceMotion } from '@/lib/motion';
import { Theme, createStyles, themed } from '@/constants/theme';

interface InterventionBannerProps {
  isOverride: boolean;
  strainScore: number;
  phaseLabel: string;
  note: string;
}

/**
 * Explains today's plan. Shows a warning only when the plan really was
 * adjusted, and only quotes numbers the app actually has (the strain score
 * from the user's logs). Earlier builds always showed a made-up
 * "High Cortisol 28.3 µg/dL" banner.
 */
export const InterventionBanner: React.FC<InterventionBannerProps> = ({ isOverride, strainScore, phaseLabel, note }) => {
  const pulseOpacity = useSharedValue(1);
  const slideIn = useSharedValue(-20);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    // Reduced motion: no pulsing, no slide-in.
    if (reduceMotion) {
      pulseOpacity.value = 1;
      slideIn.value = 0;
      return;
    }
    if (isOverride) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
    slideIn.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [isOverride, pulseOpacity, slideIn, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideIn.value }] }));

  const tone = isOverride ? amber : calm;

  return (
    <Animated.View style={[styles.container, { backgroundColor: themed(tone.bg), borderColor: themed(tone.border) }, slideStyle]}>
      <View style={styles.iconRow}>
        <Animated.View style={pulseStyle}>
          <View style={[styles.iconCircle, { backgroundColor: themed(tone.iconBg), borderColor: themed(tone.border) }]}>
            {isOverride ? <ShieldAlert size={22} color={themed(tone.text)} /> : <Sparkles size={22} color={themed(tone.text)} />}
          </View>
        </Animated.View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: themed(tone.title) }]}>
            {isOverride ? 'Today’s plan was adjusted' : 'Today’s plan fits your cycle'}
          </Text>
          <Text style={[styles.subtitle, { color: themed(tone.text) }]}>
            {isOverride ? 'A high-intensity session was swapped for a gentler one.' : note}
          </Text>
        </View>
      </View>
      <View style={[styles.detailRow, { borderTopColor: themed(tone.border) }]}>
        <Text style={[styles.detailLabel, { color: themed(tone.text) }]}>Strain</Text>
        <Text style={[styles.detailValue, { color: themed(tone.title) }]}>{strainScore}/100</Text>
        <View style={[styles.dot, { backgroundColor: themed(tone.text) }]} />
        <Text style={[styles.detailLabel, { color: themed(tone.text) }]} numberOfLines={1}>
          {phaseLabel}
        </Text>
      </View>
    </Animated.View>
  );
};

const amber = { bg: '#FFF7ED', border: '#FDBA74', iconBg: '#FEF3C7', title: '#92400E', text: '#B45309' };
const calm = { bg: '#ECFDF5', border: '#A7F3D0', iconBg: '#D1FAE5', title: '#065F46', text: '#047857' };

const styles = createStyles(() => ({
  container: {
    borderRadius: Theme.radius.xl,
    padding: 16,
    borderWidth: 1.5,
    marginHorizontal: 20,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textCol: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  subtitle: { fontSize: 14, fontWeight: '500', marginTop: 4, lineHeight: 20 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  detailLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 1 },
  detailValue: { fontSize: 14, fontWeight: '800' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  source: { fontSize: 14, marginTop: 8, opacity: 0.85 },
}));
