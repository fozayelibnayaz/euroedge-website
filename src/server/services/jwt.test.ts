import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, revokeToken } from './jwt';

describe('jwt', () => {
  it('signs and verifies a token round trip', () => {
    const token = signToken({ email: 'admin', name: 'EuroEdge Admin' });
    const payload = verifyToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.email).toBe('admin');
    expect(payload?.name).toBe('EuroEdge Admin');
  });

  it('issues a unique token id for every session', () => {
    const first = verifyToken(signToken({ email: 'admin', name: 'Admin' }));
    const second = verifyToken(signToken({ email: 'admin', name: 'Admin' }));

    expect(first?.jti).toBeTruthy();
    expect(first?.jti).not.toBe(second?.jti);
  });

  it('rejects a revoked token', () => {
    const token = signToken({ email: 'admin', name: 'Admin' });
    expect(verifyToken(token)).not.toBeNull();

    revokeToken(token);
    expect(verifyToken(token)).toBeNull();
  });

  it('rejects tampered and malformed tokens', () => {
    const token = signToken({ email: 'admin', name: 'Admin' });
    expect(verifyToken(`${token}tampered`)).toBeNull();
    expect(verifyToken('not-a-token')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });
});
