const sections = [
  'Role-based operations workspace',
  'Order workflow and audit visibility',
  'Redis-backed caching and rate limiting',
  'Worker-based reporting and exports',
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
        This starter repository is shaped for a production-style internal
        operations system: server-first rendering, background workers,
        deterministic local infrastructure, and a clean path to ECS, RDS, and
        ElastiCache later.
      </p>
      <ul style={{ marginTop: '2rem', paddingLeft: '1.2rem', lineHeight: 1.9 }}>
        {sections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
    </main>
  );
}
