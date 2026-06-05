import { getSql } from '../../lib/db';
import type { OrderRecord, OrdersFilters, OrdersSummary } from './types';

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
  status: OrderRecord['status'];
  assignedTeam: string;
  createdAt: string;
};

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
