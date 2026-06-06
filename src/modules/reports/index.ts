import type { OrderLifecycleStatus } from '../orders';

export type ReportDefinition = {
  id: number;
  slug: string;
  name: string;
  description: string;
  createdAt: string;
};

export type ReportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ReportFilters = {
  query: string;
  status: 'all' | OrderLifecycleStatus;
};

export type ReportJobsPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ReportJob = {
  id: number;
  reportId: number;
  reportSlug: string;
  reportName: string;
  requestedByEmail: string;
  status: ReportJobStatus;
  filters: ReportFilters;
  artifactName: string | null;
  artifactContent: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

type ExportOrderRow = {
  externalId: string;
  status: OrderLifecycleStatus;
  assignedTeam: string;
  createdAt: string;
};

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function buildOrdersCsv(rows: ExportOrderRow[]): string {
  const header = 'external_id,status,assigned_team,created_at';
  const lines = rows.map((row) =>
    [row.externalId, row.status, row.assignedTeam, row.createdAt]
      .map(escapeCsvValue)
      .join(','),
  );

  return [header, ...lines].join('\n');
}
