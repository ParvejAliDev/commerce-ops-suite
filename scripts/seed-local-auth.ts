import 'dotenv/config';

import { endSql, getSql } from '../src/lib/db';
import { getEnv } from '../src/lib/env';
import { hashPassword } from '../src/modules/auth/password';
import { upsertLocalAdminUser } from '../src/modules/auth/repository';
import { seededOrders, seededReports, seededUsers } from './local-seed-data';

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

  for (const report of seededReports) {
    await sql`
      insert into reports (slug, name, description)
      values (${report.slug}, ${report.name}, ${report.description})
      on conflict (slug) do update set
        name = excluded.name,
        description = excluded.description
    `;
  }

  for (const order of seededOrders) {
    await sql`
      insert into orders (external_id, status, assigned_team)
      values (${order.externalId}, ${order.status}, ${order.assignedTeam})
      on conflict (external_id) do nothing
    `;
  }

  console.log('Seeded local users, reports, and sample orders', {
    admin: env.LOCAL_ADMIN_EMAIL,
    additionalUsers: seededUsers.map((user) => user.email),
    orders: seededOrders.map((order) => order.externalId),
    reports: seededReports.map((report) => report.slug),
  });
  await endSql();
}

main().catch(async (error) => {
  console.error(error);
  await endSql();
  process.exit(1);
});
