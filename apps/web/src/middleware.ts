import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Protected route prefixes — unauthenticated users are redirected to /login */
const PROTECTED_PREFIXES = ['/admin', '/vc', '/bursar', '/registry', '/student'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  /**
   * `auth_hint` is a lightweight client-set cookie used only as a UX redirect hint.
   * It is NOT a security control — it is not the JWT and can be trivially spoofed.
   * Its sole purpose is to give the Edge middleware a signal to redirect
   * unauthenticated users to /login rather than serving a blank shell page.
   *
   * Real authentication is enforced client-side by AuthProvider (calls /auth/me)
   * and server-side by JwtAuthGuard on every API request. Portal pages always
   * re-check auth via AuthProvider and will show a blocked/loading state if
   * /auth/me fails, regardless of this cookie.
   */
  const authHint = request.cookies.get('auth_hint')?.value;

  if (isProtected && !authHint) {
    // Redirect unauthenticated users to /login with a ?redirect param so they
    // are returned to their intended page after signing in.
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Do NOT redirect logged-in users away from /login based solely on auth_hint.
  // The login page handles that correctly once /auth/me resolves.

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
