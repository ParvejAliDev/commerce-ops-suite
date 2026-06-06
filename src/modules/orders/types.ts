export const orderStatuses = [
  'all',
  'pending_review',
  'processing',
  'shipped',
  'cancelled',
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type OrderFilterStatus = OrderStatus;
export type OrderLifecycleStatus = Exclude<OrderStatus, 'all'>;

export type OrdersFilters = {
  page: number;
  query: string;
  status: OrderFilterStatus;
};

export type OrdersPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type OrderRecord = {
  id: number;
  externalId: string;
  status: OrderLifecycleStatus;
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

export type OrderStatusHistoryEntry = {
  id: number;
  previousStatus: OrderLifecycleStatus;
  nextStatus: OrderLifecycleStatus;
  actorEmail: string;
  note: string | null;
  createdAt: string;
};

export type OrderNoteRecord = {
  id: number;
  actorEmail: string;
  body: string;
  createdAt: string;
};
