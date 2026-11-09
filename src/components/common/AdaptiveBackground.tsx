import React, { useId } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useAppStore } from '@/store/useAppStore';
import type { AppState } from '@/types';

interface AdaptiveBackgroundProps {
  children: React.ReactNode;
}

// Calm palettes only. Harder days shift towards soothing lavender and sky
// (earlier builds turned the whole screen crimson/magenta on high-strain
// days — exactly when she most needs a calm screen).
const PALETTES = [
  {
    // Light day: blush, peach & lavender
    gradStart: '#FFF8FA', gradMid: '#FFEEF4', gradEnd: '#FBE6EF',
    blob1Color: '#EFE6FD', blob1Opacity: 0.7,
    blob2Color: '#FFEBDC', blob2Opacity: 0.55,
    blob3Color: '#FCE4EE', blob3Opacity: 0.7,
    overlayTint: 'rgba(255, 255, 255, 0.32)',
  },
  {
    // Steady day: rose fading into lilac
    gradStart: '#FFF3F7', gradMid: '#F8E9F4', gradEnd: '#EEE2F8',
    blob1Color: '#E6DAFA', blob1Opacity: 0.7,
    blob2Color: '#FDE6DA', blob2Opacity: 0.5,
    blob3Color: '#F7DCEA', blob3Opacity: 0.6,
    overlayTint: 'rgba(255, 255, 255, 0.34)',
  },
  {
    // Hard day: soothing lavender & sky
    gradStart: '#F8F3FC', gradMid: '#EFE8FA', gradEnd: '#E6ECF8',
    blob1Color: '#DCD0F7', blob1Opacity: 0.65,
    blob2Color: '#DDEDF7', blob2Opacity: 0.6,
    blob3Color: '#F4DEEB', blob3Opacity: 0.5,
    overlayTint: 'rgba(255, 255, 255, 0.36)',
  },
] as const;

/** 0 = light, 1 = steady, 2 = hard day — from strain and the latest mood. */
function paletteIndex(s: AppState): number {
  const mood = s.symptomLogs[0]?.mood;
  const strain = s.biometrics.strainScore;
  // Mood 5 -> 15 (light), mood 1 -> 87 (hard); averaged with strain.
  const effective = mood !== undefined ? Math.round(strain * 0.5 + (105 - mood * 18) * 0.5) : strain;
  return effective <= 35 ? 0 : effective <= 68 ? 1 : 2;
}

export function AdaptiveBackground({ children }: AdaptiveBackgroundProps) {
  // Re-renders only when the palette actually changes, not on every log.
  const palette = PALETTES[useAppStore(paletteIndex)];
  // Unique gradient ids: several screens can be mounted at once (stack), and
  // duplicate SVG ids would make them share one gradient on web.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `${name}-${uid}`;

  return (
    <View style={styles.container}>
      {/* Absolute Translucent Multi-Color SVG Backdrop */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            {/* Primary Multi-Color Linear Gradient */}
            <LinearGradient id={id('bg')} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={palette.gradStart} stopOpacity="1" />
              <Stop offset="50%" stopColor={palette.gradMid} stopOpacity="1" />
              <Stop offset="100%" stopColor={palette.gradEnd} stopOpacity="1" />
            </LinearGradient>

            {/* Radial Blob 1 (Top Right — Lavender/Lilac/Plum) */}
            <RadialGradient id={id('b1')} cx="80%" cy="15%" r="65%">
              <Stop offset="0%" stopColor={palette.blob1Color} stopOpacity={palette.blob1Opacity} />
              <Stop offset="100%" stopColor={palette.blob1Color} stopOpacity="0" />
            </RadialGradient>

            {/* Radial Blob 2 (Center Left — Peach/Violet/Coral) */}
            <RadialGradient id={id('b2')} cx="15%" cy="55%" r="60%">
              <Stop offset="0%" stopColor={palette.blob2Color} stopOpacity={palette.blob2Opacity} />
              <Stop offset="100%" stopColor={palette.blob2Color} stopOpacity="0" />
            </RadialGradient>

            {/* Radial Blob 3 (Bottom Center — Rose Petal/Magenta) */}
            <RadialGradient id={id('b3')} cx="70%" cy="85%" r="65%">
              <Stop offset="0%" stopColor={palette.blob3Color} stopOpacity={palette.blob3Opacity} />
              <Stop offset="100%" stopColor={palette.blob3Color} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Base Mesh */}
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id('bg')})`} />

          {/* Glowing Translucent Accent Blooms */}
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id('b1')})`} />
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id('b2')})`} />
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id('b3')})`} />
        </Svg>
      </View>

      {/* Soft white veil keeps text readable over the gradient. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.overlayTint }]} pointerEvents="none" />

      {/* Screen Tree Content */}
      <View style={styles.contentWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFF5F8',
    width: '100%',
  },
  contentWrap: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
});
