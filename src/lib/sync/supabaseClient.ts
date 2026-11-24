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

/** Columns this server does not have yet (per table), learned from its errors. */
const missingColumns = new Map<string, Set<string>>();

/** PostgREST: "Could not find the 'approximate' column of 'cycles' in the schema cache". */
export function missingColumn(message: string): string | null {
  const m = /could not find the '([a-z_]+)' column/i.exec(message) ?? /column "?([a-z_]+)"? of relation .* does not exist/i.exec(message);
  return m ? m[1] : null;
}

function rememberMissing(table: string, column: string) {
  const set = missingColumns.get(table) ?? new Set<string>();
  set.add(column);
  missingColumns.set(table, set);
}

function stripMissing(table: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const drop = missingColumns.get(table);
  if (!drop?.size) return rows;
  return rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !drop.has(k))));
}

const quote = (v: string) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** The sync engine's database operations, done with supabase-js (PostgREST). */
export function supabaseSyncClient(supabase: SupabaseClient): SyncClient {
  return {
    async getUserId() {
      const { data } = await supabase.auth.getSession();
      return data.session?.user.id ?? null;
    },
    async upsert(table, rows, onConflict) {
      const send = (list: Record<string, unknown>[]) => supabase.from(table).upsert(list, { onConflict });
      const list = rows as Record<string, unknown>[];
      let { error } = await send(stripMissing(table, list));
      // A newer app talking to a server whose database migration has not run
      // yet: drop the unknown column and try again, instead of stopping backup.
      const missing = error ? missingColumn(error.message) : null;
      if (missing) {
        rememberMissing(table, missing);
        ({ error } = await send(stripMissing(table, list)));
      }
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
