import type { ReportJobsPagination } from './index';

export const DEFAULT_REPORT_JOBS_PAGE_SIZE = 20;

export function parseReportJobsPage(input: unknown): number {
  if (typeof input === 'number' && Number.isInteger(input) && input > 0) {
    return input;
  }

  if (typeof input === 'string') {
    const parsed = Number.parseInt(input, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 1;
}

export function resolveReportJobsPagination(input: {
  requestedPage: number;
  totalItems: number;
  pageSize?: number;
}): ReportJobsPagination {
  const pageSize = Math.max(1, input.pageSize ?? DEFAULT_REPORT_JOBS_PAGE_SIZE);
  const totalPages =
    input.totalItems === 0 ? 1 : Math.ceil(input.totalItems / pageSize);
  const page = Math.min(Math.max(1, input.requestedPage), totalPages);
  const startItem = input.totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem =
    input.totalItems === 0 ? 0 : Math.min(input.totalItems, page * pageSize);

  return {
    endItem,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    page,
    pageSize,
    startItem,
    totalItems: input.totalItems,
    totalPages,
  };
}
