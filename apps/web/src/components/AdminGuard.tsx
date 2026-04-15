'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-side admin route guard.
 * Redirects to /login if no access_token is present in localStorage.
 * Renders children only after confirming auth state (avoids flash).
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: '#94a3b8',
          fontSize: '0.9rem',
        }}
      >
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
