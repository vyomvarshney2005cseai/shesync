import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface StrainGaugeProps {
  score: number; // 0-100
  level: string;
}

const SIZE = 200;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const StrainGauge: React.FC<StrainGaugeProps> = ({ score, level }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1400,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const getColor = () => {
    if (score >= 75) return Theme.colors.strainHigh;
    if (score >= 50) return Theme.colors.strainAmber;
    return Theme.colors.strainOptimal;
  };

  const getGlow = () => {
    if (score >= 75) return 'rgba(244, 63, 94, 0.15)';
    if (score >= 50) return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(16, 185, 129, 0.15)';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.glowRing, { backgroundColor: getGlow() }]}>
        <View style={styles.gaugeWrap}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Defs>
              <LinearGradient id="strainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={Theme.colors.strainAmber} />
                <Stop offset="100%" stopColor={Theme.colors.strainHigh} />
              </LinearGradient>
            </Defs>
            {/* Background track */}
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={Theme.colors.backgroundMuted}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Animated progress arc */}
            <G transform={`rotate(-90, ${SIZE / 2}, ${SIZE / 2})`}>
              <AnimatedCircle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke="url(#strainGrad)"
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE}`}
                strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, score)) / 100)}
                animatedProps={animatedProps}
              />
            </G>
          </Svg>
          {/* Center label overlay */}
          <View style={styles.centerLabel}>
            <Text style={[styles.scoreText, { color: getColor() }]}>{score}%</Text>
            <Text style={styles.levelText}>Daily Strain</Text>
            <View style={[styles.levelPill, { backgroundColor: getGlow() }]}>
              <Text style={[styles.levelPillText, { color: getColor() }]}>
                {level.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  glowRing: {
    width: SIZE + 32,
    height: SIZE + 32,
    borderRadius: (SIZE + 32) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  levelPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
