// Runs the real supabase-js client against a fake PostgREST server and checks the requests.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { supabaseSyncClient, missingColumn } from '@/lib/sync/supabaseClient';

const reqs: { method: string; url: string; prefer?: string; body: string }[] = [];
let page = 0;
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    reqs.push({ method: req.method!, url: decodeURIComponent(req.url!), prefer: req.headers['prefer'] as string, body });
    res.setHeader('content-type', 'application/json');
    if (req.method === 'GET') {
      // first page full (1000 rows), second page partial → pagination must stop
      const n = page++ === 0 ? 1000 : 3;
      res.end(JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: `log-${i}` }))));
    } else if (req.method === 'POST' && req.url!.includes('/cycles') && body.includes('"approximate"')) {
      // A server whose migration has not run yet.
      res.statusCode = 400;
      res.end(JSON.stringify({ code: 'PGRST204', details: null, hint: null, message: "Could not find the 'approximate' column of 'cycles' in the schema cache" }));
    } else {
      res.statusCode = 201;
      res.end('');
    }
  });
});
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address() as AddressInfo;
const sb = createClient(`http://127.0.0.1:${port}`, 'anon-key', { auth: { persistSession: false, autoRefreshToken: false } });
const c = supabaseSyncClient(sb);

await c.upsert('symptom_logs', [{ user_id: 'u1', id: 'log-1' }], 'user_id,id');
await c.deleteMissing('care_contacts', 'u1', 'id', ['care-1', 'we"ird,id']);
await c.deleteMissing('cycles', 'u1', 'start_date', []);
const rows = await c.selectAll('symptom_logs', 'user_id', 'u1');

assert.equal(reqs[0].method, 'POST');
assert.match(reqs[0].url, /\/rest\/v1\/symptom_logs\?on_conflict=user_id,id/);
assert.match(reqs[0].prefer!, /resolution=merge-duplicates/);
assert.equal(reqs[1].method, 'DELETE');
assert.ok(reqs[1].url.includes('user_id=eq.u1') && reqs[1].url.includes('id=not.in.("care-1","we\\"ird,id")'));
assert.equal(reqs[2].url, '/rest/v1/cycles?user_id=eq.u1');
assert.equal(rows.length, 1003, 'reads every page');
assert.ok(reqs[3].url.includes('order=id.asc') && reqs[3].url.includes('offset=0') && reqs[3].url.includes('limit=1000'));
assert.ok(reqs[4].url.includes('offset=1000'));

// New app, old database: the unknown column is dropped and backup carries on.
reqs.length = 0;
const cycle = { user_id: 'u1', start_date: '2026-10-14', end_date: '2026-10-18', approximate: true };
await c.upsert('cycles', [cycle], 'user_id,start_date');
assert.equal(reqs.length, 2, 'one retry');
assert.ok(reqs[0].body.includes('"approximate"'));
assert.ok(!reqs[1].body.includes('"approximate"') && reqs[1].body.includes('2026-10-14'), 'retry leaves the column out');
reqs.length = 0;
await c.upsert('cycles', [cycle], 'user_id,start_date');
assert.equal(reqs.length, 1, 'remembers the missing column');
assert.ok(!reqs[0].body.includes('"approximate"'));
// Other tables still send everything.
reqs.length = 0;
await c.upsert('symptom_logs', [{ user_id: 'u1', id: 'log-2', approximate: 1 }], 'user_id,id');
assert.ok(reqs[0].body.includes('"approximate"'));

// Deleting the entries she deleted: only her rows, only those ids, in small batches.
reqs.length = 0;
await c.deleteRows('symptom_logs', 'u1', 'id', ['log-1', 'we"ird,id', ...Array.from({ length: 60 }, (_, i) => `log-x${i}`)]);
assert.equal(reqs.length, 2, '62 ids → 2 requests');
assert.ok(reqs.every((r) => r.method === 'DELETE' && r.url.startsWith('/rest/v1/symptom_logs?') && r.url.includes('user_id=eq.u1')));
assert.ok(reqs[0].url.includes('id=in.("log-1","we\\"ird,id","log-x0"'), reqs[0].url);
assert.ok(!reqs[0].url.includes('not.in'));

assert.equal(missingColumn("Could not find the 'approximate' column of 'cycles' in the schema cache"), 'approximate');
assert.equal(missingColumn('column "approximate" of relation "cycles" does not exist'), 'approximate');
assert.equal(missingColumn('new row violates row-level security policy'), null);

server.close();
console.log('supabase client requests OK (incl. missing-column retry and targeted deletes)');
