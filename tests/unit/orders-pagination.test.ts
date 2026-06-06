import { describe, expect, it } from 'vitest';

import { parseOrdersFilters } from '../../src/modules/orders';
import {
  DEFAULT_ORDERS_PAGE_SIZE,
  resolveOrdersPagination,
} from '../../src/modules/orders/pagination';

describe('parseOrdersFilters pagination', () => {
  it('parses positive page numbers from search params', () => {
    expect(parseOrdersFilters({ page: '3', status: 'processing' })).toEqual({
      page: 3,
      query: '',
      status: 'processing',
    });
  });

  it('normalizes invalid page values back to page 1', () => {
    expect(parseOrdersFilters({ page: '0', query: '  ORD-1001  ' })).toEqual({
      page: 1,
      query: 'ORD-1001',
      status: 'all',
    });
  });
});

describe('resolveOrdersPagination', () => {
  it('computes ranges for a middle page', () => {
    expect(
      resolveOrdersPagination({ requestedPage: 2, totalItems: 45 }),
    ).toEqual({
      endItem: 40,
      hasNextPage: true,
      hasPreviousPage: true,
      page: 2,
      pageSize: DEFAULT_ORDERS_PAGE_SIZE,
      startItem: 21,
      totalItems: 45,
      totalPages: 3,
    });
  });

  it('clamps oversized page requests to the last page', () => {
    expect(
      resolveOrdersPagination({ requestedPage: 99, totalItems: 45 }),
    ).toMatchObject({
      endItem: 45,
      hasNextPage: false,
      hasPreviousPage: true,
      page: 3,
      startItem: 41,
      totalPages: 3,
    });
  });

  it('keeps empty result sets on page 1', () => {
    expect(
      resolveOrdersPagination({ requestedPage: 4, totalItems: 0 }),
    ).toEqual({
      endItem: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      page: 1,
      pageSize: DEFAULT_ORDERS_PAGE_SIZE,
      startItem: 0,
      totalItems: 0,
      totalPages: 1,
    });
  });
});
