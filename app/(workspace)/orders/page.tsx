import Link from 'next/link';
import { ArrowRight, RefreshCcw, Search } from 'lucide-react';

import { DataTableCard } from '@/src/components/data-table-card';
import { EmptyState } from '@/src/components/empty-state';
import { FilterBar } from '@/src/components/filter-bar';
import { MetricCard } from '@/src/components/metric-card';
import { PageHeader } from '@/src/components/page-header';
import { StatusBadge } from '@/src/components/status-badge';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { formatTimestamp, humanizeToken } from '@/src/lib/presenters';
import { canAccessUsers } from '@/src/modules/auth/access';
import { requireOrdersAccess } from '@/src/modules/auth/current-user';
import {
  createOrdersEmptyStateMessage,
  listOrders,
  orderStatuses,
  parseOrdersFilters,
} from '@/src/modules/orders';

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const summaryLabels = {
  total: 'Total orders',
  pending_review: 'Pending review',
  processing: 'Processing',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
} as const;

const summaryTones = {
  total: 'neutral',
  pending_review: 'warning',
  processing: 'primary',
  shipped: 'success',
  cancelled: 'destructive',
} as const;

function getStatusHref(status: string, query: string) {
  const params = new URLSearchParams();
  if (status !== 'all') {
    params.set('status', status);
  }
  if (query) {
    params.set('query', query);
  }

  const value = params.toString();
  return value ? `/orders?${value}` : '/orders';
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const filters = parseOrdersFilters(await searchParams);
  const [user, { rows, summary }] = await Promise.all([
    requireOrdersAccess(),
    listOrders(filters),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Orders workspace"
        title="Primary workflow queue"
        description="Monitor state changes, search by order or team, and hand work to the next operator without leaving the local stack."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/reports">
                Reports
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            {canAccessUsers(user) ? (
              <Button asChild variant="ghost">
                <Link href="/users">
                  Users
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Object.entries(summaryLabels).map(([key, label]) => (
          <MetricCard
            key={key}
            label={label}
            value={summary[key as keyof typeof summary]}
            helper={
              key === 'total'
                ? 'Current scope across the local order queue.'
                : undefined
            }
            tone={summaryTones[key as keyof typeof summaryTones]}
          />
        ))}
      </section>

      <FilterBar className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {orderStatuses.map((status) => {
            const isActive = filters.status === status;

            return (
              <Button
                key={status}
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className="rounded-2xl"
              >
                <Link href={getStatusHref(status, filters.query)}>
                  {humanizeToken(status)}
                </Link>
              </Button>
            );
          })}
        </div>

        <form
          action="/orders"
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]"
        >
          <input type="hidden" name="status" value={filters.status} />
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Search scope
            </span>
            <Input
              name="query"
              defaultValue={filters.query}
              placeholder="Search order id or team"
            />
          </label>
          <Button type="submit" className="self-end lg:min-w-36">
            <Search data-icon="inline-start" />
            Apply filters
          </Button>
          <Button asChild variant="outline" className="self-end lg:min-w-32">
            <Link href="/orders">
              <RefreshCcw data-icon="inline-start" />
              Reset
            </Link>
          </Button>
        </form>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState
          title="No orders match this view"
          description={createOrdersEmptyStateMessage(filters)}
          action={
            <Button asChild variant="outline">
              <Link href="/orders">Reset filters</Link>
            </Button>
          }
        />
      ) : (
        <DataTableCard
          title="Orders in scope"
          description={`Showing ${rows.length} orders for ${humanizeToken(filters.status)}${filters.query ? ` with query "${filters.query}"` : ''}.`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned team</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/orders/${order.externalId}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {order.externalId}
                      </Link>
                      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Local workflow detail
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.assignedTeam}</Badge>
                  </TableCell>
                  <TableCell>{formatTimestamp(order.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/orders/${order.externalId}`}>
                        Open
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableCard>
      )}
    </div>
  );
}
