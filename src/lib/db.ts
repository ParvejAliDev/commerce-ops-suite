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

export function getSql() {
  if (!globalForDb.__commerceOpsSql) {
    globalForDb.__commerceOpsSql = createSql();
  }

  return globalForDb.__commerceOpsSql;
}

export async function endSql() {
  if (globalForDb.__commerceOpsSql) {
    await globalForDb.__commerceOpsSql.end();
    globalForDb.__commerceOpsSql = undefined;
  }
}
