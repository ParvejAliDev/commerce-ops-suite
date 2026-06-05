import { endSql } from '../lib/db';
import { getEnv } from '../lib/env';
import { recordAuditEntry } from '../modules/audit/repository';
import { buildOrdersCsv } from '../modules/reports';
import {
  claimNextReportJob,
  completeReportJob,
  failReportJob,
  listOrdersForReport,
} from '../modules/reports/repository';

const POLL_INTERVAL_MS = 10000;

async function processNextReportJob(): Promise<boolean> {
  const job = await claimNextReportJob();
  if (!job) {
    return false;
  }

  try {
    const rows = await listOrdersForReport(job.filters);
    const artifactName = `${job.reportSlug}-${job.id}.csv`;
    const artifactContent = buildOrdersCsv(rows);

    await completeReportJob({
      jobId: job.id,
      artifactName,
      artifactContent,
    });

    await recordAuditEntry({
      actorEmail: job.requestedByEmail,
      action: 'report.job_completed',
      targetType: 'report_job',
      targetId: String(job.id),
      details: `${rows.length} rows exported`,
    });

    console.log('[worker] processed report job', {
      jobId: job.id,
      rows: rows.length,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await failReportJob(job.id, message);
    console.error('[worker] failed report job', {
      jobId: job.id,
      error: message,
    });
    return true;
  }
}

async function poll(): Promise<void> {
  const processed = await processNextReportJob();
  if (!processed) {
    console.log('[worker] heartbeat', new Date().toISOString());
  }
}

async function main() {
  const env = getEnv(process.env);
  console.log('[worker] starting ops worker', {
    databaseUrl: env.DATABASE_URL.replace(/:[^:@/]+@/, ':***@'),
    redisUrl: env.REDIS_URL,
    pollIntervalMs: POLL_INTERVAL_MS,
  });

  await poll();
  const interval = setInterval(() => {
    void poll();
  }, POLL_INTERVAL_MS);

  const shutdown = async () => {
    clearInterval(interval);
    await endSql();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });

  process.on('SIGINT', () => {
    void shutdown();
  });
}

main().catch(async (error) => {
  console.error(error);
  await endSql();
  process.exit(1);
});
