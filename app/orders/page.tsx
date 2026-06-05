import Link from 'next/link';

import {
  createOrdersEmptyStateMessage,
  listOrders,
  orderStatuses,
  parseOrdersFilters,
} from '../../src/modules/orders';
import { requireOrdersAccess } from '../../src/modules/auth/current-user';

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const summaryLabels = {
  total: 'Total',
  pending_review: 'Pending Review',
  processing: 'Processing',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
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
  const user = await requireOrdersAccess();
  const filters = parseOrdersFilters(await searchParams);
  const { rows, summary } = await listOrders(filters);

  return (
    <main style={{ padding: '3rem', maxWidth: '1080px', margin: '0 auto' }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em' }}>
        Orders Workspace
      </p>
      <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>
        Welcome, {user.fullName}
      </h1>
      <p style={{ lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Signed in as <strong>{user.email}</strong> with role{' '}
        <strong>{user.roleName}</strong>.
      </p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.75rem',
        }}
      >
        {Object.entries(summaryLabels).map(([key, label]) => (
          <article
            key={key}
            style={{
              border: '1px solid #ddd5c7',
              borderRadius: '16px',
              padding: '1rem',
              background: '#fffaf2',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </p>
            <p
              style={{
                margin: '0.45rem 0 0',
                fontSize: '1.8rem',
                fontWeight: 700,
              }}
            >
              {summary[key as keyof typeof summary]}
            </p>
          </article>
        ))}
      </section>

      <section
        style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.75rem' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {orderStatuses.map((status) => {
            const isActive = filters.status === status;
            return (
              <Link
                key={status}
                href={getStatusHref(status, filters.query)}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '999px',
                  textDecoration: 'none',
                  border: '1px solid #d6c8b5',
                  background: isActive ? '#1d1d1d' : '#ffffff',
                  color: isActive ? '#ffffff' : '#1d1d1d',
                }}
              >
                {status.replaceAll('_', ' ')}
              </Link>
            );
          })}
        </div>

        <form
          action="/orders"
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
        >
          <input type="hidden" name="status" value={filters.status} />
          <input
            name="query"
            defaultValue={filters.query}
            placeholder="Search order id or team"
            style={{
              flex: '1 1 280px',
              padding: '0.75rem 0.9rem',
              borderRadius: '12px',
              border: '1px solid #d6c8b5',
            }}
          />
          <button type="submit" style={{ padding: '0.75rem 1rem' }}>
            Apply
          </button>
          <Link href="/orders" style={{ alignSelf: 'center' }}>
            Reset
          </Link>
        </form>
      </section>

      {rows.length === 0 ? (
        <p style={{ lineHeight: 1.7 }}>
          {createOrdersEmptyStateMessage(filters)}
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{ textAlign: 'left', borderBottom: '1px solid #ddd5c7' }}
              >
                <th style={{ padding: '0.75rem 0.5rem' }}>Order</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Assigned Team</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: '1px solid #eee7db' }}
                >
                  <td style={{ padding: '0.9rem 0.5rem' }}>
                    {order.externalId}
                  </td>
                  <td style={{ padding: '0.9rem 0.5rem' }}>
                    {order.status.replaceAll('_', ' ')}
                  </td>
                  <td style={{ padding: '0.9rem 0.5rem' }}>
                    {order.assignedTeam}
                  </td>
                  <td style={{ padding: '0.9rem 0.5rem' }}>
                    {new Date(order.createdAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
