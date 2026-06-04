import { describe, expect, it } from 'vitest';

import { canAccessOrders } from '../../src/modules/auth/access';

describe('canAccessOrders', () => {
  it('allows viewer users to access the orders workspace', () => {
    expect(canAccessOrders({ roleName: 'viewer' })).toBe(true);
  });

  it('rejects empty role names', () => {
    expect(canAccessOrders({ roleName: '' as never })).toBe(false);
  });
});
