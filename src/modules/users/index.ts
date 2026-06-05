import type { RoleName } from '../rbac';

export type UserListItem = {
  id: number;
  email: string;
  fullName: string;
  roleName: RoleName;
  isActive: boolean;
  createdAt: string;
};

export type UsersSummary = {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<RoleName, number>;
};

export function summarizeUsersByRole(
  rows: Pick<UserListItem, 'roleName' | 'isActive'>[],
): UsersSummary {
  return rows.reduce<UsersSummary>(
    (summary, row) => {
      summary.total += 1;
      summary.byRole[row.roleName] += 1;

      if (row.isActive) {
        summary.active += 1;
      } else {
        summary.inactive += 1;
      }

      return summary;
    },
    {
      total: 0,
      active: 0,
      inactive: 0,
      byRole: {
        admin: 0,
        operations: 0,
        viewer: 0,
      },
    },
  );
}
