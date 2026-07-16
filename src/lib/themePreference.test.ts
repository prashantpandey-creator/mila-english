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

// No window (SSR/node) → system; system + light device = light, the same
// default a no-JS or script-blocked visitor gets from the CSS :not() gate.
assert.equal(getThemePreference(), 'system');
assert.equal(resolveTheme(false), 'light');
assert.equal(resolveTheme(true), 'dark');

console.log('themePreference: all assertions passed');
