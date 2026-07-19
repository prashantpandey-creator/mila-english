import assert from 'node:assert/strict';
import test from 'node:test';
import { pbkdf2Sync } from 'node:crypto';
import {
  hashPassword,
  isGuestIdentity,
  normalizeEmail,
  passwordNeedsUpgrade,
  verifyPassword,
} from './auth';
import { registerSchema } from './authSchemas';
import { publicUser } from './publicUser';

test('email and guest identity normalization are explicit', () => {
  assert.equal(normalizeEmail('  Learner@Example.COM  '), 'learner@example.com');
  assert.equal(isGuestIdentity('guest', 'named@example.com'), true);
  assert.equal(isGuestIdentity('registered', 'guest-user@mila.local'), false);
  assert.equal(isGuestIdentity(null, 'guest-123e4567-e89b-12d3-a456-426614174000@mila.local'), true);
});

test('guest responses retain the native string contract without losing explicit guest state', () => {
  const email = 'guest-123e4567-e89b-12d3-a456-426614174000@mila.local';
  const user = publicUser({
    id: 7,
    email,
    name: 'Guest',
    learnerCategory: 'pending',
    nativeLanguage: 'Русский',
    level: 'pending',
    streakDays: 0,
    accountType: 'guest',
    emailVerifiedAt: null,
  });
  assert.equal(user.email, email);
  assert.equal(user.isGuest, true);
  assert.equal(user.emailVerified, false);
});

test('legacy native registration category is accepted and canonicalized', () => {
  const parsed = registerSchema.parse({
    name: 'Native learner',
    email: 'native@example.com',
    password: 'long-enough-password',
    nativeLanguage: 'ru',
    learnerCategory: 'adult_beginner',
    level: 'pending',
  });
  assert.equal(parsed.learnerCategory, 'adult_learner');
});

test('new password hashes are versioned and timing-safe verifiable', async () => {
  const encoded = await hashPassword('a strong sentence');
  assert.match(encoded, /^pbkdf2-sha512\$210000\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.equal(await verifyPassword('a strong sentence', encoded), true);
  assert.equal(await verifyPassword('wrong sentence', encoded), false);
  assert.equal(passwordNeedsUpgrade(encoded), false);
});

test('legacy Mila hashes remain valid and are marked for upgrade', async () => {
  const salt = 'legacy-salt';
  const encoded = `${salt}:${pbkdf2Sync('old password', salt, 1_000, 64, 'sha512').toString('hex')}`;
  assert.equal(await verifyPassword('old password', encoded), true);
  assert.equal(await verifyPassword('wrong', encoded), false);
  assert.equal(passwordNeedsUpgrade(encoded), true);
});

test('malformed hashes fail closed', async () => {
  assert.equal(await verifyPassword('anything', 'not-a-hash'), false);
  assert.equal(await verifyPassword('anything', 'pbkdf2-sha512$9999999$aa$00'), false);
});
