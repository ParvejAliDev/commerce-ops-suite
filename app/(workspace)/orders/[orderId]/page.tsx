import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';

import { AuditTimeline } from '@/src/components/audit-timeline';
import { MetricCard } from '@/src/components/metric-card';
import { PageHeader } from '@/src/components/page-header';
import { SectionPanel } from '@/src/components/section-panel';
import { StatusBadge, getStatusBadgeTone } from '@/src/components/status-badge';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { describeAuditEntry, type AuditEntry } from '@/src/modules/audit';
import { listAuditEntriesForTarget } from '@/src/modules/audit/repository';
import { canUpdateOrders } from '@/src/modules/auth/access';
import { requireOrdersAccess } from '@/src/modules/auth/current-user';
import { getOrderWorkflowDetail } from '@/src/modules/orders';
import { formatTimestamp, humanizeToken } from '@/src/lib/presenters';

import { addOrderNoteAction, updateOrderStatusAction } from './actions';

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

function toAuditItems(entries: AuditEntry[]) {
  return entries.map((entry) => ({
    id: `${entry.id ?? entry.createdAt}-${entry.action}`,
    title: describeAuditEntry(entry),
    meta: formatTimestamp(entry.createdAt),
  }));
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { orderId } = await params;
  const [user, detail] = await Promise.all([
    requireOrdersAccess(),
    getOrderWorkflowDetail(orderId),
  ]);

  if (!detail) {
    notFound();
  }

  const auditEntries = await listAuditEntriesForTarget(
    'order',
    detail.order.externalId,
  );
  const mayUpdate = canUpdateOrders(user);
  const orderTone = getStatusBadgeTone(detail.order.status);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Order detail"
        title={detail.order.externalId}
        description={`Current status is ${humanizeToken(detail.order.status)} with ownership in ${detail.order.assignedTeam}.`}
        actions={
          <>
            <StatusBadge status={detail.order.status} />
            <Button asChild variant="outline">
              <Link href="/orders">
                <ArrowLeft data-icon="inline-start" />
                Back to orders
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/reports">
                Reports
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            {user.permissions.includes('users:read') ? (
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Current state"
          value={humanizeToken(detail.order.status)}
          helper={`Updated inside the active workflow chain.`}
          tone={orderTone}
        />
        <MetricCard
          label="Assigned team"
          value={detail.order.assignedTeam}
          helper="Current ownership lane for this order."
          tone="primary"
        />
        <MetricCard
          label="Remaining transitions"
          value={detail.nextStatuses.length}
          helper={
            detail.nextStatuses.length > 0
              ? 'Available next states from the current status.'
              : 'This workflow has reached a terminal state.'
          }
          tone={detail.nextStatuses.length > 0 ? 'warning' : 'neutral'}
        />
        <MetricCard
          label="Opened"
          value={formatTimestamp(detail.order.createdAt)}
          helper="Original queue entry timestamp."
          tone="neutral"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SectionPanel
          title="Workflow transitions"
          description="Move the order through its next valid state and capture the shift note for the next operator."
          action={
            <Badge variant="outline">
              {mayUpdate ? 'Write access' : 'Read only'}
            </Badge>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
              <StatusBadge status={detail.order.status} />
              <span>Created {formatTimestamp(detail.order.createdAt)}</span>
            </div>

            {mayUpdate ? (
              detail.nextStatuses.length > 0 ? (
                <form
                  action={updateOrderStatusAction}
                  className="flex flex-col gap-4"
                >
                  <input
                    type="hidden"
                    name="orderId"
                    value={detail.order.externalId}
                  />
                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    <span>Next status</span>
                    <select
                      name="nextStatus"
                      defaultValue={detail.nextStatuses[0]}
                      className={selectClassName}
                    >
                      {detail.nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {humanizeToken(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    <span>Shift note</span>
                    <Textarea
                      name="note"
                      rows={4}
                      placeholder="Capture why this status changed"
                    />
                  </label>
                  <Button type="submit" className="w-full sm:w-fit">
                    Update status
                  </Button>
                </form>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  This order is closed and has no further status transitions.
                </p>
              )
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                You have read-only access to this workflow.
              </p>
            )}
          </div>
        </SectionPanel>

        <SectionPanel
          title="Operator notes"
          description="Record handoff context, exceptions, or customer-impact detail for the next shift."
        >
          <div className="flex flex-col gap-5">
            {mayUpdate ? (
              <form action={addOrderNoteAction} className="flex flex-col gap-4">
                <input
                  type="hidden"
                  name="orderId"
                  value={detail.order.externalId}
                />
                <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                  <span>Note body</span>
                  <Textarea
                    name="body"
                    rows={5}
                    placeholder="Add context for the next operator"
                  />
                </label>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full sm:w-fit"
                >
                  Save note
                </Button>
              </form>
            ) : null}

            <AuditTimeline
              items={detail.notes.map((note) => ({
                id: String(note.id),
                title: note.actorEmail,
                body: note.body,
                meta: formatTimestamp(note.createdAt),
              }))}
              emptyMessage="No operator notes recorded yet."
            />
          </div>
        </SectionPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionPanel
          title="Status history"
          description="Every transition recorded for this order in chronological order."
        >
          <AuditTimeline
            items={detail.statusHistory.map((entry) => ({
              id: String(entry.id),
              title: `${humanizeToken(entry.previousStatus)} to ${humanizeToken(entry.nextStatus)}`,
              body: entry.note
                ? `${entry.actorEmail}: ${entry.note}`
                : entry.actorEmail,
              meta: formatTimestamp(entry.createdAt),
            }))}
            emptyMessage="No transitions have been recorded yet."
          />
        </SectionPanel>

        <SectionPanel
          title="Audit trail"
          description="Cross-workspace audit events attached to this order target."
        >
          <AuditTimeline
            items={toAuditItems(auditEntries)}
            emptyMessage="No audit entries recorded yet."
          />
        </SectionPanel>
      </section>
    </div>
  );
}
