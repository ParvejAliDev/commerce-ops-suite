import Link from 'next/link';
import { Fragment } from 'react';
import { ArrowLeft, ArrowRight, FileSpreadsheet } from 'lucide-react';

import { DataTableCard } from '@/src/components/data-table-card';
import { ReportsAutoRefresh } from '@/src/components/reports-auto-refresh';
import { MetricCard } from '@/src/components/metric-card';
import { PageHeader } from '@/src/components/page-header';
import { SectionPanel } from '@/src/components/section-panel';
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
import {
  formatOptionalTimestamp,
  formatTimestamp,
  humanizeToken,
} from '@/src/lib/presenters';
import { requireReportsAccess } from '@/src/modules/auth/current-user';
import { orderStatuses } from '@/src/modules/orders';
import { parseReportJobsPage } from '@/src/modules/reports/pagination';
import {
  countReportJobsByStatus,
  listReportDefinitions,
  listReportJobs,
} from '@/src/modules/reports/repository';

import { queueReportJobAction } from './actions';

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

const summaryLabels = {
  total: 'Total jobs',
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
} as const;

const summaryTones = {
  total: 'neutral',
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  failed: 'destructive',
} as const;

function buildReportsHref(page?: number) {
  const params = new URLSearchParams();

  if ((page ?? 1) > 1) {
    params.set('page', String(page));
  }

  const value = params.toString();
  return value ? `/reports?${value}` : '/reports';
}

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseReportJobsPage(resolvedSearchParams.page);
  const [user, definitions, { rows: jobs, pagination }, jobCounts] =
    await Promise.all([
      requireReportsAccess(),
      listReportDefinitions(),
      listReportJobs({ page }),
      countReportJobsByStatus(),
    ]);
  const jobSummary = {
    total:
      jobCounts.pending +
      jobCounts.processing +
      jobCounts.completed +
      jobCounts.failed,
    ...jobCounts,
  };
  const shouldAutoRefresh =
    jobCounts.pending > 0 || jobCounts.processing > 0;

  return (
    <div className="flex flex-col gap-6">
      <ReportsAutoRefresh enabled={shouldAutoRefresh} />
      <PageHeader
        eyebrow="Reports workspace"
        title="Queue local CSV exports"
        description="Definition forms enqueue Postgres-backed jobs, and the local worker container turns them into downloadable artifacts."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/orders">
                Orders
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Object.entries(summaryLabels).map(([key, label]) => (
          <MetricCard
            key={key}
            label={label}
            value={jobSummary[key as keyof typeof jobSummary]}
            helper={
              key === 'total'
                ? 'Full report-job history across the local queue.'
                : undefined
            }
            tone={summaryTones[key as keyof typeof summaryTones]}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {definitions.map((definition) => (
          <SectionPanel
            key={definition.id}
            title={definition.name}
            description={definition.description}
            action={<Badge variant="outline">{definition.slug}</Badge>}
          >
            <form
              action={queueReportJobAction}
              className="grid gap-4 md:grid-cols-2"
            >
              <input type="hidden" name="reportSlug" value={definition.slug} />
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                <span>Status filter</span>
                <select
                  name="status"
                  defaultValue="all"
                  className={selectClassName}
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {humanizeToken(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                <span>Query</span>
                <Input name="query" placeholder="Search order id or team" />
              </label>
              <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  Queue the current definition against the live local dataset
                  and let the worker produce a CSV artifact.
                </p>
                <Button type="submit" className="sm:min-w-44">
                  <FileSpreadsheet data-icon="inline-start" />
                  Queue export job
                </Button>
              </div>
            </form>
          </SectionPanel>
        ))}
      </section>

      <DataTableCard
        title="Recent jobs"
        description={
          pagination.totalItems === 0
            ? 'No report jobs have been queued yet.'
            : `Showing ${pagination.startItem}-${pagination.endItem} of ${pagination.totalItems} queued jobs. Newest requests first, including query filters, lifecycle timestamps, and artifact previews.`
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Filters</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Lifecycle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <Fragment key={job.id}>
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">
                        {job.reportName} #{job.id}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {job.reportSlug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <span>
                        Query <code>{job.filters.query || 'none'}</code>
                      </span>
                      <span>
                        Status <code>{job.filters.status}</code>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {job.requestedByEmail}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(job.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <span>
                        Started {formatOptionalTimestamp(job.startedAt)}
                      </span>
                      <span>
                        Completed{' '}
                        {formatOptionalTimestamp(
                          job.completedAt,
                          'Not completed',
                        )}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
                {job.artifactContent ? (
                  <TableRow
                    key={`${job.id}-artifact`}
                    className="hover:bg-transparent"
                  >
                    <TableCell colSpan={5} className="whitespace-normal pt-0">
                      <details className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3">
                        <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                          {job.status === 'failed'
                            ? 'View failure details'
                            : 'Preview export artifact'}
                        </summary>
                        <div className="mt-3 flex flex-col gap-3">
                          {job.artifactName ? (
                            <Badge variant="outline">{job.artifactName}</Badge>
                          ) : null}
                          <pre className="overflow-x-auto rounded-2xl bg-sidebar px-4 py-3 text-xs leading-6 text-sidebar-foreground">
                            {job.artifactContent}
                          </pre>
                        </div>
                      </details>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            ))}
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="whitespace-normal py-6 text-sm text-muted-foreground"
                >
                  No report jobs have been queued yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          {pagination.totalPages > 1 ? (
            <nav
              className="flex items-center gap-2 self-start sm:self-auto"
              aria-label="Reports pagination"
            >
              {pagination.hasPreviousPage ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={buildReportsHref(pagination.page - 1)}>
                    <ArrowLeft data-icon="inline-start" />
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  <ArrowLeft data-icon="inline-start" />
                  Previous
                </Button>
              )}

              <Badge variant="outline">
                {pagination.startItem}-{pagination.endItem}
              </Badge>

              {pagination.hasNextPage ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={buildReportsHref(pagination.page + 1)}>
                    Next
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  Next
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
            </nav>
          ) : null}
        </div>
      </DataTableCard>
    </div>
  );
}
