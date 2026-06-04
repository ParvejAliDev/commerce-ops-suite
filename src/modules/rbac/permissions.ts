export const rolePermissions = {
  admin: [
    'orders:read',
    'orders:update',
    'users:read',
    'users:update',
    'reports:read',
  ],
  operations: ['orders:read', 'orders:update', 'reports:read'],
  viewer: ['orders:read', 'reports:read'],
} as const;

export type RoleName = keyof typeof rolePermissions;
export type Permission = (typeof rolePermissions)[RoleName][number];

export function getRolePermissions(role: RoleName): Permission[] {
  return [...rolePermissions[role]];
}

export function hasPermission(role: RoleName, permission: Permission): boolean {
  return (rolePermissions[role] as readonly Permission[]).includes(permission);
}
