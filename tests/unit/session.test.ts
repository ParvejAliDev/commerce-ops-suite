import { describe, expect, it } from 'vitest';

import {
  createSessionToken,
  hashSessionToken,
} from '../../src/modules/auth/session';

describe('session token helpers', () => {
  it('creates a stable hash for a generated token', () => {
    const token = createSessionToken();
    const hashed = hashSessionToken(token);

    expect(token.length).toBeGreaterThan(20);
    expect(hashed).toHaveLength(64);
    expect(hashSessionToken(token)).toBe(hashed);
  });
});
