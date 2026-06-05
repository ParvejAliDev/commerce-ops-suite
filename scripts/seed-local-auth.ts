import 'dotenv/config';

import { endSql, getSql } from '../src/lib/db';
import { getEnv } from '../src/lib/env';
import { hashPassword } from '../src/modules/auth/password';
import { upsertLocalAdminUser } from '../src/modules/auth/repository';

async function main() {
  const env = getEnv(process.env);
  const sql = getSql();
  const passwordHash = await hashPassword(env.LOCAL_ADMIN_PASSWORD);

  await sql`
    insert into roles (name)
    values ('admin'), ('operations'), ('viewer')
    on conflict (name) do nothing
  `;

  await upsertLocalAdminUser({
    email: env.LOCAL_ADMIN_EMAIL,
    fullName: 'Local Admin',
    passwordHash,
  });

  console.log('Seeded local admin user', env.LOCAL_ADMIN_EMAIL);
  await endSql();
}

main().catch(async (error) => {
  console.error(error);
  await endSql();
  process.exit(1);
});
