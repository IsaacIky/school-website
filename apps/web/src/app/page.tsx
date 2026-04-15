import Link from 'next/link';

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1.5rem',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>🎓 University Platform</h1>
      <p style={{ color: '#6b7280' }}>DB-configurable multi-campus university management system</p>
      <Link
        href="/admin"
        style={{
          padding: '0.75rem 2rem',
          background: '#2563eb',
          color: '#fff',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Go to Admin →
      </Link>
    </main>
  );
}
