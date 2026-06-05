import Link from 'next/link';

const sections = [
  'Role-based operations workspace',
  'Order detail workflows with audit visibility',
  'Worker-based reporting and exports',
  'Local health, readiness, and metrics endpoints',
];

export default function HomePage() {
  return (
    <main style={{ padding: '3rem', maxWidth: '960px', margin: '0 auto' }}>
      <p
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          fontSize: '0.75rem',
        }}
      >
        Commerce Ops Suite
      </p>
      <h1
        style={{ fontSize: '3.2rem', lineHeight: 1.05, marginBottom: '1rem' }}
      >
        Local-first operations control plane scaffold.
      </h1>
      <p style={{ maxWidth: '62ch', fontSize: '1.1rem', lineHeight: 1.7 }}>
        This repository now demonstrates a full local internal-ops baseline:
        seeded users, protected order workflows, user access controls, report
        queueing, and an operations worker that stays entirely inside Docker
        Compose.
      </p>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/login">Open login</Link>
        <Link href="/orders">Orders workspace</Link>
        <Link href="/reports">Reports workspace</Link>
        <Link href="/users">Users workspace</Link>
      </div>
      <ul style={{ marginTop: '2rem', paddingLeft: '1.2rem', lineHeight: 1.9 }}>
        {sections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
      <p style={{ marginTop: '2rem', color: '#5c5448', lineHeight: 1.7 }}>
        Local endpoints: <code>/api/health</code>, <code>/api/ready</code>, and{' '}
        <code>/api/metrics</code>.
      </p>
    </main>
  );
}
