import { redirect } from 'next/navigation';

import { getRolePermissions, type Permission, type RoleName } from '../rbac';
import { canAccessOrders, canAccessReports, canAccessUsers } from './access';
import { getSessionCookieValue, setSessionCookie } from './cookies';
import {
  createUserSession,
  findUserByEmail,
  getUserBySessionToken,
  type AuthUser,
} from './repository';
import { verifyPassword } from './password';
import { createSessionExpiry, createSessionToken } from './session';

export type CurrentUser = {
  id: number;
  email: string;
  fullName: string;
  roleName: RoleName;
  permissions: Permission[];
};

function toCurrentUser(user: AuthUser): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleName: user.roleName,
    permissions: getRolePermissions(user.roleName),
  };
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<CurrentUser | null> {
  const user = await findUserByEmail(email);

  if (!user?.passwordHash || !user.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return toCurrentUser(user);
}

export async function startUserSession(user: CurrentUser): Promise<void> {
  const sessionToken = createSessionToken();
  const expiresAt = createSessionExpiry();

  await createUserSession({
    userId: user.id,
    sessionToken,
    expiresAt,
  });
  await setSessionCookie(sessionToken, expiresAt);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const sessionToken = await getSessionCookieValue();
  if (!sessionToken) {
    return null;
  }

  const user = await getUserBySessionToken(sessionToken);
  return user?.isActive ? toCurrentUser(user) : null;
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireOrdersAccess(): Promise<CurrentUser> {
  const user = await requireCurrentUser();
  if (!canAccessOrders(user)) {
    redirect('/login?error=forbidden');
  }

  return user;
}

export async function requireUsersAccess(): Promise<CurrentUser> {
  const user = await requireCurrentUser();
  if (!canAccessUsers(user)) {
    redirect('/login?error=forbidden');
  }

  return user;
}

export async function requireReportsAccess(): Promise<CurrentUser> {
  const user = await requireCurrentUser();
  if (!canAccessReports(user)) {
    redirect('/login?error=forbidden');
  }

  return user;
}
