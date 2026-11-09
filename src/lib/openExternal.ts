import { Alert, Linking, Platform } from 'react-native';

/** India's national crisis lines, shown by every SOS surface in the app. */
export const CRISIS_LINES = {
  teleManas: { label: 'Tele-MANAS (24×7, free)', number: '14416', alt: '1-800-891-4416' },
  emergency: { label: 'Emergency services', number: '112' },
} as const;

function notify(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

/** Opens a web link in a new tab on web, or in the system handler on a phone. */
export async function openUrl(url: string): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
      return;
    }
    await Linking.openURL(url);
  } catch {
    notify('Could not open link', url);
  }
}

/** Starts a phone call. Shows the number if the device cannot dial (web, tablets). */
export async function callNumber(number: string, label?: string): Promise<void> {
  const url = `tel:${number.replace(/[^\d+]/g, '')}`;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.location.href = url;
      notify(label ?? 'Call', `Dial ${number} from your phone.`);
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      notify(label ?? 'Call', `Dial ${number} from your phone.`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    notify(label ?? 'Call', `Dial ${number} from your phone.`);
  }
}

/** Opens the SMS composer with a prefilled message (no recipient chosen). */
export async function composeSms(body: string): Promise<void> {
  const encoded = encodeURIComponent(body);
  // iOS uses "&body=", Android and others "?body=".
  const url = Platform.OS === 'ios' ? `sms:&body=${encoded}` : `sms:?body=${encoded}`;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.location.href = url;
      return;
    }
    await Linking.openURL(url);
  } catch {
    notify('Message a friend', body);
  }
}

/** YouTube thumbnail URL for a video id. */
export function youtubeThumb(id: string, quality: 'mq' | 'hq' = 'mq'): string {
  return `https://img.youtube.com/vi/${id}/${quality}default.jpg`;
}

/** Canonical YouTube watch URL for a video id. */
export function youtubeUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
