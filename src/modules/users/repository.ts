import { asc, eq } from 'drizzle-orm';

import { roles, users } from '../../db/schema';
import { getDb } from '../../lib/db';
import { serializeTimestamp, type TimestampInput } from '../../lib/timestamps';
import type { RoleName } from '../rbac';
import type { UserListItem } from './index';

type UserRow = Omit<UserListItem, 'createdAt'> & {
  createdAt: TimestampInput;
};

const userSelection = {
  createdAt: users.createdAt,
  email: users.email,
  fullName: users.fullName,
  id: users.id,
  isActive: users.isActive,
  roleName: roles.name,
} as const;

function mapUserRow(row: UserRow): UserListItem {
  return {
    ...row,
    createdAt: serializeTimestamp(row.createdAt),
  };
}

async function getRoleId(roleName: RoleName): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);
  const row = rows[0];

  if (!row) {
    throw new Error(`Missing role: ${roleName}`);
  }

  return row.id;
}

export async function listUsers(): Promise<UserListItem[]> {
  const db = getDb();
  const rows = await db
    .select(userSelection)
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .orderBy(asc(users.createdAt), asc(users.id));

  return rows.map(mapUserRow);
}

export async function updateUserRole(
  userId: number,
  roleName: RoleName,
): Promise<void> {
  const db = getDb();
  const roleId = await getRoleId(roleName);

  await db.update(users).set({ roleId }).where(eq(users.id, userId));
}

export async function toggleUserActiveState(
  userId: number,
  nextIsActive: boolean,
): Promise<void> {
  const db = getDb();

  await db
    .update(users)
    .set({ isActive: nextIsActive })
    .where(eq(users.id, userId));
}

export async function getUserById(
  userId: number,
): Promise<UserListItem | null> {
  const db = getDb();
  const rows = await db
    .select(userSelection)
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(eq(users.id, userId))
    .limit(1);

  const row = rows[0];
  return row ? mapUserRow(row) : null;
}
