import { NextResponse } from 'next/server';

import { getSql } from '@/src/lib/db';
import { getEnv } from '@/src/lib/env';

export async function GET() {
  const env = getEnv(process.env);

  try {
    await getSql()`select 1`;

    return NextResponse.json({
      status: 'ready',
      service: 'commerce-ops-suite',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: 'ok',
        redisConfigured: Boolean(env.REDIS_URL),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'commerce-ops-suite',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: 'error',
          redisConfigured: Boolean(env.REDIS_URL),
        },
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 503 },
    );
  }
}
