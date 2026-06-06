import { describe, expect, it } from 'vitest';

import {
  DEFAULT_REPORT_JOBS_PAGE_SIZE,
  parseReportJobsPage,
  resolveReportJobsPagination,
} from '../../src/modules/reports/pagination';

describe('parseReportJobsPage', () => {
  it('parses positive page numbers from search params', () => {
    expect(parseReportJobsPage('4')).toBe(4);
  });

  it('normalizes invalid page values back to page 1', () => {
    expect(parseReportJobsPage('0')).toBe(1);
    expect(parseReportJobsPage('abc')).toBe(1);
  });
});

describe('resolveReportJobsPagination', () => {
  it('computes ranges for a middle page', () => {
    expect(
      resolveReportJobsPagination({ requestedPage: 2, totalItems: 45 }),
    ).toEqual({
      endItem: 40,
      hasNextPage: true,
      hasPreviousPage: true,
      page: 2,
      pageSize: DEFAULT_REPORT_JOBS_PAGE_SIZE,
      startItem: 21,
      totalItems: 45,
      totalPages: 3,
    });
  });

  it('clamps oversized page requests to the last page', () => {
    expect(
      resolveReportJobsPagination({ requestedPage: 99, totalItems: 45 }),
    ).toMatchObject({
      endItem: 45,
      hasNextPage: false,
      hasPreviousPage: true,
      page: 3,
      startItem: 41,
      totalPages: 3,
    });
  });

  it('keeps empty result sets on page 1', () => {
    expect(
      resolveReportJobsPagination({ requestedPage: 4, totalItems: 0 }),
    ).toEqual({
      endItem: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      page: 1,
      pageSize: DEFAULT_REPORT_JOBS_PAGE_SIZE,
      startItem: 0,
      totalItems: 0,
      totalPages: 1,
    });
  });
});
