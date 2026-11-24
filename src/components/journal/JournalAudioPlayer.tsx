import React from 'react';
import { View, Text } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Play, Pause } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { formatClock } from '@/lib/dates';
import { Button } from '@/components/ds';

/** Play / pause a journal recording, with a progress bar. */
export function JournalAudioPlayer({ uri, compact }: { uri: string; compact?: boolean }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;
  const progress = duration > 0 ? Math.min(1, status.currentTime / duration) : 0;

  const toggle = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    // The speech recogniser may have left the audio session in record mode.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    if (status.didJustFinish || (duration > 0 && status.currentTime >= duration - 0.05)) await player.seekTo(0);
    player.play();
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Button
        size="sm"
        iconOnly
        onPress={toggle}
        accessibilityLabel={status.playing ? 'Pause recording' : 'Play recording'}
        icon={status.playing ? <Pause size={20} color={Theme.colors.onPrimary} /> : <Play size={20} color={Theme.colors.onPrimary} />}
        style={styles.btn}
      />
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.time}>
        {formatClock(Math.round(status.playing || status.currentTime > 0 ? status.currentTime : duration))}
      </Text>
    </View>
  );
}

const styles = createStyles(() => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.full,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  wrapCompact: { paddingVertical: 4, paddingLeft: 4 },
  btn: {
  },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Theme.colors.backgroundMuted, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: Theme.colors.primary },
  time: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary, minWidth: 36, textAlign: 'right' },
}));
