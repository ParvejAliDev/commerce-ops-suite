import { describe, expect, it } from 'vitest';

import { parseEnv } from '../../src/lib/env';

describe('parseEnv', () => {
  it('requires the dashboard database URL', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'development',
        PORT: '3000',
        REDIS_URL: 'redis://localhost:6379',
        SESSION_SECRET: 'very-secret-local-key',
        APP_BASE_URL: 'http://localhost:3000',
        SESSION_COOKIE_NAME: 'commerce_ops_session',
        LOCAL_ADMIN_EMAIL: 'admin.local@example.com',
        LOCAL_ADMIN_PASSWORD: 'LocalAdminPass123!',
      }),
    ).toThrow(/DATABASE_URL/i);
  });

  it('requires the session cookie name and local admin password', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'development',
        PORT: '3000',
        DATABASE_URL:
          'postgresql://ops_app:ops_app@localhost:5432/ops_dashboard',
        REDIS_URL: 'redis://localhost:6379',
        SESSION_SECRET: 'very-secret-local-key',
        APP_BASE_URL: 'http://localhost:3000',
      }),
    ).toThrow(/SESSION_COOKIE_NAME|LOCAL_ADMIN_PASSWORD/i);
  });

  it('returns parsed values for a complete environment', () => {
    const env = parseEnv({
      NODE_ENV: 'development',
      PORT: '3000',
      DATABASE_URL: 'postgresql://ops_app:ops_app@localhost:5432/ops_dashboard',
      REDIS_URL: 'redis://localhost:6379',
      SESSION_SECRET: 'very-secret-local-key',
      APP_BASE_URL: 'http://localhost:3000',
      SESSION_COOKIE_NAME: 'commerce_ops_session',
      LOCAL_ADMIN_EMAIL: 'admin.local@example.com',
      LOCAL_ADMIN_PASSWORD: 'LocalAdminPass123!',
    });

    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_URL).toContain('ops_dashboard');
    expect(env.SESSION_COOKIE_NAME).toBe('commerce_ops_session');
  });
});
