import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Web colour scheme. The app is a single-page build (no static rendering),
 * so the browser value can be used directly; default to light.
 */
export function useColorScheme() {
  return useRNColorScheme() ?? 'light';
}
