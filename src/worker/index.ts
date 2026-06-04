import { getEnv } from '../lib/env';

const env = getEnv(process.env);

console.log('[worker] starting ops worker', {
  databaseUrl: env.DATABASE_URL.replace(/:[^:@/]+@/, ':***@'),
  redisUrl: env.REDIS_URL,
});

const interval = setInterval(() => {
  console.log('[worker] heartbeat', new Date().toISOString());
}, 30000);

process.on('SIGTERM', () => {
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGINT', () => {
  clearInterval(interval);
  process.exit(0);
});
