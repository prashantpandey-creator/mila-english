#!/usr/bin/env node
// Aggregate test runner. Each *.test.ts / *.test.mjs file in this repo is a
// standalone program — some use node:test, some are top-level assert scripts —
// so there is no single framework entrypoint. This wires them together: it
// discovers every test file, runs each one via tsx in its own process, and
// exits non-zero on the FIRST failure so CI stops at the first red test.
//
// Usage: `npm test` (see package.json). No arguments.
import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
// Directories that never hold our test sources; skipping them keeps discovery
// fast and avoids running third-party fixtures shipped inside dependencies.
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'ios', 'output', 'tmp']);
const TEST_FILE = /\.test\.(ts|mjs)$/;

function findTests(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      found.push(...findTests(join(dir, entry.name)));
    } else if (entry.isFile() && TEST_FILE.test(entry.name)) {
      found.push(join(dir, entry.name));
    }
  }
  return found;
}

const files = findTests(ROOT).sort();

if (files.length === 0) {
  console.error('No *.test.ts / *.test.mjs files found.');
  process.exit(1);
}

console.log(`Running ${files.length} test file(s) via tsx…\n`);

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/');
  console.log(`▶ ${rel}`);
  // `node --import tsx <file>` is the invocation already proven in this repo;
  // it transpiles TS/ESM on the fly and runs the file as its own program.
  const result = spawnSync(process.execPath, ['--import', 'tsx', file], {
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(`\n✖ Could not run ${rel}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\n✖ FAILED: ${rel} (exit code ${result.status})`);
    process.exit(result.status || 1);
  }
}

console.log(`\n✓ All ${files.length} test file(s) passed.`);
