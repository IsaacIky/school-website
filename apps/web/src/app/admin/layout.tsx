import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import LogoutButton from '../../components/LogoutButton';

const navLinks = [
  { href: '/admin', label: '🏠 Dashboard' },
  { href: '/admin/campuses', label: '🏫 Campuses' },
  { href: '/admin/faculties', label: '📚 Faculties' },
  { href: '/admin/departments', label: '🏢 Departments' },
  { href: '/admin/programs', label: '🎓 Programs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <nav
          style={{
            width: '220px',
            background: '#1e293b',
            color: '#f1f5f9',
            padding: '1.5rem 0',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid #334155' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa' }}>
              🎓 Admin Panel
            </span>
          </div>
          <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0, flex: 1 }}>
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    display: 'block',
                    padding: '0.65rem 1.25rem',
                    color: '#cbd5e1',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'background 0.15s',
                  }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div style={{ padding: '1rem 0', borderTop: '1px solid #334155' }}>
            <LogoutButton />
          </div>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>{children}</main>
      </div>
    </AdminGuard>
  );
}
