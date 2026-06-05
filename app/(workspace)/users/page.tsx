import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { AuditTimeline } from '@/src/components/audit-timeline';
import { DataTableCard } from '@/src/components/data-table-card';
import { MetricCard } from '@/src/components/metric-card';
import { PageHeader } from '@/src/components/page-header';
import { StatusBadge } from '@/src/components/status-badge';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { describeAuditEntry } from '@/src/modules/audit';
import { listRecentAuditEntries } from '@/src/modules/audit/repository';
import { canManageUsers } from '@/src/modules/auth/access';
import { requireUsersAccess } from '@/src/modules/auth/current-user';
import { formatTimestamp, humanizeToken } from '@/src/lib/presenters';
import { summarizeUsersByRole } from '@/src/modules/users';
import { listUsers } from '@/src/modules/users/repository';

import { toggleUserActiveAction, updateUserRoleAction } from './actions';

const roleNames = ['admin', 'operations', 'viewer'] as const;
const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export default async function UsersPage() {
  const user = await requireUsersAccess();
  const [rows, auditEntries] = await Promise.all([
    listUsers(),
    listRecentAuditEntries(12),
  ]);
  const summary = summarizeUsersByRole(rows);
  const mayManage = canManageUsers(user);
  const userAuditEntries = auditEntries.filter(
    (entry) => entry.targetType === 'user',
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Users workspace"
        title="Access roster and role controls"
        description="Manage local operator access, review the active roster, and inspect privileged changes without leaving the cockpit."
        actions={
          <>
            <Badge variant="outline">
              {mayManage ? 'Admin controls enabled' : 'Read-only access'}
            </Badge>
            <Button asChild variant="outline">
              <Link href="/orders">
                Orders
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/reports">
                Reports
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total users" value={summary.total} />
        <MetricCard
          label="Active users"
          value={summary.active}
          tone="success"
        />
        <MetricCard
          label="Inactive users"
          value={summary.inactive}
          tone="destructive"
        />
        <MetricCard
          label="Admins"
          value={summary.byRole.admin}
          tone="primary"
        />
        <MetricCard
          label="Operations"
          value={summary.byRole.operations}
          tone="warning"
        />
        <MetricCard
          label="Viewers"
          value={summary.byRole.viewer}
          tone="neutral"
        />
      </section>

      <DataTableCard
        title="Current roster"
        description="Edit roles and active state in place when your current permissions allow it."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">
                      {row.fullName}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      User #{row.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell className="whitespace-normal">
                  {mayManage ? (
                    <form
                      action={updateUserRoleAction}
                      className="flex flex-col gap-2 sm:flex-row"
                    >
                      <input type="hidden" name="userId" value={row.id} />
                      <select
                        name="roleName"
                        defaultValue={row.roleName}
                        className={selectClassName}
                      >
                        {roleNames.map((roleName) => (
                          <option key={roleName} value={roleName}>
                            {humanizeToken(roleName)}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                    </form>
                  ) : (
                    <Badge variant="outline">
                      {humanizeToken(row.roleName)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <StatusBadge
                      status={row.isActive ? 'active' : 'inactive'}
                    />
                    {mayManage ? (
                      <form action={toggleUserActiveAction}>
                        <input type="hidden" name="userId" value={row.id} />
                        <input
                          type="hidden"
                          name="nextIsActive"
                          value={row.isActive ? 'false' : 'true'}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant={row.isActive ? 'destructive' : 'secondary'}
                        >
                          {row.isActive ? 'Disable' : 'Reactivate'}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatTimestamp(row.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableCard>

      <DataTableCard
        title="Recent access audit"
        description="Latest privileged user-management events recorded by the app."
      >
        <AuditTimeline
          items={userAuditEntries.map((entry) => ({
            id: `${entry.id}-${entry.createdAt}`,
            title: describeAuditEntry(entry),
            body: entry.details,
            meta: formatTimestamp(entry.createdAt),
          }))}
          emptyMessage="No user-management audit activity recorded yet."
        />
      </DataTableCard>
    </div>
  );
}
