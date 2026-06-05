export const orderStatuses = [
  'all',
  'pending_review',
  'processing',
  'shipped',
  'cancelled',
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type OrderFilterStatus = OrderStatus;

export type OrdersFilters = {
  query: string;
  status: OrderFilterStatus;
};

export type OrderRecord = {
  id: number;
  externalId: string;
  status: Exclude<OrderStatus, 'all'>;
  assignedTeam: string;
  createdAt: string;
};

export type OrdersSummary = {
  total: number;
  pending_review: number;
  processing: number;
  shipped: number;
  cancelled: number;
};
