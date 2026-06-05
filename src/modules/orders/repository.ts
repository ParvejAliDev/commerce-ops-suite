import { getSql } from '../../lib/db';
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

type OrderRow = {
  id: number;
  externalId: string;
  status: OrderLifecycleStatus;
  assignedTeam: string;
  createdAt: string;
};

type OrderStatusHistoryRow = OrderStatusHistoryEntry;
type OrderNoteRow = OrderNoteRecord;

export async function listOrders(filters: OrdersFilters): Promise<{
  rows: OrderRecord[];
  summary: OrdersSummary;
}> {
  const sql = getSql();
  const statusClause =
    filters.status === 'all' ? sql`` : sql`and status = ${filters.status}`;
  const queryValue = filters.query ? `%${filters.query}%` : null;
  const queryClause = queryValue
    ? sql`and (external_id ilike ${queryValue} or assigned_team ilike ${queryValue})`
    : sql``;

  const rows = await sql<OrderRow[]>`
    select
      id,
      external_id as "externalId",
      status,
      assigned_team as "assignedTeam",
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from orders
    where 1 = 1
    ${statusClause}
    ${queryClause}
    order by created_at desc, id desc
  `;

  return {
    rows,
    summary: summarizeOrders(rows),
  };
}

export async function countOrdersByStatus(): Promise<OrdersSummary> {
  const sql = getSql();
  const rows = await sql<
    Array<{ status: OrderLifecycleStatus; count: string }>
  >`
    select status, count(*)::text as count
    from orders
    group by status
  `;

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
  const sql = getSql();
  const rows = await sql<OrderRow[]>`
    select
      id,
      external_id as "externalId",
      status,
      assigned_team as "assignedTeam",
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from orders
    where external_id = ${externalId}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function listOrderStatusHistory(
  orderId: number,
): Promise<OrderStatusHistoryEntry[]> {
  const sql = getSql();

  return sql<OrderStatusHistoryRow[]>`
    select
      id,
      previous_status as "previousStatus",
      next_status as "nextStatus",
      actor_email as "actorEmail",
      note,
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from order_status_history
    where order_id = ${orderId}
    order by created_at desc, id desc
  `;
}

export async function listOrderNotes(
  orderId: number,
): Promise<OrderNoteRecord[]> {
  const sql = getSql();

  return sql<OrderNoteRow[]>`
    select
      id,
      actor_email as "actorEmail",
      body,
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from order_notes
    where order_id = ${orderId}
    order by created_at desc, id desc
  `;
}

export async function updateOrderStatus(input: {
  orderId: number;
  currentStatus: OrderLifecycleStatus;
  nextStatus: OrderLifecycleStatus;
  actorEmail: string;
  note?: string;
}): Promise<boolean> {
  const sql = getSql();

  if (!canTransitionOrderStatus(input.currentStatus, input.nextStatus)) {
    return false;
  }

  const updatedRows = await sql<Array<{ id: number }>>`
    update orders
    set status = ${input.nextStatus}
    where id = ${input.orderId}
      and status = ${input.currentStatus}
    returning id
  `;

  if (updatedRows.length === 0) {
    return false;
  }

  await sql`
    insert into order_status_history (
      order_id,
      previous_status,
      next_status,
      actor_email,
      note
    )
    values (
      ${input.orderId},
      ${input.currentStatus},
      ${input.nextStatus},
      ${input.actorEmail},
      ${input.note ?? null}
    )
  `;

  return true;
}

export async function addOrderNote(input: {
  orderId: number;
  actorEmail: string;
  body: string;
}): Promise<void> {
  const sql = getSql();

  await sql`
    insert into order_notes (order_id, actor_email, body)
    values (${input.orderId}, ${input.actorEmail}, ${input.body})
  `;
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
