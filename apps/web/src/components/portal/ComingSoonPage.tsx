'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { portals } from '@/config/portals';

/**
 * Generic "Coming Soon" page rendered inside any portal sub-route.
 * It automatically derives the section label from the current pathname.
 */
export function ComingSoonPage() {
  const pathname = usePathname();

  // Find the matching portal and sub-page label
  let portalLabel = 'Portal';
  let pageLabel = 'This Section';
  let portalPath = '/';

  for (const portal of portals) {
    if (pathname.startsWith(portal.basePath)) {
      portalLabel = portal.displayName;
      portalPath = portal.basePath;
      const sub = portal.subPages?.find((s) => s.path === pathname);
      if (sub) pageLabel = sub.label;
      break;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-6">🚧</div>
      <h1 className="text-2xl font-bold text-[#0B1020] mb-2">{pageLabel}</h1>
      <p className="text-gray-500 mb-2">
        <span className="font-medium text-[#4B2E83]">{portalLabel}</span>
      </p>
      <p className="text-gray-400 text-sm max-w-md mb-8">
        This section is currently under development. Check back soon — content and features will
        appear here once the module is ready.
      </p>
      <Link
        href={portalPath}
        className="bg-[#4B2E83] hover:bg-[#3a2268] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
      >
        ← Back to {portalLabel}
      </Link>
    </div>
  );
}
