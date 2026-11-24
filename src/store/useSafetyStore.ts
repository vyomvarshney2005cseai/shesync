import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceStorage } from './storage';

/** The one person she wants SOS to call. Kept on this phone only (never backed up). */
export interface TrustedContact {
  name: string;
  phone: string;
}

interface SafetyState {
  trusted: TrustedContact | null;
  setTrusted: (contact: TrustedContact | null) => void;
  reset: () => void;
}

/** Keeps digits and a leading +, e.g. "+91 98765-43210" → "+919876543210". */
export function cleanPhone(raw: string): string {
  const t = raw.trim();
  const digits = t.replace(/[^\d]/g, '');
  return (t.startsWith('+') ? '+' : '') + digits;
}

export function isValidPhone(raw: string): boolean {
  const digits = cleanPhone(raw).replace('+', '');
  return digits.length >= 3 && digits.length <= 15;
}

export const useSafetyStore = create<SafetyState>()(
  persist(
    (set) => ({
      trusted: null,
      setTrusted: (contact) =>
        set({
          trusted:
            contact && contact.name.trim() && isValidPhone(contact.phone)
              ? { name: contact.name.trim().slice(0, 40), phone: cleanPhone(contact.phone) }
              : null,
        }),
      reset: () => set({ trusted: null }),
    }),
    { name: 'shesync.safety', version: 1, storage: deviceStorage() }
  )
);
