import { and, eq, gt, sql } from 'drizzle-orm';

import { roles, sessions, users } from '../../db/schema';
import { getDb } from '../../lib/db';
import type { RoleName } from '../rbac';
import { hashSessionToken } from './session';

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  roleName: RoleName;
  isActive: boolean;
  passwordHash: string | null;
};

const authUserSelection = {
  email: users.email,
  fullName: users.fullName,
  id: users.id,
  isActive: users.isActive,
  passwordHash: users.passwordHash,
  roleName: roles.name,
} as const;

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

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const db = getDb();
  const rows = await db
    .select(authUserSelection)
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1);

  return rows[0] ?? null;
}

export async function upsertLocalAdminUser(input: {
  email: string;
  fullName: string;
  passwordHash: string;
}): Promise<void> {
  const db = getDb();
  const adminRoleId = await getRoleId('admin');

  await db
    .insert(users)
    .values({
      email: input.email,
      fullName: input.fullName,
      isActive: true,
      passwordHash: input.passwordHash,
      roleId: adminRoleId,
    })
    .onConflictDoUpdate({
      set: {
        fullName: input.fullName,
        isActive: true,
        passwordHash: input.passwordHash,
        roleId: adminRoleId,
      },
      target: users.email,
    });
}

export async function createUserSession(input: {
  userId: number;
  sessionToken: string;
  expiresAt: Date;
}): Promise<void> {
  const db = getDb();

  await db.insert(sessions).values({
    expiresAt: input.expiresAt,
    sessionTokenHash: hashSessionToken(input.sessionToken),
    userId: input.userId,
  });
}

export async function getUserBySessionToken(
  sessionToken: string,
): Promise<AuthUser | null> {
  const db = getDb();
  const rows = await db
    .select(authUserSelection)
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(
      and(
        eq(sessions.sessionTokenHash, hashSessionToken(sessionToken)),
        gt(sessions.expiresAt, sql`now()`),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function deleteSessionByToken(
  sessionToken: string,
): Promise<void> {
  const db = getDb();

  await db
    .delete(sessions)
    .where(eq(sessions.sessionTokenHash, hashSessionToken(sessionToken)));
}
