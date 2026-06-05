export type AuditEntry = {
  id?: number;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

export function describeAuditEntry(entry: AuditEntry): string {
  switch (entry.action) {
    case 'order.status_updated':
      return `${entry.actorEmail} updated order ${entry.targetId}: ${entry.details}`;
    case 'order.note_added':
      return `${entry.actorEmail} added an order note on ${entry.targetId}`;
    case 'user.role_updated':
      return `${entry.actorEmail} changed access for ${entry.targetId}: ${entry.details}`;
    case 'user.active_toggled':
      return `${entry.actorEmail} changed user activity for ${entry.targetId}: ${entry.details}`;
    case 'report.job_requested':
      return `${entry.actorEmail} queued report job ${entry.targetId}: ${entry.details}`;
    case 'report.job_completed':
      return `${entry.actorEmail} completed report job ${entry.targetId}`;
    default:
      return `${entry.actorEmail} performed ${entry.action} on ${entry.targetType} ${entry.targetId}`;
  }
}
