import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { useAppStore } from '@/store/useAppStore';

interface AdaptiveBackgroundProps {
  children: React.ReactNode;
}

export function AdaptiveBackground({ children }: AdaptiveBackgroundProps) {
  const strainScore = useAppStore((s) => s.biometrics.strainScore);
  const latestLog = useAppStore((s) => s.symptomLogs[0]);
  const latestMood = latestLog?.mood;

  // Compute effective strain percentage (0-100)
  const effectiveStrain = useMemo(() => {
    if (latestMood !== undefined) {
      // Mood 5 -> 15% (light pink), Mood 1 -> 90% (dark pink)
      const moodStrain = 105 - latestMood * 18;
      // Weighted average with biometric strain score
      return Math.round(strainScore * 0.5 + moodStrain * 0.5);
    }
    return strainScore;
  }, [strainScore, latestMood]);

  // Interpolate / select color palettes based on strain (0 = light pink, 100 = dark pink)
  const palette = useMemo(() => {
    if (effectiveStrain <= 35) {
      // ─── Light Pink / Ethereal Radiant Zone ───
      return {
        mode: 'light',
        gradStart: '#FFF5F8',
        gradMid: '#FFE4EE',
        gradEnd: '#FFD6E5',
        blob1Color: '#F3E8FF', // Soft somatic lavender
        blob1Opacity: 0.65,
        blob2Color: '#FEF3C7', // Gentle warm sunlight peach
        blob2Opacity: 0.5,
        blob3Color: '#FCE7F3', // Soft rose petal
        blob3Opacity: 0.7,
        overlayTint: 'rgba(255, 255, 255, 0.35)',
        statusLabel: 'Light Rose Glow • Low Strain',
      };
    } else if (effectiveStrain <= 68) {
      // ─── Mid Pink / Warm Vibrant Rose Zone ───
      return {
        mode: 'mid',
        gradStart: '#FED7E2',
        gradMid: '#FBCFE8',
        gradEnd: '#F472B6',
        blob1Color: '#FDA4AF', // Warm coral rose
        blob1Opacity: 0.75,
        blob2Color: '#DDD6FE', // Somatic lilac
        blob2Opacity: 0.6,
        blob3Color: '#FB7185', // Radiant rose
        blob3Opacity: 0.65,
        overlayTint: 'rgba(255, 240, 245, 0.25)',
        statusLabel: 'Warm Rose Quartz • Steady Phase',
      };
    } else {
      // ─── Dark Pink / Deep Berry Crimson Zone ───
      return {
        mode: 'dark',
        gradStart: '#FB7185',
        gradMid: '#F43F5E',
        gradEnd: '#BE185D',
        blob1Color: '#9D174D', // Deep midnight magenta
        blob1Opacity: 0.8,
        blob2Color: '#C084FC', // Electrified mauve violet
        blob2Opacity: 0.55,
        blob3Color: '#E11D48', // Intense deep crimson rose
        blob3Opacity: 0.75,
        overlayTint: 'rgba(244, 63, 94, 0.15)',
        statusLabel: 'Deep Magenta Aura • High Strain',
      };
    }
  }, [effectiveStrain]);

  return (
    <View style={styles.container}>
      {/* Absolute Translucent Multi-Color SVG Backdrop */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            {/* Primary Multi-Color Linear Gradient */}
            <LinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={palette.gradStart} stopOpacity="1" />
              <Stop offset="50%" stopColor={palette.gradMid} stopOpacity="1" />
              <Stop offset="100%" stopColor={palette.gradEnd} stopOpacity="1" />
            </LinearGradient>

            {/* Radial Blob 1 (Top Right — Lavender/Lilac/Plum) */}
            <RadialGradient id="blob1" cx="80%" cy="15%" r="65%">
              <Stop offset="0%" stopColor={palette.blob1Color} stopOpacity={palette.blob1Opacity} />
              <Stop offset="100%" stopColor={palette.blob1Color} stopOpacity="0" />
            </RadialGradient>

            {/* Radial Blob 2 (Center Left — Peach/Violet/Coral) */}
            <RadialGradient id="blob2" cx="15%" cy="55%" r="60%">
              <Stop offset="0%" stopColor={palette.blob2Color} stopOpacity={palette.blob2Opacity} />
              <Stop offset="100%" stopColor={palette.blob2Color} stopOpacity="0" />
            </RadialGradient>

            {/* Radial Blob 3 (Bottom Center — Rose Petal/Magenta) */}
            <RadialGradient id="blob3" cx="70%" cy="85%" r="65%">
              <Stop offset="0%" stopColor={palette.blob3Color} stopOpacity={palette.blob3Opacity} />
              <Stop offset="100%" stopColor={palette.blob3Color} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Base Mesh */}
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />

          {/* Glowing Translucent Accent Blooms */}
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#blob1)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#blob2)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#blob3)" />
        </Svg>
      </View>

      {/* Subtle Frosted Translucent Glass Veil */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: palette.overlayTint,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                } as any)
              : {}),
          },
        ]}
        pointerEvents="none"
      />

      {/* Screen Tree Content */}
      <View style={styles.contentWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFEBF2',
    width: '100%',
  },
  contentWrap: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
});
