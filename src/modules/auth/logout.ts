import { clearSessionCookie, getSessionCookieValue } from './cookies';
import { deleteSessionByToken } from './repository';

export async function endCurrentUserSession(): Promise<void> {
  const sessionToken = await getSessionCookieValue();

  if (sessionToken) {
    await deleteSessionByToken(sessionToken);
  }

  await clearSessionCookie();
}
