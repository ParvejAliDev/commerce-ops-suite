import { sql } from '../../lib/db';
import type { RoleName } from '../rbac';
import { hashSessionToken } from './session';

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  roleName: RoleName;
  passwordHash: string | null;
};

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const result = await sql<AuthUser[]>`
    select
      users.id,
      users.email,
      users.full_name as "fullName",
      roles.name as "roleName",
      users.password_hash as "passwordHash"
    from users
    inner join roles on roles.id = users.role_id
    where lower(users.email) = lower(${email})
    limit 1
  `;

  return result[0] ?? null;
}

export async function upsertLocalAdminUser(input: {
  email: string;
  fullName: string;
  passwordHash: string;
}): Promise<void> {
  await sql`
    insert into users (email, full_name, role_id, password_hash)
    select ${input.email}, ${input.fullName}, roles.id, ${input.passwordHash}
    from roles
    where roles.name = 'admin'
    on conflict (email)
    do update set
      full_name = excluded.full_name,
      role_id = excluded.role_id,
      password_hash = excluded.password_hash
  `;
}

export async function createUserSession(input: {
  userId: number;
  sessionToken: string;
  expiresAt: Date;
}): Promise<void> {
  await sql`
    insert into sessions (user_id, session_token_hash, expires_at)
    values (
      ${input.userId},
      ${hashSessionToken(input.sessionToken)},
      ${input.expiresAt.toISOString()}
    )
  `;
}

export async function getUserBySessionToken(
  sessionToken: string,
): Promise<AuthUser | null> {
  const result = await sql<AuthUser[]>`
    select
      users.id,
      users.email,
      users.full_name as "fullName",
      roles.name as "roleName",
      users.password_hash as "passwordHash"
    from sessions
    inner join users on users.id = sessions.user_id
    inner join roles on roles.id = users.role_id
    where sessions.session_token_hash = ${hashSessionToken(sessionToken)}
      and sessions.expires_at > now()
    limit 1
  `;

  return result[0] ?? null;
}

export async function deleteSessionByToken(
  sessionToken: string,
): Promise<void> {
  await sql`
    delete from sessions
    where session_token_hash = ${hashSessionToken(sessionToken)}
  `;
}
