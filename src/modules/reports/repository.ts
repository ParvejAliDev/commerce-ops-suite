import { getSql } from '../../lib/db';
import {
  serializeNullableTimestamp,
  serializeTimestamp,
  type TimestampInput,
} from '../../lib/timestamps';
import type { OrderRecord } from '../orders';
import type {
  ReportDefinition,
  ReportFilters,
  ReportJob,
  ReportJobStatus,
} from './index';

type ReportDefinitionRow = Omit<ReportDefinition, 'createdAt'> & {
  createdAt: TimestampInput;
};

type ReportJobRow = Omit<
  ReportJob,
  'filters' | 'createdAt' | 'startedAt' | 'completedAt'
> & {
  filters: ReportFilters | null;
  createdAt: TimestampInput;
  startedAt: TimestampInput | null;
  completedAt: TimestampInput | null;
};

type ExportOrderRow = Omit<
  Pick<OrderRecord, 'externalId' | 'status' | 'assignedTeam' | 'createdAt'>,
  'createdAt'
> & {
  createdAt: TimestampInput;
};

function mapReportDefinitionRow(row: ReportDefinitionRow): ReportDefinition {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
  };
}

function mapReportJobRow(row: ReportJobRow): ReportJob {
  return {
    ...row,
    filters: row.filters ?? { query: '', status: 'all' },
    createdAt: serializeTimestamp(row.createdAt),
    startedAt: serializeNullableTimestamp(row.startedAt),
    completedAt: serializeNullableTimestamp(row.completedAt),
  };
}

function mapExportOrderRow(row: ExportOrderRow): Pick<
  OrderRecord,
  'externalId' | 'status' | 'assignedTeam' | 'createdAt'
> {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
  };
}

export async function listReportDefinitions(): Promise<ReportDefinition[]> {
  const sql = getSql();

  const rows = await sql<ReportDefinitionRow[]>`
    select
      id,
      slug,
      name,
      description,
      created_at as "createdAt"
    from reports
    order by name asc
  `;

  return rows.map(mapReportDefinitionRow);
}

export async function listReportJobs(limit = 20): Promise<ReportJob[]> {
  const sql = getSql();
  const rows = await sql<ReportJobRow[]>`
    select
      report_jobs.id,
      report_jobs.report_id as "reportId",
      reports.slug as "reportSlug",
      reports.name as "reportName",
      report_jobs.requested_by_email as "requestedByEmail",
      report_jobs.status,
      report_jobs.filters,
      report_jobs.artifact_name as "artifactName",
      report_jobs.artifact_content as "artifactContent",
      report_jobs.created_at as "createdAt",
      report_jobs.started_at as "startedAt",
      report_jobs.completed_at as "completedAt"
    from report_jobs
    inner join reports on reports.id = report_jobs.report_id
    order by report_jobs.created_at desc, report_jobs.id desc
    limit ${limit}
  `;

  return rows.map(mapReportJobRow);
}

export async function queueReportJob(input: {
  reportSlug: string;
  requestedByEmail: string;
  filters: ReportFilters;
}): Promise<ReportJob | null> {
  const sql = getSql();
  const rows = await sql<ReportJobRow[]>`
    insert into report_jobs (
      report_id,
      requested_by_email,
      status,
      filters
    )
    select
      reports.id,
      ${input.requestedByEmail},
      'pending',
      ${sql.json(input.filters)}
    from reports
    where reports.slug = ${input.reportSlug}
    returning
      report_jobs.id,
      report_jobs.report_id as "reportId",
      ${input.reportSlug} as "reportSlug",
      (
        select reports.name
        from reports
        where reports.id = report_jobs.report_id
      ) as "reportName",
      report_jobs.requested_by_email as "requestedByEmail",
      report_jobs.status,
      report_jobs.filters,
      report_jobs.artifact_name as "artifactName",
      report_jobs.artifact_content as "artifactContent",
      report_jobs.created_at as "createdAt",
      null::timestamptz as "startedAt",
      null::timestamptz as "completedAt"
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return mapReportJobRow(row);
}

export async function claimNextReportJob(): Promise<ReportJob | null> {
  const sql = getSql();
  const rows = await sql<ReportJobRow[]>`
    with next_job as (
      select id, report_id
      from report_jobs
      where status = 'pending'
      order by created_at asc, id asc
      limit 1
      for update skip locked
    )
    update report_jobs
    set
      status = 'processing',
      started_at = now()
    from next_job
    inner join reports on reports.id = next_job.report_id
    where report_jobs.id = next_job.id
    returning
      report_jobs.id,
      report_jobs.report_id as "reportId",
      reports.slug as "reportSlug",
      reports.name as "reportName",
      report_jobs.requested_by_email as "requestedByEmail",
      report_jobs.status,
      report_jobs.filters,
      report_jobs.artifact_name as "artifactName",
      report_jobs.artifact_content as "artifactContent",
      report_jobs.created_at as "createdAt",
      report_jobs.started_at as "startedAt",
      null::timestamptz as "completedAt"
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return mapReportJobRow(row);
}

export async function completeReportJob(input: {
  jobId: number;
  artifactName: string;
  artifactContent: string;
}): Promise<void> {
  const sql = getSql();

  await sql`
    update report_jobs
    set
      status = 'completed',
      artifact_name = ${input.artifactName},
      artifact_content = ${input.artifactContent},
      completed_at = now()
    where id = ${input.jobId}
  `;
}

export async function failReportJob(
  jobId: number,
  failureReason: string,
): Promise<void> {
  const sql = getSql();

  await sql`
    update report_jobs
    set
      status = 'failed',
      artifact_content = ${failureReason},
      completed_at = now()
    where id = ${jobId}
  `;
}

export async function listOrdersForReport(
  filters: ReportFilters,
): Promise<
  Pick<OrderRecord, 'externalId' | 'status' | 'assignedTeam' | 'createdAt'>[]
> {
  const sql = getSql();
  const queryValue = filters.query ? `%${filters.query}%` : null;
  const queryClause = queryValue
    ? sql`and (external_id ilike ${queryValue} or assigned_team ilike ${queryValue})`
    : sql``;
  const statusClause =
    filters.status === 'all' ? sql`` : sql`and status = ${filters.status}`;

  const rows = await sql<ExportOrderRow[]>`
    select
      external_id as "externalId",
      status,
      assigned_team as "assignedTeam",
      created_at as "createdAt"
    from orders
    where 1 = 1
      ${queryClause}
      ${statusClause}
    order by created_at desc, id desc
  `;

  return rows.map(mapExportOrderRow);
}

export async function countReportJobsByStatus(): Promise<
  Record<ReportJobStatus, number>
> {
  const sql = getSql();
  const rows = await sql<Array<{ status: ReportJobStatus; count: string }>>`
    select status, count(*)::text as count
    from report_jobs
    group by status
  `;

  return rows.reduce<Record<ReportJobStatus, number>>(
    (summary, row) => {
      summary[row.status] = Number(row.count);
      return summary;
    },
    {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    },
  );
}
