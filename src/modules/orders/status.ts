import type { OrderLifecycleStatus } from './types';

const orderStatusTransitions: Record<
  OrderLifecycleStatus,
  readonly OrderLifecycleStatus[]
> = {
  pending_review: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
};

export function getNextOrderStatuses(
  currentStatus: OrderLifecycleStatus,
): OrderLifecycleStatus[] {
  return [...orderStatusTransitions[currentStatus]];
}

export function canTransitionOrderStatus(
  currentStatus: OrderLifecycleStatus,
  nextStatus: OrderLifecycleStatus,
): boolean {
  return orderStatusTransitions[currentStatus].includes(nextStatus);
}
