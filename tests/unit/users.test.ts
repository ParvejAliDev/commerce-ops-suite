import { describe, expect, it } from 'vitest';

import { summarizeUsersByRole } from '../../src/modules/users';

describe('summarizeUsersByRole', () => {
  it('counts active and inactive users per role', () => {
    expect(
      summarizeUsersByRole([
        { roleName: 'admin', isActive: true },
        { roleName: 'operations', isActive: true },
        { roleName: 'operations', isActive: false },
      ]),
    ).toEqual({
      total: 3,
      active: 2,
      inactive: 1,
      byRole: {
        admin: 1,
        operations: 2,
        viewer: 0,
      },
    });
  });
});
