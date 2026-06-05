import { describe, expect, it } from 'vitest';

import {
  createOrdersEmptyStateMessage,
  parseOrdersFilters,
} from '../../src/modules/orders';

describe('parseOrdersFilters', () => {
  it('normalizes invalid statuses back to all', () => {
    expect(parseOrdersFilters({ status: 'bad-status' })).toEqual({
      query: '',
      status: 'all',
    });
  });

  it('trims the free-text query', () => {
    expect(
      parseOrdersFilters({ query: '  ORD-1001  ', status: 'shipped' }),
    ).toEqual({
      query: 'ORD-1001',
      status: 'shipped',
    });
  });
});

describe('createOrdersEmptyStateMessage', () => {
  it('explains when a status filter returns no rows', () => {
    expect(
      createOrdersEmptyStateMessage({ status: 'shipped', query: '' }),
    ).toMatch(/No shipped orders/i);
  });
});
