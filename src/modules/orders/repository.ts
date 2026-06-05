import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { orderNotes, orders, orderStatusHistory } from '../../db/schema';
import { getDb } from '../../lib/db';
import { serializeTimestamp, type TimestampInput } from '../../lib/timestamps';
import { canTransitionOrderStatus, getNextOrderStatuses } from './status';
import type {
  OrderLifecycleStatus,
  OrderNoteRecord,
  OrderRecord,
  OrdersFilters,
  OrdersSummary,
  OrderStatusHistoryEntry,
} from './types';

export function summarizeOrders(
  rows: Pick<OrderRecord, 'status'>[],
): OrdersSummary {
  return rows.reduce<OrdersSummary>(
    (summary, row) => {
      summary.total += 1;
      summary[row.status] += 1;
      return summary;
    },
    {
      total: 0,
      pending_review: 0,
      processing: 0,
      shipped: 0,
      cancelled: 0,
    },
  );
}

type OrderRow = Omit<OrderRecord, 'createdAt'> & {
  createdAt: TimestampInput;
};

type OrderStatusHistoryRow = Omit<OrderStatusHistoryEntry, 'createdAt'> & {
  createdAt: TimestampInput;
};

type OrderNoteRow = Omit<OrderNoteRecord, 'createdAt'> & {
  createdAt: TimestampInput;
};

const orderSelection = {
  assignedTeam: orders.assignedTeam,
  createdAt: orders.createdAt,
  externalId: orders.externalId,
  id: orders.id,
  status: orders.status,
} as const;

const orderStatusHistorySelection = {
  actorEmail: orderStatusHistory.actorEmail,
  createdAt: orderStatusHistory.createdAt,
  id: orderStatusHistory.id,
  nextStatus: orderStatusHistory.nextStatus,
  note: orderStatusHistory.note,
  previousStatus: orderStatusHistory.previousStatus,
} as const;

const orderNoteSelection = {
  actorEmail: orderNotes.actorEmail,
  body: orderNotes.body,
  createdAt: orderNotes.createdAt,
  id: orderNotes.id,
} as const;

function mapOrderRow(row: OrderRow): OrderRecord {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
  };
}

function mapOrderStatusHistoryRow(
  row: OrderStatusHistoryRow,
): OrderStatusHistoryEntry {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
  };
}

function mapOrderNoteRow(row: OrderNoteRow): OrderNoteRecord {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
  };
}

export async function listOrders(filters: OrdersFilters): Promise<{
  rows: OrderRecord[];
  summary: OrdersSummary;
}> {
  const db = getDb();
  const conditions = [];

  if (filters.status !== 'all') {
    conditions.push(eq(orders.status, filters.status));
  }

  if (filters.query) {
    const queryValue = `%${filters.query}%`;
    conditions.push(
      or(
        ilike(orders.externalId, queryValue),
        ilike(orders.assignedTeam, queryValue),
      )!,
    );
  }

  const rows = await db
    .select(orderSelection)
    .from(orders)
    .where(conditions.length === 0 ? undefined : and(...conditions))
    .orderBy(desc(orders.createdAt), desc(orders.id));
  const records = rows.map(mapOrderRow);

  return {
    rows: records,
    summary: summarizeOrders(records),
  };
}

export async function countOrdersByStatus(): Promise<OrdersSummary> {
  const db = getDb();
  const rows = await db
    .select({
      count: sql<string>`count(*)::text`,
      status: orders.status,
    })
    .from(orders)
    .groupBy(orders.status);

  return rows.reduce<OrdersSummary>(
    (summary, row) => {
      summary.total += Number(row.count);
      summary[row.status] = Number(row.count);
      return summary;
    },
    {
      total: 0,
      pending_review: 0,
      processing: 0,
      shipped: 0,
      cancelled: 0,
    },
  );
}

export async function getOrderByExternalId(
  externalId: string,
): Promise<OrderRecord | null> {
  const db = getDb();
  const rows = await db
    .select(orderSelection)
    .from(orders)
    .where(eq(orders.externalId, externalId))
    .limit(1);

  const row = rows[0];
  return row ? mapOrderRow(row) : null;
}

export async function listOrderStatusHistory(
  orderId: number,
): Promise<OrderStatusHistoryEntry[]> {
  const db = getDb();
  const rows = await db
    .select(orderStatusHistorySelection)
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(desc(orderStatusHistory.createdAt), desc(orderStatusHistory.id));

  return rows.map(mapOrderStatusHistoryRow);
}

export async function listOrderNotes(
  orderId: number,
): Promise<OrderNoteRecord[]> {
  const db = getDb();
  const rows = await db
    .select(orderNoteSelection)
    .from(orderNotes)
    .where(eq(orderNotes.orderId, orderId))
    .orderBy(desc(orderNotes.createdAt), desc(orderNotes.id));

  return rows.map(mapOrderNoteRow);
}

export async function updateOrderStatus(input: {
  orderId: number;
  currentStatus: OrderLifecycleStatus;
  nextStatus: OrderLifecycleStatus;
  actorEmail: string;
  note?: string;
}): Promise<boolean> {
  const db = getDb();

  if (!canTransitionOrderStatus(input.currentStatus, input.nextStatus)) {
    return false;
  }

  const updatedRows = await db
    .update(orders)
    .set({ status: input.nextStatus })
    .where(
      and(eq(orders.id, input.orderId), eq(orders.status, input.currentStatus)),
    )
    .returning({ id: orders.id });

  if (updatedRows.length === 0) {
    return false;
  }

  await db.insert(orderStatusHistory).values({
    actorEmail: input.actorEmail,
    nextStatus: input.nextStatus,
    note: input.note ?? null,
    orderId: input.orderId,
    previousStatus: input.currentStatus,
  });

  return true;
}

export async function addOrderNote(input: {
  orderId: number;
  actorEmail: string;
  body: string;
}): Promise<void> {
  const db = getDb();

  await db.insert(orderNotes).values({
    actorEmail: input.actorEmail,
    body: input.body,
    orderId: input.orderId,
  });
}

export async function getOrderWorkflowDetail(externalId: string): Promise<{
  order: OrderRecord;
  nextStatuses: OrderLifecycleStatus[];
  statusHistory: OrderStatusHistoryEntry[];
  notes: OrderNoteRecord[];
} | null> {
  const order = await getOrderByExternalId(externalId);
  if (!order) {
    return null;
  }

  const [statusHistory, notes] = await Promise.all([
    listOrderStatusHistory(order.id),
    listOrderNotes(order.id),
  ]);

  return {
    order,
    nextStatuses: getNextOrderStatuses(order.status),
    statusHistory,
    notes,
  };
}
