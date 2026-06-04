import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '../../src/modules/auth/password';

describe('password helpers', () => {
  it('verifies the original password against the stored hash', async () => {
    const password = 'LocalAdminPass123!';
    const passwordHash = await hashPassword(password);

    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
  });
});
