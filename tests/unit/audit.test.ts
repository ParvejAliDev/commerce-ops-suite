import { describe, expect, it } from 'vitest';

import { describeAuditEntry } from '../../src/modules/audit';

describe('describeAuditEntry', () => {
  it('formats order status changes for operators', () => {
    expect(
      describeAuditEntry({
        actorEmail: 'admin.local@example.com',
        action: 'order.status_updated',
        targetId: 'ORD-1001',
        targetType: 'order',
        details: 'processing -> shipped',
        createdAt: '2026-06-05T12:00:00.000Z',
      }),
    ).toMatch(/processing -> shipped/i);
  });
});
