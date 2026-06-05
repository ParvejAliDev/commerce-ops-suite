import { describe, expect, it } from 'vitest';

import {
  formatOptionalTimestamp,
  humanizeToken,
  summarizeReportJobs,
} from '../../src/lib/presenters';

describe('humanizeToken', () => {
  it('converts underscored values into readable labels', () => {
    expect(humanizeToken('pending_review')).toBe('Pending review');
    expect(humanizeToken('report.job_requested')).toBe('Report.job requested');
  });
});

describe('summarizeReportJobs', () => {
  it('counts jobs by status for cockpit metrics', () => {
    expect(
      summarizeReportJobs([
        { status: 'pending' },
        { status: 'pending' },
        { status: 'processing' },
        { status: 'completed' },
        { status: 'failed' },
      ]),
    ).toEqual({
      total: 5,
      pending: 2,
      processing: 1,
      completed: 1,
      failed: 1,
    });
  });
});

describe('formatOptionalTimestamp', () => {
  it('falls back cleanly for empty lifecycle values', () => {
    expect(formatOptionalTimestamp(null)).toBe('Not started');
    expect(formatOptionalTimestamp(null, 'Unavailable')).toBe('Unavailable');
  });
});
