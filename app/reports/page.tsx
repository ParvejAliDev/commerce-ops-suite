import Link from 'next/link';

import { requireReportsAccess } from '../../src/modules/auth/current-user';
import { orderStatuses } from '../../src/modules/orders';
import {
  listReportDefinitions,
  listReportJobs,
} from '../../src/modules/reports/repository';
import { queueReportJobAction } from './actions';

function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'Not started';
  }

  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default async function ReportsPage() {
  await requireReportsAccess();
  const [definitions, jobs] = await Promise.all([
    listReportDefinitions(),
    listReportJobs(),
  ]);

  return (
    <main style={{ padding: '3rem', maxWidth: '1080px', margin: '0 auto' }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em' }}>
        Reports Workspace
      </p>
      <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>
        Queue local CSV exports
      </h1>
      <p style={{ lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Report requests are persisted in Postgres and processed by the local
        worker container started through Docker Compose.
      </p>
      <p style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/orders">Orders workspace</Link>
        <Link href="/users">Users workspace</Link>
      </p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {definitions.map((definition) => (
          <article
            key={definition.id}
            style={{
              border: '1px solid #ddd5c7',
              borderRadius: '18px',
              padding: '1rem',
              background: '#fffaf2',
            }}
          >
            <h2 style={{ marginTop: 0 }}>{definition.name}</h2>
            <p style={{ lineHeight: 1.6 }}>{definition.description}</p>
            <form
              action={queueReportJobAction}
              style={{ display: 'grid', gap: '0.75rem' }}
            >
              <input type="hidden" name="reportSlug" value={definition.slug} />
              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span>Status filter</span>
                <select name="status" defaultValue="all">
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span>Query</span>
                <input name="query" placeholder="Search order id or team" />
              </label>
              <button type="submit" style={{ padding: '0.75rem 1rem' }}>
                Queue export job
              </button>
            </form>
          </article>
        ))}
      </section>

      <section>
        <h2 style={{ marginBottom: '0.75rem' }}>Recent Jobs</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {jobs.length === 0 ? (
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              No report jobs have been queued yet.
            </p>
          ) : (
            jobs.map((job) => (
              <article
                key={job.id}
                style={{
                  border: '1px solid #eee7db',
                  borderRadius: '16px',
                  padding: '1rem',
                  background: '#ffffff',
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {job.reportName} #{job.id}
                </p>
                <p style={{ margin: '0.35rem 0 0', color: '#5c5448' }}>
                  Requested by {job.requestedByEmail} on{' '}
                  {formatTimestamp(job.createdAt)}
                </p>
                <p style={{ margin: '0.35rem 0 0' }}>
                  Status <strong>{job.status}</strong> with query{' '}
                  <code>{job.filters.query || 'none'}</code> and status filter{' '}
                  <code>{job.filters.status}</code>.
                </p>
                <p style={{ margin: '0.35rem 0 0', color: '#5c5448' }}>
                  Started {formatTimestamp(job.startedAt)}. Completed{' '}
                  {formatTimestamp(job.completedAt)}.
                </p>
                {job.artifactContent ? (
                  <details style={{ marginTop: '0.75rem' }}>
                    <summary>
                      {job.status === 'failed'
                        ? 'View failure details'
                        : 'Preview export artifact'}
                    </summary>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        background: '#1d1d1d',
                        color: '#f8f5ef',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        overflowX: 'auto',
                      }}
                    >
                      {job.artifactContent}
                    </pre>
                  </details>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
