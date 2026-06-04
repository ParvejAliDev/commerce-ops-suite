import Link from 'next/link';

import { loginAction } from './actions';

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const errorMessages: Record<string, string> = {
  forbidden: 'Your account does not have access to the requested workspace.',
  invalid_credentials: 'The email or password is incorrect.',
  missing_credentials: 'Enter both email and password to continue.',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const errorKey =
    typeof resolvedSearchParams.error === 'string'
      ? resolvedSearchParams.error
      : undefined;

  return (
    <main style={{ padding: '3rem', maxWidth: '520px', margin: '0 auto' }}>
      <p style={{ textTransform: 'uppercase', letterSpacing: '0.18em' }}>
        Commerce Ops Suite
      </p>
      <h1 style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>Sign in</h1>
      <p style={{ lineHeight: 1.6 }}>
        Use the seeded local admin account after running{' '}
        <code>npm run seed</code>.
      </p>
      {errorKey ? (
        <p style={{ color: '#9b1c1c', marginTop: '1rem' }}>
          {errorMessages[errorKey] ?? 'Unable to sign you in.'}
        </p>
      ) : null}
      <form
        action={loginAction}
        style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}
      >
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            defaultValue="admin.local@example.com"
          />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            defaultValue="LocalAdminPass123!"
          />
        </label>
        <button type="submit" style={{ padding: '0.85rem 1rem' }}>
          Sign in
        </button>
      </form>
      <p style={{ marginTop: '1.5rem' }}>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
