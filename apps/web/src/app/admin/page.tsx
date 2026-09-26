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
      <h1 className="text-3xl font-bold text-[#0B1020] mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Manage your university structure from here.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(({ href, title, icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md hover:border-[#4B2E83]/20 transition-all group no-underline"
          >
            <div className="text-3xl mb-3">{icon}</div>
            <h2 className="text-base font-semibold text-[#0B1020] group-hover:text-[#4B2E83] mb-1 transition-colors">
              {title}
            </h2>
            <p className="text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
