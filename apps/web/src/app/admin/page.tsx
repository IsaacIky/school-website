import Link from 'next/link';

const cards = [
  { href: '/admin/campuses', title: 'Campuses', icon: '🏫', desc: 'Manage university campuses' },
  { href: '/admin/faculties', title: 'Faculties', icon: '📚', desc: 'Manage faculties' },
  { href: '/admin/departments', title: 'Departments', icon: '🏢', desc: 'Manage departments' },
  { href: '/admin/programs', title: 'Programs', icon: '🎓', desc: 'Manage academic programs' },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Admin Dashboard
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Manage your university structure from here.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {cards.map(({ href, title, icon, desc }) => (
          <Link
            key={href}
            href={href}
            style={{
              background: '#fff',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'box-shadow 0.2s',
            }}
          >
            <div style={{ fontSize: '2rem' }}>{icon}</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.5rem 0 0.25rem' }}>
              {title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
