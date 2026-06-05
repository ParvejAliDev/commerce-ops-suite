import Link from 'next/link';

import { describeAuditEntry } from '../../src/modules/audit';
import { listRecentAuditEntries } from '../../src/modules/audit/repository';
import { canManageUsers } from '../../src/modules/auth/access';
import { requireUsersAccess } from '../../src/modules/auth/current-user';
import { summarizeUsersByRole } from '../../src/modules/users';
import { listUsers } from '../../src/modules/users/repository';
import { toggleUserActiveAction, updateUserRoleAction } from './actions';

const roleNames = ['admin', 'operations', 'viewer'] as const;

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default async function UsersPage() {
  const user = await requireUsersAccess();
  const [rows, auditEntries] = await Promise.all([
    listUsers(),
    listRecentAuditEntries(12),
  ]);
  const summary = summarizeUsersByRole(rows);
  const mayManage = canManageUsers(user);
  const userAuditEntries = auditEntries.filter(
    (entry) => entry.targetType === 'user',
  );

  return (
    <main style={{ padding: '3rem', maxWidth: '1080px', margin: '0 auto' }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em' }}>
        Users Workspace
      </p>
      <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>
        Access and operator roster
      </h1>
      <p style={{ lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Manage internal access without leaving the local dashboard.
      </p>
      <p style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/orders">Orders workspace</Link>
        <Link href="/reports">Reports workspace</Link>
      </p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginTop: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          ['Total users', summary.total],
          ['Active users', summary.active],
          ['Inactive users', summary.inactive],
          ['Admins', summary.byRole.admin],
          ['Operations', summary.byRole.operations],
          ['Viewers', summary.byRole.viewer],
        ].map(([label, value]) => (
          <article
            key={label}
            style={{
              border: '1px solid #ddd5c7',
              borderRadius: '16px',
              padding: '1rem',
              background: '#fffaf2',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </p>
            <p
              style={{
                margin: '0.45rem 0 0',
                fontSize: '1.8rem',
                fontWeight: 700,
              }}
            >
              {value}
            </p>
          </article>
        ))}
      </section>

      <section style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{ textAlign: 'left', borderBottom: '1px solid #ddd5c7' }}
            >
              <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #eee7db' }}>
                <td style={{ padding: '0.9rem 0.5rem' }}>{row.fullName}</td>
                <td style={{ padding: '0.9rem 0.5rem' }}>{row.email}</td>
                <td style={{ padding: '0.9rem 0.5rem' }}>
                  {mayManage ? (
                    <form
                      action={updateUserRoleAction}
                      style={{ display: 'flex', gap: '0.5rem' }}
                    >
                      <input type="hidden" name="userId" value={row.id} />
                      <select name="roleName" defaultValue={row.roleName}>
                        {roleNames.map((roleName) => (
                          <option key={roleName} value={roleName}>
                            {roleName}
                          </option>
                        ))}
                      </select>
                      <button type="submit">Save</button>
                    </form>
                  ) : (
                    row.roleName
                  )}
                </td>
                <td style={{ padding: '0.9rem 0.5rem' }}>
                  {mayManage ? (
                    <form
                      action={toggleUserActiveAction}
                      style={{ display: 'flex', gap: '0.5rem' }}
                    >
                      <input type="hidden" name="userId" value={row.id} />
                      <input
                        type="hidden"
                        name="nextIsActive"
                        value={row.isActive ? 'false' : 'true'}
                      />
                      <button type="submit">
                        {row.isActive ? 'Disable' : 'Reactivate'}
                      </button>
                    </form>
                  ) : row.isActive ? (
                    'Active'
                  ) : (
                    'Inactive'
                  )}
                </td>
                <td style={{ padding: '0.9rem 0.5rem' }}>
                  {formatTimestamp(row.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Recent Access Audit</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {userAuditEntries.length === 0 ? (
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              No user-management audit activity recorded yet.
            </p>
          ) : (
            userAuditEntries.map((entry) => (
              <article
                key={`${entry.id}-${entry.createdAt}`}
                style={{
                  borderTop: '1px solid #eee7db',
                  paddingTop: '0.75rem',
                }}
              >
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  {describeAuditEntry(entry)}
                </p>
                <p style={{ margin: '0.35rem 0 0', color: '#5c5448' }}>
                  {formatTimestamp(entry.createdAt)}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
