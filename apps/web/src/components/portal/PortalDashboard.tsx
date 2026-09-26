'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPortalByKey } from '@/config/portals';

interface PortalDashboardProps {
  portalKey: string;
}

export function PortalDashboard({ portalKey }: PortalDashboardProps) {
  const { user, isLoading } = useAuth();
  const portal = getPortalByKey(portalKey);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{portal?.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-[#0B1020]">{portal?.displayName}</h1>
            {user && (
              <p className="text-gray-500 text-sm">
                Welcome back, {user.firstName} {user.lastName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sub-page quick links */}
      {portal?.subPages && portal.subPages.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Sections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portal.subPages.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-[#4B2E83]/20 transition-all group"
              >
                <div className="font-semibold text-[#0B1020] group-hover:text-[#4B2E83] transition-colors mb-1">
                  {page.label}
                </div>
                <div className="text-xs text-gray-400 group-hover:text-[#4B2E83]/60 transition-colors">
                  {page.path}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">{portal?.icon}</div>
          <h2 className="text-lg font-semibold text-[#0B1020] mb-2">
            {portal?.displayName} Dashboard
          </h2>
          <p className="text-gray-500 text-sm">
            Your portal content will appear here. Use the sidebar to navigate.
          </p>
        </div>
      )}
    </div>
  );
}
