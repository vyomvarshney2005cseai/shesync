import "../global.css";
import React, { useEffect } from 'react';
import { Stack, usePathname, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Platform, Appearance } from 'react-native';
import { Theme, createStyles, setThemeMode } from '@/constants/theme';
import { useStoresHydrated } from '@/store/hydration';
import { startCloudSync } from '@/lib/sync';
import { appearanceOverride, useNightActive, useSettingsStore } from '@/store/useSettingsStore';
import { AppLockGate } from '@/components/lock/AppLockGate';
import { usePadReminderTaps } from '@/lib/padReminders';
import { FriendlyError } from '@/components/errors/FriendlyError';
import { UpdateBanner } from '@/components/common/UpdateBanner';
import { installCrashReporting, setCrashRoute } from '@/lib/crashReporter';
import { LucideProvider } from 'lucide-react-native';
import { useReduceMotion } from '@/lib/motion';
import { syncReminders } from '@/lib/reminders';
import { useAppStore } from '@/store/useAppStore';
import { clearExportCache } from '@/lib/files';

// Keep the splash visible until saved data has loaded from the device.
// The navigator always renders (expo-router requires it on first render);
// each screen waits for hydration before deciding where to send the user.
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Any screen that throws shows this instead of a blank page. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <FriendlyError error={error} retry={retry} />;
}

// Slides are skipped when the phone asks for reduced motion.
const sheetMotion = { headerShown: false, animation: 'slide_from_bottom' } as const;
const pushMotion = { headerShown: false, animation: 'slide_from_right' } as const;
const still = { headerShown: false, animation: 'none' } as const;

export default function RootLayout() {
  const hydrated = useStoresHydrated();
  const night = useNightActive();
  // Tapping a pad-change reminder opens Pad Care.
  usePadReminderTaps();
  const pathname = usePathname();
  useEffect(() => installCrashReporting(), []);
  useEffect(() => setCrashRoute(pathname), [pathname]);
  // Set before any screen renders; the `key` below remounts the screens so
  // every style is rebuilt in the new palette.
  const themeMode = night ? 'dark' : 'light';
  setThemeMode(themeMode);
  const reduceMotion = useReduceMotion();
  const sheet = reduceMotion ? still : sheetMotion;
  const push = reduceMotion ? still : pushMotion;
  const fade = reduceMotion ? 'none' : 'fade';

  // Phones: alerts, the keyboard and date pickers follow the app's choice,
  // not the phone's dark mode (only "Match phone" follows the phone).
  const nightMode = useSettingsStore((s) => s.nightMode);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    try {
      Appearance.setColorScheme?.(appearanceOverride(nightMode, night));
    } catch {
      // Older native code without overrides: the app's own colours still apply.
    }
  }, [nightMode, night]);

  // Web: the keyboard focus ring follows the theme (see global.css).
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--focus-ring', Theme.colors.focusRing);
      document.documentElement.style.colorScheme = themeMode;
    }
  }, [themeMode]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  // Exports from last time have been shared by now: remove them from the cache.
  useEffect(() => {
    void clearExportCache();
  }, []);

  // Automatic cloud backup for online accounts (no-op in on-device mode).
  useEffect(() => startCloudSync(), []);

  // Settings → Reminders follow the latest prediction and choices.
  const daysUntil = useAppStore((s) => s.cyclePrediction?.daysUntilNextPeriod);
  const signedIn = useAppStore((s) => s.isAuthenticated || s.isGuest);
  const reminderPrefs = useSettingsStore((s) => `${s.checkInReminder}-${s.checkInReminderHour}-${s.periodReminder}`);
  useEffect(() => {
    if (hydrated) void syncReminders();
  }, [hydrated, daysUntil, signedIn, reminderPrefs]);

  return (
    <SafeAreaProvider>
      {/* Every utility icon draws with the same 1.75px stroke as Unnmegh's own icons. */}
      <LucideProvider absoluteStrokeWidth>
      <View key={themeMode} style={styles.page}>
        <View style={styles.container}>
          <StatusBar style={night ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Theme.colors.background },
                animation: reduceMotion ? 'none' : 'slide_from_right',
              }}
          >
              <Stack.Screen name="welcome" options={{ headerShown: false, animation: fade }} />
              <Stack.Screen name="login" options={push} />
              <Stack.Screen name="signup" options={push} />
              <Stack.Screen name="forgot-password" options={push} />
              <Stack.Screen name="assessment" options={push} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: fade }} />
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
              <Stack.Screen
                name="check-in"
                options={{ headerShown: false, presentation: 'transparentModal', animation: reduceMotion ? 'none' : 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
              />
              <Stack.Screen name="app-lock" options={push} />
              <Stack.Screen name="pad-care" options={push} />
              <Stack.Screen name="exams" options={push} />
              <Stack.Screen name="leave-note" options={push} />
              <Stack.Screen name="privacy" options={sheet} />
              <Stack.Screen name="sos" options={{ headerShown: false, presentation: 'fullScreenModal', animation: fade }} />
              <Stack.Screen name="settings" options={push} />
              <Stack.Screen name="privacy-dashboard" options={push} />
            </Stack>
        </View>
        <UpdateBanner />
        {hydrated && <AppLockGate />}
      </View>
      </LucideProvider>
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
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: Theme.colors.cardBorder,
          minHeight: '100vh',
          overflow: 'hidden',
        } as any)
      : {}),
  },
}));
