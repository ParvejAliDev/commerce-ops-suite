import { hasPermission, type Permission, type RoleName } from '../rbac';

function hasRolePermission(
  user: { roleName: RoleName | '' },
  permission: Permission,
): boolean {
  if (!user.roleName) {
    return false;
  }

  return hasPermission(user.roleName, permission);
}

export function canAccessOrders(user: { roleName: RoleName | '' }): boolean {
  return hasRolePermission(user, 'orders:read');
}

export function canUpdateOrders(user: { roleName: RoleName | '' }): boolean {
  return hasRolePermission(user, 'orders:update');
}

export function canAccessUsers(user: { roleName: RoleName | '' }): boolean {
  return hasRolePermission(user, 'users:read');
}

export function canManageUsers(user: { roleName: RoleName | '' }): boolean {
  return hasRolePermission(user, 'users:update');
}

export function canAccessReports(user: { roleName: RoleName | '' }): boolean {
  return hasRolePermission(user, 'reports:read');
}
