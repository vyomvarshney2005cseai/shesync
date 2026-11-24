import { Platform, Share } from 'react-native';
import { pauseAppLock } from '@/lib/appLock';

/** Copies text to the clipboard. Resolves false if that was not possible. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    }
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Opens the share sheet (WhatsApp, email, notes…). On the web it uses the
 * browser's share where available and otherwise copies the text.
 * Resolves 'shared', 'copied' or 'failed'.
 */
export async function shareText(text: string, title?: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (Platform.OS === 'web') {
      const nav: Partial<Navigator> | undefined = typeof navigator !== 'undefined' ? navigator : undefined;
      if (nav?.share) {
        await nav.share({ text, title });
        return 'shared';
      }
      return (await copyText(text)) ? 'copied' : 'failed';
    }
    pauseAppLock(); // the share sheet is not "leaving" SheSync
    await Share.share({ message: text, title });
    return 'shared';
  } catch {
    return 'failed';
  }
}
