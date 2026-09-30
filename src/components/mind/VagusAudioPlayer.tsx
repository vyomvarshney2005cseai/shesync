import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Play, Pause, Radio } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import type { TherapySession } from '@/types';

interface VagusAudioPlayerProps {
  session: TherapySession;
  onTogglePlay: () => void;
}

export const VagusAudioPlayer: React.FC<VagusAudioPlayerProps> = ({
  session,
  onTogglePlay,
}) => {
  const waveAnim = useSharedValue(0);

  useEffect(() => {
    if (session.isPlaying) {
      waveAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      waveAnim.value = withTiming(0, { duration: 300 });
    }
  }, [session.isPlaying]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + waveAnim.value * 0.6,
  }));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const elapsed = session.progress * session.durationSeconds;
  const progressPercent = session.progress * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Animated.View style={waveStyle}>
            <Radio size={20} color={Theme.colors.secondary} />
          </Animated.View>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.typeLabel}>SOMATIC THERAPY</Text>
          <Text style={styles.title}>{session.title}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{session.description}</Text>

      {/* Audio Player UI */}
      <View style={styles.playerWrap}>
        {/* Play/Pause button */}
        <Pressable
          onPress={onTogglePlay}
          style={({ pressed }) => [styles.playBtn, pressed && styles.pressed]}
        >
          {session.isPlaying ? (
            <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
          )}
        </Pressable>

        {/* Progress bar & time */}
        <View style={styles.progressCol}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${Math.max(progressPercent, 2)}%` }]}
            />
            <View
              style={[
                styles.progressThumb,
                { left: `${Math.min(progressPercent, 98)}%` },
              ]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
            <Text style={styles.timeText}>{formatTime(session.durationSeconds)}</Text>
          </View>
        </View>
      </View>

      {/* Wave bars visualization */}
      <View style={styles.waveRow}>
        {Array.from({ length: 32 }).map((_, i) => {
          const height = session.isPlaying
            ? 8 + Math.sin(i * 0.7 + elapsed * 0.3) * 14
            : 4 + Math.sin(i * 0.5) * 3;
          return (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: Math.max(height, 3),
                  backgroundColor: session.isPlaying
                    ? Theme.colors.secondary
                    : Theme.colors.secondaryBorder,
                  opacity: session.isPlaying ? 0.5 + Math.random() * 0.5 : 0.3,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.secondaryBorder,
    ...Theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.secondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: Theme.colors.textSecondary,
    marginBottom: 16,
  },
  playerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  progressCol: {
    flex: 1,
  },
  progressTrack: {
    height: 5,
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.secondary,
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Theme.colors.secondary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Theme.shadows.soft,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textTertiary,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 28,
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
});
