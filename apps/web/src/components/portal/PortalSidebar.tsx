'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPortalByKey, portals } from '@/config/portals';
import { siteConfig } from '@/config/site';

interface PortalSidebarProps {
  portalKey: string;
}

export function PortalSidebar({ portalKey }: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, accessiblePortalKeys } = useAuth();
  const portal = getPortalByKey(portalKey);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const accessiblePortals = portals.filter((p) => accessiblePortalKeys.includes(p.key));

  return (
    <aside className="w-64 bg-[#4B2E83] text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-purple-700/50">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-lg">{siteConfig.shortName}</span>
        </Link>
      </div>

      {/* Portal label */}
      <div className="px-6 py-4 border-b border-purple-700/50">
        <p className="text-purple-300 text-xs uppercase tracking-widest font-medium mb-1">
          Portal
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xl">{portal?.icon}</span>
          <span className="font-semibold text-sm">{portal?.displayName}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Portal root link */}
        <Link
          href={portal?.basePath ?? '/'}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
            pathname === portal?.basePath
              ? 'bg-white/20 text-white'
              : 'text-purple-200 hover:bg-white/10 hover:text-white'
          }`}
        >
          <span>{portal?.icon}</span>
          <span>Dashboard</span>
        </Link>

        {/* Sub-pages */}
        {portal?.subPages && portal.subPages.length > 0 && (
          <div className="mt-4">
            <p className="text-purple-400 text-xs uppercase tracking-widest font-medium px-3 mb-2">
              Sections
            </p>
            {portal.subPages.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                  pathname === page.path
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-purple-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-purple-400">›</span>
                <span>{page.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Portal switcher */}
        {accessiblePortals.length > 1 && (
          <div className="mt-6">
            <p className="text-purple-400 text-xs uppercase tracking-widest font-medium px-3 mb-2">
              Switch Portal
            </p>
            {accessiblePortals
              .filter((p) => p.key !== portalKey)
              .map((p) => (
                <Link
                  key={p.key}
                  href={p.basePath}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 text-purple-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <span>{p.icon}</span>
                  <span>{p.shortLabel}</span>
                </Link>
              ))}
          </div>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-purple-700/50">
        {user && (
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-8 h-8 rounded-full bg-[#F2C200] text-[#4B2E83] flex items-center justify-center font-bold text-sm shrink-0">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-purple-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-purple-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
