import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../db/schema';
import { getEnv } from './env';

type SqlClient = ReturnType<typeof postgres>;
type CommerceOpsDatabase = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __commerceOpsDb?: CommerceOpsDatabase;
  __commerceOpsSql?: SqlClient;
};

function createSql() {
  return postgres(getEnv(process.env).DATABASE_URL, {
    idle_timeout: 20,
    max: 5,
  });
}

function ensureDatabase() {
  if (!globalForDb.__commerceOpsSql || !globalForDb.__commerceOpsDb) {
    const sql = createSql();

    globalForDb.__commerceOpsSql = sql;
    globalForDb.__commerceOpsDb = drizzle(sql, { schema });
  }

  return {
    db: globalForDb.__commerceOpsDb,
    sql: globalForDb.__commerceOpsSql,
  };
}

export function getDb() {
  return ensureDatabase().db;
}

export function getSql() {
  return ensureDatabase().sql;
}

export async function endSql() {
  if (globalForDb.__commerceOpsSql) {
    await globalForDb.__commerceOpsSql.end();
    globalForDb.__commerceOpsSql = undefined;
    globalForDb.__commerceOpsDb = undefined;
  }
}
