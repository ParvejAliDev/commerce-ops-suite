import { z } from 'zod';

import type { OrdersFilters } from './types';
import { orderStatuses } from './types';

const orderStatusSchema = z.enum(orderStatuses);

function parsePage(input: unknown): number {
  if (typeof input === 'number' && Number.isInteger(input) && input > 0) {
    return input;
  }

  if (typeof input === 'string') {
    const parsed = Number.parseInt(input, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 1;
}

export function parseOrdersFilters(
  input: Record<string, unknown>,
): OrdersFilters {
  const page = parsePage(input.page);
  const query = typeof input.query === 'string' ? input.query.trim() : '';
  const parsedStatus = orderStatusSchema.safeParse(input.status);

  return {
    page,
    query,
    status: parsedStatus.success ? parsedStatus.data : 'all',
  };
}

export function createOrdersEmptyStateMessage(
  filters: Pick<OrdersFilters, 'query' | 'status'>,
): string {
  if (filters.query && filters.status !== 'all') {
    return `No ${filters.status.replaceAll('_', ' ')} orders matched "${filters.query}".`;
  }

  if (filters.query) {
    return `No orders matched "${filters.query}".`;
  }

  if (filters.status !== 'all') {
    return `No ${filters.status.replaceAll('_', ' ')} orders are available right now.`;
  }

  return 'No orders are available right now.';
}
