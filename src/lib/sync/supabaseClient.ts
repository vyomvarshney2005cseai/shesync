import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncClient } from './engine';

const PAGE = 1000; // Supabase returns at most 1000 rows per request by default
const ORDER_KEY: Record<string, string> = {
  profiles: 'id',
  cycles: 'start_date',
  symptom_logs: 'id',
  sleep_logs: 'log_date',
  care_contacts: 'id',
  app_documents: 'doc',
};

const quote = (v: string) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** The sync engine's database operations, done with supabase-js (PostgREST). */
export function supabaseSyncClient(supabase: SupabaseClient): SyncClient {
  return {
    async getUserId() {
      const { data } = await supabase.auth.getSession();
      return data.session?.user.id ?? null;
    },
    async upsert(table, rows, onConflict) {
      const { error } = await supabase.from(table).upsert(rows, { onConflict });
      if (error) throw new Error(`${table}: ${error.message}`);
    },
    async deleteMissing(table, userId, keyColumn, keep) {
      let q = supabase.from(table).delete().eq('user_id', userId);
      if (keep.length) q = q.not(keyColumn, 'in', `(${keep.map(quote).join(',')})`);
      const { error } = await q;
      if (error) throw new Error(`${table}: ${error.message}`);
    },
    async selectAll<T>(table: string, userColumn: string, userId: string) {
      const out: T[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq(userColumn, userId)
          .order(ORDER_KEY[table] ?? userColumn)
          .range(from, from + PAGE - 1);
        if (error) throw new Error(`${table}: ${error.message}`);
        out.push(...((data ?? []) as T[]));
        if (!data || data.length < PAGE) return out;
      }
    },
  };
}
