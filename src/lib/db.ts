import postgres from 'postgres';

import { getEnv } from './env';

const globalForDb = globalThis as typeof globalThis & {
  __commerceOpsSql?: ReturnType<typeof postgres>;
};

function createSql() {
  return postgres(getEnv(process.env).DATABASE_URL, {
    max: 5,
    idle_timeout: 20,
  });
}

export const sql = globalForDb.__commerceOpsSql ?? createSql();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__commerceOpsSql = sql;
}
