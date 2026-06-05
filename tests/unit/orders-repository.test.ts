import { describe, expect, it } from 'vitest';

import { summarizeOrders } from '../../src/modules/orders/repository';

describe('summarizeOrders', () => {
  it('counts rows by status', () => {
    expect(
      summarizeOrders([
        { status: 'pending_review' },
        { status: 'pending_review' },
        { status: 'shipped' },
      ]),
    ).toMatchObject({ total: 3, pending_review: 2, shipped: 1 });
  });
});
