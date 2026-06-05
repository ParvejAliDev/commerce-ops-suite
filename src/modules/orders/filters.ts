import { z } from 'zod';

import type { OrdersFilters } from './types';
import { orderStatuses } from './types';

const orderStatusSchema = z.enum(orderStatuses);

export function parseOrdersFilters(
  input: Record<string, unknown>,
): OrdersFilters {
  const query = typeof input.query === 'string' ? input.query.trim() : '';
  const parsedStatus = orderStatusSchema.safeParse(input.status);

  return {
    query,
    status: parsedStatus.success ? parsedStatus.data : 'all',
  };
}

export function createOrdersEmptyStateMessage(filters: OrdersFilters): string {
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
