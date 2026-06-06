import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { orders, reportJobs, reports } from '../../db/schema';
import { getDb } from '../../lib/db';
import {
  serializeNullableTimestamp,
  serializeTimestamp,
  type TimestampInput,
} from '../../lib/timestamps';
import type { OrderRecord } from '../orders';
import { resolveReportJobsPagination } from './pagination';
import type {
  ReportDefinition,
  ReportFilters,
  ReportJob,
  ReportJobsPagination,
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

const reportDefinitionSelection = {
  createdAt: reports.createdAt,
  description: reports.description,
  id: reports.id,
  name: reports.name,
  slug: reports.slug,
} as const;

const reportJobSelection = {
  artifactContent: reportJobs.artifactContent,
  artifactName: reportJobs.artifactName,
  completedAt: reportJobs.completedAt,
  createdAt: reportJobs.createdAt,
  filters: reportJobs.filters,
  id: reportJobs.id,
  reportId: reportJobs.reportId,
  reportName: reports.name,
  reportSlug: reports.slug,
  requestedByEmail: reportJobs.requestedByEmail,
  startedAt: reportJobs.startedAt,
  status: reportJobs.status,
} as const;

const exportOrderSelection = {
  assignedTeam: orders.assignedTeam,
  createdAt: orders.createdAt,
  externalId: orders.externalId,
  status: orders.status,
} as const;

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

function mapExportOrderRow(
  row: ExportOrderRow,
): Pick<OrderRecord, 'externalId' | 'status' | 'assignedTeam' | 'createdAt'> {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
  };
}

function createEmptyReportJobCounts(): Record<ReportJobStatus, number> {
  return {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };
}

export async function listReportDefinitions(): Promise<ReportDefinition[]> {
  const db = getDb();
  const rows = await db
    .select(reportDefinitionSelection)
    .from(reports)
    .orderBy(asc(reports.name));

  return rows.map(mapReportDefinitionRow);
}

export async function listReportJobs({
  page = 1,
}: {
  page?: number;
} = {}): Promise<{
  rows: ReportJob[];
  pagination: ReportJobsPagination;
}> {
  const db = getDb();
  const totalRows = await db
    .select({ total: sql<string>`count(*)::text` })
    .from(reportJobs);
  const pagination = resolveReportJobsPagination({
    requestedPage: page,
    totalItems: Number(totalRows[0]?.total ?? 0),
  });
  const rows = await db
    .select(reportJobSelection)
    .from(reportJobs)
    .innerJoin(reports, eq(reports.id, reportJobs.reportId))
    .orderBy(desc(reportJobs.createdAt), desc(reportJobs.id))
    .limit(pagination.pageSize)
    .offset((pagination.page - 1) * pagination.pageSize);

  return {
    pagination,
    rows: rows.map(mapReportJobRow),
  };
}

export async function queueReportJob(input: {
  reportSlug: string;
  requestedByEmail: string;
  filters: ReportFilters;
}): Promise<ReportJob | null> {
  const db = getDb();
  const reportRows = await db
    .select({
      id: reports.id,
      name: reports.name,
      slug: reports.slug,
    })
    .from(reports)
    .where(eq(reports.slug, input.reportSlug))
    .limit(1);
  const report = reportRows[0];

  if (!report) {
    return null;
  }

  const rows = await db
    .insert(reportJobs)
    .values({
      filters: input.filters,
      reportId: report.id,
      requestedByEmail: input.requestedByEmail,
      status: 'pending',
    })
    .returning({
      artifactContent: reportJobs.artifactContent,
      artifactName: reportJobs.artifactName,
      completedAt: reportJobs.completedAt,
      createdAt: reportJobs.createdAt,
      filters: reportJobs.filters,
      id: reportJobs.id,
      reportId: reportJobs.reportId,
      requestedByEmail: reportJobs.requestedByEmail,
      startedAt: reportJobs.startedAt,
      status: reportJobs.status,
    });
  const row = rows[0];

  if (!row) {
    return null;
  }

  return mapReportJobRow({
    ...row,
    reportName: report.name,
    reportSlug: report.slug,
  });
}

export async function claimNextReportJob(): Promise<ReportJob | null> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const pendingRows = await tx
      .select(reportJobSelection)
      .from(reportJobs)
      .innerJoin(reports, eq(reports.id, reportJobs.reportId))
      .where(eq(reportJobs.status, 'pending'))
      .orderBy(asc(reportJobs.createdAt), asc(reportJobs.id))
      .limit(1)
      .for('update', { skipLocked: true });
    const pendingJob = pendingRows[0];

    if (!pendingJob) {
      return null;
    }

    const updatedRows = await tx
      .update(reportJobs)
      .set({
        startedAt: new Date(),
        status: 'processing',
      })
      .where(eq(reportJobs.id, pendingJob.id))
      .returning({
        artifactContent: reportJobs.artifactContent,
        artifactName: reportJobs.artifactName,
        completedAt: reportJobs.completedAt,
        createdAt: reportJobs.createdAt,
        filters: reportJobs.filters,
        id: reportJobs.id,
        reportId: reportJobs.reportId,
        requestedByEmail: reportJobs.requestedByEmail,
        startedAt: reportJobs.startedAt,
        status: reportJobs.status,
      });
    const row = updatedRows[0];

    if (!row) {
      return null;
    }

    return mapReportJobRow({
      ...row,
      reportName: pendingJob.reportName,
      reportSlug: pendingJob.reportSlug,
    });
  });
}

export async function completeReportJob(input: {
  jobId: number;
  artifactName: string;
  artifactContent: string;
}): Promise<void> {
  const db = getDb();

  await db
    .update(reportJobs)
    .set({
      artifactContent: input.artifactContent,
      artifactName: input.artifactName,
      completedAt: new Date(),
      status: 'completed',
    })
    .where(eq(reportJobs.id, input.jobId));
}

export async function failReportJob(
  jobId: number,
  failureReason: string,
): Promise<void> {
  const db = getDb();

  await db
    .update(reportJobs)
    .set({
      artifactContent: failureReason,
      completedAt: new Date(),
      status: 'failed',
    })
    .where(eq(reportJobs.id, jobId));
}

export async function listOrdersForReport(
  filters: ReportFilters,
): Promise<
  Pick<OrderRecord, 'externalId' | 'status' | 'assignedTeam' | 'createdAt'>[]
> {
  const db = getDb();
  const conditions = [];

  if (filters.query) {
    const queryValue = `%${filters.query}%`;
    conditions.push(
      or(
        ilike(orders.externalId, queryValue),
        ilike(orders.assignedTeam, queryValue),
      )!,
    );
  }

  if (filters.status !== 'all') {
    conditions.push(eq(orders.status, filters.status));
  }

  const rows = await db
    .select(exportOrderSelection)
    .from(orders)
    .where(conditions.length === 0 ? undefined : and(...conditions))
    .orderBy(desc(orders.createdAt), desc(orders.id));

  return rows.map(mapExportOrderRow);
}

export async function countReportJobsByStatus(): Promise<
  Record<ReportJobStatus, number>
> {
  const db = getDb();
  const rows = await db
    .select({
      count: sql<string>`count(*)::text`,
      status: reportJobs.status,
    })
    .from(reportJobs)
    .groupBy(reportJobs.status);

  return rows.reduce<Record<ReportJobStatus, number>>((summary, row) => {
    summary[row.status] = Number(row.count);
    return summary;
  }, createEmptyReportJobCounts());
}
