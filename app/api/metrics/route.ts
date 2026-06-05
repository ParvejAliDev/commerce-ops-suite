import { countOrdersByStatus } from '@/src/modules/orders';
import { countReportJobsByStatus } from '@/src/modules/reports/repository';
import { summarizeUsersByRole } from '@/src/modules/users';
import { listUsers } from '@/src/modules/users/repository';

function renderMetric(
  name: string,
  value: number,
  labels?: Record<string, string>,
): string {
  if (!labels) {
    return `${name} ${value}`;
  }

  const renderedLabels = Object.entries(labels)
    .map(([key, labelValue]) => `${key}="${labelValue}"`)
    .join(',');

  return `${name}{${renderedLabels}} ${value}`;
}

export async function GET() {
  try {
    const [orderSummary, reportJobs, users] = await Promise.all([
      countOrdersByStatus(),
      countReportJobsByStatus(),
      listUsers(),
    ]);
    const userSummary = summarizeUsersByRole(users);

    const lines = [
      '# HELP commerce_orders_total Total orders in the local operations workspace',
      '# TYPE commerce_orders_total gauge',
      renderMetric('commerce_orders_total', orderSummary.total),
      renderMetric('commerce_orders_by_status', orderSummary.pending_review, {
        status: 'pending_review',
      }),
      renderMetric('commerce_orders_by_status', orderSummary.processing, {
        status: 'processing',
      }),
      renderMetric('commerce_orders_by_status', orderSummary.shipped, {
        status: 'shipped',
      }),
      renderMetric('commerce_orders_by_status', orderSummary.cancelled, {
        status: 'cancelled',
      }),
      '# HELP commerce_users_total Total local dashboard users',
      '# TYPE commerce_users_total gauge',
      renderMetric('commerce_users_total', userSummary.total),
      renderMetric('commerce_users_active_total', userSummary.active),
      renderMetric('commerce_users_inactive_total', userSummary.inactive),
      renderMetric('commerce_users_by_role', userSummary.byRole.admin, {
        role: 'admin',
      }),
      renderMetric('commerce_users_by_role', userSummary.byRole.operations, {
        role: 'operations',
      }),
      renderMetric('commerce_users_by_role', userSummary.byRole.viewer, {
        role: 'viewer',
      }),
      '# HELP commerce_report_jobs_total Total report jobs by status',
      '# TYPE commerce_report_jobs_total gauge',
      renderMetric('commerce_report_jobs_total', reportJobs.pending, {
        status: 'pending',
      }),
      renderMetric('commerce_report_jobs_total', reportJobs.processing, {
        status: 'processing',
      }),
      renderMetric('commerce_report_jobs_total', reportJobs.completed, {
        status: 'completed',
      }),
      renderMetric('commerce_report_jobs_total', reportJobs.failed, {
        status: 'failed',
      }),
    ];

    return new Response(`${lines.join('\n')}\n`, {
      headers: {
        'content-type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  } catch (error) {
    return new Response(
      `# metrics unavailable\ncommerce_metrics_up 0\n# error ${error instanceof Error ? error.message : 'unknown'}\n`,
      {
        status: 503,
        headers: {
          'content-type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      },
    );
  }
}
