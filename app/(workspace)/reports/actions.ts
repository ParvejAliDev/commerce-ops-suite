'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { recordAuditEntry } from '@/src/modules/audit/repository';
import { requireReportsAccess } from '@/src/modules/auth/current-user';
import { orderStatuses, type OrderLifecycleStatus } from '@/src/modules/orders';
import { queueReportJob } from '@/src/modules/reports/repository';

const orderLifecycleStatuses = orderStatuses.filter(
  (status): status is OrderLifecycleStatus => status !== 'all',
);

function parseReportStatus(value: string): 'all' | OrderLifecycleStatus {
  return orderLifecycleStatuses.includes(value as OrderLifecycleStatus)
    ? (value as OrderLifecycleStatus)
    : 'all';
}

export async function queueReportJobAction(formData: FormData): Promise<void> {
  const user = await requireReportsAccess();
  const reportSlug = String(formData.get('reportSlug') ?? '').trim();
  const query = String(formData.get('query') ?? '').trim();
  const status = parseReportStatus(String(formData.get('status') ?? 'all'));

  if (!reportSlug) {
    redirect('/reports');
  }

  const job = await queueReportJob({
    reportSlug,
    requestedByEmail: user.email,
    filters: {
      query,
      status,
    },
  });

  if (job) {
    await recordAuditEntry({
      actorEmail: user.email,
      action: 'report.job_requested',
      targetType: 'report_job',
      targetId: String(job.id),
      details: `${job.reportSlug} query=${query || 'none'} status=${status}`,
    });
  }

  revalidatePath('/reports');
  redirect('/reports');
}
