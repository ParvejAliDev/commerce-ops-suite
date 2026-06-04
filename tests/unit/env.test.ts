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
      }),
    ).toThrow(/DATABASE_URL/i);
  });

  it('returns parsed values for a complete environment', () => {
    const env = parseEnv({
      NODE_ENV: 'development',
      PORT: '3000',
      DATABASE_URL: 'postgresql://ops_app:ops_app@localhost:5432/ops_dashboard',
      REDIS_URL: 'redis://localhost:6379',
      SESSION_SECRET: 'very-secret-local-key',
      APP_BASE_URL: 'http://localhost:3000',
    });

    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_URL).toContain('ops_dashboard');
  });
});
