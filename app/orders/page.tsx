import { requireOrdersAccess } from '../../src/modules/auth/current-user';

export default async function OrdersPage() {
  const user = await requireOrdersAccess();

  return (
    <main style={{ padding: '3rem', maxWidth: '960px', margin: '0 auto' }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em' }}>
        Orders Workspace
      </p>
      <h1 style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>
        Welcome, {user.fullName}
      </h1>
      <p style={{ lineHeight: 1.7 }}>
        Signed in as <strong>{user.email}</strong> with role{' '}
        <strong>{user.roleName}</strong>.
      </p>
      <p style={{ lineHeight: 1.7 }}>
        Active permissions: {user.permissions.join(', ')}
      </p>
    </main>
  );
}
