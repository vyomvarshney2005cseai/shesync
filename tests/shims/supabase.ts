// Test stand-in for '@/lib/supabase': records inserts instead of sending them.
export const isSupabaseConfigured = true;
export const __inserts: { table: string; rows: Record<string, unknown>[] }[] = [];
export const __next: { error: { message: string; code?: string } | null; throws: boolean } = { error: null, throws: false };
export const supabase = {
  from: (table: string) => ({
    insert: async (rows: Record<string, unknown>[]) => {
      if (__next.throws) throw new Error('offline');
      const error = __next.error;
      if (!error) __inserts.push({ table, rows });
      return { error };
    },
  }),
};
