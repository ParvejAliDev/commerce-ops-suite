import { getSql } from '../../lib/db';
import { serializeTimestamp, type TimestampInput } from '../../lib/timestamps';
import type { RoleName } from '../rbac';
import type { UserListItem } from './index';

type UserRow = Omit<UserListItem, 'createdAt'> & {
  createdAt: TimestampInput;
};

function mapUserRow(row: UserRow): UserListItem {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
  };
}

export async function listUsers(): Promise<UserListItem[]> {
  const sql = getSql();

  const rows = await sql<UserRow[]>`
    select
      users.id,
      users.email,
      users.full_name as "fullName",
      roles.name as "roleName",
      users.is_active as "isActive",
      users.created_at as "createdAt"
    from users
    inner join roles on roles.id = users.role_id
    order by users.created_at asc, users.id asc
  `;

  return rows.map(mapUserRow);
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
      users.created_at as "createdAt"
    from users
    inner join roles on roles.id = users.role_id
    where users.id = ${userId}
    limit 1
  `;

  const row = result[0];
  return row ? mapUserRow(row) : null;
}
