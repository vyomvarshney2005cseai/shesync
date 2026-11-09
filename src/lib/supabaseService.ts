import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';

/** Thrown by auth calls when the app runs without a Supabase project. */
export class OfflineModeError extends Error {
  constructor() {
    super('On-device mode: no Supabase project is configured.');
    this.name = 'OfflineModeError';
  }
}

/**
 * True when an auth failure means "the server could not be reached", so the
 * app may fall back to an on-device session.
 *
 * Wrong passwords, existing accounts and other answers from the server are
 * NOT offline errors: those must be shown to the user. Before this check the
 * login screen accepted any password on any error.
 */
export function isOfflineAuthError(err: unknown): boolean {
  if (!isSupabaseConfigured || err instanceof OfflineModeError) return true;
  if (isAuthRetryableFetchError(err)) return true;
  const msg = String((err as { message?: string } | null)?.message ?? '').toLowerCase();
  return msg.includes('network request failed') || msg.includes('failed to fetch');
}

// ─── AUTH SERVICES ──────────────────────────────────────────────

export async function signUpWithSupabase(email: string, password: string, name?: string) {
  if (!isSupabaseConfigured) throw new OfflineModeError();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  // The database trigger creates her profile row from `full_name`.
  if (error) throw error;
  return data;
}

export async function signInWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured) throw new OfflineModeError();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutSupabase() {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[Supabase] signOut error:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase] signOut exception:', err?.message || err);
  }
}

/**
 * Sends a password reset email to the specified user address via Supabase Auth.
 */
export async function sendPasswordResetEmail(email: string, redirectTo?: string) {
  if (!isSupabaseConfigured) throw new OfflineModeError();
  const options: { redirectTo?: string } = {};
  if (redirectTo) {
    options.redirectTo = redirectTo;
  }
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), options);
  if (error) throw error;
  return data;
}

/**
 * Updates the user's password in Supabase.
 */
export async function updateUserPassword(newPassword: string) {
  if (!isSupabaseConfigured) throw new OfflineModeError();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
}

// ─── ACCOUNT ────────────────────────────────────────────────────

/**
 * Permanently deletes the signed-in account and every row of her data on the
 * server (see delete_my_account() in supabase/migrations), then ends the session.
 */
export async function deleteCloudAccount() {
  if (!isSupabaseConfigured) throw new OfflineModeError();
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  // The account no longer exists, so only clear the session on this device.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
}
