import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ShieldAlert, Sparkles } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

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

  useEffect(() => {
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
  }, [isOverride, pulseOpacity, slideIn]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideIn.value }] }));

  const tone = isOverride ? amber : calm;

  return (
    <Animated.View style={[styles.container, { backgroundColor: tone.bg, borderColor: tone.border }, slideStyle]}>
      <View style={styles.iconRow}>
        <Animated.View style={pulseStyle}>
          <View style={[styles.iconCircle, { backgroundColor: tone.iconBg, borderColor: tone.border }]}>
            {isOverride ? <ShieldAlert size={22} color={tone.text} /> : <Sparkles size={22} color={tone.text} />}
          </View>
        </Animated.View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: tone.title }]}>
            {isOverride ? 'Today’s plan was adjusted' : 'Today’s plan fits your cycle'}
          </Text>
          <Text style={[styles.subtitle, { color: tone.text }]}>
            {isOverride ? 'A high-intensity session was swapped for a gentler one.' : note}
          </Text>
        </View>
      </View>
      <View style={[styles.detailRow, { borderTopColor: tone.border }]}>
        <Text style={[styles.detailLabel, { color: tone.text }]}>Strain</Text>
        <Text style={[styles.detailValue, { color: tone.title }]}>{strainScore}/100</Text>
        <View style={[styles.dot, { backgroundColor: tone.text }]} />
        <Text style={[styles.detailLabel, { color: tone.text }]} numberOfLines={1}>
          {phaseLabel}
        </Text>
      </View>
      <Text style={[styles.source, { color: tone.text }]}>Based on the pain, flow, mood and sleep you logged.</Text>
    </Animated.View>
  );
};

const amber = { bg: '#FFF7ED', border: '#FDBA74', iconBg: '#FEF3C7', title: '#92400E', text: '#B45309' };
const calm = { bg: '#ECFDF5', border: '#A7F3D0', iconBg: '#D1FAE5', title: '#065F46', text: '#047857' };

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.radius.xl,
    padding: 16,
    borderWidth: 1.5,
    marginHorizontal: 20,
    ...Theme.shadows.soft,
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
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2, lineHeight: 18 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  detailLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 1 },
  detailValue: { fontSize: 12, fontWeight: '800' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  source: { fontSize: 11, marginTop: 6, opacity: 0.85 },
});
