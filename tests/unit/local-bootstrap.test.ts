import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const composeFiles = [
  'docker-compose.yml',
  'docker-compose.runtime.yml',
] as const;

describe('local bootstrap compose flow', () => {
  for (const composeFile of composeFiles) {
    it(`${composeFile} runs migrations and seed data before app services`, () => {
      const compose = readProjectFile(composeFile);

      expect(compose).toContain('\n  migrate:\n');
      expect(compose).toContain('command: npm run db:migrate');
      expect(compose).toContain('\n  seed:\n');
      expect(compose).toContain('command: npm run seed');
      expect(compose).toMatch(
        /migrate:[\s\S]*depends_on:[\s\S]*postgres:\n\s+condition: service_healthy/,
      );
      expect(compose).toMatch(
        /seed:[\s\S]*depends_on:[\s\S]*migrate:\n\s+condition: service_completed_successfully/,
      );
      expect(compose).toMatch(
        /web:[\s\S]*depends_on:[\s\S]*seed:\n\s+condition: service_completed_successfully/,
      );
      expect(compose).toMatch(
        /worker:[\s\S]*depends_on:[\s\S]*seed:\n\s+condition: service_completed_successfully/,
      );
    });
  }
});

describe('postgres bootstrap sql', () => {
  it('does not own application schema or sample data', () => {
    const initSql = readProjectFile('docker/postgres/init.sql').toLowerCase();

    expect(initSql).not.toContain('create table');
    expect(initSql).not.toContain('insert into');
    expect(initSql).toContain('drizzle');
  });
});

describe('baseline migration', () => {
  it('is safe to apply against existing local tables', () => {
    const migration = readProjectFile('drizzle/0000_slimy_old_lace.sql');

    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "orders"');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "users"');
    expect(migration).toContain(
      'CREATE INDEX IF NOT EXISTS "sessions_user_id_idx"',
    );
    expect(migration).toContain('DO $$ BEGIN');
    expect(migration).toContain('information_schema.table_constraints');
  });
});
