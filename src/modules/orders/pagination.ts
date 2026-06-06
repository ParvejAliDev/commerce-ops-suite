import type { OrdersPagination } from './types';

export const DEFAULT_ORDERS_PAGE_SIZE = 20;

export function resolveOrdersPagination(input: {
  requestedPage: number;
  totalItems: number;
  pageSize?: number;
}): OrdersPagination {
  const pageSize = Math.max(1, input.pageSize ?? DEFAULT_ORDERS_PAGE_SIZE);
  const totalPages =
    input.totalItems === 0 ? 1 : Math.ceil(input.totalItems / pageSize);
  const page = Math.min(Math.max(1, input.requestedPage), totalPages);
  const startItem = input.totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem =
    input.totalItems === 0 ? 0 : Math.min(input.totalItems, page * pageSize);

  return {
    endItem,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    page,
    pageSize,
    startItem,
    totalItems: input.totalItems,
    totalPages,
  };
}
