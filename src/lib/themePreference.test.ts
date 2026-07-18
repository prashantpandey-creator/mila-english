// Run: npx tsx src/lib/themePreference.test.ts
import assert from 'node:assert';
import { getThemePreference, resolveTheme } from './themePreference';

// Explicit preference wins regardless of the device.
assert.equal(resolveTheme(true, 'light'), 'light');
assert.equal(resolveTheme(false, 'light'), 'light');
assert.equal(resolveTheme(true, 'dark'), 'dark');
assert.equal(resolveTheme(false, 'dark'), 'dark');

// System preference follows the device.
assert.equal(resolveTheme(true, 'system'), 'dark');
assert.equal(resolveTheme(false, 'system'), 'light');

// No window (SSR/node) → Mila's canonical warm-light room. This keeps the
// first paint deterministic instead of allowing device settings to introduce
// a competing palette before the route surface mounts.
assert.equal(getThemePreference(), 'light');
assert.equal(resolveTheme(false), 'light');
assert.equal(resolveTheme(true), 'light');

console.log('themePreference: all assertions passed');
