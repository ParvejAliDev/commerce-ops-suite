import type { ReportJobStatus } from '../modules/reports';

export type ReportJobSummary = {
  total: number;
} & Record<ReportJobStatus, number>;

export function humanizeToken(value: string): string {
  const normalized = value.replaceAll('_', ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatOptionalTimestamp(
  value: string | null,
  fallback = 'Not started',
): string {
  return value ? formatTimestamp(value) : fallback;
}

export function summarizeReportJobs(
  rows: Array<Pick<{ status: ReportJobStatus }, 'status'>>,
): ReportJobSummary {
  return rows.reduce<ReportJobSummary>(
    (summary, row) => {
      summary.total += 1;
      summary[row.status] += 1;
      return summary;
    },
    {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    },
  );
}
