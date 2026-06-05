export const seededUsers = [
  {
    email: 'ops.local@example.com',
    fullName: 'Ops Lead',
    roleName: 'operations',
  },
  {
    email: 'viewer.local@example.com',
    fullName: 'Read Only Analyst',
    roleName: 'viewer',
  },
] as const;

export const seededReports = [
  {
    slug: 'orders-daily-export',
    name: 'Daily Orders Export',
    description:
      'Full operational order export for handoffs and spreadsheet reviews.',
  },
  {
    slug: 'orders-exceptions-export',
    name: 'Exceptions Export',
    description: 'Focused export for pending review and cancelled work queues.',
  },
] as const;

export const seededOrders = [
  {
    externalId: 'ORD-1001',
    status: 'pending_review',
    assignedTeam: 'ops-core',
  },
  {
    externalId: 'ORD-1002',
    status: 'processing',
    assignedTeam: 'ops-core',
  },
  {
    externalId: 'ORD-1003',
    status: 'shipped',
    assignedTeam: 'warehouse-east',
  },
  {
    externalId: 'ORD-1004',
    status: 'cancelled',
    assignedTeam: 'ops-escalations',
  },
] as const;
