import { describe, expect, it } from 'vitest';

import { getRolePermissions, hasPermission } from '../../src/modules/rbac';

describe('getRolePermissions', () => {
  it('grants order read access to viewer users', () => {
    expect(getRolePermissions('viewer')).toContain('orders:read');
  });

  it('does not grant user management access to viewer users', () => {
    expect(hasPermission('viewer', 'users:update')).toBe(false);
  });
});
