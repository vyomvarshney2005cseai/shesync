import React, { useEffect, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { Sparkles } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { Button } from '@/components/ds';

const CHECK_EVERY_MS = 30 * 60_000;

/** Looks for an over-the-air fix when she comes back to the app (at most every 30 min). */
async function checkAndFetch() {
  try {
    const res = await Updates.checkForUpdateAsync();
    if (res.isAvailable) await Updates.fetchUpdateAsync();
  } catch {
    // Offline or no update server: the next launch checks again.
  }
}

function PendingUpdate() {
  const { isUpdatePending } = Updates.useUpdates();
  const [later, setLater] = useState(false);

  useEffect(() => {
    let last = Date.now();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && Date.now() - last > CHECK_EVERY_MS) {
        last = Date.now();
        void checkAndFetch();
      }
    });
    return () => sub.remove();
  }, []);

  if (!isUpdatePending || later) return null;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.banner} accessibilityRole="alert">
        <Sparkles size={16} color={themed('#FFFFFF')} />
        <Text style={styles.text}>A small fix for SheSync is ready.</Text>
        <Button variant="link" title="Later" onPress={() => setLater(true)} />
        <Button variant="primary" title="Restart" onPress={() => void Updates.reloadAsync().catch(() => {})} />
      </View>
    </View>
  );
}

/**
 * Over-the-air fixes (EAS Update). New fixes download in the background on
 * launch; this offers a one-tap restart once one is ready. Hidden in Expo Go,
 * development builds and on the web, where updates are off.
 */
export function UpdateBanner() {
  return Updates.isEnabled ? <PendingUpdate /> : null;
}

const styles = createStyles(() => ({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', paddingHorizontal: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 480,
    width: '100%',
    backgroundColor: '#2A2238',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  text: { flex: 1, fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  laterText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  restartText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
}));
