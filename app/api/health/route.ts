import { NextResponse } from 'next/server';

import { getEnv } from '@/src/lib/env';

export async function GET() {
  const env = getEnv(process.env);

  return NextResponse.json({
    status: 'ok',
    service: 'commerce-ops-suite',
    timestamp: new Date().toISOString(),
    hasRedis: Boolean(env.REDIS_URL),
  });
}
