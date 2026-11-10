import "../global.css";
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Platform } from 'react-native';
import { Theme, createStyles, setThemeMode } from '@/constants/theme';
import { useStoresHydrated } from '@/store/hydration';
import { startCloudSync } from '@/lib/sync';
import { useNightActive } from '@/store/useSettingsStore';

// Keep the splash visible until saved data has loaded from the device.
// The navigator always renders (expo-router requires it on first render);
// each screen waits for hydration before deciding where to send the user.
SplashScreen.preventAutoHideAsync().catch(() => {});

const sheet = { headerShown: false, animation: 'slide_from_bottom' } as const;
const push = { headerShown: false, animation: 'slide_from_right' } as const;

export default function RootLayout() {
  const hydrated = useStoresHydrated();
  const night = useNightActive();
  // Set before any screen renders; the `key` below remounts the screens so
  // every style is rebuilt in the new palette.
  const themeMode = night ? 'dark' : 'light';
  setThemeMode(themeMode);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  // Automatic cloud backup for online accounts (no-op in on-device mode).
  useEffect(() => startCloudSync(), []);

  return (
    <SafeAreaProvider>
      <View key={themeMode} style={styles.page}>
        <View style={styles.container}>
          <StatusBar style={night ? 'light' : 'dark'} />
          <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Theme.colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="login" options={push} />
              <Stack.Screen name="signup" options={push} />
              <Stack.Screen name="forgot-password" options={push} />
              <Stack.Screen name="assessment" options={push} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="log-cycle" options={sheet} />
              <Stack.Screen name="log-mood" options={sheet} />
              <Stack.Screen name="log-pain" options={sheet} />
              <Stack.Screen name="log-flow" options={sheet} />
              <Stack.Screen name="voice-journal" options={sheet} />
              <Stack.Screen name="fitness" options={push} />
              <Stack.Screen name="study" options={push} />
              <Stack.Screen name="games" options={push} />
              <Stack.Screen name="your-go-girl" options={sheet} />
              <Stack.Screen name="health-check" options={push} />
              <Stack.Screen name="sync-result" options={sheet} />
              <Stack.Screen name="care" options={push} />
              <Stack.Screen name="pcos" options={push} />
              <Stack.Screen name="confidence" options={push} />
              <Stack.Screen name="data" options={push} />
            </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = createStyles(() => ({
  // Each screen paints its own background; this only shows beside the
  // centred column on wide web windows.
  page: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({
          maxWidth: 500,
          marginHorizontal: 'auto',
          alignSelf: 'center',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.08)',
          minHeight: '100vh',
          overflow: 'hidden',
        } as any)
      : {}),
  },
}));
