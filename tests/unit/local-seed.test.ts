import { describe, expect, it } from 'vitest';

import {
  seededOrders,
  seededReports,
  seededUsers,
} from '../../scripts/local-seed-data';

describe('local seed data', () => {
  it('keeps a stable set of sample orders for the dashboard flows', () => {
    expect(seededOrders.map((order) => order.externalId)).toEqual([
      'ORD-1001',
      'ORD-1002',
      'ORD-1003',
      'ORD-1004',
    ]);
    expect(new Set(seededOrders.map((order) => order.externalId)).size).toBe(
      seededOrders.length,
    );
  });

  it('includes the expected local users and reports', () => {
    expect(seededUsers.map((user) => user.email)).toEqual([
      'ops.local@example.com',
      'viewer.local@example.com',
    ]);
    expect(seededReports.map((report) => report.slug)).toEqual([
      'orders-daily-export',
      'orders-exceptions-export',
    ]);
  });
});
