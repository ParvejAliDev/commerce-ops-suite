import 'dotenv/config';

import { endSql, getSql } from '../src/lib/db';
import { getEnv } from '../src/lib/env';
import { hashPassword } from '../src/modules/auth/password';
import { upsertLocalAdminUser } from '../src/modules/auth/repository';

const seededUsers = [
  {
    email: 'ops.local@example.com',
    fullName: 'Ops Lead',
    roleName: 'operations',
  },
  {
    email: 'viewer.local@example.com',
    fullName: 'Read Only Analyst',
    roleName: 'viewer',
  },
] as const;

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

  for (const user of seededUsers) {
    await sql`
      insert into users (email, full_name, role_id, password_hash, is_active)
      select ${user.email}, ${user.fullName}, roles.id, ${passwordHash}, true
      from roles
      where roles.name = ${user.roleName}
      on conflict (email)
      do update set
        full_name = excluded.full_name,
        role_id = excluded.role_id,
        password_hash = excluded.password_hash,
        is_active = excluded.is_active
    `;
  }

  await sql`
    insert into reports (slug, name, description)
    values
      (
        'orders-daily-export',
        'Daily Orders Export',
        'Full operational order export for handoffs and spreadsheet reviews.'
      ),
      (
        'orders-exceptions-export',
        'Exceptions Export',
        'Focused export for pending review and cancelled work queues.'
      )
    on conflict (slug) do update set
      name = excluded.name,
      description = excluded.description
  `;

  console.log('Seeded local users and report definitions', {
    admin: env.LOCAL_ADMIN_EMAIL,
    additionalUsers: seededUsers.map((user) => user.email),
  });
  await endSql();
}

main().catch(async (error) => {
  console.error(error);
  await endSql();
  process.exit(1);
});
