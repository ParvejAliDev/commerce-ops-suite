import { describe, expect, it } from 'vitest';

import { getNextOrderStatuses } from '../../src/modules/orders/status';

describe('getNextOrderStatuses', () => {
  it('allows pending review orders to move into processing or cancelled', () => {
    expect(getNextOrderStatuses('pending_review')).toEqual([
      'processing',
      'cancelled',
    ]);
  });

  it('prevents shipped orders from changing status again', () => {
    expect(getNextOrderStatuses('shipped')).toEqual([]);
  });
});
