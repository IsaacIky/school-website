import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Protected route prefixes — unauthenticated users are redirected to /login */
const PROTECTED_PREFIXES = ['/admin', '/vc', '/bursar', '/registry', '/student'];

/** Public routes that should not redirect logged-in users */
const AUTH_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // We use a lightweight cookie "auth_hint" set by the client on login to
  // signal auth state server-side. The JWT itself stays in localStorage.
  const authHint = request.cookies.get('auth_hint')?.value;

  if (isProtected && !authHint) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ROUTES.includes(pathname) && authHint) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)',
  ],
};
