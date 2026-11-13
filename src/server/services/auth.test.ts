import { describe, it, expect } from 'vitest';
import { hashPassword, generateSalt } from './auth';

describe('hashPassword', () => {
  it('returns a hex string', () => {
    const result = hashPassword('password', 'somesalt');
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('produces different hashes for different passwords', () => {
    const hash1 = hashPassword('password1', 'salt');
    const hash2 = hashPassword('password2', 'salt');
    expect(hash1).not.toBe(hash2);
  });

  it('produces different hashes for different salts', () => {
    const hash1 = hashPassword('password', 'salt1');
    const hash2 = hashPassword('password', 'salt2');
    expect(hash1).not.toBe(hash2);
  });

  it('is deterministic — same inputs always produce the same hash', () => {
    const a = hashPassword('mypassword', 'mysalt');
    const b = hashPassword('mypassword', 'mysalt');
    expect(a).toBe(b);
  });

  it('hashes the shipped owner password to a stable length', () => {
    const hash = hashPassword('euroedge', 'unit-test-salt');
    expect(hash).toHaveLength(128);
  });
});

describe('generateSalt', () => {
  it('produces a unique hex salt of usable length', () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^[0-9a-f]{36}$/);
    expect(salt).not.toBe(generateSalt());
  });
});
