import Link from 'next/link';
import { notFound } from 'next/navigation';

import { describeAuditEntry } from '../../../src/modules/audit';
import { listAuditEntriesForTarget } from '../../../src/modules/audit/repository';
import { canUpdateOrders } from '../../../src/modules/auth/access';
import { requireOrdersAccess } from '../../../src/modules/auth/current-user';
import { getOrderWorkflowDetail } from '../../../src/modules/orders';
import { addOrderNoteAction, updateOrderStatusAction } from './actions';

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const user = await requireOrdersAccess();
  const { orderId } = await params;
  const detail = await getOrderWorkflowDetail(orderId);

  if (!detail) {
    notFound();
  }

  const auditEntries = await listAuditEntriesForTarget(
    'order',
    detail.order.externalId,
  );
  const mayUpdate = canUpdateOrders(user);

  return (
    <main style={{ padding: '3rem', maxWidth: '1080px', margin: '0 auto' }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em' }}>
        Order Detail
      </p>
      <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>
        {detail.order.externalId}
      </h1>
      <p style={{ lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Status <strong>{detail.order.status.replaceAll('_', ' ')}</strong> with
        ownership in <strong>{detail.order.assignedTeam}</strong>.
      </p>
      <p style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/orders">Back to orders</Link>
        <Link href="/reports">Reports workspace</Link>
        {user.permissions.includes('users:read') ? (
          <Link href="/users">Users workspace</Link>
        ) : null}
      </p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '2rem',
        }}
      >
        <article
          style={{
            border: '1px solid #ddd5c7',
            borderRadius: '18px',
            padding: '1rem',
            background: '#fffaf2',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Workflow</h2>
          <p style={{ lineHeight: 1.6 }}>
            Created {formatTimestamp(detail.order.createdAt)}.
          </p>
          {mayUpdate ? (
            detail.nextStatuses.length > 0 ? (
              <form
                action={updateOrderStatusAction}
                style={{ display: 'grid', gap: '0.75rem' }}
              >
                <input
                  type="hidden"
                  name="orderId"
                  value={detail.order.externalId}
                />
                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Next status</span>
                  <select
                    name="nextStatus"
                    defaultValue={detail.nextStatuses[0]}
                  >
                    {detail.nextStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>Shift note</span>
                  <textarea
                    name="note"
                    rows={3}
                    placeholder="Capture why this status changed"
                  />
                </label>
                <button type="submit" style={{ padding: '0.75rem 1rem' }}>
                  Update status
                </button>
              </form>
            ) : (
              <p style={{ lineHeight: 1.6 }}>
                This order is closed and has no further status transitions.
              </p>
            )
          ) : (
            <p style={{ lineHeight: 1.6 }}>
              You have read-only access to this workflow.
            </p>
          )}
        </article>

        <article
          style={{
            border: '1px solid #ddd5c7',
            borderRadius: '18px',
            padding: '1rem',
            background: '#ffffff',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Operator Notes</h2>
          {mayUpdate ? (
            <form
              action={addOrderNoteAction}
              style={{ display: 'grid', gap: '0.75rem' }}
            >
              <input
                type="hidden"
                name="orderId"
                value={detail.order.externalId}
              />
              <textarea
                name="body"
                rows={4}
                placeholder="Add context for the next operator"
              />
              <button type="submit" style={{ padding: '0.75rem 1rem' }}>
                Save note
              </button>
            </form>
          ) : null}
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            {detail.notes.length === 0 ? (
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                No operator notes recorded yet.
              </p>
            ) : (
              detail.notes.map((note) => (
                <article
                  key={note.id}
                  style={{
                    borderTop: '1px solid #eee7db',
                    paddingTop: '0.75rem',
                  }}
                >
                  <p style={{ margin: 0, lineHeight: 1.6 }}>{note.body}</p>
                  <p style={{ margin: '0.35rem 0 0', color: '#5c5448' }}>
                    {note.actorEmail} at {formatTimestamp(note.createdAt)}
                  </p>
                </article>
              ))
            )}
          </div>
        </article>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <article
          style={{
            border: '1px solid #ddd5c7',
            borderRadius: '18px',
            padding: '1rem',
            background: '#ffffff',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Status History</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {detail.statusHistory.length === 0 ? (
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                No transitions have been recorded yet.
              </p>
            ) : (
              detail.statusHistory.map((entry) => (
                <article
                  key={entry.id}
                  style={{
                    borderTop: '1px solid #eee7db',
                    paddingTop: '0.75rem',
                  }}
                >
                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                    {entry.previousStatus.replaceAll('_', ' ')} to{' '}
                    {entry.nextStatus.replaceAll('_', ' ')}
                  </p>
                  <p style={{ margin: '0.35rem 0 0', color: '#5c5448' }}>
                    {entry.actorEmail} at {formatTimestamp(entry.createdAt)}
                  </p>
                  {entry.note ? (
                    <p style={{ margin: '0.35rem 0 0', color: '#5c5448' }}>
                      {entry.note}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </article>

        <article
          style={{
            border: '1px solid #ddd5c7',
            borderRadius: '18px',
            padding: '1rem',
            background: '#ffffff',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Audit Trail</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {auditEntries.length === 0 ? (
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                No audit entries recorded yet.
              </p>
            ) : (
              auditEntries.map((entry) => (
                <article
                  key={`${entry.id}-${entry.createdAt}`}
                  style={{
                    borderTop: '1px solid #eee7db',
                    paddingTop: '0.75rem',
                  }}
                >
                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                    {describeAuditEntry(entry)}
                  </p>
                  <p style={{ margin: '0.35rem 0 0', color: '#5c5448' }}>
                    {formatTimestamp(entry.createdAt)}
                  </p>
                </article>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
