'use client';

import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

/**
 * Logout button – clears the stored access token and redirects to /login.
 */
export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    api.logout();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        display: 'block',
        width: 'calc(100% - 2.5rem)',
        margin: '0 1.25rem',
        padding: '0.6rem',
        background: 'transparent',
        color: '#94a3b8',
        border: '1px solid #334155',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        cursor: 'pointer',
        textAlign: 'center',
      }}
    >
      🚪 Logout
    </button>
  );
}
