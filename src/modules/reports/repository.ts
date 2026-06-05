import { getSql } from '../../lib/db';
import type { OrderRecord } from '../orders';
import type {
  ReportDefinition,
  ReportFilters,
  ReportJob,
  ReportJobStatus,
} from './index';

type ReportDefinitionRow = ReportDefinition;
type ReportJobRow = Omit<ReportJob, 'filters'> & {
  filters: ReportFilters | null;
};

type ExportOrderRow = Pick<
  OrderRecord,
  'externalId' | 'status' | 'assignedTeam' | 'createdAt'
>;

export async function listReportDefinitions(): Promise<ReportDefinition[]> {
  const sql = getSql();

  return sql<ReportDefinitionRow[]>`
    select
      id,
      slug,
      name,
      description,
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from reports
    order by name asc
  `;
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
      to_char(report_jobs.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt",
      case
        when report_jobs.started_at is null then null
        else to_char(report_jobs.started_at, 'YYYY-MM-DD"T"HH24:MI:SSOF')
      end as "startedAt",
      case
        when report_jobs.completed_at is null then null
        else to_char(report_jobs.completed_at, 'YYYY-MM-DD"T"HH24:MI:SSOF')
      end as "completedAt"
    from report_jobs
    inner join reports on reports.id = report_jobs.report_id
    order by report_jobs.created_at desc, report_jobs.id desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    ...row,
    filters: row.filters ?? { query: '', status: 'all' },
  }));
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
      to_char(report_jobs.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt",
      null::text as "startedAt",
      null::text as "completedAt"
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    filters: row.filters ?? { query: '', status: 'all' },
  };
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
      to_char(report_jobs.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt",
      to_char(report_jobs.started_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "startedAt",
      null::text as "completedAt"
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    ...row,
    filters: row.filters ?? { query: '', status: 'all' },
  };
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
): Promise<ExportOrderRow[]> {
  const sql = getSql();
  const queryValue = filters.query ? `%${filters.query}%` : null;
  const queryClause = queryValue
    ? sql`and (external_id ilike ${queryValue} or assigned_team ilike ${queryValue})`
    : sql``;
  const statusClause =
    filters.status === 'all' ? sql`` : sql`and status = ${filters.status}`;

  return sql<ExportOrderRow[]>`
    select
      external_id as "externalId",
      status,
      assigned_team as "assignedTeam",
      to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from orders
    where 1 = 1
      ${queryClause}
      ${statusClause}
    order by created_at desc, id desc
  `;
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
