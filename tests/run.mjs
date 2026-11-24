// Runs every test file and fails (exit 1) if any of them fails.
//   npm test                 all tests
//   npm test -- round7 sync  only files whose name contains one of the words
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const tsx = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
const only = process.argv.slice(2);

const files = [
  ...fs.readdirSync(path.join(here, 'unit')).map((f) => path.join('tests', 'unit', f)),
  ...fs.readdirSync(path.join(here, 'db')).map((f) => path.join('tests', 'db', f)),
]
  .filter((f) => /\.test\.(ts|mts|mjs)$/.test(f))
  .filter((f) => !only.length || only.some((w) => f.includes(w)))
  .sort();

const results = [];
for (const file of files) {
  const started = Date.now();
  const cmd = file.endsWith('.mjs') ? process.execPath : tsx;
  const args = file.endsWith('.mjs') ? [file] : ['--tsconfig', 'tests/tsconfig.json', file];
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', env: { ...process.env, TZ: process.env.TZ || 'Asia/Kolkata' } });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
  const ok = r.status === 0 && !/^FAIL\b/m.test(out);
  const last = out.split('\n').filter(Boolean).pop() ?? '';
  results.push({ file, ok, ms: Date.now() - started });
  console.log(`${ok ? '✓' : '✗'} ${file}  (${((Date.now() - started) / 1000).toFixed(1)}s)  ${last}`);
  if (!ok) console.log(out.split('\n').map((l) => `    ${l}`).join('\n'));
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} test files passed`);
process.exit(failed.length || !results.length ? 1 : 0);
