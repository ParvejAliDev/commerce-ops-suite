import { beforeEach, describe, expect, it, vi } from 'vitest';

const authCookies = vi.hoisted(() => ({
  clearSessionCookie: vi.fn(),
  getSessionCookieValue: vi.fn(),
}));

const authRepository = vi.hoisted(() => ({
  deleteSessionByToken: vi.fn(),
}));

vi.mock('../../src/modules/auth/cookies', () => authCookies);
vi.mock('../../src/modules/auth/repository', () => authRepository);

import { endCurrentUserSession } from '../../src/modules/auth/logout';

describe('endCurrentUserSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the current session token and clears the cookie', async () => {
    authCookies.getSessionCookieValue.mockResolvedValue('session-token');

    await endCurrentUserSession();

    expect(authRepository.deleteSessionByToken).toHaveBeenCalledWith(
      'session-token',
    );
    expect(authCookies.clearSessionCookie).toHaveBeenCalledTimes(1);
  });

  it('still clears the cookie when no session token is present', async () => {
    authCookies.getSessionCookieValue.mockResolvedValue(null);

    await endCurrentUserSession();

    expect(authRepository.deleteSessionByToken).not.toHaveBeenCalled();
    expect(authCookies.clearSessionCookie).toHaveBeenCalledTimes(1);
  });
});
