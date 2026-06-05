import { getSql } from '../../lib/db';
import type { RoleName } from '../rbac';
import type { UserListItem } from './index';

type UserRow = UserListItem;

export async function listUsers(): Promise<UserListItem[]> {
  const sql = getSql();

  return sql<UserRow[]>`
    select
      users.id,
      users.email,
      users.full_name as "fullName",
      roles.name as "roleName",
      users.is_active as "isActive",
      to_char(users.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from users
    inner join roles on roles.id = users.role_id
    order by users.created_at asc, users.id asc
  `;
}

export async function updateUserRole(
  userId: number,
  roleName: RoleName,
): Promise<void> {
  const sql = getSql();

  await sql`
    update users
    set role_id = roles.id
    from roles
    where users.id = ${userId}
      and roles.name = ${roleName}
  `;
}

export async function toggleUserActiveState(
  userId: number,
  nextIsActive: boolean,
): Promise<void> {
  const sql = getSql();

  await sql`
    update users
    set is_active = ${nextIsActive}
    where id = ${userId}
  `;
}

export async function getUserById(
  userId: number,
): Promise<UserListItem | null> {
  const sql = getSql();
  const result = await sql<UserRow[]>`
    select
      users.id,
      users.email,
      users.full_name as "fullName",
      roles.name as "roleName",
      users.is_active as "isActive",
      to_char(users.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') as "createdAt"
    from users
    inner join roles on roles.id = users.role_id
    where users.id = ${userId}
    limit 1
  `;

  return result[0] ?? null;
}
