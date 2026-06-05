'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { recordAuditEntry } from '../../src/modules/audit/repository';
import { canManageUsers } from '../../src/modules/auth/access';
import { requireUsersAccess } from '../../src/modules/auth/current-user';
import { rolePermissions, type RoleName } from '../../src/modules/rbac';
import {
  getUserById,
  toggleUserActiveState,
  updateUserRole,
} from '../../src/modules/users/repository';

const roleNames = Object.keys(rolePermissions) as RoleName[];

function parseRoleName(value: string): RoleName | null {
  return roleNames.includes(value as RoleName) ? (value as RoleName) : null;
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const user = await requireUsersAccess();
  if (!canManageUsers(user)) {
    redirect('/login?error=forbidden');
  }

  const userId = Number(formData.get('userId'));
  const nextRole = parseRoleName(String(formData.get('roleName') ?? ''));

  if (!Number.isInteger(userId) || !nextRole) {
    redirect('/users');
  }

  const targetUser = await getUserById(userId);
  if (!targetUser) {
    redirect('/users');
  }

  if (targetUser.roleName !== nextRole) {
    await updateUserRole(userId, nextRole);
    await recordAuditEntry({
      actorEmail: user.email,
      action: 'user.role_updated',
      targetType: 'user',
      targetId: targetUser.email,
      details: `${targetUser.roleName} -> ${nextRole}`,
    });
  }

  revalidatePath('/users');
  redirect('/users');
}

export async function toggleUserActiveAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUsersAccess();
  if (!canManageUsers(user)) {
    redirect('/login?error=forbidden');
  }

  const userId = Number(formData.get('userId'));
  const nextIsActive = String(formData.get('nextIsActive') ?? '') === 'true';

  if (!Number.isInteger(userId)) {
    redirect('/users');
  }

  const targetUser = await getUserById(userId);
  if (!targetUser) {
    redirect('/users');
  }

  if (targetUser.id === user.id && !nextIsActive) {
    redirect('/users');
  }

  if (targetUser.isActive !== nextIsActive) {
    await toggleUserActiveState(userId, nextIsActive);
    await recordAuditEntry({
      actorEmail: user.email,
      action: 'user.active_toggled',
      targetType: 'user',
      targetId: targetUser.email,
      details: nextIsActive ? 'reactivated account' : 'disabled account',
    });
  }

  revalidatePath('/users');
  redirect('/users');
}
