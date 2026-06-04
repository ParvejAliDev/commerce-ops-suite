import { hasPermission, type RoleName } from '../rbac';

export function canAccessOrders(user: { roleName: RoleName | '' }): boolean {
  if (!user.roleName) {
    return false;
  }

  return hasPermission(user.roleName, 'orders:read');
}
