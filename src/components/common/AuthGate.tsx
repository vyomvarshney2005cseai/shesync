import React from 'react';
import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { useStoresHydrated } from '@/store/hydration';

/**
 * Wraps screens that need a signed-in user. Waits for saved data to load,
 * then sends signed-out visitors (for example a deep link or a refreshed
 * browser tab) back to the welcome screen.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const hydrated = useStoresHydrated();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  if (!hydrated) return null;
  // "/welcome", not "/": the Home tab also lives at "/", so redirecting to "/"
  // from inside the tabs resolved back to the tabs and looped forever.
  if (!isAuthenticated) return <Redirect href="/welcome" />;
  return <>{children}</>;
}
