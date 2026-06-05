import { describe, expect, it } from 'vitest';

import { buildOrdersCsv } from '../../src/modules/reports';

describe('buildOrdersCsv', () => {
  it('renders a stable CSV export for order rows', () => {
    expect(
      buildOrdersCsv([
        {
          externalId: 'ORD-1001',
          status: 'processing',
          assignedTeam: 'ops-core',
          createdAt: '2026-06-05T12:00:00.000Z',
        },
      ]),
    ).toContain(
      'external_id,status,assigned_team,created_at\nORD-1001,processing,ops-core,2026-06-05T12:00:00.000Z',
    );
  });
});
