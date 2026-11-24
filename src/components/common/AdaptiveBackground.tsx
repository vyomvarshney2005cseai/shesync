import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useAppStore } from '@/store/useAppStore';
import type { AppState } from '@/types';
import { Theme, createStyles, isNight } from '@/constants/theme';

interface AdaptiveBackgroundProps {
  children: React.ReactNode;
}

// A calm, flat page (the token background) with one faint glow in the
// corner. Harder days shift the glow from blush to lavender and sky — never
// to anything alarming. Text always sits on the flat colour, so contrast
// is the same on every day.
const GLOWS = [
  { light: '#F9DDEA', dark: '#3A2236' }, // light day: blush
  { light: '#E9E0FA', dark: '#2A2647' }, // steady day: lilac
  { light: '#DDEBF7', dark: '#142C3A' }, // hard day: sky
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
  // Re-renders only when the glow actually changes, not on every log.
  const index = useAppStore(paletteIndex);
  const glow = isNight() ? GLOWS[index].dark : GLOWS[index].light;
  // Unique gradient ids: several screens can be mounted at once (stack), and
  // duplicate SVG ids would make them share one gradient on web.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gid = `glow-${uid}`;

  return (
    <View style={styles.container}>
      <View style={styles.glow} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id={gid} cx="85%" cy="0%" r="75%">
              <Stop offset="0%" stopColor={glow} stopOpacity={isNight() ? 0.55 : 0.75} />
              <Stop offset="100%" stopColor={glow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gid})`} />
        </Svg>
      </View>
      <View style={styles.contentWrap}>{children}</View>
    </View>
  );
}

const styles = createStyles(() => ({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: Theme.colors.background,
    width: '100%',
  },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  contentWrap: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
}));
