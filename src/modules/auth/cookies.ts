import { cookies } from 'next/headers';

import { getEnv } from '../../lib/env';

function getCookieName() {
  return getEnv(process.env).SESSION_COOKIE_NAME;
}

export async function getSessionCookieValue(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(getCookieName())?.value ?? null;
}

export async function setSessionCookie(
  value: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(getCookieName(), value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(getCookieName());
}
