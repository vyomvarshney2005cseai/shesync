import { supabase } from './supabase';

export interface SupabaseProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string;
}

export interface SupabaseCycle {
  id?: string;
  user_id?: string;
  start_date: string;
  end_date?: string | null;
  cycle_length?: number | null;
  created_at?: string;
}

export interface SupabaseDailyLog {
  id?: string;
  user_id?: string;
  log_date: string;
  pain_level?: number | null;
  mood?: string | null;
  symptoms?: string[] | null;
  notes?: string | null;
  created_at?: string;
}

/**
 * Diagnostic function to test connectivity to the Supabase project
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Unknown network error' };
  }
}

// ─── AUTH SERVICES ──────────────────────────────────────────────

export async function signUpWithSupabase(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    // Attempt creating or updating profile record
    const names = (name || '').trim().split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    await supabase.from('profiles').upsert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
    });
  }

  return data;
}

export async function signInWithSupabase(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutSupabase() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[Supabase] signOut error:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase] signOut exception:', err?.message || err);
  }
}

export async function getCurrentSupabaseUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

/**
 * Sends a password reset email to the specified user address via Supabase Auth.
 */
export async function sendPasswordResetEmail(email: string, redirectTo?: string) {
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
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
}

// ─── CYCLE SERVICES ─────────────────────────────────────────────

export async function saveCycleToSupabase(cycle: {
  start_date: string;
  end_date?: string | null;
  cycle_length?: number | null;
}) {
  const user = await getCurrentSupabaseUser();
  if (!user) throw new Error('User not logged in');

  const { data, error } = await supabase
    .from('cycles')
    .insert([
      {
        user_id: user.id,
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        cycle_length: cycle.cycle_length,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCyclesFromSupabase(): Promise<SupabaseCycle[]> {
  const user = await getCurrentSupabaseUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── DAILY LOG SERVICES ─────────────────────────────────────────

export async function saveDailyLogToSupabase(log: {
  log_date: string;
  pain_level?: number | null;
  mood?: string | null;
  symptoms?: string[] | null;
  notes?: string | null;
}) {
  const user = await getCurrentSupabaseUser();
  if (!user) throw new Error('User not logged in');

  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(
      {
        user_id: user.id,
        log_date: log.log_date,
        pain_level: log.pain_level,
        mood: log.mood,
        symptoms: log.symptoms,
        notes: log.notes,
      },
      { onConflict: 'user_id,log_date' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchDailyLogsFromSupabase(): Promise<SupabaseDailyLog[]> {
  const user = await getCurrentSupabaseUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false });

  if (error) throw error;
  return data || [];
}
